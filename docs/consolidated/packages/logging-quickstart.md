# Quick Start Guide - @jobpilot/logging

Get started with standardized logging in 5 minutes.

## Step 1: Install Dependencies (Development Setup)

```bash
# Navigate to logging package
cd packages/logging

# Install dependencies
npm install

# Build the package
npm run build

# Link for local development
npm link

# Navigate to your service
cd ../../services/your-service

# Link the logging package
npm link @jobpilot/logging
```

## Step 2: Configure Environment Variables

Create or update your `.env` file:

```bash
# Required for Application Insights
APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=your-instrumentation-key-here

# Service configuration
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
NODE_ENV=development

# Log level (error, warn, info, debug, trace)
LOG_LEVEL=info
```

## Step 3: Update app.module.ts

The services are already configured, but here's the template:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingModule, LoggingInterceptor } from '@jobpilot/logging';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Add Logging Module
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
    // Add Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

## Step 4: Use Logger in Your Services

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@jobpilot/logging';

@Injectable()
export class MyService {
  constructor(private readonly logger: Logger) {}

  async myMethod() {
    // Info log
    this.logger.info('Processing started', { recordId: '123' });

    try {
      // Your business logic here
      const result = await this.doSomething();

      this.logger.info('Processing completed', {
        recordId: '123',
        result: result.id
      });

      return result;
    } catch (error) {
      // Error with exception
      this.logger.error('Processing failed', error, { recordId: '123' });
      throw error;
    }
  }
}
```

## Step 5: Start Your Service and Verify

```bash
npm run start:dev
```

You should see structured JSON logs in your console:

```json
{
  "timestamp": "2024-12-04T10:30:00.000Z",
  "level": "info",
  "message": "Processing started",
  "serviceName": "my-service",
  "correlationId": "abc-123",
  "recordId": "123"
}
```

## Common Use Cases

### Log Different Levels

```typescript
// Information
this.logger.info('User logged in', { userId: user.id });

// Warning
this.logger.warn('High memory usage', { usage: 85 });

// Error
this.logger.error('Database connection failed', error, { host: 'localhost' });

// Debug (only in development)
this.logger.debug('Cache lookup', { key: 'user:123', hit: true });
```

### Track Custom Events

```typescript
this.logger.trackEvent('user.registered', {
  userId: user.id,
  method: 'email',
});
```

### Track Metrics

```typescript
this.logger.trackMetric('api.response.time', 250, {
  endpoint: '/api/users',
});
```

### Track Operations

```typescript
async processData() {
  const opId = this.logger.startOperation('process-data');

  try {
    // ... your code
    this.logger.endOperation(opId, true, { count: 100 });
  } catch (error) {
    this.logger.endOperation(opId, false);
    throw error;
  }
}
```

### Get Correlation ID

```typescript
import { LoggerContext } from '@jobpilot/logging';

const correlationId = LoggerContext.getCorrelationId();
```

## Verify in Azure Application Insights

1. Go to Azure Portal
2. Navigate to Application Insights
3. Click "Logs"
4. Run a simple query:

```kusto
traces
| where cloud_RoleName == "my-service"
| order by timestamp desc
| take 10
```

## Next Steps

- Read the full documentation: `packages/logging/README.md`
- Check examples: `packages/logging/EXAMPLES.md`
- Review logging standards: `docs/logging-standards.md`

## Troubleshooting

### Logs not appearing in console?

Check your `LOG_LEVEL` environment variable and ensure it's set appropriately.

### Logs not in Application Insights?

1. Verify `APPLICATIONINSIGHTS_INSTRUMENTATION_KEY` is set correctly
2. Wait 1-2 minutes for logs to appear
3. Check network connectivity to Azure

### TypeScript errors?

Rebuild the logging package:
```bash
cd packages/logging
npm run build
```

## Need Help?

Review the comprehensive documentation in:
- `packages/logging/README.md`
- `docs/logging-standards.md`
- `LOGGING_IMPLEMENTATION_SUMMARY.md`
