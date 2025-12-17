/**
 * Comprehensive Stripe Webhook Controller Tests
 * Tests for all webhook event types, signature verification, and idempotency handling
 */

// Mock Stripe SDK to avoid localStorage issues
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StripeController } from '../stripe.controller';
import { StripeService } from '../stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { InvoicesService } from '../../invoices/invoices.service';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import Stripe from 'stripe';
import * as crypto from 'crypto';

describe('StripeController - Comprehensive Webhook Tests', () => {
  let controller: StripeController;
  let stripeService: jest.Mocked<StripeService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let invoicesService: jest.Mocked<InvoicesService>;

  // Test data constants
  const TEST_USER_ID = 'user_test_123';
  const TEST_CUSTOMER_ID = 'cus_test_stripe123';
  const TEST_SUBSCRIPTION_ID = 'sub_test_stripe123';
  const TEST_INVOICE_ID = 'in_test_stripe123';
  const TEST_CHECKOUT_SESSION_ID = 'cs_test_stripe123';
  const WEBHOOK_SECRET = 'whsec_test_webhook_secret';

  // Mock database subscription
  const mockDbSubscription = {
    id: 'db_subscription_uuid',
    userId: TEST_USER_ID,
    stripeCustomerId: TEST_CUSTOMER_ID,
    stripeSubscriptionId: TEST_SUBSCRIPTION_ID,
    tier: SubscriptionTier.BASIC,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Stripe subscription object
  const createMockStripeSubscription = (overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription => ({
    id: TEST_SUBSCRIPTION_ID,
    object: 'subscription',
    customer: TEST_CUSTOMER_ID,
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    cancel_at_period_end: false,
    created: Math.floor(Date.now() / 1000),
    metadata: {
      userId: TEST_USER_ID,
      tier: SubscriptionTier.BASIC,
    },
    items: {
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/subscription_items',
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    ...overrides,
  } as Stripe.Subscription);

  // Mock Stripe checkout session object
  const createMockCheckoutSession = (overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session => ({
    id: TEST_CHECKOUT_SESSION_ID,
    object: 'checkout.session',
    customer: TEST_CUSTOMER_ID,
    subscription: TEST_SUBSCRIPTION_ID,
    mode: 'subscription',
    status: 'complete',
    metadata: {
      userId: TEST_USER_ID,
      tier: SubscriptionTier.BASIC,
    },
    ...overrides,
  } as Stripe.Checkout.Session);

  // Mock Stripe invoice object
  const createMockStripeInvoice = (overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice => {
    const now = Math.floor(Date.now() / 1000);
    return {
      id: TEST_INVOICE_ID,
      object: 'invoice',
      customer: TEST_CUSTOMER_ID,
      subscription: TEST_SUBSCRIPTION_ID,
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
  };

  // Helper to create mock webhook request
  const createMockRequest = (rawBody: Buffer = Buffer.from('test payload')) => ({
    rawBody,
  } as any);

  // Helper to create Stripe event
  const createMockStripeEvent = <T>(type: string, data: T): Stripe.Event => ({
    id: `evt_${crypto.randomBytes(12).toString('hex')}`,
    object: 'event',
    type,
    data: {
      object: data,
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
    api_version: '2024-11-20.acacia',
  } as Stripe.Event);

  beforeEach(async () => {
    const mockStripeService = {
      constructWebhookEvent: jest.fn(),
      getSubscription: jest.fn(),
    };

    const mockSubscriptionsService = {
      create: jest.fn(),
      update: jest.fn(),
      findByStripeSubscriptionId: jest.fn(),
      findByUserId: jest.fn(),
      downgradeToFreeTier: jest.fn(),
    };

    const mockInvoicesService = {
      createOrUpdate: jest.fn(),
      findByStripeInvoiceId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: InvoicesService, useValue: mockInvoicesService },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    stripeService = module.get(StripeService);
    subscriptionsService = module.get(SubscriptionsService);
    invoicesService = module.get(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Signature Verification', () => {
    it('should accept valid webhook signature', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature_hash';
      const mockEvent = createMockStripeEvent('payment_intent.succeeded', {});

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(
        mockRequest.rawBody,
        signature,
      );
    });

    it('should reject invalid webhook signature', async () => {
      const mockRequest = createMockRequest();
      const invalidSignature = 't=1614556800,v1=invalid_signature';

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Invalid webhook signature');
      });

      const result = await controller.handleWebhook(mockRequest, invalidSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject empty signature', async () => {
      const mockRequest = createMockRequest();

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No signature provided');
      });

      const result = await controller.handleWebhook(mockRequest, '');

      expect(result).toEqual({ received: false });
    });

    it('should handle missing raw body', async () => {
      const mockRequest = { rawBody: undefined } as any;
      const signature = 't=1614556800,v1=valid_signature';

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
      expect(stripeService.constructWebhookEvent).not.toHaveBeenCalled();
    });

    it('should reject expired timestamp in signature', async () => {
      const mockRequest = createMockRequest();
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 600;
      const expiredSignature = `t=${expiredTimestamp},v1=signature_hash`;

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Timestamp outside the tolerance zone');
      });

      const result = await controller.handleWebhook(mockRequest, expiredSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject malformed signature format', async () => {
      const mockRequest = createMockRequest();
      const malformedSignature = 'not_a_valid_signature_format';

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Invalid signature format');
      });

      const result = await controller.handleWebhook(mockRequest, malformedSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject signature with wrong version (v2 instead of v1)', async () => {
      const mockRequest = createMockRequest();
      const wrongVersionSignature = 't=1614556800,v2=signature_hash';

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No signatures found with expected scheme');
      });

      const result = await controller.handleWebhook(mockRequest, wrongVersionSignature);

      expect(result).toEqual({ received: false });
    });
  });

  describe('checkout.session.completed Event', () => {
    it('should create subscription when checkout session is completed', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockCheckoutSession = createMockCheckoutSession();
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('checkout.session.completed', mockCheckoutSession);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.getSubscription).toHaveBeenCalledWith(TEST_SUBSCRIPTION_ID);
      expect(subscriptionsService.create).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        stripeCustomerId: TEST_CUSTOMER_ID,
        stripeSubscriptionId: TEST_SUBSCRIPTION_ID,
        tier: SubscriptionTier.BASIC,
        status: 'active',
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
        cancelAtPeriodEnd: false,
      });
    });

    it('should handle checkout session without subscription ID', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockCheckoutSession = createMockCheckoutSession({ subscription: null });
      const mockEvent = createMockStripeEvent('checkout.session.completed', mockCheckoutSession);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.getSubscription).not.toHaveBeenCalled();
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('should handle checkout session with empty metadata', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockCheckoutSession = createMockCheckoutSession({ metadata: {} });
      const mockStripeSubscription = createMockStripeSubscription({ metadata: {} });
      const mockEvent = createMockStripeEvent('checkout.session.completed', mockCheckoutSession);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: SubscriptionTier.BASIC, // Should default to BASIC
        }),
      );
    });

    it('should handle different subscription tiers', async () => {
      const testCases = [
        SubscriptionTier.STARTER,
        SubscriptionTier.PROFESSIONAL,
        SubscriptionTier.ADVANCED_CAREER,
        SubscriptionTier.EXECUTIVE_ELITE,
      ];

      for (const tier of testCases) {
        jest.clearAllMocks();

        const mockRequest = createMockRequest();
        const signature = 't=1614556800,v1=valid_signature';
        const mockCheckoutSession = createMockCheckoutSession({
          metadata: { userId: TEST_USER_ID, tier },
        });
        const mockStripeSubscription = createMockStripeSubscription();
        const mockEvent = createMockStripeEvent('checkout.session.completed', mockCheckoutSession);

        stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
        stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
        subscriptionsService.create.mockResolvedValue({ ...mockDbSubscription, tier } as any);

        const result = await controller.handleWebhook(mockRequest, signature);

        expect(result).toEqual({ received: true });
        expect(subscriptionsService.create).toHaveBeenCalledWith(
          expect.objectContaining({ tier }),
        );
      }
    });
  });

  describe('customer.subscription.created Event', () => {
    it('should create subscription when it does not exist', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.findByStripeSubscriptionId).toHaveBeenCalledWith(TEST_SUBSCRIPTION_ID);
      expect(subscriptionsService.create).toHaveBeenCalled();
    });

    it('should skip creation when subscription already exists (idempotency)', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('should handle subscription with trialing status', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription({ status: 'trialing' });
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);
      subscriptionsService.create.mockResolvedValue({ ...mockDbSubscription, status: SubscriptionStatus.TRIALING } as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'trialing' }),
      );
    });
  });

  describe('customer.subscription.updated Event', () => {
    it('should update existing subscription', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription({
        status: 'past_due',
        cancel_at_period_end: true,
      });
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.PAST_DUE,
        cancelAtPeriodEnd: true,
      } as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        expect.objectContaining({
          status: 'past_due',
          cancelAtPeriodEnd: true,
        }),
      );
    });

    it('should handle subscription update when not found in database', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
    });

    it('should update tier from metadata when changed', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription({
        metadata: { userId: TEST_USER_ID, tier: SubscriptionTier.PROFESSIONAL },
      });
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        tier: SubscriptionTier.PROFESSIONAL,
      } as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        expect.objectContaining({
          tier: SubscriptionTier.PROFESSIONAL,
        }),
      );
    });
  });

  describe('customer.subscription.deleted Event', () => {
    it('should cancel subscription and downgrade to free tier', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription({ status: 'canceled' });
      const mockEvent = createMockStripeEvent('customer.subscription.deleted', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.CANCELED,
      } as any);
      subscriptionsService.downgradeToFreeTier.mockResolvedValue({
        ...mockDbSubscription,
        tier: SubscriptionTier.FREEMIUM,
      } as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        expect.objectContaining({
          status: SubscriptionStatus.CANCELED,
          canceledAt: expect.any(Date),
        }),
      );
      expect(subscriptionsService.downgradeToFreeTier).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should handle subscription deletion when not found', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('customer.subscription.deleted', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
      expect(subscriptionsService.downgradeToFreeTier).not.toHaveBeenCalled();
    });
  });

  describe('invoice.paid Event', () => {
    it('should create invoice record when payment succeeds', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice();
      const mockEvent = createMockStripeEvent('invoice.paid', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith({
        subscriptionId: mockDbSubscription.id,
        stripeInvoiceId: TEST_INVOICE_ID,
        stripeCustomerId: TEST_CUSTOMER_ID,
        amount: 49.99, // 4999 cents / 100
        currency: 'usd',
        status: InvoiceStatus.PAID,
        paidAt: expect.any(Date),
        invoiceUrl: mockInvoice.hosted_invoice_url,
        invoicePdfUrl: mockInvoice.invoice_pdf,
      });
    });

    it('should handle invoice without subscription ID', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice({ subscription: null as any });
      const mockEvent = createMockStripeEvent('invoice.paid', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).not.toHaveBeenCalled();
    });

    it('should handle invoice when subscription not found', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice();
      const mockEvent = createMockStripeEvent('invoice.paid', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).not.toHaveBeenCalled();
    });

    it('should handle invoice without status_transitions.paid_at', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice({
        status_transitions: {
          paid_at: null,
          finalized_at: null,
          marked_uncollectible_at: null,
          voided_at: null,
        },
      });
      const mockEvent = createMockStripeEvent('invoice.paid', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          paidAt: expect.any(Date),
        }),
      );
    });
  });

  describe('invoice.payment_failed Event', () => {
    it('should update subscription to past_due when payment fails', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice({ status: 'open' });
      const mockEvent = createMockStripeEvent('invoice.payment_failed', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.PAST_DUE,
      } as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        { status: SubscriptionStatus.PAST_DUE },
      );
      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvoiceStatus.OPEN,
        }),
      );
    });

    it('should handle payment failure when subscription not found', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice();
      const mockEvent = createMockStripeEvent('invoice.payment_failed', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
    });
  });

  describe('invoice.created Event', () => {
    it('should record new invoice in database', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice({ status: 'draft' });
      const mockEvent = createMockStripeEvent('invoice.created', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).toHaveBeenCalled();
    });
  });

  describe('Idempotency Handling', () => {
    it('should handle duplicate checkout.session.completed events', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockCheckoutSession = createMockCheckoutSession();
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('checkout.session.completed', mockCheckoutSession);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

      // Process event first time
      const result1 = await controller.handleWebhook(mockRequest, signature);
      expect(result1).toEqual({ received: true });

      // Reset and simulate duplicate event
      jest.clearAllMocks();
      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

      // Process duplicate event
      const result2 = await controller.handleWebhook(mockRequest, signature);
      expect(result2).toEqual({ received: true });
    });

    it('should handle duplicate customer.subscription.created events idempotently', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('customer.subscription.created', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      // First call: subscription doesn't exist
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValueOnce(null);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

      const result1 = await controller.handleWebhook(mockRequest, signature);
      expect(result1).toEqual({ received: true });
      expect(subscriptionsService.create).toHaveBeenCalled();

      // Reset and simulate duplicate event
      jest.clearAllMocks();
      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      // Second call: subscription already exists
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);

      const result2 = await controller.handleWebhook(mockRequest, signature);
      expect(result2).toEqual({ received: true });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('should handle multiple webhooks processed concurrently', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';

      const event1 = createMockStripeEvent('invoice.paid', createMockStripeInvoice());
      const event2 = createMockStripeEvent('customer.subscription.updated', createMockStripeSubscription());

      stripeService.constructWebhookEvent
        .mockReturnValueOnce(event1)
        .mockReturnValueOnce(event2);

      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const results = await Promise.all([
        controller.handleWebhook(mockRequest, signature),
        controller.handleWebhook(mockRequest, signature),
      ]);

      expect(results).toEqual([{ received: true }, { received: true }]);
    });
  });

  describe('Error Handling', () => {
    it('should return received: false when event processing throws error', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockCheckoutSession = createMockCheckoutSession();
      const mockEvent = createMockStripeEvent('checkout.session.completed', mockCheckoutSession);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockRejectedValue(new Error('Database error'));

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
    });

    it('should handle subscription service errors gracefully', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = createMockStripeSubscription();
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockRejectedValue(
        new Error('Subscription lookup failed'),
      );

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
    });

    it('should handle invoice service errors gracefully', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockInvoice = createMockStripeInvoice();
      const mockEvent = createMockStripeEvent('invoice.paid', mockInvoice);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockRejectedValue(new Error('Invoice creation failed'));

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
    });
  });

  describe('Unhandled Event Types', () => {
    it('should handle unknown event types gracefully', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockEvent = createMockStripeEvent('payment_method.attached', {});

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
    });

    it('should handle charge.succeeded event', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockEvent = createMockStripeEvent('charge.succeeded', {
        id: 'ch_test123',
        amount: 4999,
        currency: 'usd',
      });

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
    });

    it('should handle payment_intent.succeeded event', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockEvent = createMockStripeEvent('payment_intent.succeeded', {
        id: 'pi_test123',
        amount: 4999,
        currency: 'usd',
        status: 'succeeded',
      });

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large payload', async () => {
      const largePayload = Buffer.from('x'.repeat(1024 * 1024)); // 1MB payload
      const mockRequest = { rawBody: largePayload } as any;
      const signature = 't=1614556800,v1=valid_signature';
      const mockEvent = createMockStripeEvent('invoice.paid', createMockStripeInvoice());

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(largePayload, signature);
    });

    it('should handle null metadata in subscription', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const mockStripeSubscription = {
        ...createMockStripeSubscription(),
        metadata: null,
      } as unknown as Stripe.Subscription;
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue(mockDbSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
    });

    it('should handle subscription with cancel_at field', async () => {
      const mockRequest = createMockRequest();
      const signature = 't=1614556800,v1=valid_signature';
      const cancelAt = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);
      const mockStripeSubscription = createMockStripeSubscription({
        cancel_at: cancelAt,
        cancel_at_period_end: false,
      });
      const mockEvent = createMockStripeEvent('customer.subscription.updated', mockStripeSubscription);

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue(mockDbSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
    });

    it('should handle invoice with different currencies', async () => {
      const currencies = ['eur', 'gbp', 'cad', 'aud'];

      for (const currency of currencies) {
        jest.clearAllMocks();

        const mockRequest = createMockRequest();
        const signature = 't=1614556800,v1=valid_signature';
        const mockInvoice = createMockStripeInvoice({ currency });
        const mockEvent = createMockStripeEvent('invoice.paid', mockInvoice);

        stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
        subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
        invoicesService.createOrUpdate.mockResolvedValue({} as any);

        const result = await controller.handleWebhook(mockRequest, signature);

        expect(result).toEqual({ received: true });
        expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ currency }),
        );
      }
    });
  });
});
