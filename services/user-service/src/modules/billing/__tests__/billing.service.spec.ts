import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Stripe from 'stripe';


import { SubscriptionTier, SubscriptionStatus } from '../../../common/enums/subscription-tier.enum';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionService } from '../subscription.service';

import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let repository: Repository<Subscription>;
  let configService: ConfigService;

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

  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';

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
    repository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription)
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscription', () => {
    it('should return existing subscription', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        applications_this_month: 50,
        ai_cover_letters_this_month: 25,
        resume_uploads: 5,
        usage_reset_date: new Date('2024-02-01'),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getSubscription(mockUserId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should create free subscription if none exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const newSubscription = {
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        applications_this_month: 0,
        ai_cover_letters_this_month: 0,
        resume_uploads: 0,
      };

      mockRepository.create.mockReturnValue(newSubscription);
      mockRepository.save.mockResolvedValue({
        ...newSubscription,
        id: 'sub-new',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.getSubscription(mockUserId);

      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.tier).toBe(SubscriptionTier.FREE);
    });
  });

  describe('createSubscription', () => {
    it('should create a new free subscription', async () => {
      const newSubscription = {
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        applications_this_month: 0,
        ai_cover_letters_this_month: 0,
        resume_uploads: 0,
      };

      mockRepository.create.mockReturnValue(newSubscription);
      mockRepository.save.mockResolvedValue({
        ...newSubscription,
        id: 'sub-123',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.createSubscription(mockUserId);

      expect(result.user_id).toBe(mockUserId);
      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should set usage reset date to next month', async () => {
      const newSubscription = {
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      };

      mockRepository.create.mockReturnValue(newSubscription);
      mockRepository.save.mockResolvedValue({
        ...newSubscription,
        id: 'sub-123',
        usage_reset_date: new Date('2024-02-01'),
      });

      const result = await service.createSubscription(mockUserId);

      expect(result.usage_reset_date).toBeDefined();
    });
  });

  describe('createCheckoutSession', () => {
    it('should throw error for FREE tier', async () => {
      const dto = {
        tier: SubscriptionTier.FREE,
      };

      await expect(
        service.createCheckoutSession(mockUserId, mockEmail, dto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should create checkout session for PRO tier', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      // Mock Stripe methods
      const createSessionMock = jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/session_123',
      });

      // Override Stripe instance
      (service as any).stripe = {
        checkout: {
          sessions: {
            create: createSessionMock,
          },
        },
      };

      const dto = {
        tier: SubscriptionTier.PRO,
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
      };

      const result = await service.createCheckoutSession(mockUserId, mockEmail, dto);

      expect(result.url).toBe('https://checkout.stripe.com/session_123');
      expect(createSessionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          mode: 'subscription',
          payment_method_types: ['card'],
        })
      );
    });

    it('should create Stripe customer if none exists', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        stripe_customer_id: null,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        stripe_customer_id: 'cus_new_123',
      });

      const createCustomerMock = jest.fn().mockResolvedValue({
        id: 'cus_new_123',
      });

      const createSessionMock = jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/session_123',
      });

      (service as any).stripe = {
        customers: {
          create: createCustomerMock,
        },
        checkout: {
          sessions: {
            create: createSessionMock,
          },
        },
      };

      const dto = {
        tier: SubscriptionTier.PRO,
      };

      await service.createCheckoutSession(mockUserId, mockEmail, dto);

      expect(createCustomerMock).toHaveBeenCalledWith({
        email: mockEmail,
        metadata: { userId: mockUserId },
      });
    });

    it('should use correct price ID for BASIC tier', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const createSessionMock = jest.fn().mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123',
      });

      (service as any).stripe = {
        checkout: {
          sessions: {
            create: createSessionMock,
          },
        },
      };

      const dto = {
        tier: SubscriptionTier.BASIC,
      };

      await service.createCheckoutSession(mockUserId, mockEmail, dto);

      expect(createSessionMock).toHaveBeenCalledWith(
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
  });

  describe('createPortalSession', () => {
    it('should create portal session for existing customer', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        stripe_customer_id: 'cus_123',
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const createPortalMock = jest.fn().mockResolvedValue({
        url: 'https://billing.stripe.com/portal_123',
      });

      (service as any).stripe = {
        billingPortal: {
          sessions: {
            create: createPortalMock,
          },
        },
      };

      const result = await service.createPortalSession(mockUserId);

      expect(result.url).toBe('https://billing.stripe.com/portal_123');
      expect(createPortalMock).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'http://localhost:3000/subscription',
      });
    });

    it('should throw error if no Stripe customer exists', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        stripe_customer_id: null,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      await expect(service.createPortalSession(mockUserId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getUsageStats', () => {
    it('should return correct usage stats for FREE tier', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        applications_this_month: 5,
        ai_cover_letters_this_month: 2,
        resume_uploads: 1,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getUsageStats(mockUserId);

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.limits.applications).toBe(10);
      expect(result.usage.applications.used).toBe(5);
      expect(result.usage.applications.remaining).toBe(5);
    });

    it('should return correct usage stats for PRO tier', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        applications_this_month: 50,
        ai_cover_letters_this_month: 25,
        resume_uploads: 5,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getUsageStats(mockUserId);

      expect(result.tier).toBe(SubscriptionTier.PRO);
      expect(result.limits.applications).toBe(200);
      expect(result.usage.applications.used).toBe(50);
      expect(result.usage.applications.remaining).toBe(150);
      expect(result.limits.auto_apply).toBe(true);
    });

    it('should return unlimited usage for ENTERPRISE tier', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.ENTERPRISE,
        status: SubscriptionStatus.ACTIVE,
        applications_this_month: 500,
        ai_cover_letters_this_month: 250,
        resume_uploads: 20,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getUsageStats(mockUserId);

      expect(result.limits.applications).toBe(-1);
      expect(result.usage.applications.remaining).toBe(-1);
    });
  });

  describe('incrementUsage', () => {
    it('should increment application usage', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        applications_this_month: 5,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        applications_this_month: 6,
      });

      await service.incrementUsage(mockUserId, 'application');

      expect(mockSubscription.applications_this_month).toBe(6);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should increment AI cover letter usage', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        ai_cover_letters_this_month: 2,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        ai_cover_letters_this_month: 3,
      });

      await service.incrementUsage(mockUserId, 'ai_cover_letter');

      expect(mockSubscription.ai_cover_letters_this_month).toBe(3);
    });

    it('should reset usage if reset date has passed', async () => {
      const pastDate = new Date('2023-12-01');
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        applications_this_month: 10,
        ai_cover_letters_this_month: 3,
        usage_reset_date: pastDate,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue(mockSubscription);

      await service.incrementUsage(mockUserId, 'application');

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('canUseFeature', () => {
    it('should return true if within limits', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        applications_this_month: 5,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.canUseFeature(mockUserId, 'application');

      expect(result).toBe(true);
    });

    it('should return false if limit exceeded', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        applications_this_month: 10,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.canUseFeature(mockUserId, 'application');

      expect(result).toBe(false);
    });

    it('should return true for unlimited features', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.ENTERPRISE,
        applications_this_month: 500,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.canUseFeature(mockUserId, 'application');

      expect(result).toBe(true);
    });

    it('should return true for PRO tier auto_apply feature', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.PRO,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.canUseFeature(mockUserId, 'auto_apply');

      expect(result).toBe(true);
    });

    it('should return false for FREE tier auto_apply feature', async () => {
      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
        usage_reset_date: new Date('2024-02-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.canUseFeature(mockUserId, 'auto_apply');

      expect(result).toBe(false);
    });
  });

  describe('handleWebhook', () => {
    it('should process valid webhook', async () => {
      const payload = Buffer.from('test_payload');
      const signature = 'valid_signature';

      const constructEventMock = jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            subscription: 'sub_123',
            metadata: {
              userId: mockUserId,
              tier: SubscriptionTier.PRO,
            },
          },
        },
      });

      (service as any).stripe = {
        webhooks: {
          constructEvent: constructEventMock,
        },
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: mockUserId,
        tier: SubscriptionTier.FREE,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);
      mockRepository.save.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.PRO,
        stripe_subscription_id: 'sub_123',
      });

      await service.handleWebhook(payload, signature);

      expect(constructEventMock).toHaveBeenCalled();
    });

    it('should throw error for invalid signature', async () => {
      const payload = Buffer.from('test_payload');
      const signature = 'invalid_signature';

      const constructEventMock = jest.fn().mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      (service as any).stripe = {
        webhooks: {
          constructEvent: constructEventMock,
        },
      };

      await expect(service.handleWebhook(payload, signature)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
