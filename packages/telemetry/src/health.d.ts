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
export declare class HealthCheckService {
    private serviceName;
    private serviceVersion;
    private startTime;
    private customChecks;
    constructor();
    configure(options: HealthCheckOptions): void;
    registerCheck(check: HealthCheckFunction): void;
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getReadiness(): Promise<HealthCheckResult>;
    getHealth(): Promise<HealthCheckResult>;
}
export declare function createDatabaseCheck(name: string, getConnection: () => Promise<any>): HealthCheckFunction;
export declare function createRedisCheck(name: string, getRedisClient: () => Promise<any>): HealthCheckFunction;
export declare function createHttpCheck(name: string, url: string, timeout?: number): HealthCheckFunction;
export declare function createDiskSpaceCheck(name: string, path: string, thresholdPercent?: number): HealthCheckFunction;
export declare function createMemoryCheck(name: string, thresholdPercent?: number): HealthCheckFunction;
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthCheckService);
    getLiveness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getReadiness(): Promise<HealthCheckResult>;
    getHealth(): Promise<HealthCheckResult>;
}
export declare function createCustomCheck(name: string, componentType: string, checkFn: () => Promise<boolean | {
    ok: boolean;
    message?: string;
}>): HealthCheckFunction;
