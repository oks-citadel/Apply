import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Get,
  Param,
  Query,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { PaystackService } from './paystack.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';

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

@ApiTags('paystack')
@Controller('paystack')
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Paystack webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: PaystackWebhookPayload,
  ) {
    this.logger.log(`Received Paystack webhook: ${payload.event}`);

    // Verify webhook signature using raw body
    const rawBody = request.rawBody;

    if (!rawBody) {
      this.logger.error('No raw body found in request');
      throw new BadRequestException('Invalid webhook request');
    }

    if (!signature) {
      this.logger.error('No signature header found');
      throw new BadRequestException('Missing webhook signature');
    }

    if (!this.paystackService.verifyWebhookSignature(rawBody, signature)) {
      this.logger.error('Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      switch (payload.event) {
        case 'charge.success':
          await this.handleChargeSuccess(payload);
          break;

        case 'subscription.create':
          await this.handleSubscriptionCreate(payload);
          break;

        case 'subscription.disable':
          await this.handleSubscriptionDisable(payload);
          break;

        case 'subscription.not_renew':
          await this.handleSubscriptionNotRenew(payload);
          break;

        case 'invoice.create':
          await this.handleInvoiceCreate(payload);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(payload);
          break;

        case 'invoice.update':
          await this.handleInvoiceUpdate(payload);
          break;

        case 'refund.processed':
          await this.handleRefundProcessed(payload);
          break;

        case 'transfer.success':
          await this.handleTransferSuccess(payload);
          break;

        case 'transfer.failed':
          await this.handleTransferFailed(payload);
          break;

        case 'customeridentification.success':
          await this.handleCustomerIdentificationSuccess(payload);
          break;

        case 'customeridentification.failed':
          await this.handleCustomerIdentificationFailed(payload);
          break;

        case 'dedicatedaccount.assign.success':
          await this.handleDedicatedAccountAssignSuccess(payload);
          break;

        case 'dedicatedaccount.assign.failed':
          await this.handleDedicatedAccountAssignFailed(payload);
          break;

        default:
          this.logger.log(`Unhandled Paystack event: ${payload.event}`);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  @Post('initialize-payment')
  @ApiOperation({ summary: 'Initialize a Paystack payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        tier: { type: 'string', enum: ['STARTER', 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE'] },
        billingPeriod: { type: 'string', enum: ['monthly', 'yearly'] },
        currency: { type: 'string', default: 'NGN' },
        callbackUrl: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['email', 'tier', 'billingPeriod', 'callbackUrl', 'userId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Payment initialized' })
  async initializePayment(
    @Body()
    body: {
      email: string;
      tier: SubscriptionTier;
      billingPeriod: 'monthly' | 'yearly';
      currency?: string;
      callbackUrl: string;
      userId: string;
    },
  ) {
    const result = await this.paystackService.initializeSubscription(
      body.email,
      body.tier,
      body.billingPeriod,
      body.currency || 'NGN',
      body.callbackUrl,
      { userId: body.userId },
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify a Paystack transaction' })
  @ApiResponse({ status: 200, description: 'Transaction verified' })
  async verifyTransaction(@Param('reference') reference: string) {
    const transaction = await this.paystackService.verifyTransaction(reference);

    return {
      success: true,
      data: transaction,
    };
  }

  @Get('banks')
  @ApiOperation({ summary: 'Get list of banks' })
  @ApiQuery({ name: 'country', required: false, example: 'nigeria' })
  async getBanks(@Query('country') country?: string) {
    const banks = await this.paystackService.listBanks(country || 'nigeria');

    return {
      success: true,
      data: banks,
    };
  }

  @Post('resolve-account')
  @ApiOperation({ summary: 'Resolve bank account details' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountNumber: { type: 'string' },
        bankCode: { type: 'string' },
      },
      required: ['accountNumber', 'bankCode'],
    },
  })
  async resolveAccount(@Body() body: { accountNumber: string; bankCode: string }) {
    const result = await this.paystackService.resolveAccountNumber(
      body.accountNumber,
      body.bankCode,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Initiate a refund' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transactionReference: { type: 'string' },
        amount: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['transactionReference'],
    },
  })
  async initiateRefund(
    @Body() body: { transactionReference: string; amount?: number; reason?: string },
  ) {
    const result = await this.paystackService.initiateRefund(
      body.transactionReference,
      body.amount,
      body.reason,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('dedicated-account')
  @ApiOperation({ summary: 'Create a dedicated virtual account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerEmail: { type: 'string' },
        preferredBank: { type: 'string', default: 'wema-bank' },
      },
      required: ['customerEmail'],
    },
  })
  async createDedicatedAccount(@Body() body: { customerEmail: string; preferredBank?: string }) {
    const result = await this.paystackService.createDedicatedVirtualAccount(
      body.customerEmail,
      body.preferredBank,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('charge-authorization')
  @ApiOperation({ summary: 'Charge a saved card' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        amount: { type: 'number' },
        authorizationCode: { type: 'string' },
        currency: { type: 'string', default: 'NGN' },
      },
      required: ['email', 'amount', 'authorizationCode'],
    },
  })
  async chargeAuthorization(
    @Body()
    body: {
      email: string;
      amount: number;
      authorizationCode: string;
      currency?: string;
    },
  ) {
    const result = await this.paystackService.chargeAuthorization(
      body.email,
      body.amount,
      body.authorizationCode,
      body.currency || 'NGN',
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans' })
  async listPlans() {
    const plans = await this.paystackService.listPlans();

    return {
      success: true,
      data: plans,
    };
  }

  /**
   * Handle charge.success event
   */
  private async handleChargeSuccess(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing charge success: ${payload.data.reference}`);

    const { data } = payload;
    const metadata = data.metadata || {};

    // Check if this is a subscription payment
    if (metadata.tier) {
      const tier = metadata.tier as SubscriptionTier;

      // Save card for recurring payments
      let authorizationCode: string | undefined;
      if (data.authorization?.reusable) {
        authorizationCode = data.authorization.authorization_code;
      }

      // Create or update subscription
      await this.subscriptionsService.create({
        userId: metadata.userId as string,
        stripeCustomerId: data.customer.customer_code || data.customer.email,
        stripeSubscriptionId: data.reference,
        tier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(metadata.billingPeriod as string),
        cancelAtPeriodEnd: false,
      });

      this.logger.log(`Created subscription for user: ${metadata.userId}`);
    }

    // Record the payment
    const subscription = await this.subscriptionsService.findByUserId(metadata.userId as string);
    if (subscription) {
      await this.invoicesService.createOrUpdate({
        subscriptionId: subscription.id,
        stripeInvoiceId: data.reference,
        stripeCustomerId: data.customer.customer_code || data.customer.email,
        amount: data.amount / 100, // Convert from kobo
        currency: data.currency,
        status: InvoiceStatus.PAID,
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
      });
    }
  }

  /**
   * Handle subscription.create event
   */
  private async handleSubscriptionCreate(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing subscription create: ${payload.data.subscription_code}`);

    const { data } = payload;
    const metadata = data.metadata || {};

    if (data.subscription_code && data.plan) {
      // Map plan name to tier
      const tier = this.mapPlanToTier(data.plan.name);

      await this.subscriptionsService.create({
        userId: metadata.userId as string,
        stripeCustomerId: data.customer.customer_code || data.customer.email,
        stripeSubscriptionId: data.subscription_code,
        tier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(data.plan.interval),
        cancelAtPeriodEnd: false,
      });
    }
  }

  /**
   * Handle subscription.disable event
   */
  private async handleSubscriptionDisable(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing subscription disable: ${payload.data.subscription_code}`);

    const subscription = await this.subscriptionsService.findByStripeSubscriptionId(
      payload.data.subscription_code as string,
    );

    if (subscription) {
      await this.subscriptionsService.update(subscription.id, {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      });

      await this.subscriptionsService.downgradeToFreeTier(subscription.userId);
    }
  }

  /**
   * Handle subscription.not_renew event
   */
  private async handleSubscriptionNotRenew(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing subscription not renew: ${payload.data.subscription_code}`);

    const subscription = await this.subscriptionsService.findByStripeSubscriptionId(
      payload.data.subscription_code as string,
    );

    if (subscription) {
      await this.subscriptionsService.update(subscription.id, {
        cancelAtPeriodEnd: true,
      });
    }
  }

  /**
   * Handle invoice.create event
   */
  private async handleInvoiceCreate(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing invoice create: ${payload.data.reference}`);
    // Invoice is created but not yet paid
  }

  /**
   * Handle invoice.payment_failed event
   */
  private async handleInvoicePaymentFailed(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing invoice payment failed: ${payload.data.reference}`);

    const metadata = payload.data.metadata || {};
    const subscription = await this.subscriptionsService.findByUserId(metadata.userId as string);

    if (subscription) {
      await this.subscriptionsService.update(subscription.id, {
        status: SubscriptionStatus.PAST_DUE,
      });
    }
  }

  /**
   * Handle invoice.update event
   */
  private async handleInvoiceUpdate(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing invoice update: ${payload.data.reference}`);
  }

  /**
   * Handle refund.processed event
   */
  private async handleRefundProcessed(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing refund: ${payload.data.reference}`);

    const invoice = await this.invoicesService.findByStripeInvoiceId(payload.data.reference);
    if (invoice) {
      await this.invoicesService.update(invoice.id, {
        status: InvoiceStatus.VOID,
      });
    }
  }

  /**
   * Handle transfer.success event
   */
  private async handleTransferSuccess(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing transfer success: ${payload.data.reference}`);
    // Handle payout success
  }

  /**
   * Handle transfer.failed event
   */
  private async handleTransferFailed(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing transfer failed: ${payload.data.reference}`);
    // Handle payout failure
  }

  /**
   * Handle customeridentification.success event
   */
  private async handleCustomerIdentificationSuccess(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing customer identification success`);
    // Customer BVN/ID verification successful
  }

  /**
   * Handle customeridentification.failed event
   */
  private async handleCustomerIdentificationFailed(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing customer identification failed`);
    // Customer BVN/ID verification failed
  }

  /**
   * Handle dedicatedaccount.assign.success event
   */
  private async handleDedicatedAccountAssignSuccess(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing dedicated account assign success`);
    // Virtual account created successfully
  }

  /**
   * Handle dedicatedaccount.assign.failed event
   */
  private async handleDedicatedAccountAssignFailed(payload: PaystackWebhookPayload) {
    this.logger.log(`Processing dedicated account assign failed`);
    // Virtual account creation failed
  }

  /**
   * Calculate period end date
   */
  private calculatePeriodEnd(billingPeriod: string): Date {
    const now = new Date();
    switch (billingPeriod) {
      case 'yearly':
      case 'annually':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'daily':
        return new Date(now.setDate(now.getDate() + 1));
      case 'monthly':
      default:
        return new Date(now.setMonth(now.getMonth() + 1));
    }
  }

  /**
   * Map plan name to subscription tier
   */
  private mapPlanToTier(planName: string): SubscriptionTier {
    const name = planName.toLowerCase();
    if (name.includes('executive') || name.includes('enterprise'))
      return SubscriptionTier.EXECUTIVE_ELITE;
    if (name.includes('advanced') || name.includes('business'))
      return SubscriptionTier.ADVANCED_CAREER;
    if (name.includes('professional') || name.includes('pro')) return SubscriptionTier.PROFESSIONAL;
    if (name.includes('basic')) return SubscriptionTier.BASIC;
    if (name.includes('starter')) return SubscriptionTier.STARTER;
    return SubscriptionTier.FREEMIUM;
  }
}
