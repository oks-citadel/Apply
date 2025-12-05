# Distributed Tracing Implementation with OpenTelemetry

This document describes the implementation of distributed tracing across all JobPilot microservices using OpenTelemetry and Azure Application Insights.

## Overview

Distributed tracing has been implemented across all 8 microservices:
- **NestJS Services**: auth-service, user-service, job-service, resume-service, analytics-service, auto-apply-service, notification-service
- **Python Service**: ai-service (FastAPI)

## Architecture

### Telemetry Package (`packages/telemetry/`)

A shared OpenTelemetry package provides:
- Automatic instrumentation for HTTP, PostgreSQL, Redis
- Azure Application Insights integration
- W3C Trace Context propagation
- Custom span creation utilities
- Decorators for automatic method tracing
- Middleware for trace context handling

### Key Components

#### 1. **index.ts** - Core Initialization
- `initTelemetry()` - Initialize OpenTelemetry SDK
- Azure Monitor exporter configuration
- Auto-instrumentation setup
- Trace context propagation

#### 2. **tracing.ts** - Span Utilities
- `createSpan()` - Create custom spans
- `withSpan()` - Execute code in span context
- `addUserContext()` - Add user metadata
- `addTenantContext()` - Add tenant metadata
- Specialized span creators (database, HTTP, cache, queue)

#### 3. **middleware.ts** - Request Tracing
- `TraceContextMiddleware` - NestJS middleware
- `UserContextMiddleware` - User context injection
- Correlation ID handling
- Trace propagation utilities

#### 4. **decorators.ts** - Method Decorators
- `@Trace()` - Automatic method tracing
- `@TraceDatabase()` - Database operation tracing
- `@TraceHttp()` - HTTP client tracing
- `@TraceCache()` - Cache operation tracing
- `@TraceQueue()` - Message queue tracing
- `@TraceClass()` - Class-level tracing

#### 5. **telemetry.py** - Python Implementation
- FastAPI instrumentation
- Azure Monitor integration
- Custom span creation
- LLM/Embedding specific tracing

## Installation

### NestJS Services

```bash
# Add telemetry package dependency
pnpm add @jobpilot/telemetry
```

### Python AI Service

```bash
# Already added to requirements.txt
pip install -r requirements.txt
```

## Configuration

### Environment Variables

Add to each service's `.env` file:

```bash
# Azure Application Insights Connection String
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx

# Environment
NODE_ENV=production
```

### Azure Application Insights Setup

1. **Create Application Insights Resource**
   ```bash
   az monitor app-insights component create \
     --app jobpilot-insights \
     --location eastus \
     --resource-group jobpilot-rg
   ```

2. **Get Connection String**
   ```bash
   az monitor app-insights component show \
     --app jobpilot-insights \
     --resource-group jobpilot-rg \
     --query connectionString
   ```

3. **Set Environment Variable**
   - Add to Azure App Service Configuration
   - Or use Azure Key Vault reference

## Usage Examples

### NestJS Service - Basic Setup

```typescript
// main.ts
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // Initialize BEFORE importing other modules
  await initTelemetry({
    serviceName: 'auth-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV,
  });

  // Import modules after telemetry
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

### Add Middleware

```typescript
// app.module.ts
import { TraceContextMiddleware, UserContextMiddleware } from '@jobpilot/telemetry';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TraceContextMiddleware)
      .forRoutes('*')
      .apply(UserContextMiddleware)
      .forRoutes('*');
  }
}
```

### Method Tracing with Decorators

```typescript
import { Trace, TraceDatabase } from '@jobpilot/telemetry';

@Injectable()
export class UserService {
  @Trace({ name: 'user.create' })
  async createUser(userData: CreateUserDto) {
    // Automatically traced with span name 'user.create'
    return this.repository.save(userData);
  }

  @TraceDatabase('SELECT', 'users')
  async findUserById(id: string) {
    // Traced as database operation
    return this.repository.findOne({ where: { id } });
  }
}
```

### Custom Spans

```typescript
import { withSpan, addUserContext } from '@jobpilot/telemetry';

async function processJobApplication(jobId: string, userId: string) {
  return await withSpan('job.apply', async (span) => {
    // Add business context
    span.setAttribute('job.id', jobId);
    span.setAttribute('user.id', userId);

    // Add user context
    addUserContext(userId, 'user@example.com', 'applicant');

    // Your business logic
    const result = await applyForJob(jobId, userId);

    return result;
  });
}
```

### Python FastAPI - Basic Setup

```python
# main.py
from app.telemetry import init_telemetry, instrument_fastapi, TelemetryConfig

# Initialize telemetry
config = TelemetryConfig(
    service_name="ai-service",
    service_version="1.0.0",
    environment=os.getenv("ENVIRONMENT", "development"),
)
init_telemetry(config)

# Create FastAPI app
app = FastAPI()

# Instrument app
instrument_fastapi(app)
```

### Python Function Tracing

```python
from app.telemetry import trace_function, create_span, add_user_context

@trace_function(name="analyze_resume")
async def analyze_resume(resume_text: str, user_id: str):
    """Automatically traced function"""
    add_user_context(user_id)

    # Your logic
    analysis = await llm.analyze(resume_text)
    return analysis

# Manual span creation
async def complex_operation():
    with create_span("custom_operation") as span:
        span.set_attribute("operation.type", "complex")
        # Your logic
        result = await do_work()
        return result
```

### LLM Operations Tracing

```python
from app.telemetry import create_llm_span

async def generate_cover_letter(prompt: str):
    with create_llm_span("gpt-4", prompt_tokens=100) as span:
        response = await openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        span.set_attribute("llm.completion_tokens", response.usage.completion_tokens)
        return response.choices[0].message.content
```

## Trace Propagation

### Cross-Service HTTP Calls

```typescript
import { propagateContext } from '@jobpilot/telemetry';
import { HttpService } from '@nestjs/axios';

// Propagate trace context to downstream services
async function callUserService(userId: string) {
  const headers = propagateContext({
    'Content-Type': 'application/json'
  });

  return this.httpService.get(
    `http://user-service/api/v1/users/${userId}`,
    { headers }
  ).toPromise();
}
```

### Message Queue Operations

```typescript
import { TraceQueue, propagateContext } from '@jobpilot/telemetry';

@Injectable()
export class EmailService {
  @TraceQueue('SEND', 'email-queue')
  async sendEmail(emailData: EmailDto) {
    // Automatically traced as queue producer
    const headers = propagateContext({});

    await this.queue.add('send-email', {
      ...emailData,
      traceContext: headers
    });
  }
}
```

## Monitoring & Observability

### Azure Application Insights Features

1. **Application Map**
   - Visualize service dependencies
   - Identify performance bottlenecks
   - Track failure rates

2. **Performance**
   - End-to-end transaction tracking
   - Dependency call durations
   - Database query performance

3. **Failures**
   - Exception tracking
   - Error rates by service
   - Failed request analysis

4. **Live Metrics**
   - Real-time telemetry
   - Server health
   - Request rates

### Custom Queries (KQL)

```kql
// Find slow job applications
requests
| where name contains "job.apply"
| where duration > 1000
| project timestamp, duration, customDimensions.["user.id"], customDimensions.["job.id"]
| order by duration desc

// Track LLM usage
dependencies
| where type == "HTTP"
| where target contains "openai"
| summarize count(), avg(duration) by operation_Name
| order by count_ desc

// User journey tracking
requests
| where customDimensions.["user.id"] == "user-123"
| project timestamp, name, duration, resultCode
| order by timestamp asc
```

## Best Practices

### 1. Initialize Early
- Call `initTelemetry()` BEFORE importing other modules
- Ensures proper auto-instrumentation

### 2. Use Meaningful Span Names
- ✅ Good: `job.apply`, `resume.parse`, `user.authenticate`
- ❌ Bad: `method1`, `function`, `process`

### 3. Add Business Context
```typescript
// Always add relevant business context
span.setAttribute('tenant.id', tenantId);
span.setAttribute('user.id', userId);
span.setAttribute('job.id', jobId);
```

### 4. Record Errors Properly
```typescript
try {
  await operation();
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  throw error;
}
```

### 5. Use Decorators for Consistency
```typescript
// Prefer decorators over manual spans
@Trace({ name: 'user.login' })
async login(credentials: LoginDto) {
  // Implementation
}
```

### 6. Sampling Strategy
- **Development**: 100% sampling
- **Staging**: 50-100% sampling
- **Production**: 10-25% sampling (adjust based on volume)

## Performance Impact

- **Overhead**: < 5% in most cases
- **Auto-instrumentation**: Minimal impact with lazy loading
- **Custom spans**: ~0.1ms per span
- **Batch export**: Reduces network calls

## Troubleshooting

### Traces Not Appearing

1. **Check Connection String**
   ```bash
   echo $APPLICATIONINSIGHTS_CONNECTION_STRING
   ```

2. **Verify Initialization**
   - Telemetry initialized before app modules
   - No errors in startup logs

3. **Check Azure Portal**
   - Application Insights resource exists
   - Connection string matches

### Missing Context Propagation

1. **Add Middleware**
   - TraceContextMiddleware applied globally
   - UserContextMiddleware after authentication

2. **Propagate in HTTP Calls**
   ```typescript
   const headers = propagateContext({});
   ```

### High Overhead

1. **Reduce Sampling**
   ```typescript
   await initTelemetry({
     sampleRate: 0.1 // 10% sampling
   });
   ```

2. **Disable Verbose Spans**
   - Remove unnecessary custom spans
   - Use decorators selectively

## Files Created/Modified

### New Files
- `packages/telemetry/package.json`
- `packages/telemetry/tsconfig.json`
- `packages/telemetry/src/index.ts`
- `packages/telemetry/src/tracing.ts`
- `packages/telemetry/src/middleware.ts`
- `packages/telemetry/src/decorators.ts`
- `packages/telemetry/README.md`
- `packages/telemetry/.env.example`
- `services/ai-service/app/telemetry.py`

### Modified Files
- `services/auth-service/src/main.ts`
- `services/user-service/src/main.ts`
- `services/job-service/src/main.ts`
- `services/resume-service/src/main.ts`
- `services/analytics-service/src/main.ts`
- `services/auto-apply-service/src/main.ts`
- `services/notification-service/src/main.ts`
- `services/ai-service/src/main.py`
- `services/ai-service/requirements.txt`

## Next Steps

1. **Install Dependencies**
   ```bash
   # Root level
   pnpm install

   # AI Service
   cd services/ai-service
   pip install -r requirements.txt
   ```

2. **Configure Azure Application Insights**
   - Create resource in Azure
   - Copy connection string
   - Add to environment variables

3. **Test Tracing**
   ```bash
   # Start services
   pnpm run dev

   # Make test requests
   curl http://localhost:3001/api/v1/auth/login

   # Check Azure Portal for traces
   ```

4. **Add Custom Business Tracing**
   - Identify critical business operations
   - Add `@Trace` decorators
   - Add business context attributes

5. **Setup Alerts**
   - High error rates
   - Slow transactions
   - Dependency failures

## Support

For issues or questions:
- Check Azure Application Insights documentation
- Review OpenTelemetry documentation
- Contact DevOps team

## License

MIT
