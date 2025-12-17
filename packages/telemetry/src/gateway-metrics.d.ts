import { Counter, Gauge, Histogram, register, Registry } from 'prom-client';
export interface GatewayMetricsConfig {
    serviceName: string;
    enableDefaultMetrics?: boolean;
}
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
    recordRateLimitDegraded(route: string, reason?: string): void;
    recordRateLimitCheck(route: string, status: 'allowed' | 'rejected' | 'degraded'): void;
    recordRateLimitError(route: string, errorType: string): void;
    recordRedisLatency(operation: string, durationSeconds: number): void;
    setRedisConnectionState(host: string, connected: boolean): void;
    recordRedisError(operation: string, errorType: string): void;
    recordRedisOperation(operation: string, status: 'success' | 'error'): void;
    setCircuitBreakerState(circuitName: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void;
    recordCircuitBreakerStateChange(circuitName: string, fromState: string, toState: string): void;
    recordCircuitBreakerTrip(circuitName: string, reason: string): void;
    recordCircuitBreakerFallback(circuitName: string): void;
    recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void;
    getMetrics(): Promise<string>;
    getRegistry(): Registry;
    createRedisTimer(operation: string): {
        end: (success?: boolean) => void;
    };
}
export declare function createGatewayMetricsService(config: GatewayMetricsConfig): GatewayMetricsService;
export { register };
