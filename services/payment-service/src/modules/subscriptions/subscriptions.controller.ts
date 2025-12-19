import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { SubscriptionTier } from '../../common/enums/subscription-tier.enum';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.subscriptionsService.findAll(page, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get subscription by user ID' })
  @ApiResponse({ status: 200, description: 'Subscription found' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findByUserId(@Param('userId') userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  @Get('user/:userId/limits')
  @ApiOperation({ summary: 'Get subscription limits for a user' })
  @ApiResponse({ status: 200, description: 'Limits retrieved successfully' })
  async getUserLimits(@Param('userId') userId: string) {
    const subscription = await this.subscriptionsService.findByUserId(userId);
    const tier = subscription?.tier || SubscriptionTier.FREEMIUM;
    return this.subscriptionsService.getSubscriptionLimits(tier);
  }

  @Post('user/:userId/check-feature')
  @ApiOperation({ summary: 'Check if user has access to a feature' })
  @ApiResponse({ status: 200, description: 'Feature access checked' })
  async checkFeatureAccess(@Param('userId') userId: string, @Body('feature') feature: string) {
    const hasAccess = await this.subscriptionsService.checkFeatureAccess(userId, feature);
    return { hasAccess };
  }

  @Post('user/:userId/check-usage')
  @ApiOperation({ summary: 'Check usage against subscription limits' })
  @ApiResponse({ status: 200, description: 'Usage checked' })
  async checkUsage(
    @Param('userId') userId: string,
    @Body('usageType') usageType: string,
    @Body('currentUsage') currentUsage: number,
  ) {
    return await this.subscriptionsService.checkUsageLimits(userId, usageType, currentUsage);
  }

  @Post('checkout-session')
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    // Get or create Stripe customer
    const customer = await this.stripeService.getOrCreateCustomer(dto.userEmail, dto.userId);

    // Create checkout session
    const session = await this.stripeService.createCheckoutSession(
      customer.id,
      dto.tier,
      dto.billingPeriod,
      dto.successUrl,
      dto.cancelUrl,
      {
        userId: dto.userId,
        ...dto.metadata,
      },
    );

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  }

  @Post(':id/billing-portal')
  @ApiOperation({ summary: 'Create a Stripe billing portal session' })
  @ApiResponse({ status: 201, description: 'Billing portal session created' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async createBillingPortalSession(@Param('id') id: string, @Body('returnUrl') returnUrl: string) {
    const subscription = await this.subscriptionsService.findOne(id);

    if (!subscription.stripeCustomerId) {
      throw new Error('No Stripe customer associated with this subscription');
    }

    const session = await this.stripeService.createBillingPortalSession(
      subscription.stripeCustomerId,
      returnUrl,
    );

    return {
      sessionUrl: session.url,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription found' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(@Param('id') id: string, @Body('immediately') immediately: boolean = false) {
    const subscription = await this.subscriptionsService.findOne(id);

    // Cancel in Stripe if it has a Stripe subscription ID
    if (subscription.stripeSubscriptionId) {
      await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);
    }

    // Cancel in our database
    return await this.subscriptionsService.cancel(id, immediately);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate canceled subscription' })
  @ApiResponse({ status: 200, description: 'Subscription reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async reactivate(@Param('id') id: string) {
    const subscription = await this.subscriptionsService.findOne(id);

    // Reactivate in Stripe if it has a Stripe subscription ID
    if (subscription.stripeSubscriptionId) {
      await this.stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        subscription.tier,
        'monthly', // Default to monthly
      );
    }

    // Reactivate in our database
    return await this.subscriptionsService.reactivate(id);
  }

  @Post(':id/upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade subscription to a higher tier' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async upgrade(
    @Param('id') id: string,
    @Body('tier') tier: SubscriptionTier,
    @Body('billingPeriod') billingPeriod: 'monthly' | 'yearly' = 'monthly',
  ) {
    const subscription = await this.subscriptionsService.findOne(id);

    // Update in Stripe if it has a Stripe subscription ID
    if (subscription.stripeSubscriptionId) {
      await this.stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        tier,
        billingPeriod,
      );
    }

    // Update in our database
    return await this.subscriptionsService.update(id, { tier });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiResponse({ status: 204, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
