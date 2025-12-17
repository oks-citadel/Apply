import { DynamicModule, NestInterceptor, ExecutionContext, CallHandler, ArgumentsHost } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Logger, LoggerOptions } from './logger';
export declare const LOGGER_OPTIONS = "LOGGER_OPTIONS";
export declare const LOGGER_INSTANCE = "LOGGER_INSTANCE";
export interface LoggingModuleOptions extends LoggerOptions {
    isGlobal?: boolean;
}
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: Logger);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
export declare class LoggingExceptionFilter {
    private readonly logger;
    constructor(logger: Logger);
    catch(exception: any, host: ArgumentsHost): void;
}
export declare class LoggingModule {
    static forRoot(options: LoggingModuleOptions): DynamicModule;
    static forRootAsync(options: {
        isGlobal?: boolean;
        useFactory: (...args: any[]) => Promise<LoggerOptions> | LoggerOptions;
        inject?: any[];
    }): DynamicModule;
}
