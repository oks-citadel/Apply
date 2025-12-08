# Monitoring and Observability Integration Guide

This guide explains how to integrate monitoring, metrics, tracing, and logging into Job-Apply-Platform services.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [NestJS Service Integration](#nestjs-service-integration)
- [Python Service Integration](#python-service-integration)
- [Custom Metrics](#custom-metrics)
- [Distributed Tracing](#distributed-tracing)
- [Structured Logging](#structured-logging)
- [Dashboard Access](#dashboard-access)

## Overview

The Job-Apply-Platform uses a comprehensive observability stack:

- **Azure Application Insights**: Cloud-native APM and monitoring
- **OpenTelemetry**: Distributed tracing across all services
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notification
- **Pino**: Structured JSON logging with correlation IDs

## Quick Start

### 1. Install Dependencies

For NestJS services:

```bash
cd services/your-service
npm install @jobpilot/telemetry
```

For Python services:

```bash
cd services/your-service
pip install opentelemetry-api opentelemetry-sdk azure-monitor-opentelemetry
```

### 2. Environment Variables

Add to your service's `.env` file:

```env
# Azure Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx.applicationinsights.azure.com/

# OpenTelemetry
OTEL_SERVICE_NAME=your-service-name
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
NODE_ENV=production
```

## NestJS Service Integration

### Step 1: Update `main.ts` to Initialize Telemetry First

**IMPORTANT**: Initialize telemetry **BEFORE** importing any application modules:

```typescript
// services/your-service/src/main.ts
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // Initialize telemetry FIRST - before any other imports
  await initTelemetry({
    serviceName: 'your-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });

  // Now import and use your application modules
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');
  const { StructuredLogger } = await import('@jobpilot/telemetry');

  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger
  });

  // Use structured logger
  const logger = new StructuredLogger({
    serviceName: 'your-service',
    environment: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
  });

  app.useLogger(logger);

  await app.listen(3000);
  logger.info('Service started', { port: 3000 });
}

bootstrap();
```

### Step 2: Configure AppModule with TelemetryModule

```typescript
// services/your-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelemetryModule, MetricsInterceptor, LoggingInterceptor } from '@jobpilot/telemetry';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelemetryModule.forRoot({
      serviceName: 'your-service',
      serviceVersion: '1.0.0',
      environment: process.env.NODE_ENV,
      enablePrometheus: true,
      prometheusPath: '/metrics',
      enableDefaultMetrics: true,
      logLevel: process.env.LOG_LEVEL || 'info',
    }),
    // Your other modules...
  ],
  providers: [
    // Add metrics interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    // Add logging interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

### Step 3: Use Metrics in Your Services

```typescript
// services/your-service/src/modules/jobs/jobs.service.ts
import { Injectable } from '@nestjs/common';
import { MetricsService, withSpan, addUserContext } from '@jobpilot/telemetry';

@Injectable()
export class JobsService {
  // Custom metrics
  private jobSearchCounter;
  private jobSearchDuration;

  constructor(private readonly metricsService: MetricsService) {
    // Create custom metrics
    this.jobSearchCounter = this.metricsService.createCounter(
      'job_searches_total',
      'Total number of job searches',
      ['search_type', 'status'],
    );

    this.jobSearchDuration = this.metricsService.createHistogram(
      'job_search_duration_seconds',
      'Job search operation duration',
      ['search_type'],
      [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    );
  }

  async searchJobs(query: string, userId: string): Promise<Job[]> {
    // Use distributed tracing
    return await withSpan(
      'job.search',
      async (span) => {
        const startTime = Date.now();

        try {
          // Add user context to trace
          addUserContext(userId);

          // Add custom attributes to span
          span.setAttributes({
            'job.search.query': query,
            'job.search.user_id': userId,
          });

          // Perform search
          const jobs = await this.performSearch(query);

          // Record metrics
          this.jobSearchCounter.inc({ search_type: 'keyword', status: 'success' });
          const duration = (Date.now() - startTime) / 1000;
          this.jobSearchDuration.observe({ search_type: 'keyword' }, duration);

          span.setAttribute('job.search.results_count', jobs.length);

          return jobs;
        } catch (error) {
          // Record error metrics
          this.jobSearchCounter.inc({ search_type: 'keyword', status: 'error' });
          throw error;
        }
      },
      { kind: SpanKind.INTERNAL },
    );
  }

  async getJobDetails(jobId: string): Promise<Job> {
    // Record database query metrics
    const startTime = Date.now();

    try {
      const job = await this.jobRepository.findOne(jobId);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.recordDatabaseQuery('SELECT', 'jobs', duration);

      return job;
    } catch (error) {
      throw error;
    }
  }
}
```

### Step 4: Use Structured Logging

```typescript
// services/your-service/src/modules/jobs/jobs.controller.ts
import { Controller, Get, Query, Req } from '@nestjs/common';
import { StructuredLogger } from '@jobpilot/telemetry';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly logger: StructuredLogger,
  ) {}

  @Get('search')
  async searchJobs(@Query('q') query: string, @Req() request: any) {
    const childLogger = this.logger.child({
      correlationId: request.correlationId,
      userId: request.user?.id,
      endpoint: 'jobs.search',
    });

    childLogger.info('Job search initiated', { query });

    try {
      const results = await this.jobsService.searchJobs(query, request.user?.id);

      childLogger.info('Job search completed', {
        query,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      childLogger.error('Job search failed', error, { query });
      throw error;
    }
  }
}
```

## Python Service Integration

### Step 1: Initialize OpenTelemetry in `main.py`

```python
# services/ai-service/src/main.py
from azure.monitor.opentelemetry import configure_azure_monitor
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from fastapi import FastAPI
import logging
import os

# Configure Azure Monitor FIRST
configure_azure_monitor(
    connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING"),
    logger_name="ai-service",
)

# Configure structured logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='{"time":"%(asctime)s","level":"%(levelname)s","service":"ai-service","message":"%(message)s"}',
)

logger = logging.getLogger("ai-service")

# Create FastAPI app
app = FastAPI(title="AI Service")

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# Get tracer
tracer = trace.get_tracer("ai-service")

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/ai/optimize-resume")
async def optimize_resume(request: OptimizeResumeRequest):
    # Create span for this operation
    with tracer.start_as_current_span("optimize_resume") as span:
        span.set_attribute("resume.id", request.resume_id)
        span.set_attribute("user.id", request.user_id)

        logger.info(f"Optimizing resume", extra={
            "resume_id": request.resume_id,
            "user_id": request.user_id,
        })

        try:
            result = await optimize_resume_logic(request)
            span.set_attribute("optimization.score", result.score)
            logger.info("Resume optimization completed", extra={
                "resume_id": request.resume_id,
                "score": result.score,
            })
            return result
        except Exception as e:
            span.record_exception(e)
            logger.error(f"Resume optimization failed: {str(e)}", extra={
                "resume_id": request.resume_id,
                "error": str(e),
            })
            raise

# Add Prometheus metrics endpoint
from prometheus_client import Counter, Histogram, generate_latest

resume_optimization_counter = Counter(
    'ai_service_resume_optimizations_total',
    'Total resume optimizations',
    ['status']
)

resume_optimization_duration = Histogram(
    'ai_service_resume_optimization_duration_seconds',
    'Resume optimization duration'
)

@app.get("/metrics")
async def metrics():
    return generate_latest()
```

## Custom Metrics

### Common Metric Patterns

```typescript
// Counter - for counting events
const requestCounter = metricsService.createCounter(
  'api_requests_total',
  'Total API requests',
  ['endpoint', 'status'],
);
requestCounter.inc({ endpoint: '/api/jobs', status: 'success' });

// Gauge - for values that go up and down
const activeUsersGauge = metricsService.createGauge(
  'active_users',
  'Number of active users',
);
activeUsersGauge.set(150);

// Histogram - for measuring distributions
const responseTimeHistogram = metricsService.createHistogram(
  'response_time_seconds',
  'API response time',
  ['endpoint'],
  [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
);
responseTimeHistogram.observe({ endpoint: '/api/jobs' }, 0.123);
```

### Business Metrics

```typescript
// Track job applications
const applicationMetrics = {
  submitted: metricsService.createCounter(
    'job_applications_submitted_total',
    'Total job applications submitted',
    ['source', 'status'],
  ),
  successRate: metricsService.createGauge(
    'job_applications_success_rate',
    'Job application success rate',
  ),
};

// Track resume parsing
const resumeMetrics = {
  parsed: metricsService.createCounter(
    'resumes_parsed_total',
    'Total resumes parsed',
    ['format', 'status'],
  ),
  parseTime: metricsService.createHistogram(
    'resume_parse_duration_seconds',
    'Resume parsing duration',
    ['format'],
  ),
};
```

## Distributed Tracing

### Creating Custom Spans

```typescript
import { withSpan, createSpan, SpanKind } from '@jobpilot/telemetry';

// Async operation with automatic span management
const result = await withSpan(
  'process_job_application',
  async (span) => {
    span.setAttribute('job.id', jobId);
    span.setAttribute('user.id', userId);

    const application = await createApplication(jobId, userId);

    span.setAttribute('application.id', application.id);
    return application;
  },
  { kind: SpanKind.INTERNAL },
);

// Manual span creation
const span = createSpan('external_api_call', {
  kind: SpanKind.CLIENT,
  attributes: {
    'http.method': 'POST',
    'http.url': 'https://api.example.com/jobs',
  },
});

try {
  const response = await axios.post('https://api.example.com/jobs', data);
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
} finally {
  span.end();
}
```

### Cross-Service Tracing

```typescript
import { propagateTraceContext } from '@jobpilot/telemetry';

// Propagate trace context in HTTP calls
const headers = propagateTraceContext({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

const response = await axios.post('http://job-service/api/jobs', data, {
  headers,
});
```

## Structured Logging

### Best Practices

```typescript
// Good: Structured with context
logger.info('User authenticated', {
  userId: user.id,
  email: user.email,
  loginMethod: 'oauth',
  duration: loginDuration,
});

// Bad: Unstructured
logger.info(`User ${user.email} authenticated via oauth in ${loginDuration}ms`);

// Error logging with stack traces
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'riskyOperation',
    userId: user.id,
    attemptCount: retryCount,
  });
}
```

### Correlation IDs

```typescript
// Automatically added by LoggingInterceptor
// Access in request handler:
@Get()
async getData(@Req() request: any) {
  const correlationId = request.correlationId;
  const logger = request.logger; // Pre-configured with correlationId

  logger.info('Processing request', { endpoint: 'getData' });
  // All logs will include the correlationId
}
```

## Dashboard Access

### Grafana

Access Grafana at: `http://grafana.your-domain.com`

Default dashboards:
- **Platform Overview**: Overall system health
- **Service Details**: Per-service metrics
- **Database Performance**: Database query metrics
- **Business Metrics**: Application-specific KPIs

### Azure Application Insights

Access via Azure Portal:
1. Navigate to Application Insights resource
2. View Application Map for service dependencies
3. Transaction Search for distributed traces
4. Metrics Explorer for custom metrics

### Prometheus

Access Prometheus at: `http://prometheus.your-domain.com`

Useful queries:
```promql
# Request rate by service
sum(rate(http_requests_total[5m])) by (service)

# Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

## Troubleshooting

### Traces Not Appearing

1. Check `APPLICATIONINSIGHTS_CONNECTION_STRING` is set
2. Verify telemetry initialization occurs before module imports
3. Check Azure Application Insights resource is accessible

### Metrics Not Scraped

1. Verify `/metrics` endpoint is accessible
2. Check Prometheus configuration has correct targets
3. Ensure Prometheus can reach service pods/containers

### Logs Not Structured

1. Set `LOG_FORMAT=json` in environment
2. Verify StructuredLogger is being used
3. Check log aggregation pipeline configuration

## Next Steps

1. Review [Alert Rules](../infrastructure/monitoring/alerts/)
2. Create custom dashboards in Grafana
3. Set up log aggregation with Loki or Azure Log Analytics
4. Configure notification channels in AlertManager
5. Implement SLO/SLI monitoring
