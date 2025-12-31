import { OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';
/**
 * Prometheus Metrics Service
 * Provides custom business metrics and default system metrics
 */
export declare class PrometheusMetricsService implements OnModuleInit {
    private registry;
    private jobApplicationsTotal;
    private resumeGenerationTotal;
    private aiServiceRateLimited;
    private paymentTransactionsTotal;
    private userChurnTotal;
    private userActiveTotal;
    private apiQuotaExhausted;
    private jobSearchDuration;
    private dbConnectionPoolSize;
    private dbConnectionPoolUsed;
    private dbQueryDuration;
    private dbQueriesTotal;
    private bullQueueWaiting;
    private bullQueueActive;
    private bullQueueDelayed;
    private bullQueueCompleted;
    private bullQueueFailed;
    private bullQueueJobDuration;
    private cacheHitsTotal;
    private cacheMissesTotal;
    constructor();
    onModuleInit(): Promise<void>;
    private initializeMetrics;
    incrementJobApplications(status: 'success' | 'failed'): void;
    incrementResumeGeneration(status: 'success' | 'failed'): void;
    incrementAIRateLimited(): void;
    incrementPaymentTransaction(status: 'success' | 'failed'): void;
    incrementUserChurn(): void;
    setActiveUsers(count: number): void;
    incrementAPIQuotaExhausted(userTier: string): void;
    observeJobSearchDuration(durationSeconds: number): void;
    setDBConnectionPoolSize(database: string, size: number): void;
    setDBConnectionPoolUsed(database: string, used: number): void;
    observeDBQueryDuration(operation: string, table: string, durationSeconds: number): void;
    incrementDBQueries(operation: string, table: string, status: string): void;
    setBullQueueWaiting(queue: string, count: number): void;
    setBullQueueActive(queue: string, count: number): void;
    setBullQueueDelayed(queue: string, count: number): void;
    incrementBullQueueCompleted(queue: string): void;
    incrementBullQueueFailed(queue: string): void;
    observeBullQueueJobDuration(queue: string, jobName: string, durationSeconds: number): void;
    incrementCacheHit(cacheName: string): void;
    incrementCacheMiss(cacheName: string): void;
    getMetrics(): Promise<string>;
    getRegistry(): client.Registry;
}
//# sourceMappingURL=prometheus-metrics.service.d.ts.map