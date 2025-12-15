import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { SubscriptionTier, SUBSCRIPTION_TIER_PRICES } from '../../common/enums/subscription-tier.enum';

interface PaystackCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface PaystackTransaction {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  customer: PaystackCustomer;
  created_at: string;
  paid_at?: string;
}

interface PaystackPlan {
  id: number;
  name: string;
  plan_code: string;
  amount: number;
  interval: string;
  currency: string;
}

interface PaystackSubscription {
  id: number;
  status: string;
  subscription_code: string;
  email_token: string;
  next_payment_date: string;
  plan: PaystackPlan;
}

interface PaystackCard {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  card_type: string;
  bank: string;
  reusable: boolean;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private client: AxiosInstance;
  private readonly secretKey: string;
  private readonly publicKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';

    if (!this.secretKey) {
      this.logger.warn('PAYSTACK_SECRET_KEY not configured. Paystack integration will not work.');
    }

    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate a unique reference
   */
  private generateReference(): string {
    return `AFU_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Initialize a transaction
   */
  async initializeTransaction(
    email: string,
    amount: number,
    currency: string = 'NGN',
    callbackUrl: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    try {
      this.logger.log(`Initializing transaction for ${email}`);

      const reference = this.generateReference();

      const response = await this.client.post('/transaction/initialize', {
        email,
        amount: amount * 100, // Paystack uses kobo/cents
        currency,
        reference,
        callback_url: callbackUrl,
        metadata,
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to initialize transaction');
      }

      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
        accessCode: response.data.data.access_code,
      };
    } catch (error) {
      this.logger.error(`Failed to initialize transaction: ${error.message}`);
      throw new BadRequestException('Failed to initialize transaction');
    }
  }

  /**
   * Initialize subscription payment
   */
  async initializeSubscription(
    email: string,
    tier: SubscriptionTier,
    billingPeriod: 'monthly' | 'yearly',
    currency: string = 'NGN',
    callbackUrl: string,
    metadata?: Record<string, string>,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    try {
      this.logger.log(`Initializing subscription for ${email}, tier: ${tier}`);

      if (tier === SubscriptionTier.FREEMIUM) {
        throw new BadRequestException('Cannot initialize subscription for FREE tier');
      }

      const price = SUBSCRIPTION_TIER_PRICES[tier][billingPeriod];

      return await this.initializeTransaction(
        email,
        price,
        currency,
        callbackUrl,
        {
          tier,
          billingPeriod,
          type: 'subscription',
          ...metadata,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to initialize subscription: ${error.message}`);
      throw new BadRequestException('Failed to initialize subscription');
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<PaystackTransaction> {
    try {
      this.logger.log(`Verifying transaction: ${reference}`);

      const response = await this.client.get(`/transaction/verify/${reference}`);

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Transaction verification failed');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to verify transaction: ${error.message}`);
      throw new BadRequestException('Failed to verify transaction');
    }
  }

  /**
   * Create a subscription plan
   */
  async createPlan(
    name: string,
    amount: number,
    interval: 'daily' | 'weekly' | 'monthly' | 'annually',
    currency: string = 'NGN',
    description?: string,
  ): Promise<PaystackPlan> {
    try {
      this.logger.log(`Creating plan: ${name}`);

      const response = await this.client.post('/plan', {
        name,
        amount: amount * 100, // Convert to kobo
        interval,
        currency,
        description,
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create plan');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to create plan: ${error.message}`);
      throw new BadRequestException('Failed to create plan');
    }
  }

  /**
   * Get all plans
   */
  async listPlans(): Promise<PaystackPlan[]> {
    try {
      const response = await this.client.get('/plan');

      if (!response.data.status) {
        throw new BadRequestException('Failed to list plans');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to list plans: ${error.message}`);
      throw new BadRequestException('Failed to list plans');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerEmail: string,
    planCode: string,
    authorizationCode: string,
    startDate?: string,
  ): Promise<PaystackSubscription> {
    try {
      this.logger.log(`Creating subscription for ${customerEmail} on plan ${planCode}`);

      const body: Record<string, unknown> = {
        customer: customerEmail,
        plan: planCode,
        authorization: authorizationCode,
      };

      if (startDate) {
        body.start_date = startDate;
      }

      const response = await this.client.post('/subscription', body);

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create subscription');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionCode: string): Promise<PaystackSubscription> {
    try {
      const response = await this.client.get(`/subscription/${subscriptionCode}`);

      if (!response.data.status) {
        throw new BadRequestException('Failed to get subscription');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`);
      throw new BadRequestException('Failed to get subscription');
    }
  }

  /**
   * Disable a subscription
   */
  async disableSubscription(subscriptionCode: string, emailToken: string): Promise<boolean> {
    try {
      this.logger.log(`Disabling subscription: ${subscriptionCode}`);

      const response = await this.client.post('/subscription/disable', {
        code: subscriptionCode,
        token: emailToken,
      });

      return response.data.status === true;
    } catch (error) {
      this.logger.error(`Failed to disable subscription: ${error.message}`);
      throw new BadRequestException('Failed to disable subscription');
    }
  }

  /**
   * Enable a subscription
   */
  async enableSubscription(subscriptionCode: string, emailToken: string): Promise<boolean> {
    try {
      this.logger.log(`Enabling subscription: ${subscriptionCode}`);

      const response = await this.client.post('/subscription/enable', {
        code: subscriptionCode,
        token: emailToken,
      });

      return response.data.status === true;
    } catch (error) {
      this.logger.error(`Failed to enable subscription: ${error.message}`);
      throw new BadRequestException('Failed to enable subscription');
    }
  }

  /**
   * Create or update a customer
   */
  async createCustomer(
    email: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
  ): Promise<{ customerCode: string; id: number }> {
    try {
      this.logger.log(`Creating customer: ${email}`);

      const response = await this.client.post('/customer', {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create customer');
      }

      return {
        customerCode: response.data.data.customer_code,
        id: response.data.data.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(emailOrCode: string): Promise<PaystackCustomer & { authorizations: PaystackCard[] }> {
    try {
      const response = await this.client.get(`/customer/${emailOrCode}`);

      if (!response.data.status) {
        throw new BadRequestException('Failed to get customer');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get customer: ${error.message}`);
      throw new BadRequestException('Failed to get customer');
    }
  }

  /**
   * Charge an authorization (recurring payment)
   */
  async chargeAuthorization(
    email: string,
    amount: number,
    authorizationCode: string,
    currency: string = 'NGN',
    metadata?: Record<string, unknown>,
  ): Promise<PaystackTransaction> {
    try {
      this.logger.log(`Charging authorization for ${email}`);

      const response = await this.client.post('/transaction/charge_authorization', {
        email,
        amount: amount * 100,
        authorization_code: authorizationCode,
        currency,
        reference: this.generateReference(),
        metadata,
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Charge failed');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to charge authorization: ${error.message}`);
      throw new BadRequestException('Failed to charge authorization');
    }
  }

  /**
   * Initiate a refund
   */
  async initiateRefund(
    transactionReference: string,
    amount?: number,
    reason?: string,
  ): Promise<{ id: number; status: string }> {
    try {
      this.logger.log(`Initiating refund for: ${transactionReference}`);

      const body: Record<string, unknown> = {
        transaction: transactionReference,
      };

      if (amount) {
        body.amount = amount * 100;
      }
      if (reason) {
        body.merchant_note = reason;
      }

      const response = await this.client.post('/refund', body);

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Refund failed');
      }

      return {
        id: response.data.data.id,
        status: response.data.data.status,
      };
    } catch (error) {
      this.logger.error(`Failed to initiate refund: ${error.message}`);
      throw new BadRequestException('Failed to initiate refund');
    }
  }

  /**
   * Get list of banks
   */
  async listBanks(country: string = 'nigeria'): Promise<Array<{ name: string; code: string }>> {
    try {
      const response = await this.client.get('/bank', {
        params: { country },
      });

      if (!response.data.status) {
        throw new BadRequestException('Failed to list banks');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to list banks: ${error.message}`);
      throw new BadRequestException('Failed to list banks');
    }
  }

  /**
   * Resolve account number
   */
  async resolveAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<{ accountName: string; accountNumber: string }> {
    try {
      const response = await this.client.get('/bank/resolve', {
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
      });

      if (!response.data.status) {
        throw new BadRequestException('Failed to resolve account');
      }

      return {
        accountName: response.data.data.account_name,
        accountNumber: response.data.data.account_number,
      };
    } catch (error) {
      this.logger.error(`Failed to resolve account: ${error.message}`);
      throw new BadRequestException('Failed to resolve account');
    }
  }

  /**
   * Create a dedicated virtual account
   */
  async createDedicatedVirtualAccount(
    customerEmail: string,
    preferredBank: string = 'wema-bank',
  ): Promise<{ accountName: string; accountNumber: string; bank: string }> {
    try {
      this.logger.log(`Creating dedicated virtual account for ${customerEmail}`);

      const response = await this.client.post('/dedicated_account', {
        customer: customerEmail,
        preferred_bank: preferredBank,
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to create virtual account');
      }

      return {
        accountName: response.data.data.account_name,
        accountNumber: response.data.data.account_number,
        bank: response.data.data.bank.name,
      };
    } catch (error) {
      this.logger.error(`Failed to create virtual account: ${error.message}`);
      throw new BadRequestException('Failed to create virtual account');
    }
  }

  /**
   * Verify webhook signature using HMAC SHA512
   * @param payload - Raw request body as Buffer or string
   * @param signature - x-paystack-signature header value
   * @returns boolean indicating if signature is valid
   */
  verifyWebhookSignature(payload: Buffer | string, signature: string): boolean {
    if (!this.secretKey) {
      this.logger.error('Paystack secret key not configured');
      return false;
    }

    if (!signature) {
      this.logger.error('No signature provided');
      return false;
    }

    try {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Get transaction list
   */
  async listTransactions(
    options: {
      perPage?: number;
      page?: number;
      status?: string;
      from?: string;
      to?: string;
    } = {},
  ): Promise<PaystackTransaction[]> {
    try {
      const response = await this.client.get('/transaction', {
        params: options,
      });

      if (!response.data.status) {
        throw new BadRequestException('Failed to list transactions');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to list transactions: ${error.message}`);
      throw new BadRequestException('Failed to list transactions');
    }
  }
}
