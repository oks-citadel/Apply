import {
  Injectable
} from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { map } from 'rxjs/operators';

import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler} from '@nestjs/common';
import type { Observable } from 'rxjs';

export interface Response<T> {
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        data: classToPlain(data) as T,
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    ) as Observable<Response<T>>;
  }
}
