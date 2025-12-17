import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InvoicesService } from '../invoices/invoices.service';
import Stripe from 'stripe';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.log('Received Stripe webhook');

    const payload = request.rawBody;

    if (!payload) {
      this.logger.error('No raw body found in request');
      return { received: false };
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(payload, signature);
    } catch (error) {
      this.logger.error(`Webhook Error: ${error.message}`);
      return { received: false };
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case 'invoice.created':
          await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      return { received: false };
    }
  }

  /**
   * Handle checkout.session.completed event
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    this.logger.log(`Checkout session completed: ${session.id}`);

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const metadata = session.metadata || {};

    if (!subscriptionId) {
      this.logger.warn('No subscription ID in checkout session');
      return;
    }

    // Retrieve the subscription from Stripe
    const subscription = await this.stripeService.getSubscription(
      subscriptionId,
    );

    // Create subscription in our database
    await this.subscriptionsService.create({
      userId: metadata.userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      tier: (metadata.tier as SubscriptionTier) || SubscriptionTier.BASIC,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    this.logger.log(`Created subscription in database: ${subscriptionId}`);
  }

  /**
   * Handle customer.subscription.created event
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription created: ${subscription.id}`);

    const metadata = subscription.metadata || {};
    const customerId = subscription.customer as string;

    // Check if subscription already exists
    const existingSubscription =
      await this.subscriptionsService.findByStripeSubscriptionId(
        subscription.id,
      );

    if (existingSubscription) {
      this.logger.log(`Subscription already exists: ${subscription.id}`);
      return;
    }

    // Create subscription in our database
    await this.subscriptionsService.create({
      userId: metadata.userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      tier: (metadata.tier as SubscriptionTier) || SubscriptionTier.BASIC,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  /**
   * Handle customer.subscription.updated event
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription updated: ${subscription.id}`);

    const existingSubscription =
      await this.subscriptionsService.findByStripeSubscriptionId(
        subscription.id,
      );

    if (!existingSubscription) {
      this.logger.warn(
        `Subscription not found in database: ${subscription.id}`,
      );
      return;
    }

    const metadata = subscription.metadata || {};

    // Update subscription in our database
    await this.subscriptionsService.update(existingSubscription.id, {
      tier: metadata.tier
        ? (metadata.tier as SubscriptionTier)
        : existingSubscription.tier,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    this.logger.log(`Updated subscription in database: ${subscription.id}`);
  }

  /**
   * Handle customer.subscription.deleted event
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    const existingSubscription =
      await this.subscriptionsService.findByStripeSubscriptionId(
        subscription.id,
      );

    if (!existingSubscription) {
      this.logger.warn(
        `Subscription not found in database: ${subscription.id}`,
      );
      return;
    }

    // Update subscription status to canceled
    await this.subscriptionsService.update(existingSubscription.id, {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    });

    // Optionally downgrade user to FREE tier
    await this.subscriptionsService.downgradeToFreeTier(
      existingSubscription.userId,
    );

    this.logger.log(
      `Canceled subscription in database: ${subscription.id}`,
    );
  }

  /**
   * Handle invoice.paid event
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice paid: ${invoice.id}`);

    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      this.logger.warn('No subscription ID in invoice');
      return;
    }

    // Find subscription
    const subscription =
      await this.subscriptionsService.findByStripeSubscriptionId(
        subscriptionId,
      );

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for invoice: ${invoice.id}`,
      );
      return;
    }

    // Create or update invoice in our database
    await this.invoicesService.createOrUpdate({
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer as string,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: InvoiceStatus.PAID,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdfUrl: invoice.invoice_pdf || undefined,
    });

    this.logger.log(`Updated invoice in database: ${invoice.id}`);
  }

  /**
   * Handle invoice.payment_failed event
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);

    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      this.logger.warn('No subscription ID in invoice');
      return;
    }

    // Find subscription
    const subscription =
      await this.subscriptionsService.findByStripeSubscriptionId(
        subscriptionId,
      );

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for invoice: ${invoice.id}`,
      );
      return;
    }

    // Update subscription status
    await this.subscriptionsService.update(subscription.id, {
      status: SubscriptionStatus.PAST_DUE,
    });

    // Update invoice status
    await this.invoicesService.createOrUpdate({
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer as string,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: InvoiceStatus.OPEN,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdfUrl: invoice.invoice_pdf || undefined,
    });

    this.logger.log(
      `Updated subscription to past_due: ${subscription.id}`,
    );
  }

  /**
   * Handle invoice.created event
   */
  private async handleInvoiceCreated(invoice: Stripe.Invoice) {
    this.logger.log(`Invoice created: ${invoice.id}`);

    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      this.logger.warn('No subscription ID in invoice');
      return;
    }

    // Find subscription
    const subscription =
      await this.subscriptionsService.findByStripeSubscriptionId(
        subscriptionId,
      );

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for invoice: ${invoice.id}`,
      );
      return;
    }

    // Create invoice in our database
    await this.invoicesService.createOrUpdate({
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer as string,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: invoice.status === 'paid' ? InvoiceStatus.PAID : InvoiceStatus.OPEN,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdfUrl: invoice.invoice_pdf || undefined,
    });

    this.logger.log(`Created invoice in database: ${invoice.id}`);
  }
}
