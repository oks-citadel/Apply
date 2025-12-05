# Logging Standardization Implementation Summary

## Overview

This document summarizes the implementation of standardized logging across all JobPilot AI Platform microservices using Azure Application Insights SDK with consistent formatting and correlation.

**Implementation Date:** 2024-12-04
**Version:** 1.0.0

---

## Files Created

### 1. Shared Logging Package (`packages/logging/`)

#### Core Package Files
- **`packages/logging/package.json`** - Package configuration with dependencies
- **`packages/logging/tsconfig.json`** - TypeScript configuration
- **`packages/logging/README.md`** - Package documentation
- **`packages/logging/EXAMPLES.md`** - Comprehensive usage examples
- **`packages/logging/.env.example`** - Environment variable template

#### Source Files
- **`packages/logging/src/index.ts`** - Main export file
- **`packages/logging/src/logger.ts`** - Logger class with Application Insights integration
- **`packages/logging/src/formats.ts`** - Structured log formats and sensitive data filtering
- **`packages/logging/src/context.ts`** - Async context management for correlation IDs
- **`packages/logging/src/config.ts`** - Configuration management and log level handling
- **`packages/logging/src/middleware.ts`** - Express middleware for request logging
- **`packages/logging/src/nestjs.module.ts`** - NestJS module, interceptor, and exception filter

### 2. Python AI Service Logging

- **`services/ai-service/src/logging_config.py`** - Python logging configuration with Azure Application Insights
- **`services/ai-service/requirements.txt`** - Updated with opencensus dependencies

### 3. Updated NestJS Services

All 7 NestJS services have been updated with the shared logging module:

- **`services/auth-service/src/app.module.ts`** - Added LoggingModule integration
- **`services/user-service/src/app.module.ts`** - Added LoggingModule integration
- **`services/job-service/src/app.module.ts`** - Added LoggingModule integration
- **`services/resume-service/src/app.module.ts`** - Added LoggingModule integration
- **`services/analytics-service/src/app.module.ts`** - Added LoggingModule integration
- **`services/auto-apply-service/src/app.module.ts`** - Added LoggingModule integration
- **`services/notification-service/src/app.module.ts`** - Added LoggingModule integration

### 4. Documentation

- **`docs/logging-standards.md`** - Comprehensive logging standards and best practices guide

---

## Key Features Implemented

### 1. Azure Application Insights Integration

All services now automatically send logs, traces, exceptions, and custom events to Azure Application Insights for centralized monitoring.

**Features:**
- Automatic trace correlation
- Exception tracking with stack traces
- Custom events and metrics
- Dependency tracking
- Performance monitoring
- Distributed tracing with W3C standard

### 2. Structured JSON Logging

All logs are formatted as structured JSON with consistent fields:

```json
{
  "timestamp": "2024-12-04T10:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "serviceName": "auth-service",
  "environment": "production",
  "version": "1.0.0",
  "correlationId": "abc-123-def",
  "userId": "user-456",
  "metadata": {
    "loginMethod": "google-oauth"
  }
}
```

### 3. Correlation ID Tracking

Every request automatically receives a correlation ID that flows through all services:

- Extracted from `X-Correlation-ID` header or generated
- Automatically included in all logs
- Propagated to downstream services
- Returned in response headers
- Enables end-to-end request tracing

### 4. Automatic Request/Response Logging

The logging interceptor automatically logs:
- HTTP method and URL
- Request headers (optional)
- Request body (optional, with size limit)
- Response status code
- Response time
- User ID (if authenticated)
- Correlation and request IDs

### 5. Sensitive Data Redaction

Automatic redaction of sensitive fields:
- Passwords
- Tokens and API keys
- Authorization headers
- Credit card numbers
- Social Security Numbers
- Session data
- Custom patterns supported

### 6. Environment-Based Log Levels

**Production:**
- Level: INFO and above
- Console: Enabled
- Application Insights: Enabled

**Staging:**
- Level: INFO and above
- Console: Enabled
- Application Insights: Enabled

**Development:**
- Level: DEBUG and above
- Console: Enabled (with colors)
- Application Insights: Optional

**Test:**
- Level: WARN and above
- Console: Disabled
- Application Insights: Disabled

### 7. Performance Tracking

Built-in support for tracking:
- Custom metrics
- Operation durations
- External API calls
- Database queries
- Cache hit/miss rates
- Queue depths

---

## Installation Instructions

### For NestJS Services

1. **Install the logging package:**
   ```bash
   cd packages/logging
   npm install
   npm run build
   ```

2. **Link the package (development):**
   ```bash
   cd packages/logging
   npm link

   cd ../../services/your-service
   npm link @jobpilot/logging
   ```

3. **Set environment variables:**
   ```bash
   # .env file
   APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=your-key-here
   SERVICE_NAME=your-service
   SERVICE_VERSION=1.0.0
   NODE_ENV=development
   LOG_LEVEL=info
   ```

4. **The services are already configured** - see the updated `app.module.ts` files

### For Python AI Service

1. **Install dependencies:**
   ```bash
   cd services/ai-service
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   # .env file
   APPLICATIONINSIGHTS_INSTRUMENTATION_KEY=your-key-here
   ENVIRONMENT=development
   SERVICE_NAME=ai-service
   SERVICE_VERSION=1.0.0
   ```

3. **Update main.py to use the logging configuration:**
   ```python
   from src.logging_config import configure_logging, CorrelationMiddleware

   # Initialize logger
   logger = configure_logging(
       service_name='ai-service',
       version='1.0.0'
   )

   # Add middleware to FastAPI app
   app.add_middleware(CorrelationMiddleware, logger=logger)
   ```

---

## Usage Examples

### Basic Logging in NestJS Services

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@jobpilot/logging';

@Injectable()
export class MyService {
  constructor(private readonly logger: Logger) {}

  async myMethod() {
    // Info log
    this.logger.info('Processing started', { recordId: '123' });

    // Warning
    this.logger.warn('Slow response detected', { duration: 3000 });

    // Error with exception
    try {
      // ... some operation
    } catch (error) {
      this.logger.error('Operation failed', error, { recordId: '123' });
    }

    // Debug (only in development)
    this.logger.debug('Intermediate state', { step: 2, data: {...} });

    // Track custom event
    this.logger.trackEvent('user.action', { action: 'click', button: 'submit' });

    // Track metric
    this.logger.trackMetric('processing.time', 150, { type: 'batch' });
  }
}
```

### Python AI Service Logging

```python
from src.logging_config import get_logger

logger = get_logger()

async def process_resume(data):
    logger.info('Processing resume', userId=data['user_id'])

    try:
        result = await parse_resume(data)
        logger.info('Resume processed', userId=data['user_id'], sections=len(result))
        return result
    except Exception as e:
        logger.error('Failed to process resume', exc_info=e, userId=data['user_id'])
        raise
```

### Tracking Operations

```typescript
async processLargeOperation() {
  const operationId = this.logger.startOperation('process-data');

  try {
    // ... operation logic
    this.logger.endOperation(operationId, true, { processedCount: 100 });
  } catch (error) {
    this.logger.endOperation(operationId, false, { error: error.message });
    throw error;
  }
}
```

---

## Azure Portal - Searching Logs

### Access Logs

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your Application Insights resource
3. Click "Logs" in the left menu

### Common Queries

**Find errors for a specific user:**
```kusto
traces
| where customDimensions.userId == "user123"
| where severityLevel >= 3
| order by timestamp desc
```

**Track a request across services:**
```kusto
traces
| where customDimensions.correlationId == "abc-123"
| order by timestamp asc
| project timestamp, cloud_RoleName, message, customDimensions
```

**Monitor slow requests:**
```kusto
traces
| where message contains "Request completed"
| where customDimensions.duration > 3000
| order by customDimensions.duration desc
```

**Service health:**
```kusto
traces
| where timestamp > ago(1h)
| summarize count() by cloud_RoleName, severityLevel
| order by cloud_RoleName
```

---

## Benefits

### For Developers

1. **Consistent API** - Same logging interface across all services
2. **Automatic Context** - Correlation IDs and user context handled automatically
3. **Type Safety** - Full TypeScript support with IntelliSense
4. **Easy Debugging** - Trace requests across services with correlation IDs
5. **Performance Insights** - Built-in metrics and dependency tracking

### For Operations

1. **Centralized Monitoring** - All logs in one place (Application Insights)
2. **Distributed Tracing** - Track requests across microservices
3. **Alert Integration** - Set up alerts on errors, slow requests, etc.
4. **Performance Analysis** - Identify bottlenecks and optimization opportunities
5. **Compliance** - Automatic sensitive data redaction

### For Business

1. **Better Reliability** - Faster incident detection and resolution
2. **User Experience** - Track and optimize slow operations
3. **Data-Driven Decisions** - Custom events and metrics for business insights
4. **Cost Optimization** - Identify inefficient operations
5. **Audit Trail** - Complete history of system events

---

## Migration Checklist

For any service not yet updated:

- [ ] Install `@jobpilot/logging` package
- [ ] Add LoggingModule to app.module.ts
- [ ] Add LoggingInterceptor as global provider
- [ ] Replace console.log with injected Logger
- [ ] Set environment variables
- [ ] Test logging in development
- [ ] Verify logs appear in Application Insights
- [ ] Update documentation

---

## Next Steps

### Immediate

1. **Set up Application Insights** - Configure instrumentation keys for all environments
2. **Test in Development** - Verify logging works in local development
3. **Deploy to Staging** - Test end-to-end tracing across services
4. **Configure Alerts** - Set up alerts for errors and performance issues

### Future Enhancements

1. **Dashboard Creation** - Build Application Insights dashboards
2. **Alert Tuning** - Refine alert thresholds based on actual usage
3. **Log Retention** - Configure appropriate retention policies
4. **Cost Optimization** - Monitor and optimize Application Insights costs
5. **Custom Visualizations** - Create custom queries and visualizations

---

## Support and Documentation

### Resources

- **Logging Standards:** `docs/logging-standards.md`
- **Package README:** `packages/logging/README.md`
- **Usage Examples:** `packages/logging/EXAMPLES.md`
- **Azure Application Insights:** https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview

### Getting Help

For questions or issues:
1. Review the documentation files listed above
2. Check the example implementations in the updated services
3. Contact the platform team

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                          │
│                 (with X-Correlation-ID)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway                                │
│            (Propagates Correlation ID)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Service │ │ Job Service  │ │ User Service │
│              │ │              │ │              │
│ - Logger     │ │ - Logger     │ │ - Logger     │
│ - Context    │ │ - Context    │ │ - Context    │
│ - AI Insights│ │ - AI Insights│ │ - AI Insights│
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Azure Application Insights   │
        │                               │
        │  - Traces                     │
        │  - Exceptions                 │
        │  - Metrics                    │
        │  - Events                     │
        │  - Dependencies               │
        └───────────────────────────────┘
```

---

**Document Version:** 1.0.0
**Last Updated:** 2024-12-04
**Implementation Status:** ✅ Complete
