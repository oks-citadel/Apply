import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

import {
  WebhookSubscription,
  WebhookEventType,
  WebhookStatus,
} from './entities/webhook-subscription.entity';
import {
  WebhookDelivery,
  DeliveryStatus,
} from './entities/webhook-delivery.entity';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/create-webhook.dto';

export interface WebhookEvent {
  type: WebhookEventType;
  userId: string;
  tenantId?: string;
  data: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly maxRetryDelay = 3600000; // 1 hour max
  private readonly baseRetryDelay = 60000; // 1 minute base

  constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subscriptionRepository: Repository<WebhookSubscription>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new webhook subscription
   */
  async createSubscription(
    userId: string,
    dto: CreateWebhookDto,
    tenantId?: string,
  ): Promise<WebhookSubscription> {
    this.logger.log(`Creating webhook subscription for user ${userId}`);

    // Generate secret if not provided
    const secret = dto.secret || this.generateSecret();

    const subscription = this.subscriptionRepository.create({
      user_id: userId,
      tenant_id: tenantId,
      name: dto.name,
      url: dto.url,
      secret,
      events: dto.events,
      headers: dto.headers,
      max_retries: dto.max_retries ?? 3,
      timeout_ms: dto.timeout_ms ?? 30000,
      is_enabled: dto.is_enabled ?? true,
      status: WebhookStatus.ACTIVE,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    this.logger.log(`Created webhook subscription ${saved.id}`);

    return saved;
  }

  /**
   * Update a webhook subscription
   */
  async updateSubscription(
    id: string,
    userId: string,
    dto: UpdateWebhookDto,
  ): Promise<WebhookSubscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Webhook subscription ${id} not found`);
    }

    Object.assign(subscription, dto);

    // Reset failure count if re-enabling
    if (dto.is_enabled && !subscription.is_enabled) {
      subscription.failure_count = 0;
      subscription.status = WebhookStatus.ACTIVE;
    }

    const updated = await this.subscriptionRepository.save(subscription);
    this.logger.log(`Updated webhook subscription ${id}`);

    return updated;
  }

  /**
   * Delete a webhook subscription
   */
  async deleteSubscription(id: string, userId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Webhook subscription ${id} not found`);
    }

    await this.subscriptionRepository.remove(subscription);
    this.logger.log(`Deleted webhook subscription ${id}`);
  }

  /**
   * Get all webhook subscriptions for a user
   */
  async getSubscriptions(userId: string): Promise<WebhookSubscription[]> {
    return this.subscriptionRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get a specific webhook subscription
   */
  async getSubscription(id: string, userId: string): Promise<WebhookSubscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Webhook subscription ${id} not found`);
    }

    return subscription;
  }

  /**
   * Get delivery history for a subscription
   */
  async getDeliveryHistory(
    subscriptionId: string,
    userId: string,
    limit = 50,
  ): Promise<WebhookDelivery[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, user_id: userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Webhook subscription ${subscriptionId} not found`);
    }

    return this.deliveryRepository.find({
      where: { subscription_id: subscriptionId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Dispatch a webhook event to all matching subscriptions
   */
  async dispatchEvent(event: WebhookEvent): Promise<void> {
    this.logger.log(`Dispatching webhook event: ${event.type}`);

    // Find all active subscriptions for this event type
    const subscriptions = await this.findSubscriptionsForEvent(event);

    if (subscriptions.length === 0) {
      this.logger.debug(`No subscriptions found for event ${event.type}`);
      return;
    }

    this.logger.log(
      `Found ${subscriptions.length} subscriptions for event ${event.type}`,
    );

    // Dispatch to all subscriptions in parallel
    await Promise.allSettled(
      subscriptions.map((subscription) =>
        this.deliverWebhook(subscription, event),
      ),
    );
  }

  /**
   * Test a webhook subscription by sending a test event
   */
  async testWebhook(
    id: string,
    userId: string,
    eventType?: WebhookEventType,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const subscription = await this.getSubscription(id, userId);

    const testEvent: WebhookEvent = {
      type: eventType || WebhookEventType.APPLICATION_SUBMITTED,
      userId,
      data: {
        test: true,
        message: 'This is a test webhook event',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const result = await this.deliverWebhookWithResponse(subscription, testEvent);
      return {
        success: result.success,
        statusCode: result.statusCode,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(): Promise<void> {
    const now = new Date();
    const failedDeliveries = await this.deliveryRepository.find({
      where: {
        status: In([DeliveryStatus.FAILED, DeliveryStatus.RETRYING]),
      },
      relations: ['subscription'],
    });

    const toRetry = failedDeliveries.filter(
      (d) =>
        d.next_retry_at &&
        d.next_retry_at <= now &&
        d.attempt_count < (d.subscription?.max_retries || 3),
    );

    this.logger.log(`Retrying ${toRetry.length} failed webhook deliveries`);

    for (const delivery of toRetry) {
      await this.retryDelivery(delivery);
    }
  }

  /**
   * Find subscriptions that match an event
   */
  private async findSubscriptionsForEvent(
    event: WebhookEvent,
  ): Promise<WebhookSubscription[]> {
    const query = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.user_id = :userId', { userId: event.userId })
      .andWhere('subscription.is_enabled = :enabled', { enabled: true })
      .andWhere('subscription.status = :status', { status: WebhookStatus.ACTIVE });

    if (event.tenantId) {
      query.andWhere(
        '(subscription.tenant_id = :tenantId OR subscription.tenant_id IS NULL)',
        { tenantId: event.tenantId },
      );
    }

    const subscriptions = await query.getMany();

    // Filter by event type (since we use simple-array)
    return subscriptions.filter((sub) => sub.events.includes(event.type));
  }

  /**
   * Deliver a webhook to a subscription
   */
  private async deliverWebhook(
    subscription: WebhookSubscription,
    event: WebhookEvent,
  ): Promise<void> {
    const idempotencyKey = this.generateIdempotencyKey(subscription.id, event);

    // Check if already delivered (idempotency)
    const existing = await this.deliveryRepository.findOne({
      where: { idempotency_key: idempotencyKey },
    });

    if (existing && existing.status === DeliveryStatus.DELIVERED) {
      this.logger.debug(`Webhook already delivered: ${idempotencyKey}`);
      return;
    }

    const delivery = existing || this.deliveryRepository.create({
      subscription_id: subscription.id,
      event_type: event.type,
      payload: this.buildPayload(event),
      idempotency_key: idempotencyKey,
      status: DeliveryStatus.PROCESSING,
    });

    delivery.status = DeliveryStatus.PROCESSING;
    delivery.attempt_count++;
    await this.deliveryRepository.save(delivery);

    try {
      const result = await this.sendWebhookRequest(subscription, delivery.payload);

      delivery.status = DeliveryStatus.DELIVERED;
      delivery.response_status_code = result.statusCode;
      delivery.response_body = result.body?.substring(0, 5000);
      delivery.response_time_ms = result.responseTime;
      delivery.delivered_at = new Date();

      // Update subscription success tracking
      subscription.last_triggered_at = new Date();
      subscription.last_success_at = new Date();
      subscription.failure_count = 0;
      await this.subscriptionRepository.save(subscription);

      this.logger.log(
        `Webhook delivered successfully to ${subscription.url} (${result.statusCode})`,
      );
    } catch (error) {
      delivery.status = DeliveryStatus.FAILED;
      delivery.error_message = error.message;
      delivery.response_status_code = error.response?.status;
      delivery.response_body = error.response?.data?.substring(0, 5000);

      // Calculate next retry
      if (delivery.attempt_count < subscription.max_retries) {
        delivery.status = DeliveryStatus.RETRYING;
        delivery.next_retry_at = this.calculateNextRetry(delivery.attempt_count);
      }

      // Update subscription failure tracking
      subscription.last_triggered_at = new Date();
      subscription.last_failure_at = new Date();
      subscription.last_error = error.message;
      subscription.failure_count++;

      // Suspend if too many failures
      if (subscription.failure_count >= 10) {
        subscription.status = WebhookStatus.SUSPENDED;
        this.logger.warn(`Webhook ${subscription.id} suspended due to repeated failures`);
      }

      await this.subscriptionRepository.save(subscription);

      this.logger.error(
        `Webhook delivery failed to ${subscription.url}: ${error.message}`,
      );
    }

    await this.deliveryRepository.save(delivery);
  }

  /**
   * Deliver webhook and return detailed response
   */
  private async deliverWebhookWithResponse(
    subscription: WebhookSubscription,
    event: WebhookEvent,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const payload = this.buildPayload(event);

    try {
      const result = await this.sendWebhookRequest(subscription, payload);
      return {
        success: true,
        statusCode: result.statusCode,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: error.response?.status,
        error: error.message,
      };
    }
  }

  /**
   * Retry a failed delivery
   */
  private async retryDelivery(delivery: WebhookDelivery): Promise<void> {
    const subscription = delivery.subscription;
    if (!subscription || subscription.status !== WebhookStatus.ACTIVE) {
      delivery.status = DeliveryStatus.FAILED;
      delivery.error_message = 'Subscription inactive or not found';
      await this.deliveryRepository.save(delivery);
      return;
    }

    delivery.status = DeliveryStatus.PROCESSING;
    delivery.attempt_count++;
    await this.deliveryRepository.save(delivery);

    try {
      const result = await this.sendWebhookRequest(subscription, delivery.payload);

      delivery.status = DeliveryStatus.DELIVERED;
      delivery.response_status_code = result.statusCode;
      delivery.response_body = result.body?.substring(0, 5000);
      delivery.response_time_ms = result.responseTime;
      delivery.delivered_at = new Date();
      delivery.next_retry_at = null;

      subscription.last_success_at = new Date();
      subscription.failure_count = 0;
      await this.subscriptionRepository.save(subscription);

      this.logger.log(
        `Webhook retry succeeded for ${subscription.url} (attempt ${delivery.attempt_count})`,
      );
    } catch (error) {
      if (delivery.attempt_count < subscription.max_retries) {
        delivery.status = DeliveryStatus.RETRYING;
        delivery.next_retry_at = this.calculateNextRetry(delivery.attempt_count);
        delivery.error_message = error.message;
      } else {
        delivery.status = DeliveryStatus.FAILED;
        delivery.error_message = `Max retries exceeded: ${error.message}`;
        subscription.failure_count++;

        if (subscription.failure_count >= 10) {
          subscription.status = WebhookStatus.SUSPENDED;
        }
        await this.subscriptionRepository.save(subscription);
      }

      this.logger.warn(
        `Webhook retry failed for ${subscription.url} (attempt ${delivery.attempt_count}): ${error.message}`,
      );
    }

    await this.deliveryRepository.save(delivery);
  }

  /**
   * Send the actual HTTP request
   */
  private async sendWebhookRequest(
    subscription: WebhookSubscription,
    payload: Record<string, any>,
  ): Promise<{ statusCode: number; body: string; responseTime: number }> {
    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ApplyForUs-Webhooks/1.0',
      'X-Webhook-ID': subscription.id,
      'X-Webhook-Timestamp': timestamp.toString(),
      ...(subscription.headers || {}),
    };

    // Add signature if secret is configured
    if (subscription.secret) {
      const signature = this.generateSignature(
        payloadString,
        timestamp,
        subscription.secret,
      );
      headers['X-Webhook-Signature'] = signature;
    }

    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.post(subscription.url, payload, {
          headers,
          timeout: subscription.timeout_ms,
          validateStatus: (status) => status >= 200 && status < 300,
        }),
      );

      return {
        statusCode: response.status,
        body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      // Preserve status code for proper error handling
      const webhookError = new Error(
        error.response
          ? `HTTP ${error.response.status}: ${error.response.statusText}`
          : error.code === 'ECONNABORTED'
            ? 'Request timeout'
            : error.code === 'ECONNREFUSED'
              ? 'Connection refused'
              : error.message || 'Unknown error',
      ) as Error & { response?: { status: number } };

      // Attach response info for status code extraction
      if (error.response) {
        webhookError.response = { status: error.response.status };
      }
      throw webhookError;
    }
  }

  /**
   * Build the webhook payload
   */
  private buildPayload(event: WebhookEvent): Record<string, any> {
    return {
      id: crypto.randomUUID(),
      type: event.type,
      created: (event.timestamp || new Date()).toISOString(),
      data: event.data,
      api_version: '2024-01-01',
    };
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private generateSignature(
    payload: string,
    timestamp: number,
    secret: string,
  ): string {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Generate a random secret
   */
  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate idempotency key
   */
  private generateIdempotencyKey(
    subscriptionId: string,
    event: WebhookEvent,
  ): string {
    const data = `${subscriptionId}:${event.type}:${JSON.stringify(event.data)}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetry(attemptCount: number): Date {
    const delay = Math.min(
      this.baseRetryDelay * Math.pow(2, attemptCount - 1),
      this.maxRetryDelay,
    );
    return new Date(Date.now() + delay);
  }

  // ============================================================================
  // INCOMING WEBHOOK PROCESSING
  // ============================================================================

  /**
   * Process an incoming webhook from an external service
   * This method handles webhooks received from services like Stripe, SendGrid, etc.
   *
   * @param provider - The webhook provider (stripe, sendgrid, twilio, generic)
   * @param payload - The raw webhook payload
   */
  async processIncomingWebhook(
    provider: string,
    payload: Record<string, any>,
  ): Promise<void> {
    this.logger.log(`Processing incoming ${provider} webhook`);

    try {
      switch (provider) {
        case 'stripe':
          await this.handleStripeWebhook(payload);
          break;
        case 'sendgrid':
          await this.handleSendGridWebhook(payload);
          break;
        case 'twilio':
          await this.handleTwilioWebhook(payload);
          break;
        case 'generic':
        default:
          await this.handleGenericWebhook(payload);
          break;
      }

      this.logger.log(`Successfully processed ${provider} webhook`);
    } catch (error) {
      this.logger.error(
        `Failed to process ${provider} webhook: ${error.message}`,
        error.stack,
      );
      // Re-throw to let the controller handle the error response
      throw error;
    }
  }

  /**
   * Handle Stripe webhooks (payment events)
   */
  private async handleStripeWebhook(payload: Record<string, any>): Promise<void> {
    const eventType = payload.type;
    const data = payload.data?.object;

    this.logger.debug(`Stripe webhook event: ${eventType}`);

    // Map Stripe events to internal notification events
    switch (eventType) {
      case 'payment_intent.succeeded':
        // Trigger payment success notification
        this.logger.log(`Payment succeeded: ${data?.id}`);
        break;
      case 'payment_intent.payment_failed':
        // Trigger payment failure notification
        this.logger.log(`Payment failed: ${data?.id}`);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Trigger subscription status notification
        this.logger.log(`Subscription event: ${eventType} for ${data?.id}`);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed':
        // Trigger invoice notification
        this.logger.log(`Invoice event: ${eventType} for ${data?.id}`);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${eventType}`);
    }
  }

  /**
   * Handle SendGrid webhooks (email delivery events)
   */
  private async handleSendGridWebhook(
    payload: Record<string, any> | Record<string, any>[],
  ): Promise<void> {
    // SendGrid sends events as an array
    const events = Array.isArray(payload) ? payload : [payload];

    for (const event of events) {
      const eventType = event.event;
      const email = event.email;

      this.logger.debug(`SendGrid webhook event: ${eventType} for ${email}`);

      switch (eventType) {
        case 'delivered':
          this.logger.log(`Email delivered to ${email}`);
          break;
        case 'bounce':
        case 'blocked':
          this.logger.warn(`Email bounce/blocked for ${email}: ${event.reason}`);
          break;
        case 'spam_report':
          this.logger.warn(`Spam report from ${email}`);
          break;
        case 'unsubscribe':
          this.logger.log(`User unsubscribed: ${email}`);
          break;
        case 'open':
        case 'click':
          this.logger.debug(`Email ${eventType} event for ${email}`);
          break;
        default:
          this.logger.debug(`Unhandled SendGrid event type: ${eventType}`);
      }
    }
  }

  /**
   * Handle Twilio webhooks (SMS delivery events)
   */
  private async handleTwilioWebhook(payload: Record<string, any>): Promise<void> {
    const messageStatus = payload.MessageStatus || payload.SmsStatus;
    const messageSid = payload.MessageSid || payload.SmsSid;

    this.logger.debug(`Twilio webhook: ${messageStatus} for ${messageSid}`);

    switch (messageStatus) {
      case 'delivered':
        this.logger.log(`SMS delivered: ${messageSid}`);
        break;
      case 'failed':
      case 'undelivered':
        this.logger.warn(`SMS failed: ${messageSid} - ${payload.ErrorCode}`);
        break;
      case 'sent':
      case 'queued':
        this.logger.debug(`SMS ${messageStatus}: ${messageSid}`);
        break;
      default:
        this.logger.debug(`Unhandled Twilio status: ${messageStatus}`);
    }
  }

  /**
   * Handle generic webhooks
   */
  private async handleGenericWebhook(payload: Record<string, any>): Promise<void> {
    const eventType = payload.type || payload.event || 'unknown';
    this.logger.log(`Generic webhook received: ${eventType}`);

    // Process based on the event type in the payload
    // This is where you would implement custom logic for your own webhook events
  }
}
