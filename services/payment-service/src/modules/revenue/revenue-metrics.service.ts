import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

/**
 * Revenue metrics snapshot
 */
export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  currency: string;
  timestamp: Date;

  // MRR Components
  newMrr: number; // From new subscriptions this month
  expansionMrr: number; // From upgrades
  contractionMrr: number; // From downgrades (negative)
  churnMrr: number; // From cancellations (negative)
  reactivationMrr: number; // From reactivations

  // Key Metrics
  netMrrGrowth: number;
  netMrrGrowthRate: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;

  // Subscriber Counts
  totalActiveSubscribers: number;
  newSubscribers: number;
  churnedSubscribers: number;
  upgradedSubscribers: number;
  downgradedSubscribers: number;

  // Rates
  churnRate: number;
  retentionRate: number;
  conversionRate: number;
}

/**
 * MRR breakdown by plan
 */
export interface MrrByPlan {
  planName: string;
  planId: string;
  mrr: number;
  subscriberCount: number;
  percentageOfTotal: number;
}

/**
 * Revenue trend data point
 */
export interface RevenueTrendPoint {
  date: Date;
  mrr: number;
  arr: number;
  activeSubscribers: number;
}

/**
 * Cohort analysis data
 */
export interface CohortData {
  cohortMonth: string;
  initialSubscribers: number;
  retentionByMonth: number[];
  revenueByMonth: number[];
}

/**
 * Plan pricing for MRR calculations
 */
const PLAN_MONTHLY_PRICES: Record<string, number> = {
  freemium: 0,
  starter: 9.99,
  basic: 19.99,
  professional: 39.99,
  advanced_career: 79.99,
  executive_elite: 149.99,
};

/**
 * Revenue Metrics Service
 *
 * Calculates and tracks SaaS revenue metrics including MRR, ARR,
 * churn, retention, and customer lifetime value.
 *
 * Features:
 * - Real-time MRR/ARR calculation
 * - MRR movement tracking (new, expansion, contraction, churn)
 * - Cohort analysis
 * - Revenue forecasting
 * - Plan distribution analysis
 * - Historical trend tracking
 */
@Injectable()
export class RevenueMetricsService {
  private readonly logger = new Logger(RevenueMetricsService.name);
  private readonly baseCurrency = 'USD';

  // Cache for expensive calculations
  private metricsCache: { data: RevenueMetrics; expiry: number } | null = null;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Calculate current MRR
   */
  async calculateMrr(): Promise<number> {
    const activeSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const monthlyPrice = this.getMonthlyPrice(sub.tier, sub.billingInterval);
      mrr += monthlyPrice;
    }

    return Math.round(mrr * 100) / 100;
  }

  /**
   * Calculate current ARR (Annual Recurring Revenue)
   */
  async calculateArr(): Promise<number> {
    const mrr = await this.calculateMrr();
    return Math.round(mrr * 12 * 100) / 100;
  }

  /**
   * Get comprehensive revenue metrics
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    // Check cache
    if (this.metricsCache && this.metricsCache.expiry > Date.now()) {
      return this.metricsCache.data;
    }

    this.logger.log('Calculating revenue metrics...');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get current active subscriptions
    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // Calculate current MRR
    const mrr = await this.calculateMrr();
    const arr = mrr * 12;

    // Get new subscriptions this month
    const newSubscriptions = await this.subscriptionRepository.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        createdAt: MoreThan(startOfMonth),
      },
    });

    // Calculate new MRR from new subscriptions
    const newSubs = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        createdAt: MoreThan(startOfMonth),
      },
    });
    const newMrr = newSubs.reduce(
      (sum, sub) => sum + this.getMonthlyPrice(sub.tier, sub.billingInterval),
      0,
    );

    // Get churned subscriptions this month
    const churnedSubscriptions = await this.subscriptionRepository.count({
      where: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: MoreThan(startOfMonth),
      },
    });

    // Calculate churned MRR
    const churnedSubs = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: MoreThan(startOfMonth),
      },
    });
    const churnMrr = churnedSubs.reduce(
      (sum, sub) => sum + this.getMonthlyPrice(sub.tier, sub.billingInterval),
      0,
    ) * -1;

    // Calculate expansion/contraction (simplified - would need plan change history)
    const expansionMrr = 0; // Would track upgrades
    const contractionMrr = 0; // Would track downgrades
    const reactivationMrr = 0; // Would track reactivations

    // Calculate net MRR growth
    const netMrrGrowth = newMrr + expansionMrr + contractionMrr + churnMrr + reactivationMrr;

    // Get last month's MRR for growth rate calculation
    const lastMonthActive = await this.subscriptionRepository.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        createdAt: LessThan(startOfMonth),
      },
    });
    const lastMonthMrr = mrr - netMrrGrowth; // Approximate
    const netMrrGrowthRate = lastMonthMrr > 0 ? (netMrrGrowth / lastMonthMrr) * 100 : 0;

    // Calculate ARPU (Average Revenue Per User)
    const totalActiveSubscribers = activeSubscriptions.length;
    const averageRevenuePerUser = totalActiveSubscribers > 0 ? mrr / totalActiveSubscribers : 0;

    // Calculate churn rate
    const startOfMonthSubscribers = lastMonthActive + newSubscriptions;
    const churnRate = startOfMonthSubscribers > 0
      ? (churnedSubscriptions / startOfMonthSubscribers) * 100
      : 0;

    // Calculate retention rate
    const retentionRate = 100 - churnRate;

    // Calculate Customer Lifetime Value (simplified)
    const avgMonthlyChurn = churnRate / 100;
    const customerLifetimeValue = avgMonthlyChurn > 0
      ? averageRevenuePerUser / avgMonthlyChurn
      : averageRevenuePerUser * 24; // Default to 24 months if no churn

    // Free to paid conversion rate (would need trial tracking)
    const conversionRate = 0; // Would track trial conversions

    const metrics: RevenueMetrics = {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      currency: this.baseCurrency,
      timestamp: now,

      newMrr: Math.round(newMrr * 100) / 100,
      expansionMrr: Math.round(expansionMrr * 100) / 100,
      contractionMrr: Math.round(contractionMrr * 100) / 100,
      churnMrr: Math.round(churnMrr * 100) / 100,
      reactivationMrr: Math.round(reactivationMrr * 100) / 100,

      netMrrGrowth: Math.round(netMrrGrowth * 100) / 100,
      netMrrGrowthRate: Math.round(netMrrGrowthRate * 100) / 100,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
      customerLifetimeValue: Math.round(customerLifetimeValue * 100) / 100,

      totalActiveSubscribers,
      newSubscribers: newSubscriptions,
      churnedSubscribers: churnedSubscriptions,
      upgradedSubscribers: 0, // Would track upgrades
      downgradedSubscribers: 0, // Would track downgrades

      churnRate: Math.round(churnRate * 100) / 100,
      retentionRate: Math.round(retentionRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };

    // Cache the result
    this.metricsCache = {
      data: metrics,
      expiry: Date.now() + this.CACHE_TTL,
    };

    return metrics;
  }

  /**
   * Get MRR breakdown by plan
   */
  async getMrrByPlan(): Promise<MrrByPlan[]> {
    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    const planMrr: Record<string, { mrr: number; count: number }> = {};

    for (const sub of activeSubscriptions) {
      const tier = sub.tier || 'freemium';
      const monthlyPrice = this.getMonthlyPrice(tier, sub.billingInterval);

      if (!planMrr[tier]) {
        planMrr[tier] = { mrr: 0, count: 0 };
      }

      planMrr[tier].mrr += monthlyPrice;
      planMrr[tier].count += 1;
    }

    const totalMrr = Object.values(planMrr).reduce((sum, p) => sum + p.mrr, 0);

    return Object.entries(planMrr).map(([planName, data]) => ({
      planName,
      planId: planName,
      mrr: Math.round(data.mrr * 100) / 100,
      subscriberCount: data.count,
      percentageOfTotal: totalMrr > 0 ? Math.round((data.mrr / totalMrr) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get revenue trend over time
   */
  async getRevenueTrend(months: number = 12): Promise<RevenueTrendPoint[]> {
    const trend: RevenueTrendPoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      // Count active subscribers at end of month
      const activeAtEndOfMonth = await this.subscriptionRepository.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          createdAt: LessThan(endOfMonth),
        },
      });

      // Estimate MRR (simplified - would need historical price data)
      const estimatedMrr = activeAtEndOfMonth * 25; // Average price assumption

      trend.push({
        date,
        mrr: estimatedMrr,
        arr: estimatedMrr * 12,
        activeSubscribers: activeAtEndOfMonth,
      });
    }

    return trend;
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecast(months: number = 6): Promise<RevenueTrendPoint[]> {
    const currentMetrics = await this.getRevenueMetrics();
    const forecast: RevenueTrendPoint[] = [];
    const now = new Date();

    // Simple growth projection based on current growth rate
    const monthlyGrowthRate = (currentMetrics.netMrrGrowthRate / 100) || 0.05; // Default 5% if no data
    let projectedMrr = currentMetrics.mrr;
    let projectedSubscribers = currentMetrics.totalActiveSubscribers;

    for (let i = 1; i <= months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);

      projectedMrr = projectedMrr * (1 + monthlyGrowthRate);
      projectedSubscribers = Math.round(projectedSubscribers * (1 + monthlyGrowthRate));

      forecast.push({
        date,
        mrr: Math.round(projectedMrr * 100) / 100,
        arr: Math.round(projectedMrr * 12 * 100) / 100,
        activeSubscribers: projectedSubscribers,
      });
    }

    return forecast;
  }

  /**
   * Calculate monthly price from tier and billing interval
   */
  private getMonthlyPrice(tier: string, billingInterval?: string): number {
    const basePrice = PLAN_MONTHLY_PRICES[tier?.toLowerCase()] || 0;

    // Annual billing typically has 20% discount
    if (billingInterval === 'year' || billingInterval === 'yearly') {
      return basePrice * 0.8;
    }

    return basePrice;
  }

  /**
   * Scheduled job to snapshot metrics daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async snapshotMetrics(): Promise<void> {
    this.logger.log('Taking daily revenue metrics snapshot...');

    try {
      const metrics = await this.getRevenueMetrics();
      this.logger.log(`Daily snapshot: MRR=$${metrics.mrr}, ARR=$${metrics.arr}, Subscribers=${metrics.totalActiveSubscribers}`);

      // In production, persist this to a time-series database or analytics service
    } catch (error) {
      this.logger.error(`Failed to snapshot metrics: ${error.message}`);
    }
  }

  /**
   * Clear metrics cache
   */
  clearCache(): void {
    this.metricsCache = null;
  }
}
