/**
 * Health check utilities for NestJS services
 * Provides comprehensive health checks for databases, Redis, external services, etc.
 */
export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    service: string;
    version: string;
    uptime: number;
    checks: HealthCheck[];
}
export interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    componentType: string;
    duration?: number;
    message?: string;
    observedValue?: string | number;
    observedUnit?: string;
}
export interface HealthCheckOptions {
    serviceName: string;
    serviceVersion: string;
    checks?: HealthCheckFunction[];
}
export type HealthCheckFunction = () => Promise<HealthCheck>;
/**
 * Health Check Service
 * Provides health check functionality for NestJS services
 */
export declare class HealthCheckService {
    private serviceName;
    private serviceVersion;
    private startTime;
    private customChecks;
    constructor();
    /**
     * Configure the health check service
     */
    configure(options: HealthCheckOptions): void;
    /**
     * Register a custom health check
     */
    registerCheck(check: HealthCheckFunction): void;
    /**
     * Get liveness status (is the service running?)
     */
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    /**
     * Get readiness status (is the service ready to accept traffic?)
     */
    getReadiness(): Promise<HealthCheckResult>;
    /**
     * Get full health status
     */
    getHealth(): Promise<HealthCheckResult>;
}
/**
 * Create a PostgreSQL health check function
 */
export declare function createDatabaseCheck(name: string, getConnection: () => Promise<any>): HealthCheckFunction;
/**
 * Create a Redis health check function
 */
export declare function createRedisCheck(name: string, getRedisClient: () => Promise<any>): HealthCheckFunction;
/**
 * Create an HTTP endpoint health check function
 */
export declare function createHttpCheck(name: string, url: string, timeout?: number): HealthCheckFunction;
/**
 * Create a disk space health check function
 */
export declare function createDiskSpaceCheck(name: string, path: string, thresholdPercent?: number): HealthCheckFunction;
/**
 * Create a memory health check function
 */
export declare function createMemoryCheck(name: string, thresholdPercent?: number): HealthCheckFunction;
/**
 * Health Controller for NestJS
 * Provides /health/live, /health/ready, and /health endpoints
 */
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthCheckService);
    /**
     * Liveness probe endpoint
     * Used by Kubernetes to check if the container is alive
     */
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    /**
     * Readiness probe endpoint
     * Used by Kubernetes to check if the container is ready to receive traffic
     */
    getReadiness(): Promise<HealthCheckResult>;
    /**
     * Full health check endpoint
     * Returns detailed health information
     */
    getHealth(): Promise<HealthCheckResult>;
}
/**
 * Create a custom health check for any async operation
 */
export declare function createCustomCheck(name: string, componentType: string, checkFn: () => Promise<boolean | {
    ok: boolean;
    message?: string;
}>): HealthCheckFunction;
//# sourceMappingURL=health.d.ts.map