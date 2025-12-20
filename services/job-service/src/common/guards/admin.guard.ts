import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import type {
  CanActivate,
  ExecutionContext} from '@nestjs/common';
import type { Request } from 'express';

/**
 * JWT Payload interface
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  [key: string]: any;
}

/**
 * Admin Authorization Guard
 * Ensures only admin users can access protected endpoints
 *
 * SECURITY FIX: Replaces mock AdminGuard that provided NO protection
 * This guard checks if the authenticated user has admin role
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has admin role
    // The role field comes from JWT payload
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
