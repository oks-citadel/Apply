# Monitoring Setup Guide for JobPilot Services

This guide walks you through integrating monitoring, logging, and health checks into any JobPilot microservice.

## Prerequisites

- Node.js 18+ or Python 3.9+
- Docker and Docker Compose
- Access to the JobPilot repository

## Step 1: Install Dependencies

### For NestJS Services (TypeScript)

```bash
cd services/your-service
npm install @jobpilot/shared
```

### For Python Services

```bash
cd services/ai-service
pip install prometheus-client python-json-logger
```

## Step 2: Configure Logging

### NestJS Service

1. **Create logger instance** in `main.ts`:

```typescript
import { createLoggerInstance, LoggerMiddleware } from '@jobpilot/shared';

const logger = createLoggerInstance({
  serviceName: 'your-service',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.SERVICE_VERSION || '1.0.0',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
  usePino: false, // Set to true for Pino (faster)
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger
  });

  // Add logging middleware
  app.use(new LoggerMiddleware(logger).use);

  await app.listen(3000);
  logger.info('Service started', { port: 3000 });
}
```

2. **Inject logger into services**:

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from '@jobpilot/shared';

@Injectable()
export class YourService {
  constructor(private readonly logger: Logger) {}

  async processRequest(data: any) {
    const operationId = this.logger.startOperation('process_request', {
      dataSize: data.length,
    });

    try {
      // Your business logic
      const result = await this.doWork(data);

      this.logger.endOperation(operationId, 'process_request', true, {
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to process request', error, {
        operationId,
      });
      this.logger.endOperation(operationId, 'process_request', false);
      throw error;
    }
  }
}
```

### Python Service (FastAPI)

```python
import logging
from pythonjsonlogger import jsonlogger
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure JSON logging
logger = logging.getLogger(__name__)
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(name)s %(levelname)s %(message)s',
    rename_fields={'levelname': 'severity', 'asctime': 'timestamp'}
)
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get('x-correlation-id', str(uuid.uuid4()))
        request.state.correlation_id = correlation_id

        logger.info('Incoming request', extra={
            'correlation_id': correlation_id,
            'method': request.method,
            'path': request.url.path,
        })

        response = await call_next(request)
        response.headers['X-Correlation-ID'] = correlation_id

        return response

app.add_middleware(LoggingMiddleware)
```

## Step 3: Add Prometheus Metrics

### NestJS Service

1. **Configure metrics** in `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import {
  PrometheusMetrics,
  createPrometheusMetrics,
  MetricsController
} from '@jobpilot/shared';

const metrics = createPrometheusMetrics({
  serviceName: 'your-service',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.SERVICE_VERSION || '1.0.0',
  enableDefaultMetrics: true,
});

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: PrometheusMetrics,
      useValue: metrics,
    },
  ],
  exports: [PrometheusMetrics],
})
export class MetricsModule {}
```

2. **Add HTTP metrics middleware** in `main.ts`:

```typescript
import { PrometheusMetrics } from '@jobpilot/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const metrics = app.get(PrometheusMetrics);
  app.use(metrics.middleware());

  await app.listen(3000);
}
```

3. **Track custom metrics** in your services:

```typescript
@Injectable()
export class OrderService {
  constructor(private readonly metrics: PrometheusMetrics) {}

  async processOrder(orderId: string) {
    const start = Date.now();

    try {
      const order = await this.getOrder(orderId);
      const duration = Date.now() - start;

      this.metrics.trackOperation(
        'process_order',
        'business',
        duration,
        true
      );

      return order;
    } catch (error) {
      const duration = Date.now() - start;

      this.metrics.trackOperation(
        'process_order',
        'business',
        duration,
        false,
        error.name
      );

      throw error;
    }
  }
}
```

### Python Service (FastAPI)

```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import FastAPI, Response
import time

app = FastAPI()

# Define metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Metrics endpoint
@app.get('/metrics')
async def metrics():
    return Response(
        content=generate_latest(),
        media_type='text/plain; version=0.0.4; charset=utf-8'
    )

# Middleware for automatic tracking
@app.middleware("http")
async def track_metrics(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()

    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response
```

## Step 4: Add Health Checks

### NestJS Service

1. **Install Terminus**:

```bash
npm install @nestjs/terminus @nestjs/axios
```

2. **Create health module** in `src/health/health.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from '@jobpilot/shared';
import { HealthService } from '@jobpilot/shared';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
  providers: [
    {
      provide: HealthService,
      useFactory: (terminus, logger) => new HealthService(
        terminus,
        logger,
        {
          serviceName: 'your-service',
          version: '1.0.0',
          dependencies: {
            database: true,
            redis: true,
            externalServices: [
              {
                name: 'auth-service',
                url: 'http://auth-service:3000/health',
              },
            ],
          },
        }
      ),
      inject: [TerminusHealthCheckService, Logger],
    },
  ],
})
export class HealthModule {}
```

3. **Import in app module**:

```typescript
@Module({
  imports: [HealthModule],
})
export class AppModule {}
```

### Python Service (FastAPI)

```python
from fastapi import FastAPI, HTTPException
from datetime import datetime
import time

app = FastAPI()

start_time = time.time()

@app.get('/health')
async def health():
    return {
        'status': 'ok',
        'service': 'ai-service',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'uptime': int(time.time() - start_time)
    }

@app.get('/health/live')
async def liveness():
    return {'status': 'ok', 'timestamp': datetime.utcnow().isoformat()}

@app.get('/health/ready')
async def readiness():
    checks = {}

    # Check database
    try:
        # Your DB check logic
        checks['database'] = {'status': 'up'}
    except Exception as e:
        checks['database'] = {'status': 'down', 'message': str(e)}

    # Check Redis
    try:
        # Your Redis check logic
        checks['redis'] = {'status': 'up'}
    except Exception as e:
        checks['redis'] = {'status': 'down', 'message': str(e)}

    # Determine overall status
    overall_status = 'ok' if all(
        check['status'] == 'up' for check in checks.values()
    ) else 'down'

    if overall_status == 'down':
        raise HTTPException(status_code=503, detail=checks)

    return {
        'status': overall_status,
        'checks': checks,
        'timestamp': datetime.utcnow().isoformat()
    }
```

## Step 5: Update Kubernetes Manifests

Add health check probes to your service's Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-service
spec:
  template:
    spec:
      containers:
      - name: your-service
        image: your-service:latest
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 3000
          name: metrics
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

## Step 6: Configure Prometheus Scraping

Your service is already configured in `infrastructure/monitoring/prometheus/prometheus.yml`.

Verify the scrape configuration:

```yaml
- job_name: 'your-service'
  scrape_interval: 10s
  metrics_path: '/metrics'
  static_configs:
    - targets: ['your-service:3000']
      labels:
        service: 'your-service'
        team: 'your-team'
```

## Step 7: Test Your Integration

### 1. Start Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Start Your Service

```bash
cd services/your-service
npm run start:dev
```

### 3. Verify Endpoints

- Health: http://localhost:3000/health
- Liveness: http://localhost:3000/health/live
- Readiness: http://localhost:3000/health/ready
- Metrics: http://localhost:3000/metrics

### 4. Check Prometheus

Visit http://localhost:9090/targets and verify your service is being scraped.

### 5. View Metrics in Grafana

1. Open http://localhost:3001
2. Login (admin/admin)
3. Navigate to "JobPilot - Service Overview" dashboard
4. Your service should appear in the graphs

## Step 8: Queue Monitoring (Optional)

If your service uses Bull queues:

```typescript
import { Queue } from 'bull';
import { PrometheusMetrics } from '@jobpilot/shared';

@Injectable()
export class QueueMonitorService implements OnModuleInit {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private readonly metrics: PrometheusMetrics,
  ) {}

  async onModuleInit() {
    // Update queue metrics every 10 seconds
    setInterval(async () => {
      const waiting = await this.emailQueue.getWaitingCount();
      const active = await this.emailQueue.getActiveCount();
      const completed = await this.emailQueue.getCompletedCount();
      const failed = await this.emailQueue.getFailedCount();

      this.metrics.updateQueueSize('email-queue', 'waiting', waiting);
      this.metrics.updateQueueSize('email-queue', 'active', active);
      this.metrics.updateQueueSize('email-queue', 'completed', completed);
      this.metrics.updateQueueSize('email-queue', 'failed', failed);
    }, 10000);
  }
}

// Track individual job processing
@Processor('email')
export class EmailProcessor {
  constructor(private readonly metrics: PrometheusMetrics) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const start = Date.now();

    try {
      await this.sendEmail(job.data);
      const duration = Date.now() - start;

      this.metrics.trackQueueJob(
        'email-queue',
        'send-email',
        duration,
        true
      );
    } catch (error) {
      const duration = Date.now() - start;

      this.metrics.trackQueueJob(
        'email-queue',
        'send-email',
        duration,
        false,
        error.name
      );

      throw error;
    }
  }
}
```

## Best Practices

### 1. Correlation IDs
Always propagate correlation IDs across service calls:

```typescript
async callExternalService(data: any) {
  const correlationId = this.logger.getContext()?.correlationId;

  const response = await this.httpService.post(url, data, {
    headers: {
      'X-Correlation-ID': correlationId,
    },
  }).toPromise();

  return response.data;
}
```

### 2. Meaningful Metric Names
Use descriptive names following Prometheus conventions:

- `{service}_operation_duration_seconds`
- `{service}_operation_total`
- `{service}_error_total`

### 3. Proper Log Levels
- `ERROR`: Requires immediate attention
- `WARN`: Potential problem
- `INFO`: Important business events
- `DEBUG`: Detailed debugging info

### 4. Structure Your Logs
Always include relevant context:

```typescript
logger.info('Order created', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  paymentMethod: payment.method,
});
```

### 5. Don't Over-Instrument
Only track metrics that provide actionable insights.

## Troubleshooting

### Metrics Not Appearing

1. Check `/metrics` endpoint returns data
2. Verify Prometheus is scraping: http://localhost:9090/targets
3. Check for metric naming conflicts
4. Verify labels are correct

### Logs Not Structured

1. Ensure using the shared logger, not console.log
2. Check log format in environment is set to JSON for production
3. Verify correlation ID middleware is installed

### Health Checks Failing

1. Test endpoint manually: `curl http://localhost:3000/health/ready`
2. Check service dependencies (DB, Redis) are accessible
3. Review service logs for connection errors
4. Verify timeout settings aren't too aggressive

## Next Steps

1. Create custom dashboards for your service
2. Set up service-specific alerts
3. Configure log aggregation (ELK/Loki)
4. Set up distributed tracing (Jaeger)
5. Document your runbook procedures

## Resources

- Main README: [infrastructure/monitoring/README.md](./README.md)
- Alert Rules: [infrastructure/monitoring/alerts/](./alerts/)
- Dashboards: [infrastructure/monitoring/dashboards/](./dashboards/)
- Shared Package: [packages/shared/](../../packages/shared/)
