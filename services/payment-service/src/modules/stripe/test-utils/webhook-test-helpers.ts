import Stripe from 'stripe';
import * as crypto from 'crypto';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';

/**
 * Test utilities for Stripe webhook testing
 */

/**
 * Generate a valid Stripe webhook signature for testing
 * This mimics Stripe's signature generation process
 */
export function generateWebhookSignature(
  payload: string | Buffer,
  secret: string,
  timestamp?: number,
): string {
  const time = timestamp || Math.floor(Date.now() / 1000);
  const payloadString = Buffer.isBuffer(payload) ? payload.toString() : payload;
  const signedPayload = `${time}.${payloadString}`;

  const signature = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  return `t=${time},v1=${signature}`;
}

/**
 * Generate an expired webhook signature for testing timestamp validation
 */
export function generateExpiredWebhookSignature(
  payload: string | Buffer,
  secret: string,
  minutesAgo: number = 10,
): string {
  const expiredTimestamp = Math.floor(Date.now() / 1000) - minutesAgo * 60;
  return generateWebhookSignature(payload, secret, expiredTimestamp);
}

/**
 * Generate an invalid webhook signature for testing signature validation failures
 */
export function generateInvalidWebhookSignature(): string {
  const time = Math.floor(Date.now() / 1000);
  const invalidSignature = crypto.randomBytes(32).toString('hex');
  return `t=${time},v1=${invalidSignature}`;
}

/**
 * Create a mock Stripe Event object
 */
export function createMockStripeEvent<T = any>(
  type: string,
  data: T,
  options: {
    id?: string;
    created?: number;
    livemode?: boolean;
  } = {},
): Stripe.Event {
  return {
    id: options.id || `evt_${crypto.randomBytes(12).toString('hex')}`,
    object: 'event',
    type,
    data: {
      object: data,
    },
    created: options.created || Math.floor(Date.now() / 1000),
    livemode: options.livemode || false,
    pending_webhooks: 0,
    request: null,
    api_version: '2024-11-20.acacia',
  } as Stripe.Event;
}

/**
 * Create a mock Stripe Customer object
 */
export function createMockStripeCustomer(
  overrides: Partial<Stripe.Customer> = {},
): Stripe.Customer {
  return {
    id: `cus_${crypto.randomBytes(12).toString('hex')}`,
    object: 'customer',
    email: 'test@example.com',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    metadata: {},
    ...overrides,
  } as Stripe.Customer;
}

/**
 * Create a mock Stripe Subscription object
 */
export function createMockStripeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  const monthFromNow = now + 30 * 24 * 60 * 60;

  return {
    id: `sub_${crypto.randomBytes(12).toString('hex')}`,
    object: 'subscription',
    customer: overrides.customer || `cus_${crypto.randomBytes(12).toString('hex')}`,
    status: 'active',
    current_period_start: now,
    current_period_end: monthFromNow,
    cancel_at_period_end: false,
    created: now,
    items: {
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/subscription_items',
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    metadata: {},
    ...overrides,
  } as Stripe.Subscription;
}

/**
 * Create a mock Stripe Checkout Session object
 */
export function createMockCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: `cs_${crypto.randomBytes(12).toString('hex')}`,
    object: 'checkout.session',
    customer: overrides.customer || `cus_${crypto.randomBytes(12).toString('hex')}`,
    subscription: overrides.subscription || `sub_${crypto.randomBytes(12).toString('hex')}`,
    mode: 'subscription',
    status: 'complete',
    metadata: {},
    ...overrides,
  } as Stripe.Checkout.Session;
}

/**
 * Create a mock Stripe Invoice object
 */
export function createMockStripeInvoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  const now = Math.floor(Date.now() / 1000);

  return {
    id: `in_${crypto.randomBytes(12).toString('hex')}`,
    object: 'invoice',
    customer: overrides.customer || `cus_${crypto.randomBytes(12).toString('hex')}`,
    subscription: overrides.subscription || `sub_${crypto.randomBytes(12).toString('hex')}`,
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
  } as Stripe.Invoice;
}

/**
 * Create a mock webhook request object
 */
export function createMockWebhookRequest(rawBody: Buffer, signature: string): any {
  return {
    rawBody,
    headers: {
      'stripe-signature': signature,
    },
  };
}

/**
 * Create a complete webhook test scenario
 * Returns both the event and the properly signed request
 */
export function createWebhookTestScenario<T = any>(
  eventType: string,
  eventData: T,
  webhookSecret: string = 'whsec_test_secret',
): {
  event: Stripe.Event;
  request: any;
  signature: string;
  rawBody: Buffer;
} {
  const event = createMockStripeEvent(eventType, eventData);
  const rawBody = Buffer.from(JSON.stringify(event));
  const signature = generateWebhookSignature(rawBody, webhookSecret);
  const request = createMockWebhookRequest(rawBody, signature);

  return {
    event,
    request,
    signature,
    rawBody,
  };
}

/**
 * Mock subscription data builder for testing
 */
export class MockSubscriptionBuilder {
  private subscription: Partial<Stripe.Subscription>;

  constructor() {
    this.subscription = createMockStripeSubscription();
  }

  withCustomer(customerId: string): this {
    this.subscription.customer = customerId;
    return this;
  }

  withStatus(status: Stripe.Subscription.Status): this {
    this.subscription.status = status;
    return this;
  }

  withTier(tier: SubscriptionTier): this {
    this.subscription.metadata = {
      ...this.subscription.metadata,
      tier,
    };
    return this;
  }

  withMetadata(metadata: Record<string, string>): this {
    this.subscription.metadata = {
      ...this.subscription.metadata,
      ...metadata,
    };
    return this;
  }

  withCancelAtPeriodEnd(cancel: boolean): this {
    this.subscription.cancel_at_period_end = cancel;
    return this;
  }

  withPeriod(startTimestamp: number, endTimestamp: number): this {
    this.subscription.current_period_start = startTimestamp;
    this.subscription.current_period_end = endTimestamp;
    return this;
  }

  build(): Stripe.Subscription {
    return this.subscription as Stripe.Subscription;
  }
}

/**
 * Mock invoice data builder for testing
 */
export class MockInvoiceBuilder {
  private invoice: Partial<Stripe.Invoice>;

  constructor() {
    this.invoice = createMockStripeInvoice();
  }

  withCustomer(customerId: string): this {
    this.invoice.customer = customerId;
    return this;
  }

  withSubscription(subscriptionId: string): this {
    this.invoice.subscription = subscriptionId;
    return this;
  }

  withStatus(status: Stripe.Invoice.Status): this {
    this.invoice.status = status;
    return this;
  }

  withAmount(amountInCents: number): this {
    this.invoice.amount_paid = amountInCents;
    this.invoice.amount_due = amountInCents;
    return this;
  }

  withCurrency(currency: string): this {
    this.invoice.currency = currency;
    return this;
  }

  withPaidAt(timestamp: number): this {
    if (!this.invoice.status_transitions) {
      this.invoice.status_transitions = {
        paid_at: null,
        finalized_at: null,
        marked_uncollectible_at: null,
        voided_at: null,
      };
    }
    this.invoice.status_transitions.paid_at = timestamp;
    return this;
  }

  withoutStatusTransitions(): this {
    this.invoice.status_transitions = null as any;
    return this;
  }

  build(): Stripe.Invoice {
    return this.invoice as Stripe.Invoice;
  }
}

/**
 * Mock checkout session data builder for testing
 */
export class MockCheckoutSessionBuilder {
  private session: Partial<Stripe.Checkout.Session>;

  constructor() {
    this.session = createMockCheckoutSession();
  }

  withCustomer(customerId: string): this {
    this.session.customer = customerId;
    return this;
  }

  withSubscription(subscriptionId: string | null): this {
    this.session.subscription = subscriptionId;
    return this;
  }

  withMetadata(metadata: Record<string, string>): this {
    this.session.metadata = metadata;
    return this;
  }

  withStatus(status: Stripe.Checkout.Session.Status): this {
    this.session.status = status;
    return this;
  }

  build(): Stripe.Checkout.Session {
    return this.session as Stripe.Checkout.Session;
  }
}

/**
 * Generate multiple test signatures for various scenarios
 */
export const WebhookSignatureScenarios = {
  valid: (payload: Buffer, secret: string) => generateWebhookSignature(payload, secret),

  expired: (payload: Buffer, secret: string) =>
    generateExpiredWebhookSignature(payload, secret, 10),

  invalid: () => generateInvalidWebhookSignature(),

  malformed: () => 'not_a_valid_signature_format',

  wrongVersion: (payload: Buffer, secret: string) => {
    const time = Math.floor(Date.now() / 1000);
    const payloadString = Buffer.isBuffer(payload) ? payload.toString() : payload;
    const signedPayload = `${time}.${payloadString}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');
    return `t=${time},v2=${signature}`;
  },

  missingTimestamp: (payload: Buffer, secret: string) => {
    const payloadString = Buffer.isBuffer(payload) ? payload.toString() : payload;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString, 'utf8')
      .digest('hex');
    return `v1=${signature}`;
  },

  empty: () => '',

  onlyTimestamp: () => `t=${Math.floor(Date.now() / 1000)}`,
};

/**
 * Common test event scenarios
 */
export const CommonEventScenarios = {
  checkoutCompleted: (userId: string, tier: SubscriptionTier = SubscriptionTier.BASIC) => {
    const session = new MockCheckoutSessionBuilder().withMetadata({ userId, tier }).build();
    return createMockStripeEvent('checkout.session.completed', session);
  },

  subscriptionCreated: (userId: string, tier: SubscriptionTier = SubscriptionTier.BASIC) => {
    const subscription = new MockSubscriptionBuilder()
      .withMetadata({ userId, tier })
      .withStatus('active')
      .build();
    return createMockStripeEvent('customer.subscription.created', subscription);
  },

  subscriptionUpdated: (userId: string, tier: SubscriptionTier = SubscriptionTier.PROFESSIONAL) => {
    const subscription = new MockSubscriptionBuilder()
      .withMetadata({ userId, tier })
      .withStatus('active')
      .build();
    return createMockStripeEvent('customer.subscription.updated', subscription);
  },

  subscriptionDeleted: (userId: string) => {
    const subscription = new MockSubscriptionBuilder()
      .withMetadata({ userId })
      .withStatus('canceled')
      .build();
    return createMockStripeEvent('customer.subscription.deleted', subscription);
  },

  invoicePaid: (subscriptionId: string) => {
    const invoice = new MockInvoiceBuilder()
      .withSubscription(subscriptionId)
      .withStatus('paid')
      .withAmount(4999)
      .build();
    return createMockStripeEvent('invoice.paid', invoice);
  },

  invoicePaymentFailed: (subscriptionId: string) => {
    const invoice = new MockInvoiceBuilder()
      .withSubscription(subscriptionId)
      .withStatus('open')
      .withAmount(4999)
      .build();
    return createMockStripeEvent('invoice.payment_failed', invoice);
  },

  invoiceCreated: (subscriptionId: string) => {
    const invoice = new MockInvoiceBuilder()
      .withSubscription(subscriptionId)
      .withStatus('open')
      .withAmount(4999)
      .build();
    return createMockStripeEvent('invoice.created', invoice);
  },
};
