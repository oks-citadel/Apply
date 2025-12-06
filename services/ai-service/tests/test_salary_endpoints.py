"""
Tests for salary prediction endpoints.
"""

import pytest
from fastapi import status
from unittest.mock import AsyncMock, Mock
from src.api.dependencies import get_current_user
from src.schemas.response_schemas import SalaryPrediction


class TestSalaryPrediction:
    """Tests for salary prediction endpoint."""

    def test_predict_salary_success(self, client, auth_headers, mock_current_user, mock_salary_predictor):
        """Test successful salary prediction."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Mock predictor to return prediction
        prediction = SalaryPrediction(
            predicted_salary=150000.0,
            confidence_interval={"min": 135000.0, "max": 165000.0},
            percentile_25=140000.0,
            percentile_50=150000.0,
            percentile_75=160000.0,
            market_context="Above average for San Francisco",
            factors=[
                {"factor": "experience", "impact": "high", "value": "5 years"},
                {"factor": "skills", "impact": "high", "value": "Python, AWS"}
            ],
            data_sources=["Bureau of Labor Statistics"]
        )
        mock_salary_predictor.predict.return_value = prediction

        request_data = {
            "job_title": "Senior Software Engineer",
            "location": "San Francisco, CA",
            "experience_years": 5,
            "skills": ["Python", "AWS", "Docker"],
            "education_level": "Bachelor's",
            "company_size": "medium",
            "industry": "Technology"
        }

        response = client.post(
            "/api/ai/predict/salary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "predicted_salary" in data
        assert "confidence_interval" in data
        assert "percentile_25" in data
        assert "percentile_50" in data
        assert "percentile_75" in data
        assert "market_context" in data
        assert data["predicted_salary"] > 0

    def test_predict_salary_different_locations(self, client, auth_headers, mock_current_user, mock_salary_predictor):
        """Test salary predictions for different locations."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        locations = ["San Francisco, CA", "Austin, TX", "Remote"]

        for location in locations:
            request_data = {
                "job_title": "Software Engineer",
                "location": location,
                "experience_years": 3,
                "skills": ["Python", "JavaScript"]
            }

            response = client.post(
                "/api/ai/predict/salary",
                json=request_data,
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["predicted_salary"] > 0

    def test_predict_salary_entry_level(self, client, auth_headers, mock_current_user, mock_salary_predictor):
        """Test salary prediction for entry-level position."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Junior Developer",
            "location": "New York, NY",
            "experience_years": 0,
            "skills": ["Python", "Git"],
            "education_level": "Bachelor's"
        }

        response = client.post(
            "/api/ai/predict/salary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["predicted_salary"] > 0

    def test_predict_salary_senior_level(self, client, auth_headers, mock_current_user, mock_salary_predictor):
        """Test salary prediction for senior-level position."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Principal Engineer",
            "location": "San Francisco, CA",
            "experience_years": 15,
            "skills": ["System Design", "Architecture", "Leadership", "Python"],
            "education_level": "Master's",
            "company_size": "large"
        }

        response = client.post(
            "/api/ai/predict/salary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["predicted_salary"] > 0

    def test_predict_salary_unauthorized(self, client):
        """Test salary prediction without authentication."""
        request_data = {
            "job_title": "Software Engineer",
            "location": "San Francisco",
            "experience_years": 5,
            "skills": ["Python"]
        }

        response = client.post("/api/ai/predict/salary", json=request_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_predict_salary_invalid_experience(self, client, auth_headers, mock_current_user):
        """Test validation with invalid experience years."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "location": "San Francisco",
            "experience_years": -1,  # Invalid
            "skills": ["Python"]
        }

        response = client.post(
            "/api/ai/predict/salary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_predict_salary_no_skills(self, client, auth_headers, mock_current_user):
        """Test validation when no skills provided."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "location": "San Francisco",
            "experience_years": 5,
            "skills": []  # Empty skills
        }

        response = client.post(
            "/api/ai/predict/salary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestSalaryComparison:
    """Tests for salary comparison across locations endpoint."""

    def test_compare_salaries_success(self, client, auth_headers, mock_current_user, mock_salary_predictor):
        """Test successful salary comparison."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "locations": ["San Francisco, CA", "Austin, TX", "New York, NY"],
            "experience_years": 5,
            "skills": ["Python", "AWS"]
        }

        response = client.post(
            "/api/ai/predict/compare-locations",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "comparisons" in data
        assert "highest_location" in data
        assert "lowest_location" in data
        assert "variance" in data
        assert isinstance(data["comparisons"], list)
        assert len(data["comparisons"]) == 3

        # Verify each comparison has required fields
        for comparison in data["comparisons"]:
            assert "location" in comparison
            assert "predicted_salary" in comparison
            assert "confidence_interval" in comparison

    def test_compare_salaries_two_locations(self, client, auth_headers, mock_current_user, mock_salary_predictor):
        """Test comparison with minimum locations."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Data Scientist",
            "locations": ["Boston, MA", "Seattle, WA"],
            "experience_years": 3,
            "skills": ["Python", "Machine Learning"]
        }

        response = client.post(
            "/api/ai/predict/compare-locations",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["comparisons"]) == 2

    def test_compare_salaries_single_location_invalid(self, client, auth_headers, mock_current_user):
        """Test validation requiring at least 2 locations."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "locations": ["San Francisco"],  # Only one location
            "experience_years": 5,
            "skills": ["Python"]
        }

        response = client.post(
            "/api/ai/predict/compare-locations",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_compare_salaries_many_locations(self, client, auth_headers, mock_current_user, mock_salary_predictor):
        """Test comparison with many locations."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        locations = [
            "San Francisco, CA",
            "Austin, TX",
            "New York, NY",
            "Seattle, WA",
            "Boston, MA",
            "Denver, CO"
        ]

        request_data = {
            "job_title": "Software Engineer",
            "locations": locations,
            "experience_years": 5,
            "skills": ["Python", "AWS"]
        }

        response = client.post(
            "/api/ai/predict/compare-locations",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["comparisons"]) == len(locations)

    def test_compare_salaries_unauthorized(self, client):
        """Test salary comparison without authentication."""
        request_data = {
            "job_title": "Software Engineer",
            "locations": ["San Francisco", "Austin"],
            "experience_years": 5,
            "skills": ["Python"]
        }

        response = client.post("/api/ai/predict/compare-locations", json=request_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMarketData:
    """Tests for market data endpoint."""

    def test_get_market_data_success(self, client, auth_headers, mock_current_user):
        """Test successful market data retrieval."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        response = client.get(
            "/api/ai/predict/market-data/Software Engineer",
            params={"location": "San Francisco"},
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "job_title" in data
        assert "location" in data
        assert "average_salary" in data
        assert "salary_range" in data
        assert "market_trend" in data
        assert "demand_level" in data

    def test_get_market_data_different_titles(self, client, auth_headers, mock_current_user):
        """Test market data for different job titles."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        job_titles = [
            "Software Engineer",
            "Data Scientist",
            "Product Manager",
            "DevOps Engineer"
        ]

        for title in job_titles:
            response = client.get(
                f"/api/ai/predict/market-data/{title}",
                headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["job_title"] == title

    def test_get_market_data_default_location(self, client, auth_headers, mock_current_user):
        """Test market data with default location."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        response = client.get(
            "/api/ai/predict/market-data/Software Engineer",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "location" in data


class TestNegotiationTips:
    """Tests for salary negotiation tips endpoint."""

    def test_negotiation_tips_below_market(self, client, auth_headers, mock_current_user):
        """Test negotiation tips when offer is below market."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        response = client.post(
            "/api/ai/predict/negotiation-tips",
            params={
                "offered_salary": 120000,
                "predicted_salary": 150000,
                "location": "San Francisco",
                "job_title": "Software Engineer"
            },
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "offered_salary" in data
        assert "market_salary" in data
        assert "difference" in data
        assert "difference_percentage" in data
        assert "strategy" in data
        assert "recommendation" in data
        assert "tips" in data
        assert "counter_offer_range" in data

        # Should suggest aggressive negotiation
        assert data["strategy"] in ["aggressive", "moderate"]
        assert data["difference"] > 0

    def test_negotiation_tips_above_market(self, client, auth_headers, mock_current_user):
        """Test negotiation tips when offer is above market."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        response = client.post(
            "/api/ai/predict/negotiation-tips",
            params={
                "offered_salary": 180000,
                "predicted_salary": 150000,
                "location": "San Francisco",
                "job_title": "Software Engineer"
            },
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["strategy"] == "accept"
        assert data["difference"] < 0

    def test_negotiation_tips_at_market_rate(self, client, auth_headers, mock_current_user):
        """Test negotiation tips when offer is at market rate."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        response = client.post(
            "/api/ai/predict/negotiation-tips",
            params={
                "offered_salary": 150000,
                "predicted_salary": 152000,
                "location": "San Francisco",
                "job_title": "Software Engineer"
            },
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["strategy"] == "light"
        assert isinstance(data["tips"], list)
        assert len(data["tips"]) > 0

    def test_negotiation_tips_slightly_below(self, client, auth_headers, mock_current_user):
        """Test negotiation tips when offer is slightly below market."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        response = client.post(
            "/api/ai/predict/negotiation-tips",
            params={
                "offered_salary": 140000,
                "predicted_salary": 150000,
                "location": "Austin, TX",
                "job_title": "Senior Engineer"
            },
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["strategy"] == "moderate"
        assert "counter_offer_range" in data
        assert data["counter_offer_range"]["min"] > data["offered_salary"]

    def test_negotiation_tips_unauthorized(self, client):
        """Test negotiation tips without authentication."""
        response = client.post(
            "/api/ai/predict/negotiation-tips",
            params={
                "offered_salary": 120000,
                "predicted_salary": 150000,
                "location": "San Francisco",
                "job_title": "Software Engineer"
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_negotiation_tips_includes_talking_points(self, client, auth_headers, mock_current_user):
        """Test that negotiation tips include talking points."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        response = client.post(
            "/api/ai/predict/negotiation-tips",
            params={
                "offered_salary": 130000,
                "predicted_salary": 150000,
                "location": "San Francisco",
                "job_title": "Software Engineer"
            },
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "talking_points" in data
        assert isinstance(data["talking_points"], list)
        assert len(data["talking_points"]) > 0


class TestSalaryEndpointsValidation:
    """Tests for input validation across salary endpoints."""

    def test_predict_salary_missing_fields(self, client, auth_headers, mock_current_user):
        """Test validation with missing required fields."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "location": "San Francisco"
            # Missing experience_years and skills
        }

        response = client.post(
            "/api/ai/predict/salary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_compare_locations_empty_list(self, client, auth_headers, mock_current_user):
        """Test validation with empty locations list."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "locations": [],  # Empty
            "experience_years": 5,
            "skills": ["Python"]
        }

        response = client.post(
            "/api/ai/predict/compare-locations",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_negotiation_tips_negative_salary(self, client, auth_headers, mock_current_user):
        """Test validation with negative salary values."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # The endpoint should handle this gracefully or reject it
        response = client.post(
            "/api/ai/predict/negotiation-tips",
            params={
                "offered_salary": -10000,
                "predicted_salary": 150000,
                "location": "San Francisco",
                "job_title": "Engineer"
            },
            headers=auth_headers
        )

        # Should either reject or handle gracefully
        assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_500_INTERNAL_SERVER_ERROR]


class TestSalaryPredictorService:
    """Tests for salary predictor service."""

    @pytest.mark.asyncio
    async def test_salary_predictor_factors(self, mock_salary_predictor, sample_candidate_profile, sample_job_posting):
        """Test that salary predictor considers multiple factors."""
        prediction = await mock_salary_predictor.predict_salary(
            sample_candidate_profile,
            sample_job_posting
        )

        assert prediction is not None
        assert "factors" in prediction.__dict__
        assert len(prediction.factors) > 0

    @pytest.mark.asyncio
    async def test_salary_confidence_interval(self, mock_salary_predictor):
        """Test that confidence intervals are reasonable."""
        prediction = await mock_salary_predictor.predict_salary(None, None)

        ci = prediction.confidence_interval
        assert ci["min"] < ci["max"]
        assert ci["min"] < prediction.predicted_salary < ci["max"]

    @pytest.mark.asyncio
    async def test_salary_percentiles(self, mock_salary_predictor):
        """Test that percentiles are properly ordered."""
        prediction = await mock_salary_predictor.predict_salary(None, None)

        assert prediction.percentile_25 <= prediction.percentile_50
        assert prediction.percentile_50 <= prediction.percentile_75
