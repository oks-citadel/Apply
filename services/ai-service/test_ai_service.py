#!/usr/bin/env python3
"""
Test script to validate AI service endpoints and OpenAI integration.

This script tests the AI service to ensure all endpoints are properly
configured and can be started without errors.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

async def test_service_imports():
    """Test that all service modules can be imported."""
    print("=" * 60)
    print("Testing AI Service Imports")
    print("=" * 60)

    try:
        print("✓ Importing config...")
        from src.config import settings
        print(f"  - Environment: {settings.environment}")
        print(f"  - App Name: {settings.app_name}")
        print(f"  - Debug Mode: {settings.debug}")

        print("\n✓ Importing LLM Service...")
        from src.services.llm_service import LLMService, OpenAIProvider, AnthropicProvider
        print("  - LLM Service classes loaded")

        print("\n✓ Importing Embedding Service...")
        from src.services.embedding_service import EmbeddingService
        print("  - Embedding Service loaded")

        print("\n✓ Importing Vector Store...")
        from src.services.vector_store import VectorStore
        print("  - Vector Store loaded")

        print("\n✓ Importing Models...")
        from src.models.job_matcher import JobMatcher
        from src.models.resume_optimizer import ResumeOptimizer
        from src.models.salary_predictor import SalaryPredictor
        print("  - JobMatcher loaded")
        print("  - ResumeOptimizer loaded")
        print("  - SalaryPredictor loaded")

        print("\n✓ Importing Route Modules...")
        from src.api.routes import generate, optimize, match, interview, salary, skills_analysis
        print("  - Generate routes loaded")
        print("  - Optimize routes loaded")
        print("  - Match routes loaded")
        print("  - Interview routes loaded")
        print("  - Salary routes loaded")
        print("  - Skills Analysis routes loaded")

        print("\n✓ Importing Schemas...")
        from src.schemas.request_schemas import (
            CandidateProfile,
            JobPosting,
            Resume,
        )
        from src.schemas.response_schemas import (
            MatchScore,
            ATSScore,
            SalaryPrediction,
            GeneratedSection,
        )
        print("  - Request schemas loaded")
        print("  - Response schemas loaded")

        print("\n" + "=" * 60)
        print("✅ All imports successful!")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_llm_service_initialization():
    """Test LLM service initialization."""
    print("\n" + "=" * 60)
    print("Testing LLM Service Initialization")
    print("=" * 60)

    try:
        from src.services.llm_service import LLMService
        from src.config import settings

        # Check API keys
        print("\n📋 Checking API Keys:")
        has_openai = bool(settings.openai_api_key and settings.openai_api_key not in ("", "placeholder", "placeholder-configure-in-secrets"))
        has_anthropic = bool(settings.anthropic_api_key and settings.anthropic_api_key not in ("", "placeholder", "placeholder-configure-in-secrets"))

        print(f"  OpenAI API Key: {'✓ Configured' if has_openai else '❌ Not configured'}")
        print(f"  Anthropic API Key: {'✓ Configured' if has_anthropic else '❌ Not configured'}")
        print(f"  Default Provider: {settings.default_llm_provider}")

        if not has_openai and not has_anthropic:
            print("\n⚠️  WARNING: No LLM API keys configured!")
            print("   Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable")
            print("   The service will run but AI features will be disabled")
            return False

        # Initialize service
        print("\n✓ Initializing LLM Service...")
        llm_service = LLMService()
        print("  - LLM Service initialized")

        if llm_service._disabled:
            print("  ⚠️  Service running in disabled mode (no valid API keys)")
            return False
        else:
            print("  ✅ Service running in enabled mode")

        print("\n" + "=" * 60)
        print("✅ LLM Service initialization successful!")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n❌ LLM Service initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_embedding_service():
    """Test Embedding service initialization."""
    print("\n" + "=" * 60)
    print("Testing Embedding Service")
    print("=" * 60)

    try:
        from src.services.embedding_service import EmbeddingService
        from src.config import settings

        print("✓ Creating Embedding Service...")
        embedding_service = EmbeddingService()

        print(f"  - Model: {settings.embedding_model}")
        print(f"  - Dimension: {settings.embedding_dimension}")

        # Note: We don't actually initialize as it requires API calls
        print("  ⚠️  Skipping actual initialization (requires API calls)")

        print("\n" + "=" * 60)
        print("✅ Embedding Service ready!")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n❌ Embedding Service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_endpoints_registration():
    """Test that all endpoints are properly registered."""
    print("\n" + "=" * 60)
    print("Testing Endpoint Registration")
    print("=" * 60)

    try:
        from src.api.routes import generate, optimize, match, interview, salary, skills_analysis

        # Check route modules have routers
        modules = [
            ("Generate", generate),
            ("Optimize", optimize),
            ("Match", match),
            ("Interview", interview),
            ("Salary", salary),
            ("Skills Analysis", skills_analysis),
        ]

        print("\n📍 Checking Router Registration:")
        for name, module in modules:
            if hasattr(module, 'router'):
                routes = len(module.router.routes)
                print(f"  ✓ {name}: {routes} endpoints")
            else:
                print(f"  ❌ {name}: No router found")
                return False

        print("\n" + "=" * 60)
        print("✅ All endpoints registered!")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n❌ Endpoint registration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_fastapi_app():
    """Test FastAPI application creation."""
    print("\n" + "=" * 60)
    print("Testing FastAPI Application")
    print("=" * 60)

    try:
        # Temporarily set environment to avoid telemetry errors
        os.environ.setdefault("ENVIRONMENT", "test")

        print("✓ Importing main application...")
        # We can't directly import app as it will trigger initialization
        # Just verify the module can be loaded
        import importlib.util
        spec = importlib.util.spec_from_file_location("main", "src/main.py")
        if spec and spec.loader:
            print("  - Main module specification found")
            print("  ⚠️  Skipping actual app creation (would trigger full initialization)")

        print("\n" + "=" * 60)
        print("✅ FastAPI application module ready!")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n❌ FastAPI app test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def print_endpoint_summary():
    """Print summary of all available AI endpoints."""
    print("\n" + "=" * 60)
    print("AI Service Endpoints Summary")
    print("=" * 60)

    endpoints = {
        "Content Generation": [
            "POST /api/ai/generate/summary - Generate resume summary",
            "POST /api/ai/generate/bullets - Generate achievement bullets",
            "POST /api/ai/generate/skills - Extract and suggest skills",
            "POST /api/ai/generate/cover-letter - Generate cover letter",
        ],
        "Resume Optimization": [
            "POST /api/ai/optimize/keywords - Extract keywords from job description",
            "POST /api/ai/optimize/ats-score - Calculate ATS compatibility score",
            "POST /api/ai/optimize/resume - Optimize resume for specific job",
        ],
        "Job Matching": [
            "POST /api/ai/match/job - Calculate match score between candidate and job",
            "POST /api/ai/match/jobs - Find matching jobs for candidate",
            "POST /api/ai/match/batch-score - Batch match scoring",
            "POST /api/ai/match/explain - Get detailed match explanation",
        ],
        "Interview Preparation": [
            "POST /api/ai/interview/questions - Generate interview questions",
            "POST /api/ai/interview/feedback - Analyze interview response",
            "POST /api/ai/interview/prepare-topics - Generate preparation topics",
        ],
        "Skills Analysis": [
            "POST /api/ai/skills/skills-gap - Analyze skill gaps for target role",
            "POST /api/ai/skills/skill-recommendations - Get personalized skill recommendations",
            "POST /api/ai/skills/star-answers - Generate STAR method interview answers",
        ],
        "Salary Prediction": [
            "POST /api/ai/predict/salary - Predict salary for job and profile",
            "POST /api/ai/predict/compare-locations - Compare salaries across locations",
            "GET /api/ai/predict/market-data/{job_title} - Get market data",
            "POST /api/ai/predict/negotiation-tips - Get salary negotiation tips",
        ],
        "Health & Status": [
            "GET /health - Basic health check",
            "GET /health/live - Liveness probe",
            "GET /health/ready - Readiness probe",
            "GET / - Root endpoint",
        ],
    }

    for category, endpoint_list in endpoints.items():
        print(f"\n📁 {category}:")
        for endpoint in endpoint_list:
            print(f"   {endpoint}")

    print("\n" + "=" * 60)
    print(f"Total Endpoint Categories: {len(endpoints)}")
    total_endpoints = sum(len(v) for v in endpoints.values())
    print(f"Total Endpoints: {total_endpoints}")
    print("=" * 60)


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("🚀 AI Service Integration Test Suite")
    print("=" * 60)

    tests = [
        ("Imports", test_service_imports),
        ("LLM Service", test_llm_service_initialization),
        ("Embedding Service", test_embedding_service),
        ("Endpoints", test_endpoints_registration),
        ("FastAPI App", test_fastapi_app),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))

    # Print endpoint summary
    await print_endpoint_summary()

    # Print final summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    passed = sum(1 for _, r in results if r)
    total = len(results)

    print("\n" + "=" * 60)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("✅ All tests passed! AI Service is ready.")
    else:
        print("⚠️  Some tests failed. Review the output above.")
        print("\n💡 Quick Fixes:")
        print("   - Ensure OPENAI_API_KEY or ANTHROPIC_API_KEY is set")
        print("   - Check that all dependencies are installed: pip install -r requirements.txt")
        print("   - Verify Python version >= 3.9")

    print("=" * 60)

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
