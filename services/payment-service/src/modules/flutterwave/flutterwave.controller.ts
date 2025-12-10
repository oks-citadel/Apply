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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { FlutterwaveService } from './flutterwave.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';

interface FlutterwaveWebhookPayload {
  event: string;
  'event.type': string;
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

@ApiTags('flutterwave')
@Controller('flutterwave')
export class FlutterwaveController {
  private readonly logger = new Logger(FlutterwaveController.name);

  constructor(
    private readonly flutterwaveService: FlutterwaveService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Flutterwave webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook' })
  async handleWebhook(
    @Req() request: Request,
    @Headers('verif-hash') signature: string,
    @Body() payload: FlutterwaveWebhookPayload,
  ) {
    this.logger.log(`Received Flutterwave webhook: ${payload.event}`);

    // Verify webhook signature
    const rawBody = JSON.stringify(payload);
    if (!this.flutterwaveService.verifyWebhookSignature(rawBody, signature)) {
      this.logger.error('Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      const eventType = payload['event.type'] || payload.event;

      switch (eventType) {
        case 'CARD_TRANSACTION':
        case 'charge.completed':
          await this.handleChargeCompleted(payload);
          break;

        case 'SUBSCRIPTION_CANCELLED':
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(payload);
          break;

        case 'TRANSFER_COMPLETED':
        case 'transfer.completed':
          await this.handleTransferCompleted(payload);
          break;

        case 'REFUND_COMPLETED':
        case 'refund.completed':
          await this.handleRefundCompleted(payload);
          break;

        case 'PAYMENT_FAILED':
        case 'charge.failed':
          await this.handlePaymentFailed(payload);
          break;

        default:
          this.logger.log(`Unhandled Flutterwave event: ${eventType}`);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  @Post('initialize-payment')
  @ApiOperation({ summary: 'Initialize a Flutterwave payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        tier: { type: 'string', enum: ['STARTER', 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE'] },
        billingPeriod: { type: 'string', enum: ['monthly', 'yearly'] },
        currency: { type: 'string', default: 'USD' },
        redirectUrl: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['email', 'tier', 'billingPeriod', 'redirectUrl', 'userId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Payment link created' })
  async initializePayment(
    @Body()
    body: {
      email: string;
      tier: SubscriptionTier;
      billingPeriod: 'monthly' | 'yearly';
      currency?: string;
      redirectUrl: string;
      userId: string;
      name?: string;
      phone?: string;
    },
  ) {
    const result = await this.flutterwaveService.createPaymentLink(
      { email: body.email, name: body.name, phonenumber: body.phone },
      body.tier,
      body.billingPeriod,
      body.currency || 'USD',
      body.redirectUrl,
      { userId: body.userId },
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('verify/:transactionId')
  @ApiOperation({ summary: 'Verify a Flutterwave transaction' })
  @ApiResponse({ status: 200, description: 'Transaction verified' })
  async verifyTransaction(@Param('transactionId') transactionId: string) {
    const transaction = await this.flutterwaveService.verifyTransaction(
      parseInt(transactionId, 10),
    );

    return {
      success: true,
      data: transaction,
    };
  }

  @Get('banks/:country')
  @ApiOperation({ summary: 'Get list of banks for a country' })
  @ApiQuery({ name: 'country', required: false, example: 'NG' })
  async getBanks(@Param('country') country: string) {
    const banks = await this.flutterwaveService.getBanks(country);

    return {
      success: true,
      data: banks,
    };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Initiate a refund' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transactionId: { type: 'number' },
        amount: { type: 'number' },
      },
      required: ['transactionId'],
    },
  })
  async initiateRefund(
    @Body() body: { transactionId: number; amount?: number },
  ) {
    const result = await this.flutterwaveService.initiateRefund(
      body.transactionId,
      body.amount,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('virtual-account')
  @ApiOperation({ summary: 'Create a virtual account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        bvn: { type: 'string' },
        isPermanent: { type: 'boolean', default: true },
      },
      required: ['email', 'bvn'],
    },
  })
  async createVirtualAccount(
    @Body() body: { email: string; bvn: string; isPermanent?: boolean },
  ) {
    const result = await this.flutterwaveService.createVirtualAccount(
      body.email,
      body.bvn,
      body.isPermanent ?? true,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Handle charge.completed webhook event
   */
  private async handleChargeCompleted(payload: FlutterwaveWebhookPayload) {
    this.logger.log(`Processing charge completed: ${payload.data.tx_ref}`);

    const { data } = payload;

    if (data.status !== 'successful') {
      this.logger.warn(`Transaction not successful: ${data.status}`);
      return;
    }

    const meta = data.meta || {};

    // Check if this is a subscription payment
    if (meta.tier) {
      const tier = meta.tier as SubscriptionTier;

      // Create or update subscription
      await this.subscriptionsService.create({
        userId: meta.userId,
        stripeCustomerId: data.customer.email, // Using email as identifier for Flutterwave
        stripeSubscriptionId: data.flw_ref,
        tier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(meta.billingPeriod as string),
        cancelAtPeriodEnd: false,
      });

      this.logger.log(`Created subscription for user: ${meta.userId}`);
    }

    // Record the invoice/payment
    const subscription = await this.subscriptionsService.findByUserId(meta.userId);
    if (subscription) {
      await this.invoicesService.createOrUpdate({
        subscriptionId: subscription.id,
        stripeInvoiceId: data.flw_ref,
        stripeCustomerId: data.customer.email,
        amount: data.amount,
        currency: data.currency,
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      });
    }
  }

  /**
   * Handle subscription.cancelled webhook event
   */
  private async handleSubscriptionCancelled(payload: FlutterwaveWebhookPayload) {
    this.logger.log(`Processing subscription cancelled: ${payload.data.tx_ref}`);

    const subscription = await this.subscriptionsService.findByStripeSubscriptionId(
      payload.data.flw_ref,
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
   * Handle transfer.completed webhook event
   */
  private async handleTransferCompleted(payload: FlutterwaveWebhookPayload) {
    this.logger.log(`Processing transfer completed: ${payload.data.tx_ref}`);
    // Handle payout/transfer completion if needed
  }

  /**
   * Handle refund.completed webhook event
   */
  private async handleRefundCompleted(payload: FlutterwaveWebhookPayload) {
    this.logger.log(`Processing refund completed: ${payload.data.tx_ref}`);

    // Update invoice status
    const invoice = await this.invoicesService.findByStripeInvoiceId(payload.data.flw_ref);
    if (invoice) {
      await this.invoicesService.update(invoice.id, {
        status: InvoiceStatus.VOID,
      });
    }
  }

  /**
   * Handle charge.failed webhook event
   */
  private async handlePaymentFailed(payload: FlutterwaveWebhookPayload) {
    this.logger.log(`Processing payment failed: ${payload.data.tx_ref}`);

    const meta = payload.data.meta || {};
    const subscription = await this.subscriptionsService.findByUserId(meta.userId);

    if (subscription) {
      await this.subscriptionsService.update(subscription.id, {
        status: SubscriptionStatus.PAST_DUE,
      });
    }
  }

  /**
   * Calculate period end date
   */
  private calculatePeriodEnd(billingPeriod: string): Date {
    const now = new Date();
    if (billingPeriod === 'yearly') {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
    return new Date(now.setMonth(now.getMonth() + 1));
  }
}
