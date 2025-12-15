/**
 * Prometheus metrics utilities for NestJS services
 */

import { Injectable } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  Summary,
  register,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

export interface MetricsConfig {
  serviceName: string;
  defaultLabels?: Record<string, string>;
  enableDefaultMetrics?: boolean;
}

/**
 * Metrics service for Prometheus integration
 */
@Injectable()
export class MetricsService {
  private registry: Registry;
  private serviceName: string;

  // Standard metrics
  public httpRequestDuration: Histogram<string>;
  public httpRequestTotal: Counter<string>;
  public httpRequestErrors: Counter<string>;
  public activeConnections: Gauge<string>;
  public databaseQueryDuration: Histogram<string>;
  public cacheHits: Counter<string>;
  public cacheMisses: Counter<string>;
  public queueJobsTotal: Counter<string>;
  public queueJobDuration: Histogram<string>;

  constructor(config: MetricsConfig) {
    this.registry = new Registry();
    this.serviceName = config.serviceName;

    // Set default labels
    if (config.defaultLabels) {
      this.registry.setDefaultLabels(config.defaultLabels);
    }

    // Enable default metrics (CPU, memory, etc.)
    if (config.enableDefaultMetrics !== false) {
      collectDefaultMetrics({
        register: this.registry,
        prefix: `${this.serviceName}_`,
      });
    }

    // Initialize standard metrics
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // HTTP request duration
    this.httpRequestDuration = new Histogram({
      name: `${this.serviceName}_http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // HTTP request total
    this.httpRequestTotal = new Counter({
      name: `${this.serviceName}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // HTTP request errors
    this.httpRequestErrors = new Counter({
      name: `${this.serviceName}_http_request_errors_total`,
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: `${this.serviceName}_active_connections`,
      help: 'Number of active connections',
      registers: [this.registry],
    });

    // Database query duration
    this.databaseQueryDuration = new Histogram({
      name: `${this.serviceName}_database_query_duration_seconds`,
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.registry],
    });

    // Cache hits
    this.cacheHits = new Counter({
      name: `${this.serviceName}_cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    // Cache misses
    this.cacheMisses = new Counter({
      name: `${this.serviceName}_cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });

    // Queue jobs total
    this.queueJobsTotal = new Counter({
      name: `${this.serviceName}_queue_jobs_total`,
      help: 'Total number of queue jobs processed',
      labelNames: ['queue_name', 'status'],
      registers: [this.registry],
    });

    // Queue job duration
    this.queueJobDuration = new Histogram({
      name: `${this.serviceName}_queue_job_duration_seconds`,
      help: 'Duration of queue job processing in seconds',
      labelNames: ['queue_name'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });
  }

  /**
   * Create a custom counter metric
   */
  createCounter(name: string, help: string, labelNames: string[] = []): Counter<string> {
    return new Counter({
      name: `${this.serviceName}_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom gauge metric
   */
  createGauge(name: string, help: string, labelNames: string[] = []): Gauge<string> {
    return new Gauge({
      name: `${this.serviceName}_${name}`,
      help,
      labelNames,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom histogram metric
   */
  createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): Histogram<string> {
    return new Histogram({
      name: `${this.serviceName}_${name}`,
      help,
      labelNames,
      buckets,
      registers: [this.registry],
    });
  }

  /**
   * Create a custom summary metric
   */
  createSummary(
    name: string,
    help: string,
    labelNames: string[] = [],
    percentiles?: number[],
  ): Summary<string> {
    return new Summary({
      name: `${this.serviceName}_${name}`,
      help,
      labelNames,
      percentiles,
      registers: [this.registry],
    });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get registry instance
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration,
    );

    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      this.httpRequestErrors.inc({ method, route, error_type: errorType });
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.databaseQueryDuration.observe({ operation, table }, duration);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheName: string): void {
    this.cacheHits.inc({ cache_name: cacheName });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheName: string): void {
    this.cacheMisses.inc({ cache_name: cacheName });
  }

  /**
   * Record queue job
   */
  recordQueueJob(queueName: string, status: 'completed' | 'failed', duration: number): void {
    this.queueJobsTotal.inc({ queue_name: queueName, status });
    this.queueJobDuration.observe({ queue_name: queueName }, duration);
  }

  /**
   * Increment active connections
   */
  incrementActiveConnections(): void {
    this.activeConnections.inc();
  }

  /**
   * Decrement active connections
   */
  decrementActiveConnections(): void {
    this.activeConnections.dec();
  }
}

/**
 * Create metrics service instance
 */
export function createMetricsService(config: MetricsConfig): MetricsService {
  return new MetricsService(config);
}

/**
 * Decorator for measuring method execution time
 */
export function Measure(metricName?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = (Date.now() - startTime) / 1000;

        // Record metric if metrics service is available on the instance
        if (this.metricsService) {
          const name = metricName || `${target.constructor.name}_${String(propertyKey)}_duration`;
          this.metricsService
            .createHistogram(name, `Duration of ${String(propertyKey)} method`)
            .observe(duration);
        }

        return result;
      } catch (error) {
        // Record error metric if metrics service is available
        if (this.metricsService) {
          const name = metricName || `${target.constructor.name}_${String(propertyKey)}_errors`;
          this.metricsService.createCounter(name, `Errors in ${String(propertyKey)} method`).inc();
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Export metrics registry for global access
 */
export { register };
