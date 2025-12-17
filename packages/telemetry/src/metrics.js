"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.MetricsService = void 0;
exports.createMetricsService = createMetricsService;
exports.Measure = Measure;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return prom_client_1.register; } });
let MetricsService = class MetricsService {
    constructor(config) {
        this.registry = new prom_client_1.Registry();
        this.serviceName = config.serviceName;
        if (config.defaultLabels) {
            this.registry.setDefaultLabels(config.defaultLabels);
        }
        if (config.enableDefaultMetrics !== false) {
            (0, prom_client_1.collectDefaultMetrics)({
                register: this.registry,
                prefix: `${this.serviceName}_`,
            });
        }
        this.initializeMetrics();
    }
    initializeMetrics() {
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: `${this.serviceName}_http_request_duration_seconds`,
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry],
        });
        this.httpRequestTotal = new prom_client_1.Counter({
            name: `${this.serviceName}_http_requests_total`,
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });
        this.httpRequestErrors = new prom_client_1.Counter({
            name: `${this.serviceName}_http_request_errors_total`,
            help: 'Total number of HTTP request errors',
            labelNames: ['method', 'route', 'error_type'],
            registers: [this.registry],
        });
        this.activeConnections = new prom_client_1.Gauge({
            name: `${this.serviceName}_active_connections`,
            help: 'Number of active connections',
            registers: [this.registry],
        });
        this.databaseQueryDuration = new prom_client_1.Histogram({
            name: `${this.serviceName}_database_query_duration_seconds`,
            help: 'Duration of database queries in seconds',
            labelNames: ['operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
            registers: [this.registry],
        });
        this.cacheHits = new prom_client_1.Counter({
            name: `${this.serviceName}_cache_hits_total`,
            help: 'Total number of cache hits',
            labelNames: ['cache_name'],
            registers: [this.registry],
        });
        this.cacheMisses = new prom_client_1.Counter({
            name: `${this.serviceName}_cache_misses_total`,
            help: 'Total number of cache misses',
            labelNames: ['cache_name'],
            registers: [this.registry],
        });
        this.queueJobsTotal = new prom_client_1.Counter({
            name: `${this.serviceName}_queue_jobs_total`,
            help: 'Total number of queue jobs processed',
            labelNames: ['queue_name', 'status'],
            registers: [this.registry],
        });
        this.queueJobDuration = new prom_client_1.Histogram({
            name: `${this.serviceName}_queue_job_duration_seconds`,
            help: 'Duration of queue job processing in seconds',
            labelNames: ['queue_name'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
            registers: [this.registry],
        });
    }
    createCounter(name, help, labelNames = []) {
        return new prom_client_1.Counter({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames,
            registers: [this.registry],
        });
    }
    createGauge(name, help, labelNames = []) {
        return new prom_client_1.Gauge({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames,
            registers: [this.registry],
        });
    }
    createHistogram(name, help, labelNames = [], buckets) {
        return new prom_client_1.Histogram({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames,
            buckets,
            registers: [this.registry],
        });
    }
    createSummary(name, help, labelNames = [], percentiles) {
        return new prom_client_1.Summary({
            name: `${this.serviceName}_${name}`,
            help,
            labelNames,
            percentiles,
            registers: [this.registry],
        });
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    getRegistry() {
        return this.registry;
    }
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
        this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
        if (statusCode >= 400) {
            const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
            this.httpRequestErrors.inc({ method, route, error_type: errorType });
        }
    }
    recordDatabaseQuery(operation, table, duration) {
        this.databaseQueryDuration.observe({ operation, table }, duration);
    }
    recordCacheHit(cacheName) {
        this.cacheHits.inc({ cache_name: cacheName });
    }
    recordCacheMiss(cacheName) {
        this.cacheMisses.inc({ cache_name: cacheName });
    }
    recordQueueJob(queueName, status, duration) {
        this.queueJobsTotal.inc({ queue_name: queueName, status });
        this.queueJobDuration.observe({ queue_name: queueName }, duration);
    }
    incrementActiveConnections() {
        this.activeConnections.inc();
    }
    decrementActiveConnections() {
        this.activeConnections.dec();
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], MetricsService);
function createMetricsService(config) {
    return new MetricsService(config);
}
function Measure(metricName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const startTime = Date.now();
            try {
                const result = await originalMethod.apply(this, args);
                const duration = (Date.now() - startTime) / 1000;
                if (this.metricsService) {
                    const name = metricName || `${target.constructor.name}_${String(propertyKey)}_duration`;
                    this.metricsService
                        .createHistogram(name, `Duration of ${String(propertyKey)} method`)
                        .observe(duration);
                }
                return result;
            }
            catch (error) {
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