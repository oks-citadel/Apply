# AI Service - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Python 3.9+
- OpenAI API key OR Anthropic API key
- (Optional) Docker

---

## Step 1: Environment Setup

Create a `.env` file in `services/ai-service/`:

```bash
# Required: Choose one or both
OPENAI_API_KEY=sk-your-openai-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Service configuration
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
DEFAULT_LLM_PROVIDER=openai  # or anthropic
```

---

## Step 2: Install Dependencies

```bash
cd services/ai-service
pip install -r requirements.txt
```

---

## Step 3: Start the Service

### Option A: Development Mode
```bash
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Option B: Production Mode
```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Option C: Docker
```bash
docker build -t ai-service .
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e ENVIRONMENT=production \
  ai-service
```

---

## Step 4: Verify It's Working

### Check Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "dependencies": {}
}
```

### Access API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Step 5: Test an Endpoint

### Generate Resume Summary

```bash
curl -X POST "http://localhost:8000/api/ai/generate/summary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Software Engineer",
    "years_experience": 5,
    "skills": ["Python", "FastAPI", "Docker", "AWS"],
    "industry": "Technology",
    "job_description": "Looking for a senior backend developer..."
  }'
```

### Generate Cover Letter

```bash
curl -X POST "http://localhost:8000/api/ai/generate/cover-letter" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "candidate_name": "John Doe",
    "job_title": "Senior Software Engineer",
    "company_name": "TechCorp",
    "resume_summary": "Experienced software engineer with 5+ years...",
    "job_description": "We are looking for a senior engineer...",
    "tone": "professional",
    "max_words": 300
  }'
```

### Analyze Skill Gap

```bash
curl -X POST "http://localhost:8000/api/ai/skills/skills-gap" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "candidate_skills": ["Python", "Django", "PostgreSQL"],
    "target_role": "Senior Full Stack Developer",
    "target_skills": ["Python", "React", "TypeScript", "Docker", "Kubernetes"],
    "industry": "Technology",
    "experience_level": "senior"
  }'
```

---

## 🔍 Available Endpoints

### Content Generation
- `POST /api/ai/generate/summary` - Generate resume summary
- `POST /api/ai/generate/cover-letter` - Generate cover letter
- `POST /api/ai/generate/bullets` - Generate achievement bullets
- `POST /api/ai/generate/skills` - Extract and suggest skills

### Resume Optimization
- `POST /api/ai/optimize/resume` - Optimize resume for ATS
- `POST /api/ai/optimize/keywords` - Extract keywords
- `POST /api/ai/optimize/ats-score` - Calculate ATS score

### Job Matching
- `POST /api/ai/match/resume-job` - Match resume to job
- `POST /api/ai/match/jobs` - Find matching jobs
- `POST /api/ai/match/batch-score` - Batch job matching
- `POST /api/ai/match/explain` - Detailed match explanation

### Interview Preparation
- `POST /api/ai/interview/questions` - Generate interview questions
- `POST /api/ai/interview/feedback` - Analyze interview answers
- `POST /api/ai/interview/prepare-topics` - Preparation topics

### Skills Analysis
- `POST /api/ai/skills/skills-gap` - Skill gap analysis
- `POST /api/ai/skills/skill-recommendations` - Skill recommendations
- `POST /api/ai/skills/star-answers` - STAR method answers

### Salary Prediction
- `POST /api/ai/predict/salary` - Predict salary
- `POST /api/ai/predict/compare-locations` - Compare salaries
- `GET /api/ai/predict/market-data/{job_title}` - Market data
- `POST /api/ai/predict/negotiation-tips` - Negotiation tips

---

## 🐛 Troubleshooting

### Issue: "LLM service is disabled"
**Solution**: Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment

```bash
export OPENAI_API_KEY=sk-your-key-here
# OR
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Issue: "Module not found"
**Solution**: Ensure you're in the ai-service directory and dependencies are installed

```bash
cd services/ai-service
pip install -r requirements.txt
```

### Issue: Import errors
**Solution**: Run from the ai-service directory using module syntax

```bash
# From services/ai-service/
python -m uvicorn src.main:app --reload
```

### Issue: Port already in use
**Solution**: Use a different port

```bash
uvicorn src.main:app --port 8001
```

### Issue: Authentication errors
**Solution**: For testing, you can temporarily disable auth in dependencies.py or use a valid JWT token from your auth service

---

## 🧪 Running Tests

```bash
cd services/ai-service
python test_ai_service.py
```

This will:
- ✅ Verify all imports
- ✅ Check LLM service initialization
- ✅ Validate endpoint registration
- ✅ Test configuration
- ✅ Display all available endpoints

---

## 📊 Monitoring

### View Logs
```bash
# Structured JSON logs
tail -f logs/ai-service.log | jq
```

### Check Metrics
```bash
# Health check
curl http://localhost:8000/health/ready

# Service info
curl http://localhost:8000/
```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key (required if using OpenAI) |
| `ANTHROPIC_API_KEY` | - | Anthropic API key (required if using Anthropic) |
| `DEFAULT_LLM_PROVIDER` | `openai` | Primary LLM provider: `openai` or `anthropic` |
| `LLM_TEMPERATURE` | `0.7` | LLM temperature (0.0-1.0) |
| `LLM_MAX_TOKENS` | `2000` | Maximum tokens per request |
| `HOST` | `0.0.0.0` | Service host |
| `PORT` | `8000` | Service port |
| `ENVIRONMENT` | `development` | Environment: `development`, `production` |
| `DEBUG` | `false` | Enable debug mode |
| `LOG_LEVEL` | `INFO` | Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |

---

## 🚢 Deployment

### Docker Deployment

1. Build the image:
```bash
docker build -t ai-service:latest .
```

2. Run the container:
```bash
docker run -d \
  --name ai-service \
  -p 8000:8000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e ENVIRONMENT=production \
  -e LOG_LEVEL=INFO \
  ai-service:latest
```

3. Check logs:
```bash
docker logs -f ai-service
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: ai-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: openai-api-key
        - name: ENVIRONMENT
          value: "production"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## 📚 Next Steps

1. **Explore the API**: Open http://localhost:8000/docs in your browser
2. **Read the Full Documentation**: See `AI_SERVICE_COMPLETION_REPORT.md`
3. **Integrate with Frontend**: Use the API client from `apps/web/src/lib/api/`
4. **Set up Monitoring**: Configure Application Insights or Grafana

---

## 🆘 Need Help?

- **Full Documentation**: `AI_SERVICE_COMPLETION_REPORT.md`
- **API Reference**: http://localhost:8000/docs
- **Test Script**: Run `python test_ai_service.py`
- **Check Logs**: Look for ERROR or WARNING messages

---

**Service Status**: ✅ FULLY OPERATIONAL
**Last Updated**: 2024-12-16
