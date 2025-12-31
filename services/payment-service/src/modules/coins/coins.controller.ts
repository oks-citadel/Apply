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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { CurrentUser } from '../../auth/current-user.decorator';
import { Public } from '../../auth/public.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';

@ApiTags('coins')
@ApiBearerAuth()
@Controller('coins')
export class CoinsController {
  private readonly logger = new Logger(CoinsController.name);

  constructor(private readonly coinsService: CoinsService) {}

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get user coin balance' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user coin balance' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async getBalance(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // IDOR protection: Users can only access their own balance
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own coin balance');
    }

    const balance = await this.coinsService.getBalance(userId);

    return {
      success: true,
      data: balance,
    };
  }

  @Get('packages')
  @Public()
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
        packageIndex: { type: 'number' },
        paymentReference: { type: 'string' },
      },
      required: ['packageIndex', 'paymentReference'],
    },
  })
  @ApiResponse({ status: 200, description: 'Coin package purchased' })
  async purchasePackage(
    @Body() body: { packageIndex: number; paymentReference: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Use authenticated user's ID to prevent IDOR
    const balance = await this.coinsService.purchaseCoinPackage(
      user.id,
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
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async getTransactions(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    // IDOR protection: Users can only access their own transactions
    if (user && user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own transaction history');
    }

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
  @Public()
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
        boostType: { type: 'string', enum: ['basic', 'premium', 'featured'] },
        targetType: { type: 'string', enum: ['resume', 'application'] },
        targetId: { type: 'string' },
      },
      required: ['boostType', 'targetType', 'targetId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Visibility boosted' })
  async boostVisibility(
    @Body()
    body: {
      boostType: 'basic' | 'premium' | 'featured';
      targetType: 'resume' | 'application';
      targetId: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Use authenticated user's ID to prevent IDOR
    const boost = await this.coinsService.boostVisibility(
      user.id,
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
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async getActiveBoosts(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // IDOR protection: Users can only access their own boosts
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own boosts');
    }

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
        boostId: { type: 'string' },
      },
      required: ['boostId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Boost cancelled with partial refund' })
  async cancelBoost(
    @Body() body: { boostId: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Use authenticated user's ID to prevent IDOR
    const result = await this.coinsService.cancelBoost(user.id, body.boostId);

    return {
      success: true,
      message: `Boost cancelled. Refunded ${result.refundedCoins} coins.`,
      data: result,
    };
  }

  @Get('boost/status')
  @Public()
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
  @ApiOperation({ summary: 'Allocate monthly coins for subscription (Admin only)' })
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
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async allocateMonthlyCoins(
    @Body() body: { userId: string; tier: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Admin-only endpoint - prevent non-admins from allocating coins
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can allocate monthly coins');
    }

    const { SubscriptionTier } = await import('../../common/enums/subscription-tier.enum');

    const balance = await this.coinsService.allocateMonthlyCoins(
      body.userId,
      body.tier as (typeof SubscriptionTier)[keyof typeof SubscriptionTier],
    );

    return {
      success: true,
      message: 'Monthly coins allocated',
      data: balance,
    };
  }
}
