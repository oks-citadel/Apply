"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusMetricsService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const client = tslib_1.__importStar(require("prom-client"));
/**
 * Prometheus Metrics Service
 * Provides custom business metrics and default system metrics
 */
let PrometheusMetricsService = class PrometheusMetricsService {
    constructor() {
        this.registry = new client.Registry();
        // Add default metrics (CPU, memory, etc.)
        client.collectDefaultMetrics({
            register: this.registry,
            prefix: 'nodejs_',
            labels: { service: process.env.SERVICE_NAME || 'unknown' },
        });
        this.initializeMetrics();
    }
    async onModuleInit() {
        // Any initialization logic
    }
    initializeMetrics() {
        // Business Metrics
        this.jobApplicationsTotal = new client.Counter({
            name: 'job_applications_total',
            help: 'Total number of job applications',
            labelNames: ['status', 'service'],
            registers: [this.registry],
        });
        this.resumeGenerationTotal = new client.Counter({
            name: 'resume_generation_total',
            help: 'Total number of resume generations',
            labelNames: ['status', 'service'],
            registers: [this.registry],
        });
        this.aiServiceRateLimited = new client.Counter({
            name: 'ai_service_rate_limited_total',
            help: 'Total number of rate-limited AI service requests',
            labelNames: ['service'],
            registers: [this.registry],
        });
        this.paymentTransactionsTotal = new client.Counter({
            name: 'payment_transactions_total',
            help: 'Total number of payment transactions',
            labelNames: ['status', 'service'],
            registers: [this.registry],
        });
        this.userChurnTotal = new client.Counter({
            name: 'user_churn_total',
            help: 'Total number of churned users',
            labelNames: ['service'],
            registers: [this.registry],
        });
        this.userActiveTotal = new client.Gauge({
            name: 'user_active_total',
            help: 'Total number of active users',
            labelNames: ['service'],
            registers: [this.registry],
        });
        this.apiQuotaExhausted = new client.Counter({
            name: 'api_quota_exhausted_total',
            help: 'Total number of API quota exhaustion events',
            labelNames: ['service', 'user_tier'],
            registers: [this.registry],
        });
        this.jobSearchDuration = new client.Histogram({
            name: 'job_search_duration_seconds',
            help: 'Duration of job search requests in seconds',
            labelNames: ['service'],
            buckets: [0.1, 0.5, 1, 2, 3, 5, 10],
            registers: [this.registry],
        });
        // Database Metrics
        this.dbConnectionPoolSize = new client.Gauge({
            name: 'db_connection_pool_size',
            help: 'Database connection pool size',
            labelNames: ['database', 'service'],
            registers: [this.registry],
        });
        this.dbConnectionPoolUsed = new client.Gauge({
            name: 'db_connection_pool_used',
            help: 'Database connections currently in use',
            labelNames: ['database', 'service'],
            registers: [this.registry],
        });
        this.dbQueryDuration = new client.Histogram({
            name: 'db_query_duration_seconds',
            help: 'Duration of database queries in seconds',
            labelNames: ['operation', 'table', 'service'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
            registers: [this.registry],
        });
        this.dbQueriesTotal = new client.Counter({
            name: 'db_queries_total',
            help: 'Total number of database queries',
            labelNames: ['operation', 'table', 'status', 'service'],
            registers: [this.registry],
        });
        // Queue Metrics
        this.bullQueueWaiting = new client.Gauge({
            name: 'bull_queue_waiting',
            help: 'Number of jobs waiting in Bull queue',
            labelNames: ['queue', 'service'],
            registers: [this.registry],
        });
        this.bullQueueActive = new client.Gauge({
            name: 'bull_queue_active',
            help: 'Number of jobs actively processing in Bull queue',
            labelNames: ['queue', 'service'],
            registers: [this.registry],
        });
        this.bullQueueDelayed = new client.Gauge({
            name: 'bull_queue_delayed',
            help: 'Number of delayed jobs in Bull queue',
            labelNames: ['queue', 'service'],
            registers: [this.registry],
        });
        this.bullQueueCompleted = new client.Counter({
            name: 'bull_queue_completed_total',
            help: 'Total number of completed jobs in Bull queue',
            labelNames: ['queue', 'service'],
            registers: [this.registry],
        });
        this.bullQueueFailed = new client.Counter({
            name: 'bull_queue_failed_total',
            help: 'Total number of failed jobs in Bull queue',
            labelNames: ['queue', 'service'],
            registers: [this.registry],
        });
        this.bullQueueJobDuration = new client.Histogram({
            name: 'bull_queue_job_duration_seconds',
            help: 'Duration of Bull queue job processing in seconds',
            labelNames: ['queue', 'job_name', 'service'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
            registers: [this.registry],
        });
        // Cache Metrics
        this.cacheHitsTotal = new client.Counter({
            name: 'cache_hits_total',
            help: 'Total number of cache hits',
            labelNames: ['cache_name', 'service'],
            registers: [this.registry],
        });
        this.cacheMissesTotal = new client.Counter({
            name: 'cache_misses_total',
            help: 'Total number of cache misses',
            labelNames: ['cache_name', 'service'],
            registers: [this.registry],
        });
    }
    // Business Metric Methods
    incrementJobApplications(status) {
        this.jobApplicationsTotal.inc({
            status,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    incrementResumeGeneration(status) {
        this.resumeGenerationTotal.inc({
            status,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    incrementAIRateLimited() {
        this.aiServiceRateLimited.inc({
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    incrementPaymentTransaction(status) {
        this.paymentTransactionsTotal.inc({
            status,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    incrementUserChurn() {
        this.userChurnTotal.inc({
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    setActiveUsers(count) {
        this.userActiveTotal.set({ service: process.env.SERVICE_NAME || 'unknown' }, count);
    }
    incrementAPIQuotaExhausted(userTier) {
        this.apiQuotaExhausted.inc({
            service: process.env.SERVICE_NAME || 'unknown',
            user_tier: userTier,
        });
    }
    observeJobSearchDuration(durationSeconds) {
        this.jobSearchDuration.observe({ service: process.env.SERVICE_NAME || 'unknown' }, durationSeconds);
    }
    // Database Metric Methods
    setDBConnectionPoolSize(database, size) {
        this.dbConnectionPoolSize.set({ database, service: process.env.SERVICE_NAME || 'unknown' }, size);
    }
    setDBConnectionPoolUsed(database, used) {
        this.dbConnectionPoolUsed.set({ database, service: process.env.SERVICE_NAME || 'unknown' }, used);
    }
    observeDBQueryDuration(operation, table, durationSeconds) {
        this.dbQueryDuration.observe({ operation, table, service: process.env.SERVICE_NAME || 'unknown' }, durationSeconds);
    }
    incrementDBQueries(operation, table, status) {
        this.dbQueriesTotal.inc({
            operation,
            table,
            status,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    // Queue Metric Methods
    setBullQueueWaiting(queue, count) {
        this.bullQueueWaiting.set({ queue, service: process.env.SERVICE_NAME || 'unknown' }, count);
    }
    setBullQueueActive(queue, count) {
        this.bullQueueActive.set({ queue, service: process.env.SERVICE_NAME || 'unknown' }, count);
    }
    setBullQueueDelayed(queue, count) {
        this.bullQueueDelayed.set({ queue, service: process.env.SERVICE_NAME || 'unknown' }, count);
    }
    incrementBullQueueCompleted(queue) {
        this.bullQueueCompleted.inc({
            queue,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    incrementBullQueueFailed(queue) {
        this.bullQueueFailed.inc({
            queue,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    observeBullQueueJobDuration(queue, jobName, durationSeconds) {
        this.bullQueueJobDuration.observe({ queue, job_name: jobName, service: process.env.SERVICE_NAME || 'unknown' }, durationSeconds);
    }
    // Cache Metric Methods
    incrementCacheHit(cacheName) {
        this.cacheHitsTotal.inc({
            cache_name: cacheName,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    incrementCacheMiss(cacheName) {
        this.cacheMissesTotal.inc({
            cache_name: cacheName,
            service: process.env.SERVICE_NAME || 'unknown',
        });
    }
    // Get metrics for /metrics endpoint
    getMetrics() {
        return this.registry.metrics();
    }
    getRegistry() {
        return this.registry;
    }
};
exports.PrometheusMetricsService = PrometheusMetricsService;
exports.PrometheusMetricsService = PrometheusMetricsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], PrometheusMetricsService);
//# sourceMappingURL=prometheus-metrics.service.js.map