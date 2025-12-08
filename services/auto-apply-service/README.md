# Auto-Apply Service

Automated job application service with browser automation using Playwright and intelligent form mapping.

## Features

- **Browser Automation**: Powered by Playwright for reliable, headless browser automation
- **Multi-Platform Support**: Adapters for 6+ major ATS platforms:
  - Workday
  - Greenhouse
  - Lever
  - iCIMS
  - Taleo
  - SmartRecruiters
- **Intelligent Form Mapping**: Automatically detects and fills form fields
- **Queue Management**: Bull queue for reliable, rate-limited application submission
- **CAPTCHA Detection**: Automatically detects CAPTCHAs and flags for manual intervention
- **Screenshot Capture**: Takes screenshots of completed applications
- **Error Handling**: Comprehensive error handling with retry logic
- **Analytics**: Track application success rates, response rates, and more

## Architecture

```
auto-apply-service/
├── src/
│   ├── modules/
│   │   ├── applications/      # Application records & auto-apply settings
│   │   ├── adapters/          # ATS platform-specific adapters
│   │   ├── browser/           # Playwright browser service
│   │   ├── form-mapping/      # Intelligent form field detection
│   │   └── queue/             # Bull queue for job processing
│   ├── config/               # Configuration files
│   ├── migrations/           # Database migrations
│   └── main.ts              # Application entry point
```

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Playwright browsers installed

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

3. Set up environment variables (see `.env.example`):
```bash
cp .env.example .env
```

4. Run database migrations:
```bash
npm run migration:run
```

## Environment Variables

```bash
# Server
PORT=8005
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=auto_apply_db

# Redis (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_TLS=false

# Browser Configuration
BROWSER_HEADLESS=true
BROWSER_SLOW_MO=0
BROWSER_TIMEOUT=30000

# Logging
LOG_LEVEL=info
APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=

# CORS
CORS_ORIGIN=*
```

## API Endpoints

### Applications

- `GET /api/v1/applications` - List all applications
- `GET /api/v1/applications/:id` - Get application by ID
- `GET /api/v1/applications/analytics` - Get application analytics
- `POST /api/v1/applications/manual` - Log a manual application
- `PUT /api/v1/applications/:id` - Update application
- `PUT /api/v1/applications/:id/status` - Update application status
- `DELETE /api/v1/applications/:id` - Delete application

### Auto-Apply

- `GET /api/v1/auto-apply/settings` - Get user's auto-apply settings
- `PUT /api/v1/auto-apply/settings` - Update auto-apply settings
- `POST /api/v1/auto-apply/start` - Start auto-apply for user
- `POST /api/v1/auto-apply/stop` - Stop auto-apply for user
- `GET /api/v1/auto-apply/status` - Get auto-apply status

### Queue Management

- `GET /api/v1/auto-apply/queue/stats` - Get queue statistics
- `GET /api/v1/auto-apply/queue/jobs` - Get queued jobs
- `GET /api/v1/auto-apply/queue/failed` - Get failed jobs
- `POST /api/v1/auto-apply/queue/:jobId/retry` - Retry a failed job
- `POST /api/v1/auto-apply/queue/:jobId/remove` - Remove job from queue
- `POST /api/v1/auto-apply/queue/pause` - Pause the queue
- `POST /api/v1/auto-apply/queue/resume` - Resume the queue
- `POST /api/v1/auto-apply/queue/clear` - Clear all jobs from queue

## Usage

### Starting Auto-Apply

1. Configure auto-apply settings:
```bash
curl -X PUT http://localhost:8005/api/v1/auto-apply/settings \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{
    "enabled": true,
    "resumeId": "resume-uuid",
    "maxApplicationsPerDay": 50,
    "filters": {
      "jobTitle": ["Software Engineer", "Backend Developer"],
      "location": ["Remote", "New York"],
      "experienceLevel": ["Mid-Level", "Senior"]
    }
  }'
```

2. Start auto-apply:
```bash
curl -X POST http://localhost:8005/api/v1/auto-apply/start \
  -H "x-user-id: YOUR_USER_ID"
```

3. Check status:
```bash
curl http://localhost:8005/api/v1/auto-apply/status \
  -H "x-user-id: YOUR_USER_ID"
```

### Adding Applications to Queue

```typescript
import { QueueService } from './modules/queue/queue.service';

await queueService.addApplicationToQueue({
  userId: 'user-uuid',
  jobUrl: 'https://example.greenhouse.io/jobs/123',
  resumePath: '/path/to/resume.pdf',
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
  },
  preferences: {
    workAuthorization: true,
    requiresSponsorship: false,
  }
});
```

## ATS Adapter Development

To add support for a new ATS platform:

1. Create a new adapter class extending `BaseATSAdapter`:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseATSAdapter, ApplicationData, ApplicationResult } from './base.adapter';

@Injectable()
export class CustomATSAdapter extends BaseATSAdapter {
  protected readonly platformName = 'custom-ats';

  detectPlatform(url: string): boolean {
    return url.includes('custom-ats.com');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    const page = await this.browserService.createPage(data.userId);

    try {
      await this.navigateToJob(page, data.jobUrl);

      // Check for CAPTCHA
      if (await this.checkForCaptcha(page)) {
        return {
          success: false,
          captchaDetected: true,
          requiresManualIntervention: true,
          error: 'CAPTCHA detected',
        };
      }

      // Implement application logic
      // 1. Click apply button
      // 2. Fill form fields
      // 3. Upload documents
      // 4. Submit application

      return {
        success: true,
        applicationId: 'extracted-id',
        screenshotPath: '/path/to/screenshot.png',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        requiresManualIntervention: true,
      };
    } finally {
      await this.browserService.closePage(page);
    }
  }
}
```

2. Register the adapter in `AdaptersModule`:

```typescript
@Module({
  providers: [
    // ... existing adapters
    CustomATSAdapter,
  ],
  exports: [
    // ... existing adapters
    CustomATSAdapter,
  ],
})
export class AdaptersModule {}
```

3. Add the adapter to `ApplicationProcessor`:

```typescript
constructor(
  // ... existing adapters
  private readonly customATSAdapter: CustomATSAdapter,
) {}

private selectAdapter(url: string) {
  const adapters = [
    // ... existing adapters
    this.customATSAdapter,
  ];
  // ...
}
```

## Rate Limiting

The service implements platform-specific rate limiting to avoid detection:

- Workday: 20 applications/hour (3 min delay)
- Greenhouse: 30 applications/hour (2 min delay)
- Lever: 30 applications/hour (2 min delay)
- iCIMS: 25 applications/hour (2.4 min delay)
- Taleo: 15 applications/hour (4 min delay)
- SmartRecruiters: 30 applications/hour (2 min delay)
- Default: 20 applications/hour (3 min delay)

## Form Field Detection

The service uses intelligent form field detection with semantic mapping:

- **Contact Information**: email, phone, firstName, lastName
- **Address Fields**: addressLine1, city, state, postalCode, country
- **Professional Info**: currentCompany, currentTitle, yearsOfExperience
- **Documents**: resume, coverLetter
- **Links**: linkedinUrl, portfolioUrl
- **Preferences**: salaryExpectation, availability, workAuthorization

## Error Handling

The service provides multiple levels of error handling:

1. **Retry Logic**: Failed applications are automatically retried (up to 3 attempts)
2. **CAPTCHA Detection**: Flags applications requiring manual intervention
3. **Screenshot Capture**: Takes screenshots on both success and failure
4. **Error Logging**: Comprehensive error logs with stack traces
5. **Manual Intervention Flags**: Marks applications that need human review

## Testing

Run tests:
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Development

Start in development mode:
```bash
npm run start:dev
```

Build for production:
```bash
npm run build
```

Start production build:
```bash
npm run start:prod
```

## Database Schema

### Applications Table

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `job_id`: UUID (foreign key to jobs)
- `resume_id`: UUID
- `cover_letter_id`: UUID
- `status`: ENUM (applied, viewed, interviewing, offered, rejected, withdrawn)
- `applied_at`: TIMESTAMP
- `response_received_at`: TIMESTAMP
- `match_score`: FLOAT
- `auto_applied`: BOOLEAN
- `notes`: TEXT
- `company_name`: VARCHAR
- `position_title`: VARCHAR
- `application_url`: VARCHAR
- `ats_platform`: VARCHAR
- `application_reference_id`: VARCHAR
- `screenshot_url`: TEXT
- `form_responses`: JSON
- `error_log`: JSON
- `retry_count`: INTEGER
- `queue_status`: VARCHAR
- `source`: ENUM (manual, auto_apply, quick_apply)

### Auto Apply Settings Table

- `id`: UUID (primary key)
- `user_id`: UUID (unique, foreign key to users)
- `enabled`: BOOLEAN
- `filters`: JSONB (job filters)
- `resume_id`: UUID
- `cover_letter_template`: TEXT
- `max_applications_per_day`: INTEGER
- `auto_response`: BOOLEAN

### Form Mappings Table

- `id`: UUID (primary key)
- `company_name`: VARCHAR
- `ats_platform`: VARCHAR
- `field_selector`: VARCHAR
- `field_type`: VARCHAR
- `semantic_field`: VARCHAR
- `field_attributes`: JSON
- `confidence_score`: INTEGER
- `usage_count`: INTEGER
- `is_active`: BOOLEAN

## Monitoring

The service integrates with Application Insights for monitoring:

- Request/response metrics
- Error rates and stack traces
- Custom events for application submissions
- Performance metrics
- Queue statistics

## Security Considerations

- **Anti-Detection**: Implements human-like behavior patterns
- **Rate Limiting**: Platform-specific rate limits to avoid detection
- **User Agent Rotation**: Uses realistic browser user agents
- **CAPTCHA Handling**: Detects and flags CAPTCHAs for manual resolution
- **Data Privacy**: Encrypts sensitive user data
- **Authentication**: Requires user authentication for all operations

## Troubleshooting

### Playwright Browser Issues

If browsers fail to launch:
```bash
# Reinstall browsers
npx playwright install chromium --force

# Check browser installation
npx playwright install --dry-run
```

### Queue Not Processing

Check Redis connection:
```bash
redis-cli ping
```

Check queue stats:
```bash
curl http://localhost:8005/api/v1/auto-apply/queue/stats
```

### Form Field Not Being Filled

Enable debug logging:
```bash
LOG_LEVEL=debug npm run start:dev
```

Check form mapping detection:
```typescript
const fields = await formMappingService.detectFormFields(page);
console.log('Detected fields:', fields);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Link to issues]
- Documentation: [Link to docs]
- Email: support@jobpilot.com
