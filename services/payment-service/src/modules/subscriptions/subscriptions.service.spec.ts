import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { LoggingService } from '../../common/logging/logging.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let repository: Repository<Subscription>;
  let subscriptionEventClient: any;
  let loggingService: LoggingService;

  const mockSubscription: Partial<Subscription> = {
    id: 'sub_123',
    userId: 'user_123',
    tier: SubscriptionTier.BASIC,
    status: SubscriptionStatus.ACTIVE,
    stripeCustomerId: 'cus_test123',
    stripeSubscriptionId: 'sub_test123',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: jest.fn().mockReturnValue(true),
    isCanceled: jest.fn().mockReturnValue(false),
    isPastDue: jest.fn().mockReturnValue(false),
    hasAccess: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn(),
    };

    const mockEventClient = {
      emit: jest.fn(),
    };

    const mockLoggingService = {
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockRepository,
        },
        {
          provide: 'SUBSCRIPTION_SERVICE',
          useValue: mockEventClient,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    repository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    subscriptionEventClient = module.get('SUBSCRIPTION_SERVICE');
    loggingService = module.get<LoggingService>(LoggingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      userId: 'user_123',
      tier: SubscriptionTier.BASIC,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
    };

    it('should create a subscription successfully', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSubscription);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(subscriptionEventClient.emit).toHaveBeenCalledWith(
        'subscription.created',
        mockSubscription,
      );
    });

    it('should throw BadRequestException if user already has active subscription', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should allow creating subscription if existing one is canceled', async () => {
      const canceledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
        isActive: jest.fn().mockReturnValue(false),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(canceledSubscription as Subscription);
      jest.spyOn(repository, 'create').mockReturnValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSubscription);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle errors during creation', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockSubscription as Subscription);
      jest.spyOn(repository, 'save').mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return paginated subscriptions', async () => {
      const subscriptions = [mockSubscription, mockSubscription];
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([subscriptions as Subscription[], 2]);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: subscriptions,
        total: 2,
        page: 1,
        lastPage: 1,
      });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle pagination correctly', async () => {
      const subscriptions = [mockSubscription];
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([subscriptions as Subscription[], 25]);

      const result = await service.findAll(2, 10);

      expect(result).toEqual({
        data: subscriptions,
        total: 25,
        page: 2,
        lastPage: 3,
      });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should use default pagination values', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.findAll();

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should find subscription by ID successfully', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.findOne('sub_123');

      expect(result).toEqual(mockSubscription);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'sub_123' },
        relations: ['invoices'],
      });
    });

    it('should throw NotFoundException when subscription not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('sub_invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should find subscription by user ID', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.findByUserId('user_123');

      expect(result).toEqual(mockSubscription);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return null when no subscription found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findByUserId('user_invalid');

      expect(result).toBeNull();
    });
  });

  describe('findByStripeSubscriptionId', () => {
    it('should find subscription by Stripe subscription ID', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.findByStripeSubscriptionId('sub_test123');

      expect(result).toEqual(mockSubscription);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_test123' },
      });
    });
  });

  describe('findByStripeCustomerId', () => {
    it('should find subscriptions by Stripe customer ID', async () => {
      const subscriptions = [mockSubscription, mockSubscription];
      jest.spyOn(repository, 'find').mockResolvedValue(subscriptions as Subscription[]);

      const result = await service.findByStripeCustomerId('cus_test123');

      expect(result).toEqual(subscriptions);
      expect(repository.find).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_test123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    const updateDto = {
      tier: SubscriptionTier.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
    };

    it('should update subscription successfully', async () => {
      const updatedSubscription = { ...mockSubscription, ...updateDto };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(updatedSubscription as Subscription);

      const result = await service.update('sub_123', updateDto);

      expect(result).toEqual(updatedSubscription);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should emit tier.changed event when tier changes', async () => {
      const updatedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.PROFESSIONAL,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(updatedSubscription as Subscription);

      await service.update('sub_123', { tier: SubscriptionTier.PROFESSIONAL });

      expect(subscriptionEventClient.emit).toHaveBeenCalledWith(
        'subscription.tier.changed',
        expect.objectContaining({
          previousTier: SubscriptionTier.BASIC,
          newTier: SubscriptionTier.PROFESSIONAL,
        }),
      );
    });

    it('should emit status.changed event when status changes', async () => {
      const updatedSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(updatedSubscription as Subscription);

      await service.update('sub_123', { status: SubscriptionStatus.PAST_DUE });

      expect(subscriptionEventClient.emit).toHaveBeenCalledWith(
        'subscription.status.changed',
        expect.objectContaining({
          previousStatus: SubscriptionStatus.ACTIVE,
          newStatus: SubscriptionStatus.PAST_DUE,
        }),
      );
    });

    it('should throw NotFoundException when subscription not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update('sub_invalid', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel subscription immediately', async () => {
      const canceledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
        canceledAt: expect.any(Date),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(canceledSubscription as Subscription);

      const result = await service.cancel('sub_123', true);

      expect(result.status).toBe(SubscriptionStatus.CANCELED);
      expect(result.canceledAt).toBeDefined();
      expect(subscriptionEventClient.emit).toHaveBeenCalledWith(
        'subscription.canceled',
        expect.objectContaining({
          immediately: true,
        }),
      );
    });

    it('should cancel subscription at period end', async () => {
      const canceledSubscription = {
        ...mockSubscription,
        cancelAtPeriodEnd: true,
        canceledAt: null,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(canceledSubscription as Subscription);

      const result = await service.cancel('sub_123', false);

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.canceledAt).toBeNull();
    });

    it('should throw BadRequestException if already canceled', async () => {
      const canceledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
        isCanceled: jest.fn().mockReturnValue(true),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(canceledSubscription as Subscription);

      await expect(service.cancel('sub_123', true)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when subscription not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.cancel('sub_invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reactivate', () => {
    it('should reactivate canceled subscription', async () => {
      const canceledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
        isCanceled: jest.fn().mockReturnValue(true),
      };

      const reactivatedSubscription = {
        ...canceledSubscription,
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(canceledSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(reactivatedSubscription as Subscription);

      const result = await service.reactivate('sub_123');

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(result.canceledAt).toBeNull();
      expect(subscriptionEventClient.emit).toHaveBeenCalledWith(
        'subscription.reactivated',
        reactivatedSubscription,
      );
    });

    it('should reactivate subscription with cancelAtPeriodEnd flag', async () => {
      const subscription = {
        ...mockSubscription,
        cancelAtPeriodEnd: true,
        isCanceled: jest.fn().mockReturnValue(false),
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(subscription as Subscription);
      jest.spyOn(repository, 'save').mockResolvedValue(mockSubscription as Subscription);

      const result = await service.reactivate('sub_123');

      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should throw BadRequestException if subscription is not canceled', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      await expect(service.reactivate('sub_123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('downgradeToFreeTier', () => {
    it('should downgrade existing subscription to FREE tier', async () => {
      const downgradedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.FREEMIUM,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(downgradedSubscription as Subscription);

      const result = await service.downgradeToFreeTier('user_123');

      expect(result.tier).toBe(SubscriptionTier.FREEMIUM);
      expect(result.stripeCustomerId).toBeNull();
      expect(result.stripeSubscriptionId).toBeNull();
      expect(subscriptionEventClient.emit).toHaveBeenCalledWith(
        'subscription.downgraded',
        downgradedSubscription,
      );
    });

    it('should create FREE tier subscription if none exists', async () => {
      const freeSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.FREEMIUM,
        status: SubscriptionStatus.ACTIVE,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(freeSubscription as Subscription);
      jest.spyOn(repository, 'save').mockResolvedValue(freeSubscription as Subscription);

      const result = await service.downgradeToFreeTier('user_123');

      expect(result.tier).toBe(SubscriptionTier.FREEMIUM);
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user_123',
        tier: SubscriptionTier.FREEMIUM,
        status: SubscriptionStatus.ACTIVE,
      });
    });
  });

  describe('getSubscriptionLimits', () => {
    it('should return limits for FREEMIUM tier', () => {
      const limits = service.getSubscriptionLimits(SubscriptionTier.FREEMIUM);

      expect(limits).toEqual(
        expect.objectContaining({
          jobApplicationsPerMonth: 5,
          aiGeneratedCoverLetters: 2,
          resumeTemplates: 2,
          savedJobs: 10,
          emailAlerts: false,
        }),
      );
    });

    it('should return limits for PROFESSIONAL tier', () => {
      const limits = service.getSubscriptionLimits(SubscriptionTier.PROFESSIONAL);

      expect(limits).toEqual(
        expect.objectContaining({
          jobApplicationsPerMonth: 200,
          aiGeneratedCoverLetters: 100,
          resumeTemplates: -1,
          emailAlerts: true,
          prioritySupport: true,
        }),
      );
    });

    it('should return limits for EXECUTIVE_ELITE tier', () => {
      const limits = service.getSubscriptionLimits(SubscriptionTier.EXECUTIVE_ELITE);

      expect(limits).toEqual(
        expect.objectContaining({
          jobApplicationsPerMonth: -1,
          aiGeneratedCoverLetters: -1,
          resumeTemplates: -1,
          dedicatedAccountManager: true,
        }),
      );
    });
  });

  describe('checkFeatureAccess', () => {
    it('should return true for feature included in tier', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.checkFeatureAccess('user_123', 'emailAlerts');

      expect(result).toBe(true);
    });

    it('should return false for feature not included in tier', async () => {
      const freeSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.FREEMIUM,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(freeSubscription as Subscription);

      const result = await service.checkFeatureAccess('user_123', 'prioritySupport');

      expect(result).toBe(false);
    });

    it('should return false if user has no subscription', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.checkFeatureAccess('user_123', 'emailAlerts');

      expect(result).toBe(false);
    });

    it('should return false if subscription has no access', async () => {
      const expiredSubscription = {
        ...mockSubscription,
        hasAccess: jest.fn().mockReturnValue(false),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(expiredSubscription as Subscription);

      const result = await service.checkFeatureAccess('user_123', 'emailAlerts');

      expect(result).toBe(false);
    });
  });

  describe('checkUsageLimits', () => {
    it('should allow usage within limits', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.checkUsageLimits('user_123', 'jobApplications', 50);

      expect(result).toEqual({
        allowed: true,
        limit: 75,
        remaining: 25,
      });
    });

    it('should deny usage exceeding limits', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.checkUsageLimits('user_123', 'jobApplications', 75);

      expect(result).toEqual({
        allowed: false,
        limit: 75,
        remaining: 0,
      });
    });

    it('should return unlimited for -1 limit', async () => {
      const proSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.PROFESSIONAL,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(proSubscription as Subscription);

      const result = await service.checkUsageLimits(
        'user_123',
        'resumeTemplates',
        1000,
      );

      expect(result).toEqual({
        allowed: true,
        limit: -1,
        remaining: -1,
      });
    });

    it('should use FREE tier limits if no subscription', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.checkUsageLimits('user_123', 'jobApplications', 3);

      expect(result).toEqual({
        allowed: true,
        limit: 5,
        remaining: 2,
      });
    });

    it('should use FREE tier limits if subscription has no access', async () => {
      const expiredSubscription = {
        ...mockSubscription,
        hasAccess: jest.fn().mockReturnValue(false),
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(expiredSubscription as Subscription);

      const result = await service.checkUsageLimits('user_123', 'jobApplications', 3);

      expect(result.limit).toBe(5);
    });

    it('should handle different usage types', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const jobApplicationsResult = await service.checkUsageLimits(
        'user_123',
        'jobApplications',
        10,
      );
      const aiCoverLettersResult = await service.checkUsageLimits(
        'user_123',
        'aiCoverLetters',
        10,
      );
      const resumeTemplatesResult = await service.checkUsageLimits(
        'user_123',
        'resumeTemplates',
        5,
      );
      const savedJobsResult = await service.checkUsageLimits(
        'user_123',
        'savedJobs',
        100,
      );

      expect(jobApplicationsResult.limit).toBe(75);
      expect(aiCoverLettersResult.limit).toBe(40);
      expect(resumeTemplatesResult.limit).toBe(10);
      expect(savedJobsResult.limit).toBe(150);
    });

    it('should return 0 limit for unknown usage type', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.checkUsageLimits('user_123', 'unknownType', 10);

      expect(result).toEqual({
        allowed: false,
        limit: 0,
        remaining: 0,
      });
    });
  });

  describe('remove', () => {
    it('should remove subscription successfully', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockSubscription as Subscription);

      await service.remove('sub_123');

      expect(repository.remove).toHaveBeenCalledWith(mockSubscription);
    });

    it('should throw NotFoundException when subscription not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove('sub_invalid')).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('Event Emission', () => {
    it('should emit events when creating subscription', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockSubscription as Subscription);

      await service.create({
        userId: 'user_123',
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
      });

      expect(subscriptionEventClient.emit).toHaveBeenCalledWith(
        'subscription.created',
        mockSubscription,
      );
      expect(loggingService.logEvent).toHaveBeenCalledWith(
        'subscription.created',
        mockSubscription,
        'SubscriptionsService',
      );
    });

    it('should handle event emission errors gracefully', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockSubscription as Subscription);
      subscriptionEventClient.emit.mockImplementation(() => {
        throw new Error('Event emission failed');
      });

      await expect(
        service.create({
          userId: 'user_123',
          tier: SubscriptionTier.BASIC,
          status: SubscriptionStatus.ACTIVE,
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle subscription with null dates', async () => {
      const subscriptionWithNullDates = {
        ...mockSubscription,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(subscriptionWithNullDates as Subscription);

      const result = await service.findOne('sub_123');

      expect(result).toBeDefined();
    });

    it('should handle concurrent subscription updates', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockSubscription as Subscription);

      const updates = [
        service.update('sub_123', { tier: SubscriptionTier.PROFESSIONAL }),
        service.update('sub_123', { status: SubscriptionStatus.PAST_DUE }),
      ];

      await expect(Promise.all(updates)).resolves.toBeDefined();
    });

    it('should handle negative usage values gracefully', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.checkUsageLimits('user_123', 'jobApplications', -5);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should handle extremely large usage values', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockSubscription as Subscription);

      const result = await service.checkUsageLimits(
        'user_123',
        'jobApplications',
        999999,
      );

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});
