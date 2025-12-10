import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  VIRTUAL_COIN_PACKAGES,
  BOOST_VISIBILITY_COSTS,
  SUBSCRIPTION_TIER_LIMITS,
  SubscriptionTier,
} from '../../common/enums/subscription-tier.enum';

export interface CoinBalance {
  userId: string;
  balance: number;
  monthlyAllocation: number;
  lastAllocationDate: Date;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface VisibilityBoost {
  id: string;
  userId: string;
  resumeId?: string;
  jobApplicationId?: string;
  boostType: 'basic' | 'premium' | 'featured';
  coinsSpent: number;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'expired' | 'cancelled';
}

@Injectable()
export class CoinsService {
  private readonly logger = new Logger(CoinsService.name);

  // In-memory storage (replace with database in production)
  private coinBalances: Map<string, CoinBalance> = new Map();
  private coinTransactions: CoinTransaction[] = [];
  private visibilityBoosts: VisibilityBoost[] = [];

  constructor(private configService: ConfigService) {}

  /**
   * Get user's coin balance
   */
  async getBalance(userId: string): Promise<CoinBalance> {
    let balance = this.coinBalances.get(userId);

    if (!balance) {
      balance = {
        userId,
        balance: 0,
        monthlyAllocation: 0,
        lastAllocationDate: new Date(0),
      };
      this.coinBalances.set(userId, balance);
    }

    return balance;
  }

  /**
   * Credit coins to user's account
   */
  async creditCoins(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>,
  ): Promise<CoinBalance> {
    this.logger.log(`Crediting ${amount} coins to user ${userId}: ${reason}`);

    const balance = await this.getBalance(userId);
    balance.balance += amount;

    const transaction: CoinTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount,
      type: 'CREDIT',
      reason,
      metadata,
      createdAt: new Date(),
    };

    this.coinTransactions.push(transaction);
    this.coinBalances.set(userId, balance);

    return balance;
  }

  /**
   * Debit coins from user's account
   */
  async debitCoins(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>,
  ): Promise<CoinBalance> {
    this.logger.log(`Debiting ${amount} coins from user ${userId}: ${reason}`);

    const balance = await this.getBalance(userId);

    if (balance.balance < amount) {
      throw new BadRequestException('Insufficient coin balance');
    }

    balance.balance -= amount;

    const transaction: CoinTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount: -amount,
      type: 'DEBIT',
      reason,
      metadata,
      createdAt: new Date(),
    };

    this.coinTransactions.push(transaction);
    this.coinBalances.set(userId, balance);

    return balance;
  }

  /**
   * Allocate monthly coins based on subscription tier
   */
  async allocateMonthlyCoins(
    userId: string,
    tier: SubscriptionTier,
  ): Promise<CoinBalance> {
    this.logger.log(`Allocating monthly coins for user ${userId}, tier: ${tier}`);

    const balance = await this.getBalance(userId);
    const now = new Date();
    const lastAllocation = new Date(balance.lastAllocationDate);

    // Check if we already allocated this month
    if (
      lastAllocation.getMonth() === now.getMonth() &&
      lastAllocation.getFullYear() === now.getFullYear()
    ) {
      this.logger.log(`Monthly coins already allocated for user ${userId}`);
      return balance;
    }

    const tierLimits = SUBSCRIPTION_TIER_LIMITS[tier];
    const monthlyCoins = tierLimits.virtualCoinsPerMonth;

    if (monthlyCoins === -1) {
      // Unlimited coins for enterprise - give a large amount
      await this.creditCoins(userId, 50000, 'Monthly subscription allocation (unlimited tier)');
    } else if (monthlyCoins > 0) {
      await this.creditCoins(userId, monthlyCoins, 'Monthly subscription allocation');
    }

    balance.monthlyAllocation = monthlyCoins;
    balance.lastAllocationDate = now;
    this.coinBalances.set(userId, balance);

    return balance;
  }

  /**
   * Purchase a coin package
   */
  async purchaseCoinPackage(
    userId: string,
    packageIndex: number,
    paymentReference: string,
  ): Promise<CoinBalance> {
    if (packageIndex < 0 || packageIndex >= VIRTUAL_COIN_PACKAGES.length) {
      throw new BadRequestException('Invalid coin package');
    }

    const coinPackage = VIRTUAL_COIN_PACKAGES[packageIndex];
    const totalCoins = coinPackage.coins + coinPackage.bonus;

    this.logger.log(`User ${userId} purchasing ${totalCoins} coins (${coinPackage.coins} + ${coinPackage.bonus} bonus)`);

    return await this.creditCoins(
      userId,
      totalCoins,
      `Purchased coin package: ${coinPackage.coins} coins + ${coinPackage.bonus} bonus`,
      {
        packageIndex,
        paymentReference,
        baseCoins: coinPackage.coins,
        bonusCoins: coinPackage.bonus,
        price: coinPackage.price,
        currency: coinPackage.currency,
      },
    );
  }

  /**
   * Get available coin packages
   */
  getCoinPackages() {
    return VIRTUAL_COIN_PACKAGES;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<CoinTransaction[]> {
    return this.coinTransactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Boost visibility of a resume or application
   */
  async boostVisibility(
    userId: string,
    boostType: 'basic' | 'premium' | 'featured',
    targetType: 'resume' | 'application',
    targetId: string,
  ): Promise<VisibilityBoost> {
    this.logger.log(`User ${userId} boosting ${targetType} ${targetId} with ${boostType} boost`);

    const boostConfig = BOOST_VISIBILITY_COSTS[boostType];
    const balance = await this.getBalance(userId);

    if (balance.balance < boostConfig.coins) {
      throw new BadRequestException(
        `Insufficient coins. Need ${boostConfig.coins} coins, have ${balance.balance}`,
      );
    }

    // Check for existing active boost
    const existingBoost = this.visibilityBoosts.find(
      (b) =>
        b.userId === userId &&
        (b.resumeId === targetId || b.jobApplicationId === targetId) &&
        b.status === 'active' &&
        new Date(b.endTime) > new Date(),
    );

    if (existingBoost) {
      throw new BadRequestException('An active boost already exists for this item');
    }

    // Debit coins
    await this.debitCoins(userId, boostConfig.coins, `Visibility boost: ${boostType}`, {
      targetType,
      targetId,
      boostType,
    });

    const now = new Date();
    const endTime = new Date(now.getTime() + boostConfig.durationHours * 60 * 60 * 1000);

    const boost: VisibilityBoost = {
      id: `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      resumeId: targetType === 'resume' ? targetId : undefined,
      jobApplicationId: targetType === 'application' ? targetId : undefined,
      boostType,
      coinsSpent: boostConfig.coins,
      startTime: now,
      endTime,
      status: 'active',
    };

    this.visibilityBoosts.push(boost);

    return boost;
  }

  /**
   * Get user's active boosts
   */
  async getActiveBoosts(userId: string): Promise<VisibilityBoost[]> {
    const now = new Date();

    return this.visibilityBoosts.filter(
      (b) =>
        b.userId === userId &&
        b.status === 'active' &&
        new Date(b.endTime) > now,
    );
  }

  /**
   * Get boost costs
   */
  getBoostCosts() {
    return BOOST_VISIBILITY_COSTS;
  }

  /**
   * Cancel an active boost (partial refund)
   */
  async cancelBoost(userId: string, boostId: string): Promise<{ refundedCoins: number }> {
    const boost = this.visibilityBoosts.find(
      (b) => b.id === boostId && b.userId === userId,
    );

    if (!boost) {
      throw new NotFoundException('Boost not found');
    }

    if (boost.status !== 'active') {
      throw new BadRequestException('Boost is not active');
    }

    const now = new Date();
    const endTime = new Date(boost.endTime);

    if (endTime <= now) {
      throw new BadRequestException('Boost has already expired');
    }

    // Calculate remaining time percentage for refund
    const totalDuration = endTime.getTime() - new Date(boost.startTime).getTime();
    const remainingDuration = endTime.getTime() - now.getTime();
    const refundPercentage = remainingDuration / totalDuration;
    const refundedCoins = Math.floor(boost.coinsSpent * refundPercentage * 0.8); // 80% refund

    boost.status = 'cancelled';

    if (refundedCoins > 0) {
      await this.creditCoins(
        userId,
        refundedCoins,
        `Boost cancellation refund (80% of remaining time)`,
        { boostId, originalCoins: boost.coinsSpent },
      );
    }

    return { refundedCoins };
  }

  /**
   * Check and update expired boosts
   */
  async processExpiredBoosts(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    for (const boost of this.visibilityBoosts) {
      if (boost.status === 'active' && new Date(boost.endTime) <= now) {
        boost.status = 'expired';
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Marked ${expiredCount} boosts as expired`);
    }

    return expiredCount;
  }

  /**
   * Check if an item is currently boosted
   */
  async isItemBoosted(
    targetType: 'resume' | 'application',
    targetId: string,
  ): Promise<{ isBoosted: boolean; boostType?: string; expiresAt?: Date }> {
    const now = new Date();

    const boost = this.visibilityBoosts.find(
      (b) =>
        ((targetType === 'resume' && b.resumeId === targetId) ||
          (targetType === 'application' && b.jobApplicationId === targetId)) &&
        b.status === 'active' &&
        new Date(b.endTime) > now,
    );

    if (boost) {
      return {
        isBoosted: true,
        boostType: boost.boostType,
        expiresAt: boost.endTime,
      };
    }

    return { isBoosted: false };
  }
}
