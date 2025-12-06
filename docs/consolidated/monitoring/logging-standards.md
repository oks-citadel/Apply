# JobPilot AI Platform - Logging Standards

## Overview

This document defines the logging standards for all JobPilot AI Platform microservices. Consistent logging practices enable effective monitoring, troubleshooting, and system observability across our distributed architecture.

## Table of Contents

1. [Log Levels](#log-levels)
2. [Required Fields](#required-fields)
3. [Logging Best Practices](#logging-best-practices)
4. [NestJS Service Implementation](#nestjs-service-implementation)
5. [Python AI Service Implementation](#python-ai-service-implementation)
6. [Correlation and Tracing](#correlation-and-tracing)
7. [Searching Logs in Azure Portal](#searching-logs-in-azure-portal)
8. [Common Patterns](#common-patterns)
9. [Security and Privacy](#security-and-privacy)

---

## Log Levels

### ERROR

**When to use:**
- Critical errors that require immediate attention
- Unhandled exceptions that impact service functionality
- Failed critical operations (database connection failures, external API errors)
- Data corruption or integrity issues

**Example:**
```typescript
logger.error('Failed to process payment', error, {
  userId: user.id,
  amount: payment.amount,
  paymentId: payment.id,
});
```

**Environment Configuration:**
- Production: Always logged
- Staging: Always logged
- Development: Always logged
- Test: Always logged

---

### WARN

**When to use:**
- Recoverable errors or degraded functionality
- Deprecated feature usage
- Configuration issues that don't prevent operation
- Rate limiting triggered
- Resource constraints (high memory, disk space)
- Retry attempts

**Example:**
```typescript
logger.warn('API rate limit approaching threshold', {
  currentRate: 95,
  threshold: 100,
  endpoint: '/api/jobs/search',
});
```

**Environment Configuration:**
- Production: Always logged
- Staging: Always logged
- Development: Always logged
- Test: Logged

---

### INFO

**When to use:**
- Significant business events (user registration, job application submitted)
- Service lifecycle events (startup, shutdown, configuration loaded)
- Successful completion of important operations
- Scheduled job executions
- External API calls (successful)
- Authentication events (login, logout, token refresh)

**Example:**
```typescript
logger.info('User registered successfully', {
  userId: user.id,
  email: user.email,
  registrationMethod: 'email',
});
```

**Environment Configuration:**
- Production: Logged (default level)
- Staging: Logged (default level)
- Development: Logged
- Test: Not logged by default

---

### DEBUG

**When to use:**
- Detailed execution flow for troubleshooting
- Variable values and state changes
- Conditional logic paths taken
- Database query details
- Cache hits/misses
- Internal function calls

**Example:**
```typescript
logger.debug('Processing job matching algorithm', {
  userId: user.id,
  criteriaCount: criteria.length,
  jobPoolSize: jobs.length,
  matchingStrategy: 'semantic',
});
```

**Environment Configuration:**
- Production: Not logged
- Staging: Not logged
- Development: Logged (default level)
- Test: Not logged

---

### TRACE

**When to use:**
- Very detailed diagnostic information
- Entry/exit of functions
- Loop iterations with data
- Network packet details
- Low-level system calls

**Example:**
```typescript
logger.trace('Entering resume parsing function', {
  fileName: file.name,
  fileSize: file.size,
  mimeType: file.mimeType,
});
```

**Environment Configuration:**
- Production: Never logged
- Staging: Never logged
- Development: Only when explicitly enabled
- Test: Never logged

---

## Required Fields

### All Log Entries Must Include:

1. **timestamp** - ISO 8601 format (automatically added)
2. **level** - Log level (error, warn, info, debug, trace)
3. **message** - Clear, concise description of the event
4. **serviceName** - Name of the microservice (e.g., 'auth-service')
5. **environment** - Environment name (production, staging, development)
6. **version** - Service version
7. **correlationId** - Request correlation ID for tracing

### Context-Specific Required Fields:

**HTTP Request Logs:**
```typescript
{
  method: 'POST',
  url: '/api/jobs/apply',
  statusCode: 200,
  duration: 145,
  correlationId: 'abc123',
  requestId: 'def456',
  userId: 'user123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
}
```

**Error Logs:**
```typescript
{
  errorName: 'ValidationError',
  errorMessage: 'Invalid email format',
  errorStack: '...',
  statusCode: 400,
  path: '/api/auth/register',
  method: 'POST',
  userId: 'user123',
  correlationId: 'abc123',
}
```

**Business Event Logs:**
```typescript
{
  eventType: 'job_application_submitted',
  userId: 'user123',
  jobId: 'job456',
  applicationId: 'app789',
  metadata: { ... },
}
```

---

## Logging Best Practices

### 1. Write Clear, Actionable Messages

**Good:**
```typescript
logger.error('Failed to send email notification', error, {
  userId: user.id,
  emailType: 'job_alert',
  recipientEmail: user.email,
  smtpError: error.code,
});
```

**Bad:**
```typescript
logger.error('Error occurred'); // Too vague
logger.error(error.toString()); // Not actionable
```

### 2. Include Relevant Context

Always include enough context to understand what happened without looking at the code:

```typescript
logger.info('Job search completed', {
  userId: user.id,
  searchQuery: query,
  resultsCount: results.length,
  duration: elapsed,
  filters: {
    location: filters.location,
    experienceLevel: filters.experienceLevel,
  },
});
```

### 3. Use Structured Data

Prefer structured fields over string concatenation:

**Good:**
```typescript
logger.info('User login successful', {
  userId: user.id,
  loginMethod: 'google-oauth',
  ipAddress: req.ip,
});
```

**Bad:**
```typescript
logger.info(`User ${user.id} logged in via ${method} from ${req.ip}`);
```

### 4. Don't Log Sensitive Information

**Never log:**
- Passwords (hashed or plain)
- Authentication tokens
- API keys
- Credit card numbers
- Social Security Numbers
- Personal health information
- Full session data

The logging framework automatically redacts common sensitive fields, but always be cautious.

### 5. Log at Appropriate Levels

Don't log everything at ERROR or INFO level. Use the appropriate level for the event significance.

### 6. Avoid Logging in Tight Loops

**Bad:**
```typescript
jobs.forEach(job => {
  logger.debug('Processing job', { jobId: job.id }); // Too noisy
  processJob(job);
});
```

**Good:**
```typescript
logger.debug('Processing job batch', {
  jobCount: jobs.length,
  batchId: batch.id,
});
jobs.forEach(job => processJob(job));
logger.debug('Job batch processing completed', {
  jobCount: jobs.length,
  successCount: results.success,
  failureCount: results.failures,
});
```

### 7. Use Correlation IDs

Always propagate correlation IDs through your service calls:

```typescript
// The logging interceptor automatically handles this
// But for manual service calls:
const correlationId = LoggerContext.getCorrelationId();
await externalService.call({ headers: { 'X-Correlation-ID': correlationId } });
```

---

## NestJS Service Implementation

### 1. Inject Logger in Services

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@jobpilot/logging';

@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  async createUser(userData: CreateUserDto) {
    this.logger.info('Creating new user', {
      email: userData.email,
      method: 'email',
    });

    try {
      const user = await this.userRepository.save(userData);

      this.logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error, {
        email: userData.email,
      });
      throw error;
    }
  }
}
```

### 2. Track Operations

```typescript
async processLargeOperation() {
  const operationId = this.logger.startOperation('process-job-applications');

  try {
    // ... operation logic ...

    this.logger.endOperation(operationId, true, {
      processedCount: results.length,
    });
  } catch (error) {
    this.logger.endOperation(operationId, false, {
      error: error.message,
    });
    throw error;
  }
}
```

### 3. Track Custom Metrics

```typescript
this.logger.trackMetric('job.application.processing.time', duration, {
  jobId: job.id,
  userId: user.id,
});

this.logger.trackEvent('job.application.submitted', {
  jobId: job.id,
  userId: user.id,
  source: 'web',
});
```

---

## Python AI Service Implementation

### 1. Use Logging Configuration

```python
from src.logging_config import get_logger

logger = get_logger()

async def process_resume(resume_data: dict):
    logger.info('Processing resume',
                userId=resume_data['user_id'],
                fileName=resume_data['file_name'])

    try:
        result = await parse_resume(resume_data)

        logger.info('Resume processed successfully',
                    userId=resume_data['user_id'],
                    sections_found=len(result['sections']))

        return result
    except Exception as e:
        logger.error('Failed to process resume',
                     exc_info=e,
                     userId=resume_data['user_id'],
                     fileName=resume_data['file_name'])
        raise
```

### 2. Context Management

The `CorrelationMiddleware` automatically handles correlation IDs for FastAPI requests.

```python
# Context is automatically available
from src.logging_config import correlation_id_var

correlation_id = correlation_id_var.get()
```

---

## Correlation and Tracing

### Correlation ID Flow

1. **Client Request** → Includes `X-Correlation-ID` header (or one is generated)
2. **API Gateway** → Propagates correlation ID
3. **Service A** → Logs with correlation ID, passes to Service B
4. **Service B** → Logs with same correlation ID
5. **Response** → Includes correlation ID in response headers

### Implementation

**NestJS (Automatic via LoggingInterceptor):**
```typescript
// Automatically handled by LoggingModule
// Correlation ID is extracted/generated and propagated
```

**Making HTTP Calls Between Services:**
```typescript
import { LoggerContext } from '@jobpilot/logging';

const correlationId = LoggerContext.getCorrelationId();
const response = await httpService.post(url, data, {
  headers: {
    'X-Correlation-ID': correlationId,
    'X-Request-ID': LoggerContext.getRequestId(),
  },
});
```

**Python FastAPI (Automatic via CorrelationMiddleware):**
```python
# Already configured in main.py
app.add_middleware(CorrelationMiddleware, logger=logger)
```

---

## Searching Logs in Azure Portal

### Access Application Insights

1. Navigate to Azure Portal: https://portal.azure.com
2. Go to your Application Insights resource
3. Select "Logs" from the left menu

### Common Queries

**Find all errors for a specific user:**
```kusto
traces
| where customDimensions.userId == "user123"
| where severityLevel >= 3
| order by timestamp desc
| take 100
```

**Track a request through all services:**
```kusto
traces
| where customDimensions.correlationId == "abc-123-def"
| order by timestamp asc
| project timestamp, cloud_RoleName, message, customDimensions
```

**Monitor error rates:**
```kusto
traces
| where severityLevel >= 3
| summarize ErrorCount = count() by bin(timestamp, 5m), cloud_RoleName
| render timechart
```

**Find slow requests:**
```kusto
traces
| where message contains "Request completed"
| where customDimensions.duration > 3000
| project timestamp, cloud_RoleName, customDimensions.method,
          customDimensions.url, customDimensions.duration
| order by customDimensions.duration desc
```

**Search by specific operation:**
```kusto
traces
| where customDimensions.operationId == "op-789"
| order by timestamp asc
```

**Monitor service health:**
```kusto
traces
| where message contains "health check"
| summarize by cloud_RoleName, customDimensions.status
| order by cloud_RoleName
```

### Advanced Queries

**Exception analysis:**
```kusto
exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc
```

**Performance metrics:**
```kusto
customMetrics
| where name == "http.request.duration"
| summarize avg(value), percentile(value, 95) by bin(timestamp, 15m)
| render timechart
```

**User activity tracking:**
```kusto
traces
| where customDimensions.userId != ""
| summarize count() by customDimensions.userId, cloud_RoleName
| order by count_ desc
| take 20
```

---

## Common Patterns

### Pattern 1: Service Method with Operation Tracking

```typescript
async performComplexOperation(params: OperationParams) {
  const operationId = this.logger.startOperation('complex-operation');

  this.logger.info('Starting complex operation', {
    operationId,
    params: this.sanitizeParams(params),
  });

  try {
    const step1 = await this.step1(params);
    this.logger.debug('Step 1 completed', { operationId, result: step1 });

    const step2 = await this.step2(step1);
    this.logger.debug('Step 2 completed', { operationId, result: step2 });

    const result = await this.step3(step2);

    this.logger.endOperation(operationId, true, {
      resultSize: result.length,
      duration: Date.now() - start,
    });

    return result;
  } catch (error) {
    this.logger.error('Complex operation failed', error, {
      operationId,
      failedAt: this.determineFailurePoint(error),
    });

    this.logger.endOperation(operationId, false);
    throw error;
  }
}
```

### Pattern 2: External API Call Logging

```typescript
async callExternalAPI(endpoint: string, data: any) {
  const startTime = Date.now();

  this.logger.debug('Calling external API', {
    endpoint,
    method: 'POST',
  });

  try {
    const response = await axios.post(endpoint, data);
    const duration = Date.now() - startTime;

    this.logger.trackDependency(
      'HTTP',
      endpoint,
      JSON.stringify(data),
      duration,
      true,
      response.status,
    );

    this.logger.info('External API call successful', {
      endpoint,
      statusCode: response.status,
      duration,
    });

    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;

    this.logger.trackDependency(
      'HTTP',
      endpoint,
      JSON.stringify(data),
      duration,
      false,
      error.response?.status,
    );

    this.logger.error('External API call failed', error, {
      endpoint,
      statusCode: error.response?.status,
      duration,
    });

    throw error;
  }
}
```

### Pattern 3: Background Job Processing

```typescript
@Cron('0 */6 * * *') // Every 6 hours
async processScheduledJob() {
  const jobId = uuidv4();

  this.logger.info('Starting scheduled job', {
    jobId,
    jobName: 'sync-external-jobs',
  });

  try {
    const results = await this.syncJobs();

    this.logger.info('Scheduled job completed', {
      jobId,
      jobName: 'sync-external-jobs',
      processed: results.processed,
      failed: results.failed,
      duration: results.duration,
    });

    this.logger.trackEvent('scheduled.job.completed', {
      jobName: 'sync-external-jobs',
      success: true,
    }, {
      processedCount: results.processed,
      failedCount: results.failed,
    });
  } catch (error) {
    this.logger.error('Scheduled job failed', error, {
      jobId,
      jobName: 'sync-external-jobs',
    });

    this.logger.trackEvent('scheduled.job.failed', {
      jobName: 'sync-external-jobs',
      error: error.message,
    });
  }
}
```

---

## Security and Privacy

### Automatic Redaction

The logging framework automatically redacts the following patterns:
- password
- secret
- token
- api_key / apikey
- authorization
- credential
- private_key
- access_key
- session
- cookie
- ssn
- credit_card
- cvv

### Manual Sanitization

When logging user input or sensitive data, use the sanitization functions:

```typescript
import { sanitizeLogData } from '@jobpilot/logging';

const sanitizedData = sanitizeLogData(userData, {
  customPatterns: [/phone/i, /address/i],
});

logger.info('User data received', sanitizedData);
```

### GDPR Compliance

- Never log personal data unless absolutely necessary
- Use user IDs instead of names or emails when possible
- Implement log retention policies (default: 90 days)
- Support data deletion requests by correlation with user ID

---

## Environment Variables

Set these in your service's `.env` file:

```bash
# Application Insights
APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=your-key-here

# Log Level (error, warn, info, debug, trace)
LOG_LEVEL=info

# Service Info
SERVICE_NAME=auth-service
SERVICE_VERSION=1.0.0
NODE_ENV=production
```

---

## Support and Questions

For questions about logging standards or implementation:
- Review this document
- Check the `@jobpilot/logging` package documentation
- Contact the platform team

**Last Updated:** 2024-12-04
**Version:** 1.0.0
