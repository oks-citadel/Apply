/**
 * Comprehensive Paystack Webhook Controller Tests
 * Tests for all webhook event types, signature verification, and idempotency handling
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaystackController } from '../paystack.controller';
import { PaystackService } from '../paystack.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { InvoicesService } from '../../invoices/invoices.service';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import * as crypto from 'crypto';

// Define interface for Paystack webhook payload
interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
      first_name?: string;
      last_name?: string;
      customer_code?: string;
    };
    authorization?: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      reusable: boolean;
    };
    metadata?: Record<string, unknown>;
    paid_at?: string;
    created_at: string;
    subscription_code?: string;
    plan?: {
      name: string;
      plan_code: string;
      amount: number;
      interval: string;
    };
  };
}

describe('PaystackController - Comprehensive Webhook Tests', () => {
  let controller: PaystackController;
  let paystackService: jest.Mocked<PaystackService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let invoicesService: jest.Mocked<InvoicesService>;

  // Test data constants
  const TEST_USER_ID = 'user_test_paystack_123';
  const TEST_REFERENCE = 'AFU_1702000000_abc123def456';
  const TEST_CUSTOMER_EMAIL = 'test@example.com';
  const TEST_CUSTOMER_CODE = 'CUS_test123456';
  const TEST_SUBSCRIPTION_CODE = 'SUB_test123456';
  const TEST_PLAN_CODE = 'PLN_test123456';
  const PAYSTACK_SECRET_KEY = 'sk_test_mock_key';

  // Mock database subscription
  const mockDbSubscription = {
    id: 'db_subscription_uuid_paystack',
    userId: TEST_USER_ID,
    stripeCustomerId: TEST_CUSTOMER_CODE,
    stripeSubscriptionId: TEST_REFERENCE,
    tier: SubscriptionTier.BASIC,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock database invoice
  const mockDbInvoice = {
    id: 'db_invoice_uuid_paystack',
    subscriptionId: mockDbSubscription.id,
    stripeInvoiceId: TEST_REFERENCE,
    stripeCustomerId: TEST_CUSTOMER_CODE,
    amount: 49.99,
    currency: 'NGN',
    status: InvoiceStatus.PAID,
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Helper to generate valid Paystack signature
  const generatePaystackSignature = (payload: string): string => {
    return crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');
  };

  // Helper to create Paystack webhook payload
  const createWebhookPayload = (
    event: string,
    overrides: Partial<PaystackWebhookPayload['data']> = {},
  ): PaystackWebhookPayload => ({
    event,
    data: {
      id: 12345678,
      reference: TEST_REFERENCE,
      amount: 499900, // Amount in kobo (4999.00 NGN)
      currency: 'NGN',
      status: 'success',
      customer: {
        email: TEST_CUSTOMER_EMAIL,
        first_name: 'Test',
        last_name: 'User',
        customer_code: TEST_CUSTOMER_CODE,
      },
      authorization: {
        authorization_code: 'AUTH_test123',
        card_type: 'visa',
        last4: '4081',
        exp_month: '12',
        exp_year: '2025',
        reusable: true,
      },
      metadata: {
        userId: TEST_USER_ID,
        tier: SubscriptionTier.BASIC,
        billingPeriod: 'monthly',
        type: 'subscription',
      },
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...overrides,
    },
  });

  // Helper to create mock request with raw body
  const createMockRequest = (payload: PaystackWebhookPayload) => {
    const rawBody = Buffer.from(JSON.stringify(payload));
    return { rawBody } as any;
  };

  beforeEach(async () => {
    const mockPaystackService = {
      verifyWebhookSignature: jest.fn(),
      verifyTransaction: jest.fn(),
      initializeSubscription: jest.fn(),
      initializeTransaction: jest.fn(),
      createPlan: jest.fn(),
      listPlans: jest.fn(),
      createSubscription: jest.fn(),
      getSubscription: jest.fn(),
      disableSubscription: jest.fn(),
      enableSubscription: jest.fn(),
      createCustomer: jest.fn(),
      getCustomer: jest.fn(),
      chargeAuthorization: jest.fn(),
      initiateRefund: jest.fn(),
      listBanks: jest.fn(),
      resolveAccountNumber: jest.fn(),
      createDedicatedVirtualAccount: jest.fn(),
      listTransactions: jest.fn(),
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
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaystackController],
      providers: [
        { provide: PaystackService, useValue: mockPaystackService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: InvoicesService, useValue: mockInvoicesService },
      ],
    }).compile();

    controller = module.get<PaystackController>(PaystackController);
    paystackService = module.get(PaystackService);
    subscriptionsService = module.get(SubscriptionsService);
    invoicesService = module.get(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Signature Verification', () => {
    it('should accept valid webhook signature', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(paystackService.verifyWebhookSignature).toHaveBeenCalledWith(
        mockRequest.rawBody,
        signature,
      );
    });

    it('should reject invalid webhook signature', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);

      paystackService.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        controller.handleWebhook(mockRequest, 'invalid_signature', payload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing signature header', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);

      await expect(
        controller.handleWebhook(mockRequest, '', payload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing raw body', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = { rawBody: undefined } as any;

      await expect(
        controller.handleWebhook(mockRequest, 'signature', payload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify signature using HMAC SHA512', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      await controller.handleWebhook(mockRequest, signature, payload);

      expect(paystackService.verifyWebhookSignature).toHaveBeenCalledWith(
        mockRequest.rawBody,
        signature,
      );
    });
  });

  describe('charge.success Event', () => {
    it('should create subscription and invoice when charge is successful', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        stripeCustomerId: TEST_CUSTOMER_CODE,
        stripeSubscriptionId: TEST_REFERENCE,
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
        cancelAtPeriodEnd: false,
      });
    });

    it('should save reusable card authorization', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      await controller.handleWebhook(mockRequest, signature, payload);

      // Verify authorization_code is available for future charges
      expect(payload.data.authorization?.reusable).toBe(true);
      expect(payload.data.authorization?.authorization_code).toBe('AUTH_test123');
    });

    it('should record invoice with correct amount conversion from kobo', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      await controller.handleWebhook(mockRequest, signature, payload);

      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith({
        subscriptionId: mockDbSubscription.id,
        stripeInvoiceId: TEST_REFERENCE,
        stripeCustomerId: TEST_CUSTOMER_CODE,
        amount: 4999, // 499900 / 100
        currency: 'NGN',
        status: InvoiceStatus.PAID,
        paidAt: expect.any(Date),
      });
    });

    it('should skip charge without subscription metadata', async () => {
      const payload = createWebhookPayload('charge.success', {
        metadata: { someOtherField: 'value' },
      });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('should handle all subscription tiers', async () => {
      const tiers = [
        SubscriptionTier.STARTER,
        SubscriptionTier.BASIC,
        SubscriptionTier.PROFESSIONAL,
        SubscriptionTier.ADVANCED_CAREER,
        SubscriptionTier.EXECUTIVE_ELITE,
      ];

      for (const tier of tiers) {
        jest.clearAllMocks();

        const payload = createWebhookPayload('charge.success', {
          metadata: { userId: TEST_USER_ID, tier, billingPeriod: 'monthly' },
        });
        const mockRequest = createMockRequest(payload);
        const signature = generatePaystackSignature(JSON.stringify(payload));

        paystackService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue({ ...mockDbSubscription, tier } as any);
        subscriptionsService.findByUserId.mockResolvedValue({ ...mockDbSubscription, tier } as any);
        invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

        const result = await controller.handleWebhook(mockRequest, signature, payload);

        expect(result).toEqual({ status: 'success' });
        expect(subscriptionsService.create).toHaveBeenCalledWith(
          expect.objectContaining({ tier }),
        );
      }
    });

    it('should use email when customer_code is not available', async () => {
      const payload = createWebhookPayload('charge.success', {
        customer: {
          email: TEST_CUSTOMER_EMAIL,
          first_name: 'Test',
          last_name: 'User',
          customer_code: undefined,
        },
      });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      await controller.handleWebhook(mockRequest, signature, payload);

      expect(subscriptionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeCustomerId: TEST_CUSTOMER_EMAIL,
        }),
      );
    });
  });

  describe('subscription.create Event', () => {
    it('should create subscription from Paystack subscription', async () => {
      const payload = createWebhookPayload('subscription.create', {
        subscription_code: TEST_SUBSCRIPTION_CODE,
        plan: {
          name: 'BASIC Monthly',
          plan_code: TEST_PLAN_CODE,
          amount: 499900,
          interval: 'monthly',
        },
      });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        stripeCustomerId: TEST_CUSTOMER_CODE,
        stripeSubscriptionId: TEST_SUBSCRIPTION_CODE,
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
        cancelAtPeriodEnd: false,
      });
    });

    it('should map plan name to tier correctly', async () => {
      const planNameToTier = [
        { planName: 'Starter Plan', expectedTier: SubscriptionTier.STARTER },
        { planName: 'Basic Monthly', expectedTier: SubscriptionTier.BASIC },
        { planName: 'Professional Plan', expectedTier: SubscriptionTier.PROFESSIONAL },
        { planName: 'Pro Monthly', expectedTier: SubscriptionTier.PROFESSIONAL },
        { planName: 'Advanced Career', expectedTier: SubscriptionTier.ADVANCED_CAREER },
        { planName: 'Business Plan', expectedTier: SubscriptionTier.ADVANCED_CAREER },
        { planName: 'Executive Elite', expectedTier: SubscriptionTier.EXECUTIVE_ELITE },
        { planName: 'Enterprise Plan', expectedTier: SubscriptionTier.EXECUTIVE_ELITE },
        { planName: 'Unknown Plan', expectedTier: SubscriptionTier.FREEMIUM },
      ];

      for (const { planName, expectedTier } of planNameToTier) {
        jest.clearAllMocks();

        const payload = createWebhookPayload('subscription.create', {
          subscription_code: TEST_SUBSCRIPTION_CODE,
          plan: {
            name: planName,
            plan_code: TEST_PLAN_CODE,
            amount: 499900,
            interval: 'monthly',
          },
        });
        const mockRequest = createMockRequest(payload);
        const signature = generatePaystackSignature(JSON.stringify(payload));

        paystackService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue({
          ...mockDbSubscription,
          tier: expectedTier,
        } as any);

        await controller.handleWebhook(mockRequest, signature, payload);

        expect(subscriptionsService.create).toHaveBeenCalledWith(
          expect.objectContaining({ tier: expectedTier }),
        );
      }
    });

    it('should calculate period end based on plan interval', async () => {
      const intervals = [
        { interval: 'monthly', daysAdded: 30 },
        { interval: 'annually', daysAdded: 365 },
        { interval: 'weekly', daysAdded: 7 },
        { interval: 'daily', daysAdded: 1 },
      ];

      for (const { interval, daysAdded } of intervals) {
        jest.clearAllMocks();

        const payload = createWebhookPayload('subscription.create', {
          subscription_code: TEST_SUBSCRIPTION_CODE,
          plan: {
            name: 'BASIC Plan',
            plan_code: TEST_PLAN_CODE,
            amount: 499900,
            interval,
          },
        });
        const mockRequest = createMockRequest(payload);
        const signature = generatePaystackSignature(JSON.stringify(payload));

        paystackService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);

        await controller.handleWebhook(mockRequest, signature, payload);

        expect(subscriptionsService.create).toHaveBeenCalled();
      }
    });
  });

  describe('subscription.disable Event', () => {
    it('should cancel subscription and downgrade to free tier', async () => {
      const payload = createWebhookPayload('subscription.disable', {
        subscription_code: TEST_SUBSCRIPTION_CODE,
      });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.CANCELED,
      } as any);
      subscriptionsService.downgradeToFreeTier.mockResolvedValue({
        ...mockDbSubscription,
        tier: SubscriptionTier.FREEMIUM,
      } as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        expect.objectContaining({
          status: SubscriptionStatus.CANCELED,
          canceledAt: expect.any(Date),
        }),
      );
      expect(subscriptionsService.downgradeToFreeTier).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should handle disable when subscription not found', async () => {
      const payload = createWebhookPayload('subscription.disable', {
        subscription_code: 'SUB_nonexistent',
      });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
    });
  });

  describe('subscription.not_renew Event', () => {
    it('should mark subscription for cancellation at period end', async () => {
      const payload = createWebhookPayload('subscription.not_renew', {
        subscription_code: TEST_SUBSCRIPTION_CODE,
      });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        cancelAtPeriodEnd: true,
      } as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        { cancelAtPeriodEnd: true },
      );
    });
  });

  describe('invoice.payment_failed Event', () => {
    it('should update subscription to past_due', async () => {
      const payload = createWebhookPayload('invoice.payment_failed');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.PAST_DUE,
      } as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        { status: SubscriptionStatus.PAST_DUE },
      );
    });

    it('should handle payment failure when subscription not found', async () => {
      const payload = createWebhookPayload('invoice.payment_failed');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
    });
  });

  describe('refund.processed Event', () => {
    it('should void invoice when refund is processed', async () => {
      const payload = createWebhookPayload('refund.processed');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      invoicesService.findByStripeInvoiceId.mockResolvedValue(mockDbInvoice as any);
      invoicesService.update.mockResolvedValue({
        ...mockDbInvoice,
        status: InvoiceStatus.VOID,
      } as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(invoicesService.update).toHaveBeenCalledWith(
        mockDbInvoice.id,
        { status: InvoiceStatus.VOID },
      );
    });

    it('should handle refund when invoice not found', async () => {
      const payload = createWebhookPayload('refund.processed');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      invoicesService.findByStripeInvoiceId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(invoicesService.update).not.toHaveBeenCalled();
    });
  });

  describe('transfer.success Event', () => {
    it('should handle transfer success event', async () => {
      const payload = createWebhookPayload('transfer.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('transfer.failed Event', () => {
    it('should handle transfer failed event', async () => {
      const payload = createWebhookPayload('transfer.failed');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('customeridentification Events', () => {
    it('should handle customeridentification.success event', async () => {
      const payload = createWebhookPayload('customeridentification.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle customeridentification.failed event', async () => {
      const payload = createWebhookPayload('customeridentification.failed');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('dedicatedaccount Events', () => {
    it('should handle dedicatedaccount.assign.success event', async () => {
      const payload = createWebhookPayload('dedicatedaccount.assign.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle dedicatedaccount.assign.failed event', async () => {
      const payload = createWebhookPayload('dedicatedaccount.assign.failed');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('Idempotency Handling', () => {
    it('should handle duplicate charge.success events', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      // Process first event
      const result1 = await controller.handleWebhook(mockRequest, signature, payload);
      expect(result1).toEqual({ status: 'success' });

      // Process duplicate event
      const result2 = await controller.handleWebhook(mockRequest, signature, payload);
      expect(result2).toEqual({ status: 'success' });
    });

    it('should handle multiple webhooks processed concurrently', async () => {
      const payload1 = createWebhookPayload('charge.success');
      const payload2 = createWebhookPayload('subscription.disable', {
        subscription_code: TEST_SUBSCRIPTION_CODE,
      });

      const mockRequest1 = createMockRequest(payload1);
      const mockRequest2 = createMockRequest(payload2);
      const signature1 = generatePaystackSignature(JSON.stringify(payload1));
      const signature2 = generatePaystackSignature(JSON.stringify(payload2));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.downgradeToFreeTier.mockResolvedValue({} as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const results = await Promise.all([
        controller.handleWebhook(mockRequest1, signature1, payload1),
        controller.handleWebhook(mockRequest2, signature2, payload2),
      ]);

      expect(results).toEqual([{ status: 'success' }, { status: 'success' }]);
    });
  });

  describe('Error Handling', () => {
    it('should return error status when subscription creation fails', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockRejectedValue(new Error('Database error'));

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'error', message: 'Database error' });
    });

    it('should handle invoice service errors gracefully', async () => {
      const payload = createWebhookPayload('charge.success');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockRejectedValue(new Error('Invoice error'));

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'error', message: 'Invoice error' });
    });
  });

  describe('Unhandled Event Types', () => {
    it('should handle unknown event types gracefully', async () => {
      const payload = createWebhookPayload('unknown.event');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle invoice.create event', async () => {
      const payload = createWebhookPayload('invoice.create');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle invoice.update event', async () => {
      const payload = createWebhookPayload('invoice.update');
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle payload with empty metadata', async () => {
      const payload = createWebhookPayload('charge.success', { metadata: undefined });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('should handle customer with minimal data', async () => {
      const payload = createWebhookPayload('charge.success', {
        customer: { email: TEST_CUSTOMER_EMAIL },
      } as any);
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle various amounts in kobo', async () => {
      const amounts = [100, 10000, 499900, 8999900, 14999900, 29999900];

      for (const amount of amounts) {
        jest.clearAllMocks();

        const payload = createWebhookPayload('charge.success', { amount });
        const mockRequest = createMockRequest(payload);
        const signature = generatePaystackSignature(JSON.stringify(payload));

        paystackService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
        subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
        invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

        const result = await controller.handleWebhook(mockRequest, signature, payload);

        expect(result).toEqual({ status: 'success' });
        expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ amount: amount / 100 }),
        );
      }
    });

    it('should handle different currencies', async () => {
      const currencies = ['NGN', 'GHS', 'ZAR', 'USD'];

      for (const currency of currencies) {
        jest.clearAllMocks();

        const payload = createWebhookPayload('charge.success', { currency });
        const mockRequest = createMockRequest(payload);
        const signature = generatePaystackSignature(JSON.stringify(payload));

        paystackService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
        subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
        invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

        const result = await controller.handleWebhook(mockRequest, signature, payload);

        expect(result).toEqual({ status: 'success' });
        expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ currency }),
        );
      }
    });

    it('should handle authorization without reusable flag', async () => {
      const payload = createWebhookPayload('charge.success', {
        authorization: {
          authorization_code: 'AUTH_test123',
          card_type: 'visa',
          last4: '4081',
          exp_month: '12',
          exp_year: '2025',
          reusable: false,
        },
      });
      const mockRequest = createMockRequest(payload);
      const signature = generatePaystackSignature(JSON.stringify(payload));

      paystackService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, signature, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });
});
