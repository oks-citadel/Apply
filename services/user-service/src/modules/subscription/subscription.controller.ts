import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async getSubscription(@CurrentUser('userId') userId: string) {
    return this.subscriptionService.getSubscription(userId);
  }

  @Post('checkout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
  async createCheckoutSession(
    @CurrentUser('userId') userId: string,
    @CurrentUser('email') email: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.subscriptionService.createCheckoutSession(userId, email, dto);
  }

  @Post('portal')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @ApiResponse({ status: 201, description: 'Portal session created successfully' })
  async createPortalSession(@CurrentUser('userId') userId: string) {
    return this.subscriptionService.createPortalSession(userId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.subscriptionService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }

  @Get('usage')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get feature usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage stats retrieved successfully' })
  async getUsageStats(@CurrentUser('userId') userId: string) {
    return this.subscriptionService.getUsageStats(userId);
  }
}
