import {
  Module,
  Global,
  DynamicModule,
  Provider,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Logger, LoggerOptions, LogLevel } from './logger';
import { LoggerContext } from './context';

export const LOGGER_OPTIONS = 'LOGGER_OPTIONS';
export const LOGGER_INSTANCE = 'LOGGER_INSTANCE';

export interface LoggingModuleOptions extends LoggerOptions {
  isGlobal?: boolean;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const startTime = Date.now();

    // Extract or generate correlation ID
    const correlationId = headers['x-correlation-id'] || LoggerContext.generateCorrelationId();
    const requestId = headers['x-request-id'] || LoggerContext.getRequestId();
    const userId = request.user?.id;

    // Set up logging context
    LoggerContext.setContext({
      correlationId,
      requestId,
      ...(userId && { userId }),
    });

    // Log incoming request
    this.logger.info('Incoming request', {
      method,
      url,
      correlationId,
      requestId,
      userId,
      userAgent: headers['user-agent'],
      ip: request.ip,
    });

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - startTime;

        // Log successful response
        this.logger.info('Request completed', {
          method,
          url,
          statusCode,
          duration,
          correlationId,
          requestId,
          userId,
        });

        // Track response time metric
        this.logger.trackMetric('http.request.duration', duration, {
          method,
          url,
          statusCode: statusCode.toString(),
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

        // Log error
        this.logger.error('Request failed', error, {
          method,
          url,
          statusCode,
          duration,
          correlationId,
          requestId,
          userId,
        });

        return throwError(() => error);
      }),
    );
  }
}

@Catch()
export class LoggingExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
      correlationId: LoggerContext.getCorrelationId(),
    };

    // Log the exception
    this.logger.error(
      `Unhandled exception: ${exception.message}`,
      exception instanceof Error ? exception : new Error(String(exception)),
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        correlationId: LoggerContext.getCorrelationId(),
        userId: request.user?.id,
      },
    );

    response.status(status).json(errorResponse);
  }
}

@Global()
@Module({})
export class LoggingModule {
  static forRoot(options: LoggingModuleOptions): DynamicModule {
    const loggerOptionsProvider: Provider = {
      provide: LOGGER_OPTIONS,
      useValue: options,
    };

    const loggerProvider: Provider = {
      provide: LOGGER_INSTANCE,
      useFactory: (loggerOptions: LoggerOptions) => {
        return new Logger(loggerOptions);
      },
      inject: [LOGGER_OPTIONS],
    };

    const loggerAliasProvider: Provider = {
      provide: Logger,
      useExisting: LOGGER_INSTANCE,
    };

    const interceptorProvider: Provider = {
      provide: LoggingInterceptor,
      useFactory: (logger: Logger) => {
        return new LoggingInterceptor(logger);
      },
      inject: [LOGGER_INSTANCE],
    };

    const exceptionFilterProvider: Provider = {
      provide: LoggingExceptionFilter,
      useFactory: (logger: Logger) => {
        return new LoggingExceptionFilter(logger);
      },
      inject: [LOGGER_INSTANCE],
    };

    return {
      module: LoggingModule,
      global: options.isGlobal ?? true,
      providers: [
        loggerOptionsProvider,
        loggerProvider,
        loggerAliasProvider,
        interceptorProvider,
        exceptionFilterProvider,
      ],
      exports: [
        LOGGER_INSTANCE,
        Logger,
        LoggingInterceptor,
        LoggingExceptionFilter,
      ],
    };
  }

  static forRootAsync(options: {
    isGlobal?: boolean;
    useFactory: (...args: any[]) => Promise<LoggerOptions> | LoggerOptions;
    inject?: any[];
  }): DynamicModule {
    const loggerOptionsProvider: Provider = {
      provide: LOGGER_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const loggerProvider: Provider = {
      provide: LOGGER_INSTANCE,
      useFactory: (loggerOptions: LoggerOptions) => {
        return new Logger(loggerOptions);
      },
      inject: [LOGGER_OPTIONS],
    };

    const loggerAliasProvider: Provider = {
      provide: Logger,
      useExisting: LOGGER_INSTANCE,
    };

    const interceptorProvider: Provider = {
      provide: LoggingInterceptor,
      useFactory: (logger: Logger) => {
        return new LoggingInterceptor(logger);
      },
      inject: [LOGGER_INSTANCE],
    };

    const exceptionFilterProvider: Provider = {
      provide: LoggingExceptionFilter,
      useFactory: (logger: Logger) => {
        return new LoggingExceptionFilter(logger);
      },
      inject: [LOGGER_INSTANCE],
    };

    return {
      module: LoggingModule,
      global: options.isGlobal ?? true,
      providers: [
        loggerOptionsProvider,
        loggerProvider,
        loggerAliasProvider,
        interceptorProvider,
        exceptionFilterProvider,
      ],
      exports: [
        LOGGER_INSTANCE,
        Logger,
        LoggingInterceptor,
        LoggingExceptionFilter,
      ],
    };
  }
}
