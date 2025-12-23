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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
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

// Placeholder guard - replace with actual auth guard
class JwtAuthGuard {
  canActivate() {
    return true;
  }
}

@ApiTags('webhooks')
@ApiBearerAuth('JWT-auth')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    const tenantId = req.user?.tenantId;
    const subscription = await this.webhookService.createSubscription(
      userId,
      createDto,
      tenantId,
    );
    return this.toWebhookResponse(subscription);
  }

  @Get()
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    const subscriptions = await this.webhookService.getSubscriptions(userId);
    return subscriptions.map((s) => this.toWebhookResponse(s));
  }

  @Get('event-types')
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    const subscription = await this.webhookService.getSubscription(id, userId);
    return this.toWebhookResponse(subscription);
  }

  @Put(':id')
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    const subscription = await this.webhookService.updateSubscription(
      id,
      userId,
      updateDto,
    );
    return this.toWebhookResponse(subscription);
  }

  @Delete(':id')
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    await this.webhookService.deleteSubscription(id, userId);
  }

  @Post(':id/test')
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    return this.webhookService.testWebhook(id, userId, testDto.event_type);
  }

  @Get(':id/deliveries')
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    const deliveries = await this.webhookService.getDeliveryHistory(
      id,
      userId,
      limit || 50,
    );
    return deliveries.map((d) => this.toDeliveryResponse(d));
  }

  @Post(':id/enable')
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    const subscription = await this.webhookService.updateSubscription(id, userId, {
      is_enabled: true,
    });
    return this.toWebhookResponse(subscription);
  }

  @Post(':id/disable')
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
    const userId = req.user?.id || req.user?.sub || 'demo-user';
    const subscription = await this.webhookService.updateSubscription(id, userId, {
      is_enabled: false,
    });
    return this.toWebhookResponse(subscription);
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
