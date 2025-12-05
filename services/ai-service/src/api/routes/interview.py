"""
Interview preparation endpoints for AI Service.
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

logger = structlog.get_logger()

router = APIRouter()


# Request Models
class GenerateQuestionsRequest(BaseModel):
    """Request schema for generating interview questions."""

    job_title: str = Field(..., description="Job title")
    job_description: str = Field(..., description="Job description")
    company_name: str = Field(default="", description="Company name")
    question_types: List[str] = Field(
        default=["behavioral", "technical", "situational"],
        description="Types of questions to generate",
    )
    num_questions: int = Field(default=10, ge=3, le=30, description="Number of questions")
    difficulty: str = Field(default="medium", description="Difficulty: easy, medium, hard")


class AnalyzeFeedbackRequest(BaseModel):
    """Request schema for analyzing interview response."""

    question: str = Field(..., description="Interview question")
    answer: str = Field(..., description="Candidate's answer")
    question_type: str = Field(default="behavioral", description="Question type")
    job_context: str = Field(default="", description="Job context for relevance")


class PrepareTopicsRequest(BaseModel):
    """Request for generating key topics to prepare."""

    job_title: str = Field(..., description="Job title")
    job_description: str = Field(..., description="Job description")
    resume_summary: str = Field(default="", description="Candidate's resume summary")


# Response Models
class InterviewQuestion(BaseModel):
    """Interview question model."""

    question: str = Field(description="Question text")
    type: str = Field(description="Question type")
    difficulty: str = Field(description="Difficulty level")
    tips: List[str] = Field(description="Tips for answering")
    example_answer: str = Field(default="", description="Example answer structure")


class InterviewFeedback(BaseModel):
    """Interview response feedback."""

    overall_score: float = Field(ge=0.0, le=10.0, description="Overall score (0-10)")
    strengths: List[str] = Field(description="Strengths in the response")
    weaknesses: List[str] = Field(description="Areas for improvement")
    suggestions: List[str] = Field(description="Specific suggestions")
    improved_version: str = Field(description="Improved version of the answer")
    detailed_feedback: str = Field(description="Detailed feedback text")


class PrepareTopicsResponse(BaseModel):
    """Response with key preparation topics."""

    topics: List[Dict[str, Any]] = Field(description="Key topics to prepare")
    company_research: List[str] = Field(description="Company research suggestions")
    questions_to_ask: List[str] = Field(description="Questions candidate should ask")


# Endpoints
@router.post(
    "/questions",
    response_model=List[InterviewQuestion],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def generate_interview_questions(
    request: GenerateQuestionsRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> List[InterviewQuestion]:
    """
    Generate interview questions for job preparation.

    Args:
        request: Question generation request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        List of interview questions with tips
    """
    logger.info(
        "Generating interview questions",
        user_id=current_user.user_id,
        job_title=request.job_title,
        num_questions=request.num_questions,
    )

    try:
        # Build prompt
        prompt = f"""
Generate {request.num_questions} interview questions for this job position.

JOB TITLE: {request.job_title}
{f"COMPANY: {request.company_name}" if request.company_name else ""}
DIFFICULTY: {request.difficulty}

JOB DESCRIPTION:
{request.job_description}

QUESTION TYPES TO INCLUDE: {', '.join(request.question_types)}

For each question, provide:
1. The question text
2. Question type (behavioral, technical, situational)
3. Difficulty level
4. 2-3 tips for answering
5. Brief example answer structure

Format as:

Q1: [Question]
Type: [type]
Difficulty: [level]
Tips:
- [tip 1]
- [tip 2]
Example Structure: [structure]

Generate {request.num_questions} questions:
"""

        # Generate questions
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.8,
            max_tokens=2500,
        )

        # Parse questions (simplified parsing)
        questions = []
        current_question = {}
        current_field = None

        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Check for question start
            if line.startswith("Q") and ":" in line:
                if current_question:
                    # Save previous question
                    if "question" in current_question:
                        questions.append(
                            InterviewQuestion(
                                question=current_question.get("question", ""),
                                type=current_question.get("type", "general"),
                                difficulty=current_question.get("difficulty", "medium"),
                                tips=current_question.get("tips", []),
                                example_answer=current_question.get("example", ""),
                            )
                        )
                # Start new question
                current_question = {"question": line.split(":", 1)[1].strip(), "tips": []}
            elif line.startswith("Type:"):
                current_question["type"] = line.split(":", 1)[1].strip().lower()
            elif line.startswith("Difficulty:"):
                current_question["difficulty"] = line.split(":", 1)[1].strip().lower()
            elif line.startswith("Tips:"):
                current_field = "tips"
            elif line.startswith("Example Structure:"):
                current_question["example"] = line.split(":", 1)[1].strip()
            elif line.startswith("-") and current_field == "tips":
                current_question["tips"].append(line.lstrip("-").strip())

        # Add last question
        if current_question and "question" in current_question:
            questions.append(
                InterviewQuestion(
                    question=current_question.get("question", ""),
                    type=current_question.get("type", "general"),
                    difficulty=current_question.get("difficulty", "medium"),
                    tips=current_question.get("tips", []),
                    example_answer=current_question.get("example", ""),
                )
            )

        # Ensure we have some questions
        if not questions:
            # Fallback to basic parsing
            q_lines = [l for l in content.split("\n") if l.strip().startswith("Q")]
            questions = [
                InterviewQuestion(
                    question=line.split(":", 1)[1].strip() if ":" in line else line,
                    type="general",
                    difficulty=request.difficulty,
                    tips=["Use the STAR method", "Be specific and provide examples"],
                    example_answer="",
                )
                for line in q_lines[: request.num_questions]
            ]

        logger.info(
            "Interview questions generated successfully",
            user_id=current_user.user_id,
            questions_generated=len(questions),
        )

        return questions[: request.num_questions]

    except Exception as e:
        logger.error(
            "Failed to generate interview questions",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview questions: {str(e)}",
        )


@router.post(
    "/feedback",
    response_model=InterviewFeedback,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def analyze_interview_response(
    request: AnalyzeFeedbackRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> InterviewFeedback:
    """
    Analyze and provide feedback on interview response.

    Args:
        request: Feedback analysis request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Detailed feedback on the response
    """
    logger.info(
        "Analyzing interview response",
        user_id=current_user.user_id,
        question_type=request.question_type,
    )

    try:
        # Build analysis prompt
        prompt = f"""
Analyze this interview response and provide constructive feedback.

QUESTION: {request.question}
QUESTION TYPE: {request.question_type}
{f"JOB CONTEXT: {request.job_context}" if request.job_context else ""}

CANDIDATE'S ANSWER:
{request.answer}

Provide:
1. Overall score (0-10)
2. 3-5 strengths in the response
3. 3-5 weaknesses or areas for improvement
4. Specific suggestions for improvement
5. An improved version of the answer
6. Detailed feedback paragraph

Format:
Score: [0-10]

Strengths:
- [strength 1]
- [strength 2]

Weaknesses:
- [weakness 1]
- [weakness 2]

Suggestions:
- [suggestion 1]
- [suggestion 2]

Improved Version:
[improved answer]

Detailed Feedback:
[detailed paragraph]
"""

        # Generate feedback
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.5,
            max_tokens=2000,
        )

        # Parse feedback
        strengths = []
        weaknesses = []
        suggestions = []
        improved_version = ""
        detailed_feedback = ""
        score = 7.0  # Default

        current_section = None
        lines = content.split("\n")

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Detect sections
            if line.startswith("Score:"):
                try:
                    score_text = line.split(":", 1)[1].strip()
                    score = float(score_text.split("/")[0].strip())
                except (ValueError, IndexError):
                    score = 7.0
            elif "Strengths:" in line:
                current_section = "strengths"
            elif "Weaknesses:" in line:
                current_section = "weaknesses"
            elif "Suggestions:" in line:
                current_section = "suggestions"
            elif "Improved Version:" in line:
                current_section = "improved"
            elif "Detailed Feedback:" in line:
                current_section = "detailed"
            elif line.startswith("-"):
                item = line.lstrip("-").strip()
                if current_section == "strengths":
                    strengths.append(item)
                elif current_section == "weaknesses":
                    weaknesses.append(item)
                elif current_section == "suggestions":
                    suggestions.append(item)
            elif current_section == "improved":
                improved_version += line + " "
            elif current_section == "detailed":
                detailed_feedback += line + " "

        # Ensure we have some content
        if not strengths:
            strengths = ["Response addresses the question"]
        if not weaknesses:
            weaknesses = ["Could provide more specific examples"]
        if not suggestions:
            suggestions = ["Use the STAR method", "Add quantifiable results"]
        if not improved_version:
            improved_version = "Focus on specific examples with measurable outcomes."
        if not detailed_feedback:
            detailed_feedback = "The response shows understanding of the question and provides relevant information."

        logger.info(
            "Interview response analyzed successfully",
            user_id=current_user.user_id,
            score=score,
        )

        return InterviewFeedback(
            overall_score=min(max(score, 0.0), 10.0),
            strengths=strengths[:5],
            weaknesses=weaknesses[:5],
            suggestions=suggestions[:5],
            improved_version=improved_version.strip(),
            detailed_feedback=detailed_feedback.strip(),
        )

    except Exception as e:
        logger.error(
            "Failed to analyze interview response",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze interview response: {str(e)}",
        )


@router.post(
    "/prepare-topics",
    response_model=PrepareTopicsResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def prepare_interview_topics(
    request: PrepareTopicsRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> PrepareTopicsResponse:
    """
    Generate key topics and areas to prepare for interview.

    Args:
        request: Preparation request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Key preparation topics and suggestions
    """
    logger.info(
        "Generating interview preparation topics",
        user_id=current_user.user_id,
        job_title=request.job_title,
    )

    try:
        # Build prompt
        prompt = f"""
Create a comprehensive interview preparation guide for this position.

JOB TITLE: {request.job_title}
{f"CANDIDATE BACKGROUND: {request.resume_summary}" if request.resume_summary else ""}

JOB DESCRIPTION:
{request.job_description}

Provide:
1. 5-8 key technical/domain topics to prepare
2. 3-5 company research areas
3. 5-7 thoughtful questions the candidate should ask

Format:

Key Topics:
- Topic: [name]
  Why: [importance]
  How to prepare: [tips]

Company Research:
- [area 1]
- [area 2]

Questions to Ask:
- [question 1]
- [question 2]
"""

        # Generate content
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.7,
            max_tokens=2000,
        )

        # Parse response (simplified)
        topics = []
        company_research = []
        questions_to_ask = []

        current_section = None
        current_topic = {}

        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue

            if "Key Topics:" in line:
                current_section = "topics"
            elif "Company Research:" in line:
                current_section = "research"
            elif "Questions to Ask:" in line:
                current_section = "questions"
            elif line.startswith("-"):
                item = line.lstrip("-").strip()
                if current_section == "research":
                    company_research.append(item)
                elif current_section == "questions":
                    questions_to_ask.append(item)
            elif "Topic:" in line:
                if current_topic:
                    topics.append(current_topic)
                current_topic = {"name": line.split(":", 1)[1].strip()}
            elif "Why:" in line and current_topic:
                current_topic["importance"] = line.split(":", 1)[1].strip()
            elif "How to prepare:" in line and current_topic:
                current_topic["tips"] = line.split(":", 1)[1].strip()

        # Add last topic
        if current_topic and "name" in current_topic:
            topics.append(current_topic)

        # Ensure we have some content
        if not topics:
            topics = [
                {"name": "Core technical skills", "importance": "Essential for role", "tips": "Review fundamentals"}
            ]
        if not company_research:
            company_research = ["Company mission and values", "Recent news and developments"]
        if not questions_to_ask:
            questions_to_ask = ["What does success look like in this role?", "What are the team dynamics?"]

        logger.info(
            "Interview preparation topics generated successfully",
            user_id=current_user.user_id,
            topics_count=len(topics),
        )

        return PrepareTopicsResponse(
            topics=topics,
            company_research=company_research[:5],
            questions_to_ask=questions_to_ask[:7],
        )

    except Exception as e:
        logger.error(
            "Failed to generate preparation topics",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate preparation topics: {str(e)}",
        )
