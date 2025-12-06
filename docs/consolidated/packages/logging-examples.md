# Logging Package Examples

This document provides comprehensive examples of using the `@jobpilot/logging` package in various scenarios.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [NestJS Integration](#nestjs-integration)
3. [HTTP Request Logging](#http-request-logging)
4. [Error Handling](#error-handling)
5. [Operation Tracking](#operation-tracking)
6. [Custom Metrics and Events](#custom-metrics-and-events)
7. [Correlation and Context](#correlation-and-context)
8. [Background Jobs](#background-jobs)
9. [External API Calls](#external-api-calls)
10. [Database Operations](#database-operations)

---

## Basic Usage

### Simple Logging

```typescript
import { Logger } from '@jobpilot/logging';

const logger = new Logger({
  serviceName: 'my-service',
  environment: 'development',
  version: '1.0.0',
  enableConsole: true,
  logLevel: 'info',
});

// Info log
logger.info('Application started');

// With metadata
logger.info('User action', {
  userId: 'user123',
  action: 'login',
});

// Warning
logger.warn('High memory usage', {
  usage: 85,
  threshold: 80,
});

// Error
logger.error('Failed to connect to database', error, {
  host: 'localhost',
  port: 5432,
});

// Debug (only in development)
logger.debug('Processing data', {
  recordCount: 100,
  batchSize: 10,
});
```

---

## NestJS Integration

### Module Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import {
  LoggingModule,
  LoggingInterceptor,
  LoggingExceptionFilter,
} from '@jobpilot/logging';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    {
      provide: APP_FILTER,
      useClass: LoggingExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### Service with Logging

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { Logger } from '@jobpilot/logging';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: UserRepository,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    this.logger.info('Creating user', {
      email: createUserDto.email,
    });

    try {
      const user = await this.userRepository.create(createUserDto);

      this.logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
      });

      this.logger.trackEvent('user.created', {
        userId: user.id,
        method: 'email',
      });

      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error, {
        email: createUserDto.email,
      });
      throw error;
    }
  }

  async getUserById(userId: string) {
    this.logger.debug('Fetching user by ID', { userId });

    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.warn('User not found', { userId });
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
```

---

## HTTP Request Logging

### Express Middleware

```typescript
import { requestLoggingMiddleware, correlationMiddleware } from '@jobpilot/logging';

// Apply correlation middleware first
app.use(correlationMiddleware());

// Then request logging
app.use(requestLoggingMiddleware({
  logger,
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  includeBody: true,
  includeHeaders: false,
  maxBodyLength: 1000,
}));
```

### Controller with Request Context

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Logger, LoggerContext } from '@jobpilot/logging';

@Controller('jobs')
export class JobsController {
  constructor(private readonly logger: Logger) {}

  @Post()
  async createJob(@Body() createJobDto: CreateJobDto) {
    const correlationId = LoggerContext.getCorrelationId();

    this.logger.info('Job creation requested', {
      correlationId,
      title: createJobDto.title,
      company: createJobDto.company,
    });

    // ... process job creation ...

    return job;
  }
}
```

---

## Error Handling

### Try-Catch with Error Logging

```typescript
async processPayment(paymentData: PaymentDto) {
  try {
    this.logger.info('Processing payment', {
      userId: paymentData.userId,
      amount: paymentData.amount,
    });

    const result = await this.paymentGateway.charge(paymentData);

    this.logger.info('Payment processed successfully', {
      transactionId: result.id,
      amount: result.amount,
    });

    return result;
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      this.logger.warn('Payment failed - insufficient funds', {
        userId: paymentData.userId,
        amount: paymentData.amount,
        errorCode: error.code,
      });
    } else {
      this.logger.error('Payment processing failed', error, {
        userId: paymentData.userId,
        amount: paymentData.amount,
      });
    }

    throw error;
  }
}
```

### Global Exception Filter

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Logger, LoggerContext } from '@jobpilot/logging';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception : new Error(String(exception)),
      {
        path: request.url,
        method: request.method,
        statusCode: status,
        correlationId: LoggerContext.getCorrelationId(),
      },
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId: LoggerContext.getCorrelationId(),
    });
  }
}
```

---

## Operation Tracking

### Long-Running Operation

```typescript
async processLargeDataset(datasetId: string) {
  const operationId = this.logger.startOperation('process-large-dataset');

  this.logger.info('Starting dataset processing', {
    datasetId,
    operationId,
  });

  try {
    // Step 1: Load data
    this.logger.debug('Loading dataset', { operationId });
    const data = await this.loadDataset(datasetId);

    // Step 2: Transform data
    this.logger.debug('Transforming dataset', {
      operationId,
      recordCount: data.length,
    });
    const transformed = await this.transformData(data);

    // Step 3: Save results
    this.logger.debug('Saving results', { operationId });
    const result = await this.saveResults(transformed);

    this.logger.endOperation(operationId, true, {
      recordsProcessed: result.count,
      duration: result.duration,
    });

    this.logger.info('Dataset processing completed', {
      datasetId,
      recordsProcessed: result.count,
    });

    return result;
  } catch (error) {
    this.logger.error('Dataset processing failed', error, {
      datasetId,
      operationId,
    });

    this.logger.endOperation(operationId, false, {
      error: error.message,
    });

    throw error;
  }
}
```

### Nested Operations

```typescript
async importJobsFromMultipleSources() {
  const mainOperationId = this.logger.startOperation('import-all-jobs');

  const sources = ['LinkedIn', 'Indeed', 'Glassdoor'];
  const results = [];

  for (const source of sources) {
    const sourceOperationId = this.logger.startOperation(`import-${source}`);

    try {
      this.logger.info('Importing jobs', {
        source,
        operationId: sourceOperationId,
        parentOperationId: mainOperationId,
      });

      const jobs = await this.importFromSource(source);

      this.logger.endOperation(sourceOperationId, true, {
        jobCount: jobs.length,
      });

      results.push({ source, count: jobs.length });
    } catch (error) {
      this.logger.error(`Failed to import from ${source}`, error, {
        operationId: sourceOperationId,
      });

      this.logger.endOperation(sourceOperationId, false);
      results.push({ source, count: 0, error: error.message });
    }
  }

  this.logger.endOperation(mainOperationId, true, {
    totalSources: sources.length,
    successfulSources: results.filter(r => !r.error).length,
  });

  return results;
}
```

---

## Custom Metrics and Events

### Tracking Business Events

```typescript
// Job application submitted
this.logger.trackEvent('job.application.submitted', {
  jobId: application.jobId,
  userId: application.userId,
  source: 'web',
  hasResume: !!application.resumeId,
}, {
  processingTime: duration,
});

// Search performed
this.logger.trackEvent('job.search.performed', {
  userId: user.id,
  query: searchQuery,
  filters: JSON.stringify(filters),
  resultsCount: results.length,
});

// User upgraded subscription
this.logger.trackEvent('subscription.upgraded', {
  userId: user.id,
  fromPlan: 'free',
  toPlan: 'premium',
  billingCycle: 'monthly',
}, {
  revenue: 29.99,
});
```

### Tracking Performance Metrics

```typescript
// API response time
const startTime = Date.now();
const result = await this.externalApi.call();
const duration = Date.now() - startTime;

this.logger.trackMetric('api.response.time', duration, {
  endpoint: '/jobs/search',
  statusCode: '200',
});

// Database query performance
this.logger.trackMetric('database.query.duration', queryTime, {
  queryType: 'SELECT',
  table: 'users',
});

// Cache hit rate
this.logger.trackMetric('cache.hit.rate', hitRate, {
  cacheType: 'redis',
  key: cacheKey,
});

// Queue depth
this.logger.trackMetric('queue.depth', queueSize, {
  queueName: 'job-processing',
});
```

---

## Correlation and Context

### Setting User Context

```typescript
import { LoggerContext } from '@jobpilot/logging';

// In authentication guard
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) {
      LoggerContext.setUserId(user.id);
    }

    return true;
  }
}
```

### Propagating Correlation ID

```typescript
import { HttpService } from '@nestjs/axios';
import { LoggerContext } from '@jobpilot/logging';

async callDownstreamService(data: any) {
  const correlationId = LoggerContext.getCorrelationId();
  const requestId = LoggerContext.getRequestId();

  const response = await this.httpService.post(
    'https://downstream-service.com/api/process',
    data,
    {
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Request-ID': requestId,
      },
    },
  ).toPromise();

  return response.data;
}
```

### Running in Isolated Context

```typescript
import { LoggerContext } from '@jobpilot/logging';

// Each async operation gets its own context
async processMultipleUsers(userIds: string[]) {
  const promises = userIds.map(userId =>
    LoggerContext.runAsync(async () => {
      // This has its own correlation ID
      this.logger.info('Processing user', { userId });
      return await this.processUser(userId);
    })
  );

  return Promise.all(promises);
}
```

---

## Background Jobs

### Cron Job with Logging

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger, LoggerContext } from '@jobpilot/logging';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class JobSyncService {
  constructor(private readonly logger: Logger) {}

  @Cron(CronExpression.EVERY_HOUR)
  async syncExternalJobs() {
    const jobId = uuidv4();

    // Run in isolated context
    await LoggerContext.runAsync(async () => {
      this.logger.info('Starting scheduled job sync', {
        jobId,
        jobName: 'sync-external-jobs',
      });

      try {
        const startTime = Date.now();
        const results = await this.performSync();
        const duration = Date.now() - startTime;

        this.logger.info('Scheduled job sync completed', {
          jobId,
          jobName: 'sync-external-jobs',
          processed: results.processed,
          failed: results.failed,
          duration,
        });

        this.logger.trackEvent('scheduled.job.completed', {
          jobName: 'sync-external-jobs',
          success: true,
        }, {
          processedCount: results.processed,
          failedCount: results.failed,
          durationMs: duration,
        });
      } catch (error) {
        this.logger.error('Scheduled job sync failed', error, {
          jobId,
          jobName: 'sync-external-jobs',
        });

        this.logger.trackEvent('scheduled.job.failed', {
          jobName: 'sync-external-jobs',
          error: error.message,
        });
      }
    });
  }
}
```

### Bull Queue Processor

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, LoggerContext } from '@jobpilot/logging';

@Processor('email-queue')
export class EmailProcessor {
  constructor(private readonly logger: Logger) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { emailData } = job.data;

    await LoggerContext.runAsync(async () => {
      // Set correlation ID from job data if available
      if (emailData.correlationId) {
        LoggerContext.setCorrelationId(emailData.correlationId);
      }

      this.logger.info('Processing email job', {
        jobId: job.id,
        recipient: emailData.to,
        template: emailData.template,
      });

      try {
        await this.emailService.send(emailData);

        this.logger.info('Email sent successfully', {
          jobId: job.id,
          recipient: emailData.to,
        });

        this.logger.trackEvent('email.sent', {
          template: emailData.template,
          success: true,
        });
      } catch (error) {
        this.logger.error('Failed to send email', error, {
          jobId: job.id,
          recipient: emailData.to,
        });

        this.logger.trackEvent('email.failed', {
          template: emailData.template,
          error: error.message,
        });

        throw error; // Job will be retried
      }
    });
  }
}
```

---

## External API Calls

### HTTP Client with Dependency Tracking

```typescript
import { HttpService } from '@nestjs/axios';
import { Logger } from '@jobpilot/logging';

async callExternalJobAPI(query: string) {
  const apiUrl = 'https://api.jobboard.com/search';
  const startTime = Date.now();

  this.logger.info('Calling external job API', {
    endpoint: apiUrl,
    query,
  });

  try {
    const response = await this.httpService.get(apiUrl, {
      params: { q: query },
    }).toPromise();

    const duration = Date.now() - startTime;

    this.logger.trackDependency(
      'HTTP',
      apiUrl,
      `GET ${apiUrl}`,
      duration,
      true,
      response.status,
      {
        query,
        resultCount: response.data.length,
      },
    );

    this.logger.info('External API call successful', {
      endpoint: apiUrl,
      statusCode: response.status,
      resultCount: response.data.length,
      duration,
    });

    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;

    this.logger.trackDependency(
      'HTTP',
      apiUrl,
      `GET ${apiUrl}`,
      duration,
      false,
      error.response?.status,
      {
        query,
        errorMessage: error.message,
      },
    );

    this.logger.error('External API call failed', error, {
      endpoint: apiUrl,
      statusCode: error.response?.status,
      duration,
    });

    throw error;
  }
}
```

---

## Database Operations

### TypeORM with Logging

```typescript
import { Logger } from '@jobpilot/logging';

async findUserWithJobs(userId: string) {
  const startTime = Date.now();

  this.logger.debug('Querying user with jobs', { userId });

  try {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.jobs', 'jobs')
      .where('user.id = :userId', { userId })
      .getOne();

    const duration = Date.now() - startTime;

    this.logger.trackDependency(
      'SQL',
      'PostgreSQL',
      'SELECT user with jobs',
      duration,
      true,
      undefined,
      {
        userId,
        jobCount: user?.jobs?.length || 0,
      },
    );

    this.logger.debug('Query completed', {
      userId,
      duration,
      found: !!user,
    });

    return user;
  } catch (error) {
    const duration = Date.now() - startTime;

    this.logger.trackDependency(
      'SQL',
      'PostgreSQL',
      'SELECT user with jobs',
      duration,
      false,
      undefined,
      {
        userId,
        error: error.message,
      },
    );

    this.logger.error('Database query failed', error, {
      userId,
      duration,
    });

    throw error;
  }
}
```

---

## Complete Example: Job Application Service

```typescript
import { Injectable } from '@nestjs/common';
import { Logger, LoggerContext } from '@jobpilot/logging';

@Injectable()
export class JobApplicationService {
  constructor(
    private readonly logger: Logger,
    private readonly jobRepository: JobRepository,
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly aiService: AiService,
  ) {}

  async submitApplication(applicationDto: ApplicationDto) {
    const operationId = this.logger.startOperation('submit-job-application');

    this.logger.info('Job application submission started', {
      jobId: applicationDto.jobId,
      userId: applicationDto.userId,
      operationId,
    });

    try {
      // Step 1: Validate job exists
      const job = await this.validateJob(applicationDto.jobId);

      // Step 2: Get user profile
      const user = await this.getUserProfile(applicationDto.userId);

      // Step 3: AI resume optimization
      const optimizedResume = await this.optimizeResume(
        user.resume,
        job.description,
      );

      // Step 4: Submit application
      const application = await this.createApplication({
        ...applicationDto,
        optimizedResume,
      });

      // Step 5: Send confirmation email
      await this.sendConfirmationEmail(user.email, job, application);

      // Track success
      this.logger.trackEvent('job.application.submitted', {
        jobId: job.id,
        userId: user.id,
        applicationId: application.id,
        aiOptimized: true,
      }, {
        processingTime: Date.now() - operationStartTime,
      });

      this.logger.endOperation(operationId, true, {
        applicationId: application.id,
      });

      this.logger.info('Job application submitted successfully', {
        applicationId: application.id,
        jobId: job.id,
        userId: user.id,
      });

      return application;
    } catch (error) {
      this.logger.error('Job application submission failed', error, {
        jobId: applicationDto.jobId,
        userId: applicationDto.userId,
        operationId,
      });

      this.logger.endOperation(operationId, false, {
        error: error.message,
      });

      throw error;
    }
  }

  private async validateJob(jobId: string) {
    this.logger.debug('Validating job', { jobId });

    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      this.logger.warn('Job not found', { jobId });
      throw new NotFoundException('Job not found');
    }

    if (!job.isActive) {
      this.logger.warn('Job is no longer active', { jobId });
      throw new BadRequestException('Job is no longer accepting applications');
    }

    return job;
  }

  private async optimizeResume(resume: Resume, jobDescription: string) {
    const startTime = Date.now();

    this.logger.info('Optimizing resume with AI', {
      resumeId: resume.id,
    });

    try {
      const optimized = await this.aiService.optimizeResume(resume, jobDescription);
      const duration = Date.now() - startTime;

      this.logger.trackDependency(
        'AI Service',
        'Resume Optimization',
        'POST /api/optimize',
        duration,
        true,
      );

      this.logger.info('Resume optimization completed', {
        resumeId: resume.id,
        duration,
        improvementScore: optimized.score,
      });

      return optimized;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.trackDependency(
        'AI Service',
        'Resume Optimization',
        'POST /api/optimize',
        duration,
        false,
      );

      this.logger.error('Resume optimization failed', error, {
        resumeId: resume.id,
        duration,
      });

      // Fall back to original resume
      this.logger.warn('Using original resume due to optimization failure');
      return resume;
    }
  }
}
```

This completes the examples. Refer to the main documentation for more detailed information about configuration and best practices.
