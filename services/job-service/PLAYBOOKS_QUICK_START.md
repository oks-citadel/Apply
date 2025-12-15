# Regional Playbooks - Quick Start Guide

## 5-Minute Quick Start

### Step 1: Run Database Migration
```bash
cd services/job-service
npm run typeorm migration:generate -- src/migrations/CreatePlaybookTables
npm run migration:run
```

### Step 2: Start the Service
```bash
npm run start:dev
```

The playbooks will be automatically seeded on first startup.

### Step 3: Test the API

#### Get All Playbooks
```bash
curl http://localhost:3001/api/v1/playbooks
```

#### Get Recommendation for a Job
```bash
curl -X POST http://localhost:3001/api/v1/playbooks/recommend \
  -H "Content-Type: application/json" \
  -d '{"job_id": "your-job-id"}'
```

#### Apply Playbook to Application
```bash
curl -X POST http://localhost:3001/api/v1/playbooks/apply \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job-123",
    "playbook_id": "playbook-456",
    "user_id": "user-789",
    "auto_format_resume": true,
    "auto_generate_cover_letter": true,
    "optimize_for_ats": true
  }'
```

## Available Regions

| Region | Currency | Resume Pages | Cover Letter | Key Features |
|--------|----------|--------------|--------------|--------------|
| United States | USD | 2 | Formal, 250-400 words | ATS-focused, achievement-based |
| Canada | CAD | 2 | Formal, 250-400 words | Bilingual (EN/FR), references required |
| United Kingdom | GBP | 2 | Very formal, 250-400 words | CV format, references on document |
| European Union | EUR | 2-3 | Formal, 200-400 words | Europass compatible, GDPR compliant |
| Australia | AUD | 3 | Semi-formal, 250-400 words | Longer CVs acceptable, references required |
| Global Remote | USD | 2 | Semi-formal, 200-350 words | Remote experience focus, timezone flexible |

## Common Use Cases

### Use Case 1: Get Recommendation
```typescript
const recommendation = await playbooksService.recommendPlaybook(jobId);
console.log(`Use: ${recommendation.recommended_playbook.name}`);
console.log(`Score: ${recommendation.match_score}%`);
```

### Use Case 2: Apply with Auto-Formatting
```typescript
const application = await playbooksService.applyPlaybook({
  job_id: jobId,
  playbook_id: playbookId,
  user_id: userId,
  auto_format_resume: true,
  auto_generate_cover_letter: true,
  optimize_for_ats: true,
});
```

### Use Case 3: Track Application Status
```typescript
await playbooksService.updateApplicationStatus(applicationId, {
  status: 'interview',
  user_rating: 5,
  user_feedback: 'Great playbook!',
});
```

### Use Case 4: View Statistics
```typescript
const stats = await playbooksService.getUserApplicationStats(userId);
console.log(`Interview Rate: ${stats.interview_rate}%`);
console.log(`Best Playbook: ${stats.most_successful_playbook.playbook_name}`);
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/playbooks` | List all playbooks |
| GET | `/api/v1/playbooks/:id` | Get playbook by ID |
| GET | `/api/v1/playbooks/region/:region` | Get playbook by region |
| POST | `/api/v1/playbooks/recommend` | Get recommendation for job |
| POST | `/api/v1/playbooks/apply` | Apply playbook to application |
| GET | `/api/v1/playbooks/applications/user/:userId` | Get user's applications |
| GET | `/api/v1/playbooks/applications/:id` | Get application details |
| PUT | `/api/v1/playbooks/applications/:id/status` | Update application status |
| GET | `/api/v1/playbooks/stats/user/:userId` | Get user statistics |

## Key Configuration Per Region

### United States
- **ATS Systems**: Workday, Greenhouse, Lever, Taleo
- **Visa**: H-1B, L-1, TN, Green Card
- **Culture**: Direct, achievement-focused
- **Timeline**: 14 days response, 45 days total

### Canada
- **ATS Systems**: Workday, Greenhouse, BambooHR
- **Visa**: Express Entry, LMIA, PGWP
- **Culture**: Polite, bilingual valued
- **Timeline**: 14 days response, 45 days total

### United Kingdom
- **ATS Systems**: Workday, Taleo, Bullhorn
- **Visa**: Skilled Worker, Graduate Visa
- **Culture**: Very formal, indirect
- **Timeline**: 21 days response, 45 days total

### European Union
- **ATS Systems**: SAP SuccessFactors, Workday
- **Visa**: EU Blue Card
- **Culture**: Formal, GDPR compliant
- **Timeline**: 21 days response, 60 days total

### Australia
- **ATS Systems**: SEEK, Workday, PageUp
- **Visa**: Skilled Worker (subclass 482, 186, 189)
- **Culture**: Direct but friendly
- **Timeline**: 14 days response, 45 days total

### Global Remote
- **ATS Systems**: Greenhouse, Lever, Ashby
- **Visa**: Varies (contractor/EOR)
- **Culture**: Casual, outcome-focused
- **Timeline**: 10 days response, 30 days total

## Troubleshooting

### Playbooks not appearing?
```sql
SELECT COUNT(*) FROM playbooks;
-- Should return 6

-- If 0, restart the service to trigger auto-seeding
```

### Wrong region recommended?
Check the job's country field:
```sql
SELECT id, title, country, location FROM jobs WHERE id = 'your-job-id';
```

### Low success rates?
Review application metrics:
```sql
SELECT
  region,
  COUNT(*) as total,
  COUNT(CASE WHEN got_interview THEN 1 END) as interviews
FROM playbook_applications pa
JOIN playbooks p ON pa.playbook_id = p.id
GROUP BY region;
```

## Documentation Links

- **Full Documentation**: `services/job-service/src/modules/playbooks/README.md`
- **Migration Guide**: `services/job-service/PLAYBOOKS_MIGRATION_GUIDE.md`
- **Implementation Summary**: `PLAYBOOKS_IMPLEMENTATION_SUMMARY.md`
- **API Docs**: `http://localhost:3001/api/docs` (Swagger)

## Next Steps

1. Review full README for detailed features
2. Integrate with frontend application
3. Connect to resume service for auto-formatting
4. Set up monitoring and analytics
5. Gather user feedback

## Support

For questions or issues:
- Check the comprehensive README
- Review unit tests for examples
- Consult the migration guide
- Contact the development team
