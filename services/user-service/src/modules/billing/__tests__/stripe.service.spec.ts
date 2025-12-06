import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionService } from '../subscription.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionTier, SubscriptionStatus } from '../../../common/enums/subscription-tier.enum';

/**
 * Stripe Integration Tests
 * Tests for Stripe-specific functionality including checkout, webhooks, and billing portal
 */
describe('SubscriptionService - Stripe Integration', () => {
  let service: SubscriptionService;
  let mockStripe: any;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
        STRIPE_BASIC_PRICE_ID: 'price_basic_123',
        STRIPE_PRO_PRICE_ID: 'price_pro_123',
        STRIPE_ENTERPRISE_PRICE_ID: 'price_enterprise_123',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);

    // Mock Stripe methods
    mockStripe = {
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
          retrieve: jest.fn(),
        },
      },
      billingPortal: {
        sessions: {
          create: jest.fn(),
        },
      },
      subscriptions: {
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
      paymentMethods: {
        attach: jest.fn(),
        detach: jest.fn(),
        list: jest.fn(),
      },
      invoices: {
        retrieve: jest.fn(),
        list: jest.fn(),
      },
    };

    (service as any).stripe = mockStripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Stripe Customer Management', () => {
    it('should create a new Stripe customer', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        tier: SubscriptionTier.FREE,
        stripe_customer_id: null,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_123',
        email: 'test@example.com',
      });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/session_123',
      });

      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        stripe_customer_id: 'cus_123',
      });

      const dto = {
        tier: SubscriptionTier.PRO,
      };

      await service.createCheckoutSession('user-123', 'test@example.com', dto);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { userId: 'user-123' },
      });
    });

    it('should reuse existing Stripe customer', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        tier: SubscriptionTier.FREE,
        stripe_customer_id: 'cus_existing_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/session_123',
      });

      const dto = {
        tier: SubscriptionTier.PRO,
      };

      await service.createCheckoutSession('user-123', 'test@example.com', dto);

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing_123',
        })
      );
    });
  });

  describe('Stripe Checkout Sessions', () => {
    it('should create checkout session with correct parameters', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/session_123',
        customer: 'cus_123',
        mode: 'subscription',
      });

      const dto = {
        tier: SubscriptionTier.PRO,
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
      };

      const result = await service.createCheckoutSession(
        'user-123',
        'test@example.com',
        dto
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_pro_123',
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        metadata: {
          userId: 'user-123',
          tier: SubscriptionTier.PRO,
        },
      });

      expect(result.url).toBe('https://checkout.stripe.com/session_123');
    });

    it('should use correct price ID for BASIC tier', async () => {
      const mockSubscription = {
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123',
      });

      const dto = {
        tier: SubscriptionTier.BASIC,
      };

      await service.createCheckoutSession('user-123', 'test@example.com', dto);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_basic_123',
              quantity: 1,
            },
          ],
        })
      );
    });

    it('should use correct price ID for ENTERPRISE tier', async () => {
      const mockSubscription = {
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123',
      });

      const dto = {
        tier: SubscriptionTier.ENTERPRISE,
      };

      await service.createCheckoutSession('user-123', 'test@example.com', dto);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_enterprise_123',
              quantity: 1,
            },
          ],
        })
      );
    });

    it('should include metadata in checkout session', async () => {
      const mockSubscription = {
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123',
      });

      const dto = {
        tier: SubscriptionTier.PRO,
      };

      await service.createCheckoutSession('user-123', 'test@example.com', dto);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user-123',
            tier: SubscriptionTier.PRO,
          },
        })
      );
    });
  });

  describe('Stripe Billing Portal', () => {
    it('should create billing portal session', async () => {
      const mockSubscription = {
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/portal_123',
      });

      const result = await service.createPortalSession('user-123');

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'http://localhost:3000/subscription',
      });

      expect(result.url).toBe('https://billing.stripe.com/portal_123');
    });

    it('should use correct return URL', async () => {
      const mockSubscription = {
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/portal_123',
      });

      await service.createPortalSession('user-123');

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          return_url: 'http://localhost:3000/subscription',
        })
      );
    });
  });

  describe('Stripe Webhook Events', () => {
    it('should handle checkout.session.completed event', async () => {
      const payload = Buffer.from('test_payload');
      const signature = 'valid_signature';

      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            subscription: 'sub_stripe_123',
            customer: 'cus_123',
            metadata: {
              userId: 'user-123',
              tier: SubscriptionTier.PRO,
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        tier: SubscriptionTier.FREE,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.PRO,
        stripe_subscription_id: 'sub_stripe_123',
        status: SubscriptionStatus.ACTIVE,
      });

      await service.handleWebhook(payload, signature);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_123'
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: SubscriptionTier.PRO,
          stripe_subscription_id: 'sub_stripe_123',
          status: SubscriptionStatus.ACTIVE,
        })
      );
    });

    it('should handle customer.subscription.updated event', async () => {
      const payload = Buffer.from('test_payload');
      const signature = 'valid_signature';

      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_123',
            status: 'active',
            current_period_start: 1704067200,
            current_period_end: 1706745600,
            cancel_at_period_end: false,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockSubscription = {
        id: 'sub-123',
        stripe_subscription_id: 'sub_stripe_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue(mockSubscription);

      await service.handleWebhook(payload, signature);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          cancel_at_period_end: false,
        })
      );
    });

    it('should handle customer.subscription.deleted event', async () => {
      const payload = Buffer.from('test_payload');
      const signature = 'valid_signature';

      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_stripe_123',
            status: 'canceled',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockSubscription = {
        id: 'sub-123',
        stripe_subscription_id: 'sub_stripe_123',
        tier: SubscriptionTier.PRO,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.CANCELLED,
      });

      await service.handleWebhook(payload, signature);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.CANCELLED,
        })
      );
    });

    it('should handle invoice.payment_failed event', async () => {
      const payload = Buffer.from('test_payload');
      const signature = 'valid_signature';

      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            subscription: 'sub_stripe_123',
            attempt_count: 1,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockSubscription = {
        id: 'sub-123',
        stripe_subscription_id: 'sub_stripe_123',
        status: SubscriptionStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
      });

      await service.handleWebhook(payload, signature);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.PAST_DUE,
        })
      );
    });

    it('should log unhandled event types', async () => {
      const payload = Buffer.from('test_payload');
      const signature = 'valid_signature';

      const mockEvent = {
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_123',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const loggerSpy = jest.spyOn((service as any).logger, 'log');

      await service.handleWebhook(payload, signature);

      expect(loggerSpy).toHaveBeenCalledWith('Unhandled event type: customer.created');
    });

    it('should reject invalid webhook signatures', async () => {
      const payload = Buffer.from('test_payload');
      const invalidSignature = 'invalid_signature';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(service.handleWebhook(payload, invalidSignature)).rejects.toThrow();
    });

    it('should log webhook verification errors', async () => {
      const payload = Buffer.from('test_payload');
      const invalidSignature = 'invalid_signature';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Webhook signature verification failed');
      });

      const loggerSpy = jest.spyOn((service as any).logger, 'error');

      await expect(service.handleWebhook(payload, invalidSignature)).rejects.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Webhook signature verification failed')
      );
    });
  });

  describe('Stripe Payment Methods', () => {
    it('should handle payment method attachment', async () => {
      mockStripe.paymentMethods.attach.mockResolvedValue({
        id: 'pm_123',
        customer: 'cus_123',
      });

      const result = await mockStripe.paymentMethods.attach('pm_123', {
        customer: 'cus_123',
      });

      expect(result.customer).toBe('cus_123');
    });

    it('should handle payment method detachment', async () => {
      mockStripe.paymentMethods.detach.mockResolvedValue({
        id: 'pm_123',
        customer: null,
      });

      const result = await mockStripe.paymentMethods.detach('pm_123');

      expect(result.customer).toBeNull();
    });

    it('should list customer payment methods', async () => {
      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [
          { id: 'pm_123', type: 'card' },
          { id: 'pm_456', type: 'card' },
        ],
      });

      const result = await mockStripe.paymentMethods.list({
        customer: 'cus_123',
        type: 'card',
      });

      expect(result.data).toHaveLength(2);
    });
  });

  describe('Stripe Invoice Management', () => {
    it('should retrieve invoice details', async () => {
      mockStripe.invoices.retrieve.mockResolvedValue({
        id: 'in_123',
        customer: 'cus_123',
        amount_paid: 2999,
        status: 'paid',
      });

      const result = await mockStripe.invoices.retrieve('in_123');

      expect(result.status).toBe('paid');
      expect(result.amount_paid).toBe(2999);
    });

    it('should list customer invoices', async () => {
      mockStripe.invoices.list.mockResolvedValue({
        data: [
          { id: 'in_123', status: 'paid' },
          { id: 'in_456', status: 'paid' },
        ],
      });

      const result = await mockStripe.invoices.list({
        customer: 'cus_123',
      });

      expect(result.data).toHaveLength(2);
    });
  });

  describe('Stripe Error Handling', () => {
    it('should handle Stripe API errors', async () => {
      const mockSubscription = {
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API Error: Invalid price ID')
      );

      const dto = {
        tier: SubscriptionTier.PRO,
      };

      await expect(
        service.createCheckoutSession('user-123', 'test@example.com', dto)
      ).rejects.toThrow('Stripe API Error');
    });

    it('should handle network errors', async () => {
      const mockSubscription = {
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Network error')
      );

      const dto = {
        tier: SubscriptionTier.PRO,
      };

      await expect(
        service.createCheckoutSession('user-123', 'test@example.com', dto)
      ).rejects.toThrow('Network error');
    });
  });
});
