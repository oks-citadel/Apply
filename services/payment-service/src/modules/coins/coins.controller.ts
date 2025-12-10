import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CoinsService } from './coins.service';

@ApiTags('coins')
@Controller('coins')
export class CoinsController {
  private readonly logger = new Logger(CoinsController.name);

  constructor(private readonly coinsService: CoinsService) {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user coin balance' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user coin balance' })
  async getBalance(@Param('userId') userId: string) {
    const balance = await this.coinsService.getBalance(userId);

    return {
      success: true,
      data: balance,
    };
  }

  @Get('packages')
  @ApiOperation({ summary: 'Get available coin packages' })
  @ApiResponse({ status: 200, description: 'Returns list of coin packages' })
  getPackages() {
    const packages = this.coinsService.getCoinPackages();

    return {
      success: true,
      data: packages,
    };
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase a coin package' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        packageIndex: { type: 'number' },
        paymentReference: { type: 'string' },
      },
      required: ['userId', 'packageIndex', 'paymentReference'],
    },
  })
  @ApiResponse({ status: 200, description: 'Coin package purchased' })
  async purchasePackage(
    @Body()
    body: {
      userId: string;
      packageIndex: number;
      paymentReference: string;
    },
  ) {
    const balance = await this.coinsService.purchaseCoinPackage(
      body.userId,
      body.packageIndex,
      body.paymentReference,
    );

    return {
      success: true,
      message: 'Coins purchased successfully',
      data: balance,
    };
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns transaction history' })
  async getTransactions(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const transactions = await this.coinsService.getTransactionHistory(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );

    return {
      success: true,
      data: transactions,
    };
  }

  @Get('boost/costs')
  @ApiOperation({ summary: 'Get visibility boost costs' })
  @ApiResponse({ status: 200, description: 'Returns boost cost structure' })
  getBoostCosts() {
    const costs = this.coinsService.getBoostCosts();

    return {
      success: true,
      data: costs,
    };
  }

  @Post('boost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Boost visibility of resume or application' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        boostType: { type: 'string', enum: ['basic', 'premium', 'featured'] },
        targetType: { type: 'string', enum: ['resume', 'application'] },
        targetId: { type: 'string' },
      },
      required: ['userId', 'boostType', 'targetType', 'targetId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Visibility boosted' })
  async boostVisibility(
    @Body()
    body: {
      userId: string;
      boostType: 'basic' | 'premium' | 'featured';
      targetType: 'resume' | 'application';
      targetId: string;
    },
  ) {
    const boost = await this.coinsService.boostVisibility(
      body.userId,
      body.boostType,
      body.targetType,
      body.targetId,
    );

    return {
      success: true,
      message: `${body.targetType} visibility boosted with ${body.boostType} boost`,
      data: boost,
    };
  }

  @Get('boosts/:userId')
  @ApiOperation({ summary: 'Get user active boosts' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns active boosts' })
  async getActiveBoosts(@Param('userId') userId: string) {
    const boosts = await this.coinsService.getActiveBoosts(userId);

    return {
      success: true,
      data: boosts,
    };
  }

  @Post('boost/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an active boost' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        boostId: { type: 'string' },
      },
      required: ['userId', 'boostId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Boost cancelled with partial refund' })
  async cancelBoost(
    @Body() body: { userId: string; boostId: string },
  ) {
    const result = await this.coinsService.cancelBoost(body.userId, body.boostId);

    return {
      success: true,
      message: `Boost cancelled. Refunded ${result.refundedCoins} coins.`,
      data: result,
    };
  }

  @Get('boost/status')
  @ApiOperation({ summary: 'Check if an item is boosted' })
  @ApiQuery({ name: 'targetType', enum: ['resume', 'application'] })
  @ApiQuery({ name: 'targetId', type: String })
  @ApiResponse({ status: 200, description: 'Returns boost status' })
  async checkBoostStatus(
    @Query('targetType') targetType: 'resume' | 'application',
    @Query('targetId') targetId: string,
  ) {
    const status = await this.coinsService.isItemBoosted(targetType, targetId);

    return {
      success: true,
      data: status,
    };
  }

  @Post('allocate-monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Allocate monthly coins for subscription' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        tier: {
          type: 'string',
          enum: ['FREE', 'STARTER', 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE'],
        },
      },
      required: ['userId', 'tier'],
    },
  })
  @ApiResponse({ status: 200, description: 'Monthly coins allocated' })
  async allocateMonthlyCoins(
    @Body() body: { userId: string; tier: string },
  ) {
    const { SubscriptionTier } = await import(
      '../../common/enums/subscription-tier.enum'
    );

    const balance = await this.coinsService.allocateMonthlyCoins(
      body.userId,
      body.tier as typeof SubscriptionTier[keyof typeof SubscriptionTier],
    );

    return {
      success: true,
      message: 'Monthly coins allocated',
      data: balance,
    };
  }
}
