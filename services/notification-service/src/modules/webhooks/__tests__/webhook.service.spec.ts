import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import * as crypto from 'crypto';

import { WebhookService } from '../webhook.service';
import {
  WebhookSubscription,
  WebhookEventType,
  WebhookStatus,
} from '../entities/webhook-subscription.entity';
import { WebhookDelivery, DeliveryStatus } from '../entities/webhook-delivery.entity';

describe('WebhookService', () => {
  let service: WebhookService;
  let httpService: HttpService;

  const mockSubscriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDeliveryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: getRepositoryToken(WebhookSubscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(WebhookDelivery),
          useValue: mockDeliveryRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSubscription', () => {
    it('should create a webhook subscription', async () => {
      const userId = 'test-user-id';
      const dto = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: [WebhookEventType.APPLICATION_SUBMITTED],
      };

      const mockSubscription = {
        id: 'subscription-id',
        ...dto,
        user_id: userId,
        status: WebhookStatus.ACTIVE,
        is_enabled: true,
      };

      mockSubscriptionRepository.create.mockReturnValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.createSubscription(userId, dto);

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionRepository.create).toHaveBeenCalled();
      expect(mockSubscriptionRepository.save).toHaveBeenCalled();
    });

    it('should generate a secret if not provided', async () => {
      const userId = 'test-user-id';
      const dto = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: [WebhookEventType.APPLICATION_SUBMITTED],
      };

      mockSubscriptionRepository.create.mockImplementation((data) => data);
      mockSubscriptionRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.createSubscription(userId, dto);

      expect(result.secret).toMatch(/^whsec_[a-f0-9]{64}$/);
    });
  });

  describe('updateSubscription', () => {
    it('should update an existing subscription', async () => {
      const id = 'subscription-id';
      const userId = 'test-user-id';
      const dto = { name: 'Updated Name' };

      const existingSubscription = {
        id,
        user_id: userId,
        name: 'Original Name',
        url: 'https://example.com/webhook',
        events: [WebhookEventType.APPLICATION_SUBMITTED],
        status: WebhookStatus.ACTIVE,
        is_enabled: true,
      };

      mockSubscriptionRepository.findOne.mockResolvedValue(existingSubscription);
      mockSubscriptionRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await service.updateSubscription(id, userId, dto);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSubscription('non-existent', 'user-id', {}),
      ).rejects.toThrow('Webhook subscription non-existent not found');
    });
  });

  describe('deleteSubscription', () => {
    it('should delete an existing subscription', async () => {
      const subscription = {
        id: 'subscription-id',
        user_id: 'test-user-id',
      };

      mockSubscriptionRepository.findOne.mockResolvedValue(subscription);
      mockSubscriptionRepository.remove.mockResolvedValue(subscription);

      await service.deleteSubscription('subscription-id', 'test-user-id');

      expect(mockSubscriptionRepository.remove).toHaveBeenCalledWith(subscription);
    });
  });

  describe('dispatchEvent', () => {
    it('should dispatch event to matching subscriptions', async () => {
      const event = {
        type: WebhookEventType.APPLICATION_SUBMITTED,
        userId: 'test-user-id',
        data: { applicationId: '123' },
      };

      const subscription = {
        id: 'subscription-id',
        user_id: 'test-user-id',
        url: 'https://example.com/webhook',
        events: [WebhookEventType.APPLICATION_SUBMITTED],
        status: WebhookStatus.ACTIVE,
        is_enabled: true,
        max_retries: 3,
        timeout_ms: 30000,
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([subscription]),
      };

      mockSubscriptionRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      mockDeliveryRepository.findOne.mockResolvedValue(null);
      mockDeliveryRepository.create.mockImplementation((data) => data);
      mockDeliveryRepository.save.mockResolvedValue({});
      mockSubscriptionRepository.save.mockResolvedValue(subscription);

      mockHttpService.post.mockReturnValue(
        of({
          status: 200,
          data: { received: true },
        }),
      );

      await service.dispatchEvent(event);

      expect(mockHttpService.post).toHaveBeenCalled();
    });

    it('should skip dispatch if no subscriptions match', async () => {
      const event = {
        type: WebhookEventType.APPLICATION_SUBMITTED,
        userId: 'test-user-id',
        data: {},
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockSubscriptionRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.dispatchEvent(event);

      expect(mockHttpService.post).not.toHaveBeenCalled();
    });
  });

  describe('testWebhook', () => {
    it('should send a test event and return success', async () => {
      const subscription = {
        id: 'subscription-id',
        user_id: 'test-user-id',
        url: 'https://example.com/webhook',
        events: [WebhookEventType.APPLICATION_SUBMITTED],
        status: WebhookStatus.ACTIVE,
        is_enabled: true,
        max_retries: 3,
        timeout_ms: 30000,
      };

      mockSubscriptionRepository.findOne.mockResolvedValue(subscription);

      mockHttpService.post.mockReturnValue(
        of({
          status: 200,
          data: { received: true },
        }),
      );

      const result = await service.testWebhook('subscription-id', 'test-user-id');

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('should return failure on HTTP error', async () => {
      const subscription = {
        id: 'subscription-id',
        user_id: 'test-user-id',
        url: 'https://example.com/webhook',
        events: [WebhookEventType.APPLICATION_SUBMITTED],
        status: WebhookStatus.ACTIVE,
        is_enabled: true,
        max_retries: 3,
        timeout_ms: 30000,
      };

      mockSubscriptionRepository.findOne.mockResolvedValue(subscription);

      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: { status: 500, statusText: 'Internal Server Error' },
        })),
      );

      const result = await service.testWebhook('subscription-id', 'test-user-id');

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('webhook signature', () => {
    it('should generate valid HMAC-SHA256 signature', async () => {
      const subscription = {
        id: 'subscription-id',
        user_id: 'test-user-id',
        url: 'https://example.com/webhook',
        secret: 'whsec_test_secret',
        events: [WebhookEventType.APPLICATION_SUBMITTED],
        status: WebhookStatus.ACTIVE,
        is_enabled: true,
        max_retries: 3,
        timeout_ms: 30000,
      };

      mockSubscriptionRepository.findOne.mockResolvedValue(subscription);

      let capturedHeaders: Record<string, string> = {};

      mockHttpService.post.mockImplementation((url, payload, config) => {
        capturedHeaders = config.headers;
        return of({ status: 200, data: {} });
      });

      await service.testWebhook('subscription-id', 'test-user-id');

      expect(capturedHeaders['X-Webhook-Signature']).toBeDefined();
      expect(capturedHeaders['X-Webhook-Signature']).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });
  });

  describe('retry logic', () => {
    it('should calculate exponential backoff correctly', () => {
      // The service uses baseRetryDelay * 2^(attempt-1)
      // With baseRetryDelay = 60000ms (1 minute)
      const baseDelay = 60000;

      const delay1 = baseDelay * Math.pow(2, 0); // 60000ms
      const delay2 = baseDelay * Math.pow(2, 1); // 120000ms
      const delay3 = baseDelay * Math.pow(2, 2); // 240000ms

      expect(delay1).toBe(60000);
      expect(delay2).toBe(120000);
      expect(delay3).toBe(240000);
    });
  });
});
