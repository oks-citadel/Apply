"use strict";
/**
 * Health check utilities for NestJS services
 * Provides comprehensive health checks for databases, Redis, external services, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = exports.HealthCheckService = void 0;
exports.createDatabaseCheck = createDatabaseCheck;
exports.createRedisCheck = createRedisCheck;
exports.createHttpCheck = createHttpCheck;
exports.createDiskSpaceCheck = createDiskSpaceCheck;
exports.createMemoryCheck = createMemoryCheck;
exports.createCustomCheck = createCustomCheck;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
/**
 * Health Check Service
 * Provides health check functionality for NestJS services
 */
let HealthCheckService = class HealthCheckService {
    constructor() {
        this.customChecks = [];
        this.serviceName = process.env.SERVICE_NAME || 'unknown';
        this.serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
        this.startTime = Date.now();
    }
    /**
     * Configure the health check service
     */
    configure(options) {
        this.serviceName = options.serviceName;
        this.serviceVersion = options.serviceVersion;
        if (options.checks) {
            this.customChecks = options.checks;
        }
    }
    /**
     * Register a custom health check
     */
    registerCheck(check) {
        this.customChecks.push(check);
    }
    /**
     * Get liveness status (is the service running?)
     */
    async getLiveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Get readiness status (is the service ready to accept traffic?)
     */
    async getReadiness() {
        const checks = [];
        let overallStatus = 'healthy';
        // Run all custom checks
        for (const checkFn of this.customChecks) {
            try {
                const startTime = Date.now();
                const check = await checkFn();
                check.duration = Date.now() - startTime;
                checks.push(check);
                if (check.status === 'fail') {
                    overallStatus = 'unhealthy';
                }
                else if (check.status === 'warn' && overallStatus !== 'unhealthy') {
                    overallStatus = 'degraded';
                }
            }
            catch (error) {
                checks.push({
                    name: 'unknown',
                    status: 'fail',
                    componentType: 'unknown',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
                overallStatus = 'unhealthy';
            }
        }
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            service: this.serviceName,
            version: this.serviceVersion,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            checks,
        };
    }
    /**
     * Get full health status
     */
    async getHealth() {
        return this.getReadiness();
    }
};
exports.HealthCheckService = HealthCheckService;
exports.HealthCheckService = HealthCheckService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], HealthCheckService);
/**
 * Create a PostgreSQL health check function
 */
function createDatabaseCheck(name, getConnection) {
    return async () => {
        try {
            const connection = await getConnection();
            const startTime = Date.now();
            // Run a simple query to check connectivity
            await connection.query('SELECT 1');
            return {
                name,
                status: 'pass',
                componentType: 'datastore',
                duration: Date.now() - startTime,
                message: 'Database connection successful',
            };
        }
        catch (error) {
            return {
                name,
                status: 'fail',
                componentType: 'datastore',
                message: error instanceof Error ? error.message : 'Database check failed',
            };
        }
    };
}
/**
 * Create a Redis health check function
 */
function createRedisCheck(name, getRedisClient) {
    return async () => {
        try {
            const client = await getRedisClient();
            const startTime = Date.now();
            // Run a PING command
            const result = await client.ping();
            return {
                name,
                status: result === 'PONG' ? 'pass' : 'fail',
                componentType: 'datastore',
                duration: Date.now() - startTime,
                message: result === 'PONG' ? 'Redis connection successful' : 'Unexpected response',
            };
        }
        catch (error) {
            return {
                name,
                status: 'fail',
                componentType: 'datastore',
                message: error instanceof Error ? error.message : 'Redis check failed',
            };
        }
    };
}
/**
 * Create an HTTP endpoint health check function
 */
function createHttpCheck(name, url, timeout = 5000) {
    return async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;
            if (response.ok) {
                return {
                    name,
                    status: 'pass',
                    componentType: 'http',
                    duration,
                    observedValue: response.status,
                    message: `HTTP ${response.status}`,
                };
            }
            else {
                return {
                    name,
                    status: response.status >= 500 ? 'fail' : 'warn',
                    componentType: 'http',
                    duration,
                    observedValue: response.status,
                    message: `HTTP ${response.status}`,
                };
            }
        }
        catch (error) {
            return {
                name,
                status: 'fail',
                componentType: 'http',
                message: error instanceof Error ? error.message : 'HTTP check failed',
            };
        }
    };
}
/**
 * Create a disk space health check function
 */
function createDiskSpaceCheck(name, path, thresholdPercent = 90) {
    return async () => {
        try {
            const fs = await Promise.resolve().then(() => tslib_1.__importStar(require('fs/promises')));
            const { statfs } = await Promise.resolve().then(() => tslib_1.__importStar(require('fs')));
            const { promisify } = await Promise.resolve().then(() => tslib_1.__importStar(require('util')));
            const statfsAsync = promisify(statfs);
            const stats = await statfsAsync(path);
            const totalBytes = stats.blocks * stats.bsize;
            const freeBytes = stats.bfree * stats.bsize;
            const usedPercent = ((totalBytes - freeBytes) / totalBytes) * 100;
            return {
                name,
                status: usedPercent < thresholdPercent ? 'pass' : 'warn',
                componentType: 'system',
                observedValue: usedPercent.toFixed(2),
                observedUnit: 'percent',
                message: `Disk usage: ${usedPercent.toFixed(2)}%`,
            };
        }
        catch (error) {
            return {
                name,
                status: 'fail',
                componentType: 'system',
                message: error instanceof Error ? error.message : 'Disk check failed',
            };
        }
    };
}
/**
 * Create a memory health check function
 */
function createMemoryCheck(name, thresholdPercent = 90) {
    return async () => {
        const used = process.memoryUsage();
        const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
        return {
            name,
            status: heapUsedPercent < thresholdPercent ? 'pass' : 'warn',
            componentType: 'system',
            observedValue: heapUsedPercent.toFixed(2),
            observedUnit: 'percent',
            message: `Heap usage: ${heapUsedPercent.toFixed(2)}% (${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB)`,
        };
    };
}
/**
 * Health Controller for NestJS
 * Provides /health/live, /health/ready, and /health endpoints
 */
let HealthController = class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }
    /**
     * Liveness probe endpoint
     * Used by Kubernetes to check if the container is alive
     */
    async getLiveness() {
        return this.healthService.getLiveness();
    }
    /**
     * Readiness probe endpoint
     * Used by Kubernetes to check if the container is ready to receive traffic
     */
    async getReadiness() {
        const result = await this.healthService.getReadiness();
        if (result.status === 'unhealthy') {
            throw new common_1.HttpException(result, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return result;
    }
    /**
     * Full health check endpoint
     * Returns detailed health information
     */
    async getHealth() {
        return this.healthService.getHealth();
    }
};
exports.HealthController = HealthController;
tslib_1.__decorate([
    (0, common_1.Get)('live'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], HealthController.prototype, "getLiveness", null);
tslib_1.__decorate([
    (0, common_1.Get)('ready'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], HealthController.prototype, "getReadiness", null);
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
exports.HealthController = HealthController = tslib_1.__decorate([
    (0, common_1.Controller)('health'),
    tslib_1.__metadata("design:paramtypes", [HealthCheckService])
], HealthController);
/**
 * Create a custom health check for any async operation
 */
function createCustomCheck(name, componentType, checkFn) {
    return async () => {
        try {
            const startTime = Date.now();
            const result = await checkFn();
            const duration = Date.now() - startTime;
            if (typeof result === 'boolean') {
                return {
                    name,
                    status: result ? 'pass' : 'fail',
                    componentType,
                    duration,
                };
            }
            return {
                name,
                status: result.ok ? 'pass' : 'fail',
                componentType,
                duration,
                message: result.message,
            };
        }
        catch (error) {
            return {
                name,
                status: 'fail',
                componentType,
                message: error instanceof Error ? error.message : 'Check failed',
            };
        }
    };
}
//# sourceMappingURL=health.js.map