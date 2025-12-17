import { Counter, Gauge, Histogram, Summary, register, Registry } from 'prom-client';
export interface MetricsConfig {
    serviceName: string;
    defaultLabels?: Record<string, string>;
    enableDefaultMetrics?: boolean;
}
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
    createCounter(name: string, help: string, labelNames?: string[]): Counter<string>;
    createGauge(name: string, help: string, labelNames?: string[]): Gauge<string>;
    createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string>;
    createSummary(name: string, help: string, labelNames?: string[], percentiles?: number[]): Summary<string>;
    getMetrics(): Promise<string>;
    getRegistry(): Registry;
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void;
    recordDatabaseQuery(operation: string, table: string, duration: number): void;
    recordCacheHit(cacheName: string): void;
    recordCacheMiss(cacheName: string): void;
    recordQueueJob(queueName: string, status: 'completed' | 'failed', duration: number): void;
    incrementActiveConnections(): void;
    decrementActiveConnections(): void;
}
export declare function createMetricsService(config: MetricsConfig): MetricsService;
export declare function Measure(metricName?: string): MethodDecorator;
export { register };
