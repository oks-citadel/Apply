"""
AI-powered resume optimization engine.
"""

from typing import List, Dict, Any
import re
import structlog

from ..schemas import Resume, JobPosting, OptimizedResume, ATSScore, Keyword
from ..services.llm_service import LLMService
from ..utils.prompts import (
    format_resume_optimization_prompt,
    format_ats_analysis_prompt,
    format_achievement_enhancement_prompt,
)

logger = structlog.get_logger()


class ResumeOptimizer:
    """
    AI-powered resume optimization engine.

    Features:
    - ATS keyword optimization
    - Achievement quantification
    - Industry-specific tailoring
    """

    def __init__(self, llm_service: LLMService):
        """
        Initialize resume optimizer.

        Args:
            llm_service: LLM service for content generation
        """
        self.llm_service = llm_service

    async def optimize_for_job(
        self,
        resume: Resume,
        job: JobPosting,
        optimization_level: str = "moderate",
    ) -> OptimizedResume:
        """
        Optimize resume for a specific job posting.

        Args:
            resume: Original resume
            job: Target job posting
            optimization_level: Optimization level (light, moderate, aggressive)

        Returns:
            Optimized resume with changes tracked
        """
        logger.info(
            "Starting resume optimization",
            resume_id=resume.id,
            job_id=job.id,
            level=optimization_level,
        )

        # Calculate baseline ATS score
        ats_score_before = await self.calculate_ats_score(resume, job)

        # Generate optimized content
        prompt = format_resume_optimization_prompt(
            resume_content=resume.content,
            job_description=job.description,
            optimization_level=optimization_level,
        )

        optimized_content = await self.llm_service.complete(
            prompt=prompt,
            temperature=0.5,
        )

        # Parse changes (simplified - production should have structured output)
        changes = self._extract_changes(resume.content, optimized_content)

        # Calculate new ATS score
        optimized_resume_temp = Resume(
            id=resume.id,
            content=optimized_content,
            skills=resume.skills,
        )
        ats_score_after = await self.calculate_ats_score(optimized_resume_temp, job)

        # Calculate improvement
        improvement = (
            ((ats_score_after.overall_score - ats_score_before.overall_score)
            / ats_score_before.overall_score)
            * 100
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            ats_score_after,
            job,
        )

        logger.info(
            "Resume optimization complete",
            score_before=ats_score_before.overall_score,
            score_after=ats_score_after.overall_score,
            improvement=f"{improvement:.1f}%",
        )

        return OptimizedResume(
            original_resume_id=resume.id or "unknown",
            optimized_content=optimized_content,
            changes=changes,
            ats_score_before=ats_score_before.overall_score,
            ats_score_after=ats_score_after.overall_score,
            improvement_percentage=improvement,
            recommendations=recommendations,
        )

    async def calculate_ats_score(
        self,
        resume: Resume,
        job: JobPosting,
    ) -> ATSScore:
        """
        Calculate ATS compatibility score.

        Args:
            resume: Resume to analyze
            job: Target job posting

        Returns:
            ATS score with breakdown
        """
        logger.info("Calculating ATS score", resume_id=resume.id, job_id=job.id)

        # Extract keywords from job
        job_keywords = await self.extract_keywords(job.description)

        # Analyze resume content
        prompt = format_ats_analysis_prompt(
            resume_content=resume.content,
            job_description=job.description,
        )

        analysis = await self.llm_service.complete(
            prompt=prompt,
            temperature=0.3,
        )

        # Parse analysis results (simplified - production should use structured output)
        keyword_match_score = self._calculate_keyword_match_score(
            resume.content,
            job_keywords,
        )

        formatting_score = self._calculate_formatting_score(resume.content)

        completeness_score = self._calculate_completeness_score(resume)

        overall_score = (
            keyword_match_score * 0.5
            + formatting_score * 0.25
            + completeness_score * 0.25
        )

        # Identify matched and missing keywords
        matched_keywords = []
        missing_keywords = []

        resume_lower = resume.content.lower()
        for keyword in job_keywords[:20]:  # Top 20 keywords
            if keyword.keyword.lower() in resume_lower:
                matched_keywords.append(keyword.keyword)
            else:
                missing_keywords.append(keyword.keyword)

        # Generate recommendations
        recommendations = self._generate_ats_recommendations(
            overall_score,
            keyword_match_score,
            formatting_score,
            completeness_score,
            missing_keywords,
        )

        # Determine ranking
        if overall_score >= 80:
            ranking = "excellent"
        elif overall_score >= 65:
            ranking = "good"
        elif overall_score >= 50:
            ranking = "fair"
        else:
            ranking = "poor"

        return ATSScore(
            overall_score=overall_score,
            keyword_match_score=keyword_match_score,
            formatting_score=formatting_score,
            completeness_score=completeness_score,
            matched_keywords=matched_keywords[:10],
            missing_keywords=missing_keywords[:10],
            recommendations=recommendations,
            estimated_ranking=ranking,
        )

    async def extract_keywords(self, job_description: str) -> List[Keyword]:
        """
        Extract keywords from job description.

        Args:
            job_description: Job description text

        Returns:
            List of keywords with metadata
        """
        # Use simple keyword extraction (production should use NER/NLP)
        keywords: List[Keyword] = []

        # Common skill patterns
        skill_patterns = [
            r'\b([A-Z][a-z]+(?:\+\+|#)?)\b',  # Technologies
            r'\b([A-Z]{2,})\b',  # Acronyms
        ]

        found_keywords: Dict[str, int] = {}

        for pattern in skill_patterns:
            matches = re.findall(pattern, job_description)
            for match in matches:
                found_keywords[match] = found_keywords.get(match, 0) + 1

        # Convert to Keyword objects
        for keyword, frequency in sorted(
            found_keywords.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:50]:
            relevance = min(1.0, frequency / 5)  # Normalize by frequency

            # Categorize
            if keyword.isupper() and len(keyword) > 1:
                category = "technology"
            else:
                category = "skill"

            keywords.append(
                Keyword(
                    keyword=keyword,
                    relevance=relevance,
                    category=category,
                    frequency=frequency,
                )
            )

        return keywords

    async def enhance_achievements(
        self,
        achievements: List[str],
        role: str = "",
        company: str = "",
        industry: str = "",
    ) -> List[str]:
        """
        Enhance achievement statements.

        Args:
            achievements: List of achievement statements
            role: Job role
            company: Company name
            industry: Industry

        Returns:
            Enhanced achievement statements
        """
        if not achievements:
            return []

        prompt = format_achievement_enhancement_prompt(
            achievements=achievements,
            role=role,
            company=company,
            industry=industry,
        )

        enhanced = await self.llm_service.complete(
            prompt=prompt,
            temperature=0.6,
        )

        # Parse enhanced achievements
        # Split by bullet points or numbered lists
        enhanced_list = re.split(r'[\n•\-\*]\s*', enhanced)
        enhanced_list = [a.strip() for a in enhanced_list if a.strip()]

        return enhanced_list[:len(achievements)]  # Return same count as input

    async def tailor_summary(
        self,
        summary: str,
        job: JobPosting,
    ) -> str:
        """
        Tailor professional summary for job.

        Args:
            summary: Original summary
            job: Target job posting

        Returns:
            Tailored summary
        """
        prompt = f"""
Tailor this professional summary for the target job:

ORIGINAL SUMMARY:
{summary}

TARGET JOB:
Title: {job.title}
Company: {job.company_name}
Key Requirements: {', '.join(job.required_skills[:5])}

Rewrite the summary to:
1. Highlight relevant skills and experience
2. Use keywords from the job posting
3. Keep it concise (2-3 sentences)
4. Maintain authenticity

Provide only the tailored summary, no additional commentary.
"""

        tailored = await self.llm_service.complete(
            prompt=prompt,
            temperature=0.6,
        )

        return tailored.strip()

    def _calculate_keyword_match_score(
        self,
        resume_content: str,
        keywords: List[Keyword],
    ) -> float:
        """Calculate keyword match score."""
        if not keywords:
            return 100.0

        resume_lower = resume_content.lower()

        # Weight by keyword relevance
        total_relevance = sum(k.relevance for k in keywords[:20])
        matched_relevance = sum(
            k.relevance for k in keywords[:20]
            if k.keyword.lower() in resume_lower
        )

        if total_relevance == 0:
            return 100.0

        score = (matched_relevance / total_relevance) * 100
        return float(score)

    def _calculate_formatting_score(self, resume_content: str) -> float:
        """Calculate formatting score."""
        score = 100.0

        # Check for common formatting issues
        lines = resume_content.split('\n')

        # Penalty for very long lines (likely formatting issue)
        long_lines = sum(1 for line in lines if len(line) > 120)
        if long_lines > len(lines) * 0.3:
            score -= 20

        # Penalty for special characters that may confuse ATS
        special_chars = len(re.findall(r'[^\w\s\.,;:\-\(\)]', resume_content))
        if special_chars > 50:
            score -= 10

        # Bonus for section headers
        headers = len(re.findall(
            r'(Experience|Education|Skills|Summary|Certifications)',
            resume_content,
            re.IGNORECASE
        ))
        if headers >= 3:
            score += 0  # Already at 100
        else:
            score -= 15

        return float(max(0, min(100, score)))

    def _calculate_completeness_score(self, resume: Resume) -> float:
        """Calculate completeness score."""
        score = 0.0
        max_score = 100.0

        # Check for key sections
        sections = {
            'contact_info': 20,
            'summary': 15,
            'experience': 30,
            'education': 20,
            'skills': 15,
        }

        if resume.contact_info:
            score += sections['contact_info']

        if resume.summary:
            score += sections['summary']

        if resume.experience and len(resume.experience) > 0:
            score += sections['experience']

        if resume.education and len(resume.education) > 0:
            score += sections['education']

        if resume.skills and len(resume.skills) >= 5:
            score += sections['skills']

        return float(score)

    def _extract_changes(
        self,
        original: str,
        optimized: str,
    ) -> List[Dict[str, Any]]:
        """Extract changes between original and optimized versions."""
        # Simplified change detection
        changes: List[Dict[str, Any]] = []

        # This is a placeholder - production should use proper diff algorithm
        if len(optimized) > len(original):
            changes.append({
                "type": "content_added",
                "section": "general",
                "description": "Content enhanced and expanded",
            })

        # Look for keyword additions
        original_words = set(original.lower().split())
        optimized_words = set(optimized.lower().split())
        new_words = optimized_words - original_words

        if new_words:
            changes.append({
                "type": "keywords_added",
                "section": "skills",
                "description": f"Added keywords: {', '.join(list(new_words)[:5])}",
            })

        return changes

    def _generate_recommendations(
        self,
        ats_score: ATSScore,
        job: JobPosting,
    ) -> List[str]:
        """Generate improvement recommendations."""
        recommendations = []

        if ats_score.keyword_match_score < 70:
            recommendations.append(
                f"Add more keywords from the job description: {', '.join(ats_score.missing_keywords[:5])}"
            )

        if ats_score.formatting_score < 75:
            recommendations.append(
                "Improve formatting for better ATS compatibility (use standard fonts, avoid tables)"
            )

        if ats_score.completeness_score < 80:
            recommendations.append(
                "Ensure all key sections are complete (contact info, summary, experience, education, skills)"
            )

        if len(ats_score.matched_keywords) < 10:
            recommendations.append(
                "Incorporate more relevant skills and technologies from the job posting"
            )

        return recommendations

    def _generate_ats_recommendations(
        self,
        overall_score: float,
        keyword_score: float,
        formatting_score: float,
        completeness_score: float,
        missing_keywords: List[str],
    ) -> List[str]:
        """Generate ATS-specific recommendations."""
        recommendations = []

        if keyword_score < 70:
            keywords_to_add = ', '.join(missing_keywords[:5])
            recommendations.append(
                f"Add these important keywords: {keywords_to_add}"
            )

        if formatting_score < 75:
            recommendations.append(
                "Use standard section headers (Experience, Education, Skills)"
            )
            recommendations.append(
                "Avoid tables, graphics, and unusual formatting"
            )

        if completeness_score < 80:
            recommendations.append(
                "Complete all resume sections for better ATS scoring"
            )

        if overall_score >= 80:
            recommendations.append(
                "Resume is well-optimized! Consider minor keyword additions."
            )

        return recommendations
