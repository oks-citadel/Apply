/**
 * Gateway-Specific Metrics for Kong API Gateway
 *
 * Provides custom metrics for gateway reliability, rate limiting degradation,
 * and Redis dependency monitoring.
 */
import { Counter, Gauge, Histogram, register, Registry } from 'prom-client';
export interface GatewayMetricsConfig {
    serviceName: string;
    enableDefaultMetrics?: boolean;
}
/**
 * Gateway Metrics Service
 * Tracks gateway-specific reliability metrics including degraded mode operations
 */
export declare class GatewayMetricsService {
    private readonly logger;
    private registry;
    private serviceName;
    gatewayRateLimitDegraded: Counter<string>;
    gatewayRateLimitTotal: Counter<string>;
    gatewayRateLimitErrors: Counter<string>;
    redisLatency: Histogram<string>;
    redisConnectionState: Gauge<string>;
    redisErrors: Counter<string>;
    redisOperations: Counter<string>;
    circuitBreakerState: Gauge<string>;
    circuitBreakerStateChanges: Counter<string>;
    circuitBreakerTrips: Counter<string>;
    circuitBreakerFallbacks: Counter<string>;
    httpRequestDurationByRoute: Histogram<string>;
    httpRequestsTotal: Counter<string>;
    constructor(config: GatewayMetricsConfig);
    private initializeMetrics;
    /**
     * Record rate limit degraded mode operation
     * Call this when Redis is unavailable and fail-open is active
     */
    recordRateLimitDegraded(route: string, reason?: string): void;
    /**
     * Record rate limit check
     */
    recordRateLimitCheck(route: string, status: 'allowed' | 'rejected' | 'degraded'): void;
    /**
     * Record rate limiting error
     */
    recordRateLimitError(route: string, errorType: string): void;
    /**
     * Record Redis operation latency
     */
    recordRedisLatency(operation: string, durationSeconds: number): void;
    /**
     * Set Redis connection state
     */
    setRedisConnectionState(host: string, connected: boolean): void;
    /**
     * Record Redis error
     */
    recordRedisError(operation: string, errorType: string): void;
    /**
     * Record Redis operation
     */
    recordRedisOperation(operation: string, status: 'success' | 'error'): void;
    /**
     * Set circuit breaker state
     * @param state CLOSED = 0, OPEN = 1, HALF_OPEN = 2
     */
    setCircuitBreakerState(circuitName: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void;
    /**
     * Record circuit breaker state change
     */
    recordCircuitBreakerStateChange(circuitName: string, fromState: string, toState: string): void;
    /**
     * Record circuit breaker trip
     */
    recordCircuitBreakerTrip(circuitName: string, reason: string): void;
    /**
     * Record circuit breaker fallback execution
     */
    recordCircuitBreakerFallback(circuitName: string): void;
    /**
     * Record HTTP request with route-specific metrics
     */
    recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void;
    /**
     * Get metrics in Prometheus format
     */
    getMetrics(): Promise<string>;
    /**
     * Get registry instance
     */
    getRegistry(): Registry;
    /**
     * Create a timing helper for Redis operations
     */
    createRedisTimer(operation: string): {
        end: (success?: boolean) => void;
    };
}
/**
 * Create gateway metrics service instance
 */
export declare function createGatewayMetricsService(config: GatewayMetricsConfig): GatewayMetricsService;
/**
 * Export registry for global access
 */
export { register };
//# sourceMappingURL=gateway-metrics.d.ts.map