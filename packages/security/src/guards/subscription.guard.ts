import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUBSCRIPTION_KEY, FEATURE_KEY, USAGE_KEY } from '../decorators/subscription.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<string>(SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const usageLimit = this.reflector.getAllAndOverride<{ feature: string; limit: number }>(USAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTier && !requiredFeature && !usageLimit) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const tierHierarchy = ['free', 'starter', 'basic', 'professional', 'advanced', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(user.subscriptionTier?.toLowerCase() || 'free');

    if (requiredTier) {
      const requiredIndex = tierHierarchy.indexOf(requiredTier.toLowerCase());
      if (userTierIndex < requiredIndex) {
        throw new ForbiddenException(`This feature requires ${requiredTier} tier or higher`);
      }
    }

    if (requiredFeature && user.features) {
      if (!user.features.includes(requiredFeature)) {
        throw new ForbiddenException(`Feature '${requiredFeature}' is not available in your plan`);
      }
    }

    return true;
  }
}
