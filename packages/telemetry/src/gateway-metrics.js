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
var GatewayMetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.GatewayMetricsService = void 0;
exports.createGatewayMetricsService = createGatewayMetricsService;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return prom_client_1.register; } });
let GatewayMetricsService = GatewayMetricsService_1 = class GatewayMetricsService {
    constructor(config) {
        this.logger = new common_1.Logger(GatewayMetricsService_1.name);
        this.registry = new prom_client_1.Registry();
        this.serviceName = config.serviceName;
        this.initializeMetrics();
    }
    initializeMetrics() {
        this.gatewayRateLimitDegraded = new prom_client_1.Counter({
            name: 'gateway_rate_limit_degraded_total',
            help: 'Total number of rate limit operations in degraded mode (Redis unavailable, fail-open active)',
            labelNames: ['service', 'route', 'reason'],
            registers: [this.registry],
        });
        this.gatewayRateLimitTotal = new prom_client_1.Counter({
            name: 'gateway_rate_limit_total',
            help: 'Total number of rate limit checks performed',
            labelNames: ['service', 'route', 'status'],
            registers: [this.registry],
        });
        this.gatewayRateLimitErrors = new prom_client_1.Counter({
            name: 'gateway_rate_limit_errors_total',
            help: 'Total number of rate limiting errors',
            labelNames: ['service', 'route', 'error_type'],
            registers: [this.registry],
        });
        this.redisLatency = new prom_client_1.Histogram({
            name: 'redis_operation_duration_seconds',
            help: 'Duration of Redis operations in seconds',
            labelNames: ['operation', 'service'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
            registers: [this.registry],
        });
        this.redisConnectionState = new prom_client_1.Gauge({
            name: 'redis_connection_state',
            help: 'Redis connection state (1 = connected, 0 = disconnected)',
            labelNames: ['service', 'host'],
            registers: [this.registry],
        });
        this.redisErrors = new prom_client_1.Counter({
            name: 'redis_errors_total',
            help: 'Total number of Redis errors',
            labelNames: ['service', 'operation', 'error_type'],
            registers: [this.registry],
        });
        this.redisOperations = new prom_client_1.Counter({
            name: 'redis_operations_total',
            help: 'Total number of Redis operations',
            labelNames: ['service', 'operation', 'status'],
            registers: [this.registry],
        });
        this.circuitBreakerState = new prom_client_1.Gauge({
            name: 'circuit_breaker_state',
            help: 'Circuit breaker state (0 = CLOSED, 1 = OPEN, 2 = HALF_OPEN)',
            labelNames: ['service', 'circuit_name'],
            registers: [this.registry],
        });
        this.circuitBreakerStateChanges = new prom_client_1.Counter({
            name: 'circuit_breaker_state_changes_total',
            help: 'Total number of circuit breaker state changes',
            labelNames: ['service', 'circuit_name', 'from_state', 'to_state'],
            registers: [this.registry],
        });
        this.circuitBreakerTrips = new prom_client_1.Counter({
            name: 'circuit_breaker_trips_total',
            help: 'Total number of times circuit breaker has tripped (opened)',
            labelNames: ['service', 'circuit_name', 'reason'],
            registers: [this.registry],
        });
        this.circuitBreakerFallbacks = new prom_client_1.Counter({
            name: 'circuit_breaker_fallbacks_total',
            help: 'Total number of circuit breaker fallback executions',
            labelNames: ['service', 'circuit_name'],
            registers: [this.registry],
        });
        this.httpRequestDurationByRoute = new prom_client_1.Histogram({
            name: 'http_request_duration_by_route_seconds',
            help: 'HTTP request duration in seconds by route',
            labelNames: ['method', 'route', 'status_code', 'service'],
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry],
        });
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'http_requests_by_route_total',
            help: 'Total number of HTTP requests by route',
            labelNames: ['method', 'route', 'status_code', 'service'],
            registers: [this.registry],
        });
    }
    recordRateLimitDegraded(route, reason = 'redis_unavailable') {
        this.gatewayRateLimitDegraded.inc({
            service: this.serviceName,
            route,
            reason,
        });
        this.logger.warn(`Rate limiting degraded for route ${route}: ${reason}`);
    }
    recordRateLimitCheck(route, status) {
        this.gatewayRateLimitTotal.inc({
            service: this.serviceName,
            route,
            status,
        });
    }
    recordRateLimitError(route, errorType) {
        this.gatewayRateLimitErrors.inc({
            service: this.serviceName,
            route,
            error_type: errorType,
        });
    }
    recordRedisLatency(operation, durationSeconds) {
        this.redisLatency.observe({ operation, service: this.serviceName }, durationSeconds);
    }
    setRedisConnectionState(host, connected) {
        this.redisConnectionState.set({ service: this.serviceName, host }, connected ? 1 : 0);
    }
    recordRedisError(operation, errorType) {
        this.redisErrors.inc({
            service: this.serviceName,
            operation,
            error_type: errorType,
        });
    }
    recordRedisOperation(operation, status) {
        this.redisOperations.inc({
            service: this.serviceName,
            operation,
            status,
        });
    }
    setCircuitBreakerState(circuitName, state) {
        const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
        this.circuitBreakerState.set({ service: this.serviceName, circuit_name: circuitName }, stateValue);
    }
    recordCircuitBreakerStateChange(circuitName, fromState, toState) {
        this.circuitBreakerStateChanges.inc({
            service: this.serviceName,
            circuit_name: circuitName,
            from_state: fromState,
            to_state: toState,
        });
        if (toState === 'OPEN') {
            this.recordCircuitBreakerTrip(circuitName, 'threshold_exceeded');
        }
    }
    recordCircuitBreakerTrip(circuitName, reason) {
        this.circuitBreakerTrips.inc({
            service: this.serviceName,
            circuit_name: circuitName,
            reason,
        });
        this.logger.warn(`Circuit breaker ${circuitName} tripped: ${reason}`);
    }
    recordCircuitBreakerFallback(circuitName) {
        this.circuitBreakerFallbacks.inc({
            service: this.serviceName,
            circuit_name: circuitName,
        });
    }
    recordHttpRequest(method, route, statusCode, durationSeconds) {
        this.httpRequestDurationByRoute.observe({
            method,
            route,
            status_code: statusCode.toString(),
            service: this.serviceName,
        }, durationSeconds);
        this.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode.toString(),
            service: this.serviceName,
        });
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    getRegistry() {
        return this.registry;
    }
    createRedisTimer(operation) {
        const start = Date.now();
        return {
            end: (success = true) => {
                const duration = (Date.now() - start) / 1000;
                this.recordRedisLatency(operation, duration);
                this.recordRedisOperation(operation, success ? 'success' : 'error');
                if (!success) {
                    this.recordRedisError(operation, 'operation_failed');
                }
            },
        };
    }
};
exports.GatewayMetricsService = GatewayMetricsService;
exports.GatewayMetricsService = GatewayMetricsService = GatewayMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], GatewayMetricsService);
function createGatewayMetricsService(config) {
    return new GatewayMetricsService(config);
}
//# sourceMappingURL=gateway-metrics.js.map