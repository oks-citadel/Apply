import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

// SLA Tier definitions
export enum SLATier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export interface SLAGuarantee {
  tier: SLATier;
  interviewsGuaranteed: number;
  daysToAchieve: number;
  applicationsPerDay: number;
  applicationsPerWeek: number;
  creditPercentageIfUnmet: number;
  features: string[];
}

export const SLA_GUARANTEES: Record<SLATier, SLAGuarantee> = {
  [SLATier.FREE]: {
    tier: SLATier.FREE,
    interviewsGuaranteed: 0,
    daysToAchieve: 0,
    applicationsPerDay: 5,
    applicationsPerWeek: 20,
    creditPercentageIfUnmet: 0,
    features: ['Manual Apply', 'Job Search', 'Basic Filters'],
  },
  [SLATier.STARTER]: {
    tier: SLATier.STARTER,
    interviewsGuaranteed: 1,
    daysToAchieve: 30,
    applicationsPerDay: 15,
    applicationsPerWeek: 75,
    creditPercentageIfUnmet: 50,
    features: ['Auto-Apply (API Jobs)', 'Resume Tailoring', 'Application Tracking'],
  },
  [SLATier.BASIC]: {
    tier: SLATier.BASIC,
    interviewsGuaranteed: 3,
    daysToAchieve: 30,
    applicationsPerDay: 30,
    applicationsPerWeek: 150,
    creditPercentageIfUnmet: 75,
    features: ['Auto-Apply (All Jobs)', 'Cover Letter AI', 'Interview Prep'],
  },
  [SLATier.PRO]: {
    tier: SLATier.PRO,
    interviewsGuaranteed: 5,
    daysToAchieve: 30,
    applicationsPerDay: 50,
    applicationsPerWeek: 300,
    creditPercentageIfUnmet: 100,
    features: ['Priority Processing', 'Dedicated Support', 'Advanced Analytics'],
  },
  [SLATier.BUSINESS]: {
    tier: SLATier.BUSINESS,
    interviewsGuaranteed: 10,
    daysToAchieve: 30,
    applicationsPerDay: 100,
    applicationsPerWeek: 500,
    creditPercentageIfUnmet: 100,
    features: ['Multi-Profile Support', 'API Access', 'Custom Integrations'],
  },
  [SLATier.ENTERPRISE]: {
    tier: SLATier.ENTERPRISE,
    interviewsGuaranteed: 20,
    daysToAchieve: 30,
    applicationsPerDay: 200,
    applicationsPerWeek: 1000,
    creditPercentageIfUnmet: 100,
    features: ['White-Label', 'Dedicated Account Manager', 'Custom SLA'],
  },
};

// Interview verification status
export enum InterviewStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// SLA period status
export enum SLAPeriodStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED_SUCCESS = 'COMPLETED_SUCCESS',
  COMPLETED_FAILED = 'COMPLETED_FAILED',
  CREDIT_ISSUED = 'CREDIT_ISSUED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  DISQUALIFIED = 'DISQUALIFIED',
}

// Disqualification reasons
export enum DisqualificationReason {
  AUTO_APPLY_DISABLED_TOO_LONG = 'AUTO_APPLY_DISABLED_TOO_LONG',
  MISSING_REQUIRED_DOCUMENTS = 'MISSING_REQUIRED_DOCUMENTS',
  INCOMPLETE_PROFILE = 'INCOMPLETE_PROFILE',
  TERMS_VIOLATION = 'TERMS_VIOLATION',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  USER_REQUESTED = 'USER_REQUESTED',
}

export interface SLAPeriod {
  id: string;
  userId: string;
  tier: SLATier;
  startDate: Date;
  endDate: Date;
  interviewsRequired: number;
  interviewsVerified: number;
  status: SLAPeriodStatus;
  disqualificationReason?: DisqualificationReason;
  creditAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewVerification {
  id: string;
  userId: string;
  slaPeriodId: string;
  jobId: string;
  companyName: string;
  interviewDate: Date;
  verificationType: 'EMAIL' | 'CALENDAR' | 'RECRUITER_CONFIRMATION' | 'MANUAL';
  verificationEvidence: string; // encrypted/hashed evidence reference
  status: InterviewStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SLAProgress {
  userId: string;
  currentTier: SLATier;
  currentPeriod: SLAPeriod;
  interviewsVerified: number;
  interviewsRequired: number;
  daysRemaining: number;
  progressPercentage: number;
  isOnTrack: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
  applicationsToday: number;
  applicationsThisWeek: number;
  dailyLimit: number;
  weeklyLimit: number;
}

@Injectable()
export class SLAService {
  private readonly logger = new Logger(SLAService.name);

  // In production, these would be actual repositories
  private slaPeriods: Map<string, SLAPeriod> = new Map();
  private interviewVerifications: Map<string, InterviewVerification[]> = new Map();
  private applicationCounts: Map<string, { daily: number; weekly: number; lastReset: Date }> = new Map();

  constructor() {
    this.logger.log('SLA Service initialized');
  }

  /**
   * Get SLA guarantee details for a tier
   */
  getSLAGuarantee(tier: SLATier): SLAGuarantee {
    return SLA_GUARANTEES[tier];
  }

  /**
   * Get all SLA tiers
   */
  getAllTiers(): SLAGuarantee[] {
    return Object.values(SLA_GUARANTEES);
  }

  /**
   * Start a new SLA period for a user
   */
  async startSLAPeriod(userId: string, tier: SLATier): Promise<SLAPeriod> {
    const guarantee = SLA_GUARANTEES[tier];
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + guarantee.daysToAchieve);

    const period: SLAPeriod = {
      id: `sla-${Date.now()}-${userId}`,
      userId,
      tier,
      startDate: now,
      endDate,
      interviewsRequired: guarantee.interviewsGuaranteed,
      interviewsVerified: 0,
      status: SLAPeriodStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    this.slaPeriods.set(period.id, period);
    this.logger.log(`Started SLA period for user ${userId}, tier ${tier}`);

    return period;
  }

  /**
   * Get current SLA progress for a user
   */
  async getSLAProgress(userId: string): Promise<SLAProgress | null> {
    // Find active SLA period
    const activePeriod = Array.from(this.slaPeriods.values()).find(
      (p) => p.userId === userId && p.status === SLAPeriodStatus.ACTIVE,
    );

    if (!activePeriod) {
      return null;
    }

    const guarantee = SLA_GUARANTEES[activePeriod.tier];
    const now = new Date();
    const daysRemaining = Math.ceil((activePeriod.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = guarantee.daysToAchieve;
    const daysElapsed = totalDays - daysRemaining;

    // Calculate expected progress
    const expectedInterviews = Math.floor((activePeriod.interviewsRequired * daysElapsed) / totalDays);
    const progressPercentage = (activePeriod.interviewsVerified / activePeriod.interviewsRequired) * 100;
    const isOnTrack = activePeriod.interviewsVerified >= expectedInterviews;

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const deficit = expectedInterviews - activePeriod.interviewsVerified;

    if (deficit >= 3 && daysRemaining < 7) {
      riskLevel = 'CRITICAL';
    } else if (deficit >= 2 && daysRemaining < 14) {
      riskLevel = 'HIGH';
    } else if (deficit >= 1) {
      riskLevel = 'MEDIUM';
    }

    // Get application counts
    const counts = this.applicationCounts.get(userId) || { daily: 0, weekly: 0, lastReset: new Date() };

    // Generate recommended actions
    const recommendedActions = this.generateRecommendations(
      activePeriod,
      isOnTrack,
      riskLevel,
      counts,
      guarantee,
    );

    return {
      userId,
      currentTier: activePeriod.tier,
      currentPeriod: activePeriod,
      interviewsVerified: activePeriod.interviewsVerified,
      interviewsRequired: activePeriod.interviewsRequired,
      daysRemaining,
      progressPercentage,
      isOnTrack,
      riskLevel,
      recommendedActions,
      applicationsToday: counts.daily,
      applicationsThisWeek: counts.weekly,
      dailyLimit: guarantee.applicationsPerDay,
      weeklyLimit: guarantee.applicationsPerWeek,
    };
  }

  /**
   * Submit interview for verification
   */
  async submitInterviewVerification(
    userId: string,
    data: {
      jobId: string;
      companyName: string;
      interviewDate: Date;
      verificationType: 'EMAIL' | 'CALENDAR' | 'RECRUITER_CONFIRMATION' | 'MANUAL';
      evidence: string;
    },
  ): Promise<InterviewVerification> {
    // Find active SLA period
    const activePeriod = Array.from(this.slaPeriods.values()).find(
      (p) => p.userId === userId && p.status === SLAPeriodStatus.ACTIVE,
    );

    if (!activePeriod) {
      throw new Error('No active SLA period found');
    }

    const verification: InterviewVerification = {
      id: `iv-${Date.now()}-${userId}`,
      userId,
      slaPeriodId: activePeriod.id,
      jobId: data.jobId,
      companyName: data.companyName,
      interviewDate: data.interviewDate,
      verificationType: data.verificationType,
      verificationEvidence: this.hashEvidence(data.evidence),
      status: InterviewStatus.PENDING_VERIFICATION,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userVerifications = this.interviewVerifications.get(userId) || [];
    userVerifications.push(verification);
    this.interviewVerifications.set(userId, userVerifications);

    this.logger.log(`Interview verification submitted for user ${userId}, job ${data.jobId}`);

    // Auto-verify if possible (email or calendar integration)
    if (data.verificationType === 'EMAIL' || data.verificationType === 'CALENDAR') {
      await this.attemptAutoVerification(verification);
    }

    return verification;
  }

  /**
   * Verify an interview submission (admin action)
   */
  async verifyInterview(
    verificationId: string,
    approved: boolean,
    verifiedBy: string,
    notes?: string,
  ): Promise<InterviewVerification> {
    // Find the verification
    for (const [userId, verifications] of this.interviewVerifications) {
      const verification = verifications.find((v) => v.id === verificationId);
      if (verification) {
        verification.status = approved ? InterviewStatus.VERIFIED : InterviewStatus.REJECTED;
        verification.verifiedAt = new Date();
        verification.verifiedBy = verifiedBy;
        verification.notes = notes;
        verification.updatedAt = new Date();

        // Update SLA period if verified
        if (approved) {
          const period = this.slaPeriods.get(verification.slaPeriodId);
          if (period) {
            period.interviewsVerified++;
            period.updatedAt = new Date();

            // Check if SLA is now met
            if (period.interviewsVerified >= period.interviewsRequired) {
              period.status = SLAPeriodStatus.COMPLETED_SUCCESS;
              this.logger.log(`SLA period ${period.id} completed successfully!`);
            }
          }
        }

        return verification;
      }
    }

    throw new Error('Verification not found');
  }

  /**
   * Check application limits for a user
   */
  async checkApplicationLimits(userId: string, tier: SLATier): Promise<{
    canApply: boolean;
    dailyRemaining: number;
    weeklyRemaining: number;
    reason?: string;
  }> {
    const guarantee = SLA_GUARANTEES[tier];
    let counts = this.applicationCounts.get(userId);

    // Reset counters if needed
    const now = new Date();
    if (!counts || this.shouldResetDaily(counts.lastReset)) {
      counts = { daily: 0, weekly: counts?.weekly || 0, lastReset: now };
    }
    if (this.shouldResetWeekly(counts.lastReset)) {
      counts.weekly = 0;
    }

    this.applicationCounts.set(userId, counts);

    const dailyRemaining = guarantee.applicationsPerDay - counts.daily;
    const weeklyRemaining = guarantee.applicationsPerWeek - counts.weekly;

    if (counts.daily >= guarantee.applicationsPerDay) {
      return {
        canApply: false,
        dailyRemaining: 0,
        weeklyRemaining,
        reason: 'Daily application limit reached',
      };
    }

    if (counts.weekly >= guarantee.applicationsPerWeek) {
      return {
        canApply: false,
        dailyRemaining,
        weeklyRemaining: 0,
        reason: 'Weekly application limit reached',
      };
    }

    return {
      canApply: true,
      dailyRemaining,
      weeklyRemaining,
    };
  }

  /**
   * Increment application count for a user
   */
  async incrementApplicationCount(userId: string): Promise<void> {
    const counts = this.applicationCounts.get(userId) || { daily: 0, weekly: 0, lastReset: new Date() };
    counts.daily++;
    counts.weekly++;
    this.applicationCounts.set(userId, counts);
  }

  /**
   * Disqualify a user from SLA guarantee
   */
  async disqualifyFromSLA(
    userId: string,
    reason: DisqualificationReason,
  ): Promise<void> {
    const activePeriod = Array.from(this.slaPeriods.values()).find(
      (p) => p.userId === userId && p.status === SLAPeriodStatus.ACTIVE,
    );

    if (activePeriod) {
      activePeriod.status = SLAPeriodStatus.DISQUALIFIED;
      activePeriod.disqualificationReason = reason;
      activePeriod.updatedAt = new Date();

      this.logger.warn(`User ${userId} disqualified from SLA: ${reason}`);
    }
  }

  /**
   * Process SLA credit/refund for failed periods
   */
  async processSLACredit(slaPeriodId: string): Promise<{
    creditAmount: number;
    action: 'CREDIT' | 'REFUND';
  }> {
    const period = this.slaPeriods.get(slaPeriodId);
    if (!period) {
      throw new Error('SLA period not found');
    }

    if (period.status !== SLAPeriodStatus.COMPLETED_FAILED) {
      throw new Error('SLA period is not in failed state');
    }

    const guarantee = SLA_GUARANTEES[period.tier];

    // Calculate credit amount based on guarantee percentage
    // In production, this would fetch actual subscription cost
    const subscriptionCost = this.getSubscriptionCost(period.tier);
    const creditAmount = (subscriptionCost * guarantee.creditPercentageIfUnmet) / 100;

    period.creditAmount = creditAmount;
    period.status = SLAPeriodStatus.CREDIT_ISSUED;
    period.updatedAt = new Date();

    this.logger.log(`Issued credit of ${creditAmount} for SLA period ${slaPeriodId}`);

    return {
      creditAmount,
      action: 'CREDIT',
    };
  }

  /**
   * Check and update SLA periods (scheduled job)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkSLAPeriods(): Promise<void> {
    const now = new Date();

    for (const [periodId, period] of this.slaPeriods) {
      if (period.status !== SLAPeriodStatus.ACTIVE) continue;

      // Check if period has ended
      if (now > period.endDate) {
        if (period.interviewsVerified >= period.interviewsRequired) {
          period.status = SLAPeriodStatus.COMPLETED_SUCCESS;
          this.logger.log(`SLA period ${periodId} completed successfully`);
        } else {
          period.status = SLAPeriodStatus.COMPLETED_FAILED;
          this.logger.log(`SLA period ${periodId} failed - processing credit`);
          await this.processSLACredit(periodId);
        }
        period.updatedAt = now;
      }
    }
  }

  /**
   * Increase apply volume for at-risk users
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async adjustApplyVolumeForAtRiskUsers(): Promise<void> {
    for (const [periodId, period] of this.slaPeriods) {
      if (period.status !== SLAPeriodStatus.ACTIVE) continue;

      const progress = await this.getSLAProgress(period.userId);
      if (!progress) continue;

      if (progress.riskLevel === 'HIGH' || progress.riskLevel === 'CRITICAL') {
        // In production, this would trigger increased apply volume
        this.logger.log(
          `Increasing apply volume for at-risk user ${period.userId} (risk: ${progress.riskLevel})`,
        );

        // Notify user about risk status
        // await this.notificationService.sendSLARiskAlert(period.userId, progress);
      }
    }
  }

  // Private helper methods
  private generateRecommendations(
    period: SLAPeriod,
    isOnTrack: boolean,
    riskLevel: string,
    counts: { daily: number; weekly: number },
    guarantee: SLAGuarantee,
  ): string[] {
    const recommendations: string[] = [];

    if (!isOnTrack) {
      recommendations.push('Enable auto-apply to increase application volume');
    }

    if (counts.daily < guarantee.applicationsPerDay * 0.5) {
      recommendations.push('You have unused daily applications - consider expanding your job criteria');
    }

    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      recommendations.push('Consider broadening your location or remote preferences');
      recommendations.push('Review and optimize your resume for better matches');
    }

    if (period.interviewsVerified === 0) {
      recommendations.push('Submit any interview invitations you\'ve received for verification');
    }

    return recommendations;
  }

  private hashEvidence(evidence: string): string {
    // In production, use proper encryption/hashing
    return Buffer.from(evidence).toString('base64');
  }

  private async attemptAutoVerification(verification: InterviewVerification): Promise<void> {
    // In production, this would integrate with email/calendar APIs
    // For now, mark as pending
    this.logger.log(`Auto-verification attempted for ${verification.id}`);
  }

  private shouldResetDaily(lastReset: Date): boolean {
    const now = new Date();
    return now.toDateString() !== lastReset.toDateString();
  }

  private shouldResetWeekly(lastReset: Date): boolean {
    const now = new Date();
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceReset >= 7;
  }

  private getSubscriptionCost(tier: SLATier): number {
    const costs: Record<SLATier, number> = {
      [SLATier.FREE]: 0,
      [SLATier.STARTER]: 29,
      [SLATier.BASIC]: 79,
      [SLATier.PRO]: 149,
      [SLATier.BUSINESS]: 299,
      [SLATier.ENTERPRISE]: 999,
    };
    return costs[tier];
  }
}
