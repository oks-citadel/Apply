# Telemetry Quick Start Guide

Get distributed tracing running in your service in 5 minutes.

## Step 1: Install Package

```bash
# From root directory
pnpm add @jobpilot/telemetry
```

## Step 2: Update main.ts

**Before**:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

**After**:
```typescript
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // Initialize telemetry FIRST
  await initTelemetry({
    serviceName: 'my-service', // Change this
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV,
  });

  // Import AFTER telemetry
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

## Step 3: Add Middleware

```typescript
// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TraceContextMiddleware } from '@jobpilot/telemetry';

@Module({
  // your modules
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceContextMiddleware).forRoutes('*');
  }
}
```

## Step 4: Set Environment Variable

```bash
# .env
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx
```

## Step 5: Add Tracing to Your Code

### Option A: Use Decorators (Recommended)

```typescript
import { Trace } from '@jobpilot/telemetry';

@Injectable()
export class UserService {
  @Trace({ name: 'user.create' })
  async createUser(data: CreateUserDto) {
    return this.repository.save(data);
  }
}
```

### Option B: Manual Spans

```typescript
import { withSpan } from '@jobpilot/telemetry';

async function processData(id: string) {
  return await withSpan('process.data', async (span) => {
    span.setAttribute('data.id', id);
    // your code
    return result;
  });
}
```

## That's It!

Your service is now instrumented. Start your service and check Azure Application Insights for traces.

## Common Use Cases

### Database Operations
```typescript
import { TraceDatabase } from '@jobpilot/telemetry';

@TraceDatabase('SELECT', 'users')
async findUser(id: string) {
  return this.repository.findOne({ where: { id } });
}
```

### HTTP Calls
```typescript
import { TraceHttp, propagateContext } from '@jobpilot/telemetry';

@TraceHttp('POST', 'http://other-service/api')
async callService() {
  const headers = propagateContext({});
  return this.http.post(url, data, { headers });
}
```

### Add User Context
```typescript
import { addUserContext } from '@jobpilot/telemetry';

async function handleRequest(req: Request) {
  addUserContext(req.user.id, req.user.email);
  // your code
}
```

## Need Help?

- 📖 Full docs: `packages/telemetry/README.md`
- 💡 Examples: `packages/telemetry/EXAMPLES.md`
- 🚀 Implementation guide: `DISTRIBUTED_TRACING_IMPLEMENTATION.md`
