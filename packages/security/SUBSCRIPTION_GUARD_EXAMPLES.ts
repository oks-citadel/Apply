/**
 * Subscription Guard - Example Usage
 *
 * This file demonstrates how to use the Subscription Guard in various scenarios.
 * Copy these examples into your NestJS services/controllers as needed.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Injectable,
  Module,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  SubscriptionGuard,
  SubscriptionLimitsService,
  RequiresTier,
  RequiresFeature,
  CheckUsageLimit,
  SubscriptionTier,
  FeatureType,
  UsageLimitType,
} from '@applyforus/security';

// ============================================================================
// EXAMPLE 1: Global Guard Setup
// ============================================================================

@Module({
  providers: [
    // Register guard globally
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    // Register limits service for programmatic access
    SubscriptionLimitsService,
  ],
})
export class AppModule {}

// ============================================================================
// EXAMPLE 2: Basic Tier-Based Protection
// ============================================================================

@Controller('analytics')
export class AnalyticsController {
  /**
   * Public endpoint - no subscription required
   */
  @Get('basic')
  async getBasicAnalytics() {
    return {
      totalApplications: 42,
      successRate: 0.15,
    };
  }

  /**
   * Requires PROFESSIONAL tier or higher
   */
  @Get('advanced')
  @RequiresTier(SubscriptionTier.PROFESSIONAL)
  async getAdvancedAnalytics() {
    return {
      detailedBreakdown: {
        byIndustry: {},
        byLocation: {},
        timeToResponse: {},
      },
      competitorAnalysis: {},
      recommendations: [],
    };
  }

  /**
   * Requires EXECUTIVE_ELITE tier
   */
  @Get('executive')
  @RequiresTier(SubscriptionTier.EXECUTIVE_ELITE)
  async getExecutiveInsights() {
    return {
      marketTrends: {},
      salaryBenchmarks: {},
      networkingOpportunities: [],
    };
  }
}

// ============================================================================
// EXAMPLE 3: Feature-Based Protection
// ============================================================================

@Controller('features')
export class FeaturesController {
  /**
   * Auto-apply feature - requires BASIC tier or higher
   */
  @Post('auto-apply/enable')
  @RequiresFeature(FeatureType.AUTO_APPLY_ENABLED)
  async enableAutoApply(@Body() settings: any) {
    return { message: 'Auto-apply enabled', settings };
  }

  /**
   * Salary insights - requires BASIC tier or higher
   */
  @Get('salary-insights/:jobId')
  @RequiresFeature(FeatureType.SALARY_INSIGHTS)
  async getSalaryInsights(@Param('jobId') jobId: string) {
    return {
      averageSalary: 85000,
      salaryRange: { min: 70000, max: 110000 },
      marketPercentile: 65,
    };
  }

  /**
   * API access - requires ADVANCED_CAREER tier or higher
   */
  @Get('api-token')
  @RequiresFeature(FeatureType.API_ACCESS)
  async generateApiToken() {
    return {
      apiToken: 'sk_live_...',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Dedicated account manager - requires EXECUTIVE_ELITE tier
   */
  @Get('account-manager')
  @RequiresFeature(FeatureType.DEDICATED_ACCOUNT_MANAGER)
  async getAccountManager() {
    return {
      name: 'John Doe',
      email: 'john.doe@applyforus.com',
      phone: '+1-555-0123',
      calendlyUrl: 'https://calendly.com/john-doe',
    };
  }
}

// ============================================================================
// EXAMPLE 4: Usage Limit Protection
// ============================================================================

@Controller('applications')
export class ApplicationsController {
  /**
   * Submit job application with usage limit check
   */
  @Post()
  @CheckUsageLimit(UsageLimitType.JOB_APPLICATIONS)
  async submitApplication(@Body() applicationDto: any) {
    // Guard checks if user has remaining applications
    // Your service should increment the usage counter after successful submission
    return {
      id: 'app_123',
      status: 'submitted',
      message: 'Application submitted successfully',
    };
  }

  /**
   * Save job for later with usage limit check
   */
  @Post('saved-jobs')
  @CheckUsageLimit(UsageLimitType.SAVED_JOBS)
  async saveJob(@Body() saveJobDto: any) {
    return {
      id: 'saved_123',
      message: 'Job saved successfully',
    };
  }

  /**
   * Generate AI cover letter with usage limit check
   */
  @Post('cover-letter/generate')
  @CheckUsageLimit(UsageLimitType.AI_COVER_LETTERS)
  async generateCoverLetter(@Body() generateDto: any) {
    return {
      coverLetter: 'Dear Hiring Manager...',
      generatedAt: new Date(),
    };
  }
}

// ============================================================================
// EXAMPLE 5: Combining Multiple Decorators
// ============================================================================

@Controller('premium')
export class PremiumController {
  /**
   * Comprehensive protection:
   * - Must have PROFESSIONAL tier or higher
   * - Must have advanced analytics feature enabled
   * - Must not exceed usage limit
   */
  @Post('ai-analysis')
  @RequiresTier(SubscriptionTier.PROFESSIONAL)
  @RequiresFeature(FeatureType.ADVANCED_ANALYTICS)
  @CheckUsageLimit(UsageLimitType.AI_COVER_LETTERS)
  async runAiAnalysis(@Body() analysisDto: any) {
    return {
      analysisId: 'analysis_123',
      insights: [],
      recommendations: [],
    };
  }

  /**
   * Multiple feature requirements
   */
  @Get('company-insights/:companyId')
  @RequiresTier(SubscriptionTier.PROFESSIONAL)
  @RequiresFeature(FeatureType.COMPANY_INSIGHTS)
  async getCompanyInsights(@Param('companyId') companyId: string) {
    return {
      companyId,
      culture: {},
      employeeSatisfaction: 4.2,
      growthTrends: {},
    };
  }
}

// ============================================================================
// EXAMPLE 6: Using SubscriptionLimitsService Programmatically
// ============================================================================

@Injectable()
export class SubscriptionService {
  constructor(private subscriptionLimits: SubscriptionLimitsService) {}

  /**
   * Get user's subscription information and limits
   */
  async getUserSubscriptionInfo(userId: string, tier: SubscriptionTier, currentUsage: any) {
    // Get all limits for the tier
    const limits = this.subscriptionLimits.getLimits(tier);

    // Check specific features
    const features = {
      hasAdvancedAnalytics: this.subscriptionLimits.hasFeature(
        tier,
        FeatureType.ADVANCED_ANALYTICS
      ),
      hasAutoApply: this.subscriptionLimits.hasFeature(tier, FeatureType.AUTO_APPLY_ENABLED),
      hasApiAccess: this.subscriptionLimits.hasFeature(tier, FeatureType.API_ACCESS),
    };

    // Calculate remaining usage
    const remaining = {
      jobApplications: this.subscriptionLimits.getRemainingUsage(
        tier,
        UsageLimitType.JOB_APPLICATIONS,
        currentUsage.jobApplications || 0
      ),
      aiCoverLetters: this.subscriptionLimits.getRemainingUsage(
        tier,
        UsageLimitType.AI_COVER_LETTERS,
        currentUsage.aiCoverLetters || 0
      ),
    };

    // Check if actions are allowed
    const canPerform = {
      canApply: this.subscriptionLimits.canPerformAction(
        tier,
        UsageLimitType.JOB_APPLICATIONS,
        currentUsage.jobApplications || 0
      ),
      canGenerateCoverLetter: this.subscriptionLimits.canPerformAction(
        tier,
        UsageLimitType.AI_COVER_LETTERS,
        currentUsage.aiCoverLetters || 0
      ),
    };

    return {
      tier,
      limits,
      features,
      remaining,
      canPerform,
    };
  }

  /**
   * Check if user can perform an action before attempting it
   */
  async canUserPerformAction(
    tier: SubscriptionTier,
    action: UsageLimitType,
    currentUsage: number
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const allowed = this.subscriptionLimits.canPerformAction(tier, action, currentUsage);
    const remaining = this.subscriptionLimits.getRemainingUsage(tier, action, currentUsage);
    const limits = this.subscriptionLimits.getLimits(tier);

    let limit = 0;
    switch (action) {
      case UsageLimitType.JOB_APPLICATIONS:
        limit = limits.jobApplicationsPerMonth;
        break;
      case UsageLimitType.AI_COVER_LETTERS:
        limit = limits.aiGeneratedCoverLetters;
        break;
      // Add other cases as needed
    }

    return { allowed, remaining, limit };
  }
}

// ============================================================================
// EXAMPLE 7: Usage Tracking Service
// ============================================================================

@Injectable()
export class UsageTrackingService {
  /**
   * Increment usage after successful action
   * Call this AFTER the guard has verified the limit
   */
  async incrementUsage(userId: string, limitType: UsageLimitType): Promise<void> {
    // Implementation depends on your database
    // Example pseudo-code:
    /*
    const currentPeriod = this.getCurrentPeriod();
    await this.db.query(`
      INSERT INTO usage_records (user_id, period, ${limitType}, updated_at)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (user_id, period)
      DO UPDATE SET ${limitType} = usage_records.${limitType} + 1, updated_at = NOW()
    `, [userId, currentPeriod]);
    */
  }

  /**
   * Get current usage for a user in the current period
   */
  async getCurrentUsage(userId: string): Promise<any> {
    // Implementation depends on your database
    // Example pseudo-code:
    /*
    const currentPeriod = this.getCurrentPeriod();
    const result = await this.db.query(`
      SELECT * FROM usage_records
      WHERE user_id = $1 AND period = $2
    `, [userId, currentPeriod]);

    return result.rows[0] || {
      jobApplications: 0,
      aiCoverLetters: 0,
      resumeTemplates: 0,
      savedJobs: 0,
    };
    */
    return {};
  }

  /**
   * Reset usage at the start of each period (run monthly via cron)
   */
  async resetMonthlyUsage(): Promise<void> {
    // Implementation depends on your database
    // Example pseudo-code:
    /*
    const previousPeriod = this.getPreviousPeriod();
    await this.db.query(`
      DELETE FROM usage_records
      WHERE period < $1
    `, [previousPeriod]);
    */
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getPreviousPeriod(): string {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  }
}

// ============================================================================
// EXAMPLE 8: Complete Application Flow
// ============================================================================

@Controller('jobs')
export class JobsController {
  constructor(
    private usageTracking: UsageTrackingService,
    private subscriptionService: SubscriptionService
  ) {}

  /**
   * Complete flow: Check limits, submit application, track usage
   */
  @Post(':jobId/apply')
  @CheckUsageLimit(UsageLimitType.JOB_APPLICATIONS)
  async applyToJob(@Param('jobId') jobId: string, @Body() applicationDto: any) {
    // Guard has already verified the user hasn't exceeded their limit

    // Process the application
    const application = await this.processApplication(jobId, applicationDto);

    // Increment usage counter AFTER successful submission
    await this.usageTracking.incrementUsage(
      applicationDto.userId,
      UsageLimitType.JOB_APPLICATIONS
    );

    return {
      success: true,
      application,
    };
  }

  /**
   * Get user's application capacity
   */
  @Get('application-capacity')
  async getApplicationCapacity(@Body() dto: { userId: string; tier: SubscriptionTier }) {
    const usage = await this.usageTracking.getCurrentUsage(dto.userId);

    const capacity = await this.subscriptionService.canUserPerformAction(
      dto.tier,
      UsageLimitType.JOB_APPLICATIONS,
      usage.jobApplications || 0
    );

    return {
      allowed: capacity.allowed,
      remaining: capacity.remaining,
      limit: capacity.limit,
      used: usage.jobApplications || 0,
    };
  }

  private async processApplication(jobId: string, applicationDto: any): Promise<any> {
    // Your application processing logic
    return { id: 'app_123', jobId, status: 'submitted' };
  }
}

// ============================================================================
// EXAMPLE 9: Middleware to Populate User Usage
// ============================================================================

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PopulateUsageMiddleware implements NestMiddleware {
  constructor(private usageTracking: UsageTrackingService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user && req.user.id) {
      // Populate usage data for the subscription guard
      const usage = await this.usageTracking.getCurrentUsage(req.user.id);
      req.user.usage = usage;
    }
    next();
  }
}

// Register middleware in your module
@Module({
  // ... other configurations
})
export class AppModule {
  configure(consumer: any) {
    consumer.apply(PopulateUsageMiddleware).forRoutes('*');
  }
}

// ============================================================================
// EXAMPLE 10: Frontend Integration (TypeScript/React)
// ============================================================================

/*
// API Client
import axios from 'axios';

interface SubscriptionError {
  statusCode: number;
  message: string;
  error: string;
  requiredTier?: string;
  currentTier?: string;
  limitType?: string;
  currentUsage?: number;
  limit?: number;
  upgradeUrl?: string;
}

async function submitJobApplication(jobId: string, data: any) {
  try {
    const response = await axios.post(`/api/jobs/${jobId}/apply`, data);
    return { success: true, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as SubscriptionError;

      if (error.response.status === 403) {
        // Insufficient tier or missing feature
        showUpgradeModal({
          title: 'Upgrade Required',
          message: errorData.message,
          currentTier: errorData.currentTier,
          requiredTier: errorData.requiredTier,
          upgradeUrl: errorData.upgradeUrl,
        });
      } else if (error.response.status === 429) {
        // Usage limit exceeded
        showLimitExceededModal({
          title: 'Monthly Limit Reached',
          message: errorData.message,
          used: errorData.currentUsage,
          limit: errorData.limit,
          upgradeUrl: errorData.upgradeUrl,
        });
      }
    }

    return { success: false, error };
  }
}

// React Component Example
import React, { useState, useEffect } from 'react';

function ApplicationButton({ jobId, userTier }) {
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    // Check user's application capacity
    axios.get('/api/jobs/application-capacity')
      .then(res => setCapacity(res.data));
  }, []);

  const handleApply = async () => {
    const result = await submitJobApplication(jobId, {
      // application data
    });

    if (result.success) {
      // Refresh capacity
      const res = await axios.get('/api/jobs/application-capacity');
      setCapacity(res.data);
    }
  };

  if (!capacity) return <div>Loading...</div>;

  return (
    <div>
      <button
        onClick={handleApply}
        disabled={!capacity.allowed}
      >
        {capacity.allowed ? 'Apply Now' : 'Upgrade to Apply'}
      </button>
      <p>
        Applications remaining: {capacity.remaining === -1 ? '∞' : capacity.remaining}
      </p>
    </div>
  );
}
*/
