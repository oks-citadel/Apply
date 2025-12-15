import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionTier, SUBSCRIPTION_TIER_PRICES } from '../../common/enums/subscription-tier.enum';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Stripe integration will not work.');
    }

    this.stripe = new Stripe(stripeSecretKey || 'sk_test_dummy', {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(
    email: string,
    userId: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    try {
      this.logger.log(`Creating Stripe customer for user: ${userId}`);

      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId,
          ...metadata,
        },
      });

      this.logger.log(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Get or create a Stripe customer
   */
  async getOrCreateCustomer(
    email: string,
    userId: string,
  ): Promise<Stripe.Customer> {
    try {
      // Search for existing customer by email
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer if not found
      return await this.createCustomer(email, userId);
    } catch (error) {
      this.logger.error(`Failed to get or create customer: ${error.message}`);
      throw new BadRequestException('Failed to process customer');
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    tier: SubscriptionTier,
    billingPeriod: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Checkout.Session> {
    try {
      this.logger.log(
        `Creating checkout session for customer: ${customerId}, tier: ${tier}, period: ${billingPeriod}`,
      );

      if (tier === SubscriptionTier.FREEMIUM) {
        throw new BadRequestException('Cannot create checkout session for FREE tier');
      }

      const price = SUBSCRIPTION_TIER_PRICES[tier][billingPeriod];
      const priceInCents = Math.round(price * 100);

      // Create a price object
      const priceObject = await this.stripe.prices.create({
        unit_amount: priceInCents,
        currency: 'usd',
        recurring: {
          interval: billingPeriod === 'monthly' ? 'month' : 'year',
        },
        product_data: {
          name: `${tier} Subscription`,
          description: `${tier} tier subscription (${billingPeriod})`,
        },
      });

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceObject.id,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tier,
          billingPeriod,
          ...metadata,
        },
        subscription_data: {
          metadata: {
            tier,
            billingPeriod,
            ...metadata,
          },
        },
      });

      this.logger.log(`Created checkout session: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      this.logger.log(`Creating billing portal session for customer: ${customerId}`);

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      this.logger.log(`Created billing portal session: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create billing portal session: ${error.message}`);
      throw new BadRequestException('Failed to create billing portal session');
    }
  }

  /**
   * Get subscription from Stripe
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error(`Failed to retrieve subscription: ${error.message}`);
      throw new BadRequestException('Failed to retrieve subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
  ): Promise<Stripe.Subscription> {
    try {
      this.logger.log(`Canceling subscription: ${subscriptionId}, immediate: ${immediately}`);

      if (immediately) {
        return await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        // Cancel at period end
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier,
    billingPeriod: 'monthly' | 'yearly',
  ): Promise<Stripe.Subscription> {
    try {
      this.logger.log(
        `Updating subscription: ${subscriptionId} to tier: ${newTier}, period: ${billingPeriod}`,
      );

      const price = SUBSCRIPTION_TIER_PRICES[newTier][billingPeriod];
      const priceInCents = Math.round(price * 100);

      // Create new price
      const priceObject = await this.stripe.prices.create({
        unit_amount: priceInCents,
        currency: 'usd',
        recurring: {
          interval: billingPeriod === 'monthly' ? 'month' : 'year',
        },
        product_data: {
          name: `${newTier} Subscription`,
          description: `${newTier} tier subscription (${billingPeriod})`,
        },
      });

      // Get current subscription
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      // Update subscription
      return await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceObject.id,
          },
        ],
        metadata: {
          tier: newTier,
          billingPeriod,
        },
        proration_behavior: 'always_invoice',
      });
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`);
      throw new BadRequestException('Failed to update subscription');
    }
  }

  /**
   * Construct webhook event
   */
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      this.logger.error(`Failed to retrieve invoice: ${error.message}`);
      throw new BadRequestException('Failed to retrieve invoice');
    }
  }

  /**
   * List customer invoices
   */
  async listCustomerInvoices(
    customerId: string,
    limit: number = 10,
  ): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });
      return invoices.data;
    } catch (error) {
      this.logger.error(`Failed to list invoices: ${error.message}`);
      throw new BadRequestException('Failed to list invoices');
    }
  }
}
