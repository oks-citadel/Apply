import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

import { WebhookService } from './webhook.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookDeliveryResponseDto,
  TestWebhookDto,
} from './dto/create-webhook.dto';
import { WebhookEventType } from './entities/webhook-subscription.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WebhookAuthGuard } from './guards/webhook-auth.guard';
import {
  WebhookProvider,
  WebhookProviderType,
} from './decorators/webhook-provider.decorator';
import { Public } from '../../auth/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  // ============================================================================
  // OUTGOING WEBHOOK SUBSCRIPTION MANAGEMENT (JWT Protected)
  // These endpoints allow users to manage their outgoing webhook subscriptions
  // ============================================================================

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create webhook subscription',
    description: 'Create a new webhook subscription to receive event notifications',
  })
  @ApiResponse({
    status: 201,
    description: 'Webhook subscription created successfully',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createWebhook(
    @Request() req: any,
    @Body() createDto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const userId = this.extractUserId(req);
    const tenantId = req.user?.tenantId;
    const subscription = await this.webhookService.createSubscription(
      userId,
      createDto,
      tenantId,
    );
    return this.toWebhookResponse(subscription);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List webhook subscriptions',
    description: 'Get all webhook subscriptions for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of webhook subscriptions',
    type: [WebhookResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listWebhooks(@Request() req: any): Promise<WebhookResponseDto[]> {
    const userId = this.extractUserId(req);
    const subscriptions = await this.webhookService.getSubscriptions(userId);
    return subscriptions.map((s) => this.toWebhookResponse(s));
  }

  @Get('event-types')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List available event types',
    description: 'Get all available webhook event types',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available event types',
  })
  async listEventTypes(): Promise<{ event_types: string[] }> {
    return {
      event_types: Object.values(WebhookEventType),
    };
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get webhook subscription',
    description: 'Get details of a specific webhook subscription',
  })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook subscription details',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getWebhook(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<WebhookResponseDto> {
    const userId = this.extractUserId(req);
    const subscription = await this.webhookService.getSubscription(id, userId);
    return this.toWebhookResponse(subscription);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update webhook subscription',
    description: 'Update an existing webhook subscription',
  })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook subscription updated',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async updateWebhook(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    const userId = this.extractUserId(req);
    const subscription = await this.webhookService.updateSubscription(
      id,
      userId,
      updateDto,
    );
    return this.toWebhookResponse(subscription);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete webhook subscription',
    description: 'Delete a webhook subscription',
  })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiResponse({ status: 204, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async deleteWebhook(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = this.extractUserId(req);
    await this.webhookService.deleteSubscription(id, userId);
  }

  @Post(':id/test')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Test webhook subscription',
    description: 'Send a test event to the webhook endpoint',
  })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
    schema: {
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async testWebhook(
    @Request() req: any,
    @Param('id') id: string,
    @Body() testDto: TestWebhookDto,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const userId = this.extractUserId(req);
    return this.webhookService.testWebhook(id, userId, testDto.event_type);
  }

  @Get(':id/deliveries')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get webhook delivery history',
    description: 'Get the delivery history for a webhook subscription',
  })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of deliveries to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery history',
    type: [WebhookDeliveryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getDeliveryHistory(
    @Request() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<WebhookDeliveryResponseDto[]> {
    const userId = this.extractUserId(req);
    const deliveries = await this.webhookService.getDeliveryHistory(
      id,
      userId,
      limit || 50,
    );
    return deliveries.map((d) => this.toDeliveryResponse(d));
  }

  @Post(':id/enable')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enable webhook subscription',
    description: 'Enable a disabled webhook subscription',
  })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook enabled',
    type: WebhookResponseDto,
  })
  async enableWebhook(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<WebhookResponseDto> {
    const userId = this.extractUserId(req);
    const subscription = await this.webhookService.updateSubscription(id, userId, {
      is_enabled: true,
    });
    return this.toWebhookResponse(subscription);
  }

  @Post(':id/disable')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable webhook subscription',
    description: 'Disable a webhook subscription',
  })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook disabled',
    type: WebhookResponseDto,
  })
  async disableWebhook(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<WebhookResponseDto> {
    const userId = this.extractUserId(req);
    const subscription = await this.webhookService.updateSubscription(id, userId, {
      is_enabled: false,
    });
    return this.toWebhookResponse(subscription);
  }

  // ============================================================================
  // INCOMING WEBHOOK RECEIVERS (Signature Verified)
  // These endpoints receive webhooks from external services (Stripe, SendGrid, etc.)
  // They use HMAC signature verification instead of JWT auth
  // ============================================================================

  @Post('receive/generic')
  @Public()
  @UseGuards(WebhookAuthGuard)
  @WebhookProviderType(WebhookProvider.GENERIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive generic webhook',
    description: 'Receive and process a generic webhook with HMAC signature verification',
  })
  @ApiHeader({
    name: 'X-Webhook-Signature',
    description: 'HMAC-SHA256 signature in format: t=<timestamp>,v1=<signature>',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async receiveGenericWebhook(
    @Body() payload: any,
    @Headers('x-webhook-id') webhookId: string,
  ): Promise<{ received: boolean }> {
    this.logger.log(`Received generic webhook: ${webhookId || 'unknown'}`);
    // Process the webhook payload as needed
    // This is where you would dispatch the event internally
    await this.webhookService.processIncomingWebhook('generic', payload);
    return { received: true };
  }

  @Post('receive/stripe')
  @Public()
  @UseGuards(WebhookAuthGuard)
  @WebhookProviderType(WebhookProvider.STRIPE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive Stripe webhook',
    description: 'Receive and process Stripe webhooks with signature verification',
  })
  @ApiHeader({
    name: 'Stripe-Signature',
    description: 'Stripe webhook signature',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async receiveStripeWebhook(@Body() payload: any): Promise<{ received: boolean }> {
    this.logger.log(`Received Stripe webhook: ${payload?.type || 'unknown'}`);
    await this.webhookService.processIncomingWebhook('stripe', payload);
    return { received: true };
  }

  @Post('receive/sendgrid')
  @Public()
  @UseGuards(WebhookAuthGuard)
  @WebhookProviderType(WebhookProvider.SENDGRID)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive SendGrid webhook',
    description: 'Receive and process SendGrid event webhooks with signature verification',
  })
  @ApiHeader({
    name: 'X-Twilio-Email-Event-Webhook-Signature',
    description: 'SendGrid webhook signature',
    required: true,
  })
  @ApiHeader({
    name: 'X-Twilio-Email-Event-Webhook-Timestamp',
    description: 'SendGrid webhook timestamp',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async receiveSendGridWebhook(@Body() payload: any): Promise<{ received: boolean }> {
    this.logger.log('Received SendGrid webhook');
    await this.webhookService.processIncomingWebhook('sendgrid', payload);
    return { received: true };
  }

  @Post('receive/twilio')
  @Public()
  @UseGuards(WebhookAuthGuard)
  @WebhookProviderType(WebhookProvider.TWILIO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive Twilio webhook',
    description: 'Receive and process Twilio SMS/Voice webhooks with signature verification',
  })
  @ApiHeader({
    name: 'X-Twilio-Signature',
    description: 'Twilio webhook signature',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async receiveTwilioWebhook(@Body() payload: any): Promise<{ received: boolean }> {
    this.logger.log('Received Twilio webhook');
    await this.webhookService.processIncomingWebhook('twilio', payload);
    return { received: true };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Extract user ID from authenticated request
   * Throws UnauthorizedException if user is not authenticated
   */
  private extractUserId(req: any): string {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      // This should not happen as JwtAuthGuard should have already validated
      // but we add this check as a defense-in-depth measure
      throw new Error('User ID not found in request - authentication may have failed');
    }
    return userId;
  }

  private toWebhookResponse(subscription: any): WebhookResponseDto {
    return {
      id: subscription.id,
      name: subscription.name,
      url: subscription.url,
      events: subscription.events,
      status: subscription.status,
      is_enabled: subscription.is_enabled,
      failure_count: subscription.failure_count,
      last_triggered_at: subscription.last_triggered_at,
      last_success_at: subscription.last_success_at,
      last_failure_at: subscription.last_failure_at,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
    };
  }

  private toDeliveryResponse(delivery: any): WebhookDeliveryResponseDto {
    return {
      id: delivery.id,
      subscription_id: delivery.subscription_id,
      event_type: delivery.event_type,
      status: delivery.status,
      response_status_code: delivery.response_status_code,
      response_time_ms: delivery.response_time_ms,
      attempt_count: delivery.attempt_count,
      error_message: delivery.error_message,
      delivered_at: delivery.delivered_at,
      created_at: delivery.created_at,
    };
  }
}
