"""Utils package for AI Service."""

from .prompts import (
    format_resume_optimization_prompt,
    format_summary_generation_prompt,
    format_achievement_enhancement_prompt,
    format_ats_analysis_prompt,
    format_match_explanation_prompt,
    format_culture_fit_prompt,
    format_skill_extraction_prompt,
    format_skill_gap_analysis_prompt,
    format_salary_context_prompt,
    format_bias_detection_prompt,
    format_job_audit_prompt,
    format_resume_parsing_prompt,
)
from .tokenizers import (
    count_tokens,
    chunk_text,
    chunk_by_paragraphs,
    truncate_text,
    extract_context_window,
    split_into_batches,
    estimate_cost,
)

__all__ = [
    # Prompts
    "format_resume_optimization_prompt",
    "format_summary_generation_prompt",
    "format_achievement_enhancement_prompt",
    "format_ats_analysis_prompt",
    "format_match_explanation_prompt",
    "format_culture_fit_prompt",
    "format_skill_extraction_prompt",
    "format_skill_gap_analysis_prompt",
    "format_salary_context_prompt",
    "format_bias_detection_prompt",
    "format_job_audit_prompt",
    "format_resume_parsing_prompt",
    # Tokenizers
    "count_tokens",
    "chunk_text",
    "chunk_by_paragraphs",
    "truncate_text",
    "extract_context_window",
    "split_into_batches",
    "estimate_cost",
]
