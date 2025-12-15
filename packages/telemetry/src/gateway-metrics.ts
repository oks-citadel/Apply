/**
 * Gateway-Specific Metrics for Kong API Gateway
 *
 * Provides custom metrics for gateway reliability, rate limiting degradation,
 * and Redis dependency monitoring.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  register,
  Registry,
} from 'prom-client';

export interface GatewayMetricsConfig {
  serviceName: string;
  enableDefaultMetrics?: boolean;
}

/**
 * Gateway Metrics Service
 * Tracks gateway-specific reliability metrics including degraded mode operations
 */
@Injectable()
export class GatewayMetricsService {
  private readonly logger = new Logger(GatewayMetricsService.name);
  private registry: Registry;
  private serviceName: string;

  // Gateway Rate Limiting Metrics
  public gatewayRateLimitDegraded: Counter<string>;
  public gatewayRateLimitTotal: Counter<string>;
  public gatewayRateLimitErrors: Counter<string>;

  // Redis Dependency Metrics
  public redisLatency: Histogram<string>;
  public redisConnectionState: Gauge<string>;
  public redisErrors: Counter<string>;
  public redisOperations: Counter<string>;

  // Circuit Breaker Metrics
  public circuitBreakerState: Gauge<string>;
  public circuitBreakerStateChanges: Counter<string>;
  public circuitBreakerTrips: Counter<string>;
  public circuitBreakerFallbacks: Counter<string>;

  // Request Processing Metrics
  public httpRequestDurationByRoute: Histogram<string>;
  public httpRequestsTotal: Counter<string>;

  constructor(config: GatewayMetricsConfig) {
    this.registry = new Registry();
    this.serviceName = config.serviceName;

    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // ========================================================================
    // Gateway Rate Limiting Metrics
    // ========================================================================

    this.gatewayRateLimitDegraded = new Counter({
      name: 'gateway_rate_limit_degraded_total',
      help: 'Total number of rate limit operations in degraded mode (Redis unavailable, fail-open active)',
      labelNames: ['service', 'route', 'reason'],
      registers: [this.registry],
    });

    this.gatewayRateLimitTotal = new Counter({
      name: 'gateway_rate_limit_total',
      help: 'Total number of rate limit checks performed',
      labelNames: ['service', 'route', 'status'],
      registers: [this.registry],
    });

    this.gatewayRateLimitErrors = new Counter({
      name: 'gateway_rate_limit_errors_total',
      help: 'Total number of rate limiting errors',
      labelNames: ['service', 'route', 'error_type'],
      registers: [this.registry],
    });

    // ========================================================================
    // Redis Dependency Metrics
    // ========================================================================

    this.redisLatency = new Histogram({
      name: 'redis_operation_duration_seconds',
      help: 'Duration of Redis operations in seconds',
      labelNames: ['operation', 'service'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
      registers: [this.registry],
    });

    this.redisConnectionState = new Gauge({
      name: 'redis_connection_state',
      help: 'Redis connection state (1 = connected, 0 = disconnected)',
      labelNames: ['service', 'host'],
      registers: [this.registry],
    });

    this.redisErrors = new Counter({
      name: 'redis_errors_total',
      help: 'Total number of Redis errors',
      labelNames: ['service', 'operation', 'error_type'],
      registers: [this.registry],
    });

    this.redisOperations = new Counter({
      name: 'redis_operations_total',
      help: 'Total number of Redis operations',
      labelNames: ['service', 'operation', 'status'],
      registers: [this.registry],
    });

    // ========================================================================
    // Circuit Breaker Metrics
    // ========================================================================

    this.circuitBreakerState = new Gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (0 = CLOSED, 1 = OPEN, 2 = HALF_OPEN)',
      labelNames: ['service', 'circuit_name'],
      registers: [this.registry],
    });

    this.circuitBreakerStateChanges = new Counter({
      name: 'circuit_breaker_state_changes_total',
      help: 'Total number of circuit breaker state changes',
      labelNames: ['service', 'circuit_name', 'from_state', 'to_state'],
      registers: [this.registry],
    });

    this.circuitBreakerTrips = new Counter({
      name: 'circuit_breaker_trips_total',
      help: 'Total number of times circuit breaker has tripped (opened)',
      labelNames: ['service', 'circuit_name', 'reason'],
      registers: [this.registry],
    });

    this.circuitBreakerFallbacks = new Counter({
      name: 'circuit_breaker_fallbacks_total',
      help: 'Total number of circuit breaker fallback executions',
      labelNames: ['service', 'circuit_name'],
      registers: [this.registry],
    });

    // ========================================================================
    // HTTP Request Metrics (Per-Route)
    // ========================================================================

    this.httpRequestDurationByRoute = new Histogram({
      name: 'http_request_duration_by_route_seconds',
      help: 'HTTP request duration in seconds by route',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_by_route_total',
      help: 'Total number of HTTP requests by route',
      labelNames: ['method', 'route', 'status_code', 'service'],
      registers: [this.registry],
    });
  }

  // ========================================================================
  // Gateway Rate Limiting Methods
  // ========================================================================

  /**
   * Record rate limit degraded mode operation
   * Call this when Redis is unavailable and fail-open is active
   */
  recordRateLimitDegraded(route: string, reason: string = 'redis_unavailable'): void {
    this.gatewayRateLimitDegraded.inc({
      service: this.serviceName,
      route,
      reason,
    });
    this.logger.warn(`Rate limiting degraded for route ${route}: ${reason}`);
  }

  /**
   * Record rate limit check
   */
  recordRateLimitCheck(route: string, status: 'allowed' | 'rejected' | 'degraded'): void {
    this.gatewayRateLimitTotal.inc({
      service: this.serviceName,
      route,
      status,
    });
  }

  /**
   * Record rate limiting error
   */
  recordRateLimitError(route: string, errorType: string): void {
    this.gatewayRateLimitErrors.inc({
      service: this.serviceName,
      route,
      error_type: errorType,
    });
  }

  // ========================================================================
  // Redis Dependency Methods
  // ========================================================================

  /**
   * Record Redis operation latency
   */
  recordRedisLatency(operation: string, durationSeconds: number): void {
    this.redisLatency.observe(
      { operation, service: this.serviceName },
      durationSeconds,
    );
  }

  /**
   * Set Redis connection state
   */
  setRedisConnectionState(host: string, connected: boolean): void {
    this.redisConnectionState.set(
      { service: this.serviceName, host },
      connected ? 1 : 0,
    );
  }

  /**
   * Record Redis error
   */
  recordRedisError(operation: string, errorType: string): void {
    this.redisErrors.inc({
      service: this.serviceName,
      operation,
      error_type: errorType,
    });
  }

  /**
   * Record Redis operation
   */
  recordRedisOperation(operation: string, status: 'success' | 'error'): void {
    this.redisOperations.inc({
      service: this.serviceName,
      operation,
      status,
    });
  }

  // ========================================================================
  // Circuit Breaker Methods
  // ========================================================================

  /**
   * Set circuit breaker state
   * @param state CLOSED = 0, OPEN = 1, HALF_OPEN = 2
   */
  setCircuitBreakerState(
    circuitName: string,
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  ): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.circuitBreakerState.set(
      { service: this.serviceName, circuit_name: circuitName },
      stateValue,
    );
  }

  /**
   * Record circuit breaker state change
   */
  recordCircuitBreakerStateChange(
    circuitName: string,
    fromState: string,
    toState: string,
  ): void {
    this.circuitBreakerStateChanges.inc({
      service: this.serviceName,
      circuit_name: circuitName,
      from_state: fromState,
      to_state: toState,
    });

    // If transitioning to OPEN, record a trip
    if (toState === 'OPEN') {
      this.recordCircuitBreakerTrip(circuitName, 'threshold_exceeded');
    }
  }

  /**
   * Record circuit breaker trip
   */
  recordCircuitBreakerTrip(circuitName: string, reason: string): void {
    this.circuitBreakerTrips.inc({
      service: this.serviceName,
      circuit_name: circuitName,
      reason,
    });
    this.logger.warn(`Circuit breaker ${circuitName} tripped: ${reason}`);
  }

  /**
   * Record circuit breaker fallback execution
   */
  recordCircuitBreakerFallback(circuitName: string): void {
    this.circuitBreakerFallbacks.inc({
      service: this.serviceName,
      circuit_name: circuitName,
    });
  }

  // ========================================================================
  // HTTP Request Methods
  // ========================================================================

  /**
   * Record HTTP request with route-specific metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    this.httpRequestDurationByRoute.observe(
      {
        method,
        route,
        status_code: statusCode.toString(),
        service: this.serviceName,
      },
      durationSeconds,
    );

    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      service: this.serviceName,
    });
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get registry instance
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Create a timing helper for Redis operations
   */
  createRedisTimer(operation: string) {
    const start = Date.now();
    return {
      end: (success: boolean = true) => {
        const duration = (Date.now() - start) / 1000;
        this.recordRedisLatency(operation, duration);
        this.recordRedisOperation(operation, success ? 'success' : 'error');
        if (!success) {
          this.recordRedisError(operation, 'operation_failed');
        }
      },
    };
  }
}

/**
 * Create gateway metrics service instance
 */
export function createGatewayMetricsService(
  config: GatewayMetricsConfig,
): GatewayMetricsService {
  return new GatewayMetricsService(config);
}

/**
 * Export registry for global access
 */
export { register };
