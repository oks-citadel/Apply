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
import { Request } from 'express';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import Stripe from 'stripe';

describe('StripeController - Webhook Signature Validation', () => {
  let controller: StripeController;
  let stripeService: jest.Mocked<StripeService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let invoicesService: jest.Mocked<InvoicesService>;

  // Mock data
  const mockUserId = 'user_123';
  const mockCustomerId = 'cus_test123';
  const mockSubscriptionId = 'sub_test123';
  const mockInvoiceId = 'in_test123';
  const mockCheckoutSessionId = 'cs_test123';

  const mockSubscription = {
    id: 'db_sub_123',
    userId: mockUserId,
    stripeCustomerId: mockCustomerId,
    stripeSubscriptionId: mockSubscriptionId,
    tier: SubscriptionTier.BASIC,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
  };

  const mockStripeSubscription = {
    id: mockSubscriptionId,
    object: 'subscription',
    customer: mockCustomerId,
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    cancel_at_period_end: false,
    metadata: {
      userId: mockUserId,
      tier: SubscriptionTier.BASIC,
    },
    items: {
      object: 'list',
      data: [],
      has_more: false,
      url: '',
    },
  } as Partial<Stripe.Subscription> as Stripe.Subscription;

  const mockCheckoutSession = {
    id: mockCheckoutSessionId,
    object: 'checkout.session',
    customer: mockCustomerId,
    subscription: mockSubscriptionId,
    mode: 'subscription',
    status: 'complete',
    metadata: {
      userId: mockUserId,
      tier: SubscriptionTier.BASIC,
    },
  } as Partial<Stripe.Checkout.Session> as Stripe.Checkout.Session;

  const mockInvoice = {
    id: mockInvoiceId,
    object: 'invoice',
    customer: mockCustomerId,
    subscription: mockSubscriptionId,
    amount_paid: 4999,
    amount_due: 4999,
    currency: 'usd',
    status: 'paid',
    hosted_invoice_url: 'https://invoice.stripe.com/test',
    invoice_pdf: 'https://invoice.stripe.com/test.pdf',
    status_transitions: {
      paid_at: Math.floor(Date.now() / 1000),
      finalized_at: null,
      marked_uncollectible_at: null,
      voided_at: null,
    },
  } as Partial<Stripe.Invoice> as Stripe.Invoice;

  beforeEach(async () => {
    // Create mocks for all dependencies
    const mockStripeService = {
      constructWebhookEvent: jest.fn(),
      getSubscription: jest.fn(),
    };

    const mockSubscriptionsService = {
      create: jest.fn(),
      update: jest.fn(),
      findByStripeSubscriptionId: jest.fn(),
      downgradeToFreeTier: jest.fn(),
    };

    const mockInvoicesService = {
      createOrUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
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

  describe('Webhook Signature Validation', () => {
    const createMockRequest = (rawBody: Buffer) => ({
      rawBody,
    } as any);

    it('should successfully validate and process webhook with valid signature', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature_hash';
      const mockRequest = createMockRequest(rawBody);

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: mockCheckoutSession,
        },
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2024-11-20.acacia',
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(rawBody, signature);
    });

    it('should throw BadRequestException for invalid webhook signature', async () => {
      const rawBody = Buffer.from('test payload');
      const invalidSignature = 't=1614556800,v1=invalid_signature';
      const mockRequest = createMockRequest(rawBody);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Invalid webhook signature');
      });

      const result = await controller.handleWebhook(mockRequest, invalidSignature);

      expect(result).toEqual({ received: false });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(rawBody, invalidSignature);
    });

    it('should return received: false when signature header is missing', async () => {
      const rawBody = Buffer.from('test payload');
      const mockRequest = createMockRequest(rawBody);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No signature provided');
      });

      const result = await controller.handleWebhook(mockRequest, '');

      expect(result).toEqual({ received: false });
    });

    it('should return received: false when raw body is missing', async () => {
      const mockRequest = { rawBody: undefined } as any;
      const signature = 't=1614556800,v1=valid_signature';

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
      expect(stripeService.constructWebhookEvent).not.toHaveBeenCalled();
    });

    it('should reject expired timestamp in signature', async () => {
      const rawBody = Buffer.from('test payload');
      // Timestamp from far in the past (5+ minutes)
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 600;
      const expiredSignature = `t=${expiredTimestamp},v1=signature_hash`;
      const mockRequest = createMockRequest(rawBody);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Timestamp outside the tolerance zone');
      });

      const result = await controller.handleWebhook(mockRequest, expiredSignature);

      expect(result).toEqual({ received: false });
    });

    it('should handle malformed signature format', async () => {
      const rawBody = Buffer.from('test payload');
      const malformedSignature = 'not_a_valid_signature_format';
      const mockRequest = createMockRequest(rawBody);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Invalid signature format');
      });

      const result = await controller.handleWebhook(mockRequest, malformedSignature);

      expect(result).toEqual({ received: false });
    });

    it('should handle signature with wrong version', async () => {
      const rawBody = Buffer.from('test payload');
      const wrongVersionSignature = 't=1614556800,v2=signature_hash';
      const mockRequest = createMockRequest(rawBody);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No signatures found with expected scheme');
      });

      const result = await controller.handleWebhook(mockRequest, wrongVersionSignature);

      expect(result).toEqual({ received: false });
    });
  });

  describe('checkout.session.completed Event', () => {
    it('should create subscription when checkout session is completed', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: mockCheckoutSession,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.getSubscription).toHaveBeenCalledWith(mockSubscriptionId);
      expect(subscriptionsService.create).toHaveBeenCalledWith({
        userId: mockUserId,
        stripeCustomerId: mockCustomerId,
        stripeSubscriptionId: mockSubscriptionId,
        tier: SubscriptionTier.BASIC,
        status: 'active',
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
        cancelAtPeriodEnd: false,
      });
    });

    it('should handle checkout session without subscription ID', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const sessionWithoutSubscription = {
        ...mockCheckoutSession,
        subscription: null,
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: sessionWithoutSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.getSubscription).not.toHaveBeenCalled();
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.updated Event', () => {
    it('should update subscription when customer subscription is updated', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: mockStripeSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      subscriptionsService.update.mockResolvedValue({ ...mockSubscription, status: SubscriptionStatus.ACTIVE } as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.findByStripeSubscriptionId).toHaveBeenCalledWith(mockSubscriptionId);
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockSubscription.id,
        expect.objectContaining({
          status: 'active',
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
          cancelAtPeriodEnd: false,
        })
      );
    });

    it('should handle subscription update when subscription not found in database', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: mockStripeSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.deleted Event', () => {
    it('should cancel subscription and downgrade to free tier', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: mockStripeSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      subscriptionsService.update.mockResolvedValue({ ...mockSubscription, status: SubscriptionStatus.CANCELED } as any);
      subscriptionsService.downgradeToFreeTier.mockResolvedValue(null as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockSubscription.id,
        expect.objectContaining({
          status: SubscriptionStatus.CANCELED,
          canceledAt: expect.any(Date),
        })
      );
      expect(subscriptionsService.downgradeToFreeTier).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle subscription deletion when subscription not found', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: mockStripeSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
      expect(subscriptionsService.downgradeToFreeTier).not.toHaveBeenCalled();
    });
  });

  describe('invoice.paid Event', () => {
    it('should update invoice status to paid when invoice is paid', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: mockInvoice,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith({
        subscriptionId: mockSubscription.id,
        stripeInvoiceId: mockInvoiceId,
        stripeCustomerId: mockCustomerId,
        amount: 49.99, // 4999 cents / 100
        currency: 'usd',
        status: InvoiceStatus.PAID,
        paidAt: expect.any(Date),
        invoiceUrl: mockInvoice.hosted_invoice_url,
        invoicePdfUrl: mockInvoice.invoice_pdf,
      });
    });

    it('should handle invoice paid event without subscription ID', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const invoiceWithoutSubscription = {
        ...mockInvoice,
        subscription: null,
      } as Stripe.Invoice;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: invoiceWithoutSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).not.toHaveBeenCalled();
    });

    it('should handle invoice paid event when subscription not found', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: mockInvoice,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).not.toHaveBeenCalled();
    });
  });

  describe('invoice.payment_failed Event', () => {
    it('should update subscription to past_due when payment fails', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const failedInvoice = {
        ...mockInvoice,
        status: 'open',
      } as Stripe.Invoice;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: failedInvoice,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      subscriptionsService.update.mockResolvedValue({ ...mockSubscription, status: SubscriptionStatus.PAST_DUE } as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockSubscription.id,
        { status: SubscriptionStatus.PAST_DUE }
      );
      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvoiceStatus.OPEN,
        })
      );
    });

    it('should handle payment failure when subscription not found', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: mockInvoice,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
    });
  });

  describe('Idempotency - Duplicate Event Handling', () => {
    it('should handle duplicate checkout.session.completed events idempotently', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_duplicate123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: mockCheckoutSession,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockSubscription as any);

      // Process event first time
      const result1 = await controller.handleWebhook(mockRequest, signature);
      expect(result1).toEqual({ received: true });

      // Reset mocks to simulate duplicate event
      jest.clearAllMocks();
      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(mockStripeSubscription);
      subscriptionsService.create.mockResolvedValue(mockSubscription as any);

      // Process duplicate event
      const result2 = await controller.handleWebhook(mockRequest, signature);
      expect(result2).toEqual({ received: true });
    });

    it('should handle duplicate customer.subscription.created events idempotently', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_duplicate456',
        object: 'event',
        type: 'customer.subscription.created',
        data: {
          object: mockStripeSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      // First call: subscription doesn't exist
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValueOnce(null);
      subscriptionsService.create.mockResolvedValue(mockSubscription as any);

      const result1 = await controller.handleWebhook(mockRequest, signature);
      expect(result1).toEqual({ received: true });
      expect(subscriptionsService.create).toHaveBeenCalled();

      // Reset and simulate duplicate event
      jest.clearAllMocks();
      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      // Second call: subscription already exists
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);

      const result2 = await controller.handleWebhook(mockRequest, signature);
      expect(result2).toEqual({ received: true });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });
  });

  describe('Unhandled Event Types', () => {
    it('should handle unknown event types gracefully', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_unknown123',
        object: 'event',
        type: 'payment_method.attached',
        data: {
          object: {} as any,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
    });

    it('should handle customer.subscription.created event', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.created',
        data: {
          object: mockStripeSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);
      subscriptionsService.create.mockResolvedValue(mockSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.findByStripeSubscriptionId).toHaveBeenCalledWith(mockSubscriptionId);
      expect(subscriptionsService.create).toHaveBeenCalled();
    });

    it('should handle invoice.created event', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.created',
        data: {
          object: mockInvoice,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).toHaveBeenCalled();
    });
  });

  describe('Error Handling During Event Processing', () => {
    it('should return received: false when event processing throws error', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: mockCheckoutSession,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockRejectedValue(new Error('Database error'));

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
    });

    it('should handle subscription service errors gracefully', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: mockStripeSubscription,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockRejectedValue(
        new Error('Subscription lookup failed')
      );

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
    });

    it('should handle invoice service errors gracefully', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: mockInvoice,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      invoicesService.createOrUpdate.mockRejectedValue(new Error('Invoice creation failed'));

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: false });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metadata in checkout session', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const sessionWithoutMetadata = {
        ...mockCheckoutSession,
        metadata: {},
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: sessionWithoutMetadata,
        },
      } as Stripe.Event;

      const subscriptionWithoutMetadata = {
        ...mockStripeSubscription,
        metadata: {},
      };

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue(subscriptionWithoutMetadata as any);
      subscriptionsService.create.mockResolvedValue(mockSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.create).toHaveBeenCalled();
    });

    it('should handle null metadata in subscription', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const subscriptionWithNullMetadata = {
        ...mockStripeSubscription,
        metadata: null,
      };

      const mockEvent = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: subscriptionWithNullMetadata,
        },
      } as unknown as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      subscriptionsService.update.mockResolvedValue(mockSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
    });

    it('should handle invoice without status_transitions', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const invoiceWithoutTransitions = {
        ...mockInvoice,
        status_transitions: null,
      } as unknown as Stripe.Invoice;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: invoiceWithoutTransitions,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          paidAt: expect.any(Date),
        })
      );
    });

    it('should handle very large payload', async () => {
      const largePayload = Buffer.from('x'.repeat(1024 * 1024)); // 1MB payload
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody: largePayload } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_large123',
        object: 'event',
        type: 'invoice.paid',
        data: {
          object: mockInvoice,
        },
      } as Stripe.Event;

      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, signature);

      expect(result).toEqual({ received: true });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(largePayload, signature);
    });
  });

  describe('Concurrent Webhook Processing', () => {
    it('should handle multiple webhooks processed concurrently', async () => {
      const rawBody = Buffer.from('test payload');
      const signature = 't=1614556800,v1=valid_signature';
      const mockRequest = { rawBody } as any;

      const event1: Stripe.Event = {
        id: 'evt_concurrent1',
        object: 'event',
        type: 'invoice.paid',
        data: { object: mockInvoice },
      } as Stripe.Event;

      const event2: Stripe.Event = {
        id: 'evt_concurrent2',
        object: 'event',
        type: 'customer.subscription.updated',
        data: { object: mockStripeSubscription },
      } as Stripe.Event;

      stripeService.constructWebhookEvent
        .mockReturnValueOnce(event1)
        .mockReturnValueOnce(event2);

      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockSubscription as any);
      subscriptionsService.update.mockResolvedValue(mockSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const results = await Promise.all([
        controller.handleWebhook(mockRequest, signature),
        controller.handleWebhook(mockRequest, signature),
      ]);

      expect(results).toEqual([{ received: true }, { received: true }]);
    });
  });
});
