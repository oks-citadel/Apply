import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler} from '@nestjs/common';
import type { Observable } from 'rxjs';


@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          this.logger.log(
            `${method} ${url} - ${response.statusCode} - ${delay}ms`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `${method} ${url} - ${error.status || 500} - ${delay}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
