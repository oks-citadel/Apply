import { Request, Response, NextFunction } from 'express';
import * as promClient from 'prom-client';

export interface MetricsConfig {
  serviceName: string;
  environment: string;
  version?: string;
  enableDefaultMetrics?: boolean;
  prefix?: string;
}

/**
 * Prometheus metrics collector for microservices
 */
export class PrometheusMetrics {
  private config: MetricsConfig;
  private register: promClient.Registry;

  // HTTP Metrics
  public httpRequestDuration: promClient.Histogram;
  public httpRequestTotal: promClient.Counter;
  public httpRequestErrorTotal: promClient.Counter;
  public httpRequestInFlight: promClient.Gauge;

  // Business Metrics
  public operationDuration: promClient.Histogram;
  public operationTotal: promClient.Counter;
  public operationErrorTotal: promClient.Counter;

  // Queue Metrics
  public queueSize: promClient.Gauge;
  public queueProcessingDuration: promClient.Histogram;
  public queueJobTotal: promClient.Counter;
  public queueJobErrorTotal: promClient.Counter;

  // Database Metrics
  public dbQueryDuration: promClient.Histogram;
  public dbConnectionPoolSize: promClient.Gauge;
  public dbConnectionPoolActive: promClient.Gauge;
  public dbConnectionPoolIdle: promClient.Gauge;

  // Cache Metrics
  public cacheHitTotal: promClient.Counter;
  public cacheMissTotal: promClient.Counter;
  public cacheOperationDuration: promClient.Histogram;

  // Custom Metrics
  private customGauges: Map<string, promClient.Gauge> = new Map();
  private customCounters: Map<string, promClient.Counter> = new Map();
  private customHistograms: Map<string, promClient.Histogram> = new Map();

  constructor(config: MetricsConfig) {
    this.config = config;
    this.register = new promClient.Registry();

    // Set default labels
    this.register.setDefaultLabels({
      service: config.serviceName,
      environment: config.environment,
      version: config.version || '1.0.0',
    });

    // Initialize default metrics
    if (config.enableDefaultMetrics !== false) {
      promClient.collectDefaultMetrics({ register: this.register });
    }

    // Initialize custom metrics
    this.initializeHttpMetrics();
    this.initializeOperationMetrics();
    this.initializeQueueMetrics();
    this.initializeDatabaseMetrics();
    this.initializeCacheMetrics();
  }

  private initializeHttpMetrics(): void {
    const prefix = this.config.prefix || 'http';

    this.httpRequestDuration = new promClient.Histogram({
      name: `${prefix}_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: `${prefix}_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestErrorTotal = new promClient.Counter({
      name: `${prefix}_request_errors_total`,
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'status_code', 'error_type'],
      registers: [this.register],
    });

    this.httpRequestInFlight = new promClient.Gauge({
      name: `${prefix}_requests_in_flight`,
      help: 'Number of HTTP requests currently being processed',
      labelNames: ['method', 'route'],
      registers: [this.register],
    });
  }

  private initializeOperationMetrics(): void {
    this.operationDuration = new promClient.Histogram({
      name: 'operation_duration_seconds',
      help: 'Duration of business operations in seconds',
      labelNames: ['operation_name', 'operation_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register],
    });

    this.operationTotal = new promClient.Counter({
      name: 'operations_total',
      help: 'Total number of business operations',
      labelNames: ['operation_name', 'operation_type', 'status'],
      registers: [this.register],
    });

    this.operationErrorTotal = new promClient.Counter({
      name: 'operation_errors_total',
      help: 'Total number of operation errors',
      labelNames: ['operation_name', 'operation_type', 'error_type'],
      registers: [this.register],
    });
  }

  private initializeQueueMetrics(): void {
    this.queueSize = new promClient.Gauge({
      name: 'queue_size',
      help: 'Current size of the queue',
      labelNames: ['queue_name', 'status'],
      registers: [this.register],
    });

    this.queueProcessingDuration = new promClient.Histogram({
      name: 'queue_job_processing_duration_seconds',
      help: 'Duration of queue job processing in seconds',
      labelNames: ['queue_name', 'job_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
      registers: [this.register],
    });

    this.queueJobTotal = new promClient.Counter({
      name: 'queue_jobs_total',
      help: 'Total number of queue jobs processed',
      labelNames: ['queue_name', 'job_type', 'status'],
      registers: [this.register],
    });

    this.queueJobErrorTotal = new promClient.Counter({
      name: 'queue_job_errors_total',
      help: 'Total number of queue job errors',
      labelNames: ['queue_name', 'job_type', 'error_type'],
      registers: [this.register],
    });
  }

  private initializeDatabaseMetrics(): void {
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.dbConnectionPoolSize = new promClient.Gauge({
      name: 'db_connection_pool_size',
      help: 'Total size of database connection pool',
      registers: [this.register],
    });

    this.dbConnectionPoolActive = new promClient.Gauge({
      name: 'db_connection_pool_active',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    this.dbConnectionPoolIdle = new promClient.Gauge({
      name: 'db_connection_pool_idle',
      help: 'Number of idle database connections',
      registers: [this.register],
    });
  }

  private initializeCacheMetrics(): void {
    this.cacheHitTotal = new promClient.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_name', 'key_prefix'],
      registers: [this.register],
    });

    this.cacheMissTotal = new promClient.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_name', 'key_prefix'],
      registers: [this.register],
    });

    this.cacheOperationDuration = new promClient.Histogram({
      name: 'cache_operation_duration_seconds',
      help: 'Duration of cache operations in seconds',
      labelNames: ['cache_name', 'operation'],
      buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
      registers: [this.register],
    });
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    const labels = { method, route, status_code: statusCode.toString() };

    this.httpRequestDuration.observe(labels, duration / 1000);
    this.httpRequestTotal.inc(labels);

    if (statusCode >= 400) {
      this.httpRequestErrorTotal.inc({
        ...labels,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }
  }

  /**
   * Middleware to automatically track HTTP metrics
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();
      const route = req.route?.path || req.path || 'unknown';
      const method = req.method;

      // Track in-flight requests
      this.httpRequestInFlight.inc({ method, route });

      res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        this.recordHttpRequest(method, route, statusCode, duration);
        this.httpRequestInFlight.dec({ method, route });
      });

      next();
    };
  }

  /**
   * Track operation metrics
   */
  trackOperation(
    operationName: string,
    operationType: string,
    durationMs: number,
    success: boolean,
    errorType?: string
  ): void {
    const labels = { operation_name: operationName, operation_type: operationType };

    this.operationDuration.observe(labels, durationMs / 1000);
    this.operationTotal.inc({
      ...labels,
      status: success ? 'success' : 'failed',
    });

    if (!success && errorType) {
      this.operationErrorTotal.inc({
        ...labels,
        error_type: errorType,
      });
    }
  }

  /**
   * Update queue metrics
   */
  updateQueueSize(queueName: string, status: string, size: number): void {
    this.queueSize.set({ queue_name: queueName, status }, size);
  }

  /**
   * Track queue job processing
   */
  trackQueueJob(
    queueName: string,
    jobType: string,
    durationMs: number,
    success: boolean,
    errorType?: string
  ): void {
    const labels = { queue_name: queueName, job_type: jobType };

    this.queueProcessingDuration.observe(labels, durationMs / 1000);
    this.queueJobTotal.inc({
      ...labels,
      status: success ? 'completed' : 'failed',
    });

    if (!success && errorType) {
      this.queueJobErrorTotal.inc({
        ...labels,
        error_type: errorType,
      });
    }
  }

  /**
   * Track database query
   */
  trackDatabaseQuery(queryType: string, table: string, durationMs: number): void {
    this.dbQueryDuration.observe(
      { query_type: queryType, table },
      durationMs / 1000
    );
  }

  /**
   * Update database connection pool metrics
   */
  updateDbConnectionPool(total: number, active: number, idle: number): void {
    this.dbConnectionPoolSize.set(total);
    this.dbConnectionPoolActive.set(active);
    this.dbConnectionPoolIdle.set(idle);
  }

  /**
   * Track cache operations
   */
  recordCacheHit(cacheName: string, keyPrefix: string = 'default'): void {
    this.cacheHitTotal.inc({ cache_name: cacheName, key_prefix: keyPrefix });
  }

  recordCacheMiss(cacheName: string, keyPrefix: string = 'default'): void {
    this.cacheMissTotal.inc({ cache_name: cacheName, key_prefix: keyPrefix });
  }

  trackCacheOperation(
    cacheName: string,
    operation: string,
    durationMs: number
  ): void {
    this.cacheOperationDuration.observe(
      { cache_name: cacheName, operation },
      durationMs / 1000
    );
  }

  /**
   * Create custom gauge metric
   */
  createGauge(name: string, help: string, labelNames?: string[]): promClient.Gauge {
    const gauge = new promClient.Gauge({
      name,
      help,
      labelNames: labelNames || [],
      registers: [this.register],
    });
    this.customGauges.set(name, gauge);
    return gauge;
  }

  /**
   * Create custom counter metric
   */
  createCounter(name: string, help: string, labelNames?: string[]): promClient.Counter {
    const counter = new promClient.Counter({
      name,
      help,
      labelNames: labelNames || [],
      registers: [this.register],
    });
    this.customCounters.set(name, counter);
    return counter;
  }

  /**
   * Create custom histogram metric
   */
  createHistogram(
    name: string,
    help: string,
    labelNames?: string[],
    buckets?: number[]
  ): promClient.Histogram {
    const histogram = new promClient.Histogram({
      name,
      help,
      labelNames: labelNames || [],
      buckets: buckets || [0.001, 0.01, 0.1, 1, 10],
      registers: [this.register],
    });
    this.customHistograms.set(name, histogram);
    return histogram;
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsJSON(): Promise<any> {
    return this.register.getMetricsAsJSON();
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.register.resetMetrics();
  }

  /**
   * Get the registry
   */
  getRegistry(): promClient.Registry {
    return this.register;
  }
}

/**
 * Create a Prometheus metrics instance
 */
export function createPrometheusMetrics(config: MetricsConfig): PrometheusMetrics {
  return new PrometheusMetrics(config);
}
