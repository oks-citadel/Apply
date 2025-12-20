import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { ExecutionContext} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = Record<string, unknown>>(err: Error | null, user: TUser | false, info: { message?: string } | undefined, context: ExecutionContext): TUser {
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${info?.message || 'Unknown error'}`);
      throw err || new UnauthorizedException('Invalid or missing authentication token');
    }

    // Attach user to request
    const request = context.switchToHttp().getRequest();
    request.user = user;

    return user;
  }
}
