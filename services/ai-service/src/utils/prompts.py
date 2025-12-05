"""
LLM prompt templates for AI Service.
"""

from typing import Dict, List, Any


# Resume Optimization Prompts
OPTIMIZE_RESUME_PROMPT = """
You are an expert resume writer and ATS optimization specialist. Optimize the following resume for the target job posting.

RESUME:
{resume_content}

TARGET JOB:
{job_description}

OPTIMIZATION LEVEL: {optimization_level}

Instructions:
1. Incorporate relevant keywords from the job description naturally
2. Quantify achievements with metrics where possible
3. Tailor the language to match the job requirements
4. Maintain authenticity - do not fabricate information
5. Ensure ATS compatibility with clear formatting
6. Focus on relevant experience and skills

Provide the optimized resume in the same format as the original, with improvements highlighted.
"""


GENERATE_SUMMARY_PROMPT = """
Generate a professional resume summary for a candidate with the following profile:

PROFILE:
- Job Title: {title}
- Years of Experience: {years_experience}
- Key Skills: {skills}
- Industry: {industry}

TARGET JOB:
{job_description}

Write a compelling 2-3 sentence professional summary that:
1. Highlights relevant experience and expertise
2. Incorporates key skills from the target job
3. Shows value proposition
4. Uses action-oriented language
5. Is ATS-friendly

Generate 3 alternative versions with different tones: professional, dynamic, and results-focused.
"""


ENHANCE_ACHIEVEMENTS_PROMPT = """
Enhance the following work achievements to be more impactful and quantifiable:

ACHIEVEMENTS:
{achievements}

CONTEXT:
- Role: {role}
- Company: {company}
- Industry: {industry}

Instructions:
1. Add metrics and quantifiable results where appropriate
2. Use strong action verbs
3. Focus on business impact
4. Follow the STAR method (Situation, Task, Action, Result)
5. Keep each achievement to 1-2 lines
6. Maintain truthfulness - enhance but don't fabricate

Provide enhanced versions of each achievement.
"""


ATS_ANALYSIS_PROMPT = """
Analyze this resume for ATS (Applicant Tracking System) compatibility against the job description:

RESUME:
{resume_content}

JOB DESCRIPTION:
{job_description}

Analyze:
1. Keyword matching (required vs. present)
2. Format compatibility
3. Section completeness
4. Skills alignment
5. Experience relevance

Provide:
- Overall ATS score (0-100)
- Keyword match percentage
- Missing critical keywords
- Formatting issues
- Specific recommendations for improvement
"""


# Job Matching Prompts
EXPLAIN_MATCH_PROMPT = """
Explain why this candidate matches (or doesn't match) the job posting:

CANDIDATE:
{candidate_profile}

JOB POSTING:
{job_posting}

MATCH SCORES:
- Overall: {overall_score}
- Skills: {skill_score}
- Experience: {experience_score}
- Location: {location_score}
- Culture: {culture_score}

Provide a clear, concise explanation (2-3 paragraphs) that:
1. Highlights key strengths and alignments
2. Identifies any gaps or mismatches
3. Assesses overall fit
4. Gives an honest recommendation

Be objective and balanced in your assessment.
"""


CULTURE_FIT_PROMPT = """
Assess the cultural fit between the candidate's preferences and the company culture:

CANDIDATE PREFERENCES:
{candidate_preferences}

COMPANY CULTURE:
{company_culture}

Evaluate alignment on:
1. Work style and environment
2. Values and mission
3. Team dynamics
4. Growth and learning opportunities
5. Work-life balance

Provide a culture fit score (0.0-1.0) and explanation.
"""


# Skill Analysis Prompts
EXTRACT_SKILLS_PROMPT = """
Extract all skills from the following text and categorize them:

TEXT:
{text}

Categorize skills into:
1. Technical Skills (programming languages, tools, technologies)
2. Soft Skills (communication, leadership, etc.)
3. Domain Skills (industry-specific knowledge)
4. Certifications

For each skill, also infer proficiency level if mentioned (beginner, intermediate, advanced, expert).

Return as structured data.
"""


SKILL_GAP_ANALYSIS_PROMPT = """
Analyze the skill gap between the candidate and job requirements:

CANDIDATE SKILLS:
{candidate_skills}

REQUIRED SKILLS:
{required_skills}

PREFERRED SKILLS:
{preferred_skills}

Provide:
1. Matched skills (exact and related)
2. Missing critical skills
3. Transferable skills
4. Learning recommendations
5. Overall skill match percentage

Be constructive and focus on growth opportunities.
"""


# Salary Prediction Prompts
SALARY_CONTEXT_PROMPT = """
Provide market context for this salary prediction:

PREDICTION: ${predicted_salary}
RANGE: ${min_salary} - ${max_salary}
JOB: {job_title} in {location}
EXPERIENCE: {years_experience} years
INDUSTRY: {industry}

Context to include:
1. How this compares to market average
2. Key factors influencing the prediction
3. Regional variations
4. Industry trends
5. Growth trajectory

Write 2-3 paragraphs of actionable market context.
"""


# Bias Detection Prompts
DETECT_BIAS_PROMPT = """
Analyze the following text for potential bias or discriminatory language:

TEXT:
{text}

Check for bias related to:
1. Age
2. Gender
3. Race/ethnicity
4. Disability
5. Religion
6. Sexual orientation
7. Socioeconomic status

For each detected issue:
- Quote the problematic text
- Explain the concern
- Suggest inclusive alternatives

Be thorough but not overly sensitive. Focus on clear violations of fair hiring practices.
"""


AUDIT_JOB_POSTING_PROMPT = """
Audit this job posting for inclusivity and fairness:

JOB POSTING:
{job_posting}

Evaluate:
1. Language inclusivity
2. Requirement necessity (avoid unnecessary barriers)
3. Salary transparency
4. Accessibility
5. Equal opportunity indicators

Provide:
- Fairness score (0-100)
- Specific issues found
- Recommendations for improvement
- Positive aspects

Be constructive and actionable.
"""


# Resume Parsing Prompts
PARSE_RESUME_PROMPT = """
Parse the following resume and extract structured information:

RESUME:
{resume_content}

Extract:
1. Contact Information (name, email, phone, location, LinkedIn, etc.)
2. Professional Summary
3. Work Experience (company, title, dates, responsibilities, achievements)
4. Education (degree, institution, year, GPA if mentioned)
5. Skills (categorized)
6. Certifications
7. Languages
8. Projects (if mentioned)

Return structured data with confidence scores for each section.
"""


# Helper Functions
def format_resume_optimization_prompt(
    resume_content: str, job_description: str, optimization_level: str = "moderate"
) -> str:
    """Format resume optimization prompt."""
    return OPTIMIZE_RESUME_PROMPT.format(
        resume_content=resume_content,
        job_description=job_description,
        optimization_level=optimization_level,
    )


def format_summary_generation_prompt(
    title: str,
    years_experience: int,
    skills: List[str],
    industry: str,
    job_description: str = "",
) -> str:
    """Format summary generation prompt."""
    return GENERATE_SUMMARY_PROMPT.format(
        title=title,
        years_experience=years_experience,
        skills=", ".join(skills),
        industry=industry,
        job_description=job_description or "General",
    )


def format_achievement_enhancement_prompt(
    achievements: List[str], role: str, company: str, industry: str
) -> str:
    """Format achievement enhancement prompt."""
    return ENHANCE_ACHIEVEMENTS_PROMPT.format(
        achievements="\n".join(f"- {a}" for a in achievements),
        role=role,
        company=company,
        industry=industry,
    )


def format_ats_analysis_prompt(resume_content: str, job_description: str) -> str:
    """Format ATS analysis prompt."""
    return ATS_ANALYSIS_PROMPT.format(
        resume_content=resume_content, job_description=job_description
    )


def format_match_explanation_prompt(
    candidate_profile: Dict[str, Any],
    job_posting: Dict[str, Any],
    scores: Dict[str, float],
) -> str:
    """Format match explanation prompt."""
    return EXPLAIN_MATCH_PROMPT.format(
        candidate_profile=str(candidate_profile),
        job_posting=str(job_posting),
        overall_score=scores.get("overall", 0),
        skill_score=scores.get("skills", 0),
        experience_score=scores.get("experience", 0),
        location_score=scores.get("location", 0),
        culture_score=scores.get("culture", 0),
    )


def format_culture_fit_prompt(
    candidate_preferences: Dict[str, Any], company_culture: Dict[str, Any]
) -> str:
    """Format culture fit assessment prompt."""
    return CULTURE_FIT_PROMPT.format(
        candidate_preferences=str(candidate_preferences),
        company_culture=str(company_culture),
    )


def format_skill_extraction_prompt(text: str) -> str:
    """Format skill extraction prompt."""
    return EXTRACT_SKILLS_PROMPT.format(text=text)


def format_skill_gap_analysis_prompt(
    candidate_skills: List[str],
    required_skills: List[str],
    preferred_skills: List[str],
) -> str:
    """Format skill gap analysis prompt."""
    return SKILL_GAP_ANALYSIS_PROMPT.format(
        candidate_skills=", ".join(candidate_skills),
        required_skills=", ".join(required_skills),
        preferred_skills=", ".join(preferred_skills),
    )


def format_salary_context_prompt(
    predicted_salary: float,
    min_salary: float,
    max_salary: float,
    job_title: str,
    location: str,
    years_experience: int,
    industry: str,
) -> str:
    """Format salary context prompt."""
    return SALARY_CONTEXT_PROMPT.format(
        predicted_salary=predicted_salary,
        min_salary=min_salary,
        max_salary=max_salary,
        job_title=job_title,
        location=location,
        years_experience=years_experience,
        industry=industry,
    )


def format_bias_detection_prompt(text: str) -> str:
    """Format bias detection prompt."""
    return DETECT_BIAS_PROMPT.format(text=text)


def format_job_audit_prompt(job_posting: str) -> str:
    """Format job posting audit prompt."""
    return AUDIT_JOB_POSTING_PROMPT.format(job_posting=job_posting)


def format_resume_parsing_prompt(resume_content: str) -> str:
    """Format resume parsing prompt."""
    return PARSE_RESUME_PROMPT.format(resume_content=resume_content)
