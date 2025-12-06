# @jobpilot/logging

Shared logging package for JobPilot AI Platform with Azure Application Insights integration.

## Features

- Azure Application Insights integration for centralized logging
- Structured JSON logging with Winston
- Automatic correlation ID tracking for distributed tracing
- Request/response logging middleware
- Sensitive data redaction
- NestJS module with dependency injection
- TypeScript support
- Environment-based log levels
- Performance tracking and metrics

## Installation

```bash
npm install @jobpilot/logging
```

## Quick Start

### NestJS Integration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingModule, LoggingInterceptor } from '@jobpilot/logging';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggingModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        serviceName: 'my-service',
        environment: configService.get('NODE_ENV', 'development'),
        version: configService.get('SERVICE_VERSION', '1.0.0'),
        appInsightsKey: configService.get('APPLICATIONINSIGHTS_INSTRUMENTATION_KEY'),
        enableConsole: true,
        logLevel: configService.get('LOG_LEVEL', 'info') as any,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

### Using Logger in Services

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@jobpilot/logging';

@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  async createUser(userData: CreateUserDto) {
    this.logger.info('Creating user', { email: userData.email });

    try {
      const user = await this.repository.save(userData);

      this.logger.info('User created', {
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

## API Reference

### Logger Methods

#### `info(message: string, metadata?: LogMetadata): void`
Log informational messages about normal application operation.

```typescript
logger.info('User logged in', {
  userId: user.id,
  loginMethod: 'google',
});
```

#### `warn(message: string, metadata?: LogMetadata): void`
Log warning conditions that should be addressed.

```typescript
logger.warn('API rate limit approaching', {
  currentRate: 95,
  threshold: 100,
});
```

#### `error(message: string, error?: Error, metadata?: LogMetadata): void`
Log error conditions requiring attention.

```typescript
logger.error('Database query failed', error, {
  query: 'SELECT * FROM users',
  userId: user.id,
});
```

#### `debug(message: string, metadata?: LogMetadata): void`
Log detailed debugging information.

```typescript
logger.debug('Cache lookup', {
  key: cacheKey,
  hit: true,
});
```

#### `trace(message: string, metadata?: LogMetadata): void`
Log very detailed trace information.

```typescript
logger.trace('Function entry', {
  functionName: 'processPayment',
  args: { amount: 100 },
});
```

### Tracking Methods

#### `trackEvent(name: string, properties?: LogMetadata, measurements?: { [key: string]: number }): void`
Track custom events in Application Insights.

```typescript
logger.trackEvent('job.application.submitted', {
  jobId: job.id,
  userId: user.id,
}, {
  processingTime: 150,
});
```

#### `trackMetric(name: string, value: number, properties?: LogMetadata): void`
Track custom metrics in Application Insights.

```typescript
logger.trackMetric('api.response.time', 250, {
  endpoint: '/api/jobs',
  statusCode: '200',
});
```

#### `trackDependency(...): void`
Track external dependencies (APIs, databases).

```typescript
logger.trackDependency(
  'HTTP',
  'https://api.external.com/jobs',
  'POST /jobs',
  duration,
  success,
  statusCode,
);
```

### Operation Tracking

#### `startOperation(operationName: string): string`
Start tracking a long-running operation.

```typescript
const operationId = logger.startOperation('process-applications');
```

#### `endOperation(operationId: string, success: boolean, metadata?: LogMetadata): void`
End tracking an operation.

```typescript
logger.endOperation(operationId, true, {
  processedCount: 100,
});
```

### Context Management

The `LoggerContext` class manages correlation IDs and other contextual information.

```typescript
import { LoggerContext } from '@jobpilot/logging';

// Get correlation ID
const correlationId = LoggerContext.getCorrelationId();

// Set user context
LoggerContext.setUserId(user.id);

// Run code in isolated context
LoggerContext.run(() => {
  // This will have its own correlation ID
  logger.info('Processing in isolated context');
});
```

## Configuration

### Environment Variables

```bash
# Required
APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=your-key-here
SERVICE_NAME=my-service
NODE_ENV=production

# Optional
LOG_LEVEL=info
SERVICE_VERSION=1.0.0
```

### Log Levels by Environment

- **Production**: INFO and above
- **Staging**: INFO and above
- **Development**: DEBUG and above
- **Test**: WARN and above

## Middleware

### Request Logging Middleware (Express)

```typescript
import { requestLoggingMiddleware } from '@jobpilot/logging';

app.use(requestLoggingMiddleware({
  logger,
  excludePaths: ['/health', '/metrics'],
  includeBody: false,
  includeHeaders: false,
}));
```

### Correlation Middleware

```typescript
import { correlationMiddleware } from '@jobpilot/logging';

app.use(correlationMiddleware());
```

## Sensitive Data Redaction

The package automatically redacts sensitive data patterns:
- passwords
- tokens
- api keys
- authorization headers
- credentials
- private keys
- session data
- credit card numbers
- SSN

Custom sanitization:

```typescript
import { sanitizeLogData } from '@jobpilot/logging';

const sanitized = sanitizeLogData(data, {
  customPatterns: [/phone/i, /address/i],
});
```

## Best Practices

1. **Use structured logging**: Pass metadata as objects, not concatenated strings
2. **Include correlation IDs**: Always propagate correlation IDs to downstream services
3. **Don't log sensitive data**: Use sanitization for user input
4. **Choose appropriate log levels**: Don't log everything at INFO or ERROR
5. **Add context**: Include relevant IDs (userId, jobId, etc.) in logs
6. **Track operations**: Use `startOperation/endOperation` for long-running tasks
7. **Monitor dependencies**: Track external API calls with `trackDependency`

## Example: Complete Service Implementation

```typescript
import { Injectable } from '@nestjs/common';
import { Logger, LoggerContext } from '@jobpilot/logging';

@Injectable()
export class JobService {
  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
  ) {}

  async processJobApplication(applicationData: ApplicationDto) {
    const operationId = this.logger.startOperation('process-job-application');

    this.logger.info('Processing job application', {
      jobId: applicationData.jobId,
      userId: applicationData.userId,
      operationId,
    });

    try {
      // Step 1: Validate application
      await this.validateApplication(applicationData);
      this.logger.debug('Application validated', { operationId });

      // Step 2: Call external API
      const startTime = Date.now();
      const response = await this.httpService.post(
        'https://api.external.com/applications',
        applicationData,
        {
          headers: {
            'X-Correlation-ID': LoggerContext.getCorrelationId(),
          },
        },
      );
      const duration = Date.now() - startTime;

      this.logger.trackDependency(
        'HTTP',
        'https://api.external.com/applications',
        'POST /applications',
        duration,
        true,
        response.status,
      );

      // Step 3: Save to database
      const application = await this.repository.save(applicationData);

      this.logger.trackEvent('job.application.submitted', {
        jobId: applicationData.jobId,
        userId: applicationData.userId,
        applicationId: application.id,
      }, {
        processingTime: Date.now() - startTime,
      });

      this.logger.endOperation(operationId, true, {
        applicationId: application.id,
      });

      return application;
    } catch (error) {
      this.logger.error('Failed to process job application', error, {
        jobId: applicationData.jobId,
        userId: applicationData.userId,
        operationId,
      });

      this.logger.endOperation(operationId, false);
      throw error;
    }
  }
}
```

## Troubleshooting

### Logs not appearing in Application Insights

1. Verify `APPLICATIONINSIGHTS_INSTRUMENTATION_KEY` is set correctly
2. Check network connectivity to Azure
3. Logs may take 1-2 minutes to appear
4. Use `logger.flush()` before application shutdown

### Correlation IDs not propagating

1. Ensure `LoggingInterceptor` is registered globally
2. Use `LoggerContext.getCorrelationId()` when making HTTP calls
3. Include `X-Correlation-ID` header in all service-to-service calls

### Too many logs / performance issues

1. Adjust `LOG_LEVEL` environment variable
2. Exclude high-traffic endpoints from request logging
3. Use DEBUG/TRACE levels sparingly in production
4. Avoid logging in tight loops

## License

MIT

## Support

For issues, questions, or contributions, please contact the platform team.
