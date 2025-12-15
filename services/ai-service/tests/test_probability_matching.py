"""
Tests for interview probability matching engine.
"""

import pytest
from datetime import datetime
from src.models.interview_probability_matcher import InterviewProbabilityMatcher
from src.models.profile_parser import ProfileParser
from src.models.feedback_learning import FeedbackLearningSystem
from src.models.database_models import (
    SubscriptionTier,
    OutcomeType,
    TrainingDataPoint
)


@pytest.fixture
def sample_resume():
    """Sample resume text."""
    return """
    John Doe
    Senior Software Engineer
    john.doe@email.com | (555) 123-4567

    SUMMARY
    Experienced software engineer with 7 years of expertise in Python, AWS, and Docker.
    Proven track record of building scalable systems and leading development teams.

    EXPERIENCE
    Senior Software Engineer | Tech Corp | 2020 - Present
    - Led development of microservices architecture serving 10M+ users
    - Implemented CI/CD pipelines using Docker and Kubernetes
    - Mentored team of 5 junior developers

    Software Engineer | StartupXYZ | 2017 - 2020
    - Built REST APIs using Python Flask and PostgreSQL
    - Deployed applications on AWS (EC2, S3, RDS)
    - Reduced system latency by 40% through optimization

    SKILLS
    Python, JavaScript, AWS, Docker, Kubernetes, PostgreSQL, Redis, React

    EDUCATION
    Bachelor of Science in Computer Science | MIT | 2017
    """


@pytest.fixture
def sample_job_requirements():
    """Sample job requirements."""
    return {
        "id": "job_123",
        "title": "Senior Backend Engineer",
        "company": "TechCo",
        "description": "Looking for a senior backend engineer with Python and AWS experience...",
        "required_skills": ["Python", "AWS", "Docker"],
        "preferred_skills": ["Kubernetes", "PostgreSQL"],
        "min_experience_years": 5,
        "max_experience_years": 10,
        "seniority_level": "senior",
        "industry": "Technology",
        "education_level": 3
    }


@pytest.fixture
def matcher():
    """Create matcher instance."""
    return InterviewProbabilityMatcher()


@pytest.fixture
def parser():
    """Create parser instance."""
    return ProfileParser()


@pytest.fixture
def learning_system():
    """Create learning system instance."""
    return FeedbackLearningSystem()


class TestProfileParser:
    """Tests for profile parser."""

    def test_parse_resume(self, parser, sample_resume):
        """Test resume parsing."""
        profile = parser.parse_profile(resume_text=sample_resume)

        assert profile is not None
        assert "skills" in profile
        assert "experience" in profile
        assert "education" in profile

        # Check skills extracted
        skills_lower = [s.lower() for s in profile["skills"]]
        assert "python" in skills_lower
        assert "aws" in skills_lower
        assert "docker" in skills_lower

        # Check experience
        assert profile["total_experience_years"] > 0
        assert len(profile["experience"]) > 0

        # Check seniority
        assert profile["seniority_level"] in ["entry", "mid", "senior", "lead", "executive"]

    def test_skill_depth_calculation(self, parser, sample_resume):
        """Test skill depth calculation."""
        profile = parser.parse_profile(resume_text=sample_resume)

        required_skills = ["Python", "AWS", "Docker", "Kubernetes"]
        skill_depths = parser.calculate_skill_depth(profile, required_skills)

        assert isinstance(skill_depths, dict)
        assert "Python" in skill_depths
        assert skill_depths["Python"] > 0.5  # Should have good depth
        assert 0.0 <= skill_depths["Docker"] <= 1.0

    def test_parse_linkedin_profile(self, parser):
        """Test LinkedIn profile parsing."""
        linkedin_data = {
            "skills": ["Python", "AWS", "Machine Learning"],
            "experience": [
                {
                    "title": "Senior Engineer",
                    "company": "TechCo",
                    "duration_months": 36,
                    "description": "Backend development",
                    "industry": "Technology"
                }
            ],
            "education": [
                {
                    "degree": "Bachelor's",
                    "field": "Computer Science",
                    "school": "MIT",
                    "year": 2017
                }
            ]
        }

        profile = parser.parse_profile(linkedin_profile=linkedin_data)

        assert "python" in [s.lower() for s in profile["skills"]]
        assert len(profile["experience"]) > 0


class TestInterviewProbabilityMatcher:
    """Tests for probability matcher."""

    @pytest.mark.asyncio
    async def test_calculate_probability(
        self,
        matcher,
        sample_resume,
        sample_job_requirements
    ):
        """Test probability calculation."""
        result = await matcher.calculate_probability(
            user_id="user_123",
            job_id="job_456",
            job_requirements=sample_job_requirements,
            resume_text=sample_resume,
            subscription_tier="professional"
        )

        assert result is not None
        assert 0.0 <= result.interview_probability <= 1.0
        assert 0.0 <= result.offer_probability <= 1.0
        assert 0.0 <= result.overall_score <= 100.0

        # Check component scores
        assert 0.0 <= result.skill_depth_score <= 1.0
        assert 0.0 <= result.experience_relevance_score <= 1.0
        assert 0.0 <= result.seniority_match_score <= 1.0

        # Check threshold
        assert isinstance(result.threshold_met, bool)

    @pytest.mark.asyncio
    async def test_high_match_probability(
        self,
        matcher,
        sample_resume,
        sample_job_requirements
    ):
        """Test that good match produces high probability."""
        # Perfect match scenario
        result = await matcher.calculate_probability(
            user_id="user_123",
            job_id="job_456",
            job_requirements=sample_job_requirements,
            resume_text=sample_resume,
            subscription_tier="professional"
        )

        # Should have reasonable probability due to skill match
        assert result.interview_probability > 0.5

        # Should have some strengths identified
        assert len(result.strengths) > 0

    @pytest.mark.asyncio
    async def test_low_match_probability(self, matcher):
        """Test that poor match produces low probability."""
        # Mismatched resume
        poor_resume = """
        Jane Smith
        Junior Designer
        2 years experience in Photoshop and Illustrator
        """

        # Senior engineering job
        job_reqs = {
            "title": "Senior Backend Engineer",
            "required_skills": ["Python", "AWS", "Docker"],
            "min_experience_years": 5,
            "seniority_level": "senior",
            "description": "Senior backend engineer role"
        }

        result = await matcher.calculate_probability(
            user_id="user_123",
            job_id="job_456",
            job_requirements=job_reqs,
            resume_text=poor_resume,
            subscription_tier="professional"
        )

        # Should have low probability
        assert result.interview_probability < 0.6

        # Should have gaps identified
        assert len(result.critical_gaps) > 0

    @pytest.mark.asyncio
    async def test_explain_match(
        self,
        matcher,
        sample_resume,
        sample_job_requirements
    ):
        """Test match explanation generation."""
        # First calculate probability
        result = await matcher.calculate_probability(
            user_id="user_123",
            job_id="job_456",
            job_requirements=sample_job_requirements,
            resume_text=sample_resume,
            subscription_tier="professional"
        )

        # Then get explanation
        explanation = await matcher.explain_match(result.id)

        assert explanation is not None
        assert len(explanation.summary) > 0
        assert len(explanation.detailed_reasoning) > 0
        assert len(explanation.skill_analysis) > 0
        assert len(explanation.experience_analysis) > 0
        assert len(explanation.improvement_recommendations) > 0
        assert len(explanation.application_tips) > 0

        assert 0.0 <= explanation.confidence_score <= 1.0

    @pytest.mark.asyncio
    async def test_find_matches(
        self,
        matcher,
        sample_resume
    ):
        """Test finding top matches."""
        jobs = [
            {
                "id": "job_1",
                "title": "Senior Python Developer",
                "required_skills": ["Python", "AWS"],
                "min_experience_years": 5,
                "seniority_level": "senior",
                "description": "Python development"
            },
            {
                "id": "job_2",
                "title": "Junior Designer",
                "required_skills": ["Photoshop", "Illustrator"],
                "min_experience_years": 1,
                "seniority_level": "entry",
                "description": "Design role"
            },
            {
                "id": "job_3",
                "title": "DevOps Engineer",
                "required_skills": ["Docker", "Kubernetes", "AWS"],
                "min_experience_years": 5,
                "seniority_level": "senior",
                "description": "DevOps role"
            }
        ]

        matches = await matcher.find_matches(
            user_id="user_123",
            jobs=jobs,
            resume_text=sample_resume,
            subscription_tier="professional",
            top_k=10
        )

        assert isinstance(matches, list)
        assert len(matches) > 0

        # Should be sorted by probability
        if len(matches) > 1:
            for i in range(len(matches) - 1):
                assert matches[i].interview_probability >= matches[i + 1].interview_probability

    def test_subscription_tier_thresholds(self, matcher):
        """Test that different tiers have correct thresholds."""
        assert matcher.TIER_THRESHOLDS[SubscriptionTier.FREEMIUM] == 0.80
        assert matcher.TIER_THRESHOLDS[SubscriptionTier.STARTER] == 0.70
        assert matcher.TIER_THRESHOLDS[SubscriptionTier.BASIC] == 0.65
        assert matcher.TIER_THRESHOLDS[SubscriptionTier.PROFESSIONAL] == 0.60
        assert matcher.TIER_THRESHOLDS[SubscriptionTier.PREMIUM] == 0.55
        assert matcher.TIER_THRESHOLDS[SubscriptionTier.ELITE] == 0.55

    def test_record_feedback(
        self,
        matcher,
        sample_resume,
        sample_job_requirements
    ):
        """Test feedback recording."""
        # First create a match
        import asyncio
        result = asyncio.run(matcher.calculate_probability(
            user_id="user_123",
            job_id="job_456",
            job_requirements=sample_job_requirements,
            resume_text=sample_resume,
            subscription_tier="professional"
        ))

        # Record feedback
        feedback = matcher.record_feedback(
            match_id=result.id,
            outcome=OutcomeType.INTERVIEW,
            user_id="user_123",
            job_id="job_456",
            applied_at=datetime.utcnow(),
            interview_rounds=3,
            offer_received=True,
            user_rating=4.5
        )

        assert feedback is not None
        assert feedback.match_id == result.id
        assert feedback.actual_outcome == OutcomeType.INTERVIEW
        assert feedback.predicted_probability == result.interview_probability
        assert feedback.use_for_training is True

        # Check training data was created
        assert len(matcher.training_data) > 0


class TestFeedbackLearningSystem:
    """Tests for feedback learning system."""

    def test_prepare_training_data(self, learning_system):
        """Test training data preparation."""
        data_points = [
            TrainingDataPoint(
                skill_overlap=0.8,
                skill_depth=0.7,
                experience_years=5,
                seniority_gap=0,
                industry_match=True,
                education_level=3,
                education_match=True,
                keyword_density=0.6,
                recent_experience_relevance=0.8,
                company_size_match=True,
                location_match=True,
                outcome_score=1.0,
                weight=1.0,
                source="test"
            ),
            TrainingDataPoint(
                skill_overlap=0.3,
                skill_depth=0.2,
                experience_years=2,
                seniority_gap=-2,
                industry_match=False,
                education_level=2,
                education_match=False,
                keyword_density=0.2,
                recent_experience_relevance=0.3,
                company_size_match=False,
                location_match=False,
                outcome_score=0.0,
                weight=1.0,
                source="test"
            )
        ]

        X, y, weights = learning_system.prepare_training_data(data_points)

        assert X.shape[0] == 2  # 2 samples
        assert X.shape[1] == 11  # 11 features
        assert y.shape[0] == 2
        assert weights.shape[0] == 2

        # Check normalization
        assert all(0.0 <= x <= 1.0 for x in X[0])

    def test_train_model(self, learning_system):
        """Test model training."""
        # Create synthetic training data
        data_points = []

        for i in range(100):
            # Create varied samples
            skill_overlap = np.random.random()
            outcome = 1.0 if skill_overlap > 0.6 else 0.0

            data_points.append(
                TrainingDataPoint(
                    skill_overlap=skill_overlap,
                    skill_depth=np.random.random(),
                    experience_years=int(np.random.random() * 15),
                    seniority_gap=int(np.random.random() * 5) - 2,
                    industry_match=np.random.random() > 0.5,
                    education_level=int(np.random.random() * 5) + 1,
                    education_match=np.random.random() > 0.5,
                    keyword_density=np.random.random(),
                    recent_experience_relevance=np.random.random(),
                    company_size_match=np.random.random() > 0.5,
                    location_match=np.random.random() > 0.5,
                    outcome_score=outcome,
                    weight=1.0,
                    source="synthetic"
                )
            )

        metrics = learning_system.train(data_points)

        assert metrics is not None
        assert 0.0 <= metrics.accuracy <= 1.0
        assert 0.0 <= metrics.auc_roc <= 1.0
        assert learning_system.is_trained is True

    def test_predict_probability(self, learning_system):
        """Test probability prediction."""
        # Train first
        data_points = []
        for i in range(50):
            skill = np.random.random()
            data_points.append(
                TrainingDataPoint(
                    skill_overlap=skill,
                    skill_depth=skill,
                    experience_years=5,
                    seniority_gap=0,
                    industry_match=True,
                    education_level=3,
                    education_match=True,
                    keyword_density=0.5,
                    recent_experience_relevance=0.7,
                    company_size_match=True,
                    location_match=True,
                    outcome_score=1.0 if skill > 0.6 else 0.0,
                    weight=1.0,
                    source="test"
                )
            )

        learning_system.train(data_points)

        # Predict
        features = {
            "skill_overlap": 0.9,
            "skill_depth": 0.8,
            "experience_years": 7,
            "seniority_gap": 0,
            "industry_match": True,
            "education_level": 3,
            "education_match": True,
            "keyword_density": 0.7,
            "recent_experience_relevance": 0.8,
            "company_size_match": True,
            "location_match": True
        }

        probability = learning_system.predict_probability(features)

        assert 0.0 <= probability <= 1.0

    def test_get_prediction_confidence(self, learning_system):
        """Test prediction confidence calculation."""
        # Without training
        confidence = learning_system.get_prediction_confidence({})
        assert confidence == 0.5

        # After training
        data_points = []
        for i in range(30):
            data_points.append(
                TrainingDataPoint(
                    skill_overlap=0.8,
                    skill_depth=0.7,
                    experience_years=5,
                    seniority_gap=0,
                    industry_match=True,
                    education_level=3,
                    education_match=True,
                    keyword_density=0.6,
                    recent_experience_relevance=0.7,
                    company_size_match=True,
                    location_match=True,
                    outcome_score=1.0,
                    weight=1.0,
                    source="test"
                )
            )

        learning_system.train(data_points)

        features = {
            "skill_overlap": 0.9,
            "skill_depth": 0.8,
            "experience_years": 5
        }

        confidence = learning_system.get_prediction_confidence(features)
        assert 0.0 <= confidence <= 1.0


# Import numpy for tests
import numpy as np


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
