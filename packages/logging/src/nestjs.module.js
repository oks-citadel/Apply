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
var LoggingModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingModule = exports.LoggingExceptionFilter = exports.LoggingInterceptor = exports.LOGGER_INSTANCE = exports.LOGGER_OPTIONS = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const logger_1 = require("./logger");
const context_1 = require("./context");
exports.LOGGER_OPTIONS = 'LOGGER_OPTIONS';
exports.LOGGER_INSTANCE = 'LOGGER_INSTANCE';
let LoggingInterceptor = class LoggingInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, headers } = request;
        const startTime = Date.now();
        const correlationId = headers['x-correlation-id'] || context_1.LoggerContext.generateCorrelationId();
        const requestId = headers['x-request-id'] || context_1.LoggerContext.getRequestId();
        const userId = request.user?.id;
        context_1.LoggerContext.setContext({
            correlationId,
            requestId,
            ...(userId && { userId }),
        });
        this.logger.info('Incoming request', {
            method,
            url,
            correlationId,
            requestId,
            userId,
            userAgent: headers['user-agent'],
            ip: request.ip,
        });
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const response = context.switchToHttp().getResponse();
            const { statusCode } = response;
            const duration = Date.now() - startTime;
            this.logger.info('Request completed', {
                method,
                url,
                statusCode,
                duration,
                correlationId,
                requestId,
                userId,
            });
            this.logger.trackMetric('http.request.duration', duration, {
                method,
                url,
                statusCode: statusCode.toString(),
            });
        }), (0, operators_1.catchError)((error) => {
            const duration = Date.now() - startTime;
            const statusCode = error instanceof common_1.HttpException
                ? error.getStatus()
                : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            this.logger.error('Request failed', error, {
                method,
                url,
                statusCode,
                duration,
                correlationId,
                requestId,
                userId,
            });
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_1.Logger])
], LoggingInterceptor);
let LoggingExceptionFilter = class LoggingExceptionFilter {
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: exception.message || 'Internal server error',
            correlationId: context_1.LoggerContext.getCorrelationId(),
        };
        this.logger.error(`Unhandled exception: ${exception.message}`, exception instanceof Error ? exception : new Error(String(exception)), {
            statusCode: status,
            path: request.url,
            method: request.method,
            correlationId: context_1.LoggerContext.getCorrelationId(),
            userId: request.user?.id,
        });
        response.status(status).json(errorResponse);
    }
};
exports.LoggingExceptionFilter = LoggingExceptionFilter;
exports.LoggingExceptionFilter = LoggingExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [logger_1.Logger])
], LoggingExceptionFilter);
let LoggingModule = LoggingModule_1 = class LoggingModule {
    static forRoot(options) {
        const loggerOptionsProvider = {
            provide: exports.LOGGER_OPTIONS,
            useValue: options,
        };
        const loggerProvider = {
            provide: exports.LOGGER_INSTANCE,
            useFactory: (loggerOptions) => {
                return new logger_1.Logger(loggerOptions);
            },
            inject: [exports.LOGGER_OPTIONS],
        };
        const loggerAliasProvider = {
            provide: logger_1.Logger,
            useExisting: exports.LOGGER_INSTANCE,
        };
        const interceptorProvider = {
            provide: LoggingInterceptor,
            useFactory: (logger) => {
                return new LoggingInterceptor(logger);
            },
            inject: [exports.LOGGER_INSTANCE],
        };
        const exceptionFilterProvider = {
            provide: LoggingExceptionFilter,
            useFactory: (logger) => {
                return new LoggingExceptionFilter(logger);
            },
            inject: [exports.LOGGER_INSTANCE],
        };
        return {
            module: LoggingModule_1,
            global: options.isGlobal ?? true,
            providers: [
                loggerOptionsProvider,
                loggerProvider,
                loggerAliasProvider,
                interceptorProvider,
                exceptionFilterProvider,
            ],
            exports: [
                exports.LOGGER_INSTANCE,
                logger_1.Logger,
                LoggingInterceptor,
                LoggingExceptionFilter,
            ],
        };
    }
    static forRootAsync(options) {
        const loggerOptionsProvider = {
            provide: exports.LOGGER_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject || [],
        };
        const loggerProvider = {
            provide: exports.LOGGER_INSTANCE,
            useFactory: (loggerOptions) => {
                return new logger_1.Logger(loggerOptions);
            },
            inject: [exports.LOGGER_OPTIONS],
        };
        const loggerAliasProvider = {
            provide: logger_1.Logger,
            useExisting: exports.LOGGER_INSTANCE,
        };
        const interceptorProvider = {
            provide: LoggingInterceptor,
            useFactory: (logger) => {
                return new LoggingInterceptor(logger);
            },
            inject: [exports.LOGGER_INSTANCE],
        };
        const exceptionFilterProvider = {
            provide: LoggingExceptionFilter,
            useFactory: (logger) => {
                return new LoggingExceptionFilter(logger);
            },
            inject: [exports.LOGGER_INSTANCE],
        };
        return {
            module: LoggingModule_1,
            global: options.isGlobal ?? true,
            providers: [
                loggerOptionsProvider,
                loggerProvider,
                loggerAliasProvider,
                interceptorProvider,
                exceptionFilterProvider,
            ],
            exports: [
                exports.LOGGER_INSTANCE,
                logger_1.Logger,
                LoggingInterceptor,
                LoggingExceptionFilter,
            ],
        };
    }
};
exports.LoggingModule = LoggingModule;
exports.LoggingModule = LoggingModule = LoggingModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], LoggingModule);
//# sourceMappingURL=nestjs.module.js.map