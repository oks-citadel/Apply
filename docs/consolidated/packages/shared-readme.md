# @jobpilot/shared

Shared utilities package for the JobPilot AI Platform, providing centralized logging, metrics collection, and health checks for all microservices.

## Features

- **Structured Logging** with Winston or Pino
- **Correlation ID** support for distributed tracing
- **Prometheus Metrics** for monitoring
- **Health Checks** for Kubernetes
- **Express/NestJS Middleware** for automatic instrumentation

## Installation

```bash
npm install @jobpilot/shared
```

## Quick Start

### Logging

```typescript
import { createLoggerInstance } from '@jobpilot/shared';

const logger = createLoggerInstance({
  serviceName: 'my-service',
  environment: 'production',
  version: '1.0.0',
  logLevel: 'info',
  usePino: false, // or true for Pino
});

// Basic logging
logger.info('Application started', { port: 3000 });
logger.warn('High memory usage detected', { usage: 85 });
logger.error('Database connection failed', error, { host: 'localhost' });

// With correlation tracking
logger.setContext({ correlationId: req.headers['x-correlation-id'] });
logger.info('Processing request', { userId: user.id });
```

### Metrics

```typescript
import { createPrometheusMetrics } from '@jobpilot/shared';

const metrics = createPrometheusMetrics({
  serviceName: 'my-service',
  environment: 'production',
  enableDefaultMetrics: true,
});

// HTTP middleware (Express/NestJS)
app.use(metrics.middleware());

// Track custom operations
const start = Date.now();
try {
  await processOrder(orderId);
  metrics.trackOperation('process_order', 'business', Date.now() - start, true);
} catch (error) {
  metrics.trackOperation('process_order', 'business', Date.now() - start, false, 'error');
}

// Queue metrics
metrics.updateQueueSize('email-queue', 'waiting', 150);
metrics.trackQueueJob('email-queue', 'send-email', 500, true);

// Cache metrics
metrics.recordCacheHit('user-cache', 'profile');
metrics.recordCacheMiss('user-cache', 'settings');
```

### Health Checks

```typescript
import { HealthService, HealthController } from '@jobpilot/shared';

const healthService = new HealthService(
  terminusHealth,
  logger,
  {
    serviceName: 'my-service',
    version: '1.0.0',
    dependencies: {
      database: true,
      redis: true,
      externalServices: [
        { name: 'auth-service', url: 'http://auth-service:3000/health' },
      ],
    },
  }
);

// Creates endpoints:
// GET /health - Basic health
// GET /health/live - Liveness probe
// GET /health/ready - Readiness probe
```

## API Documentation

### Logger

#### Configuration

```typescript
interface LoggerConfig {
  serviceName: string;
  environment: string;
  version?: string;
  logLevel?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  logFilePath?: string;
  usePino?: boolean;
}

enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}
```

#### Methods

- `info(message: string, metadata?: LogMetadata): void`
- `warn(message: string, metadata?: LogMetadata): void`
- `error(message: string, error?: Error, metadata?: LogMetadata): void`
- `debug(message: string, metadata?: LogMetadata): void`
- `http(message: string, metadata?: LogMetadata): void`
- `setContext(context: Partial<LogContext>): void`
- `getContext(correlationId?: string): LogContext | undefined`
- `startOperation(operationName: string, metadata?: LogMetadata): string`
- `endOperation(operationId: string, operationName: string, success: boolean, metadata?: LogMetadata): void`
- `child(childContext: LogMetadata): Logger`

### PrometheusMetrics

#### Configuration

```typescript
interface MetricsConfig {
  serviceName: string;
  environment: string;
  version?: string;
  enableDefaultMetrics?: boolean;
  prefix?: string;
}
```

#### Built-in Metrics

**HTTP Metrics:**
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total request counter
- `http_request_errors_total` - Error counter
- `http_requests_in_flight` - In-flight requests gauge

**Operation Metrics:**
- `operation_duration_seconds` - Operation duration histogram
- `operations_total` - Total operations counter
- `operation_errors_total` - Operation errors counter

**Queue Metrics:**
- `queue_size` - Queue size gauge
- `queue_job_processing_duration_seconds` - Job processing duration
- `queue_jobs_total` - Total jobs processed
- `queue_job_errors_total` - Job errors

**Database Metrics:**
- `db_query_duration_seconds` - Query duration histogram
- `db_connection_pool_size` - Connection pool size
- `db_connection_pool_active` - Active connections
- `db_connection_pool_idle` - Idle connections

**Cache Metrics:**
- `cache_hits_total` - Cache hits counter
- `cache_misses_total` - Cache misses counter
- `cache_operation_duration_seconds` - Cache operation duration

#### Methods

- `middleware(): (req, res, next) => void` - Express/NestJS middleware
- `recordHttpRequest(method, route, statusCode, duration): void`
- `trackOperation(name, type, duration, success, errorType?): void`
- `updateQueueSize(queueName, status, size): void`
- `trackQueueJob(queueName, jobType, duration, success, errorType?): void`
- `trackDatabaseQuery(queryType, table, duration): void`
- `updateDbConnectionPool(total, active, idle): void`
- `recordCacheHit(cacheName, keyPrefix?): void`
- `recordCacheMiss(cacheName, keyPrefix?): void`
- `trackCacheOperation(cacheName, operation, duration): void`
- `createGauge(name, help, labelNames?): Gauge`
- `createCounter(name, help, labelNames?): Counter`
- `createHistogram(name, help, labelNames?, buckets?): Histogram`
- `getMetrics(): Promise<string>` - Get Prometheus format
- `getMetricsJSON(): Promise<any>` - Get JSON format
- `resetMetrics(): void`

### Health Service

#### Configuration

```typescript
interface HealthCheckConfig {
  serviceName: string;
  version: string;
  dependencies?: {
    database?: boolean;
    redis?: boolean;
    externalServices?: Array<{
      name: string;
      url: string;
      timeout?: number;
    }>;
  };
}
```

#### Methods

- `getBasicHealth(): BasicHealthResponse`
- `getLiveness(): LivenessResponse`
- `getReadiness(): Promise<ReadinessResponse>`

#### Response Types

```typescript
interface BasicHealthResponse {
  status: 'ok' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
}

interface LivenessResponse {
  status: 'ok';
  timestamp: string;
}

interface ReadinessResponse {
  status: 'ok' | 'degraded' | 'down';
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
      responseTime?: number;
    };
  };
  timestamp: string;
}
```

## NestJS Integration

### Module Setup

```typescript
import { Module } from '@nestjs/common';
import {
  PrometheusMetrics,
  createPrometheusMetrics,
  MetricsController,
  HealthController,
  HealthService,
  Logger,
  createLoggerInstance,
} from '@jobpilot/shared';

const logger = createLoggerInstance({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV,
});

const metrics = createPrometheusMetrics({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV,
});

@Module({
  controllers: [MetricsController, HealthController],
  providers: [
    { provide: Logger, useValue: logger },
    { provide: PrometheusMetrics, useValue: metrics },
    {
      provide: HealthService,
      useFactory: (terminus) => new HealthService(terminus, logger, {
        serviceName: 'my-service',
        version: '1.0.0',
        dependencies: { database: true },
      }),
      inject: [TerminusHealthCheckService],
    },
  ],
  exports: [Logger, PrometheusMetrics, HealthService],
})
export class MonitoringModule {}
```

### Middleware Setup

```typescript
import { NestFactory } from '@nestjs/core';
import { PrometheusMetrics, Logger } from '@jobpilot/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const metrics = app.get(PrometheusMetrics);
  const logger = app.get(Logger);

  // Add metrics middleware
  app.use(metrics.middleware());

  // Add logging middleware
  app.use((req, res, next) => {
    logger.setContext({
      correlationId: req.headers['x-correlation-id'],
      requestId: req.headers['x-request-id'],
    });
    next();
  });

  await app.listen(3000);
}
```

## Express Integration

```typescript
import express from 'express';
import { createLoggerInstance, createPrometheusMetrics } from '@jobpilot/shared';

const app = express();

const logger = createLoggerInstance({
  serviceName: 'express-service',
  environment: 'production',
});

const metrics = createPrometheusMetrics({
  serviceName: 'express-service',
  environment: 'production',
});

// Add middleware
app.use(metrics.middleware());
app.use((req, res, next) => {
  logger.setContext({
    correlationId: req.headers['x-correlation-id'],
  });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await metrics.getMetrics());
});

app.listen(3000);
```

## Best Practices

### 1. Always Use Correlation IDs

```typescript
// Set in middleware
logger.setContext({
  correlationId: req.headers['x-correlation-id'] || uuidv4(),
});

// Propagate to external services
axios.post(url, data, {
  headers: {
    'X-Correlation-ID': logger.getContext()?.correlationId,
  },
});
```

### 2. Use Structured Logging

```typescript
// Good
logger.info('User registered', { userId, email, country });

// Bad
logger.info(`User ${userId} registered with email ${email}`);
```

### 3. Track Business Operations

```typescript
const operationId = logger.startOperation('user_registration', { email });

try {
  await registerUser(data);
  logger.endOperation(operationId, 'user_registration', true);
} catch (error) {
  logger.endOperation(operationId, 'user_registration', false);
  throw error;
}
```

### 4. Use Appropriate Log Levels

- **ERROR**: System errors requiring immediate attention
- **WARN**: Potential issues that should be investigated
- **INFO**: Important business events
- **DEBUG**: Detailed diagnostic information

### 5. Don't Log Sensitive Data

```typescript
// Bad
logger.info('User login', { password: user.password });

// Good
logger.info('User login', { userId: user.id, email: user.email });
```

## Environment Variables

Configure via environment variables:

```bash
# Logging
LOG_LEVEL=info
NODE_ENV=production
SERVICE_VERSION=1.0.0

# Metrics
ENABLE_DEFAULT_METRICS=true
METRICS_PREFIX=jobpilot

# Health Checks
HEALTH_CHECK_TIMEOUT=5000
```

## Testing

```typescript
import { createLoggerInstance, createPrometheusMetrics } from '@jobpilot/shared';

describe('Monitoring', () => {
  let logger: Logger;
  let metrics: PrometheusMetrics;

  beforeEach(() => {
    logger = createLoggerInstance({
      serviceName: 'test-service',
      environment: 'test',
    });

    metrics = createPrometheusMetrics({
      serviceName: 'test-service',
      environment: 'test',
    });
  });

  it('should track operations', () => {
    const start = Date.now();
    metrics.trackOperation('test_op', 'test', Date.now() - start, true);
    // Assert metrics were recorded
  });

  it('should log with correlation ID', () => {
    logger.setContext({ correlationId: 'test-123' });
    logger.info('Test message');
    // Assert log contains correlation ID
  });
});
```

## Performance Considerations

- **Pino** is ~5x faster than Winston for high-throughput services
- Default metrics collection has minimal overhead (<1%)
- Histogram buckets should match your SLOs
- Use sampling for very high-frequency events

## Migration Guide

### From Winston

```typescript
// Before
import winston from 'winston';
const logger = winston.createLogger({...});

// After
import { createLoggerInstance } from '@jobpilot/shared';
const logger = createLoggerInstance({
  serviceName: 'my-service',
  environment: 'production',
  usePino: false, // Keep Winston compatibility
});
```

### From Pino

```typescript
// Before
import pino from 'pino';
const logger = pino();

// After
import { createLoggerInstance } from '@jobpilot/shared';
const logger = createLoggerInstance({
  serviceName: 'my-service',
  environment: 'production',
  usePino: true, // Use Pino
});
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT

## Support

For issues or questions:
- GitHub Issues: https://github.com/jobpilot/platform/issues
- Slack: #platform-monitoring
- Email: devops@jobpilot.ai
