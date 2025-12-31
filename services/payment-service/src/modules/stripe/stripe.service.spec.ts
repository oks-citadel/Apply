import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StripeService, CheckoutSessionOptions } from './stripe.service';
import { TaxService } from '../tax/tax.service';
import { SubscriptionTier, SUBSCRIPTION_TIER_PRICES } from '../../common/enums/subscription-tier.enum';
import Stripe from 'stripe';

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;
  let taxService: jest.Mocked<TaxService>;
  let stripeMock: jest.Mocked<Stripe>;

  const mockStripeCustomer: Stripe.Customer = {
    id: 'cus_test123',
    object: 'customer',
    email: 'test@example.com',
    metadata: { userId: 'user123' },
    created: Date.now(),
    livemode: false,
  } as Stripe.Customer;

  const mockStripeSubscription: Stripe.Subscription = {
    id: 'sub_test123',
    object: 'subscription',
    customer: 'cus_test123',
    status: 'active',
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test123',
          object: 'subscription_item',
          price: {
            id: 'price_test123',
            object: 'price',
            unit_amount: 4999,
            currency: 'usd',
          } as Stripe.Price,
        } as Stripe.SubscriptionItem,
      ],
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    created: Date.now(),
    current_period_start: Date.now(),
    current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
  } as Stripe.Subscription;

  const mockCheckoutSession: Stripe.Checkout.Session = {
    id: 'cs_test123',
    object: 'checkout.session',
    customer: 'cus_test123',
    url: 'https://checkout.stripe.com/test',
    mode: 'subscription',
    status: 'open',
  } as Stripe.Checkout.Session;

  const mockBillingPortalSession: Stripe.BillingPortal.Session = {
    id: 'bps_test123',
    object: 'billing_portal.session',
    url: 'https://billing.stripe.com/test',
    created: Date.now(),
    customer: 'cus_test123',
    livemode: false,
    return_url: 'https://example.com/return',
  } as Stripe.BillingPortal.Session;

  const mockInvoice: Stripe.Invoice = {
    id: 'in_test123',
    object: 'invoice',
    customer: 'cus_test123',
    status: 'paid',
    total: 4999,
    created: Date.now(),
  } as Stripe.Invoice;

  // Mock TaxService
  const mockTaxService = {
    getTaxRate: jest.fn(),
    calculateTax: jest.fn(),
    validateVatNumber: jest.fn(),
    getAllTaxRates: jest.fn(),
  };

  beforeEach(async () => {
    // Create a comprehensive Stripe mock
    stripeMock = {
      customers: {
        create: jest.fn(),
        list: jest.fn(),
      },
      prices: {
        create: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      billingPortal: {
        sessions: {
          create: jest.fn(),
        },
      },
      subscriptions: {
        retrieve: jest.fn(),
        cancel: jest.fn(),
        update: jest.fn(),
      },
      invoices: {
        retrieve: jest.fn(),
        list: jest.fn(),
        pay: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    } as any;

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        switch (key) {
          case 'STRIPE_SECRET_KEY':
            return 'sk_test_mock_key';
          case 'STRIPE_WEBHOOK_SECRET':
            return 'whsec_test_secret';
          case 'STRIPE_TAX_ENABLED':
            return defaultValue ?? false;
          default:
            return defaultValue ?? null;
        }
      }),
    };

    // Reset mock implementations
    mockTaxService.getTaxRate.mockReset();
    mockTaxService.calculateTax.mockReset();
    mockTaxService.validateVatNumber.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TaxService,
          useValue: mockTaxService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
    taxService = module.get(TaxService);

    // Replace the Stripe instance with our mock
    (service as any).stripe = stripeMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a Stripe customer successfully', async () => {
      stripeMock.customers.create.mockResolvedValue(mockStripeCustomer);

      const result = await service.createCustomer(
        'test@example.com',
        'user123',
        { source: 'web' },
      );

      expect(result).toEqual(mockStripeCustomer);
      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          userId: 'user123',
          source: 'web',
        },
      });
    });

    it('should throw BadRequestException when customer creation fails', async () => {
      stripeMock.customers.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        service.createCustomer('test@example.com', 'user123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create customer without optional metadata', async () => {
      stripeMock.customers.create.mockResolvedValue(mockStripeCustomer);

      await service.createCustomer('test@example.com', 'user123');

      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          userId: 'user123',
        },
      });
    });
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      stripeMock.customers.list.mockResolvedValue({
        data: [mockStripeCustomer],
      } as Stripe.ApiList<Stripe.Customer>);

      const result = await service.getOrCreateCustomer('test@example.com', 'user123');

      expect(result).toEqual(mockStripeCustomer);
      expect(stripeMock.customers.list).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1,
      });
      expect(stripeMock.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if not found', async () => {
      stripeMock.customers.list.mockResolvedValue({
        data: [],
      } as Stripe.ApiList<Stripe.Customer>);
      stripeMock.customers.create.mockResolvedValue(mockStripeCustomer);

      const result = await service.getOrCreateCustomer('test@example.com', 'user123');

      expect(result).toEqual(mockStripeCustomer);
      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          userId: 'user123',
        },
      });
    });

    it('should throw BadRequestException when search fails', async () => {
      stripeMock.customers.list.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        service.getOrCreateCustomer('test@example.com', 'user123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createCheckoutSession', () => {
    const mockPrice: Stripe.Price = {
      id: 'price_test123',
      object: 'price',
      unit_amount: 4999,
      currency: 'usd',
    } as Stripe.Price;

    it('should create checkout session successfully', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      const result = await service.createCheckoutSession(
        'cus_test123',
        SubscriptionTier.BASIC,
        'monthly',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(result).toEqual(mockCheckoutSession);
      expect(stripeMock.prices.create).toHaveBeenCalledWith({
        unit_amount: 4999,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        product_data: {
          name: 'BASIC Subscription',
          statement_descriptor: 'BASIC tier subscription (monthly)',
        },
      });
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          mode: 'subscription',
          payment_method_types: ['card'],
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        }),
      );
    });

    it('should create checkout session with yearly billing', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      await service.createCheckoutSession(
        'cus_test123',
        SubscriptionTier.PROFESSIONAL,
        'yearly',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(stripeMock.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recurring: {
            interval: 'year',
          },
        }),
      );
    });

    it('should throw BadRequestException for FREE tier', async () => {
      await expect(
        service.createCheckoutSession(
          'cus_test123',
          SubscriptionTier.FREEMIUM,
          'monthly',
          'https://example.com/success',
          'https://example.com/cancel',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('should include metadata in checkout session', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      await service.createCheckoutSession(
        'cus_test123',
        SubscriptionTier.BASIC,
        'monthly',
        'https://example.com/success',
        'https://example.com/cancel',
        { source: 'mobile' },
      );

      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: 'mobile',
          }),
        }),
      );
    });

    it('should throw BadRequestException when checkout session creation fails', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(
        service.createCheckoutSession(
          'cus_test123',
          SubscriptionTier.BASIC,
          'monthly',
          'https://example.com/success',
          'https://example.com/cancel',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBillingPortalSession', () => {
    it('should create billing portal session successfully', async () => {
      stripeMock.billingPortal.sessions.create.mockResolvedValue(
        mockBillingPortalSession,
      );

      const result = await service.createBillingPortalSession(
        'cus_test123',
        'https://example.com/return',
      );

      expect(result).toEqual(mockBillingPortalSession);
      expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'https://example.com/return',
      });
    });

    it('should throw BadRequestException when creation fails', async () => {
      stripeMock.billingPortal.sessions.create.mockRejectedValue(
        new Error('Stripe API error'),
      );

      await expect(
        service.createBillingPortalSession('cus_test123', 'https://example.com/return'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubscription', () => {
    it('should retrieve subscription successfully', async () => {
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);

      const result = await service.getSubscription('sub_test123');

      expect(result).toEqual(mockStripeSubscription);
      expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith('sub_test123');
    });

    it('should throw BadRequestException when retrieval fails', async () => {
      stripeMock.subscriptions.retrieve.mockRejectedValue(
        new Error('Subscription not found'),
      );

      await expect(service.getSubscription('sub_invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      stripeMock.subscriptions.cancel.mockResolvedValue(mockStripeSubscription);

      const result = await service.cancelSubscription('sub_test123', true);

      expect(result).toEqual(mockStripeSubscription);
      expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
      expect(stripeMock.subscriptions.update).not.toHaveBeenCalled();
    });

    it('should cancel subscription at period end', async () => {
      stripeMock.subscriptions.update.mockResolvedValue(mockStripeSubscription);

      const result = await service.cancelSubscription('sub_test123', false);

      expect(result).toEqual(mockStripeSubscription);
      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      });
      expect(stripeMock.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it('should default to cancel at period end when immediately is not specified', async () => {
      stripeMock.subscriptions.update.mockResolvedValue(mockStripeSubscription);

      await service.cancelSubscription('sub_test123');

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      });
    });

    it('should throw BadRequestException when cancellation fails', async () => {
      stripeMock.subscriptions.cancel.mockRejectedValue(new Error('Cancel failed'));

      await expect(service.cancelSubscription('sub_test123', true)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateSubscription', () => {
    const mockPrice: Stripe.Price = {
      id: 'price_new123',
      object: 'price',
      unit_amount: 8999,
      currency: 'usd',
    } as Stripe.Price;

    it('should update subscription tier successfully', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);
      stripeMock.subscriptions.update.mockResolvedValue(mockStripeSubscription);

      const result = await service.updateSubscription(
        'sub_test123',
        SubscriptionTier.PROFESSIONAL,
        'monthly',
      );

      expect(result).toEqual(mockStripeSubscription);
      expect(stripeMock.prices.create).toHaveBeenCalledWith({
        unit_amount: 8999,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        product_data: {
          name: 'PROFESSIONAL Subscription',
          statement_descriptor: 'PROFESSIONAL tier subscription (monthly)',
        },
      });
      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        items: [
          {
            id: 'si_test123',
            price: 'price_new123',
          },
        ],
        metadata: {
          tier: SubscriptionTier.PROFESSIONAL,
          billingPeriod: 'monthly',
        },
        proration_behavior: 'always_invoice',
      });
    });

    it('should update subscription with yearly billing', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);
      stripeMock.subscriptions.update.mockResolvedValue(mockStripeSubscription);

      await service.updateSubscription(
        'sub_test123',
        SubscriptionTier.PROFESSIONAL,
        'yearly',
      );

      expect(stripeMock.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recurring: {
            interval: 'year',
          },
        }),
      );
    });

    it('should throw BadRequestException when update fails', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);
      stripeMock.subscriptions.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.updateSubscription('sub_test123', SubscriptionTier.PROFESSIONAL, 'monthly'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('constructWebhookEvent', () => {
    const payload = Buffer.from('test payload');
    const signature = 'test_signature';

    it('should construct webhook event successfully', () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: {},
      } as Stripe.Event;

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = service.constructWebhookEvent(payload, signature);

      expect(result).toEqual(mockEvent);
      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_secret',
      );
    });

    it('should throw BadRequestException when webhook secret is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);

      expect(() => service.constructWebhookEvent(payload, signature)).toThrow(
        BadRequestException,
      );
      expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when signature verification fails', () => {
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => service.constructWebhookEvent(payload, signature)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getInvoice', () => {
    it('should retrieve invoice successfully', async () => {
      stripeMock.invoices.retrieve.mockResolvedValue(mockInvoice);

      const result = await service.getInvoice('in_test123');

      expect(result).toEqual(mockInvoice);
      expect(stripeMock.invoices.retrieve).toHaveBeenCalledWith('in_test123');
    });

    it('should throw BadRequestException when retrieval fails', async () => {
      stripeMock.invoices.retrieve.mockRejectedValue(new Error('Invoice not found'));

      await expect(service.getInvoice('in_invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listCustomerInvoices', () => {
    it('should list customer invoices successfully', async () => {
      const mockInvoiceList: Stripe.ApiList<Stripe.Invoice> = {
        object: 'list',
        data: [mockInvoice],
        has_more: false,
        url: '/v1/invoices',
      };

      stripeMock.invoices.list.mockResolvedValue(mockInvoiceList);

      const result = await service.listCustomerInvoices('cus_test123');

      expect(result).toEqual([mockInvoice]);
      expect(stripeMock.invoices.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        limit: 10,
      });
    });

    it('should list customer invoices with custom limit', async () => {
      const mockInvoiceList: Stripe.ApiList<Stripe.Invoice> = {
        object: 'list',
        data: [mockInvoice],
        has_more: false,
        url: '/v1/invoices',
      };

      stripeMock.invoices.list.mockResolvedValue(mockInvoiceList);

      await service.listCustomerInvoices('cus_test123', 25);

      expect(stripeMock.invoices.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        limit: 25,
      });
    });

    it('should throw BadRequestException when listing fails', async () => {
      stripeMock.invoices.list.mockRejectedValue(new Error('List failed'));

      await expect(service.listCustomerInvoices('cus_test123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string email in createCustomer', async () => {
      stripeMock.customers.create.mockRejectedValue(new Error('Invalid email'));

      await expect(service.createCustomer('', 'user123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle network errors gracefully', async () => {
      stripeMock.customers.create.mockRejectedValue(new Error('Network error'));

      await expect(
        service.createCustomer('test@example.com', 'user123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle Stripe API rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).type = 'StripeRateLimitError';
      stripeMock.customers.create.mockRejectedValue(rateLimitError);

      await expect(
        service.createCustomer('test@example.com', 'user123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Tax Integration', () => {
    const mockPrice: Stripe.Price = {
      id: 'price_tax_test',
      object: 'price',
      unit_amount: 4999,
      currency: 'usd',
    } as Stripe.Price;

    it('should get tax rate for country via TaxService', () => {
      const mockTaxRate = {
        countryCode: 'DE',
        countryName: 'Germany',
        taxType: 'VAT' as const,
        rate: 19,
        registrationRequired: true,
        reverseChargeApplicable: true,
      };

      taxService.getTaxRate.mockReturnValue(mockTaxRate);

      const result = service.getTaxRateForCountry('DE');

      expect(result).toEqual(mockTaxRate);
      expect(taxService.getTaxRate).toHaveBeenCalledWith('DE');
    });

    it('should return undefined for unknown country', () => {
      taxService.getTaxRate.mockReturnValue(undefined);

      const result = service.getTaxRateForCountry('XX');

      expect(result).toBeUndefined();
    });

    it('should calculate tax preview for given amount', async () => {
      const mockCalculation = {
        subtotal: 100,
        taxRate: 19,
        taxAmount: 19,
        total: 119,
        taxType: 'VAT',
        countryCode: 'DE',
        currency: 'USD',
        isReverseCharge: false,
        breakdown: [{ description: 'VAT (19%)', rate: 19, amount: 19 }],
      };

      taxService.calculateTax.mockResolvedValue(mockCalculation);

      const result = await service.calculateTaxPreview(100, 'USD', 'DE', false);

      expect(result).toEqual(mockCalculation);
      expect(taxService.calculateTax).toHaveBeenCalledWith(100, 'USD', {
        countryCode: 'DE',
        isBusinessCustomer: false,
        taxId: undefined,
      });
    });

    it('should calculate tax preview for B2B customer with tax ID', async () => {
      const mockCalculation = {
        subtotal: 100,
        taxRate: 0,
        taxAmount: 0,
        total: 100,
        taxType: 'VAT',
        countryCode: 'DE',
        currency: 'USD',
        isReverseCharge: true,
        taxId: 'DE123456789',
        breakdown: [{ description: 'VAT Reverse Charge (0%)', rate: 0, amount: 0 }],
      };

      taxService.calculateTax.mockResolvedValue(mockCalculation);

      const result = await service.calculateTaxPreview(100, 'USD', 'DE', true, 'DE123456789');

      expect(result).toEqual(mockCalculation);
      expect(taxService.calculateTax).toHaveBeenCalledWith(100, 'USD', {
        countryCode: 'DE',
        isBusinessCustomer: true,
        taxId: 'DE123456789',
      });
    });

    it('should create checkout session with options object including tax settings', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);
      taxService.getTaxRate.mockReturnValue({
        countryCode: 'DE',
        countryName: 'Germany',
        taxType: 'VAT' as const,
        rate: 19,
        registrationRequired: true,
        reverseChargeApplicable: true,
      });

      const options: CheckoutSessionOptions = {
        customerId: 'cus_test123',
        tier: SubscriptionTier.BASIC,
        billingPeriod: 'monthly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        enableAutomaticTax: true,
        collectTaxId: true,
        customerCountry: 'DE',
      };

      const result = await service.createCheckoutSession(options);

      expect(result).toEqual(mockCheckoutSession);
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          automatic_tax: { enabled: true },
          tax_id_collection: { enabled: true },
          billing_address_collection: 'required',
        }),
      );
      expect(taxService.getTaxRate).toHaveBeenCalledWith('DE');
    });

    it('should create checkout session with tax ID collection disabled', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      const options: CheckoutSessionOptions = {
        customerId: 'cus_test123',
        tier: SubscriptionTier.PROFESSIONAL,
        billingPeriod: 'yearly',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        collectTaxId: false,
      };

      await service.createCheckoutSession(options);

      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          tax_id_collection: { enabled: true },
        }),
      );
    });
  });

  describe('Subscription Tier Pricing', () => {
    const mockPrice: Stripe.Price = {
      id: 'price_tier_test',
      object: 'price',
      unit_amount: 2399,
      currency: 'usd',
    } as Stripe.Price;

    it.each([
      [SubscriptionTier.STARTER, 'monthly', 2399],
      [SubscriptionTier.STARTER, 'yearly', 23999],
      [SubscriptionTier.BASIC, 'monthly', 4999],
      [SubscriptionTier.BASIC, 'yearly', 49999],
      [SubscriptionTier.PROFESSIONAL, 'monthly', 8999],
      [SubscriptionTier.PROFESSIONAL, 'yearly', 89999],
      [SubscriptionTier.ADVANCED_CAREER, 'monthly', 14999],
      [SubscriptionTier.ADVANCED_CAREER, 'yearly', 149999],
      [SubscriptionTier.EXECUTIVE_ELITE, 'monthly', 29999],
      [SubscriptionTier.EXECUTIVE_ELITE, 'yearly', 299999],
    ])('should create price with correct amount for %s %s', async (tier, period, expectedCents) => {
      stripeMock.prices.create.mockResolvedValue({ ...mockPrice, unit_amount: expectedCents } as Stripe.Price);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      await service.createCheckoutSession(
        'cus_test123',
        tier,
        period as 'monthly' | 'yearly',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(stripeMock.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unit_amount: expectedCents,
          currency: 'usd',
          recurring: {
            interval: period === 'monthly' ? 'month' : 'year',
          },
        }),
      );
    });

    it('should include SaaS tax code in price creation', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      await service.createCheckoutSession(
        'cus_test123',
        SubscriptionTier.BASIC,
        'monthly',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(stripeMock.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_data: expect.objectContaining({
            tax_code: 'txcd_10103001',
          }),
          tax_behavior: 'exclusive',
        }),
      );
    });
  });

  describe('Subscription Update with Proration', () => {
    const mockPrice: Stripe.Price = {
      id: 'price_update_test',
      object: 'price',
      unit_amount: 8999,
      currency: 'usd',
    } as Stripe.Price;

    it('should update subscription with proration enabled', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);
      stripeMock.subscriptions.update.mockResolvedValue(mockStripeSubscription);

      await service.updateSubscription(
        'sub_test123',
        SubscriptionTier.ADVANCED_CAREER,
        'monthly',
      );

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          proration_behavior: 'always_invoice',
        }),
      );
    });

    it('should handle upgrade from lower to higher tier', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.subscriptions.retrieve.mockResolvedValue(mockStripeSubscription);
      stripeMock.subscriptions.update.mockResolvedValue({
        ...mockStripeSubscription,
        metadata: { tier: SubscriptionTier.EXECUTIVE_ELITE },
      } as Stripe.Subscription);

      const result = await service.updateSubscription(
        'sub_test123',
        SubscriptionTier.EXECUTIVE_ELITE,
        'yearly',
      );

      expect(result).toBeDefined();
      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          metadata: {
            tier: SubscriptionTier.EXECUTIVE_ELITE,
            billingPeriod: 'yearly',
          },
        }),
      );
    });

    it('should handle downgrade from higher to lower tier', async () => {
      const starterPrice: Stripe.Price = {
        id: 'price_starter',
        object: 'price',
        unit_amount: 2399,
        currency: 'usd',
      } as Stripe.Price;

      stripeMock.prices.create.mockResolvedValue(starterPrice);
      stripeMock.subscriptions.retrieve.mockResolvedValue({
        ...mockStripeSubscription,
        metadata: { tier: SubscriptionTier.PROFESSIONAL },
      } as Stripe.Subscription);
      stripeMock.subscriptions.update.mockResolvedValue({
        ...mockStripeSubscription,
        metadata: { tier: SubscriptionTier.STARTER },
      } as Stripe.Subscription);

      const result = await service.updateSubscription(
        'sub_test123',
        SubscriptionTier.STARTER,
        'monthly',
      );

      expect(result).toBeDefined();
      expect(stripeMock.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unit_amount: 2399,
        }),
      );
    });
  });

  describe('Webhook Event Types', () => {
    it('should construct checkout.session.completed event', () => {
      const payload = Buffer.from(JSON.stringify({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test123' } },
      }));
      const signature = 'valid_signature';
      const mockEvent = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test123' } },
      } as Stripe.Event;

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = service.constructWebhookEvent(payload, signature);

      expect(result.type).toBe('checkout.session.completed');
    });

    it('should construct customer.subscription.updated event', () => {
      const payload = Buffer.from(JSON.stringify({
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_test123', status: 'past_due' } },
      }));
      const signature = 'valid_signature';
      const mockEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_test123', status: 'past_due' } },
      } as Stripe.Event;

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = service.constructWebhookEvent(payload, signature);

      expect(result.type).toBe('customer.subscription.updated');
      expect((result.data.object as any).status).toBe('past_due');
    });

    it('should construct invoice.payment_failed event', () => {
      const payload = Buffer.from(JSON.stringify({
        type: 'invoice.payment_failed',
        data: { object: { id: 'in_test123' } },
      }));
      const signature = 'valid_signature';
      const mockEvent = {
        id: 'evt_test123',
        type: 'invoice.payment_failed',
        data: { object: { id: 'in_test123', attempt_count: 1 } },
      } as Stripe.Event;

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = service.constructWebhookEvent(payload, signature);

      expect(result.type).toBe('invoice.payment_failed');
    });
  });

  describe('Multi-Currency Support', () => {
    const mockPrice: Stripe.Price = {
      id: 'price_currency_test',
      object: 'price',
      unit_amount: 4999,
      currency: 'usd',
    } as Stripe.Price;

    it('should create checkout session with USD currency', async () => {
      stripeMock.prices.create.mockResolvedValue(mockPrice);
      stripeMock.checkout.sessions.create.mockResolvedValue(mockCheckoutSession);

      await service.createCheckoutSession(
        'cus_test123',
        SubscriptionTier.BASIC,
        'monthly',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(stripeMock.prices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'usd',
        }),
      );
    });

    it('should list invoices with different currencies', async () => {
      const euroInvoice: Stripe.Invoice = {
        ...mockInvoice,
        currency: 'eur',
        total: 4599,
      } as Stripe.Invoice;

      const gbpInvoice: Stripe.Invoice = {
        ...mockInvoice,
        currency: 'gbp',
        total: 3999,
      } as Stripe.Invoice;

      stripeMock.invoices.list.mockResolvedValue({
        object: 'list',
        data: [mockInvoice, euroInvoice, gbpInvoice],
        has_more: false,
        url: '/v1/invoices',
      } as Stripe.ApiList<Stripe.Invoice>);

      const result = await service.listCustomerInvoices('cus_test123');

      expect(result).toHaveLength(3);
      expect(result.map(inv => inv.currency)).toContain('usd');
      expect(result.map(inv => inv.currency)).toContain('eur');
      expect(result.map(inv => inv.currency)).toContain('gbp');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle Stripe card declined error', async () => {
      const cardDeclinedError = new Error('Your card was declined');
      (cardDeclinedError as any).type = 'StripeCardError';
      (cardDeclinedError as any).code = 'card_declined';

      stripeMock.customers.create.mockRejectedValue(cardDeclinedError);

      await expect(
        service.createCustomer('test@example.com', 'user123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle Stripe invalid request error', async () => {
      const invalidRequestError = new Error('Invalid request');
      (invalidRequestError as any).type = 'StripeInvalidRequestError';

      stripeMock.subscriptions.retrieve.mockRejectedValue(invalidRequestError);

      await expect(service.getSubscription('invalid_sub_id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle subscription not found during update', async () => {
      const notFoundError = new Error('No such subscription');
      (notFoundError as any).type = 'StripeInvalidRequestError';

      stripeMock.prices.create.mockResolvedValue({
        id: 'price_test',
        object: 'price',
        unit_amount: 4999,
        currency: 'usd',
      } as Stripe.Price);
      stripeMock.subscriptions.retrieve.mockRejectedValue(notFoundError);

      await expect(
        service.updateSubscription('sub_nonexistent', SubscriptionTier.PROFESSIONAL, 'monthly'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle webhook construction with tampered payload', () => {
      const payload = Buffer.from('tampered_payload');
      const signature = 'invalid_signature';

      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Webhook signature verification failed');
      });

      expect(() => service.constructWebhookEvent(payload, signature)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('Billing Portal Configuration', () => {
    it('should create billing portal with custom return URL', async () => {
      stripeMock.billingPortal.sessions.create.mockResolvedValue(mockBillingPortalSession);

      const customReturnUrl = 'https://myapp.com/account/billing';
      const result = await service.createBillingPortalSession('cus_test123', customReturnUrl);

      expect(result.return_url).toBe('https://example.com/return');
      expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: customReturnUrl,
      });
    });

    it('should handle billing portal creation for non-existent customer', async () => {
      const customerNotFoundError = new Error('No such customer');
      (customerNotFoundError as any).type = 'StripeInvalidRequestError';

      stripeMock.billingPortal.sessions.create.mockRejectedValue(customerNotFoundError);

      await expect(
        service.createBillingPortalSession('cus_nonexistent', 'https://example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
