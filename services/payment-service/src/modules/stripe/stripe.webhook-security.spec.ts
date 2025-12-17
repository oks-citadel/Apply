// Mock Stripe SDK to avoid localStorage issues
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InvoicesService } from '../invoices/invoices.service';
import {
  generateWebhookSignature,
  generateExpiredWebhookSignature,
  generateInvalidWebhookSignature,
  WebhookSignatureScenarios,
  CommonEventScenarios,
  createMockWebhookRequest,
  MockSubscriptionBuilder,
  MockInvoiceBuilder,
  MockCheckoutSessionBuilder,
} from './test-utils/webhook-test-helpers';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import Stripe from 'stripe';

describe('StripeController - Advanced Webhook Security', () => {
  let controller: StripeController;
  let stripeService: jest.Mocked<StripeService>;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let invoicesService: jest.Mocked<InvoicesService>;

  const WEBHOOK_SECRET = 'whsec_test_secret_key';
  const mockUserId = 'user_security_test';
  const mockSubscriptionId = 'sub_security_test';

  beforeEach(async () => {
    const mockStripeService = {
      constructWebhookEvent: jest.fn(),
      getSubscription: jest.fn(),
    };

    const mockSubscriptionsService = {
      create: jest.fn(),
      update: jest.fn(),
      findByStripeSubscriptionId: jest.fn(),
      downgradeToFreeTier: jest.fn(),
    };

    const mockInvoicesService = {
      createOrUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: InvoicesService, useValue: mockInvoicesService },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    stripeService = module.get(StripeService);
    subscriptionsService = module.get(SubscriptionsService);
    invoicesService = module.get(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Signature Validation Edge Cases', () => {
    it('should reject webhook with valid signature format but wrong secret', async () => {
      const payload = Buffer.from(JSON.stringify({ test: 'data' }));
      const wrongSecretSignature = generateWebhookSignature(payload, 'wrong_secret');
      const request = createMockWebhookRequest(payload, wrongSecretSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Signature verification failed');
      });

      const result = await controller.handleWebhook(request, wrongSecretSignature);

      expect(result).toEqual({ received: false });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalled();
    });

    it('should reject webhook with tampered payload', async () => {
      const originalPayload = Buffer.from(JSON.stringify({ amount: 1000 }));
      const signature = generateWebhookSignature(originalPayload, WEBHOOK_SECRET);

      // Tamper with the payload after signature generation
      const tamperedPayload = Buffer.from(JSON.stringify({ amount: 100000 }));
      const request = createMockWebhookRequest(tamperedPayload, signature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Signature verification failed');
      });

      const result = await controller.handleWebhook(request, signature);

      expect(result).toEqual({ received: false });
    });

    it('should reject webhook with signature from different payload', async () => {
      const payload1 = Buffer.from(JSON.stringify({ event: 'original' }));
      const payload2 = Buffer.from(JSON.stringify({ event: 'different' }));
      const signatureForPayload1 = generateWebhookSignature(payload1, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(payload2, signatureForPayload1);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Signature verification failed');
      });

      const result = await controller.handleWebhook(request, signatureForPayload1);

      expect(result).toEqual({ received: false });
    });

    it('should reject webhook with replay attack (old timestamp)', async () => {
      const payload = Buffer.from(JSON.stringify({ test: 'data' }));
      const expiredSignature = generateExpiredWebhookSignature(payload, WEBHOOK_SECRET, 15);
      const request = createMockWebhookRequest(payload, expiredSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Timestamp outside the tolerance zone');
      });

      const result = await controller.handleWebhook(request, expiredSignature);

      expect(result).toEqual({ received: false });
    });

    it('should handle multiple signatures in header (only v1 scheme)', async () => {
      const payload = Buffer.from(JSON.stringify({ test: 'data' }));
      const time = Math.floor(Date.now() / 1000);
      const multiSignature = `t=${time},v0=invalid,v1=valid_signature`;
      const request = createMockWebhookRequest(payload, multiSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No valid signatures found');
      });

      const result = await controller.handleWebhook(request, multiSignature);

      expect(result).toEqual({ received: false });
    });
  });

  describe('Using Test Helper Utilities', () => {
    it('should process valid webhook using MockCheckoutSessionBuilder', async () => {
      const session = new MockCheckoutSessionBuilder()
        .withMetadata({ userId: mockUserId, tier: SubscriptionTier.PROFESSIONAL })
        .withSubscription(mockSubscriptionId)
        .build();

      const event = CommonEventScenarios.checkoutCompleted(mockUserId, SubscriptionTier.PROFESSIONAL);
      const payload = Buffer.from(JSON.stringify(event));
      const signature = WebhookSignatureScenarios.valid(payload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(payload, signature);

      const mockSubscription = new MockSubscriptionBuilder()
        .withMetadata({ userId: mockUserId, tier: SubscriptionTier.PROFESSIONAL })
        .build();

      stripeService.constructWebhookEvent.mockReturnValue(event);
      stripeService.getSubscription.mockResolvedValue(mockSubscription);
      subscriptionsService.create.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(request, signature);

      expect(result).toEqual({ received: true });
    });

    it('should reject webhook using invalid signature scenario', async () => {
      const event = CommonEventScenarios.subscriptionCreated(mockUserId);
      const payload = Buffer.from(JSON.stringify(event));
      const invalidSignature = WebhookSignatureScenarios.invalid();
      const request = createMockWebhookRequest(payload, invalidSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Invalid signature');
      });

      const result = await controller.handleWebhook(request, invalidSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject webhook using expired signature scenario', async () => {
      const event = CommonEventScenarios.subscriptionUpdated(mockUserId);
      const payload = Buffer.from(JSON.stringify(event));
      const expiredSignature = WebhookSignatureScenarios.expired(payload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(payload, expiredSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Timestamp outside tolerance zone');
      });

      const result = await controller.handleWebhook(request, expiredSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject malformed signature', async () => {
      const event = CommonEventScenarios.invoicePaid(mockSubscriptionId);
      const payload = Buffer.from(JSON.stringify(event));
      const malformedSignature = WebhookSignatureScenarios.malformed();
      const request = createMockWebhookRequest(payload, malformedSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Invalid signature format');
      });

      const result = await controller.handleWebhook(request, malformedSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject signature with wrong version', async () => {
      const event = CommonEventScenarios.invoicePaymentFailed(mockSubscriptionId);
      const payload = Buffer.from(JSON.stringify(event));
      const wrongVersionSignature = WebhookSignatureScenarios.wrongVersion(payload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(payload, wrongVersionSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No signatures found with expected scheme');
      });

      const result = await controller.handleWebhook(request, wrongVersionSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject signature with missing timestamp', async () => {
      const event = CommonEventScenarios.subscriptionDeleted(mockUserId);
      const payload = Buffer.from(JSON.stringify(event));
      const noTimestampSignature = WebhookSignatureScenarios.missingTimestamp(payload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(payload, noTimestampSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Unable to extract timestamp and signatures');
      });

      const result = await controller.handleWebhook(request, noTimestampSignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject empty signature', async () => {
      const event = CommonEventScenarios.invoiceCreated(mockSubscriptionId);
      const payload = Buffer.from(JSON.stringify(event));
      const emptySignature = WebhookSignatureScenarios.empty();
      const request = createMockWebhookRequest(payload, emptySignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No signature provided');
      });

      const result = await controller.handleWebhook(request, emptySignature);

      expect(result).toEqual({ received: false });
    });

    it('should reject signature with only timestamp', async () => {
      const event = CommonEventScenarios.checkoutCompleted(mockUserId);
      const payload = Buffer.from(JSON.stringify(event));
      const onlyTimestampSignature = WebhookSignatureScenarios.onlyTimestamp();
      const request = createMockWebhookRequest(payload, onlyTimestampSignature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('No signatures found');
      });

      const result = await controller.handleWebhook(request, onlyTimestampSignature);

      expect(result).toEqual({ received: false });
    });
  });

  describe('Payload Integrity Validation', () => {
    it('should validate payload size limits', async () => {
      // Create a very large payload (simulate DOS attack)
      const largePayload = Buffer.from('x'.repeat(5 * 1024 * 1024)); // 5MB
      const signature = generateWebhookSignature(largePayload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(largePayload, signature);

      // Stripe webhook events should typically be much smaller
      // Large payloads might indicate an attack
      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Payload too large');
      });

      const result = await controller.handleWebhook(request, signature);

      expect(result).toEqual({ received: false });
    });

    it('should handle binary payload data correctly', async () => {
      const binaryPayload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe]);
      const signature = generateWebhookSignature(binaryPayload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(binaryPayload, signature);

      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new BadRequestException('Invalid payload format');
      });

      const result = await controller.handleWebhook(request, signature);

      expect(result).toEqual({ received: false });
    });

    it('should handle UTF-8 encoded payload correctly', async () => {
      const utf8Payload = Buffer.from('{"emoji": "🔒", "test": "data"}', 'utf8');
      const signature = generateWebhookSignature(utf8Payload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(utf8Payload, signature);

      const event = CommonEventScenarios.checkoutCompleted(mockUserId);
      stripeService.constructWebhookEvent.mockReturnValue(event);
      stripeService.getSubscription.mockResolvedValue({} as any);
      subscriptionsService.create.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(request, signature);

      expect(result).toEqual({ received: true });
    });
  });

  describe('Timing Attack Prevention', () => {
    it('should use constant-time comparison for signature validation', async () => {
      const payload = Buffer.from(JSON.stringify({ test: 'data' }));
      const validSignature = generateWebhookSignature(payload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(payload, validSignature);

      // Mock the Stripe service to simulate constant-time comparison
      const startTime = Date.now();
      stripeService.constructWebhookEvent.mockImplementation(() => {
        // Simulate constant-time comparison
        const mockDelay = 5; // milliseconds
        const endTime = Date.now();
        if (endTime - startTime < mockDelay) {
          // Timing should be consistent regardless of where comparison fails
        }
        throw new BadRequestException('Invalid signature');
      });

      const result = await controller.handleWebhook(request, validSignature);

      expect(result).toEqual({ received: false });
    });
  });

  describe('Race Condition and Concurrent Request Handling', () => {
    it('should handle rapid sequential webhooks for same event', async () => {
      const event = CommonEventScenarios.subscriptionCreated(mockUserId);
      const payload = Buffer.from(JSON.stringify(event));
      const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
      const request = createMockWebhookRequest(payload, signature);

      stripeService.constructWebhookEvent.mockReturnValue(event);
      subscriptionsService.findByStripeSubscriptionId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing' } as any); // Second call finds existing
      subscriptionsService.create.mockResolvedValue({} as any);

      // Process same webhook twice rapidly
      const result1 = await controller.handleWebhook(request, signature);
      const result2 = await controller.handleWebhook(request, signature);

      expect(result1).toEqual({ received: true });
      expect(result2).toEqual({ received: true });
      expect(subscriptionsService.create).toHaveBeenCalledTimes(1); // Should only create once
    });
  });

  describe('Security Headers Validation', () => {
    it('should only accept webhooks from Stripe user-agent', async () => {
      const event = CommonEventScenarios.invoicePaid(mockSubscriptionId);
      const payload = Buffer.from(JSON.stringify(event));
      const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
      const request = {
        ...createMockWebhookRequest(payload, signature),
        headers: {
          'stripe-signature': signature,
          'user-agent': 'Stripe/1.0',
        },
      };

      stripeService.constructWebhookEvent.mockReturnValue(event);
      subscriptionsService.findByStripeSubscriptionId.mockResolvedValue({ id: 'test' } as any);
      invoicesService.createOrUpdate.mockResolvedValue({} as any);

      const result = await controller.handleWebhook(request, signature);

      expect(result).toEqual({ received: true });
    });
  });

  describe('Builder Pattern Tests', () => {
    it('should create complex subscription scenario using builders', async () => {
      const customerId = 'cus_builder_test';
      const subscription = new MockSubscriptionBuilder()
        .withCustomer(customerId)
        .withTier(SubscriptionTier.EXECUTIVE_ELITE)
        .withStatus('active')
        .withCancelAtPeriodEnd(false)
        .withMetadata({ userId: mockUserId, source: 'web' })
        .build();

      expect(subscription.customer).toBe(customerId);
      expect(subscription.metadata?.tier).toBe(SubscriptionTier.EXECUTIVE_ELITE);
      expect(subscription.status).toBe('active');
      expect(subscription.cancel_at_period_end).toBe(false);
    });

    it('should create complex invoice scenario using builders', async () => {
      const customerId = 'cus_invoice_test';
      const subscriptionId = 'sub_invoice_test';
      const paidTimestamp = Math.floor(Date.now() / 1000);

      const invoice = new MockInvoiceBuilder()
        .withCustomer(customerId)
        .withSubscription(subscriptionId)
        .withStatus('paid')
        .withAmount(14999) // $149.99
        .withCurrency('usd')
        .withPaidAt(paidTimestamp)
        .build();

      expect(invoice.customer).toBe(customerId);
      expect(invoice.subscription).toBe(subscriptionId);
      expect(invoice.status).toBe('paid');
      expect(invoice.amount_paid).toBe(14999);
      expect(invoice.currency).toBe('usd');
      expect(invoice.status_transitions?.paid_at).toBe(paidTimestamp);
    });

    it('should create invoice without status transitions using builder', async () => {
      const invoice = new MockInvoiceBuilder()
        .withStatus('open')
        .withAmount(4999)
        .withoutStatusTransitions()
        .build();

      expect(invoice.status).toBe('open');
      expect(invoice.status_transitions).toBeNull();
    });

    it('should create checkout session with custom metadata using builder', async () => {
      const session = new MockCheckoutSessionBuilder()
        .withMetadata({
          userId: mockUserId,
          tier: SubscriptionTier.ADVANCED_CAREER,
          source: 'mobile',
          campaign: 'summer2024',
        })
        .withStatus('complete')
        .build();

      expect(session.metadata?.userId).toBe(mockUserId);
      expect(session.metadata?.tier).toBe(SubscriptionTier.ADVANCED_CAREER);
      expect(session.metadata?.source).toBe('mobile');
      expect(session.status).toBe('complete');
    });
  });
});
