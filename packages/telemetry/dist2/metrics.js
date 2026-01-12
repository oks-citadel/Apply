"use strict";
/**
 * Prometheus metrics utilities for NestJS services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.MetricsService = void 0;
exports.createMetricsService = createMetricsService;
exports.Measure = Measure;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return prom_client_1.register; } });
/**
 * Metrics service for Prometheus integration
 */
let MetricsService = class MetricsService {
    constructor(config) {
        this.registry = new prom_client_1.Registry();
        // Sanitize service name for Prometheus (replace hyphens with underscores)
        this.serviceName = config.serviceName.replace(/-/g, '_');
        // Set default labels
        if (config.defaultLabels) {
            this.registry.setDefaultLabels(config.defaultLabels);
        }
        // Enable default metrics (CPU, memory, etc.)
        if (config.enableDefaultMetrics !== false) {
            (0, prom_client_1.collectDefaultMetrics)({
                register: this.registry,
                prefix: `${this.serviceName}_`,
            });
        }
        // Initialize standard metrics
        this.initializeMetrics();
    }
    initializeMetrics() {
        // HTTP request duration
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: `${this.serviceName}_http_request_duration_seconds`,
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry],
        });
        // HTTP request total
        this.httpRequestTotal = new prom_client_1.Counter({
            name: `${this.serviceName}_http_requests_total`,
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });
        // HTTP request errors
        this.httpRequestErrors = new prom_client_1.Counter({
            name: `${this.serviceName}_http_request_errors_total`,
            help: 'Total number of HTTP request errors',
            labelNames: ['method', 'route', 'error_type'],
            registers: [this.registry],
        });
        // Active connections
        this.activeConnections = new prom_client_1.Gauge({
            name: `${this.serviceName}_active_connections`,
            help: 'Number of active connections',
            registers: [this.registry],
        });
        // Database query duration
        this.databaseQueryDuration = new prom_client_1.Histogram({
            name: `${this.serviceName}_database_query_duration_seconds`,
            help: 'Duration of database queries in seconds',
            labelNames: ['operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
            registers: [this.registry],
        });
        // Cache hits
        this.cacheHits = new prom_client_1.Counter({
            name: `${this.serviceName}_cache_hits_total`,
            help: 'Total number of cache hits',
            labelNames: ['cache_name'],
            registers: [this.registry],
        });
        // Cache misses
        this.cacheMisses = new prom_client_1.Counter({
            name: `${this.serviceName}_cache_misses_total`,
            help: 'Total number of cache misses',
            labelNames: ['cache_name'],
            registers: [this.registry],
        });
        // Queue jobs total
        this.queueJobsTotal = new prom_client_1.Counter({
            name: `${this.serviceName}_queue_jobs_total`,
            help: 'Total number of queue jobs processed',
            labelNames: ['queue_name', 'status'],
            registers: [this.registry],
        });
        // Queue job duration
        this.queueJobDuration = new prom_client_1.Histogram({
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
    createCounter(name, help, labelNames = []) {
        return new prom_client_1.Counter({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames,
            registers: [this.registry],
        });
    }
    /**
     * Create a custom gauge metric
     */
    createGauge(name, help, labelNames = []) {
        return new prom_client_1.Gauge({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames,
            registers: [this.registry],
        });
    }
    /**
     * Create a custom histogram metric
     */
    createHistogram(name, help, labelNames = [], buckets) {
        return new prom_client_1.Histogram({
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
    createSummary(name, help, labelNames = [], percentiles) {
        return new prom_client_1.Summary({
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
    async getMetrics() {
        return this.registry.metrics();
    }
    /**
     * Get registry instance
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * Record HTTP request metrics
     */
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
        this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
        if (statusCode >= 400) {
            const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
            this.httpRequestErrors.inc({ method, route, error_type: errorType });
        }
    }
    /**
     * Record database query metrics
     */
    recordDatabaseQuery(operation, table, duration) {
        this.databaseQueryDuration.observe({ operation, table }, duration);
    }
    /**
     * Record cache hit
     */
    recordCacheHit(cacheName) {
        this.cacheHits.inc({ cache_name: cacheName });
    }
    /**
     * Record cache miss
     */
    recordCacheMiss(cacheName) {
        this.cacheMisses.inc({ cache_name: cacheName });
    }
    /**
     * Record queue job
     */
    recordQueueJob(queueName, status, duration) {
        this.queueJobsTotal.inc({ queue_name: queueName, status });
        this.queueJobDuration.observe({ queue_name: queueName }, duration);
    }
    /**
     * Increment active connections
     */
    incrementActiveConnections() {
        this.activeConnections.inc();
    }
    /**
     * Decrement active connections
     */
    decrementActiveConnections() {
        this.activeConnections.dec();
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [Object])
], MetricsService);
/**
 * Create metrics service instance
 */
function createMetricsService(config) {
    return new MetricsService(config);
}
/**
 * Decorator for measuring method execution time
 */
function Measure(metricName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
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
            }
            catch (error) {
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
//# sourceMappingURL=metrics.js.map