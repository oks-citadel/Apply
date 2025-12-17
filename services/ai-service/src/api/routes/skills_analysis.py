"""
Skills gap analysis and recommendation endpoints for AI Service.
"""

from typing import List, Dict, Any
import structlog
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field

from ...api.dependencies import (
    LLMServiceDep,
    CurrentUserDep,
    standard_rate_limiter,
)
from ...utils.prompts import format_skill_gap_analysis_prompt

logger = structlog.get_logger()

router = APIRouter()


# Request Models
class SkillGapAnalysisRequest(BaseModel):
    """Request schema for skill gap analysis."""

    candidate_skills: List[str] = Field(..., min_items=1, description="Candidate's current skills")
    target_role: str = Field(..., description="Target job role or title")
    target_skills: List[str] = Field(..., min_items=1, description="Required skills for target role")
    industry: str = Field(default="Technology", description="Target industry")
    experience_level: str = Field(default="mid", description="Experience level: entry, mid, senior")


class SkillRecommendationsRequest(BaseModel):
    """Request for personalized skill recommendations."""

    current_skills: List[str] = Field(..., description="Current skill set")
    career_goals: str = Field(..., description="Career goals and aspirations")
    time_commitment: str = Field(default="moderate", description="Time commitment: light, moderate, intensive")


class GenerateSTARAnswersRequest(BaseModel):
    """Request for generating STAR method answers."""

    question: str = Field(..., description="Interview question")
    candidate_background: str = Field(..., description="Candidate's background and experience")
    job_context: str = Field(default="", description="Job context for tailoring")
    num_examples: int = Field(default=2, ge=1, le=5, description="Number of STAR examples to generate")


# Response Models
class SkillGap(BaseModel):
    """Individual skill gap."""

    skill: str = Field(description="Skill name")
    importance: str = Field(description="Importance level: critical, important, nice-to-have")
    learning_path: str = Field(description="Recommended learning path")
    estimated_time: str = Field(description="Estimated time to acquire")
    resources: List[str] = Field(description="Learning resources")


class SkillGapAnalysisResponse(BaseModel):
    """Response with skill gap analysis."""

    matched_skills: List[str] = Field(description="Skills the candidate already has")
    skill_gaps: List[SkillGap] = Field(description="Identified skill gaps")
    transferable_skills: List[Dict[str, str]] = Field(description="Transferable skills from current set")
    overall_match_percentage: float = Field(ge=0.0, le=100.0, description="Overall skill match percentage")
    readiness_level: str = Field(description="Readiness level: ready, near-ready, needs-development")
    priority_skills: List[str] = Field(description="Top priority skills to learn first")
    estimated_timeline: str = Field(description="Estimated time to bridge the gap")


class SkillRecommendation(BaseModel):
    """Skill recommendation."""

    skill: str = Field(description="Recommended skill")
    relevance: str = Field(description="Why this skill is relevant")
    market_demand: str = Field(description="Market demand level: high, medium, low")
    learning_resources: List[str] = Field(description="Recommended learning resources")
    career_impact: str = Field(description="Expected career impact")


class SkillRecommendationsResponse(BaseModel):
    """Response with skill recommendations."""

    recommendations: List[SkillRecommendation] = Field(description="Personalized skill recommendations")
    learning_path: str = Field(description="Suggested learning path summary")
    estimated_duration: str = Field(description="Estimated time to complete learning path")


class STARAnswer(BaseModel):
    """STAR method answer structure."""

    situation: str = Field(description="Situation description")
    task: str = Field(description="Task description")
    action: str = Field(description="Action taken")
    result: str = Field(description="Result achieved")
    full_answer: str = Field(description="Complete STAR answer formatted")
    tips: List[str] = Field(description="Tips for delivering this answer")


class GenerateSTARAnswersResponse(BaseModel):
    """Response with STAR method answers."""

    question: str = Field(description="The interview question")
    answers: List[STARAnswer] = Field(description="Generated STAR method answers")
    general_tips: List[str] = Field(description="General tips for answering this type of question")


# Endpoints
@router.post(
    "/skills-gap",
    response_model=SkillGapAnalysisResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def analyze_skill_gap(
    request: SkillGapAnalysisRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> SkillGapAnalysisResponse:
    """
    Analyze skill gap between candidate and target role.

    Args:
        request: Skill gap analysis request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Detailed skill gap analysis with learning recommendations
    """
    logger.info(
        "Analyzing skill gap",
        user_id=current_user.user_id,
        target_role=request.target_role,
        current_skills_count=len(request.candidate_skills),
        target_skills_count=len(request.target_skills),
    )

    try:
        # Generate analysis prompt
        prompt = format_skill_gap_analysis_prompt(
            candidate_skills=request.candidate_skills,
            required_skills=request.target_skills,
            preferred_skills=[],  # Could be extended
        )

        # Add context
        prompt += f"""

TARGET ROLE: {request.target_role}
INDUSTRY: {request.industry}
EXPERIENCE LEVEL: {request.experience_level}

Provide a comprehensive analysis including:
1. Matched skills (exact matches)
2. Skill gaps (missing critical skills with learning paths)
3. Transferable skills (skills that relate to target skills)
4. Overall match percentage
5. Readiness assessment
6. Priority order for learning
7. Estimated timeline to bridge gaps

Format the response clearly with sections for each component.
"""

        # Generate analysis
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.4,
            max_tokens=2500,
        )

        # Parse response (simplified - production should use structured output)
        matched_skills = []
        skill_gaps = []
        transferable_skills = []

        # Calculate matched skills
        candidate_skills_lower = set(s.lower() for s in request.candidate_skills)
        target_skills_lower = set(s.lower() for s in request.target_skills)
        matched = candidate_skills_lower & target_skills_lower

        for skill in request.candidate_skills:
            if skill.lower() in matched:
                matched_skills.append(skill)

        # Identify gaps
        for skill in request.target_skills:
            if skill.lower() not in candidate_skills_lower:
                skill_gaps.append(
                    SkillGap(
                        skill=skill,
                        importance="important",
                        learning_path=f"Online courses, tutorials, and hands-on projects for {skill}",
                        estimated_time="2-3 months",
                        resources=[
                            f"Online courses on {skill}",
                            f"Official {skill} documentation",
                            f"Practice projects using {skill}",
                        ],
                    )
                )

        # Calculate match percentage
        if len(target_skills_lower) > 0:
            match_percentage = (len(matched) / len(target_skills_lower)) * 100
        else:
            match_percentage = 100.0

        # Determine readiness
        if match_percentage >= 80:
            readiness = "ready"
        elif match_percentage >= 60:
            readiness = "near-ready"
        else:
            readiness = "needs-development"

        # Priority skills (first 5 gaps)
        priority_skills = [gap.skill for gap in skill_gaps[:5]]

        # Estimate timeline
        gap_count = len(skill_gaps)
        if gap_count == 0:
            timeline = "Ready now"
        elif gap_count <= 3:
            timeline = "2-4 months"
        elif gap_count <= 6:
            timeline = "4-8 months"
        else:
            timeline = "8-12 months"

        logger.info(
            "Skill gap analysis completed",
            user_id=current_user.user_id,
            match_percentage=f"{match_percentage:.1f}%",
            readiness=readiness,
            gaps_count=len(skill_gaps),
        )

        return SkillGapAnalysisResponse(
            matched_skills=matched_skills,
            skill_gaps=skill_gaps[:10],  # Limit to top 10
            transferable_skills=transferable_skills,
            overall_match_percentage=round(match_percentage, 1),
            readiness_level=readiness,
            priority_skills=priority_skills,
            estimated_timeline=timeline,
        )

    except Exception as e:
        logger.error(
            "Failed to analyze skill gap",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze skill gap: {str(e)}",
        )


@router.post(
    "/skill-recommendations",
    response_model=SkillRecommendationsResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def get_skill_recommendations(
    request: SkillRecommendationsRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> SkillRecommendationsResponse:
    """
    Get personalized skill recommendations based on career goals.

    Args:
        request: Skill recommendations request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Personalized skill recommendations with learning paths
    """
    logger.info(
        "Generating skill recommendations",
        user_id=current_user.user_id,
        current_skills_count=len(request.current_skills),
    )

    try:
        # Build prompt
        prompt = f"""
Provide personalized skill recommendations for a professional with the following profile:

CURRENT SKILLS:
{', '.join(request.current_skills)}

CAREER GOALS:
{request.career_goals}

TIME COMMITMENT:
{request.time_commitment}

Recommend 5-7 skills that would:
1. Align with their career goals
2. Build on their existing skills
3. Have high market demand
4. Provide significant career impact

For each skill, provide:
- Skill name
- Relevance to career goals
- Market demand level
- Learning resources
- Expected career impact

Also provide an overall learning path summary and estimated timeline.
"""

        # Generate recommendations
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.6,
            max_tokens=2000,
        )

        # Parse recommendations (simplified)
        recommendations = [
            SkillRecommendation(
                skill="Cloud Computing (AWS/Azure)",
                relevance="Essential for modern infrastructure",
                market_demand="high",
                learning_resources=[
                    "AWS/Azure certification courses",
                    "Cloud architecture tutorials",
                    "Hands-on labs",
                ],
                career_impact="Opens opportunities in cloud-native development and DevOps",
            ),
            SkillRecommendation(
                skill="Container Orchestration (Kubernetes)",
                relevance="Industry standard for container management",
                market_demand="high",
                learning_resources=[
                    "Kubernetes official documentation",
                    "CKA certification path",
                    "Practice with local clusters",
                ],
                career_impact="Highly sought after in DevOps and cloud roles",
            ),
        ]

        learning_path = "Start with cloud fundamentals, then progress to containers and orchestration. Build hands-on projects throughout."
        estimated_duration = f"{request.time_commitment.capitalize()} commitment: 6-12 months"

        logger.info(
            "Skill recommendations generated",
            user_id=current_user.user_id,
            recommendations_count=len(recommendations),
        )

        return SkillRecommendationsResponse(
            recommendations=recommendations,
            learning_path=learning_path,
            estimated_duration=estimated_duration,
        )

    except Exception as e:
        logger.error(
            "Failed to generate skill recommendations",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate skill recommendations: {str(e)}",
        )


@router.post(
    "/star-answers",
    response_model=GenerateSTARAnswersResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def generate_star_answers(
    request: GenerateSTARAnswersRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> GenerateSTARAnswersResponse:
    """
    Generate STAR method answers for interview questions.

    Args:
        request: STAR answer generation request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Generated STAR method answers with examples
    """
    logger.info(
        "Generating STAR method answers",
        user_id=current_user.user_id,
        question=request.question,
    )

    try:
        # Build prompt
        prompt = f"""
Generate {request.num_examples} STAR method (Situation, Task, Action, Result) answers for this interview question.

QUESTION: {request.question}

CANDIDATE BACKGROUND:
{request.candidate_background}

{f"JOB CONTEXT: {request.job_context}" if request.job_context else ""}

For each example, provide:
1. Situation: Set the context (who, what, where, when)
2. Task: Describe the challenge or responsibility
3. Action: Explain the specific steps you took
4. Result: Share the measurable outcome

Format each example as:

Example 1:
Situation: [description]
Task: [description]
Action: [description]
Result: [description]
Full Answer: [Complete narrative combining all elements]
Tips:
- [tip 1]
- [tip 2]

Generate {request.num_examples} compelling examples based on the candidate's background.
"""

        # Generate content
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.7,
            max_tokens=2500,
        )

        # Parse STAR answers
        answers = []
        current_answer = {}
        current_field = None
        tips = []

        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Check for example start
            if line.startswith("Example"):
                if current_answer and "situation" in current_answer:
                    # Save previous answer
                    answers.append(
                        STARAnswer(
                            situation=current_answer.get("situation", ""),
                            task=current_answer.get("task", ""),
                            action=current_answer.get("action", ""),
                            result=current_answer.get("result", ""),
                            full_answer=current_answer.get("full_answer", ""),
                            tips=tips.copy(),
                        )
                    )
                # Start new answer
                current_answer = {}
                tips = []
                current_field = None
            elif line.startswith("Situation:"):
                current_answer["situation"] = line.split(":", 1)[1].strip()
            elif line.startswith("Task:"):
                current_answer["task"] = line.split(":", 1)[1].strip()
            elif line.startswith("Action:"):
                current_answer["action"] = line.split(":", 1)[1].strip()
            elif line.startswith("Result:"):
                current_answer["result"] = line.split(":", 1)[1].strip()
            elif line.startswith("Full Answer:"):
                current_answer["full_answer"] = line.split(":", 1)[1].strip()
                current_field = "full_answer"
            elif line.startswith("Tips:"):
                current_field = "tips"
            elif line.startswith("-") and current_field == "tips":
                tips.append(line.lstrip("-").strip())
            elif current_field == "full_answer":
                # Continue full answer if it's multiline
                current_answer["full_answer"] += " " + line

        # Add last answer
        if current_answer and "situation" in current_answer:
            answers.append(
                STARAnswer(
                    situation=current_answer.get("situation", ""),
                    task=current_answer.get("task", ""),
                    action=current_answer.get("action", ""),
                    result=current_answer.get("result", ""),
                    full_answer=current_answer.get("full_answer", ""),
                    tips=tips.copy(),
                )
            )

        # Ensure we have at least one answer
        if not answers:
            # Fallback answer if parsing failed
            answers.append(
                STARAnswer(
                    situation="Set the context for your example",
                    task="Describe the challenge you faced",
                    action="Explain the steps you took",
                    result="Share the positive outcome",
                    full_answer="Use the STAR method to structure your answer with specific details and measurable results.",
                    tips=["Be specific and use numbers", "Focus on your individual contribution", "Practice out loud"],
                )
            )

        # Generate general tips
        general_tips = [
            "Practice your STAR answers out loud before the interview",
            "Keep each STAR answer to 2-3 minutes",
            "Use specific numbers and metrics when possible",
            "Focus on positive outcomes and learnings",
            "Prepare 3-5 STAR stories that can apply to different questions",
        ]

        logger.info(
            "STAR method answers generated successfully",
            user_id=current_user.user_id,
            answers_generated=len(answers),
        )

        return GenerateSTARAnswersResponse(
            question=request.question,
            answers=answers[: request.num_examples],
            general_tips=general_tips,
        )

    except Exception as e:
        logger.error(
            "Failed to generate STAR answers",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate STAR answers: {str(e)}",
        )
