import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { LoggingService } from '../../common/logging/logging.service';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let repository: Repository<Subscription>;
  let clientProxy: ClientProxy;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };

  const mockClientProxy = {
    emit: jest.fn(),
  };

  const mockLoggingService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    logEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockRepository,
        },
        {
          provide: 'SUBSCRIPTION_SERVICE',
          useValue: mockClientProxy,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    repository = module.get<Repository<Subscription>>(getRepositoryToken(Subscription));
    clientProxy = module.get<ClientProxy>('SUBSCRIPTION_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new subscription', async () => {
      const createDto = {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
      };

      const mockSubscription = {
        id: 'sub-123',
        ...createDto,
        isActive: () => true,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockSubscription);
      mockRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSubscription);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockSubscription);
      expect(mockClientProxy.emit).toHaveBeenCalledWith('subscription.created', mockSubscription);
    });
  });

  describe('findByUserId', () => {
    it('should find subscription by user ID', async () => {
      const userId = 'user-123';
      const mockSubscription = {
        id: 'sub-123',
        userId,
        tier: SubscriptionTier.BASIC,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.findByUserId(userId);

      expect(result).toEqual(mockSubscription);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getSubscriptionLimits', () => {
    it('should return correct limits for FREE tier', () => {
      const limits = service.getSubscriptionLimits(SubscriptionTier.FREE);

      expect(limits).toEqual({
        jobApplicationsPerMonth: 10,
        aiGeneratedCoverLetters: 3,
        resumeTemplates: 2,
        savedJobs: 20,
        emailAlerts: false,
        prioritySupport: false,
        advancedAnalytics: false,
        customBranding: false,
      });
    });

    it('should return correct limits for ENTERPRISE tier', () => {
      const limits = service.getSubscriptionLimits(SubscriptionTier.ENTERPRISE);

      expect(limits).toEqual({
        jobApplicationsPerMonth: -1, // unlimited
        aiGeneratedCoverLetters: -1,
        resumeTemplates: -1,
        savedJobs: -1,
        emailAlerts: true,
        prioritySupport: true,
        advancedAnalytics: true,
        customBranding: true,
      });
    });
  });

  describe('checkUsageLimits', () => {
    it('should check usage limits and return allowed status', async () => {
      const userId = 'user-123';
      const mockSubscription = {
        userId,
        tier: SubscriptionTier.BASIC,
        hasAccess: () => true,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.checkUsageLimits(userId, 'jobApplications', 30);

      expect(result).toEqual({
        allowed: true,
        limit: 50,
        remaining: 20,
      });
    });

    it('should handle unlimited limits', async () => {
      const userId = 'user-123';
      const mockSubscription = {
        userId,
        tier: SubscriptionTier.ENTERPRISE,
        hasAccess: () => true,
      };

      mockRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.checkUsageLimits(userId, 'jobApplications', 1000);

      expect(result).toEqual({
        allowed: true,
        limit: -1,
        remaining: -1,
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
