/**
 * Comprehensive Flutterwave Webhook Controller Tests
 * Tests for all webhook event types, signature verification, and idempotency handling
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FlutterwaveController } from '../flutterwave.controller';
import { FlutterwaveService } from '../flutterwave.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { InvoicesService } from '../../invoices/invoices.service';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import * as crypto from 'crypto';

// Define interface for Flutterwave webhook payload
interface FlutterwaveWebhookPayload {
  event: string;
  'event.type'?: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
      name?: string;
      phone_number?: string;
    };
    meta?: Record<string, string>;
    created_at: string;
  };
}

describe('FlutterwaveController - Comprehensive Webhook Tests', () => {
  let controller: FlutterwaveController;
  let flutterwaveService: jest.Mocked<FlutterwaveService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let invoicesService: jest.Mocked<InvoicesService>;

  // Test data constants
  const TEST_USER_ID = 'user_test_flw_123';
  const TEST_TX_REF = 'AFU_1702000000_abc123def456';
  const TEST_FLW_REF = 'FLW-MOCK-12345678';
  const TEST_CUSTOMER_EMAIL = 'test@example.com';
  const WEBHOOK_SECRET = 'flw_test_webhook_secret';

  // Mock database subscription
  const mockDbSubscription = {
    id: 'db_subscription_uuid_flw',
    userId: TEST_USER_ID,
    stripeCustomerId: TEST_CUSTOMER_EMAIL,
    stripeSubscriptionId: TEST_FLW_REF,
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
    id: 'db_invoice_uuid_flw',
    subscriptionId: mockDbSubscription.id,
    stripeInvoiceId: TEST_FLW_REF,
    stripeCustomerId: TEST_CUSTOMER_EMAIL,
    amount: 49.99,
    currency: 'USD',
    status: InvoiceStatus.PAID,
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Helper to create Flutterwave webhook payload
  const createWebhookPayload = (
    event: string,
    overrides: Partial<FlutterwaveWebhookPayload['data']> = {},
  ): FlutterwaveWebhookPayload => ({
    event,
    data: {
      id: 12345678,
      tx_ref: TEST_TX_REF,
      flw_ref: TEST_FLW_REF,
      amount: 49.99,
      currency: 'USD',
      status: 'successful',
      customer: {
        email: TEST_CUSTOMER_EMAIL,
        name: 'Test User',
        phone_number: '+1234567890',
      },
      meta: {
        userId: TEST_USER_ID,
        tier: SubscriptionTier.BASIC,
        billingPeriod: 'monthly',
      },
      created_at: new Date().toISOString(),
      ...overrides,
    },
  });

  // Helper to create mock request
  const createMockRequest = (rawBody?: Buffer) => ({
    rawBody: rawBody || Buffer.from('{}'),
  } as any);

  beforeEach(async () => {
    const mockFlutterwaveService = {
      verifyWebhookSignature: jest.fn(),
      verifyTransaction: jest.fn(),
      createPaymentLink: jest.fn(),
      cancelSubscription: jest.fn(),
      initiateRefund: jest.fn(),
      getBanks: jest.fn(),
      createVirtualAccount: jest.fn(),
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
      controllers: [FlutterwaveController],
      providers: [
        { provide: FlutterwaveService, useValue: mockFlutterwaveService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: InvoicesService, useValue: mockInvoicesService },
      ],
    }).compile();

    controller = module.get<FlutterwaveController>(FlutterwaveController);
    flutterwaveService = module.get(FlutterwaveService);
    subscriptionsService = module.get(SubscriptionsService);
    invoicesService = module.get(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Signature Verification', () => {
    it('should accept valid webhook signature', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(flutterwaveService.verifyWebhookSignature).toHaveBeenCalledWith(WEBHOOK_SECRET);
    });

    it('should reject invalid webhook signature', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        controller.handleWebhook(mockRequest, 'invalid_signature', payload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing verif-hash header', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      await expect(
        controller.handleWebhook(mockRequest, '', payload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject null verif-hash header', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      await expect(
        controller.handleWebhook(mockRequest, null as any, payload),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('charge.completed / CARD_TRANSACTION Event', () => {
    it('should create subscription and invoice when charge is successful', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        stripeCustomerId: TEST_CUSTOMER_EMAIL,
        stripeSubscriptionId: TEST_FLW_REF,
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
        cancelAtPeriodEnd: false,
      });
      expect(invoicesService.createOrUpdate).toHaveBeenCalledWith({
        subscriptionId: mockDbSubscription.id,
        stripeInvoiceId: TEST_FLW_REF,
        stripeCustomerId: TEST_CUSTOMER_EMAIL,
        amount: 49.99,
        currency: 'USD',
        status: InvoiceStatus.PAID,
        paidAt: expect.any(Date),
      });
    });

    it('should handle charge.completed event type', async () => {
      const mockRequest = createMockRequest();
      const payload: FlutterwaveWebhookPayload = {
        ...createWebhookPayload('charge.completed'),
        'event.type': 'charge.completed',
      };

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).toHaveBeenCalled();
    });

    it('should skip non-successful transactions', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION', { status: 'failed' });

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('should skip transaction without tier in metadata', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION', {
        meta: { userId: TEST_USER_ID }, // no tier
      });

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

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

        const mockRequest = createMockRequest();
        const payload = createWebhookPayload('CARD_TRANSACTION', {
          meta: { userId: TEST_USER_ID, tier, billingPeriod: 'monthly' },
        });

        flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue({ ...mockDbSubscription, tier } as any);
        subscriptionsService.findByUserId.mockResolvedValue({ ...mockDbSubscription, tier } as any);
        invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

        const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

        expect(result).toEqual({ status: 'success' });
        expect(subscriptionsService.create).toHaveBeenCalledWith(
          expect.objectContaining({ tier }),
        );
      }
    });

    it('should calculate yearly billing period correctly', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION', {
        meta: { userId: TEST_USER_ID, tier: SubscriptionTier.BASIC, billingPeriod: 'yearly' },
      });

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPeriodEnd: expect.any(Date),
        }),
      );

      // Verify the period end is approximately 1 year from now
      const createCall = subscriptionsService.create.mock.calls[0][0];
      const periodEnd = new Date(createCall.currentPeriodEnd);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      // Allow 1 second tolerance
      expect(Math.abs(periodEnd.getTime() - oneYearFromNow.getTime())).toBeLessThan(1000);
    });

    it('should handle different currencies', async () => {
      const currencies = ['NGN', 'GHS', 'KES', 'ZAR', 'EUR'];

      for (const currency of currencies) {
        jest.clearAllMocks();

        const mockRequest = createMockRequest();
        const payload = createWebhookPayload('CARD_TRANSACTION', { currency });

        flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
        subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
        invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

        const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

        expect(result).toEqual({ status: 'success' });
        expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ currency }),
        );
      }
    });
  });

  describe('subscription.cancelled / SUBSCRIPTION_CANCELLED Event', () => {
    it('should cancel subscription and downgrade to free tier', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('SUBSCRIPTION_CANCELLED');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.CANCELED,
      } as any);
      subscriptionsService.downgradeToFreeTier.mockResolvedValue({
        ...mockDbSubscription,
        tier: SubscriptionTier.FREEMIUM,
      } as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

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

    it('should handle subscription.cancelled event type', async () => {
      const mockRequest = createMockRequest();
      const payload: FlutterwaveWebhookPayload = {
        ...createWebhookPayload('subscription.cancelled'),
        'event.type': 'subscription.cancelled',
      };

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.CANCELED,
      } as any);
      subscriptionsService.downgradeToFreeTier.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).toHaveBeenCalled();
    });

    it('should handle cancellation when subscription not found', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('SUBSCRIPTION_CANCELLED');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
      expect(subscriptionsService.downgradeToFreeTier).not.toHaveBeenCalled();
    });
  });

  describe('charge.failed / PAYMENT_FAILED Event', () => {
    it('should update subscription to past_due when payment fails', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('PAYMENT_FAILED', { status: 'failed' });

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({
        ...mockDbSubscription,
        status: SubscriptionStatus.PAST_DUE,
      } as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).toHaveBeenCalledWith(
        mockDbSubscription.id,
        { status: SubscriptionStatus.PAST_DUE },
      );
    });

    it('should handle charge.failed event type', async () => {
      const mockRequest = createMockRequest();
      const payload: FlutterwaveWebhookPayload = {
        ...createWebhookPayload('charge.failed'),
        'event.type': 'charge.failed',
      };
      payload.data.status = 'failed';

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).toHaveBeenCalled();
    });

    it('should handle payment failure when subscription not found', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('PAYMENT_FAILED', { status: 'failed' });

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.update).not.toHaveBeenCalled();
    });
  });

  describe('refund.completed / REFUND_COMPLETED Event', () => {
    it('should void invoice when refund is completed', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('REFUND_COMPLETED');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      invoicesService.findByStripeInvoiceId.mockResolvedValue(mockDbInvoice as any);
      invoicesService.update.mockResolvedValue({
        ...mockDbInvoice,
        status: InvoiceStatus.VOID,
      } as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(invoicesService.update).toHaveBeenCalledWith(
        mockDbInvoice.id,
        { status: InvoiceStatus.VOID },
      );
    });

    it('should handle refund.completed event type', async () => {
      const mockRequest = createMockRequest();
      const payload: FlutterwaveWebhookPayload = {
        ...createWebhookPayload('refund.completed'),
        'event.type': 'refund.completed',
      };

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      invoicesService.findByStripeInvoiceId.mockResolvedValue(mockDbInvoice as any);
      invoicesService.update.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(invoicesService.update).toHaveBeenCalled();
    });

    it('should handle refund when invoice not found', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('REFUND_COMPLETED');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      invoicesService.findByStripeInvoiceId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(invoicesService.update).not.toHaveBeenCalled();
    });
  });

  describe('transfer.completed / TRANSFER_COMPLETED Event', () => {
    it('should handle transfer completed event', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('TRANSFER_COMPLETED');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle transfer.completed event type', async () => {
      const mockRequest = createMockRequest();
      const payload: FlutterwaveWebhookPayload = {
        ...createWebhookPayload('transfer.completed'),
        'event.type': 'transfer.completed',
      };

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('Idempotency Handling', () => {
    it('should handle duplicate CARD_TRANSACTION events', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      // Process first event
      const result1 = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);
      expect(result1).toEqual({ status: 'success' });

      // Process duplicate event
      const result2 = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);
      expect(result2).toEqual({ status: 'success' });
    });

    it('should handle multiple webhooks processed concurrently', async () => {
      const mockRequest = createMockRequest();

      const payload1 = createWebhookPayload('CARD_TRANSACTION');
      const payload2 = createWebhookPayload('SUBSCRIPTION_CANCELLED');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.downgradeToFreeTier.mockResolvedValue({} as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const results = await Promise.all([
        controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload1),
        controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload2),
      ]);

      expect(results).toEqual([{ status: 'success' }, { status: 'success' }]);
    });
  });

  describe('Error Handling', () => {
    it('should return error status when subscription creation fails', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockRejectedValue(new Error('Database error'));

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'error', message: 'Database error' });
    });

    it('should handle invoice service errors gracefully', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockRejectedValue(new Error('Invoice error'));

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'error', message: 'Invoice error' });
    });

    it('should handle subscription update errors', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('SUBSCRIPTION_CANCELLED');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.update.mockRejectedValue(new Error('Update failed'));

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'error', message: 'Update failed' });
    });
  });

  describe('Unhandled Event Types', () => {
    it('should handle unknown event types gracefully', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('UNKNOWN_EVENT_TYPE');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle VBA.created event', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('VBA.created');

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle payload with empty meta', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION', { meta: undefined });

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.findByUserId.mockResolvedValue(null);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('should handle customer with minimal data', async () => {
      const mockRequest = createMockRequest();
      const payload = createWebhookPayload('CARD_TRANSACTION', {
        customer: { email: TEST_CUSTOMER_EMAIL },
      } as any);

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
    });

    it('should handle various transaction amounts', async () => {
      const amounts = [0.01, 1.00, 23.99, 49.99, 89.99, 149.99, 299.99, 2999.99];

      for (const amount of amounts) {
        jest.clearAllMocks();

        const mockRequest = createMockRequest();
        const payload = createWebhookPayload('CARD_TRANSACTION', { amount });

        flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
        subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
        subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
        invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

        const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

        expect(result).toEqual({ status: 'success' });
        expect(invoicesService.createOrUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ amount }),
        );
      }
    });

    it('should handle event.type taking precedence over event', async () => {
      const mockRequest = createMockRequest();
      const payload: FlutterwaveWebhookPayload = {
        event: 'CARD_TRANSACTION',
        'event.type': 'charge.completed',
        data: {
          id: 12345678,
          tx_ref: TEST_TX_REF,
          flw_ref: TEST_FLW_REF,
          amount: 49.99,
          currency: 'USD',
          status: 'successful',
          customer: { email: TEST_CUSTOMER_EMAIL },
          meta: { userId: TEST_USER_ID, tier: SubscriptionTier.BASIC, billingPeriod: 'monthly' },
          created_at: new Date().toISOString(),
        },
      };

      flutterwaveService.verifyWebhookSignature.mockReturnValue(true);
      subscriptionsService.create.mockResolvedValue(mockDbSubscription as any);
      subscriptionsService.findByUserId.mockResolvedValue(mockDbSubscription as any);
      invoicesService.createOrUpdate.mockResolvedValue(mockDbInvoice as any);

      const result = await controller.handleWebhook(mockRequest, WEBHOOK_SECRET, payload);

      expect(result).toEqual({ status: 'success' });
      // Should process as charge.completed
      expect(subscriptionsService.create).toHaveBeenCalled();
    });
  });
});
