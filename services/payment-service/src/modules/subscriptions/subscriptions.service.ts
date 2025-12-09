import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionTier, SUBSCRIPTION_TIER_LIMITS } from '../../common/enums/subscription-tier.enum';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { LoggingService } from '../../common/logging/logging.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @Inject('SUBSCRIPTION_SERVICE')
    private subscriptionEventClient: ClientProxy,
    private loggingService: LoggingService,
  ) {}

  /**
   * Create a new subscription
   */
  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    try {
      this.logger.log(`Creating subscription for user: ${createSubscriptionDto.userId}`);

      // Check if user already has an active subscription
      const existingSubscription = await this.findByUserId(createSubscriptionDto.userId);

      if (existingSubscription && existingSubscription.isActive()) {
        throw new BadRequestException('User already has an active subscription');
      }

      const subscription = this.subscriptionRepository.create(createSubscriptionDto);
      const savedSubscription = await this.subscriptionRepository.save(subscription);

      // Emit subscription created event
      this.emitSubscriptionEvent('subscription.created', savedSubscription);

      this.logger.log(`Created subscription: ${savedSubscription.id}`);
      return savedSubscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all subscriptions with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Subscription[]; total: number; page: number; lastPage: number }> {
    const [data, total] = await this.subscriptionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Find subscription by ID
   */
  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['invoices'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  /**
   * Find subscription by user ID
   */
  async findByUserId(userId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find subscription by Stripe subscription ID
   */
  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
    });
  }

  /**
   * Find subscription by Stripe customer ID
   */
  async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: { stripeCustomerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update subscription
   */
  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    try {
      const subscription = await this.findOne(id);

      const previousTier = subscription.tier;
      const previousStatus = subscription.status;

      Object.assign(subscription, updateSubscriptionDto);
      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Emit events if tier or status changed
      if (previousTier !== updatedSubscription.tier) {
        this.emitSubscriptionEvent('subscription.tier.changed', {
          subscription: updatedSubscription,
          previousTier,
          newTier: updatedSubscription.tier,
        });
      }

      if (previousStatus !== updatedSubscription.status) {
        this.emitSubscriptionEvent('subscription.status.changed', {
          subscription: updatedSubscription,
          previousStatus,
          newStatus: updatedSubscription.status,
        });
      }

      this.logger.log(`Updated subscription: ${id}`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancel(id: string, immediately: boolean = false): Promise<Subscription> {
    try {
      const subscription = await this.findOne(id);

      if (subscription.isCanceled()) {
        throw new BadRequestException('Subscription is already canceled');
      }

      subscription.cancelAtPeriodEnd = !immediately;
      subscription.status = immediately ? SubscriptionStatus.CANCELED : subscription.status;
      subscription.canceledAt = immediately ? new Date() : null;

      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Emit subscription canceled event
      this.emitSubscriptionEvent('subscription.canceled', {
        subscription: updatedSubscription,
        immediately,
      });

      this.logger.log(`Canceled subscription: ${id}`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivate(id: string): Promise<Subscription> {
    try {
      const subscription = await this.findOne(id);

      if (!subscription.cancelAtPeriodEnd && !subscription.isCanceled()) {
        throw new BadRequestException('Subscription is not canceled');
      }

      subscription.cancelAtPeriodEnd = false;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.canceledAt = null;

      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Emit subscription reactivated event
      this.emitSubscriptionEvent('subscription.reactivated', updatedSubscription);

      this.logger.log(`Reactivated subscription: ${id}`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error(`Failed to reactivate subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Downgrade user to FREE tier
   */
  async downgradeToFreeTier(userId: string): Promise<Subscription> {
    try {
      const subscription = await this.findByUserId(userId);

      if (!subscription) {
        // Create a FREE tier subscription if none exists
        return await this.create({
          userId,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
        });
      }

      subscription.tier = SubscriptionTier.FREE;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.stripeCustomerId = null;
      subscription.stripeSubscriptionId = null;
      subscription.cancelAtPeriodEnd = false;
      subscription.canceledAt = null;

      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Emit subscription downgraded event
      this.emitSubscriptionEvent('subscription.downgraded', updatedSubscription);

      this.logger.log(`Downgraded user ${userId} to FREE tier`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error(`Failed to downgrade to free tier: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription limits
   */
  getSubscriptionLimits(tier: SubscriptionTier) {
    return SUBSCRIPTION_TIER_LIMITS[tier];
  }

  /**
   * Check if user has access to a feature
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.findByUserId(userId);

    if (!subscription || !subscription.hasAccess()) {
      return false;
    }

    const limits = this.getSubscriptionLimits(subscription.tier);

    switch (feature) {
      case 'emailAlerts':
        return limits.emailAlerts;
      case 'prioritySupport':
        return limits.prioritySupport;
      case 'advancedAnalytics':
        return limits.advancedAnalytics;
      case 'customBranding':
        return limits.customBranding;
      default:
        return false;
    }
  }

  /**
   * Check usage against limits
   */
  async checkUsageLimits(
    userId: string,
    usageType: string,
    currentUsage: number,
  ): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    const subscription = await this.findByUserId(userId);

    if (!subscription || !subscription.hasAccess()) {
      const freeLimits = this.getSubscriptionLimits(SubscriptionTier.FREE);
      const limit = this.getUsageLimit(freeLimits, usageType);

      return {
        allowed: currentUsage < limit,
        limit,
        remaining: Math.max(0, limit - currentUsage),
      };
    }

    const limits = this.getSubscriptionLimits(subscription.tier);
    const limit = this.getUsageLimit(limits, usageType);

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        limit: -1,
        remaining: -1,
      };
    }

    return {
      allowed: currentUsage < limit,
      limit,
      remaining: Math.max(0, limit - currentUsage),
    };
  }

  /**
   * Get usage limit for a specific type
   */
  private getUsageLimit(limits: any, usageType: string): number {
    switch (usageType) {
      case 'jobApplications':
        return limits.jobApplicationsPerMonth;
      case 'aiCoverLetters':
        return limits.aiGeneratedCoverLetters;
      case 'resumeTemplates':
        return limits.resumeTemplates;
      case 'savedJobs':
        return limits.savedJobs;
      default:
        return 0;
    }
  }

  /**
   * Remove subscription (soft delete)
   */
  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.subscriptionRepository.remove(subscription);
    this.logger.log(`Removed subscription: ${id}`);
  }

  /**
   * Emit subscription event to message queue
   */
  private emitSubscriptionEvent(event: string, data: any) {
    try {
      this.subscriptionEventClient.emit(event, data);
      this.loggingService.logEvent(event, data, 'SubscriptionsService');
    } catch (error) {
      this.logger.error(`Failed to emit event ${event}: ${error.message}`);
    }
  }
}
