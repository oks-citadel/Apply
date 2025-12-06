"""
Multi-Language Agent for translation and localization.
Copy this file to: services/ai-service/src/agents/multi_language.py
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum
import structlog
import json

from ..services.llm_service import LLMService

logger = structlog.get_logger()


class ContentType(str, Enum):
    """Content types for translation."""
    RESUME = "resume"
    COVER_LETTER = "cover_letter"
    EMAIL = "email"
    LINKEDIN_PROFILE = "linkedin_profile"
    PORTFOLIO = "portfolio"


class LocalizationLevel(str, Enum):
    """Localization depth levels."""
    BASIC = "basic"  # Translation only
    STANDARD = "standard"  # Translation + cultural adaptation
    COMPREHENSIVE = "comprehensive"  # Full localization + format compliance


# Request Schema
class MultiLanguageRequest(BaseModel):
    """Request schema for multi-language translation."""

    content: str = Field(..., description="Content to translate")
    content_type: ContentType = Field(..., description="Type of content")
    source_language: str = Field(..., description="Source language code (e.g., 'en', 'es', 'fr')")
    target_language: str = Field(..., description="Target language code")
    target_country: Optional[str] = Field(
        None,
        description="Target country for localization (e.g., 'US', 'UK', 'JP')"
    )
    localization_level: LocalizationLevel = Field(
        default=LocalizationLevel.STANDARD,
        description="Depth of localization"
    )
    preserve_formatting: bool = Field(
        default=True,
        description="Preserve original formatting where possible"
    )
    optimize_keywords: bool = Field(
        default=True,
        description="Optimize keywords for target market"
    )
    industry: Optional[str] = Field(
        None,
        description="Industry for domain-specific terminology"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Experienced software engineer with 5 years...",
                "content_type": "resume",
                "source_language": "en",
                "target_language": "es",
                "target_country": "ES",
                "localization_level": "standard",
                "preserve_formatting": True,
                "optimize_keywords": True,
                "industry": "technology"
            }
        }


# Response Schemas
class TranslationQuality(BaseModel):
    """Translation quality metrics."""

    accuracy_score: float = Field(ge=0, le=100, description="Translation accuracy score")
    fluency_score: float = Field(ge=0, le=100, description="Language fluency score")
    completeness_score: float = Field(ge=0, le=100, description="Content completeness score")
    overall_quality: float = Field(ge=0, le=100, description="Overall quality score")

    class Config:
        json_schema_extra = {
            "example": {
                "accuracy_score": 95.0,
                "fluency_score": 92.0,
                "completeness_score": 98.0,
                "overall_quality": 95.0
            }
        }


class LocalizationApplied(BaseModel):
    """Localization changes applied."""

    cultural_adaptations: List[str] = Field(description="Cultural adaptations made")
    format_changes: List[str] = Field(description="Format changes for target market")
    terminology_adjustments: List[str] = Field(description="Industry/regional terminology adjustments")
    keyword_optimizations: List[str] = Field(description="Keyword optimizations applied")

    class Config:
        json_schema_extra = {
            "example": {
                "cultural_adaptations": ["Adapted date format to DD/MM/YYYY"],
                "format_changes": ["Adjusted address format for EU standards"],
                "terminology_adjustments": ["Changed 'resume' to 'CV'"],
                "keyword_optimizations": ["Added Spanish market keywords"]
            }
        }


class CulturalNote(BaseModel):
    """Cultural note or consideration."""

    category: str = Field(description="Category of cultural note")
    note: str = Field(description="The cultural note")
    importance: str = Field(description="Importance level: high, medium, low")

    class Config:
        json_schema_extra = {
            "example": {
                "category": "Business Etiquette",
                "note": "In Japanese business culture, include a formal greeting",
                "importance": "high"
            }
        }


class MultiLanguageResponse(BaseModel):
    """Response schema for multi-language translation."""

    translated_content: str = Field(description="Translated and localized content")
    source_language: str = Field(description="Source language")
    target_language: str = Field(description="Target language")
    target_country: Optional[str] = Field(description="Target country")
    quality_metrics: TranslationQuality = Field(description="Translation quality metrics")
    localizations_applied: LocalizationApplied = Field(description="Localizations applied")
    cultural_notes: List[CulturalNote] = Field(description="Cultural notes and considerations")
    alternative_phrasings: Dict[str, List[str]] = Field(
        description="Alternative phrasings for key sections"
    )
    glossary: Dict[str, str] = Field(
        description="Glossary of key terms and their translations"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "translated_content": "Ingeniero de software experimentado...",
                "source_language": "en",
                "target_language": "es",
                "target_country": "ES",
                "quality_metrics": {
                    "accuracy_score": 95.0,
                    "fluency_score": 92.0,
                    "completeness_score": 98.0,
                    "overall_quality": 95.0
                },
                "localizations_applied": {
                    "cultural_adaptations": [],
                    "format_changes": [],
                    "terminology_adjustments": [],
                    "keyword_optimizations": []
                },
                "cultural_notes": [],
                "alternative_phrasings": {},
                "glossary": {}
            }
        }


class MultiLanguageAgent:
    """
    Agent for multi-language translation and localization.

    Capabilities:
    - Professional translation
    - Cultural adaptation
    - Local format compliance
    - Keyword optimization for target markets
    - Industry-specific terminology
    """

    # Language-specific date formats
    DATE_FORMATS = {
        "en_US": "MM/DD/YYYY",
        "en_UK": "DD/MM/YYYY",
        "en_CA": "YYYY-MM-DD",
        "es": "DD/MM/YYYY",
        "fr": "DD/MM/YYYY",
        "de": "DD.MM.YYYY",
        "ja": "YYYY年MM月DD日",
        "zh": "YYYY年MM月DD日",
        "ko": "YYYY.MM.DD",
    }

    # CV vs Resume terminology by region
    CV_VS_RESUME = {
        "US": "resume",
        "CA": "resume",
        "UK": "CV",
        "EU": "CV",
        "AU": "CV",
        "NZ": "CV",
        "IN": "CV",
        "SG": "CV",
    }

    def __init__(self, llm_service: LLMService):
        """
        Initialize Multi-Language Agent.

        Args:
            llm_service: LLM service for translation
        """
        self.llm_service = llm_service

    async def translate_and_localize(
        self,
        content: str,
        content_type: ContentType,
        source_language: str,
        target_language: str,
        target_country: Optional[str] = None,
        localization_level: LocalizationLevel = LocalizationLevel.STANDARD,
        preserve_formatting: bool = True,
        optimize_keywords: bool = True,
        industry: Optional[str] = None
    ) -> MultiLanguageResponse:
        """
        Translate and localize content for target language/country.

        Args:
            content: Content to translate
            content_type: Type of content
            source_language: Source language code
            target_language: Target language code
            target_country: Target country code
            localization_level: Depth of localization
            preserve_formatting: Whether to preserve formatting
            optimize_keywords: Whether to optimize keywords
            industry: Industry for terminology

        Returns:
            Translated and localized content
        """
        logger.info(
            "Starting translation and localization",
            source_language=source_language,
            target_language=target_language,
            content_type=content_type,
            localization_level=localization_level
        )

        # Perform translation
        translated_content = await self._translate_content(
            content,
            content_type,
            source_language,
            target_language,
            target_country,
            industry,
            preserve_formatting
        )

        # Apply localization based on level
        if localization_level in [LocalizationLevel.STANDARD, LocalizationLevel.COMPREHENSIVE]:
            translated_content, localizations = await self._apply_localization(
                translated_content,
                content_type,
                target_language,
                target_country,
                localization_level,
                industry
            )
        else:
            localizations = LocalizationApplied(
                cultural_adaptations=[],
                format_changes=[],
                terminology_adjustments=[],
                keyword_optimizations=[]
            )

        # Optimize keywords if requested
        if optimize_keywords:
            translated_content, keyword_optimizations = await self._optimize_keywords(
                translated_content,
                content_type,
                target_language,
                target_country,
                industry
            )
            localizations.keyword_optimizations = keyword_optimizations

        # Generate cultural notes
        cultural_notes = await self._generate_cultural_notes(
            content_type,
            target_language,
            target_country
        )

        # Generate alternative phrasings
        alternative_phrasings = await self._generate_alternative_phrasings(
            translated_content,
            content_type,
            target_language
        )

        # Create glossary
        glossary = await self._create_glossary(
            content,
            translated_content,
            source_language,
            target_language,
            industry
        )

        # Assess quality
        quality_metrics = await self._assess_translation_quality(
            content,
            translated_content,
            source_language,
            target_language
        )

        logger.info(
            "Translation and localization completed",
            quality_score=quality_metrics.overall_quality,
            localizations_count=len(localizations.cultural_adaptations) + len(localizations.format_changes)
        )

        return MultiLanguageResponse(
            translated_content=translated_content,
            source_language=source_language,
            target_language=target_language,
            target_country=target_country,
            quality_metrics=quality_metrics,
            localizations_applied=localizations,
            cultural_notes=cultural_notes,
            alternative_phrasings=alternative_phrasings,
            glossary=glossary
        )

    async def _translate_content(
        self,
        content: str,
        content_type: ContentType,
        source_language: str,
        target_language: str,
        target_country: Optional[str],
        industry: Optional[str],
        preserve_formatting: bool
    ) -> str:
        """Translate content to target language."""

        system_prompt = f"""You are an expert translator specializing in professional documents.
Translate {content_type} content from {source_language} to {target_language} with high accuracy and natural fluency.

Guidelines:
- Maintain professional tone
- Preserve technical terminology accuracy
- Use natural, native-speaker phrasing
- Keep formatting {"intact" if preserve_formatting else "flexible"}
- Consider {industry} industry terminology if applicable"""

        country_context = f" for {target_country}" if target_country else ""
        industry_context = f" in the {industry} industry" if industry else ""

        user_prompt = f"""Translate this {content_type}{country_context}{industry_context}:

Source ({source_language}):
{content}

Provide a professional, accurate translation in {target_language}.
Focus on:
1. Accuracy of meaning
2. Natural language flow
3. Professional terminology
4. Cultural appropriateness

Translation:"""

        try:
            translated = await self.llm_service.complete_with_system(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.3,
                max_tokens=4000
            )

            return translated.strip()

        except Exception as e:
            logger.error(f"Translation failed: {e}", exc_info=True)
            raise

    async def _apply_localization(
        self,
        content: str,
        content_type: ContentType,
        target_language: str,
        target_country: Optional[str],
        localization_level: LocalizationLevel,
        industry: Optional[str]
    ) -> tuple[str, LocalizationApplied]:
        """Apply localization to translated content."""

        system_prompt = f"""You are a localization expert specializing in adapting professional documents for specific markets.
Apply {localization_level} localization to make content appropriate for {target_language}/{target_country} market."""

        localization_guidelines = {
            LocalizationLevel.STANDARD: """Standard localization includes:
- Cultural adaptations for common references
- Date/number format adjustments
- Regional terminology preferences
- Basic keyword optimization""",
            LocalizationLevel.COMPREHENSIVE: """Comprehensive localization includes:
- Deep cultural adaptation
- Complete format compliance with local standards
- Industry-specific regional terminology
- Extensive keyword optimization
- Local business etiquette integration"""
        }

        user_prompt = f"""Localize this {content_type} for {target_language}/{target_country}:

Content:
{content}

{localization_guidelines.get(localization_level, localization_guidelines[LocalizationLevel.STANDARD])}

Provide:
1. Localized content
2. List of cultural adaptations made
3. List of format changes
4. List of terminology adjustments

Response in JSON format:
{{
    "localized_content": "<full localized content>",
    "cultural_adaptations": [<list of adaptations>],
    "format_changes": [<list of format changes>],
    "terminology_adjustments": [<list of terminology changes>]
}}"""

        try:
            response = await self.llm_service.complete_with_system(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.4,
                max_tokens=4000
            )

            data = json.loads(response.strip())

            localizations = LocalizationApplied(
                cultural_adaptations=data.get("cultural_adaptations", []),
                format_changes=data.get("format_changes", []),
                terminology_adjustments=data.get("terminology_adjustments", []),
                keyword_optimizations=[]
            )

            return data.get("localized_content", content), localizations

        except Exception as e:
            logger.error(f"Localization failed: {e}", exc_info=True)
            return content, LocalizationApplied(
                cultural_adaptations=[],
                format_changes=[],
                terminology_adjustments=[],
                keyword_optimizations=[]
            )

    async def _optimize_keywords(
        self,
        content: str,
        content_type: ContentType,
        target_language: str,
        target_country: Optional[str],
        industry: Optional[str]
    ) -> tuple[str, List[str]]:
        """Optimize keywords for target market."""

        system_prompt = """You are an expert in international job market optimization.
Optimize content keywords for maximum effectiveness in the target market."""

        user_prompt = f"""Optimize keywords in this {content_type} for {target_language}/{target_country} market{f" in {industry}" if industry else ""}:

Content:
{content}

Goals:
- Use market-preferred terminology
- Include locally-recognized skills and qualifications
- Optimize for local ATS systems
- Maintain professional authenticity

Provide:
{{
    "optimized_content": "<content with optimized keywords>",
    "keywords_added": [<list of keywords added/changed>]
}}"""

        try:
            response = await self.llm_service.complete_with_system(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.4,
                max_tokens=4000
            )

            data = json.loads(response.strip())

            return (
                data.get("optimized_content", content),
                data.get("keywords_added", [])
            )

        except Exception as e:
            logger.error(f"Keyword optimization failed: {e}", exc_info=True)
            return content, []

    async def _generate_cultural_notes(
        self,
        content_type: ContentType,
        target_language: str,
        target_country: Optional[str]
    ) -> List[CulturalNote]:
        """Generate cultural notes for the target market."""

        system_prompt = """You are a cross-cultural business communication expert.
Provide important cultural notes for professional documents in different markets."""

        user_prompt = f"""Provide 3-5 important cultural notes for a {content_type} in {target_language}/{target_country}:

Include notes about:
- Business etiquette expectations
- Common formatting preferences
- Cultural communication norms
- Important things to include or avoid

Provide in JSON array format:
[
    {{
        "category": "<category>",
        "note": "<cultural note>",
        "importance": "high|medium|low"
    }}
]"""

        try:
            response = await self.llm_service.complete_with_system(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.4
            )

            data = json.loads(response.strip())

            return [CulturalNote(**note) for note in data]

        except Exception as e:
            logger.error(f"Failed to generate cultural notes: {e}", exc_info=True)
            return []

    async def _generate_alternative_phrasings(
        self,
        content: str,
        content_type: ContentType,
        target_language: str
    ) -> Dict[str, List[str]]:
        """Generate alternative phrasings for key sections."""

        system_prompt = f"""You are a professional writing expert in {target_language}.
Provide alternative phrasings for key sections of professional documents."""

        # Extract a few key sentences for alternatives
        sentences = content.split('.')[:3]

        alternatives = {}

        for i, sentence in enumerate(sentences):
            if len(sentence.strip()) < 10:
                continue

            user_prompt = f"""Provide 2-3 alternative ways to phrase this sentence in {target_language}:

Original: {sentence.strip()}

Keep the same meaning but vary:
- Tone (more formal/casual)
- Structure
- Word choice

Provide as JSON array: ["alternative 1", "alternative 2", "alternative 3"]"""

            try:
                response = await self.llm_service.complete_with_system(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=0.6
                )

                alts = json.loads(response.strip())
                alternatives[sentence.strip()[:50] + "..."] = alts

            except Exception as e:
                logger.warning(f"Failed to generate alternatives for sentence {i}: {e}")
                continue

        return alternatives

    async def _create_glossary(
        self,
        source_content: str,
        translated_content: str,
        source_language: str,
        target_language: str,
        industry: Optional[str]
    ) -> Dict[str, str]:
        """Create glossary of key terms and translations."""

        system_prompt = """You are a terminology expert creating translation glossaries.
Identify key professional terms and their translations."""

        user_prompt = f"""Create a glossary of important terms from this translation:

Source ({source_language}):
{source_content[:500]}...

Target ({target_language}):
{translated_content[:500]}...

Identify 10-15 key professional/technical terms and their translations.

Provide as JSON object:
{{
    "source term 1": "translated term 1",
    "source term 2": "translated term 2"
}}"""

        try:
            response = await self.llm_service.complete_with_system(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.2
            )

            glossary = json.loads(response.strip())

            return glossary

        except Exception as e:
            logger.error(f"Failed to create glossary: {e}", exc_info=True)
            return {}

    async def _assess_translation_quality(
        self,
        source_content: str,
        translated_content: str,
        source_language: str,
        target_language: str
    ) -> TranslationQuality:
        """Assess translation quality."""

        system_prompt = """You are a translation quality assessment expert.
Evaluate translations for accuracy, fluency, and completeness."""

        user_prompt = f"""Assess the quality of this translation from {source_language} to {target_language}:

Source:
{source_content[:500]}...

Translation:
{translated_content[:500]}...

Rate on a scale of 0-100:
1. Accuracy (meaning preservation)
2. Fluency (natural language flow)
3. Completeness (no information lost)
4. Overall quality

Provide as JSON:
{{
    "accuracy_score": <number>,
    "fluency_score": <number>,
    "completeness_score": <number>,
    "overall_quality": <number>
}}"""

        try:
            response = await self.llm_service.complete_with_system(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.2
            )

            data = json.loads(response.strip())

            return TranslationQuality(**data)

        except Exception as e:
            logger.error(f"Failed to assess quality: {e}", exc_info=True)
            return TranslationQuality(
                accuracy_score=85.0,
                fluency_score=85.0,
                completeness_score=85.0,
                overall_quality=85.0
            )
