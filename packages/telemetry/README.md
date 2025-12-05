# @jobpilot/telemetry

OpenTelemetry distributed tracing package for JobPilot microservices with Azure Application Insights integration.

## Features

- **Automatic Instrumentation**: HTTP, Express, PostgreSQL, Redis
- **Azure Application Insights**: Native integration with Azure Monitor
- **W3C Trace Context**: Standard trace propagation across services
- **Custom Spans**: Utilities for creating and managing custom spans
- **Decorators**: Method decorators for automatic tracing
- **Middleware**: NestJS and Express middleware for request tracing
- **Context Propagation**: Correlation IDs and trace context propagation

## Installation

```bash
pnpm install @jobpilot/telemetry
```

## Quick Start

### NestJS Service

```typescript
// main.ts
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // Initialize telemetry BEFORE importing other modules
  await initTelemetry({
    serviceName: 'auth-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV,
  });

  // Import after telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

### Add Middleware

```typescript
// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TraceContextMiddleware, UserContextMiddleware } from '@jobpilot/telemetry';

@Module({
  // ...
})
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

## Usage Examples

### Method Decorators

```typescript
import { Trace, TraceDatabase, TraceHttp } from '@jobpilot/telemetry';

class UserService {
  @Trace({ name: 'user.create' })
  async createUser(userData: CreateUserDto) {
    // Automatically traced
  }

  @TraceDatabase('SELECT', 'users')
  async findUserById(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  @TraceHttp('POST', 'https://api.example.com/users')
  async syncUser(userId: string) {
    return this.httpClient.post('/users', { userId });
  }
}
```

### Custom Spans

```typescript
import { withSpan, createSpan } from '@jobpilot/telemetry';

// Using withSpan (recommended)
const result = await withSpan('process_application', async (span) => {
  span.setAttribute('job.id', jobId);
  span.setAttribute('user.id', userId);

  // Your logic here
  return processedData;
});

// Manual span management
const span = createSpan('custom_operation', {
  attributes: { 'key': 'value' }
});

try {
  // Your logic
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
} finally {
  span.end();
}
```

### Business Context

```typescript
import { addUserContext, addTenantContext, recordEvent } from '@jobpilot/telemetry';

// Add user context to current span
addUserContext('user-123', 'user@example.com', 'admin');

// Add tenant context
addTenantContext('tenant-456', 'org-789');

// Record custom events
recordEvent('job_application_submitted', {
  'job.id': jobId,
  'application.status': 'pending'
});
```

## Environment Variables

```bash
# Required
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://...

# Optional
NODE_ENV=production
```

## Azure Application Insights Setup

1. Create an Application Insights resource in Azure
2. Copy the connection string
3. Set `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable
4. Deploy your service

## API Reference

### Initialization

- `initTelemetry(config)` - Initialize OpenTelemetry
- `shutdownTelemetry()` - Shutdown and flush traces

### Span Creation

- `createSpan(name, options)` - Create a new span
- `withSpan(name, fn, options)` - Execute function in span context
- `createChildSpan(name, attributes)` - Create child span

### Context

- `addBusinessContext(context)` - Add business attributes
- `addUserContext(userId, email, role)` - Add user context
- `addTenantContext(tenantId, orgId)` - Add tenant context
- `recordEvent(name, attributes)` - Record custom event
- `recordError(error, attributes)` - Record error

### Decorators

- `@Trace(options)` - Trace method execution
- `@TraceDatabase(operation, table)` - Trace database operations
- `@TraceHttp(method, url)` - Trace HTTP calls
- `@TraceCache(operation, keyExtractor)` - Trace cache operations
- `@TraceQueue(operation, queueName)` - Trace queue operations
- `@TraceClass(options)` - Trace all methods in class
- `@TraceTransaction(name, options)` - Trace business transactions

### Middleware

- `TraceContextMiddleware` - NestJS middleware for trace context
- `UserContextMiddleware` - NestJS middleware for user context
- `traceContextMiddleware` - Express middleware
- `propagateContext(headers)` - Propagate trace to outgoing requests

## Best Practices

1. **Initialize Early**: Call `initTelemetry()` before importing other modules
2. **Use Decorators**: Prefer decorators for automatic tracing
3. **Add Context**: Always add user and tenant context when available
4. **Meaningful Names**: Use descriptive span names (e.g., `job.apply`, not `method1`)
5. **Error Handling**: Always record exceptions in spans
6. **Sampling**: Configure appropriate sampling rates for production

## License

MIT
