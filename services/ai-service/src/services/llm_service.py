"""
LLM service with multiple provider support and fallback.
"""

from typing import Optional, List, Dict, Any
from abc import ABC, abstractmethod
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

from ..config import settings

logger = structlog.get_logger()


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> str:
        """Generate completion from prompt."""
        pass

    @abstractmethod
    async def complete_with_system(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> str:
        """Generate completion with system and user prompts."""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider."""

    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        """
        Initialize OpenAI provider.

        Args:
            api_key: OpenAI API key
            model: Model name to use
        """
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def complete(
        self,
        prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> str:
        """Generate completion from prompt."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs,
            )

            content = response.choices[0].message.content or ""

            logger.info(
                "OpenAI completion generated",
                model=self.model,
                prompt_length=len(prompt),
                completion_length=len(content),
                tokens_used=response.usage.total_tokens if response.usage else 0,
            )

            return content

        except Exception as e:
            logger.error(f"OpenAI completion failed: {e}", exc_info=True)
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def complete_with_system(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> str:
        """Generate completion with system and user prompts."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs,
            )

            content = response.choices[0].message.content or ""

            logger.info(
                "OpenAI completion with system prompt generated",
                model=self.model,
                tokens_used=response.usage.total_tokens if response.usage else 0,
            )

            return content

        except Exception as e:
            logger.error(f"OpenAI completion failed: {e}", exc_info=True)
            raise


class AnthropicProvider(LLMProvider):
    """Anthropic (Claude) LLM provider."""

    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        """
        Initialize Anthropic provider.

        Args:
            api_key: Anthropic API key
            model: Model name to use
        """
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def complete(
        self,
        prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> str:
        """Generate completion from prompt."""
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                **kwargs,
            )

            content = response.content[0].text if response.content else ""

            logger.info(
                "Anthropic completion generated",
                model=self.model,
                prompt_length=len(prompt),
                completion_length=len(content),
            )

            return content

        except Exception as e:
            logger.error(f"Anthropic completion failed: {e}", exc_info=True)
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def complete_with_system(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        **kwargs: Any,
    ) -> str:
        """Generate completion with system and user prompts."""
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ],
                **kwargs,
            )

            content = response.content[0].text if response.content else ""

            logger.info(
                "Anthropic completion with system prompt generated",
                model=self.model,
            )

            return content

        except Exception as e:
            logger.error(f"Anthropic completion failed: {e}", exc_info=True)
            raise


class LLMService:
    """
    LLM service with multiple providers and fallback support.
    """

    def __init__(
        self,
        primary_provider: Optional[LLMProvider] = None,
        fallback_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize LLM service.

        Args:
            primary_provider: Primary LLM provider
            fallback_provider: Fallback LLM provider
        """
        self._disabled = False

        # Check if API keys are valid (not placeholder or empty)
        def is_valid_api_key(key: str) -> bool:
            return key and key not in ("", "placeholder", "placeholder-configure-in-secrets")

        # Initialize providers
        if primary_provider:
            self.primary_provider = primary_provider
        elif settings.default_llm_provider == "openai":
            if is_valid_api_key(settings.openai_api_key):
                self.primary_provider = OpenAIProvider(
                    api_key=settings.openai_api_key,
                    model="gpt-3.5-turbo",
                )
            else:
                logger.warning(
                    "OpenAI API key not configured - LLM Service running in disabled mode. "
                    "Set OPENAI_API_KEY environment variable to enable AI features."
                )
                self._disabled = True
                self.primary_provider = None
        else:
            if is_valid_api_key(settings.anthropic_api_key):
                self.primary_provider = AnthropicProvider(
                    api_key=settings.anthropic_api_key,
                    model="claude-3-sonnet-20240229",
                )
            else:
                logger.warning(
                    "Anthropic API key not configured - LLM Service running in disabled mode. "
                    "Set ANTHROPIC_API_KEY environment variable to enable AI features."
                )
                self._disabled = True
                self.primary_provider = None

        # Setup fallback
        if fallback_provider:
            self.fallback_provider = fallback_provider
        elif not self._disabled and settings.default_llm_provider == "openai":
            # If primary is OpenAI, fallback to Anthropic
            if is_valid_api_key(settings.anthropic_api_key):
                try:
                    self.fallback_provider = AnthropicProvider(
                        api_key=settings.anthropic_api_key,
                        model="claude-3-sonnet-20240229",
                    )
                except Exception:
                    self.fallback_provider = None
            else:
                self.fallback_provider = None
        elif not self._disabled:
            # If primary is Anthropic, fallback to OpenAI
            if is_valid_api_key(settings.openai_api_key):
                try:
                    self.fallback_provider = OpenAIProvider(
                        api_key=settings.openai_api_key,
                        model="gpt-3.5-turbo",
                    )
                except Exception:
                    self.fallback_provider = None
            else:
                self.fallback_provider = None
        else:
            self.fallback_provider = None

    async def complete(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        use_fallback: bool = True,
        **kwargs: Any,
    ) -> str:
        """
        Generate completion from prompt with fallback support.

        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            use_fallback: Whether to use fallback provider on failure
            **kwargs: Additional provider-specific arguments

        Returns:
            Generated completion text
        """
        if self._disabled or not self.primary_provider:
            raise RuntimeError("LLM service is disabled - no valid API keys configured")

        max_tokens = max_tokens or settings.llm_max_tokens
        temperature = temperature or settings.llm_temperature

        # Try primary provider
        try:
            return await self.primary_provider.complete(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs,
            )
        except Exception as e:
            logger.warning(f"Primary provider failed: {e}")

            # Try fallback if available and enabled
            if use_fallback and self.fallback_provider:
                try:
                    logger.info("Using fallback provider")
                    return await self.fallback_provider.complete(
                        prompt=prompt,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        **kwargs,
                    )
                except Exception as fallback_error:
                    logger.error(f"Fallback provider also failed: {fallback_error}")
                    raise

            raise

    async def complete_with_system(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        use_fallback: bool = True,
        **kwargs: Any,
    ) -> str:
        """
        Generate completion with system and user prompts.

        Args:
            system_prompt: System prompt
            user_prompt: User prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            use_fallback: Whether to use fallback provider on failure
            **kwargs: Additional provider-specific arguments

        Returns:
            Generated completion text
        """
        if self._disabled or not self.primary_provider:
            raise RuntimeError("LLM service is disabled - no valid API keys configured")

        max_tokens = max_tokens or settings.llm_max_tokens
        temperature = temperature or settings.llm_temperature

        # Try primary provider
        try:
            return await self.primary_provider.complete_with_system(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs,
            )
        except Exception as e:
            logger.warning(f"Primary provider failed: {e}")

            # Try fallback if available and enabled
            if use_fallback and self.fallback_provider:
                try:
                    logger.info("Using fallback provider")
                    return await self.fallback_provider.complete_with_system(
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        **kwargs,
                    )
                except Exception as fallback_error:
                    logger.error(f"Fallback provider also failed: {fallback_error}")
                    raise

            raise

    async def generate_resume_content(
        self,
        section_type: str,
        context: Dict[str, Any],
        job_description: Optional[str] = None,
    ) -> str:
        """
        Generate resume section content.

        Args:
            section_type: Type of section (summary, experience, skills)
            context: Context for generation
            job_description: Target job description

        Returns:
            Generated content
        """
        from ..utils.prompts import format_summary_generation_prompt

        if section_type == "summary":
            prompt = format_summary_generation_prompt(
                title=context.get("title", ""),
                years_experience=context.get("years_experience", 0),
                skills=context.get("skills", []),
                industry=context.get("industry", ""),
                job_description=job_description or "",
            )
        else:
            # Generic prompt for other sections
            prompt = f"Generate a professional {section_type} section for a resume.\n\nContext: {context}\n\nTarget Job: {job_description or 'General'}"

        return await self.complete(prompt, temperature=0.7)

    async def optimize_for_ats(
        self,
        resume_content: str,
        job_description: str,
        optimization_level: str = "moderate",
    ) -> str:
        """
        Optimize resume content for ATS.

        Args:
            resume_content: Original resume content
            job_description: Target job description
            optimization_level: Optimization level

        Returns:
            Optimized resume content
        """
        from ..utils.prompts import format_resume_optimization_prompt

        prompt = format_resume_optimization_prompt(
            resume_content=resume_content,
            job_description=job_description,
            optimization_level=optimization_level,
        )

        return await self.complete(prompt, temperature=0.5)
