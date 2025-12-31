import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DunningService, DunningAttempt, DunningConfig } from './dunning.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import Stripe from 'stripe';

describe('DunningService', () => {
  let service: DunningService;
  let subscriptionRepository: jest.Mocked<Repository<Subscription>>;
  let notificationClient: any;
  let stripeMock: jest.Mocked<Stripe>;

  // Factory function to create mock subscription
  const createMockSubscription = (overrides: Partial<Subscription> = {}): Partial<Subscription> => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);

    return {
      id: 'sub_123',
      userId: 'user_123',
      tier: SubscriptionTier.PROFESSIONAL,
      status: SubscriptionStatus.PAST_DUE,
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_stripe123',
      currentPeriodStart: pastDate,
      currentPeriodEnd: futureDate,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      createdAt: pastDate,
      updatedAt: new Date(),
      ...overrides,
    };
  };

  const mockStripeInvoice: Stripe.Invoice = {
    id: 'in_test123',
    object: 'invoice',
    customer: 'cus_test123',
    subscription: 'sub_stripe123',
    status: 'open',
    amount_paid: 0,
    amount_due: 8999,
    currency: 'usd',
    created: Date.now() / 1000,
  } as Stripe.Invoice;

  const mockPaidInvoice: Stripe.Invoice = {
    ...mockStripeInvoice,
    status: 'paid',
    amount_paid: 8999,
  } as Stripe.Invoice;

  beforeEach(async () => {
    // Create Stripe mock
    stripeMock = {
      invoices: {
        list: jest.fn(),
        pay: jest.fn(),
      },
    } as any;

    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockNotificationClient = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DunningService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockRepository,
        },
        {
          provide: 'NOTIFICATION_SERVICE',
          useValue: mockNotificationClient,
        },
        {
          provide: 'STRIPE_CLIENT',
          useValue: stripeMock,
        },
      ],
    }).compile();

    service = module.get<DunningService>(DunningService);
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
    notificationClient = module.get('NOTIFICATION_SERVICE');

    // Clear in-memory dunning attempts between tests
    (service as any).dunningAttempts.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processFailedPayments', () => {
    it('should find and process past_due subscriptions', async () => {
      const mockSubscription = createMockSubscription();
      subscriptionRepository.find.mockResolvedValue([mockSubscription as Subscription]);
      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue(mockSubscription as Subscription);

      await service.processFailedPayments();

      expect(subscriptionRepository.find).toHaveBeenCalledWith({
        where: { status: SubscriptionStatus.PAST_DUE },
      });
    });

    it('should process multiple past_due subscriptions', async () => {
      const subscriptions = [
        createMockSubscription({ id: 'sub_1' }),
        createMockSubscription({ id: 'sub_2' }),
        createMockSubscription({ id: 'sub_3' }),
      ];

      subscriptionRepository.find.mockResolvedValue(subscriptions as Subscription[]);
      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue(subscriptions[0] as Subscription);

      await service.processFailedPayments();

      expect(subscriptionRepository.find).toHaveBeenCalled();
    });

    it('should handle empty list of past_due subscriptions', async () => {
      subscriptionRepository.find.mockResolvedValue([]);

      await service.processFailedPayments();

      expect(subscriptionRepository.find).toHaveBeenCalled();
      expect(stripeMock.invoices.list).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      subscriptionRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.processFailedPayments()).resolves.not.toThrow();
    });
  });

  describe('processSubscription', () => {
    it('should skip processing if max retries exceeded', async () => {
      const mockSubscription = createMockSubscription();

      // Simulate 5 previous attempts (max is 4)
      for (let i = 1; i <= 5; i++) {
        (service as any).dunningAttempts.set(mockSubscription.id, [
          ...((service as any).dunningAttempts.get(mockSubscription.id) || []),
          {
            subscriptionId: mockSubscription.id,
            userId: mockSubscription.userId,
            attemptNumber: i,
            attemptedAt: new Date(),
            status: 'failed',
          },
        ]);
      }

      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.UNPAID,
      } as Subscription);

      await service.processSubscription(mockSubscription as Subscription);

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.UNPAID,
        }),
      );
    });
  });

  describe('retryPayment', () => {
    it('should retry payment and succeed', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('success');
      expect(stripeMock.invoices.pay).toHaveBeenCalledWith(mockStripeInvoice.id, { forgive: false });
    });

    it('should retry payment and fail', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockRejectedValue(new Error('Card declined'));

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('Card declined');
    });

    it('should mark as success when no open invoices', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [],
      } as unknown as Stripe.ApiList<Stripe.Invoice>);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('success');
    });

    it('should handle missing Stripe subscription ID', async () => {
      const mockSubscription = createMockSubscription({ stripeSubscriptionId: null });

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('No Stripe subscription ID');
    });

    it('should handle partial payment failure', async () => {
      const mockSubscription = createMockSubscription();
      const partiallyPaidInvoice = {
        ...mockStripeInvoice,
        status: 'open',
        amount_paid: 5000,
      } as Stripe.Invoice;

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(partiallyPaidInvoice);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('failed');
    });
  });

  describe('Retry Intervals', () => {
    it('should respect retry interval for first attempt', async () => {
      const mockSubscription = createMockSubscription();
      const recentAttempt: DunningAttempt = {
        subscriptionId: mockSubscription.id!,
        userId: mockSubscription.userId!,
        attemptNumber: 1,
        attemptedAt: new Date(), // Just now
        status: 'failed',
      };

      (service as any).dunningAttempts.set(mockSubscription.id, [recentAttempt]);

      // Should not retry because interval not met (1 day)
      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);

      await service.processSubscription(mockSubscription as Subscription);

      // Should not call pay because retry interval not met
      expect(stripeMock.invoices.pay).not.toHaveBeenCalled();
    });

    it('should allow retry after interval has passed', async () => {
      const mockSubscription = createMockSubscription();
      const oldAttempt: DunningAttempt = {
        subscriptionId: mockSubscription.id!,
        userId: mockSubscription.userId!,
        attemptNumber: 1,
        attemptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: 'failed',
      };

      (service as any).dunningAttempts.set(mockSubscription.id, [oldAttempt]);

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      await service.processSubscription(mockSubscription as Subscription);

      expect(stripeMock.invoices.pay).toHaveBeenCalled();
    });
  });

  describe('Notification Sending', () => {
    it('should send first reminder on first failure', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockRejectedValue(new Error('Card declined'));

      await service.retryPayment(mockSubscription as Subscription, 1);

      expect(notificationClient.emit).toHaveBeenCalledWith('notification.send', {
        userId: mockSubscription.userId,
        template: 'payment-failed-1',
        data: expect.objectContaining({
          subscriptionId: mockSubscription.id,
          attemptNumber: 1,
          maxAttempts: 4,
        }),
        channel: 'email',
      });
    });

    it('should send second reminder on second failure', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockRejectedValue(new Error('Card declined'));

      await service.retryPayment(mockSubscription as Subscription, 2);

      expect(notificationClient.emit).toHaveBeenCalledWith('notification.send', {
        userId: mockSubscription.userId,
        template: 'payment-failed-2',
        data: expect.objectContaining({
          attemptNumber: 2,
        }),
        channel: 'email',
      });
    });

    it('should send final warning on third and fourth failure', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockRejectedValue(new Error('Card declined'));

      await service.retryPayment(mockSubscription as Subscription, 3);

      expect(notificationClient.emit).toHaveBeenCalledWith('notification.send', {
        userId: mockSubscription.userId,
        template: 'payment-final-warning',
        data: expect.anything(),
        channel: 'email',
      });

      jest.clearAllMocks();

      await service.retryPayment(mockSubscription as Subscription, 4);

      expect(notificationClient.emit).toHaveBeenCalledWith('notification.send', {
        userId: mockSubscription.userId,
        template: 'payment-final-warning',
        data: expect.anything(),
        channel: 'email',
      });
    });

    it('should send success notification on payment success', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      await service.retryPayment(mockSubscription as Subscription, 1);

      expect(notificationClient.emit).toHaveBeenCalledWith('notification.send', {
        userId: mockSubscription.userId,
        template: 'payment-success',
        data: { subscriptionId: mockSubscription.id },
        channel: 'email',
      });
    });

    it('should send suspension notification when max retries exceeded', async () => {
      const mockSubscription = createMockSubscription();

      // Add 4 previous failed attempts
      const attempts: DunningAttempt[] = [];
      for (let i = 1; i <= 4; i++) {
        attempts.push({
          subscriptionId: mockSubscription.id!,
          userId: mockSubscription.userId!,
          attemptNumber: i,
          attemptedAt: new Date(Date.now() - (5 - i) * 7 * 24 * 60 * 60 * 1000),
          status: 'failed',
        });
      }
      (service as any).dunningAttempts.set(mockSubscription.id, attempts);

      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.UNPAID,
      } as Subscription);

      await service.processSubscription(mockSubscription as Subscription);

      expect(notificationClient.emit).toHaveBeenCalledWith('notification.send', {
        userId: mockSubscription.userId,
        template: 'subscription-suspended',
        data: { subscriptionId: mockSubscription.id },
        channel: 'email',
      });
    });

    it('should handle notification sending errors gracefully', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockRejectedValue(new Error('Card declined'));
      notificationClient.emit.mockImplementation(() => {
        throw new Error('Notification service unavailable');
      });

      // Should not throw
      await expect(
        service.retryPayment(mockSubscription as Subscription, 1),
      ).resolves.toBeDefined();
    });
  });

  describe('Subscription Status Updates', () => {
    it('should update subscription to ACTIVE on successful payment', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      await service.retryPayment(mockSubscription as Subscription, 1);

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
        }),
      );
    });

    it('should update subscription to UNPAID when max retries exceeded', async () => {
      const mockSubscription = createMockSubscription();

      // Add 4 previous failed attempts
      const attempts: DunningAttempt[] = [];
      for (let i = 1; i <= 4; i++) {
        attempts.push({
          subscriptionId: mockSubscription.id!,
          userId: mockSubscription.userId!,
          attemptNumber: i,
          attemptedAt: new Date(Date.now() - (5 - i) * 7 * 24 * 60 * 60 * 1000),
          status: 'failed',
        });
      }
      (service as any).dunningAttempts.set(mockSubscription.id, attempts);

      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.UNPAID,
        canceledAt: expect.any(Date),
      } as Subscription);

      await service.processSubscription(mockSubscription as Subscription);

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.UNPAID,
          canceledAt: expect.any(Date),
        }),
      );
    });
  });

  describe('getDunningStats', () => {
    it('should return correct statistics', async () => {
      subscriptionRepository.count.mockResolvedValue(5);

      // Add some successful attempts
      (service as any).dunningAttempts.set('sub_1', [
        { subscriptionId: 'sub_1', userId: 'user_1', attemptNumber: 1, attemptedAt: new Date(), status: 'success' },
      ]);
      (service as any).dunningAttempts.set('sub_2', [
        { subscriptionId: 'sub_2', userId: 'user_2', attemptNumber: 1, attemptedAt: new Date(), status: 'failed' },
        { subscriptionId: 'sub_2', userId: 'user_2', attemptNumber: 2, attemptedAt: new Date(), status: 'success' },
      ]);
      (service as any).dunningAttempts.set('sub_3', [
        { subscriptionId: 'sub_3', userId: 'user_3', attemptNumber: 1, attemptedAt: new Date(), status: 'failed' },
      ]);

      const stats = await service.getDunningStats();

      expect(stats.totalPastDue).toBe(5);
      expect(stats.recoveredThisMonth).toBe(2); // Two successful attempts
      expect(stats.recoveryRate).toBeGreaterThan(0);
    });

    it('should return zero recovery rate when no attempts', async () => {
      subscriptionRepository.count.mockResolvedValue(0);

      const stats = await service.getDunningStats();

      expect(stats.totalPastDue).toBe(0);
      expect(stats.recoveredThisMonth).toBe(0);
      expect(stats.recoveryRate).toBe(0);
      expect(stats.averageAttemptsToRecover).toBe(0);
    });

    it('should calculate average attempts to recover', async () => {
      subscriptionRepository.count.mockResolvedValue(3);

      // One recovered on 1st attempt, one on 3rd attempt
      (service as any).dunningAttempts.set('sub_1', [
        { subscriptionId: 'sub_1', userId: 'user_1', attemptNumber: 1, attemptedAt: new Date(), status: 'success' },
      ]);
      (service as any).dunningAttempts.set('sub_2', [
        { subscriptionId: 'sub_2', userId: 'user_2', attemptNumber: 1, attemptedAt: new Date(), status: 'failed' },
        { subscriptionId: 'sub_2', userId: 'user_2', attemptNumber: 2, attemptedAt: new Date(), status: 'failed' },
        { subscriptionId: 'sub_2', userId: 'user_2', attemptNumber: 3, attemptedAt: new Date(), status: 'success' },
      ]);

      const stats = await service.getDunningStats();

      // Average: (1 + 3) / 2 = 2
      expect(stats.averageAttemptsToRecover).toBe(2);
    });
  });

  describe('Dunning Attempt Tracking', () => {
    it('should record successful attempt and then clear attempts', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      // The attempt should be recorded with success status
      expect(result.status).toBe('success');
      expect(result.invoiceId).toBe('in_test123');
      expect(result.attemptNumber).toBe(1);
    });

    it('should record failed attempt', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockRejectedValue(new Error('Card declined'));

      await service.retryPayment(mockSubscription as Subscription, 1);

      const attempts = (service as any).dunningAttempts.get(mockSubscription.id);
      expect(attempts).toHaveLength(1);
      expect(attempts[0].status).toBe('failed');
      expect(attempts[0].failureReason).toBe('Card declined');
    });

    it('should track invoice ID in attempt', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockRejectedValue(new Error('Card declined'));

      await service.retryPayment(mockSubscription as Subscription, 1);

      const attempts = (service as any).dunningAttempts.get(mockSubscription.id);
      expect(attempts[0].invoiceId).toBe('in_test123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle subscription with cancelled Stripe subscription', async () => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockRejectedValue(
        new Error('No such subscription: sub_stripe123'),
      );

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toContain('No such subscription');
    });

    it('should handle Stripe rate limiting', async () => {
      const mockSubscription = createMockSubscription();

      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).type = 'StripeRateLimitError';
      stripeMock.invoices.list.mockRejectedValue(rateLimitError);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('failed');
    });

    it('should handle invoice with zero amount', async () => {
      const mockSubscription = createMockSubscription();
      const zeroAmountInvoice = { ...mockStripeInvoice, amount_due: 0 };

      stripeMock.invoices.list.mockResolvedValue({
        data: [zeroAmountInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue({ ...zeroAmountInvoice, status: 'paid' } as Stripe.Invoice);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('success');
    });

    it('should handle multiple open invoices', async () => {
      const mockSubscription = createMockSubscription();
      const secondInvoice = { ...mockStripeInvoice, id: 'in_test456' };

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice, secondInvoice], // Only first should be processed
      } as Stripe.ApiList<Stripe.Invoice>);
      stripeMock.invoices.pay.mockResolvedValue(mockPaidInvoice);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.invoiceId).toBe('in_test123'); // First invoice
      expect(stripeMock.invoices.pay).toHaveBeenCalledTimes(1);
    });
  });

  describe('Payment Failure Reasons', () => {
    it.each([
      ['card_declined', 'Your card was declined'],
      ['insufficient_funds', 'Your card has insufficient funds'],
      ['expired_card', 'Your card has expired'],
      ['processing_error', 'An error occurred while processing your card'],
    ])('should capture failure reason for %s', async (code, message) => {
      const mockSubscription = createMockSubscription();

      stripeMock.invoices.list.mockResolvedValue({
        data: [mockStripeInvoice],
      } as Stripe.ApiList<Stripe.Invoice>);

      const error = new Error(message);
      (error as any).code = code;
      stripeMock.invoices.pay.mockRejectedValue(error);

      const result = await service.retryPayment(mockSubscription as Subscription, 1);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe(message);
    });
  });
});
