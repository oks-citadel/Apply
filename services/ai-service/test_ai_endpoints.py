#!/usr/bin/env python3
"""
Test script for AI service endpoints.
Tests all endpoints with mock data.
"""

import asyncio
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from fastapi.testclient import TestClient


def test_ai_endpoints():
    """Test all AI endpoints."""

    # Set minimal environment variables
    os.environ.setdefault('OPENAI_API_KEY', 'sk-test-key')
    os.environ.setdefault('ANTHROPIC_API_KEY', 'sk-test-key')
    os.environ.setdefault('PINECONE_API_KEY', 'test-key')
    os.environ.setdefault('JWT_SECRET', 'test-secret')

    # Import after setting env vars
    from main import app

    client = TestClient(app)

    print("Testing AI Service Endpoints...")
    print("=" * 60)

    # Test 1: Generate Summary
    print("\n1. Testing POST /ai/generate-summary")
    response = client.post("/ai/generate-summary", json={
        "experience": [
            {
                "company": "Tech Corp",
                "position": "Software Engineer",
                "description": "Built web applications",
                "highlights": ["Led team of 5", "Increased performance by 50%"]
            }
        ],
        "skills": ["Python", "JavaScript", "React"],
        "tone": "professional"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Summary: {data.get('summary', '')[:100]}...")
        print(f"   Alternatives: {len(data.get('alternatives', []))}")
    else:
        print(f"   Error: {response.text}")

    # Test 2: Generate Bullets
    print("\n2. Testing POST /ai/generate-bullets")
    response = client.post("/ai/generate-bullets", json={
        "position": "Senior Developer",
        "company": "Tech Startup",
        "description": "Full-stack development",
        "count": 3
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Bullets generated: {len(data.get('bullets', []))}")
        for i, bullet in enumerate(data.get('bullets', [])[:2], 1):
            print(f"   {i}. {bullet[:80]}...")
    else:
        print(f"   Error: {response.text}")

    # Test 3: Generate Cover Letter
    print("\n3. Testing POST /ai/generate-cover-letter")
    response = client.post("/ai/generate-cover-letter", json={
        "resumeId": "resume123",
        "jobTitle": "Software Engineer",
        "company": "Big Tech Co",
        "jobDescription": "Looking for talented engineers",
        "tone": "professional",
        "length": "medium"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Cover letter length: {len(data.get('coverLetter', ''))} chars")
        print(f"   Subject: {data.get('subject', '')}")
    else:
        print(f"   Error: {response.text}")

    # Test 4: ATS Score
    print("\n4. Testing POST /ai/ats-score")
    response = client.post("/ai/ats-score", json={
        "resumeId": "resume123",
        "jobDescription": "Looking for Python developer with React experience. Must have AWS and Docker skills."
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ATS Score: {data.get('score', 0)}/100")
        print(f"   Matched keywords: {len(data.get('matchedKeywords', []))}")
        print(f"   Suggestions: {len(data.get('suggestions', []))}")
    else:
        print(f"   Error: {response.text}")

    # Test 5: Optimize Resume
    print("\n5. Testing POST /ai/optimize-resume")
    response = client.post("/ai/optimize-resume", json={
        "resumeId": "resume123",
        "jobDescription": "Senior software engineer position",
        "focusAreas": ["summary", "skills"]
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Suggestions: {len(data.get('suggestions', []))}")
        print(f"   Optimized content sections: {list(data.get('optimizedContent', {}).keys())}")
    else:
        print(f"   Error: {response.text}")

    # Test 6: Improve Text
    print("\n6. Testing POST /ai/improve-text")
    response = client.post("/ai/improve-text", json={
        "text": "I did coding at my job",
        "context": "bullet",
        "instructions": "Make it more impactful"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Improved text: {data.get('improved', '')[:80]}...")
        print(f"   Suggestions: {len(data.get('suggestions', []))}")
    else:
        print(f"   Error: {response.text}")

    # Test 7: Interview Prep
    print("\n7. Testing POST /ai/interview-prep")
    response = client.post("/ai/interview-prep", json={
        "jobId": "job123",
        "resumeId": "resume123"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Questions generated: {len(data.get('questions', []))}")
        print(f"   Company insights provided: {data.get('companyInsights') is not None}")
    else:
        print(f"   Error: {response.text}")

    # Test 8: Salary Prediction
    print("\n8. Testing POST /ai/salary-prediction")
    response = client.post("/ai/salary-prediction", json={
        "jobTitle": "Senior Software Engineer",
        "location": "San Francisco",
        "experienceYears": 5,
        "skills": ["Python", "AWS", "Docker"],
        "education": "Bachelor's"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Salary range: ${data.get('minSalary', 0):,} - ${data.get('maxSalary', 0):,}")
        print(f"   Median: ${data.get('median', 0):,}")
        print(f"   Confidence: {data.get('confidence', 0):.2%}")
    else:
        print(f"   Error: {response.text}")

    # Test 9: Skill Gap Analysis
    print("\n9. Testing POST /ai/skill-gap-analysis")
    response = client.post("/ai/skill-gap-analysis", json={
        "resumeId": "resume123",
        "targetRole": "Senior Full-Stack Engineer",
        "targetCompany": "Tech Corp"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Current skills: {len(data.get('currentSkills', []))}")
        print(f"   Required skills: {len(data.get('requiredSkills', []))}")
        print(f"   Missing skills: {len(data.get('missingSkills', []))}")
        print(f"   Recommendations: {len(data.get('recommendations', []))}")
    else:
        print(f"   Error: {response.text}")

    # Test 10: Career Path
    print("\n10. Testing POST /ai/career-path")
    response = client.post("/ai/career-path", json={
        "resumeId": "resume123"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Current level: {data.get('currentLevel', '')}")
        print(f"   Next roles suggested: {len(data.get('nextRoles', []))}")
        for role in data.get('nextRoles', [])[:2]:
            print(f"     - {role.get('title')} ({role.get('yearsToReach')} years)")
    else:
        print(f"   Error: {response.text}")

    print("\n" + "=" * 60)
    print("All tests completed!")


if __name__ == "__main__":
    try:
        test_ai_endpoints()
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
