import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { SubscriptionTier, SUBSCRIPTION_TIER_PRICES } from '../../common/enums/subscription-tier.enum';

interface FlutterwaveCustomer {
  email: string;
  phonenumber?: string;
  name?: string;
}

interface FlutterwavePaymentLink {
  link: string;
  tx_ref: string;
}

interface FlutterwaveTransaction {
  id: number;
  tx_ref: string;
  flw_ref: string;
  amount: number;
  currency: string;
  status: string;
  customer: FlutterwaveCustomer;
  created_at: string;
}

interface FlutterwaveSubscriptionPlan {
  id: number;
  name: string;
  amount: number;
  interval: string;
  currency: string;
}

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private client: AxiosInstance;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('FLUTTERWAVE_PUBLIC_KEY') || '';
    this.encryptionKey = this.configService.get<string>('FLUTTERWAVE_ENCRYPTION_KEY') || '';

    if (!this.secretKey) {
      this.logger.warn('FLUTTERWAVE_SECRET_KEY not configured. Flutterwave integration will not work.');
    }

    this.client = axios.create({
      baseURL: 'https://api.flutterwave.com/v3',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate a unique transaction reference
   */
  private generateTxRef(): string {
    return `AFU_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Create a payment link for subscription
   */
  async createPaymentLink(
    customer: FlutterwaveCustomer,
    tier: SubscriptionTier,
    billingPeriod: 'monthly' | 'yearly',
    currency: string = 'USD',
    redirectUrl: string,
    metadata?: Record<string, string>,
  ): Promise<FlutterwavePaymentLink> {
    try {
      this.logger.log(`Creating Flutterwave payment link for ${customer.email}, tier: ${tier}`);

      if (tier === SubscriptionTier.FREEMIUM) {
        throw new BadRequestException('Cannot create payment link for FREE tier');
      }

      const price = SUBSCRIPTION_TIER_PRICES[tier][billingPeriod];
      const txRef = this.generateTxRef();

      const response = await this.client.post('/payments', {
        tx_ref: txRef,
        amount: price,
        currency,
        redirect_url: redirectUrl,
        customer: {
          email: customer.email,
          phonenumber: customer.phonenumber,
          name: customer.name,
        },
        customizations: {
          title: 'ApplyForUs Subscription',
          description: `${tier} Plan - ${billingPeriod}`,
          logo: 'https://applyforus.com/logo.png',
        },
        meta: {
          tier,
          billingPeriod,
          ...metadata,
        },
      });

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message || 'Failed to create payment link');
      }

      this.logger.log(`Created Flutterwave payment link: ${txRef}`);
      return {
        link: response.data.data.link,
        tx_ref: txRef,
      };
    } catch (error) {
      this.logger.error(`Failed to create Flutterwave payment link: ${error.message}`);
      throw new BadRequestException('Failed to create payment link');
    }
  }

  /**
   * Create a subscription plan
   */
  async createSubscriptionPlan(
    name: string,
    amount: number,
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly',
    currency: string = 'USD',
  ): Promise<FlutterwaveSubscriptionPlan> {
    try {
      this.logger.log(`Creating subscription plan: ${name}`);

      const response = await this.client.post('/payment-plans', {
        name,
        amount,
        interval,
        currency,
      });

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message || 'Failed to create plan');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to create subscription plan: ${error.message}`);
      throw new BadRequestException('Failed to create subscription plan');
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    planId: number,
    customer: FlutterwaveCustomer,
    redirectUrl: string,
    metadata?: Record<string, string>,
  ): Promise<FlutterwavePaymentLink> {
    try {
      this.logger.log(`Creating subscription for ${customer.email} on plan ${planId}`);

      const txRef = this.generateTxRef();

      const response = await this.client.post('/payments', {
        tx_ref: txRef,
        payment_plan: planId,
        redirect_url: redirectUrl,
        customer: {
          email: customer.email,
          phonenumber: customer.phonenumber,
          name: customer.name,
        },
        meta: metadata,
      });

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message || 'Failed to create subscription');
      }

      return {
        link: response.data.data.link,
        tx_ref: txRef,
      };
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(transactionId: number): Promise<FlutterwaveTransaction> {
    try {
      this.logger.log(`Verifying transaction: ${transactionId}`);

      const response = await this.client.get(`/transactions/${transactionId}/verify`);

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message || 'Transaction verification failed');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to verify transaction: ${error.message}`);
      throw new BadRequestException('Failed to verify transaction');
    }
  }

  /**
   * Get transaction by reference
   */
  async getTransactionByRef(txRef: string): Promise<FlutterwaveTransaction | null> {
    try {
      const response = await this.client.get('/transactions', {
        params: { tx_ref: txRef },
      });

      if (response.data.status !== 'success' || !response.data.data.length) {
        return null;
      }

      return response.data.data[0];
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      return null;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: number): Promise<boolean> {
    try {
      this.logger.log(`Canceling subscription: ${subscriptionId}`);

      const response = await this.client.put(`/subscriptions/${subscriptionId}/cancel`);

      return response.data.status === 'success';
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Initiate a refund
   */
  async initiateRefund(transactionId: number, amount?: number): Promise<{ id: number; status: string }> {
    try {
      this.logger.log(`Initiating refund for transaction: ${transactionId}`);

      const body: Record<string, unknown> = { id: transactionId };
      if (amount) {
        body.amount = amount;
      }

      const response = await this.client.post('/transactions/refund', body);

      if (response.data.status !== 'success') {
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
   * Verify webhook signature
   * Flutterwave sends the webhook secret hash in the 'verif-hash' header
   * We just need to compare it with our configured webhook secret
   * @param verifHash - The value from the 'verif-hash' header
   * @returns boolean indicating if the hash matches our webhook secret
   */
  verifyWebhookSignature(verifHash: string): boolean {
    const webhookSecret = this.configService.get<string>('FLUTTERWAVE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('Flutterwave webhook secret not configured');
      return false;
    }

    if (!verifHash) {
      this.logger.error('No verification hash provided');
      return false;
    }

    try {
      // Flutterwave uses a simple hash comparison
      return verifHash === webhookSecret;
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Get banks for transfer
   */
  async getBanks(country: string = 'NG'): Promise<Array<{ id: number; name: string; code: string }>> {
    try {
      const response = await this.client.get(`/banks/${country}`);

      if (response.data.status !== 'success') {
        throw new BadRequestException('Failed to fetch banks');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get banks: ${error.message}`);
      throw new BadRequestException('Failed to get banks');
    }
  }

  /**
   * Create virtual account for payments
   */
  async createVirtualAccount(
    email: string,
    bvn: string,
    isPermanent: boolean = true,
  ): Promise<{ accountNumber: string; bankName: string }> {
    try {
      this.logger.log(`Creating virtual account for ${email}`);

      const response = await this.client.post('/virtual-account-numbers', {
        email,
        bvn,
        is_permanent: isPermanent,
        tx_ref: this.generateTxRef(),
      });

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message || 'Failed to create virtual account');
      }

      return {
        accountNumber: response.data.data.account_number,
        bankName: response.data.data.bank_name,
      };
    } catch (error) {
      this.logger.error(`Failed to create virtual account: ${error.message}`);
      throw new BadRequestException('Failed to create virtual account');
    }
  }
}
