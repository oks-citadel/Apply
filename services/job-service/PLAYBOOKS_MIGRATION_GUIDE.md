# Regional Playbooks Migration Guide

## Overview

This guide helps you migrate to using the Regional Playbooks system in the ApplyForUs platform.

## Database Migration

### Step 1: Create Playbook Tables

Run the TypeORM migration to create the necessary database tables:

```bash
cd services/job-service
npm run typeorm migration:generate -- src/migrations/CreatePlaybookTables
npm run migration:run
```

This will create two tables:
- `playbooks` - Stores regional playbook configurations
- `playbook_applications` - Tracks applications using playbooks

### Step 2: Seed Regional Playbooks

The playbooks will be automatically seeded when the service starts. The `PlaybooksService.onModuleInit()` method checks if playbooks exist and seeds them if the table is empty.

You can verify the playbooks were seeded:

```sql
SELECT region, name, usage_count FROM playbooks;
```

Expected output:
```
       region       |           name            | usage_count
--------------------+---------------------------+-------------
 united_states      | United States Professional |           0
 canada             | Canada Professional        |           0
 united_kingdom     | United Kingdom Professional|           0
 european_union     | European Union Professional|           0
 australia          | Australia Professional     |           0
 global_remote      | Global Remote Professional |           0
```

## API Integration

### Update Job Service Configuration

The PlaybooksModule is already integrated into the job-service app.module.ts.

### Frontend Integration

Update your frontend to use the new playbooks endpoints:

```typescript
// Example: Get playbook recommendation
async function getPlaybookRecommendation(jobId: string) {
  const response = await fetch('/api/v1/playbooks/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId }),
  });
  return response.json();
}

// Example: Apply playbook to application
async function applyWithPlaybook(jobId: string, playbookId: string, userId: string) {
  const response = await fetch('/api/v1/playbooks/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: jobId,
      playbook_id: playbookId,
      user_id: userId,
      auto_format_resume: true,
      auto_generate_cover_letter: true,
      optimize_for_ats: true,
    }),
  });
  return response.json();
}
```

## Resume Service Integration

To enable automatic resume formatting based on playbooks:

### Step 1: Add Playbook Integration to Resume Service

```typescript
// In resume-service
import { PlaybooksService } from '@job-service/playbooks';

async formatResumeWithPlaybook(
  resumeId: string,
  playbookId: string,
): Promise<FormattedResume> {
  const playbook = await this.playbooksService.findOne(playbookId);

  return this.resumeFormatter.format(resumeId, {
    format: playbook.preferred_resume_format,
    maxPages: playbook.resume_max_pages,
    sectionOrder: playbook.resume_section_order.sections,
    pageSize: playbook.page_size,
    fontSize: playbook.recommended_font_size,
    fonts: playbook.preferred_fonts,
    includePhoto: playbook.include_photo,
    includeDateOfBirth: playbook.include_date_of_birth,
  });
}
```

### Step 2: Update Application Flow

```typescript
// When user applies for a job
const recommendation = await playbooksService.recommendPlaybook(jobId, userId);

// Format resume according to playbook
const formattedResume = await resumeService.formatResumeWithPlaybook(
  resumeId,
  recommendation.recommended_playbook.id,
);

// Create application
const application = await playbooksService.applyPlaybook({
  job_id: jobId,
  playbook_id: recommendation.recommended_playbook.id,
  user_id: userId,
  resume_id: formattedResume.id,
  auto_format_resume: true,
  optimize_for_ats: true,
});
```

## Testing

### Unit Tests

Run the playbooks service tests:

```bash
cd services/job-service
npm test -- playbooks.service.spec.ts
```

### Integration Tests

Create integration tests to verify the full flow:

```typescript
describe('Playbooks Integration', () => {
  it('should recommend and apply playbook', async () => {
    // Create a test job
    const job = await createTestJob({ country: 'United States' });

    // Get recommendation
    const recommendation = await request(app.getHttpServer())
      .post('/api/v1/playbooks/recommend')
      .send({ job_id: job.id })
      .expect(200);

    expect(recommendation.body.recommended_playbook.region).toBe('united_states');

    // Apply playbook
    const application = await request(app.getHttpServer())
      .post('/api/v1/playbooks/apply')
      .send({
        job_id: job.id,
        playbook_id: recommendation.body.recommended_playbook.id,
        user_id: testUserId,
        auto_format_resume: true,
      })
      .expect(201);

    expect(application.body.recommendations).toHaveLength(5);
  });
});
```

## Monitoring

### Key Metrics to Track

1. **Playbook Usage**:
   - Track `usage_count` for each playbook
   - Monitor which regions are most popular

2. **Success Rates**:
   - Track `success_rate` per playbook
   - Monitor interview rates and offer rates

3. **Application Metrics**:
   - Average response time by region
   - ATS compatibility scores
   - User ratings

### Dashboard Queries

```sql
-- Top performing playbooks
SELECT
  region,
  name,
  usage_count,
  success_rate,
  ROUND(success_rate * usage_count / 100, 2) as successful_applications
FROM playbooks
ORDER BY successful_applications DESC;

-- Application statistics by region
SELECT
  p.region,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN pa.got_interview THEN 1 END) as interviews,
  COUNT(CASE WHEN pa.got_offer THEN 1 END) as offers,
  ROUND(AVG(pa.response_time_hours), 2) as avg_response_hours
FROM playbook_applications pa
JOIN playbooks p ON pa.playbook_id = p.id
GROUP BY p.region
ORDER BY total_applications DESC;
```

## Rollback Plan

If you need to rollback the playbooks feature:

### Step 1: Remove from App Module

```typescript
// In app.module.ts, remove:
import { PlaybooksModule } from './modules/playbooks/playbooks.module';

// And remove from imports array:
PlaybooksModule,
```

### Step 2: Revert Database Migration

```bash
npm run migration:revert
```

### Step 3: Keep Data for Analysis

If you want to preserve playbook application data for analysis:

```sql
-- Create backup
CREATE TABLE playbook_applications_backup AS
SELECT * FROM playbook_applications;

CREATE TABLE playbooks_backup AS
SELECT * FROM playbooks;
```

## Troubleshooting

### Playbooks Not Seeding

If playbooks aren't automatically seeded:

```typescript
// Manually trigger seeding
import { PlaybooksService } from './modules/playbooks/playbooks.service';

const service = app.get(PlaybooksService);
await service.onModuleInit();
```

### Region Detection Issues

If jobs aren't being matched to the correct region:

1. Check job country field is properly populated
2. Verify country name matches expected values
3. Add logging to `determineRegion` method
4. Consider adding country code mapping

### ATS Compatibility Scores Low

If ATS compatibility scores are consistently low:

1. Verify job has `ats_platform` field populated
2. Check playbook `common_ats_systems` arrays
3. Review resume formatting against playbook requirements

## Performance Considerations

### Caching

Consider caching playbooks since they rarely change:

```typescript
// Add caching to PlaybooksService
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PlaybooksService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ... other dependencies
  ) {}

  async findByRegion(region: Region): Promise<Playbook> {
    const cacheKey = `playbook:region:${region}`;
    const cached = await this.cacheManager.get<Playbook>(cacheKey);

    if (cached) return cached;

    const playbook = await this.playbookRepository.findOne({
      where: { region, is_active: true },
    });

    if (playbook) {
      await this.cacheManager.set(cacheKey, playbook, 3600000); // 1 hour
    }

    return playbook;
  }
}
```

### Database Indexing

Ensure proper indexes exist (already defined in entities):

```sql
-- Verify indexes
\d playbooks
\d playbook_applications
```

## Support

For issues or questions:
- Check the module README: `services/job-service/src/modules/playbooks/README.md`
- Review unit tests for usage examples
- Contact the development team

## Next Steps

1. Complete database migration
2. Verify playbooks seeded correctly
3. Test API endpoints
4. Integrate with frontend
5. Connect to resume service
6. Monitor metrics and success rates
7. Gather user feedback for improvements
