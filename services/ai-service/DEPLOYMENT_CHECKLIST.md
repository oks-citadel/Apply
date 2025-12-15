# Interview Probability Matching - Deployment Checklist

## Pre-Deployment

### Code Quality
- [x] All components implemented with proper types
- [x] Comprehensive error handling in place
- [x] Structured logging configured
- [x] Input validation with Pydantic schemas
- [x] Security middleware enabled
- [x] Rate limiting configured
- [ ] Code review completed
- [ ] Static analysis passed (mypy, ruff)
- [ ] Security scan completed

### Testing
- [x] Unit tests written and passing
- [x] Profile parser tests
- [x] Matcher algorithm tests
- [x] ML training tests
- [x] API endpoint tests
- [ ] Integration tests with other services
- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Edge case testing completed

### Documentation
- [x] API documentation complete
- [x] Usage examples provided
- [x] Architecture documented
- [x] Integration guides written
- [ ] Deployment guide created
- [ ] Runbook for operations
- [ ] Troubleshooting guide

### Dependencies
- [ ] Python 3.11+ installed
- [ ] All pip packages installed (`pip install -e .`)
- [ ] scikit-learn version verified
- [ ] numpy compatibility checked
- [ ] FastAPI and dependencies up to date

## Deployment Steps

### 1. Environment Setup
```bash
# Install dependencies
cd services/ai-service
pip install -e ".[dev]"

# Verify installation
python -c "import sklearn, numpy, fastapi; print('Dependencies OK')"
```

### 2. Configuration
```bash
# Set environment variables
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
export REDIS_HOST="localhost"
export ENVIRONMENT="production"
export LOG_LEVEL="INFO"

# Verify config
python -c "from src.config import settings; print(settings.app_name)"
```

### 3. Database Setup
- [ ] Database migrations run (if using persistent storage)
- [ ] Tables created for match results
- [ ] Indexes created for performance
- [ ] Backup strategy configured

### 4. Run Tests
```bash
# Run all tests
pytest tests/ -v --cov=src

# Run specific matching tests
pytest tests/test_probability_matching.py -v

# Check coverage
pytest --cov=src --cov-report=html
```

### 5. Start Service
```bash
# Development
uvicorn src.main:app --reload --port 8000

# Production
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

### 6. Health Checks
```bash
# Basic health
curl http://localhost:8000/health

# Readiness check
curl http://localhost:8000/health/ready

# API documentation
curl http://localhost:8000/docs
```

### 7. Smoke Tests
```bash
# Test probability calculation
curl -X POST http://localhost:8000/api/v1/matching/calculate-probability \
  -H "Content-Type: application/json" \
  -d @test_data/sample_request.json

# Test thresholds endpoint
curl http://localhost:8000/api/v1/matching/thresholds

# Verify response format
```

## Post-Deployment

### Monitoring Setup
- [ ] Application metrics configured
- [ ] Custom metrics for matching:
  - Average probability scores
  - Threshold pass rates by tier
  - API latency (p50, p95, p99)
  - Error rates
  - Training data accumulation
- [ ] Alerts configured:
  - High error rate
  - Slow response times
  - Model degradation
  - Resource exhaustion
- [ ] Logging aggregation setup
- [ ] Distributed tracing enabled

### Performance Monitoring
Key metrics to track:
```
- Request rate (req/sec)
- Response time (ms):
  - /calculate-probability: < 500ms p95
  - /find-matches: < 5s p95
  - /explain: < 1s p95
- Error rate (% of requests)
- Cache hit rate (if caching enabled)
- Training data volume
- Model accuracy (updated weekly)
```

### Data Collection
- [ ] Match results storage configured
- [ ] Feedback collection enabled
- [ ] Training data accumulation
- [ ] Model metrics tracking
- [ ] A/B test framework ready (if applicable)

### Security
- [ ] API authentication enabled
- [ ] Rate limiting verified
- [ ] Input sanitization tested
- [ ] CORS configured correctly
- [ ] Sensitive data handling reviewed
- [ ] Security headers validated
- [ ] SSL/TLS certificates installed

### Integration Testing
- [ ] Test with User Service
- [ ] Test with Job Service
- [ ] Test with Resume Service
- [ ] Test with Notification Service
- [ ] Test with Analytics Service
- [ ] End-to-end flow validated

### Documentation
- [ ] API docs accessible at /docs
- [ ] Team trained on new endpoints
- [ ] Client libraries updated
- [ ] Integration examples shared
- [ ] Known issues documented

## Validation Tests

### Functionality Tests
```bash
# 1. Calculate probability for good match
# Expected: High probability (>70%)

# 2. Calculate probability for poor match
# Expected: Low probability (<50%)

# 3. Find matches with multiple jobs
# Expected: Ranked results, top matches first

# 4. Get match explanation
# Expected: Detailed analysis returned

# 5. Record feedback
# Expected: Success response, training data added

# 6. Test tier thresholds
# Expected: Correct filtering by subscription level
```

### Performance Tests
```bash
# 1. Single calculation latency
# Target: < 500ms

# 2. Batch matching (50 jobs)
# Target: < 5s

# 3. Concurrent requests (100 users)
# Target: No failures, < 1s p95 latency

# 4. Memory usage
# Target: Stable, no leaks

# 5. CPU usage
# Target: < 80% sustained
```

### Edge Cases
```bash
# 1. Empty resume
# Expected: Low scores, helpful error

# 2. Missing job requirements
# Expected: Graceful degradation

# 3. Very long resume (>10k words)
# Expected: Successful processing

# 4. Special characters in text
# Expected: Proper handling

# 5. Invalid subscription tier
# Expected: 400 error with clear message
```

## Rollback Plan

If issues occur:

### Immediate Rollback
```bash
# 1. Stop current deployment
systemctl stop ai-service

# 2. Revert to previous version
git checkout <previous-tag>
pip install -e .

# 3. Restart service
systemctl start ai-service

# 4. Verify health
curl http://localhost:8000/health/ready
```

### Data Rollback
- [ ] Backup match results before deployment
- [ ] Document data migration if schema changed
- [ ] Test restore procedure

### Communication
- [ ] Notify team of issues
- [ ] Update status page
- [ ] Document incident
- [ ] Plan fix and redeployment

## Production Readiness

### Checklist
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Rollback plan tested
- [ ] Team trained
- [ ] Client SDKs ready
- [ ] Go-live approval obtained

### Launch Plan
1. **Soft Launch** (Week 1)
   - Enable for 10% of users
   - Monitor metrics closely
   - Collect initial feedback

2. **Gradual Rollout** (Week 2-3)
   - 25% → 50% → 75% of users
   - Monitor each stage
   - Adjust based on feedback

3. **Full Launch** (Week 4)
   - Enable for all users
   - Announce feature
   - Monitor and optimize

### Success Criteria
- [ ] < 1% error rate
- [ ] 95th percentile latency < 1s
- [ ] User satisfaction > 4.0/5.0
- [ ] No security incidents
- [ ] No data loss
- [ ] Uptime > 99.9%

## Ongoing Maintenance

### Weekly Tasks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor training data accumulation
- [ ] Review user feedback

### Monthly Tasks
- [ ] Retrain model if sufficient feedback
- [ ] Review and update thresholds
- [ ] Analyze prediction accuracy
- [ ] Update documentation
- [ ] Security patch review

### Quarterly Tasks
- [ ] Major model improvement
- [ ] Feature enhancement planning
- [ ] Performance optimization
- [ ] Capacity planning review

## Support Contacts

- **Development Team**: dev-team@applyforus.com
- **DevOps**: devops@applyforus.com
- **On-call**: oncall@applyforus.com
- **Documentation**: https://docs.applyforus.com/matching

## Resources

- **Main Documentation**: `INTERVIEW_PROBABILITY_MATCHING.md`
- **API Examples**: `MATCHING_API_EXAMPLES.md`
- **Summary**: `INTERVIEW_PROBABILITY_MATCHING_SUMMARY.md`
- **Tests**: `tests/test_probability_matching.py`
- **Monitoring Dashboard**: [Link to dashboard]
- **Incident Runbook**: [Link to runbook]
