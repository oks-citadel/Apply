import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ServiceAuthService } from './service-auth.service';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly serviceAuthService: ServiceAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['x-service-auth'];

    if (!authHeader) {
      throw new UnauthorizedException('Service authentication required');
    }

    const payload = this.serviceAuthService.verifyServiceToken(authHeader);
    if (!payload || payload.type !== 'service') {
      throw new UnauthorizedException('Invalid service token');
    }

    request.serviceAuth = payload;
    return true;
  }
}
