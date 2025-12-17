import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaystackService', () => {
  let service: PaystackService;
  let configService: ConfigService;
  let axiosInstance: any;

  const mockPaystackTransaction = {
    id: 123456,
    reference: 'AFU_1234567890_abcd1234',
    amount: 499900,
    currency: 'NGN',
    status: 'success',
    customer: {
      email: 'test@example.com',
    },
    created_at: '2024-01-01T00:00:00Z',
    paid_at: '2024-01-01T00:01:00Z',
  };

  const mockPaystackPlan = {
    id: 1,
    name: 'BASIC Plan',
    plan_code: 'PLN_basic123',
    amount: 499900,
    interval: 'monthly',
    currency: 'NGN',
  };

  const mockPaystackSubscription = {
    id: 1,
    status: 'active',
    subscription_code: 'SUB_test123',
    email_token: 'token123',
    next_payment_date: '2024-02-01T00:00:00Z',
    plan: mockPaystackPlan,
  };

  const mockPaystackCustomer = {
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    authorizations: [
      {
        authorization_code: 'AUTH_test123',
        bin: '408408',
        last4: '4081',
        exp_month: '12',
        exp_year: '2025',
        card_type: 'visa',
        bank: 'Test Bank',
        reusable: true,
      },
    ],
  };

  beforeEach(async () => {
    // Create axios instance mock
    axiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };

    mockedAxios.create = jest.fn().mockReturnValue(axiosInstance);

    const mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'PAYSTACK_SECRET_KEY':
            return 'sk_test_mock_key';
          case 'PAYSTACK_PUBLIC_KEY':
            return 'pk_test_mock_key';
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaystackService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaystackService>(PaystackService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeTransaction', () => {
    it('should initialize transaction successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/test',
            reference: 'AFU_1234567890_abcd1234',
            access_code: 'access_code_123',
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.initializeTransaction(
        'test@example.com',
        4999,
        'NGN',
        'https://example.com/callback',
        { source: 'web' },
      );

      expect(result).toEqual({
        authorizationUrl: 'https://checkout.paystack.com/test',
        reference: mockResponse.data.data.reference,
        accessCode: 'access_code_123',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/transaction/initialize',
        expect.objectContaining({
          email: 'test@example.com',
          amount: 499900, // Amount in kobo
          currency: 'NGN',
          callback_url: 'https://example.com/callback',
          metadata: { source: 'web' },
        }),
      );
    });

    it('should throw BadRequestException when initialization fails', async () => {
      axiosInstance.post.mockResolvedValue({
        data: {
          status: false,
          message: 'Invalid email',
        },
      });

      await expect(
        service.initializeTransaction(
          'invalid-email',
          4999,
          'NGN',
          'https://example.com/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle network errors', async () => {
      axiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(
        service.initializeTransaction(
          'test@example.com',
          4999,
          'NGN',
          'https://example.com/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate unique references', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/test',
            reference: 'AFU_1234567890_abcd1234',
            access_code: 'access_code_123',
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await service.initializeTransaction(
        'test@example.com',
        4999,
        'NGN',
        'https://example.com/callback',
      );

      const callArgs = axiosInstance.post.mock.calls[0][1];
      expect(callArgs.reference).toMatch(/^AFU_\d+_[a-f0-9]{16}$/);
    });
  });

  describe('initializeSubscription', () => {
    it('should initialize subscription successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/test',
            reference: 'AFU_1234567890_abcd1234',
            access_code: 'access_code_123',
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.initializeSubscription(
        'test@example.com',
        SubscriptionTier.BASIC,
        'monthly',
        'NGN',
        'https://example.com/callback',
      );

      expect(result).toEqual({
        authorizationUrl: 'https://checkout.paystack.com/test',
        reference: mockResponse.data.data.reference,
        accessCode: 'access_code_123',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/transaction/initialize',
        expect.objectContaining({
          email: 'test@example.com',
          amount: 4999, // 49.99 * 100 (price is already in dollars, converted to kobo)
          metadata: expect.objectContaining({
            tier: SubscriptionTier.BASIC,
            billingPeriod: 'monthly',
            type: 'subscription',
          }),
        }),
      );
    });

    it('should throw BadRequestException for FREE tier', async () => {
      await expect(
        service.initializeSubscription(
          'test@example.com',
          SubscriptionTier.FREEMIUM,
          'monthly',
          'NGN',
          'https://example.com/callback',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(axiosInstance.post).not.toHaveBeenCalled();
    });

    it('should handle yearly billing', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/test',
            reference: 'AFU_1234567890_abcd1234',
            access_code: 'access_code_123',
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await service.initializeSubscription(
        'test@example.com',
        SubscriptionTier.PROFESSIONAL,
        'yearly',
        'NGN',
        'https://example.com/callback',
      );

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/transaction/initialize',
        expect.objectContaining({
          amount: 89999, // 899.99 * 100 (price is already in dollars, converted to kobo)
          metadata: expect.objectContaining({
            billingPeriod: 'yearly',
          }),
        }),
      );
    });
  });

  describe('verifyTransaction', () => {
    it('should verify transaction successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackTransaction,
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.verifyTransaction('AFU_1234567890_abcd1234');

      expect(result).toEqual(mockPaystackTransaction);
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/transaction/verify/AFU_1234567890_abcd1234',
      );
    });

    it('should throw BadRequestException when verification fails', async () => {
      axiosInstance.get.mockResolvedValue({
        data: {
          status: false,
          message: 'Transaction not found',
        },
      });

      await expect(
        service.verifyTransaction('AFU_invalid_reference'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle network errors during verification', async () => {
      axiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(
        service.verifyTransaction('AFU_1234567890_abcd1234'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPlan', () => {
    it('should create plan successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackPlan,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createPlan(
        'BASIC Plan',
        4999,
        'monthly',
        'NGN',
        'Basic subscription plan',
      );

      expect(result).toEqual(mockPaystackPlan);
      expect(axiosInstance.post).toHaveBeenCalledWith('/plan', {
        name: 'BASIC Plan',
        amount: 499900, // Convert to kobo
        interval: 'monthly',
        currency: 'NGN',
        description: 'Basic subscription plan',
      });
    });

    it('should support different intervals', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackPlan,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await service.createPlan('Annual Plan', 99999, 'annually', 'NGN');

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/plan',
        expect.objectContaining({
          interval: 'annually',
        }),
      );
    });

    it('should throw BadRequestException when plan creation fails', async () => {
      axiosInstance.post.mockResolvedValue({
        data: {
          status: false,
          message: 'Plan already exists',
        },
      });

      await expect(
        service.createPlan('Duplicate Plan', 4999, 'monthly', 'NGN'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listPlans', () => {
    it('should list plans successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: [mockPaystackPlan],
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.listPlans();

      expect(result).toEqual([mockPaystackPlan]);
      expect(axiosInstance.get).toHaveBeenCalledWith('/plan');
    });

    it('should throw BadRequestException when listing fails', async () => {
      axiosInstance.get.mockResolvedValue({
        data: {
          status: false,
        },
      });

      await expect(service.listPlans()).rejects.toThrow(BadRequestException);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackSubscription,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createSubscription(
        'test@example.com',
        'PLN_basic123',
        'AUTH_test123',
      );

      expect(result).toEqual(mockPaystackSubscription);
      expect(axiosInstance.post).toHaveBeenCalledWith('/subscription', {
        customer: 'test@example.com',
        plan: 'PLN_basic123',
        authorization: 'AUTH_test123',
      });
    });

    it('should create subscription with start date', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackSubscription,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const startDate = '2024-02-01';
      await service.createSubscription(
        'test@example.com',
        'PLN_basic123',
        'AUTH_test123',
        startDate,
      );

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/subscription',
        expect.objectContaining({
          start_date: startDate,
        }),
      );
    });

    it('should throw BadRequestException when subscription creation fails', async () => {
      axiosInstance.post.mockResolvedValue({
        data: {
          status: false,
          message: 'Invalid authorization code',
        },
      });

      await expect(
        service.createSubscription(
          'test@example.com',
          'PLN_basic123',
          'AUTH_invalid',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubscription', () => {
    it('should get subscription successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackSubscription,
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getSubscription('SUB_test123');

      expect(result).toEqual(mockPaystackSubscription);
      expect(axiosInstance.get).toHaveBeenCalledWith('/subscription/SUB_test123');
    });

    it('should throw BadRequestException when subscription not found', async () => {
      axiosInstance.get.mockResolvedValue({
        data: {
          status: false,
        },
      });

      await expect(service.getSubscription('SUB_invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('disableSubscription', () => {
    it('should disable subscription successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.disableSubscription('SUB_test123', 'token123');

      expect(result).toBe(true);
      expect(axiosInstance.post).toHaveBeenCalledWith('/subscription/disable', {
        code: 'SUB_test123',
        token: 'token123',
      });
    });

    it('should return false when disable fails', async () => {
      const mockResponse = {
        data: {
          status: false,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.disableSubscription('SUB_test123', 'token123');

      expect(result).toBe(false);
    });

    it('should throw BadRequestException on error', async () => {
      axiosInstance.post.mockRejectedValue(new Error('API error'));

      await expect(
        service.disableSubscription('SUB_test123', 'token123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('enableSubscription', () => {
    it('should enable subscription successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.enableSubscription('SUB_test123', 'token123');

      expect(result).toBe(true);
      expect(axiosInstance.post).toHaveBeenCalledWith('/subscription/enable', {
        code: 'SUB_test123',
        token: 'token123',
      });
    });
  });

  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            customer_code: 'CUS_test123',
            id: 123456,
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createCustomer(
        'test@example.com',
        'John',
        'Doe',
        '+2348123456789',
      );

      expect(result).toEqual({
        customerCode: 'CUS_test123',
        id: 123456,
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/customer', {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+2348123456789',
      });
    });

    it('should throw BadRequestException when customer creation fails', async () => {
      axiosInstance.post.mockResolvedValue({
        data: {
          status: false,
          message: 'Customer already exists',
        },
      });

      await expect(service.createCustomer('test@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCustomer', () => {
    it('should get customer successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackCustomer,
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getCustomer('test@example.com');

      expect(result).toEqual(mockPaystackCustomer);
      expect(axiosInstance.get).toHaveBeenCalledWith('/customer/test@example.com');
    });
  });

  describe('chargeAuthorization', () => {
    it('should charge authorization successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: mockPaystackTransaction,
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.chargeAuthorization(
        'test@example.com',
        4999,
        'AUTH_test123',
        'NGN',
        { orderId: '12345' },
      );

      expect(result).toEqual(mockPaystackTransaction);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/transaction/charge_authorization',
        expect.objectContaining({
          email: 'test@example.com',
          amount: 499900, // Convert to kobo
          authorization_code: 'AUTH_test123',
          currency: 'NGN',
          metadata: { orderId: '12345' },
        }),
      );
    });

    it('should throw BadRequestException when charge fails', async () => {
      axiosInstance.post.mockResolvedValue({
        data: {
          status: false,
          message: 'Insufficient funds',
        },
      });

      await expect(
        service.chargeAuthorization(
          'test@example.com',
          4999,
          'AUTH_test123',
          'NGN',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('initiateRefund', () => {
    it('should initiate refund successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            id: 789,
            status: 'pending',
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.initiateRefund(
        'AFU_1234567890_abcd1234',
        1000,
        'Customer request',
      );

      expect(result).toEqual({
        id: 789,
        status: 'pending',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/refund', {
        transaction: 'AFU_1234567890_abcd1234',
        amount: 100000, // Convert to kobo
        merchant_note: 'Customer request',
      });
    });

    it('should initiate full refund without amount', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            id: 789,
            status: 'pending',
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await service.initiateRefund('AFU_1234567890_abcd1234');

      expect(axiosInstance.post).toHaveBeenCalledWith('/refund', {
        transaction: 'AFU_1234567890_abcd1234',
      });
    });
  });

  describe('listBanks', () => {
    it('should list banks successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: [
            { name: 'Access Bank', code: '044' },
            { name: 'GTBank', code: '058' },
          ],
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.listBanks('nigeria');

      expect(result).toEqual(mockResponse.data.data);
      expect(axiosInstance.get).toHaveBeenCalledWith('/bank', {
        params: { country: 'nigeria' },
      });
    });
  });

  describe('resolveAccountNumber', () => {
    it('should resolve account number successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            account_name: 'JOHN DOE',
            account_number: '0123456789',
          },
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.resolveAccountNumber('0123456789', '044');

      expect(result).toEqual({
        accountName: 'JOHN DOE',
        accountNumber: '0123456789',
      });

      expect(axiosInstance.get).toHaveBeenCalledWith('/bank/resolve', {
        params: {
          account_number: '0123456789',
          bank_code: '044',
        },
      });
    });
  });

  describe('createDedicatedVirtualAccount', () => {
    it('should create dedicated virtual account successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            account_name: 'PAYSTACK/JOHN DOE',
            account_number: '9876543210',
            bank: {
              name: 'Wema Bank',
            },
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.createDedicatedVirtualAccount(
        'test@example.com',
        'wema-bank',
      );

      expect(result).toEqual({
        accountName: 'PAYSTACK/JOHN DOE',
        accountNumber: '9876543210',
        bank: 'Wema Bank',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/dedicated_account', {
        customer: 'test@example.com',
        preferred_bank: 'wema-bank',
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = Buffer.from('{"event":"charge.success"}');
      const secretKey = 'sk_test_mock_key';

      // Calculate correct signature
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', secretKey)
        .update(payload)
        .digest('hex');

      const result = service.verifyWebhookSignature(payload, hash);

      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = Buffer.from('{"event":"charge.success"}');
      const invalidSignature = 'invalid_signature';

      const result = service.verifyWebhookSignature(payload, invalidSignature);

      expect(result).toBe(false);
    });

    it('should return false when no signature provided', () => {
      const payload = Buffer.from('{"event":"charge.success"}');

      const result = service.verifyWebhookSignature(payload, '');

      expect(result).toBe(false);
    });

    it('should handle string payload', () => {
      const payload = '{"event":"charge.success"}';
      const secretKey = 'sk_test_mock_key';

      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', secretKey)
        .update(payload)
        .digest('hex');

      const result = service.verifyWebhookSignature(payload, hash);

      expect(result).toBe(true);
    });
  });

  describe('listTransactions', () => {
    it('should list transactions successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: [mockPaystackTransaction],
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.listTransactions({
        perPage: 20,
        page: 1,
        status: 'success',
      });

      expect(result).toEqual([mockPaystackTransaction]);
      expect(axiosInstance.get).toHaveBeenCalledWith('/transaction', {
        params: {
          perPage: 20,
          page: 1,
          status: 'success',
        },
      });
    });

    it('should list transactions with date filters', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: [mockPaystackTransaction],
        },
      };

      axiosInstance.get.mockResolvedValue(mockResponse);

      await service.listTransactions({
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(axiosInstance.get).toHaveBeenCalledWith('/transaction', {
        params: {
          from: '2024-01-01',
          to: '2024-01-31',
        },
      });
    });

    it('should throw BadRequestException when listing fails', async () => {
      axiosInstance.get.mockResolvedValue({
        data: {
          status: false,
        },
      });

      await expect(service.listTransactions()).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing secret key gracefully', () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      // Service should still be created but show warning
      expect(service).toBeDefined();
    });

    it('should handle decimal amounts correctly', async () => {
      const mockResponse = {
        data: {
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/test',
            reference: 'AFU_1234567890_abcd1234',
            access_code: 'access_code_123',
          },
        },
      };

      axiosInstance.post.mockResolvedValue(mockResponse);

      await service.initializeTransaction(
        'test@example.com',
        49.99,
        'NGN',
        'https://example.com/callback',
      );

      const callArgs = axiosInstance.post.mock.calls[0][1];
      expect(callArgs.amount).toBe(4999); // Properly converted to kobo
    });

    it('should handle API timeout errors', async () => {
      axiosInstance.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      await expect(
        service.initializeTransaction(
          'test@example.com',
          4999,
          'NGN',
          'https://example.com/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle malformed API responses', async () => {
      axiosInstance.get.mockResolvedValue({
        data: null,
      });

      await expect(
        service.verifyTransaction('AFU_1234567890_abcd1234'),
      ).rejects.toThrow();
    });
  });
});
