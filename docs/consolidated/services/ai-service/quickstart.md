# AI Service - Quick Start Guide

## 🚀 Getting Started in 3 Minutes

### Step 1: Navigate to the Service
```bash
cd services/ai-service
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run the Service
```bash
# Option A: Simple run (works without any configuration)
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Option B: With OpenAI (for real AI responses)
export OPENAI_API_KEY=sk-your-key-here
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Test It
Open your browser to:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

Or use curl:
```bash
curl -X POST http://localhost:8000/ai/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
    "experience": [{
      "company": "Tech Corp",
      "position": "Software Engineer",
      "description": "Built applications",
      "highlights": ["Led team"]
    }],
    "skills": ["Python", "JavaScript"]
  }'
```

## ✨ What You Get

### All 10 AI Endpoints Ready
- ✅ Generate professional summaries
- ✅ Generate achievement bullets
- ✅ Generate cover letters
- ✅ Calculate ATS scores
- ✅ Optimize resumes
- ✅ Improve text quality
- ✅ Interview preparation
- ✅ Salary predictions
- ✅ Skill gap analysis
- ✅ Career path suggestions

### Works Out of the Box
- ✅ No API keys required (uses mock responses)
- ✅ Add OpenAI key for real AI (optional)
- ✅ CORS configured for frontend
- ✅ Full request/response validation
- ✅ Comprehensive error handling

## 📝 Configuration (Optional)

Create a `.env` file:
```bash
# Optional - for real OpenAI responses
OPENAI_API_KEY=sk-your-key-here

# Optional - for development
DEBUG=true
LOG_LEVEL=INFO

# Optional - custom CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🔗 Frontend Integration

Update your frontend API client base URL:
```typescript
// In your frontend config
const AI_SERVICE_URL = 'http://localhost:8000';
```

Then use the existing API methods:
```typescript
import { aiApi } from '@/lib/api/ai';

const result = await aiApi.generateSummary({...});
const bullets = await aiApi.generateBullets({...});
const atsScore = await aiApi.getATSScore(resumeId, jobDescription);
// ... all 10 methods ready to use
```

## 📚 Documentation

- **Full API Docs**: See `AI_ENDPOINTS_README.md`
- **Endpoint Mapping**: See `ENDPOINT_MAPPING.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

## 🧪 Testing

Run the test script:
```bash
python test_ai_endpoints.py
```

## 🎯 Key Features

### Smart Fallback
- Without OpenAI key → Returns mock/template responses
- With OpenAI key → Uses GPT-3.5-turbo for real AI

### ATS Scoring Algorithm
- Keyword matching (40%)
- Format validation (30%)
- Content quality (30%)

### Salary Prediction
- Location-based multipliers
- Experience-based calculation
- Industry adjustments

### All Endpoints Match Frontend
- 100% compatible with TypeScript API contracts
- No changes needed in frontend code

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Use a different port
uvicorn src.main:app --reload --port 8001
```

### Import Errors
```bash
# Make sure you're in the right directory
cd services/ai-service
pip install -r requirements.txt
```

### CORS Errors
```bash
# Add your frontend URL to CORS_ORIGINS
export CORS_ORIGINS=http://localhost:3000,https://your-frontend.com
```

## 🎉 That's It!

You now have a fully functional AI service with:
- ✅ 10 production-ready endpoints
- ✅ OpenAI integration with fallback
- ✅ Complete documentation
- ✅ Frontend compatibility

Start building! 🚀
