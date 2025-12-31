/**
 * Prometheus metrics utilities for NestJS services
 */
import { Counter, Gauge, Histogram, Summary, register, Registry } from 'prom-client';
export interface MetricsConfig {
    serviceName: string;
    defaultLabels?: Record<string, string>;
    enableDefaultMetrics?: boolean;
}
/**
 * Metrics service for Prometheus integration
 */
export declare class MetricsService {
    private registry;
    private serviceName;
    httpRequestDuration: Histogram<string>;
    httpRequestTotal: Counter<string>;
    httpRequestErrors: Counter<string>;
    activeConnections: Gauge<string>;
    databaseQueryDuration: Histogram<string>;
    cacheHits: Counter<string>;
    cacheMisses: Counter<string>;
    queueJobsTotal: Counter<string>;
    queueJobDuration: Histogram<string>;
    constructor(config: MetricsConfig);
    private initializeMetrics;
    /**
     * Create a custom counter metric
     */
    createCounter(name: string, help: string, labelNames?: string[]): Counter<string>;
    /**
     * Create a custom gauge metric
     */
    createGauge(name: string, help: string, labelNames?: string[]): Gauge<string>;
    /**
     * Create a custom histogram metric
     */
    createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string>;
    /**
     * Create a custom summary metric
     */
    createSummary(name: string, help: string, labelNames?: string[], percentiles?: number[]): Summary<string>;
    /**
     * Get metrics in Prometheus format
     */
    getMetrics(): Promise<string>;
    /**
     * Get registry instance
     */
    getRegistry(): Registry;
    /**
     * Record HTTP request metrics
     */
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void;
    /**
     * Record database query metrics
     */
    recordDatabaseQuery(operation: string, table: string, duration: number): void;
    /**
     * Record cache hit
     */
    recordCacheHit(cacheName: string): void;
    /**
     * Record cache miss
     */
    recordCacheMiss(cacheName: string): void;
    /**
     * Record queue job
     */
    recordQueueJob(queueName: string, status: 'completed' | 'failed', duration: number): void;
    /**
     * Increment active connections
     */
    incrementActiveConnections(): void;
    /**
     * Decrement active connections
     */
    decrementActiveConnections(): void;
}
/**
 * Create metrics service instance
 */
export declare function createMetricsService(config: MetricsConfig): MetricsService;
/**
 * Decorator for measuring method execution time
 */
export declare function Measure(metricName?: string): MethodDecorator;
/**
 * Export metrics registry for global access
 */
export { register };
//# sourceMappingURL=metrics.d.ts.map