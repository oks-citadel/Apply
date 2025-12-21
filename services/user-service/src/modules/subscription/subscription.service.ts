import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

import { Subscription } from './entities/subscription.entity';
import { SubscriptionTier, SubscriptionStatus } from '../../common/enums/subscription-tier.enum';

import type { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly stripeEnabled: boolean;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    // Only initialize Stripe if a valid key is provided (starts with sk_)
    if (stripeKey && stripeKey.startsWith('sk_')) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-02-24.acacia',
      });
      this.stripeEnabled = true;
      this.logger.log('Stripe initialized successfully');
    } else {
      this.stripeEnabled = false;
      this.logger.warn('Stripe not configured - payment features disabled. Set STRIPE_SECRET_KEY to enable.');
    }
  }

  private ensureStripeEnabled(): void {
    if (!this.stripe || !this.stripeEnabled) {
      throw new BadRequestException('Payment features are not configured. Please contact support.');
    }
  }

  async getSubscription(userId: string): Promise<Subscription> {
    let subscription = await this.subscriptionRepository.findOne({
      where: { user_id: userId },
    });

    if (!subscription) {
      subscription = await this.createSubscription(userId);
    }

    return subscription;
  }

  async createSubscription(userId: string): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create({
      user_id: userId,
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      usage_reset_date: this.getNextMonthStart(),
    });

    return this.subscriptionRepository.save(subscription);
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string }> {
    this.ensureStripeEnabled();

    if (dto.tier === SubscriptionTier.FREE) {
      throw new BadRequestException('Cannot create checkout session for free tier');
    }

    const subscription = await this.getSubscription(userId);

    // Get or create Stripe customer
    let customerId = subscription.stripe_customer_id;
    if (!customerId) {
      const customer = await this.stripe!.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
      subscription.stripe_customer_id = customerId;
      await this.subscriptionRepository.save(subscription);
    }

    // Get price ID based on tier
    const priceId = this.getPriceIdForTier(dto.tier);

    // Create checkout session
    const session = await this.stripe!.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: dto.success_url || `${this.configService.get('FRONTEND_URL')}/subscription/success`,
      cancel_url: dto.cancel_url || `${this.configService.get('FRONTEND_URL')}/subscription/cancel`,
      metadata: {
        userId,
        tier: dto.tier,
      },
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    this.ensureStripeEnabled();

    const subscription = await this.getSubscription(userId);

    if (!subscription.stripe_customer_id) {
      throw new BadRequestException('No Stripe customer found');
    }

    const session = await this.stripe!.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${this.configService.get('FRONTEND_URL')}/subscription`,
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    this.ensureStripeEnabled();

    let event: Stripe.Event;

    try {
      event = this.stripe!.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  async getUsageStats(userId: string): Promise<any> {
    const subscription = await this.getSubscription(userId);
    const limits = this.getLimitsForTier(subscription.tier);

    return {
      tier: subscription.tier,
      status: subscription.status,
      limits,
      usage: {
        applications: {
          used: subscription.applications_this_month,
          limit: limits.applications,
          remaining: limits.applications === -1 ? -1 : limits.applications - subscription.applications_this_month,
        },
        ai_cover_letters: {
          used: subscription.ai_cover_letters_this_month,
          limit: limits.ai_cover_letters,
          remaining: limits.ai_cover_letters === -1 ? -1 : limits.ai_cover_letters - subscription.ai_cover_letters_this_month,
        },
        resume_uploads: {
          used: subscription.resume_uploads,
          limit: limits.resume_uploads,
          remaining: limits.resume_uploads === -1 ? -1 : limits.resume_uploads - subscription.resume_uploads,
        },
      },
      reset_date: subscription.usage_reset_date,
    };
  }

  async incrementUsage(userId: string, feature: string): Promise<void> {
    const subscription = await this.getSubscription(userId);

    // Check if we need to reset usage
    if (new Date() > subscription.usage_reset_date) {
      await this.resetMonthlyUsage(subscription);
    }

    // Increment the appropriate counter
    switch (feature) {
      case 'application':
        subscription.applications_this_month++;
        break;
      case 'ai_cover_letter':
        subscription.ai_cover_letters_this_month++;
        break;
      case 'resume_upload':
        subscription.resume_uploads++;
        break;
    }

    await this.subscriptionRepository.save(subscription);
  }

  async canUseFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    const limits = this.getLimitsForTier(subscription.tier);

    // Check if we need to reset usage
    if (new Date() > subscription.usage_reset_date) {
      await this.resetMonthlyUsage(subscription);
    }

    switch (feature) {
      case 'application':
        return limits.applications === -1 || subscription.applications_this_month < limits.applications;
      case 'ai_cover_letter':
        return limits.ai_cover_letters === -1 || subscription.ai_cover_letters_this_month < limits.ai_cover_letters;
      case 'resume_upload':
        return limits.resume_uploads === -1 || subscription.resume_uploads < limits.resume_uploads;
      case 'auto_apply':
        return limits.auto_apply;
      case 'priority_support':
        return limits.priority_support;
      default:
        return false;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata.userId;
    const subscription = await this.getSubscription(userId);

    subscription.stripe_subscription_id = session.subscription as string;
    subscription.tier = session.metadata.tier as SubscriptionTier;
    subscription.status = SubscriptionStatus.ACTIVE;

    await this.subscriptionRepository.save(subscription);
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeSubscription.id },
    });

    if (subscription) {
      subscription.status = stripeSubscription.status as SubscriptionStatus;
      subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000);
      subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000);
      subscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;

      await this.subscriptionRepository.save(subscription);
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeSubscription.id },
    });

    if (subscription) {
      subscription.tier = SubscriptionTier.FREE;
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelled_at = new Date();

      await this.subscriptionRepository.save(subscription);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: invoice.subscription as string },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.PAST_DUE;
      await this.subscriptionRepository.save(subscription);
    }
  }

  private async resetMonthlyUsage(subscription: Subscription): Promise<void> {
    subscription.applications_this_month = 0;
    subscription.ai_cover_letters_this_month = 0;
    subscription.usage_reset_date = this.getNextMonthStart();
    await this.subscriptionRepository.save(subscription);
  }

  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  private getPriceIdForTier(tier: SubscriptionTier): string {
    const priceIds = {
      [SubscriptionTier.BASIC]: this.configService.get('STRIPE_BASIC_PRICE_ID'),
      [SubscriptionTier.PRO]: this.configService.get('STRIPE_PRO_PRICE_ID'),
      [SubscriptionTier.ENTERPRISE]: this.configService.get('STRIPE_ENTERPRISE_PRICE_ID'),
    };

    return priceIds[tier];
  }

  private getLimitsForTier(tier: SubscriptionTier): any {
    const limits = {
      [SubscriptionTier.FREE]: {
        applications: 10,
        ai_cover_letters: 3,
        resume_uploads: 1,
        auto_apply: false,
        priority_support: false,
      },
      [SubscriptionTier.BASIC]: {
        applications: 50,
        ai_cover_letters: 20,
        resume_uploads: 3,
        auto_apply: false,
        priority_support: false,
      },
      [SubscriptionTier.PRO]: {
        applications: 200,
        ai_cover_letters: 100,
        resume_uploads: 10,
        auto_apply: true,
        priority_support: true,
      },
      [SubscriptionTier.ENTERPRISE]: {
        applications: -1, // unlimited
        ai_cover_letters: -1,
        resume_uploads: -1,
        auto_apply: true,
        priority_support: true,
      },
    };

    return limits[tier];
  }
}
