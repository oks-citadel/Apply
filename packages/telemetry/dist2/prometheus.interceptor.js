"use strict";
var PrometheusInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusInterceptor = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const client = tslib_1.__importStar(require("prom-client"));
/**
 * Prometheus Metrics Interceptor
 * Automatically collects HTTP metrics for all endpoints
 */
let PrometheusInterceptor = PrometheusInterceptor_1 = class PrometheusInterceptor {
    constructor() {
        // Initialize metrics only once
        if (!PrometheusInterceptor_1.httpRequestDuration) {
            this.initializeMetrics();
        }
    }
    initializeMetrics() {
        // HTTP request duration histogram
        PrometheusInterceptor_1.httpRequestDuration = new client.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status', 'service'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        });
        // HTTP requests total counter
        PrometheusInterceptor_1.httpRequestsTotal = new client.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status', 'service'],
        });
        // HTTP requests in flight gauge
        PrometheusInterceptor_1.httpRequestsInFlight = new client.Gauge({
            name: 'http_requests_in_flight',
            help: 'Number of HTTP requests currently being processed',
            labelNames: ['method', 'route', 'service'],
        });
        // HTTP request size histogram
        PrometheusInterceptor_1.httpRequestSize = new client.Histogram({
            name: 'http_request_size_bytes',
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route', 'service'],
            buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
        });
        // HTTP response size histogram
        PrometheusInterceptor_1.httpResponseSize = new client.Histogram({
            name: 'http_response_size_bytes',
            help: 'Size of HTTP responses in bytes',
            labelNames: ['method', 'route', 'status', 'service'],
            buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
        });
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const method = request.method;
        const route = this.getRoute(context);
        const service = process.env.SERVICE_NAME || 'unknown';
        // Start timer
        const startTime = Date.now();
        // Increment in-flight requests
        PrometheusInterceptor_1.httpRequestsInFlight.inc({
            method,
            route,
            service,
        });
        // Record request size
        const requestSize = this.getRequestSize(request);
        if (requestSize > 0) {
            PrometheusInterceptor_1.httpRequestSize.observe({ method, route, service }, requestSize);
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                this.recordMetrics(method, route, response.statusCode, service, startTime, data);
            },
            error: (error) => {
                const status = error.status || error.statusCode || 500;
                this.recordMetrics(method, route, status, service, startTime, null);
            },
            finalize: () => {
                // Decrement in-flight requests
                PrometheusInterceptor_1.httpRequestsInFlight.dec({
                    method,
                    route,
                    service,
                });
            },
        }));
    }
    recordMetrics(method, route, status, service, startTime, responseData) {
        const duration = (Date.now() - startTime) / 1000; // Convert to seconds
        // Record duration
        PrometheusInterceptor_1.httpRequestDuration.observe({ method, route, status: status.toString(), service }, duration);
        // Increment request counter
        PrometheusInterceptor_1.httpRequestsTotal.inc({
            method,
            route,
            status: status.toString(),
            service,
        });
        // Record response size
        const responseSize = this.getResponseSize(responseData);
        if (responseSize > 0) {
            PrometheusInterceptor_1.httpResponseSize.observe({ method, route, status: status.toString(), service }, responseSize);
        }
    }
    getRoute(context) {
        const handler = context.getHandler();
        const controller = context.getClass();
        // Try to get route from metadata
        const controllerPath = Reflect.getMetadata('path', controller) || '';
        const handlerPath = Reflect.getMetadata('path', handler) || '';
        return controllerPath + handlerPath || 'unknown';
    }
    getRequestSize(request) {
        const contentLength = request.headers['content-length'];
        if (contentLength) {
            return parseInt(contentLength, 10);
        }
        // Estimate from body if available
        if (request.body) {
            return JSON.stringify(request.body).length;
        }
        return 0;
    }
    getResponseSize(data) {
        if (!data)
            return 0;
        if (typeof data === 'string') {
            return data.length;
        }
        if (typeof data === 'object') {
            return JSON.stringify(data).length;
        }
        return 0;
    }
};
exports.PrometheusInterceptor = PrometheusInterceptor;
exports.PrometheusInterceptor = PrometheusInterceptor = PrometheusInterceptor_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], PrometheusInterceptor);
//# sourceMappingURL=prometheus.interceptor.js.map