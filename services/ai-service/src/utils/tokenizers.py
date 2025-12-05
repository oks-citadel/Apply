"""
Token counting and text chunking utilities.
"""

from typing import List, Tuple
import re


def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """
    Estimate token count for a given text.

    This is a simplified estimation. For production, use tiktoken library.

    Args:
        text: Text to count tokens for
        model: Model name for token counting

    Returns:
        Estimated token count
    """
    # Rough estimation: ~4 characters per token for English text
    # This is a simplified approximation
    words = text.split()

    # Account for special tokens and formatting
    base_tokens = len(words)

    # Add tokens for punctuation and special characters
    special_chars = len(re.findall(r'[^\w\s]', text))

    # Estimate: words + special chars / 4
    estimated_tokens = base_tokens + (special_chars // 4)

    return estimated_tokens


def chunk_text(
    text: str,
    max_tokens: int = 2000,
    overlap: int = 200,
    model: str = "gpt-3.5-turbo"
) -> List[str]:
    """
    Chunk text into smaller pieces that fit within token limits.

    Args:
        text: Text to chunk
        max_tokens: Maximum tokens per chunk
        overlap: Number of tokens to overlap between chunks
        model: Model name for token counting

    Returns:
        List of text chunks
    """
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)

    chunks: List[str] = []
    current_chunk: List[str] = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = count_tokens(sentence, model)

        # If single sentence exceeds max_tokens, split it further
        if sentence_tokens > max_tokens:
            # Split by words
            words = sentence.split()
            for i in range(0, len(words), max_tokens // 4):
                chunk_words = words[i:i + max_tokens // 4]
                chunks.append(" ".join(chunk_words))
            continue

        # If adding this sentence exceeds max_tokens, start a new chunk
        if current_tokens + sentence_tokens > max_tokens:
            # Save current chunk
            if current_chunk:
                chunks.append(" ".join(current_chunk))

            # Start new chunk with overlap
            if overlap > 0 and current_chunk:
                # Keep last few sentences for overlap
                overlap_sentences = []
                overlap_tokens = 0
                for s in reversed(current_chunk):
                    s_tokens = count_tokens(s, model)
                    if overlap_tokens + s_tokens <= overlap:
                        overlap_sentences.insert(0, s)
                        overlap_tokens += s_tokens
                    else:
                        break
                current_chunk = overlap_sentences
                current_tokens = overlap_tokens
            else:
                current_chunk = []
                current_tokens = 0

        current_chunk.append(sentence)
        current_tokens += sentence_tokens

    # Add remaining chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


def chunk_by_paragraphs(
    text: str,
    max_tokens: int = 2000,
    model: str = "gpt-3.5-turbo"
) -> List[str]:
    """
    Chunk text by paragraphs, respecting token limits.

    Args:
        text: Text to chunk
        max_tokens: Maximum tokens per chunk
        model: Model name for token counting

    Returns:
        List of text chunks
    """
    # Split by paragraphs (double newline or more)
    paragraphs = re.split(r'\n\s*\n', text)

    chunks: List[str] = []
    current_chunk: List[str] = []
    current_tokens = 0

    for paragraph in paragraphs:
        if not paragraph.strip():
            continue

        paragraph_tokens = count_tokens(paragraph, model)

        # If single paragraph exceeds max_tokens, chunk it further
        if paragraph_tokens > max_tokens:
            # Use sentence-based chunking for this paragraph
            para_chunks = chunk_text(paragraph, max_tokens, 0, model)
            chunks.extend(para_chunks)
            continue

        # If adding this paragraph exceeds max_tokens, start a new chunk
        if current_tokens + paragraph_tokens > max_tokens:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
            current_chunk = [paragraph]
            current_tokens = paragraph_tokens
        else:
            current_chunk.append(paragraph)
            current_tokens += paragraph_tokens

    # Add remaining chunk
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks


def truncate_text(
    text: str,
    max_tokens: int = 2000,
    model: str = "gpt-3.5-turbo",
    suffix: str = "..."
) -> str:
    """
    Truncate text to fit within token limit.

    Args:
        text: Text to truncate
        max_tokens: Maximum tokens allowed
        model: Model name for token counting
        suffix: Suffix to add when truncating

    Returns:
        Truncated text
    """
    current_tokens = count_tokens(text, model)

    if current_tokens <= max_tokens:
        return text

    # Binary search for the right length
    words = text.split()
    left, right = 0, len(words)

    while left < right:
        mid = (left + right + 1) // 2
        truncated = " ".join(words[:mid]) + suffix

        if count_tokens(truncated, model) <= max_tokens:
            left = mid
        else:
            right = mid - 1

    return " ".join(words[:left]) + suffix


def extract_context_window(
    text: str,
    keyword: str,
    window_tokens: int = 500,
    model: str = "gpt-3.5-turbo"
) -> str:
    """
    Extract a context window around a keyword.

    Args:
        text: Full text
        keyword: Keyword to find
        window_tokens: Size of context window in tokens
        model: Model name for token counting

    Returns:
        Context window text
    """
    # Find keyword position
    keyword_pos = text.lower().find(keyword.lower())

    if keyword_pos == -1:
        # Keyword not found, return beginning of text
        return truncate_text(text, window_tokens, model)

    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)

    # Find sentence containing keyword
    char_count = 0
    keyword_sentence_idx = 0

    for i, sentence in enumerate(sentences):
        char_count += len(sentence) + 1
        if char_count >= keyword_pos:
            keyword_sentence_idx = i
            break

    # Build context window around keyword sentence
    context: List[str] = [sentences[keyword_sentence_idx]]
    context_tokens = count_tokens(sentences[keyword_sentence_idx], model)

    # Add sentences before and after
    before_idx = keyword_sentence_idx - 1
    after_idx = keyword_sentence_idx + 1

    while context_tokens < window_tokens:
        added = False

        # Try to add sentence before
        if before_idx >= 0:
            before_tokens = count_tokens(sentences[before_idx], model)
            if context_tokens + before_tokens <= window_tokens:
                context.insert(0, sentences[before_idx])
                context_tokens += before_tokens
                before_idx -= 1
                added = True

        # Try to add sentence after
        if after_idx < len(sentences):
            after_tokens = count_tokens(sentences[after_idx], model)
            if context_tokens + after_tokens <= window_tokens:
                context.append(sentences[after_idx])
                context_tokens += after_tokens
                after_idx += 1
                added = True

        # If we couldn't add anything, break
        if not added:
            break

    return " ".join(context)


def split_into_batches(
    texts: List[str],
    max_batch_tokens: int = 8000,
    model: str = "gpt-3.5-turbo"
) -> List[List[str]]:
    """
    Split a list of texts into batches that fit within token limits.

    Args:
        texts: List of texts to batch
        max_batch_tokens: Maximum tokens per batch
        model: Model name for token counting

    Returns:
        List of batches (each batch is a list of texts)
    """
    batches: List[List[str]] = []
    current_batch: List[str] = []
    current_tokens = 0

    for text in texts:
        text_tokens = count_tokens(text, model)

        # If single text exceeds max_batch_tokens, it goes in its own batch
        if text_tokens > max_batch_tokens:
            if current_batch:
                batches.append(current_batch)
                current_batch = []
                current_tokens = 0
            batches.append([text])
            continue

        # If adding this text exceeds max_batch_tokens, start a new batch
        if current_tokens + text_tokens > max_batch_tokens:
            if current_batch:
                batches.append(current_batch)
            current_batch = [text]
            current_tokens = text_tokens
        else:
            current_batch.append(text)
            current_tokens += text_tokens

    # Add remaining batch
    if current_batch:
        batches.append(current_batch)

    return batches


def estimate_cost(
    input_tokens: int,
    output_tokens: int,
    model: str = "gpt-3.5-turbo"
) -> float:
    """
    Estimate API cost for a request.

    Args:
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        model: Model name

    Returns:
        Estimated cost in USD
    """
    # Pricing as of 2024 (per 1K tokens)
    pricing = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-32k": {"input": 0.06, "output": 0.12},
        "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
        "gpt-3.5-turbo-16k": {"input": 0.003, "output": 0.004},
        "text-embedding-ada-002": {"input": 0.0001, "output": 0.0},
        "claude-3-opus": {"input": 0.015, "output": 0.075},
        "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    }

    if model not in pricing:
        # Default to GPT-3.5 pricing
        model = "gpt-3.5-turbo"

    input_cost = (input_tokens / 1000) * pricing[model]["input"]
    output_cost = (output_tokens / 1000) * pricing[model]["output"]

    return input_cost + output_cost
