/**
 * Shared Test Utilities for Payment Webhook Testing
 * Provides common helpers for Stripe, Flutterwave, and Paystack webhook tests
 */

import * as crypto from 'crypto';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';

// ============================================================================
// Common Test Data Constants
// ============================================================================

export const TEST_CONSTANTS = {
  USER_ID: 'test_user_123',
  CUSTOMER_EMAIL: 'test@example.com',

  // Stripe-specific
  STRIPE_CUSTOMER_ID: 'cus_test_stripe123',
  STRIPE_SUBSCRIPTION_ID: 'sub_test_stripe123',
  STRIPE_INVOICE_ID: 'in_test_stripe123',
  STRIPE_CHECKOUT_SESSION_ID: 'cs_test_stripe123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',

  // Flutterwave-specific
  FLW_TX_REF: 'AFU_1702000000_flw123',
  FLW_REF: 'FLW-MOCK-12345678',
  FLW_WEBHOOK_SECRET: 'flw_test_webhook_secret',

  // Paystack-specific
  PAYSTACK_REFERENCE: 'AFU_1702000000_paystack123',
  PAYSTACK_CUSTOMER_CODE: 'CUS_paystack123',
  PAYSTACK_SUBSCRIPTION_CODE: 'SUB_paystack123',
  PAYSTACK_SECRET_KEY: 'sk_test_paystack_key',
};

// ============================================================================
// Mock Database Entities
// ============================================================================

export const createMockDbSubscription = (overrides: Record<string, unknown> = {}) => ({
  id: 'db_subscription_uuid',
  userId: TEST_CONSTANTS.USER_ID,
  stripeCustomerId: TEST_CONSTANTS.STRIPE_CUSTOMER_ID,
  stripeSubscriptionId: TEST_CONSTANTS.STRIPE_SUBSCRIPTION_ID,
  tier: SubscriptionTier.BASIC,
  status: SubscriptionStatus.ACTIVE,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockDbInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: 'db_invoice_uuid',
  subscriptionId: 'db_subscription_uuid',
  stripeInvoiceId: TEST_CONSTANTS.STRIPE_INVOICE_ID,
  stripeCustomerId: TEST_CONSTANTS.STRIPE_CUSTOMER_ID,
  amount: 49.99,
  currency: 'USD',
  status: InvoiceStatus.PAID,
  paidAt: new Date(),
  invoiceUrl: 'https://invoice.example.com/test',
  invoicePdfUrl: 'https://invoice.example.com/test.pdf',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ============================================================================
// Stripe Helpers
// ============================================================================

export const StripeTestHelpers = {
  /**
   * Generate a valid Stripe webhook signature
   */
  generateSignature(payload: string | Buffer, secret: string, timestamp?: number): string {
    const time = timestamp || Math.floor(Date.now() / 1000);
    const payloadString = Buffer.isBuffer(payload) ? payload.toString() : payload;
    const signedPayload = `${time}.${payloadString}`;

    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return `t=${time},v1=${signature}`;
  },

  /**
   * Generate an expired Stripe signature for testing timestamp validation
   */
  generateExpiredSignature(payload: string | Buffer, secret: string, minutesAgo = 10): string {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - minutesAgo * 60;
    return this.generateSignature(payload, secret, expiredTimestamp);
  },

  /**
   * Generate an invalid signature for testing signature validation failures
   */
  generateInvalidSignature(): string {
    const time = Math.floor(Date.now() / 1000);
    const invalidSignature = crypto.randomBytes(32).toString('hex');
    return `t=${time},v1=${invalidSignature}`;
  },

  /**
   * Create mock Stripe event
   */
  createEvent<T>(
    type: string,
    data: T,
    options: { id?: string; livemode?: boolean } = {},
  ): {
    id: string;
    object: 'event';
    type: string;
    data: { object: T };
    created: number;
    livemode: boolean;
    pending_webhooks: number;
    request: null;
    api_version: string;
  } {
    return {
      id: options.id || `evt_${crypto.randomBytes(12).toString('hex')}`,
      object: 'event',
      type,
      data: { object: data },
      created: Math.floor(Date.now() / 1000),
      livemode: options.livemode || false,
      pending_webhooks: 0,
      request: null,
      api_version: '2024-11-20.acacia',
    };
  },

  /**
   * Create mock Stripe subscription
   */
  createSubscription(overrides: Record<string, unknown> = {}) {
    const now = Math.floor(Date.now() / 1000);
    return {
      id: TEST_CONSTANTS.STRIPE_SUBSCRIPTION_ID,
      object: 'subscription',
      customer: TEST_CONSTANTS.STRIPE_CUSTOMER_ID,
      status: 'active',
      current_period_start: now,
      current_period_end: now + 30 * 24 * 60 * 60,
      cancel_at_period_end: false,
      created: now,
      metadata: {
        userId: TEST_CONSTANTS.USER_ID,
        tier: SubscriptionTier.BASIC,
      },
      items: {
        object: 'list',
        data: [],
        has_more: false,
        url: '/v1/subscription_items',
      },
      ...overrides,
    };
  },

  /**
   * Create mock Stripe invoice
   */
  createInvoice(overrides: Record<string, unknown> = {}) {
    const now = Math.floor(Date.now() / 1000);
    return {
      id: TEST_CONSTANTS.STRIPE_INVOICE_ID,
      object: 'invoice',
      customer: TEST_CONSTANTS.STRIPE_CUSTOMER_ID,
      subscription: TEST_CONSTANTS.STRIPE_SUBSCRIPTION_ID,
      amount_paid: 4999,
      amount_due: 4999,
      currency: 'usd',
      status: 'paid',
      created: now,
      hosted_invoice_url: 'https://invoice.stripe.com/test',
      invoice_pdf: 'https://invoice.stripe.com/test.pdf',
      status_transitions: {
        paid_at: now,
        finalized_at: now,
        marked_uncollectible_at: null,
        voided_at: null,
      },
      ...overrides,
    };
  },

  /**
   * Create mock Stripe checkout session
   */
  createCheckoutSession(overrides: Record<string, unknown> = {}) {
    return {
      id: TEST_CONSTANTS.STRIPE_CHECKOUT_SESSION_ID,
      object: 'checkout.session',
      customer: TEST_CONSTANTS.STRIPE_CUSTOMER_ID,
      subscription: TEST_CONSTANTS.STRIPE_SUBSCRIPTION_ID,
      mode: 'subscription',
      status: 'complete',
      metadata: {
        userId: TEST_CONSTANTS.USER_ID,
        tier: SubscriptionTier.BASIC,
      },
      ...overrides,
    };
  },
};

// ============================================================================
// Flutterwave Helpers
// ============================================================================

export const FlutterwaveTestHelpers = {
  /**
   * Verify Flutterwave webhook signature (simple comparison)
   */
  verifySignature(verifyHash: string, secret: string): boolean {
    return verifyHash === secret;
  },

  /**
   * Create mock Flutterwave webhook payload
   */
  createWebhookPayload(event: string, overrides: Record<string, unknown> = {}) {
    return {
      event,
      data: {
        id: 12345678,
        tx_ref: TEST_CONSTANTS.FLW_TX_REF,
        flw_ref: TEST_CONSTANTS.FLW_REF,
        amount: 49.99,
        currency: 'USD',
        status: 'successful',
        customer: {
          email: TEST_CONSTANTS.CUSTOMER_EMAIL,
          name: 'Test User',
          phone_number: '+1234567890',
        },
        meta: {
          userId: TEST_CONSTANTS.USER_ID,
          tier: SubscriptionTier.BASIC,
          billingPeriod: 'monthly',
        },
        created_at: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  /**
   * Create mock Flutterwave transaction
   */
  createTransaction(overrides: Record<string, unknown> = {}) {
    return {
      id: 12345678,
      tx_ref: TEST_CONSTANTS.FLW_TX_REF,
      flw_ref: TEST_CONSTANTS.FLW_REF,
      amount: 49.99,
      currency: 'USD',
      status: 'successful',
      customer: {
        email: TEST_CONSTANTS.CUSTOMER_EMAIL,
        name: 'Test User',
      },
      created_at: new Date().toISOString(),
      ...overrides,
    };
  },
};

// ============================================================================
// Paystack Helpers
// ============================================================================

export const PaystackTestHelpers = {
  /**
   * Generate Paystack webhook signature
   */
  generateSignature(payload: string | Buffer, secretKey: string): string {
    return crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
  },

  /**
   * Verify Paystack webhook signature
   */
  verifySignature(payload: Buffer | string, signature: string, secretKey: string): boolean {
    const computed = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');
    return computed === signature;
  },

  /**
   * Create mock Paystack webhook payload
   */
  createWebhookPayload(event: string, overrides: Record<string, unknown> = {}) {
    return {
      event,
      data: {
        id: 12345678,
        reference: TEST_CONSTANTS.PAYSTACK_REFERENCE,
        amount: 499900, // Amount in kobo
        currency: 'NGN',
        status: 'success',
        customer: {
          email: TEST_CONSTANTS.CUSTOMER_EMAIL,
          first_name: 'Test',
          last_name: 'User',
          customer_code: TEST_CONSTANTS.PAYSTACK_CUSTOMER_CODE,
        },
        authorization: {
          authorization_code: 'AUTH_test123',
          card_type: 'visa',
          last4: '4081',
          exp_month: '12',
          exp_year: '2025',
          reusable: true,
        },
        metadata: {
          userId: TEST_CONSTANTS.USER_ID,
          tier: SubscriptionTier.BASIC,
          billingPeriod: 'monthly',
          type: 'subscription',
        },
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        ...overrides,
      },
    };
  },

  /**
   * Create mock Paystack subscription
   */
  createSubscription(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      status: 'active',
      subscription_code: TEST_CONSTANTS.PAYSTACK_SUBSCRIPTION_CODE,
      email_token: 'token123',
      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      plan: {
        name: 'BASIC Monthly',
        plan_code: 'PLN_test123',
        amount: 499900,
        interval: 'monthly',
        currency: 'NGN',
      },
      ...overrides,
    };
  },

  /**
   * Convert kobo to naira
   */
  koboToNaira(kobo: number): number {
    return kobo / 100;
  },

  /**
   * Convert naira to kobo
   */
  nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  },
};

// ============================================================================
// Common Request Helpers
// ============================================================================

export const createMockRequest = (rawBody?: Buffer) => ({
  rawBody: rawBody || Buffer.from('{}'),
});

// ============================================================================
// Period Calculation Helpers
// ============================================================================

export const PeriodHelpers = {
  /**
   * Calculate period end based on billing period
   */
  calculatePeriodEnd(
    startDate: Date,
    billingPeriod: 'monthly' | 'yearly' | 'weekly' | 'daily',
  ): Date {
    const end = new Date(startDate);
    switch (billingPeriod) {
      case 'daily':
        end.setDate(end.getDate() + 1);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 7);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'yearly':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    return end;
  },

  /**
   * Convert Unix timestamp to Date
   */
  unixToDate(timestamp: number): Date {
    return new Date(timestamp * 1000);
  },

  /**
   * Convert Date to Unix timestamp
   */
  dateToUnix(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  },
};

// ============================================================================
// Tier Mapping Helpers
// ============================================================================

export const TierHelpers = {
  /**
   * Map plan name to subscription tier
   */
  mapPlanNameToTier(planName: string): SubscriptionTier {
    const lowerName = planName.toLowerCase();

    if (lowerName.includes('starter')) return SubscriptionTier.STARTER;
    if (lowerName.includes('basic')) return SubscriptionTier.BASIC;
    if (lowerName.includes('professional') || lowerName.includes('pro')) {
      return SubscriptionTier.PROFESSIONAL;
    }
    if (lowerName.includes('advanced') || lowerName.includes('business')) {
      return SubscriptionTier.ADVANCED_CAREER;
    }
    if (
      lowerName.includes('executive') ||
      lowerName.includes('elite') ||
      lowerName.includes('enterprise')
    ) {
      return SubscriptionTier.EXECUTIVE_ELITE;
    }

    return SubscriptionTier.FREEMIUM;
  },

  /**
   * Get tier price
   */
  getTierPrice(tier: SubscriptionTier, billingPeriod: 'monthly' | 'yearly'): number {
    const prices: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
      [SubscriptionTier.FREEMIUM]: { monthly: 0, yearly: 0 },
      [SubscriptionTier.STARTER]: { monthly: 23.99, yearly: 239.99 },
      [SubscriptionTier.BASIC]: { monthly: 49.99, yearly: 499.99 },
      [SubscriptionTier.PROFESSIONAL]: { monthly: 89.99, yearly: 899.99 },
      [SubscriptionTier.ADVANCED_CAREER]: { monthly: 149.99, yearly: 1499.99 },
      [SubscriptionTier.EXECUTIVE_ELITE]: { monthly: 299.99, yearly: 2999.99 },
    };

    return prices[tier][billingPeriod];
  },
};

// ============================================================================
// Event Type Constants
// ============================================================================

export const WebhookEventTypes = {
  STRIPE: {
    CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
    CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
    CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAID: 'invoice.paid',
    INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
    INVOICE_CREATED: 'invoice.created',
    PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_INTENT_FAILED: 'payment_intent.failed',
    CHARGE_SUCCEEDED: 'charge.succeeded',
    CHARGE_FAILED: 'charge.failed',
  },
  FLUTTERWAVE: {
    CARD_TRANSACTION: 'CARD_TRANSACTION',
    CHARGE_COMPLETED: 'charge.completed',
    CHARGE_FAILED: 'charge.failed',
    SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    REFUND_COMPLETED: 'REFUND_COMPLETED',
    TRANSFER_COMPLETED: 'TRANSFER_COMPLETED',
    VBA_CREATED: 'VBA.created',
  },
  PAYSTACK: {
    CHARGE_SUCCESS: 'charge.success',
    SUBSCRIPTION_CREATE: 'subscription.create',
    SUBSCRIPTION_DISABLE: 'subscription.disable',
    SUBSCRIPTION_NOT_RENEW: 'subscription.not_renew',
    INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
    REFUND_PROCESSED: 'refund.processed',
    TRANSFER_SUCCESS: 'transfer.success',
    TRANSFER_FAILED: 'transfer.failed',
  },
};
