# AI Agents - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Agent Files

Due to implementation length constraints, the agent code is provided in these reference files:
- `MULTI_LANGUAGE_AGENT.py` → Copy to `src/agents/multi_language.py`
- `AGENTS_API_ROUTES.py` → Copy to `src/api/routes/agents.py`

For the other three agents (Competitive Analysis, Fraud Detection, Emotional Intelligence), copy the code provided in the previous implementation responses.

### Step 2: Create `__init__.py`

Create `src/agents/__init__.py`:

```python
"""
AI Agent modules for advanced job search assistance.
"""

from .competitive_analysis import CompetitiveAnalysisAgent
from .fraud_detection import FraudDetectionAgent
from .emotional_intelligence import EmotionalIntelligenceAgent
from .multi_language import MultiLanguageAgent

__all__ = [
    "CompetitiveAnalysisAgent",
    "FraudDetectionAgent",
    "EmotionalIntelligenceAgent",
    "MultiLanguageAgent",
]
```

### Step 3: Update `main.py`

See `MAIN_PY_UPDATES.txt` for detailed instructions. Quick version:

**Add to imports** (line ~30):
```python
from .agents import (
    CompetitiveAnalysisAgent,
    FraudDetectionAgent,
    EmotionalIntelligenceAgent,
    MultiLanguageAgent
)
from .api.routes import agents as agents_routes
```

**Update ServiceState** (line ~63):
```python
class ServiceState:
    # ... existing services ...
    competitive_analysis_agent: CompetitiveAnalysisAgent
    fraud_detection_agent: FraudDetectionAgent
    emotional_intelligence_agent: EmotionalIntelligenceAgent
    multi_language_agent: MultiLanguageAgent
```

**Initialize agents** (line ~126):
```python
# Initialize AI Agents
state.competitive_analysis_agent = CompetitiveAnalysisAgent(llm_service=state.llm_service)
state.fraud_detection_agent = FraudDetectionAgent(llm_service=state.llm_service)
state.emotional_intelligence_agent = EmotionalIntelligenceAgent(llm_service=state.llm_service)
state.multi_language_agent = MultiLanguageAgent(llm_service=state.llm_service)
logger.info("All AI Agents initialized")

# Store in app state
app.state.competitive_analysis_agent = state.competitive_analysis_agent
app.state.fraud_detection_agent = state.fraud_detection_agent
app.state.emotional_intelligence_agent = state.emotional_intelligence_agent
app.state.multi_language_agent = state.multi_language_agent
```

**Add router** (line ~337):
```python
app.include_router(
    agents_routes.router,
    prefix="/api/ai/agents",
    tags=["AI Agents"],
)
```

### Step 4: Verify & Run

```bash
# Verify imports
python -c "from src.agents import CompetitiveAnalysisAgent; print('✅ OK')"

# Run service
python -m src.main

# Check endpoints
curl http://localhost:8000/api/ai/agents/health
```

### Step 5: Test Endpoints

Visit http://localhost:8000/docs and test:
- `POST /api/ai/agents/competitive-analysis`
- `POST /api/ai/agents/fraud-detection`
- `POST /api/ai/agents/emotional-intelligence`
- `POST /api/ai/agents/translate`

## 📝 Example Requests

### Competitive Analysis
```bash
curl -X POST "http://localhost:8000/api/ai/agents/competitive-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_123",
    "user_profile": {
      "skills": ["Python", "AWS"],
      "experience_years": 5,
      "education": "BS Computer Science"
    },
    "analysis_depth": "standard"
  }'
```

### Fraud Detection
```bash
curl -X POST "http://localhost:8000/api/ai/agents/fraud-detection" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Developer",
    "company_name": "TechCorp",
    "description": "Looking for experienced developer...",
    "source": "LinkedIn",
    "salary_range": "$120k-$150k"
  }'
```

### Emotional Intelligence
```bash
curl -X POST "http://localhost:8000/api/ai/agents/emotional-intelligence" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I really want this job!",
    "context": "cover_letter",
    "desired_tone": "professional"
  }'
```

### Translation
```bash
curl -X POST "http://localhost:8000/api/ai/agents/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Experienced software engineer...",
    "content_type": "resume",
    "source_language": "en",
    "target_language": "es",
    "localization_level": "standard"
  }'
```

## ✅ Verification Checklist

- [ ] All agent files created in `src/agents/`
- [ ] API routes created in `src/api/routes/agents.py`
- [ ] main.py updated with imports
- [ ] ServiceState class updated
- [ ] Agents initialized in lifespan
- [ ] Router added to app
- [ ] Service starts without errors
- [ ] Health check returns healthy status
- [ ] All 4 endpoints visible in /docs
- [ ] Test requests return valid responses

## 🔍 Troubleshooting

**Service won't start**
- Check all imports are correct
- Verify file paths match exactly
- Check for syntax errors in copied code

**ImportError: cannot import CompetitiveAnalysisAgent**
- Ensure __init__.py exists in src/agents/
- Verify all agent files are in place
- Check file names match exactly

**Endpoint returns 500 error**
- Check service logs for details
- Verify LLM service is initialized
- Check OpenAI/Anthropic API keys are set

**LLM timeout**
- Increase timeout in config
- Check API rate limits
- Verify API keys are valid

## 📚 Documentation Files

- `AGENTS_COMPLETE_IMPLEMENTATION_SUMMARY.md` - Full technical documentation
- `MAIN_PY_UPDATES.txt` - Detailed main.py changes
- `AI_AGENTS_IMPLEMENTATION.md` - Implementation overview
- `setup_agents.sh` - Automated setup script

## 🎯 Next Steps

After successful setup:

1. **Test each agent** with various inputs
2. **Monitor logs** for any issues
3. **Integrate with frontend** application
4. **Add unit tests** for each agent
5. **Configure monitoring** and alerts
6. **Optimize performance** based on usage patterns

## 💡 Tips

- Use the interactive `/docs` for testing
- Check logs with `DEBUG` level for troubleshooting
- Start with simple test requests
- Gradually increase complexity
- Monitor LLM token usage and costs

## 🆘 Need Help?

Refer to:
1. Complete implementation summary
2. Inline code documentation
3. Example requests in schemas
4. Service logs for errors

---

**Ready to go! 🚀**

Start the service and visit http://localhost:8000/docs to explore the new AI agents.
