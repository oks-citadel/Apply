import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import Stripe from 'stripe';

import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

/**
 * Dunning attempt record
 */
export interface DunningAttempt {
  subscriptionId: string;
  userId: string;
  attemptNumber: number;
  attemptedAt: Date;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  failureReason?: string;
  invoiceId?: string;
  paymentIntentId?: string;
}

/**
 * Dunning configuration
 */
export interface DunningConfig {
  maxRetryAttempts: number;
  retryIntervals: number[]; // Days between retries
  gracePeriodDays: number;
  emailTemplates: {
    firstReminder: string;
    secondReminder: string;
    finalWarning: string;
    suspended: string;
  };
}

const DEFAULT_DUNNING_CONFIG: DunningConfig = {
  maxRetryAttempts: 4,
  retryIntervals: [1, 3, 5, 7], // Days: 1, 3, 5, 7 after failure
  gracePeriodDays: 14,
  emailTemplates: {
    firstReminder: 'payment-failed-1',
    secondReminder: 'payment-failed-2',
    finalWarning: 'payment-final-warning',
    suspended: 'subscription-suspended',
  },
};

/**
 * Dunning Service
 *
 * Handles automatic retry of failed payments and customer communication.
 * Implements smart retry logic with exponential backoff.
 *
 * Features:
 * - Automatic payment retry with configurable intervals
 * - Customer notification emails at each stage
 * - Grace period before subscription suspension
 * - Invoice tracking and reconciliation
 * - Metrics and analytics for payment recovery
 */
@Injectable()
export class DunningService {
  private readonly logger = new Logger(DunningService.name);
  private readonly config: DunningConfig = DEFAULT_DUNNING_CONFIG;
  private stripe: Stripe;

  // In-memory tracking (should be moved to Redis in production)
  private dunningAttempts: Map<string, DunningAttempt[]> = new Map();

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @Inject('NOTIFICATION_SERVICE')
    private notificationClient: ClientProxy,
    @Inject('STRIPE_CLIENT')
    private stripeClient: Stripe,
  ) {
    this.stripe = stripeClient;
  }

  /**
   * Scheduled job to process failed payments
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processFailedPayments(): Promise<void> {
    this.logger.log('Starting dunning process for failed payments');

    try {
      // Find subscriptions with past_due status
      const failedSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.PAST_DUE,
        },
      });

      this.logger.log(`Found ${failedSubscriptions.length} subscriptions in past_due status`);

      for (const subscription of failedSubscriptions) {
        await this.processSubscription(subscription);
      }

      // Log metrics
      this.logger.log(`Dunning process completed. Processed ${failedSubscriptions.length} subscriptions`);
    } catch (error) {
      this.logger.error(`Dunning process failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Process a single subscription for dunning
   */
  async processSubscription(subscription: Subscription): Promise<void> {
    const attempts = this.getAttempts(subscription.id);
    const lastAttempt = attempts[attempts.length - 1];
    const attemptNumber = attempts.length + 1;

    // Check if max retries exceeded
    if (attemptNumber > this.config.maxRetryAttempts) {
      await this.handleMaxRetriesExceeded(subscription);
      return;
    }

    // Check if it's time for next retry
    if (lastAttempt && !this.shouldRetry(lastAttempt, attemptNumber)) {
      return;
    }

    // Attempt payment retry
    await this.retryPayment(subscription, attemptNumber);
  }

  /**
   * Retry a failed payment
   */
  async retryPayment(subscription: Subscription, attemptNumber: number): Promise<DunningAttempt> {
    this.logger.log(`Retrying payment for subscription ${subscription.id}, attempt ${attemptNumber}`);

    const attempt: DunningAttempt = {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      attemptNumber,
      attemptedAt: new Date(),
      status: 'pending',
    };

    try {
      // Get latest invoice for the subscription
      if (!subscription.stripeSubscriptionId) {
        throw new Error('No Stripe subscription ID');
      }

      const invoices = await this.stripe.invoices.list({
        subscription: subscription.stripeSubscriptionId,
        status: 'open',
        limit: 1,
      });

      if (invoices.data.length === 0) {
        this.logger.log(`No open invoices for subscription ${subscription.id}`);
        attempt.status = 'success';
        return attempt;
      }

      const invoice = invoices.data[0];
      attempt.invoiceId = invoice.id;

      // Attempt to pay the invoice
      const paidInvoice = await this.stripe.invoices.pay(invoice.id, {
        forgive: false, // Don't forgive if payment fails
      });

      if (paidInvoice.status === 'paid') {
        attempt.status = 'success';
        await this.handlePaymentSuccess(subscription, attempt);
      } else {
        attempt.status = 'failed';
        attempt.failureReason = 'Payment not completed';
        await this.handlePaymentFailure(subscription, attempt);
      }
    } catch (error) {
      attempt.status = 'failed';
      attempt.failureReason = error.message;
      await this.handlePaymentFailure(subscription, attempt);
    }

    // Record attempt
    this.recordAttempt(subscription.id, attempt);

    return attempt;
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(subscription: Subscription, attempt: DunningAttempt): Promise<void> {
    this.logger.log(`Payment succeeded for subscription ${subscription.id}`);

    // Update subscription status
    subscription.status = SubscriptionStatus.ACTIVE;
    await this.subscriptionRepository.save(subscription);

    // Send success notification
    await this.sendNotification(subscription.userId, 'payment-success', {
      subscriptionId: subscription.id,
    });

    // Clear dunning attempts
    this.clearAttempts(subscription.id);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(subscription: Subscription, attempt: DunningAttempt): Promise<void> {
    this.logger.warn(`Payment failed for subscription ${subscription.id}: ${attempt.failureReason}`);

    // Determine which email template to use
    let emailTemplate: string;
    switch (attempt.attemptNumber) {
      case 1:
        emailTemplate = this.config.emailTemplates.firstReminder;
        break;
      case 2:
        emailTemplate = this.config.emailTemplates.secondReminder;
        break;
      case 3:
      case 4:
        emailTemplate = this.config.emailTemplates.finalWarning;
        break;
      default:
        emailTemplate = this.config.emailTemplates.firstReminder;
    }

    // Send notification
    await this.sendNotification(subscription.userId, emailTemplate, {
      subscriptionId: subscription.id,
      attemptNumber: attempt.attemptNumber,
      maxAttempts: this.config.maxRetryAttempts,
      nextRetryDate: this.getNextRetryDate(attempt.attemptNumber),
    });
  }

  /**
   * Handle when max retries are exceeded
   */
  private async handleMaxRetriesExceeded(subscription: Subscription): Promise<void> {
    this.logger.warn(`Max retries exceeded for subscription ${subscription.id}, suspending`);

    // Update subscription status to canceled/unpaid
    subscription.status = SubscriptionStatus.UNPAID;
    subscription.canceledAt = new Date();
    await this.subscriptionRepository.save(subscription);

    // Send suspension notification
    await this.sendNotification(subscription.userId, this.config.emailTemplates.suspended, {
      subscriptionId: subscription.id,
    });

    // Clear dunning attempts
    this.clearAttempts(subscription.id);
  }

  /**
   * Check if we should retry based on configured intervals
   */
  private shouldRetry(lastAttempt: DunningAttempt, nextAttemptNumber: number): boolean {
    const intervalIndex = Math.min(nextAttemptNumber - 2, this.config.retryIntervals.length - 1);
    const intervalDays = this.config.retryIntervals[intervalIndex];

    const nextRetryDate = new Date(lastAttempt.attemptedAt);
    nextRetryDate.setDate(nextRetryDate.getDate() + intervalDays);

    return new Date() >= nextRetryDate;
  }

  /**
   * Get next retry date
   */
  private getNextRetryDate(currentAttemptNumber: number): Date {
    const intervalIndex = Math.min(currentAttemptNumber - 1, this.config.retryIntervals.length - 1);
    const intervalDays = this.config.retryIntervals[intervalIndex];

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }

  /**
   * Send notification to user
   */
  private async sendNotification(
    userId: string,
    template: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      this.notificationClient.emit('notification.send', {
        userId,
        template,
        data,
        channel: 'email',
      });
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Get dunning attempts for a subscription
   */
  private getAttempts(subscriptionId: string): DunningAttempt[] {
    return this.dunningAttempts.get(subscriptionId) || [];
  }

  /**
   * Record a dunning attempt
   */
  private recordAttempt(subscriptionId: string, attempt: DunningAttempt): void {
    const attempts = this.getAttempts(subscriptionId);
    attempts.push(attempt);
    this.dunningAttempts.set(subscriptionId, attempts);
  }

  /**
   * Clear dunning attempts for a subscription
   */
  private clearAttempts(subscriptionId: string): void {
    this.dunningAttempts.delete(subscriptionId);
  }

  /**
   * Get dunning statistics
   */
  async getDunningStats(): Promise<{
    totalPastDue: number;
    recoveredThisMonth: number;
    recoveryRate: number;
    averageAttemptsToRecover: number;
  }> {
    const pastDueCount = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.PAST_DUE },
    });

    // Calculate recovery stats (simplified)
    const allAttempts = Array.from(this.dunningAttempts.values()).flat();
    const successfulAttempts = allAttempts.filter((a) => a.status === 'success');
    const recoveryRate = allAttempts.length > 0
      ? (successfulAttempts.length / allAttempts.length) * 100
      : 0;

    return {
      totalPastDue: pastDueCount,
      recoveredThisMonth: successfulAttempts.length,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      averageAttemptsToRecover: successfulAttempts.length > 0
        ? successfulAttempts.reduce((sum, a) => sum + a.attemptNumber, 0) / successfulAttempts.length
        : 0,
    };
  }
}
