import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIER_PRICES,
} from '../../common/enums/subscription-tier.enum';
import { TaxService } from '../tax/tax.service';

/**
 * Options for checkout session with tax support
 */
export interface CheckoutSessionOptions {
  customerId: string;
  tier: SubscriptionTier;
  billingPeriod: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  /** Enable Stripe Tax automatic calculation */
  enableAutomaticTax?: boolean;
  /** Allow customers to provide VAT/GST ID for B2B */
  collectTaxId?: boolean;
  /** Customer's country for tax purposes (ISO 3166-1 alpha-2) */
  customerCountry?: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private readonly enableStripeTax: boolean;

  constructor(
    private configService: ConfigService,
    private taxService: TaxService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Stripe integration will not work.');
    }

    this.stripe = new Stripe(stripeSecretKey || 'sk_test_dummy', {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    // Enable Stripe Tax if configured (requires Stripe Tax subscription)
    this.enableStripeTax = this.configService.get<boolean>('STRIPE_TAX_ENABLED', false);
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
  async getOrCreateCustomer(email: string, userId: string): Promise<Stripe.Customer> {
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
   * Create a checkout session for subscription with tax support
   *
   * Tax handling:
   * - If STRIPE_TAX_ENABLED=true, uses Stripe Tax for automatic calculation
   * - Collects customer tax IDs (VAT/GST) for B2B transactions
   * - Applies reverse charge for valid EU B2B customers
   */
  async createCheckoutSession(
    customerId: string,
    tier: SubscriptionTier,
    billingPeriod: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Checkout.Session>;

  async createCheckoutSession(options: CheckoutSessionOptions): Promise<Stripe.Checkout.Session>;

  async createCheckoutSession(
    customerIdOrOptions: string | CheckoutSessionOptions,
    tier?: SubscriptionTier,
    billingPeriod?: 'monthly' | 'yearly',
    successUrl?: string,
    cancelUrl?: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Checkout.Session> {
    // Normalize to options object
    const options: CheckoutSessionOptions =
      typeof customerIdOrOptions === 'string'
        ? {
            customerId: customerIdOrOptions,
            tier: tier!,
            billingPeriod: billingPeriod!,
            successUrl: successUrl!,
            cancelUrl: cancelUrl!,
            metadata,
            enableAutomaticTax: this.enableStripeTax,
            collectTaxId: true,
          }
        : customerIdOrOptions;

    try {
      this.logger.log(
        `Creating checkout session for customer: ${options.customerId}, tier: ${options.tier}, period: ${options.billingPeriod}, tax: ${options.enableAutomaticTax ?? this.enableStripeTax}`,
      );

      if (options.tier === SubscriptionTier.FREEMIUM) {
        throw new BadRequestException('Cannot create checkout session for FREE tier');
      }

      const price = SUBSCRIPTION_TIER_PRICES[options.tier][options.billingPeriod];
      const priceInCents = Math.round(price * 100);

      // Create a price object with tax behavior
      const priceObject = await this.stripe.prices.create({
        unit_amount: priceInCents,
        currency: 'usd',
        recurring: {
          interval: options.billingPeriod === 'monthly' ? 'month' : 'year',
        },
        product_data: {
          name: `${options.tier} Subscription`,
          // Tax code for SaaS/digital services (required for Stripe Tax)
          tax_code: 'txcd_10103001', // Software as a Service (SaaS) - Business use
        },
        // Tax behavior: exclusive means tax is added on top of the price
        tax_behavior: 'exclusive',
      });

      // Build checkout session params
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: options.customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceObject.id,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: {
          tier: options.tier,
          billingPeriod: options.billingPeriod,
          ...options.metadata,
        },
        subscription_data: {
          metadata: {
            tier: options.tier,
            billingPeriod: options.billingPeriod,
            ...options.metadata,
          },
        },
        // Enable customer to update billing address for tax purposes
        billing_address_collection: 'required',
      };

      // Enable automatic tax calculation if configured
      const useAutomaticTax = options.enableAutomaticTax ?? this.enableStripeTax;
      if (useAutomaticTax) {
        sessionParams.automatic_tax = { enabled: true };
        this.logger.log('Stripe Tax automatic calculation enabled');
      }

      // Enable tax ID collection (VAT/GST numbers for B2B)
      if (options.collectTaxId !== false) {
        sessionParams.tax_id_collection = { enabled: true };
        this.logger.log('Tax ID collection enabled for B2B customers');
      }

      // If customer country is provided, we can log the expected tax rate
      if (options.customerCountry) {
        const taxRate = this.taxService.getTaxRate(options.customerCountry);
        if (taxRate) {
          this.logger.log(
            `Expected tax for ${options.customerCountry}: ${taxRate.taxType} ${taxRate.rate}%`,
          );
        }
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(`Created checkout session: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Get tax settings for display (uses our TaxService)
   */
  getTaxRateForCountry(countryCode: string) {
    return this.taxService.getTaxRate(countryCode);
  }

  /**
   * Calculate tax preview for a given amount and country
   */
  async calculateTaxPreview(
    amount: number,
    currency: string,
    countryCode: string,
    isBusinessCustomer: boolean = false,
    taxId?: string,
  ) {
    return this.taxService.calculateTax(amount, currency, {
      countryCode,
      isBusinessCustomer,
      taxId,
    });
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
          statement_descriptor: `${newTier} tier subscription (${billingPeriod})`,
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
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
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
  async listCustomerInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
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
