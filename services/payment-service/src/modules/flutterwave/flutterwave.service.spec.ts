import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import {
  FlutterwaveService,
  FlutterwaveCustomer,
  FlutterwaveTransaction,
  FlutterwaveSubscriptionPlan,
} from './flutterwave.service';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import axios, { AxiosInstance } from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FlutterwaveService', () => {
  let service: FlutterwaveService;
  let configService: ConfigService;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  const mockCustomer: FlutterwaveCustomer = {
    email: 'test@example.com',
    name: 'Test User',
    phonenumber: '+1234567890',
  };

  const mockTransaction: FlutterwaveTransaction = {
    id: 123456,
    tx_ref: 'AFU_1234567890_abc123',
    flw_ref: 'FLW-MOCK-123456',
    amount: 49.99,
    currency: 'USD',
    status: 'successful',
    customer: mockCustomer,
    created_at: new Date().toISOString(),
  };

  const mockSubscriptionPlan: FlutterwaveSubscriptionPlan = {
    id: 1001,
    name: 'BASIC Subscription',
    amount: 49.99,
    interval: 'monthly',
    currency: 'USD',
  };

  beforeEach(async () => {
    // Create mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { headers: { common: {} } },
    } as unknown as jest.Mocked<AxiosInstance>;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    const mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'FLUTTERWAVE_SECRET_KEY':
            return 'flw_test_secret_key';
          case 'FLUTTERWAVE_PUBLIC_KEY':
            return 'flw_test_public_key';
          case 'FLUTTERWAVE_ENCRYPTION_KEY':
            return 'flw_test_encryption_key';
          case 'FLUTTERWAVE_WEBHOOK_SECRET':
            return 'flw_test_webhook_secret';
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlutterwaveService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FlutterwaveService>(FlutterwaveService);
    configService = module.get<ConfigService>(ConfigService);

    // Replace the client with our mock
    (service as any).client = mockAxiosInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config values', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.flutterwave.com/v3',
        headers: {
          Authorization: 'Bearer flw_test_secret_key',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should warn if secret key is not configured', async () => {
      const warnConfigService = {
        get: jest.fn().mockReturnValue(''),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FlutterwaveService,
          {
            provide: ConfigService,
            useValue: warnConfigService,
          },
        ],
      }).compile();

      // Service should still be created even without key
      const serviceWithoutKey = module.get<FlutterwaveService>(FlutterwaveService);
      expect(serviceWithoutKey).toBeDefined();
    });
  });

  describe('createPaymentLink', () => {
    it('should create payment link successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            link: 'https://checkout.flutterwave.com/test-link',
          },
        },
      });

      const result = await service.createPaymentLink(
        mockCustomer,
        SubscriptionTier.BASIC,
        'monthly',
        'USD',
        'https://example.com/callback',
      );

      expect(result.link).toBe('https://checkout.flutterwave.com/test-link');
      expect(result.tx_ref).toMatch(/^AFU_\d+_[a-f0-9]+$/);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          amount: 49.99,
          currency: 'USD',
          redirect_url: 'https://example.com/callback',
          customer: {
            email: mockCustomer.email,
            phonenumber: mockCustomer.phonenumber,
            name: mockCustomer.name,
          },
        }),
      );
    });

    it('should create payment link with yearly billing', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            link: 'https://checkout.flutterwave.com/test-link',
          },
        },
      });

      const result = await service.createPaymentLink(
        mockCustomer,
        SubscriptionTier.BASIC,
        'yearly',
        'USD',
        'https://example.com/callback',
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          amount: 499.99,
        }),
      );
    });

    it('should throw BadRequestException for FREE tier', async () => {
      await expect(
        service.createPaymentLink(
          mockCustomer,
          SubscriptionTier.FREEMIUM,
          'monthly',
          'USD',
          'https://example.com/callback',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should include metadata in payment request', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            link: 'https://checkout.flutterwave.com/test-link',
          },
        },
      });

      await service.createPaymentLink(
        mockCustomer,
        SubscriptionTier.BASIC,
        'monthly',
        'USD',
        'https://example.com/callback',
        { source: 'web', campaign: 'summer_sale' },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          meta: expect.objectContaining({
            tier: SubscriptionTier.BASIC,
            billingPeriod: 'monthly',
            source: 'web',
            campaign: 'summer_sale',
          }),
        }),
      );
    });

    it('should throw BadRequestException when API returns error', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Invalid request',
        },
      });

      await expect(
        service.createPaymentLink(
          mockCustomer,
          SubscriptionTier.BASIC,
          'monthly',
          'USD',
          'https://example.com/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on network error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(
        service.createPaymentLink(
          mockCustomer,
          SubscriptionTier.BASIC,
          'monthly',
          'USD',
          'https://example.com/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSubscriptionPlan', () => {
    it('should create subscription plan successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: mockSubscriptionPlan,
        },
      });

      const result = await service.createSubscriptionPlan(
        'BASIC Subscription',
        49.99,
        'monthly',
        'USD',
      );

      expect(result).toEqual(mockSubscriptionPlan);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/payment-plans', {
        name: 'BASIC Subscription',
        amount: 49.99,
        interval: 'monthly',
        currency: 'USD',
      });
    });

    it('should create yearly subscription plan', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: { ...mockSubscriptionPlan, interval: 'yearly', amount: 499.99 },
        },
      });

      await service.createSubscriptionPlan('BASIC Annual', 499.99, 'yearly', 'USD');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/payment-plans', {
        name: 'BASIC Annual',
        amount: 499.99,
        interval: 'yearly',
        currency: 'USD',
      });
    });

    it('should throw BadRequestException when API returns error', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Plan creation failed',
        },
      });

      await expect(
        service.createSubscriptionPlan('Test Plan', 10, 'monthly'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on network error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(
        service.createSubscriptionPlan('Test Plan', 10, 'monthly'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            link: 'https://checkout.flutterwave.com/subscription-link',
          },
        },
      });

      const result = await service.createSubscription(
        1001,
        mockCustomer,
        'https://example.com/callback',
      );

      expect(result.link).toBe('https://checkout.flutterwave.com/subscription-link');
      expect(result.tx_ref).toMatch(/^AFU_\d+_[a-f0-9]+$/);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          payment_plan: 1001,
          redirect_url: 'https://example.com/callback',
          customer: {
            email: mockCustomer.email,
            phonenumber: mockCustomer.phonenumber,
            name: mockCustomer.name,
          },
        }),
      );
    });

    it('should include metadata in subscription request', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            link: 'https://checkout.flutterwave.com/subscription-link',
          },
        },
      });

      await service.createSubscription(1001, mockCustomer, 'https://example.com/callback', {
        userId: 'user123',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          meta: { userId: 'user123' },
        }),
      );
    });

    it('should throw BadRequestException when API returns error', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Subscription creation failed',
        },
      });

      await expect(
        service.createSubscription(1001, mockCustomer, 'https://example.com/callback'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyTransaction', () => {
    it('should verify transaction successfully', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'success',
          data: mockTransaction,
        },
      });

      const result = await service.verifyTransaction(123456);

      expect(result).toEqual(mockTransaction);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/transactions/123456/verify');
    });

    it('should throw BadRequestException when verification fails', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Transaction not found',
        },
      });

      await expect(service.verifyTransaction(999999)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on network error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(service.verifyTransaction(123456)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactionByRef', () => {
    it('should return transaction when found', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'success',
          data: [mockTransaction],
        },
      });

      const result = await service.getTransactionByRef('AFU_1234567890_abc123');

      expect(result).toEqual(mockTransaction);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/transactions', {
        params: { tx_ref: 'AFU_1234567890_abc123' },
      });
    });

    it('should return null when transaction not found', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'success',
          data: [],
        },
      });

      const result = await service.getTransactionByRef('nonexistent_ref');

      expect(result).toBeNull();
    });

    it('should return null when API returns error', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'error',
          data: [],
        },
      });

      const result = await service.getTransactionByRef('some_ref');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const result = await service.getTransactionByRef('some_ref');

      expect(result).toBeNull();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      mockAxiosInstance.put.mockResolvedValue({
        data: {
          status: 'success',
        },
      });

      const result = await service.cancelSubscription(12345);

      expect(result).toBe(true);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/subscriptions/12345/cancel');
    });

    it('should return false when cancellation fails', async () => {
      mockAxiosInstance.put.mockResolvedValue({
        data: {
          status: 'error',
        },
      });

      const result = await service.cancelSubscription(12345);

      expect(result).toBe(false);
    });

    it('should throw BadRequestException on network error', async () => {
      mockAxiosInstance.put.mockRejectedValue(new Error('Network error'));

      await expect(service.cancelSubscription(12345)).rejects.toThrow(BadRequestException);
    });
  });

  describe('initiateRefund', () => {
    it('should initiate refund successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            id: 5001,
            status: 'pending',
          },
        },
      });

      const result = await service.initiateRefund(123456);

      expect(result).toEqual({ id: 5001, status: 'pending' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/transactions/refund', {
        id: 123456,
      });
    });

    it('should initiate partial refund', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            id: 5002,
            status: 'pending',
          },
        },
      });

      const result = await service.initiateRefund(123456, 25.00);

      expect(result).toEqual({ id: 5002, status: 'pending' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/transactions/refund', {
        id: 123456,
        amount: 25.00,
      });
    });

    it('should throw BadRequestException when refund fails', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Refund not allowed',
        },
      });

      await expect(service.initiateRefund(123456)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on network error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(service.initiateRefund(123456)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const result = service.verifyWebhookSignature('flw_test_webhook_secret');

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const result = service.verifyWebhookSignature('invalid_secret');

      expect(result).toBe(false);
    });

    it('should return false when webhook secret is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      const result = service.verifyWebhookSignature('some_hash');

      expect(result).toBe(false);
    });

    it('should return false for empty verification hash', () => {
      const result = service.verifyWebhookSignature('');

      expect(result).toBe(false);
    });
  });

  describe('getBanks', () => {
    const mockBanks = [
      { id: 1, name: 'Access Bank', code: '044' },
      { id: 2, name: 'GTBank', code: '058' },
    ];

    it('should return banks for default country (NG)', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'success',
          data: mockBanks,
        },
      });

      const result = await service.getBanks();

      expect(result).toEqual(mockBanks);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/banks/NG');
    });

    it('should return banks for specified country', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'success',
          data: [],
        },
      });

      await service.getBanks('GH');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/banks/GH');
    });

    it('should throw BadRequestException when API returns error', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          status: 'error',
        },
      });

      await expect(service.getBanks()).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on network error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getBanks()).rejects.toThrow(BadRequestException);
    });
  });

  describe('createVirtualAccount', () => {
    it('should create virtual account successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            account_number: '1234567890',
            bank_name: 'Wema Bank',
          },
        },
      });

      const result = await service.createVirtualAccount(
        'test@example.com',
        '12345678901',
        true,
      );

      expect(result).toEqual({
        accountNumber: '1234567890',
        bankName: 'Wema Bank',
      });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/virtual-account-numbers',
        expect.objectContaining({
          email: 'test@example.com',
          bvn: '12345678901',
          is_permanent: true,
        }),
      );
    });

    it('should create temporary virtual account', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            account_number: '0987654321',
            bank_name: 'Sterling Bank',
          },
        },
      });

      await service.createVirtualAccount('test@example.com', '12345678901', false);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/virtual-account-numbers',
        expect.objectContaining({
          is_permanent: false,
        }),
      );
    });

    it('should throw BadRequestException when API returns error', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Invalid BVN',
        },
      });

      await expect(
        service.createVirtualAccount('test@example.com', 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on network error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(
        service.createVirtualAccount('test@example.com', '12345678901'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle customer with minimal data', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            link: 'https://checkout.flutterwave.com/test-link',
          },
        },
      });

      const minimalCustomer: FlutterwaveCustomer = {
        email: 'minimal@example.com',
      };

      const result = await service.createPaymentLink(
        minimalCustomer,
        SubscriptionTier.BASIC,
        'monthly',
        'USD',
        'https://example.com/callback',
      );

      expect(result.link).toBeDefined();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          customer: {
            email: 'minimal@example.com',
            phonenumber: undefined,
            name: undefined,
          },
        }),
      );
    });

    it('should handle different subscription tiers', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: { link: 'https://checkout.flutterwave.com/test-link' },
        },
      });

      // Test STARTER tier
      await service.createPaymentLink(
        mockCustomer,
        SubscriptionTier.STARTER,
        'monthly',
        'USD',
        'https://example.com/callback',
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({ amount: 23.99 }),
      );

      // Test PROFESSIONAL tier
      await service.createPaymentLink(
        mockCustomer,
        SubscriptionTier.PROFESSIONAL,
        'monthly',
        'USD',
        'https://example.com/callback',
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({ amount: 89.99 }),
      );

      // Test EXECUTIVE_ELITE tier
      await service.createPaymentLink(
        mockCustomer,
        SubscriptionTier.EXECUTIVE_ELITE,
        'monthly',
        'USD',
        'https://example.com/callback',
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({ amount: 299.99 }),
      );
    });

    it('should handle different currencies', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          status: 'success',
          data: { link: 'https://checkout.flutterwave.com/test-link' },
        },
      });

      await service.createPaymentLink(
        mockCustomer,
        SubscriptionTier.BASIC,
        'monthly',
        'NGN',
        'https://example.com/callback',
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({ currency: 'NGN' }),
      );
    });
  });
});
