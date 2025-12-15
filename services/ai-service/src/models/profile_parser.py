"""
Profile parser for extracting structured data from resumes, cover letters, and LinkedIn profiles.
"""

import re
from typing import Dict, Any, List, Optional, Set
from datetime import datetime
import structlog

logger = structlog.get_logger()


class ProfileParser:
    """
    Parser for extracting structured information from candidate profiles.

    Extracts:
    - Skills with proficiency levels
    - Work experience with depth analysis
    - Seniority level
    - Industry experience
    - Education details
    """

    # Common skill keywords and categories
    SKILL_CATEGORIES = {
        "programming": [
            "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust",
            "php", "swift", "kotlin", "scala", "r", "matlab"
        ],
        "web": [
            "react", "angular", "vue", "node.js", "express", "django", "flask", "fastapi",
            "spring", "asp.net", "html", "css", "sass", "webpack"
        ],
        "data": [
            "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
            "hadoop", "spark", "kafka", "airflow", "pandas", "numpy"
        ],
        "cloud": [
            "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
            "jenkins", "circleci", "github actions"
        ],
        "ai_ml": [
            "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
            "nlp", "computer vision", "transformers", "llm", "ai"
        ],
        "soft": [
            "leadership", "communication", "teamwork", "problem solving", "project management",
            "agile", "scrum", "mentoring", "presentation"
        ]
    }

    # Seniority keywords
    SENIORITY_LEVELS = {
        "entry": ["junior", "entry", "associate", "graduate", "intern"],
        "mid": ["mid", "intermediate", "developer", "engineer", "analyst"],
        "senior": ["senior", "lead", "principal", "staff"],
        "lead": ["lead", "tech lead", "team lead", "architect"],
        "executive": ["director", "vp", "head of", "chief", "cto", "ceo", "cio"]
    }

    # Education levels
    EDUCATION_LEVELS = {
        "high_school": 1,
        "associate": 2,
        "bachelor": 3,
        "master": 4,
        "phd": 5,
        "doctorate": 5
    }

    def __init__(self):
        """Initialize profile parser."""
        self.skill_patterns = self._compile_skill_patterns()

    def _compile_skill_patterns(self) -> Dict[str, re.Pattern]:
        """Compile regex patterns for skill detection."""
        patterns = {}
        for category, skills in self.SKILL_CATEGORIES.items():
            # Create pattern that matches skills as whole words
            pattern = r'\b(' + '|'.join(re.escape(skill) for skill in skills) + r')\b'
            patterns[category] = re.compile(pattern, re.IGNORECASE)
        return patterns

    def parse_profile(
        self,
        resume_text: Optional[str] = None,
        cover_letter: Optional[str] = None,
        linkedin_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Parse complete candidate profile from multiple sources.

        Args:
            resume_text: Resume text content
            cover_letter: Cover letter text
            linkedin_profile: LinkedIn profile data

        Returns:
            Structured profile data
        """
        logger.info("Parsing candidate profile")

        profile = {
            "skills": [],
            "skill_categories": {},
            "experience": [],
            "total_experience_years": 0,
            "seniority_level": "mid",
            "industries": [],
            "education": [],
            "highest_education_level": 0,
            "certifications": [],
            "keywords": [],
            "summary": "",
            "parsed_at": datetime.utcnow().isoformat()
        }

        # Parse resume
        if resume_text:
            resume_data = self._parse_resume(resume_text)
            profile = self._merge_data(profile, resume_data)

        # Parse cover letter
        if cover_letter:
            cover_data = self._parse_cover_letter(cover_letter)
            profile = self._merge_data(profile, cover_data)

        # Parse LinkedIn
        if linkedin_profile:
            linkedin_data = self._parse_linkedin(linkedin_profile)
            profile = self._merge_data(profile, linkedin_data)

        # Deduplicate and enrich
        profile = self._deduplicate_and_enrich(profile)

        logger.info(
            "Profile parsing completed",
            skills_count=len(profile["skills"]),
            experience_years=profile["total_experience_years"],
            seniority=profile["seniority_level"]
        )

        return profile

    def _parse_resume(self, text: str) -> Dict[str, Any]:
        """Parse resume text."""
        data = {
            "skills": [],
            "skill_categories": {},
            "experience": [],
            "education": [],
            "certifications": [],
            "summary": ""
        }

        # Extract skills
        data["skills"], data["skill_categories"] = self._extract_skills(text)

        # Extract experience
        data["experience"] = self._extract_experience(text)

        # Extract education
        data["education"] = self._extract_education(text)

        # Extract certifications
        data["certifications"] = self._extract_certifications(text)

        # Extract summary
        data["summary"] = self._extract_summary(text)

        return data

    def _parse_cover_letter(self, text: str) -> Dict[str, Any]:
        """Parse cover letter for additional context."""
        data = {
            "skills": [],
            "keywords": [],
            "summary": text[:500]  # First 500 chars as supplementary summary
        }

        # Extract mentioned skills
        skills, _ = self._extract_skills(text)
        data["skills"] = skills

        return data

    def _parse_linkedin(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LinkedIn profile data."""
        data = {
            "skills": profile.get("skills", []),
            "experience": [],
            "education": [],
            "summary": profile.get("summary", ""),
            "certifications": profile.get("certifications", [])
        }

        # Parse experience
        for exp in profile.get("experience", []):
            data["experience"].append({
                "title": exp.get("title", ""),
                "company": exp.get("company", ""),
                "duration_months": exp.get("duration_months", 0),
                "description": exp.get("description", ""),
                "industry": exp.get("industry", "")
            })

        # Parse education
        for edu in profile.get("education", []):
            data["education"].append({
                "degree": edu.get("degree", ""),
                "field": edu.get("field", ""),
                "school": edu.get("school", ""),
                "year": edu.get("year", "")
            })

        return data

    def _extract_skills(self, text: str) -> tuple[List[str], Dict[str, List[str]]]:
        """Extract skills from text using pattern matching."""
        all_skills = []
        categorized = {}

        for category, pattern in self.skill_patterns.items():
            matches = pattern.findall(text)
            if matches:
                categorized[category] = list(set(m.lower() for m in matches))
                all_skills.extend(categorized[category])

        return list(set(all_skills)), categorized

    def _extract_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience from resume text."""
        experience = []

        # Look for common experience section headers
        exp_pattern = r'(EXPERIENCE|WORK HISTORY|EMPLOYMENT|PROFESSIONAL EXPERIENCE)(.*?)(?=EDUCATION|SKILLS|CERTIFICATIONS|$)'
        match = re.search(exp_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            exp_section = match.group(2)

            # Extract job entries (simplified - real implementation would be more sophisticated)
            # Look for date ranges like "2020-2023" or "Jan 2020 - Present"
            date_pattern = r'(\d{4})\s*[-–]\s*(\d{4}|Present|Current)'
            dates = re.findall(date_pattern, exp_section, re.IGNORECASE)

            # For each date range, try to extract job info
            entries = exp_section.split('\n\n')
            for i, entry in enumerate(entries[:5]):  # Limit to 5 most recent
                if i < len(dates):
                    start_year = int(dates[i][0])
                    end_year = datetime.now().year if dates[i][1].lower() in ['present', 'current'] else int(dates[i][1])
                    duration_months = max(0, (end_year - start_year) * 12)

                    # Extract title and company (first two lines typically)
                    lines = [l.strip() for l in entry.split('\n') if l.strip()]
                    title = lines[0] if len(lines) > 0 else ""
                    company = lines[1] if len(lines) > 1 else ""

                    experience.append({
                        "title": title,
                        "company": company,
                        "start_year": start_year,
                        "end_year": end_year,
                        "duration_months": duration_months,
                        "description": entry
                    })

        return experience

    def _extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract education from resume text."""
        education = []

        # Look for education section
        edu_pattern = r'(EDUCATION|ACADEMIC|QUALIFICATION)(.*?)(?=EXPERIENCE|SKILLS|CERTIFICATIONS|$)'
        match = re.search(edu_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            edu_section = match.group(2)

            # Look for degree keywords
            degree_pattern = r'(PhD|Ph\.D|Doctorate|Master|M\.S|M\.A|MBA|Bachelor|B\.S|B\.A|Associate|A\.A)'
            degrees = re.finditer(degree_pattern, edu_section, re.IGNORECASE)

            for degree_match in degrees:
                degree_text = degree_match.group(1).lower()
                degree_type = self._normalize_degree(degree_text)
                level = self.EDUCATION_LEVELS.get(degree_type, 3)

                # Try to extract school and year
                context = edu_section[max(0, degree_match.start()-100):degree_match.end()+200]
                year_match = re.search(r'\b(19|20)\d{2}\b', context)
                year = int(year_match.group(0)) if year_match else None

                education.append({
                    "degree": degree_type,
                    "level": level,
                    "school": "",  # Would extract from context
                    "year": year,
                    "field": ""  # Would extract from context
                })

        return education

    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications from text."""
        certifications = []

        # Common certification patterns
        cert_keywords = [
            "AWS Certified", "Azure Certified", "GCP Certified",
            "PMP", "CISSP", "CompTIA", "Certified Kubernetes",
            "Scrum Master", "Professional Engineer"
        ]

        for keyword in cert_keywords:
            if keyword.lower() in text.lower():
                certifications.append(keyword)

        return certifications

    def _extract_summary(self, text: str) -> str:
        """Extract professional summary."""
        # Look for summary section
        summary_pattern = r'(SUMMARY|PROFILE|OBJECTIVE|ABOUT)(.*?)(?=EXPERIENCE|SKILLS|EDUCATION|$)'
        match = re.search(summary_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            summary = match.group(2).strip()
            # Return first 500 characters
            return summary[:500]

        # If no summary section, take first paragraph
        first_para = text.split('\n\n')[0]
        return first_para[:500]

    def _normalize_degree(self, degree_text: str) -> str:
        """Normalize degree name to standard format."""
        degree_lower = degree_text.lower()

        if 'phd' in degree_lower or 'doctorate' in degree_lower:
            return 'phd'
        elif 'master' in degree_lower or 'm.s' in degree_lower or 'm.a' in degree_lower or 'mba' in degree_lower:
            return 'master'
        elif 'bachelor' in degree_lower or 'b.s' in degree_lower or 'b.a' in degree_lower:
            return 'bachelor'
        elif 'associate' in degree_lower:
            return 'associate'
        else:
            return 'bachelor'

    def _merge_data(self, base: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
        """Merge new data into base profile."""
        # Merge lists
        for key in ["skills", "experience", "education", "certifications", "keywords"]:
            if key in new and new[key]:
                if key not in base:
                    base[key] = []
                base[key].extend(new[key])

        # Merge skill categories
        if "skill_categories" in new:
            if "skill_categories" not in base:
                base["skill_categories"] = {}
            for category, skills in new["skill_categories"].items():
                if category not in base["skill_categories"]:
                    base["skill_categories"][category] = []
                base["skill_categories"][category].extend(skills)

        # Use longest summary
        if "summary" in new and new["summary"]:
            if not base.get("summary") or len(new["summary"]) > len(base["summary"]):
                base["summary"] = new["summary"]

        return base

    def _deduplicate_and_enrich(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Deduplicate data and calculate enriched fields."""
        # Deduplicate skills
        profile["skills"] = list(set(profile["skills"]))

        # Deduplicate skill categories
        for category in profile["skill_categories"]:
            profile["skill_categories"][category] = list(set(profile["skill_categories"][category]))

        # Calculate total experience
        total_months = sum(exp.get("duration_months", 0) for exp in profile["experience"])
        profile["total_experience_years"] = total_months / 12

        # Determine seniority level
        profile["seniority_level"] = self._determine_seniority(
            profile["total_experience_years"],
            profile["experience"]
        )

        # Extract industries
        profile["industries"] = list(set(
            exp.get("industry", "") for exp in profile["experience"] if exp.get("industry")
        ))

        # Determine highest education
        if profile["education"]:
            profile["highest_education_level"] = max(
                edu.get("level", 0) for edu in profile["education"]
            )
        else:
            profile["highest_education_level"] = 0

        return profile

    def _determine_seniority(self, years: float, experience: List[Dict[str, Any]]) -> str:
        """Determine seniority level based on experience."""
        # Check titles first
        for exp in experience[:2]:  # Check recent roles
            title = exp.get("title", "").lower()
            for level, keywords in self.SENIORITY_LEVELS.items():
                if any(keyword in title for keyword in keywords):
                    return level

        # Fall back to years of experience
        if years >= 10:
            return "senior"
        elif years >= 5:
            return "mid"
        elif years >= 2:
            return "mid"
        else:
            return "entry"

    def calculate_skill_depth(
        self,
        profile: Dict[str, Any],
        required_skills: List[str]
    ) -> Dict[str, float]:
        """
        Calculate depth of experience for required skills.

        Returns:
            Dictionary mapping skill to depth score (0-1)
        """
        skill_depth = {}
        profile_skills = set(s.lower() for s in profile.get("skills", []))

        for skill in required_skills:
            skill_lower = skill.lower()

            if skill_lower not in profile_skills:
                skill_depth[skill] = 0.0
                continue

            # Check if skill is mentioned in recent experience
            recent_exp = profile.get("experience", [])[:2]  # Last 2 jobs
            mentioned_recently = any(
                skill_lower in exp.get("description", "").lower()
                for exp in recent_exp
            )

            # Calculate depth based on years and recency
            if mentioned_recently and profile.get("total_experience_years", 0) >= 5:
                skill_depth[skill] = 1.0  # Expert level
            elif mentioned_recently:
                skill_depth[skill] = 0.8  # Proficient
            elif profile.get("total_experience_years", 0) >= 3:
                skill_depth[skill] = 0.6  # Intermediate
            else:
                skill_depth[skill] = 0.4  # Basic

        return skill_depth
