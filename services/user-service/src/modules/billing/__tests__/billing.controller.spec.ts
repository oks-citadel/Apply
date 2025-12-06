import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from '../subscription.controller';
import { SubscriptionService } from '../subscription.service';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { SubscriptionTier, SubscriptionStatus } from '../../../common/enums/subscription-tier.enum';
import { BadRequestException } from '@nestjs/common';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: SubscriptionService;

  const mockSubscriptionService = {
    getSubscription: jest.fn(),
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    handleWebhook: jest.fn(),
    getUsageStats: jest.fn(),
  };

  const mockUserId = 'test-user-id';
  const mockEmail = 'test@example.com';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscription', () => {
    it('should return current subscription for user', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_stripe_123',
        applications_this_month: 50,
        ai_cover_letters_this_month: 25,
        resume_uploads: 5,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockSubscriptionService.getSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.getSubscription(mockUserId);

      expect(service.getSubscription).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockSubscription);
    });

    it('should create a free subscription if none exists', async () => {
      const mockFreeSubscription = {
        id: 'sub-124',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        applications_this_month: 0,
        ai_cover_letters_this_month: 0,
        resume_uploads: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockSubscriptionService.getSubscription.mockResolvedValue(mockFreeSubscription);

      const result = await controller.getSubscription(mockUserId);

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should handle errors when fetching subscription', async () => {
      mockSubscriptionService.getSubscription.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.getSubscription(mockUserId)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for PRO tier', async () => {
      const dto: CreateCheckoutSessionDto = {
        tier: SubscriptionTier.PRO,
        success_url: 'http://localhost:3000/subscription/success',
        cancel_url: 'http://localhost:3000/subscription/cancel',
      };

      const mockCheckoutUrl = {
        url: 'https://checkout.stripe.com/session_123',
      };

      mockSubscriptionService.createCheckoutSession.mockResolvedValue(mockCheckoutUrl);

      const result = await controller.createCheckoutSession(mockUserId, mockEmail, dto);

      expect(service.createCheckoutSession).toHaveBeenCalledWith(
        mockUserId,
        mockEmail,
        dto
      );
      expect(result.url).toBe(mockCheckoutUrl.url);
    });

    it('should create checkout session for BASIC tier', async () => {
      const dto: CreateCheckoutSessionDto = {
        tier: SubscriptionTier.BASIC,
      };

      const mockCheckoutUrl = {
        url: 'https://checkout.stripe.com/session_456',
      };

      mockSubscriptionService.createCheckoutSession.mockResolvedValue(mockCheckoutUrl);

      const result = await controller.createCheckoutSession(mockUserId, mockEmail, dto);

      expect(result.url).toBe(mockCheckoutUrl.url);
    });

    it('should create checkout session for ENTERPRISE tier', async () => {
      const dto: CreateCheckoutSessionDto = {
        tier: SubscriptionTier.ENTERPRISE,
      };

      const mockCheckoutUrl = {
        url: 'https://checkout.stripe.com/session_789',
      };

      mockSubscriptionService.createCheckoutSession.mockResolvedValue(mockCheckoutUrl);

      const result = await controller.createCheckoutSession(mockUserId, mockEmail, dto);

      expect(result.url).toBe(mockCheckoutUrl.url);
    });

    it('should reject checkout session for FREE tier', async () => {
      const dto: CreateCheckoutSessionDto = {
        tier: SubscriptionTier.FREE,
      };

      mockSubscriptionService.createCheckoutSession.mockRejectedValue(
        new BadRequestException('Cannot create checkout session for free tier')
      );

      await expect(
        controller.createCheckoutSession(mockUserId, mockEmail, dto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should use default URLs if not provided', async () => {
      const dto: CreateCheckoutSessionDto = {
        tier: SubscriptionTier.PRO,
      };

      const mockCheckoutUrl = {
        url: 'https://checkout.stripe.com/session_default',
      };

      mockSubscriptionService.createCheckoutSession.mockResolvedValue(mockCheckoutUrl);

      await controller.createCheckoutSession(mockUserId, mockEmail, dto);

      expect(service.createCheckoutSession).toHaveBeenCalledWith(
        mockUserId,
        mockEmail,
        dto
      );
    });

    it('should handle Stripe API errors', async () => {
      const dto: CreateCheckoutSessionDto = {
        tier: SubscriptionTier.PRO,
      };

      mockSubscriptionService.createCheckoutSession.mockRejectedValue(
        new Error('Stripe API error: Invalid API key')
      );

      await expect(
        controller.createCheckoutSession(mockUserId, mockEmail, dto)
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('createPortalSession', () => {
    it('should create customer portal session', async () => {
      const mockPortalUrl = {
        url: 'https://billing.stripe.com/session_123',
      };

      mockSubscriptionService.createPortalSession.mockResolvedValue(mockPortalUrl);

      const result = await controller.createPortalSession(mockUserId);

      expect(service.createPortalSession).toHaveBeenCalledWith(mockUserId);
      expect(result.url).toBe(mockPortalUrl.url);
    });

    it('should fail if no Stripe customer exists', async () => {
      mockSubscriptionService.createPortalSession.mockRejectedValue(
        new BadRequestException('No Stripe customer found')
      );

      await expect(controller.createPortalSession(mockUserId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle portal session creation errors', async () => {
      mockSubscriptionService.createPortalSession.mockRejectedValue(
        new Error('Failed to create portal session')
      );

      await expect(controller.createPortalSession(mockUserId)).rejects.toThrow(
        'Failed to create portal session'
      );
    });
  });

  describe('handleWebhook', () => {
    it('should process checkout.session.completed webhook', async () => {
      const mockRequest = {
        rawBody: Buffer.from('webhook_payload'),
      };
      const mockSignature = 'stripe_signature_123';

      mockSubscriptionService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(mockRequest as any, mockSignature);

      expect(service.handleWebhook).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockSignature
      );
      expect(result).toEqual({ received: true });
    });

    it('should process customer.subscription.updated webhook', async () => {
      const mockRequest = {
        rawBody: Buffer.from('subscription_updated_payload'),
      };
      const mockSignature = 'stripe_signature_456';

      mockSubscriptionService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(mockRequest as any, mockSignature);

      expect(result).toEqual({ received: true });
    });

    it('should process customer.subscription.deleted webhook', async () => {
      const mockRequest = {
        rawBody: Buffer.from('subscription_deleted_payload'),
      };
      const mockSignature = 'stripe_signature_789';

      mockSubscriptionService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(mockRequest as any, mockSignature);

      expect(result).toEqual({ received: true });
    });

    it('should process invoice.payment_failed webhook', async () => {
      const mockRequest = {
        rawBody: Buffer.from('payment_failed_payload'),
      };
      const mockSignature = 'stripe_signature_012';

      mockSubscriptionService.handleWebhook.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(mockRequest as any, mockSignature);

      expect(result).toEqual({ received: true });
    });

    it('should reject webhook with invalid signature', async () => {
      const mockRequest = {
        rawBody: Buffer.from('webhook_payload'),
      };
      const invalidSignature = 'invalid_signature';

      mockSubscriptionService.handleWebhook.mockRejectedValue(
        new BadRequestException('Webhook Error: Invalid signature')
      );

      await expect(
        controller.handleWebhook(mockRequest as any, invalidSignature)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle missing signature header', async () => {
      const mockRequest = {
        rawBody: Buffer.from('webhook_payload'),
      };

      mockSubscriptionService.handleWebhook.mockRejectedValue(
        new BadRequestException('Webhook Error: Missing signature')
      );

      await expect(
        controller.handleWebhook(mockRequest as any, undefined)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics for FREE tier', async () => {
      const mockUsageStats = {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        limits: {
          applications: 10,
          ai_cover_letters: 3,
          resume_uploads: 1,
          auto_apply: false,
          priority_support: false,
        },
        usage: {
          applications: {
            used: 5,
            limit: 10,
            remaining: 5,
          },
          ai_cover_letters: {
            used: 2,
            limit: 3,
            remaining: 1,
          },
          resume_uploads: {
            used: 1,
            limit: 1,
            remaining: 0,
          },
        },
        reset_date: new Date('2024-01-01'),
      };

      mockSubscriptionService.getUsageStats.mockResolvedValue(mockUsageStats);

      const result = await controller.getUsageStats(mockUserId);

      expect(service.getUsageStats).toHaveBeenCalledWith(mockUserId);
      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.usage.applications.remaining).toBe(5);
    });

    it('should return usage statistics for PRO tier', async () => {
      const mockUsageStats = {
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        limits: {
          applications: 200,
          ai_cover_letters: 100,
          resume_uploads: 10,
          auto_apply: true,
          priority_support: true,
        },
        usage: {
          applications: {
            used: 50,
            limit: 200,
            remaining: 150,
          },
          ai_cover_letters: {
            used: 25,
            limit: 100,
            remaining: 75,
          },
          resume_uploads: {
            used: 5,
            limit: 10,
            remaining: 5,
          },
        },
        reset_date: new Date('2024-01-01'),
      };

      mockSubscriptionService.getUsageStats.mockResolvedValue(mockUsageStats);

      const result = await controller.getUsageStats(mockUserId);

      expect(result.tier).toBe(SubscriptionTier.PRO);
      expect(result.limits.auto_apply).toBe(true);
      expect(result.limits.priority_support).toBe(true);
    });

    it('should return usage statistics for ENTERPRISE tier with unlimited usage', async () => {
      const mockUsageStats = {
        tier: SubscriptionTier.ENTERPRISE,
        status: SubscriptionStatus.ACTIVE,
        limits: {
          applications: -1,
          ai_cover_letters: -1,
          resume_uploads: -1,
          auto_apply: true,
          priority_support: true,
        },
        usage: {
          applications: {
            used: 500,
            limit: -1,
            remaining: -1,
          },
          ai_cover_letters: {
            used: 250,
            limit: -1,
            remaining: -1,
          },
          resume_uploads: {
            used: 20,
            limit: -1,
            remaining: -1,
          },
        },
        reset_date: new Date('2024-01-01'),
      };

      mockSubscriptionService.getUsageStats.mockResolvedValue(mockUsageStats);

      const result = await controller.getUsageStats(mockUserId);

      expect(result.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(result.limits.applications).toBe(-1);
      expect(result.usage.applications.remaining).toBe(-1);
    });

    it('should handle expired subscription status', async () => {
      const mockUsageStats = {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.CANCELLED,
        limits: {
          applications: 10,
          ai_cover_letters: 3,
          resume_uploads: 1,
          auto_apply: false,
          priority_support: false,
        },
        usage: {
          applications: { used: 10, limit: 10, remaining: 0 },
          ai_cover_letters: { used: 3, limit: 3, remaining: 0 },
          resume_uploads: { used: 1, limit: 1, remaining: 0 },
        },
        reset_date: new Date('2024-01-01'),
      };

      mockSubscriptionService.getUsageStats.mockResolvedValue(mockUsageStats);

      const result = await controller.getUsageStats(mockUserId);

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });
});
