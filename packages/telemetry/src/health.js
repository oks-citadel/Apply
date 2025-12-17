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
exports.HealthController = exports.HealthCheckService = void 0;
exports.createDatabaseCheck = createDatabaseCheck;
exports.createRedisCheck = createRedisCheck;
exports.createHttpCheck = createHttpCheck;
exports.createDiskSpaceCheck = createDiskSpaceCheck;
exports.createMemoryCheck = createMemoryCheck;
exports.createCustomCheck = createCustomCheck;
const common_1 = require("@nestjs/common");
let HealthCheckService = class HealthCheckService {
    constructor() {
        this.customChecks = [];
        this.serviceName = process.env.SERVICE_NAME || 'unknown';
        this.serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
        this.startTime = Date.now();
    }
    configure(options) {
        this.serviceName = options.serviceName;
        this.serviceVersion = options.serviceVersion;
        if (options.checks) {
            this.customChecks = options.checks;
        }
    }
    registerCheck(check) {
        this.customChecks.push(check);
    }
    async getLiveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    async getReadiness() {
        const checks = [];
        let overallStatus = 'healthy';
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
    async getHealth() {
        return this.getReadiness();
    }
};
exports.HealthCheckService = HealthCheckService;
exports.HealthCheckService = HealthCheckService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], HealthCheckService);
function createDatabaseCheck(name, getConnection) {
    return async () => {
        try {
            const connection = await getConnection();
            const startTime = Date.now();
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
function createRedisCheck(name, getRedisClient) {
    return async () => {
        try {
            const client = await getRedisClient();
            const startTime = Date.now();
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
function createDiskSpaceCheck(name, path, thresholdPercent = 90) {
    return async () => {
        try {
            const fs = await Promise.resolve().then(() => require('fs/promises'));
            const { statfs } = await Promise.resolve().then(() => require('fs'));
            const { promisify } = await Promise.resolve().then(() => require('util'));
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
let HealthController = class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }
    async getLiveness() {
        return this.healthService.getLiveness();
    }
    async getReadiness() {
        const result = await this.healthService.getReadiness();
        if (result.status === 'unhealthy') {
            throw new common_1.HttpException(result, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return result;
    }
    async getHealth() {
        return this.healthService.getHealth();
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getLiveness", null);
__decorate([
    (0, common_1.Get)('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getReadiness", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [HealthCheckService])
], HealthController);
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