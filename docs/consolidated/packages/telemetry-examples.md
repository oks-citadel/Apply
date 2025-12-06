# OpenTelemetry Tracing Examples

This document provides practical examples for using the telemetry package across different scenarios.

## Table of Contents
- [Basic Setup](#basic-setup)
- [Method Decorators](#method-decorators)
- [Custom Spans](#custom-spans)
- [Business Context](#business-context)
- [Database Operations](#database-operations)
- [HTTP Client Calls](#http-client-calls)
- [Cache Operations](#cache-operations)
- [Message Queues](#message-queues)
- [Error Handling](#error-handling)
- [Advanced Scenarios](#advanced-scenarios)

## Basic Setup

### NestJS Service Initialization

```typescript
// main.ts
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // CRITICAL: Initialize BEFORE other imports
  await initTelemetry({
    serviceName: 'my-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });

  // Dynamic imports AFTER telemetry
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
  imports: [/* your imports */],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Trace context middleware (REQUIRED)
    consumer.apply(TraceContextMiddleware).forRoutes('*');

    // User context middleware (apply after auth middleware)
    consumer.apply(UserContextMiddleware).forRoutes('*');
  }
}
```

## Method Decorators

### Basic Method Tracing

```typescript
import { Injectable } from '@nestjs/common';
import { Trace } from '@jobpilot/telemetry';

@Injectable()
export class JobService {
  // Simple tracing with custom name
  @Trace({ name: 'job.create' })
  async createJob(jobData: CreateJobDto) {
    return this.repository.save(jobData);
  }

  // Tracing with attributes
  @Trace({
    name: 'job.search',
    attributes: {
      'service': 'job-service',
      'operation': 'search'
    }
  })
  async searchJobs(criteria: SearchCriteria) {
    return this.repository.find(criteria);
  }

  // Extract attributes from method arguments
  @Trace({
    name: 'job.get',
    attributeExtractor: (jobId: string) => ({
      'job.id': jobId
    })
  })
  async getJobById(jobId: string) {
    return this.repository.findOne({ where: { id: jobId } });
  }
}
```

### Class-Level Tracing

```typescript
import { TraceClass } from '@jobpilot/telemetry';

// Automatically trace ALL methods in the class
@TraceClass({ attributes: { 'service': 'auth-service' } })
@Injectable()
export class AuthService {
  async login(credentials: LoginDto) {
    // Automatically traced as 'AuthService.login'
  }

  async register(userData: RegisterDto) {
    // Automatically traced as 'AuthService.register'
  }

  async verifyToken(token: string) {
    // Automatically traced as 'AuthService.verifyToken'
  }
}
```

## Custom Spans

### Using withSpan (Recommended)

```typescript
import { withSpan, SpanKind } from '@jobpilot/telemetry';

async function processApplication(jobId: string, userId: string) {
  return await withSpan('application.process', async (span) => {
    // Add attributes
    span.setAttribute('job.id', jobId);
    span.setAttribute('user.id', userId);
    span.setAttribute('process.step', 'validation');

    // Your business logic
    const validated = await validateApplication(jobId, userId);

    span.setAttribute('process.step', 'submission');
    const result = await submitApplication(validated);

    span.setAttribute('application.id', result.id);
    return result;

  }, { kind: SpanKind.INTERNAL });
}
```

### Manual Span Management

```typescript
import { createSpan, SpanStatusCode } from '@jobpilot/telemetry';

async function complexOperation() {
  const span = createSpan('complex.operation', {
    attributes: {
      'operation.type': 'batch',
      'operation.priority': 'high'
    }
  });

  try {
    // Your logic
    const result = await doWork();

    span.setAttribute('operation.result', 'success');
    span.setAttribute('items.processed', result.count);
    span.setStatus({ code: SpanStatusCode.OK });

    return result;

  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;

  } finally {
    span.end();
  }
}
```

## Business Context

### User Context

```typescript
import { addUserContext, addTenantContext } from '@jobpilot/telemetry';

@Injectable()
export class ApplicationService {
  async applyForJob(jobId: string, userId: string, req: Request) {
    // Add user context from request
    const user = req.user;
    addUserContext(user.id, user.email, user.role);

    // Add tenant context if multi-tenant
    if (user.tenantId) {
      addTenantContext(user.tenantId, user.organizationId);
    }

    // Business logic
    return await this.submitApplication(jobId, userId);
  }
}
```

### Custom Business Events

```typescript
import { recordEvent } from '@jobpilot/telemetry';

async function completeJobApplication(applicationId: string) {
  // Record business events
  recordEvent('application.started', {
    'application.id': applicationId,
    'timestamp': new Date().toISOString()
  });

  const result = await processApplication(applicationId);

  recordEvent('application.completed', {
    'application.id': applicationId,
    'application.status': result.status,
    'processing.duration': result.duration
  });

  return result;
}
```

## Database Operations

### Repository Methods

```typescript
import { TraceDatabase } from '@jobpilot/telemetry';

@Injectable()
export class UserRepository {
  @TraceDatabase('SELECT', 'users')
  async findUserById(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  @TraceDatabase('INSERT', 'users')
  async createUser(userData: User) {
    return this.repository.save(userData);
  }

  @TraceDatabase('UPDATE', 'users')
  async updateUser(id: string, updates: Partial<User>) {
    return this.repository.update(id, updates);
  }

  @TraceDatabase('DELETE', 'users')
  async deleteUser(id: string) {
    return this.repository.delete(id);
  }
}
```

### Custom Database Spans

```typescript
import { createDatabaseSpan } from '@jobpilot/telemetry';

async function complexQuery(userId: string) {
  const span = createDatabaseSpan('SELECT', 'users', {
    'db.statement': 'SELECT * FROM users WHERE id = $1 AND active = true',
    'db.user': userId
  });

  try {
    const result = await this.repository.query(
      'SELECT * FROM users WHERE id = $1 AND active = true',
      [userId]
    );

    span.setAttribute('db.rows_affected', result.length);
    return result;

  } finally {
    span.end();
  }
}
```

## HTTP Client Calls

### Service-to-Service Communication

```typescript
import { TraceHttp, propagateContext } from '@jobpilot/telemetry';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UserClient {
  constructor(private httpService: HttpService) {}

  // Static URL
  @TraceHttp('GET', 'http://user-service/api/v1/users')
  async getAllUsers() {
    const headers = propagateContext({
      'Content-Type': 'application/json'
    });

    return this.httpService.get('/users', { headers }).toPromise();
  }

  // Dynamic URL
  @TraceHttp('POST', (userId) => `http://user-service/api/v1/users/${userId}`)
  async updateUser(userId: string, data: UpdateUserDto) {
    const headers = propagateContext({
      'Content-Type': 'application/json'
    });

    return this.httpService.post(`/users/${userId}`, data, { headers }).toPromise();
  }
}
```

### Manual HTTP Tracing

```typescript
import { createHttpClientSpan, propagateContext } from '@jobpilot/telemetry';

async function callExternalAPI(endpoint: string, data: any) {
  const span = createHttpClientSpan('POST', endpoint, {
    'http.request.body.size': JSON.stringify(data).length
  });

  try {
    const headers = propagateContext({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    span.setAttribute('http.status_code', response.status);
    span.setAttribute('http.response.body.size', response.headers.get('content-length'));

    return await response.json();

  } finally {
    span.end();
  }
}
```

## Cache Operations

### Redis Cache

```typescript
import { TraceCache } from '@jobpilot/telemetry';
import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Injectable()
export class CacheService {
  constructor(private redisService: RedisService) {}

  @TraceCache('GET', (key: string) => key)
  async get(key: string): Promise<string | null> {
    const redis = this.redisService.getClient();
    return await redis.get(key);
  }

  @TraceCache('SET', (key: string) => key)
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const redis = this.redisService.getClient();
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
  }

  @TraceCache('DELETE', (key: string) => key)
  async delete(key: string): Promise<void> {
    const redis = this.redisService.getClient();
    await redis.del(key);
  }
}
```

### Manual Cache Spans

```typescript
import { createCacheSpan } from '@jobpilot/telemetry';

async function getCachedUser(userId: string) {
  const cacheKey = `user:${userId}`;
  const span = createCacheSpan('GET', cacheKey);

  try {
    const cached = await redis.get(cacheKey);

    span.setAttribute('cache.hit', !!cached);

    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - fetch from database
    const user = await database.findUser(userId);

    // Store in cache
    await redis.setex(cacheKey, 3600, JSON.stringify(user));

    return user;

  } finally {
    span.end();
  }
}
```

## Message Queues

### BullMQ Producer

```typescript
import { TraceQueue, propagateContext } from '@jobpilot/telemetry';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmailProducer {
  constructor(
    @InjectQueue('email') private emailQueue: Queue
  ) {}

  @TraceQueue('SEND', 'email-queue')
  async sendEmail(emailData: EmailDto) {
    // Propagate trace context
    const traceContext = propagateContext({});

    await this.emailQueue.add('send-email', {
      ...emailData,
      _traceContext: traceContext
    });
  }
}
```

### BullMQ Consumer

```typescript
import { TraceQueue, extractContext, context } from '@jobpilot/telemetry';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email')
export class EmailConsumer {
  @Process('send-email')
  @TraceQueue('PROCESS', 'email-queue')
  async handleEmailJob(job: Job) {
    // Extract trace context from job data
    const traceContext = extractContext(job.data._traceContext || {});

    // Execute within trace context
    return context.with(traceContext, async () => {
      const { to, subject, body } = job.data;
      await this.emailService.send(to, subject, body);
    });
  }
}
```

## Error Handling

### Automatic Error Recording

```typescript
import { Trace, recordError } from '@jobpilot/telemetry';

@Injectable()
export class PaymentService {
  @Trace({ name: 'payment.process' })
  async processPayment(paymentData: PaymentDto) {
    try {
      // Validation
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new BadRequestException('Invalid payment amount');
      }

      // Process payment
      const result = await this.paymentGateway.charge(paymentData);

      return result;

    } catch (error) {
      // Error is automatically recorded by @Trace decorator
      // But you can add additional context
      recordError(error, {
        'payment.amount': paymentData.amount,
        'payment.method': paymentData.method,
        'payment.gateway': 'stripe'
      });

      throw error;
    }
  }
}
```

### Manual Error Handling

```typescript
import { withSpan, SpanStatusCode } from '@jobpilot/telemetry';

async function retryableOperation() {
  return await withSpan('operation.retry', async (span) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      span.setAttribute('retry.attempt', attempts);

      try {
        const result = await unstableOperation();
        span.setAttribute('retry.success', true);
        return result;

      } catch (error) {
        span.addEvent('retry.failed', {
          'attempt': attempts,
          'error': error.message
        });

        if (attempts >= maxAttempts) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `Failed after ${attempts} attempts`
          });
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  });
}
```

## Advanced Scenarios

### Transaction Tracing

```typescript
import { TraceTransaction, withSpan } from '@jobpilot/telemetry';

@Injectable()
export class JobApplicationService {
  @TraceTransaction('job.application.submit', {
    attributeExtractor: (jobId: string, userId: string) => ({
      'job.id': jobId,
      'user.id': userId,
      'transaction.type': 'job_application'
    })
  })
  async submitJobApplication(
    jobId: string,
    userId: string,
    resumeId: string
  ) {
    // Step 1: Validate
    await withSpan('validate.application', async (span) => {
      const job = await this.jobService.findOne(jobId);
      const user = await this.userService.findOne(userId);

      span.setAttribute('job.status', job.status);
      span.setAttribute('user.verified', user.isVerified);

      if (job.status !== 'open') {
        throw new BadRequestException('Job is not open');
      }
    });

    // Step 2: Process resume
    await withSpan('process.resume', async (span) => {
      const resume = await this.resumeService.findOne(resumeId);
      const optimized = await this.aiService.optimizeResume(resume, jobId);

      span.setAttribute('resume.optimized', true);
      span.setAttribute('resume.score', optimized.score);
    });

    // Step 3: Submit application
    const application = await withSpan('submit.application', async (span) => {
      const app = await this.repository.create({
        jobId,
        userId,
        resumeId,
        status: 'pending'
      });

      span.setAttribute('application.id', app.id);
      return app;
    });

    // Step 4: Send notifications
    await withSpan('send.notifications', async (span) => {
      await this.notificationService.sendApplicationConfirmation(
        userId,
        application.id
      );

      span.setAttribute('notification.sent', true);
    });

    return application;
  }
}
```

### Parallel Operations

```typescript
import { withSpan } from '@jobpilot/telemetry';

async function aggregateUserData(userId: string) {
  return await withSpan('aggregate.user.data', async (parentSpan) => {
    parentSpan.setAttribute('user.id', userId);

    // Execute multiple operations in parallel
    // Each gets its own child span
    const [profile, applications, savedJobs] = await Promise.all([
      withSpan('fetch.profile', async (span) => {
        const data = await userService.getProfile(userId);
        span.setAttribute('profile.complete', data.isComplete);
        return data;
      }),

      withSpan('fetch.applications', async (span) => {
        const data = await applicationService.getUserApplications(userId);
        span.setAttribute('applications.count', data.length);
        return data;
      }),

      withSpan('fetch.saved.jobs', async (span) => {
        const data = await jobService.getSavedJobs(userId);
        span.setAttribute('saved.jobs.count', data.length);
        return data;
      })
    ]);

    return { profile, applications, savedJobs };
  });
}
```

### Background Jobs with Context

```typescript
import { propagateContext, extractContext, context } from '@jobpilot/telemetry';

// Producer: Propagate context to background job
async function scheduleReportGeneration(userId: string) {
  const traceHeaders = propagateContext({});

  await queue.add('generate-report', {
    userId,
    _trace: traceHeaders
  });
}

// Consumer: Extract and continue trace
async function processReportJob(job: Job) {
  const ctx = extractContext(job.data._trace || {});

  return context.with(ctx, async () => {
    return await withSpan('report.generate', async (span) => {
      span.setAttribute('user.id', job.data.userId);

      const report = await generateReport(job.data.userId);

      span.setAttribute('report.pages', report.pages);
      span.setAttribute('report.size', report.sizeBytes);

      return report;
    });
  });
}
```

## Performance Tips

1. **Use Decorators**: Prefer `@Trace` over manual spans for consistency
2. **Batch Operations**: Don't create spans for every item in a loop
3. **Sample Wisely**: Use lower sampling rates in production
4. **Lazy Attributes**: Add expensive attributes only when needed
5. **Avoid Deep Nesting**: Keep span hierarchy reasonable (max 5-7 levels)

## Common Patterns

### Repository Pattern
```typescript
@TraceClass()
@Injectable()
export class BaseRepository<T> {
  async findOne(id: string): Promise<T> { /* ... */ }
  async find(criteria: any): Promise<T[]> { /* ... */ }
  async create(data: Partial<T>): Promise<T> { /* ... */ }
  async update(id: string, data: Partial<T>): Promise<T> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}
```

### Service Layer
```typescript
@Injectable()
export class UserService {
  @Trace({ name: 'user.authenticate' })
  async authenticate(credentials: LoginDto) { /* ... */ }

  @Trace({ name: 'user.register' })
  async register(data: RegisterDto) { /* ... */ }

  @Trace({ name: 'user.profile.get' })
  async getProfile(userId: string) { /* ... */ }
}
```

### Controller Layer
```typescript
@Controller('users')
export class UserController {
  // Controllers are automatically traced by middleware
  // Add @Trace only for additional context

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.userService.register(data);
  }
}
```
