import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import {
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  format,
  differenceInDays,
  differenceInMinutes,
  parseISO,
} from 'date-fns';
import { UserActivity, UserActivityType } from './entities/user-activity.entity';
import { UserSession } from './entities/user-session.entity';
import {
  UserSegment,
  UserCohort,
  UserJourneyStage,
  SegmentType,
} from './entities/user-segment.entity';
import {
  TrackActivityDto,
  BatchTrackActivityDto,
  QueryUserAnalyticsDto,
  EngagementMetricsQueryDto,
  UserJourneyQueryDto,
  RetentionQueryDto,
  FeatureUsageQueryDto,
  UserSegmentQueryDto,
} from './dto';
import {
  TrackActivityResponseDto,
  BatchTrackActivityResponseDto,
  EngagementMetricsResponseDto,
  UserJourneyResponseDto,
  RetentionMetricsResponseDto,
  FeatureUsageResponseDto,
  UserSegmentsResponseDto,
  PaginatedUserActivityDto,
  UserActivityItemDto,
  FunnelStageDto,
  CohortRetentionDto,
  FeatureUsageItemDto,
  SegmentSummaryDto,
  DailyActiveUsersDto,
} from './dto';

/**
 * User Analytics Service
 * Provides comprehensive user analytics including activity tracking,
 * engagement metrics, user journey analysis, retention metrics, and segmentation
 */
@Injectable()
export class UserAnalyticsService {
  private readonly logger = new Logger(UserAnalyticsService.name);

  // Define journey stages in order
  private readonly journeyStages = [
    'signup',
    'profile_complete',
    'first_search',
    'first_application',
    'first_interview',
    'hired',
  ];

  // Map activity types to features for feature usage analysis
  private readonly featureMapping: Record<string, UserActivityType[]> = {
    job_search: [UserActivityType.JOB_SEARCH, UserActivityType.JOB_FILTER],
    job_browsing: [UserActivityType.JOB_VIEW, UserActivityType.JOB_SAVE],
    applications: [
      UserActivityType.APPLICATION_START,
      UserActivityType.APPLICATION_SUBMIT,
      UserActivityType.APPLICATION_VIEW,
    ],
    resume_tools: [UserActivityType.RESUME_UPLOAD, UserActivityType.RESUME_UPDATE, UserActivityType.RESUME_GENERATE],
    cover_letter: [UserActivityType.COVER_LETTER_GENERATE],
    ai_features: [
      UserActivityType.AI_SUGGESTION_VIEW,
      UserActivityType.AI_SUGGESTION_ACCEPT,
      UserActivityType.AI_SUGGESTION_REJECT,
    ],
    notifications: [
      UserActivityType.NOTIFICATION_VIEW,
      UserActivityType.NOTIFICATION_CLICK,
      UserActivityType.EMAIL_OPEN,
    ],
    settings: [UserActivityType.SETTINGS_VIEW, UserActivityType.SETTINGS_UPDATE],
    subscription: [
      UserActivityType.SUBSCRIPTION_VIEW,
      UserActivityType.SUBSCRIPTION_UPGRADE,
      UserActivityType.SUBSCRIPTION_DOWNGRADE,
    ],
    data_management: [UserActivityType.DATA_EXPORT, UserActivityType.DATA_IMPORT],
  };

  constructor(
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(UserSegment)
    private readonly segmentRepository: Repository<UserSegment>,
    @InjectRepository(UserCohort)
    private readonly cohortRepository: Repository<UserCohort>,
    @InjectRepository(UserJourneyStage)
    private readonly journeyStageRepository: Repository<UserJourneyStage>,
  ) {}

  /**
   * Track a single user activity
   */
  async trackUserActivity(
    dto: TrackActivityDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<TrackActivityResponseDto> {
    try {
      const now = new Date();
      const deviceInfo = this.parseUserAgent(userAgent);

      const activity = this.activityRepository.create({
        userId: dto.userId,
        activityType: dto.activityType,
        sessionId: dto.sessionId,
        metadata: dto.metadata,
        path: dto.path,
        referrer: dto.referrer,
        duration: dto.duration,
        isSuccessful: dto.isSuccessful ?? true,
        errorMessage: dto.errorMessage,
        userAgent,
        ipAddress,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        activityDate: startOfDay(now),
        activityHour: now.getHours(),
      });

      const saved = await this.activityRepository.save(activity);

      // Update session if sessionId provided
      if (dto.sessionId) {
        await this.updateSessionActivity(dto.sessionId, dto.userId, dto.activityType, dto.path);
      }

      // Check for journey stage progression
      await this.checkJourneyProgression(dto.userId, dto.activityType);

      // Update user segments based on activity
      await this.updateUserSegments(dto.userId);

      this.logger.log(`Activity tracked: ${dto.activityType} for user ${dto.userId}`);

      return {
        id: saved.id,
        activityType: saved.activityType,
        timestamp: saved.timestamp.toISOString(),
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to track activity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Track multiple activities in batch
   */
  async trackBatchActivities(
    dto: BatchTrackActivityDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<BatchTrackActivityResponseDto> {
    let tracked = 0;
    const errors: string[] = [];

    for (const activity of dto.activities) {
      try {
        await this.trackUserActivity(activity, userAgent, ipAddress);
        tracked++;
      } catch (error) {
        errors.push(`Failed to track ${activity.activityType}: ${error.message}`);
      }
    }

    return {
      tracked,
      failed: dto.activities.length - tracked,
      errors,
    };
  }

  /**
   * Get user engagement metrics (DAU, MAU, session duration, etc.)
   */
  async getUserEngagementMetrics(query: EngagementMetricsQueryDto): Promise<EngagementMetricsResponseDto> {
    const endDate = query.endDate ? parseISO(query.endDate) : new Date();
    const startDate = query.startDate ? parseISO(query.startDate) : subDays(endDate, 30);

    try {
      // Calculate DAU (today's unique users)
      const today = startOfDay(new Date());
      const dau = await this.getUniqueUsersCount(today, endOfDay(new Date()));

      // Calculate WAU (last 7 days)
      const weekAgo = subDays(today, 7);
      const wau = await this.getUniqueUsersCount(weekAgo, endOfDay(new Date()));

      // Calculate MAU (last 30 days)
      const monthAgo = subDays(today, 30);
      const mau = await this.getUniqueUsersCount(monthAgo, endOfDay(new Date()));

      // Calculate stickiness (DAU/MAU ratio)
      const stickiness = mau > 0 ? (dau / mau) * 100 : 0;

      // Get session metrics
      const sessionMetrics = await this.getSessionMetrics(startDate, endDate);

      // Get DAU trend for the period
      const dauTrend = await this.getDauTrend(startDate, endDate);

      // Get session duration distribution
      const sessionDurationDistribution = await this.getSessionDurationDistribution(startDate, endDate);

      return {
        dau,
        wau,
        mau,
        stickiness: parseFloat(stickiness.toFixed(2)),
        avgSessionDuration: sessionMetrics.avgDuration,
        avgSessionsPerUser: sessionMetrics.avgSessionsPerUser,
        avgPageViewsPerSession: sessionMetrics.avgPageViews,
        bounceRate: sessionMetrics.bounceRate,
        dauTrend,
        sessionDurationDistribution,
      };
    } catch (error) {
      this.logger.error(`Failed to get engagement metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user journey funnel analysis
   */
  async getUserJourney(query: UserJourneyQueryDto): Promise<UserJourneyResponseDto> {
    try {
      const cohortStart = query.cohortStartDate ? parseISO(query.cohortStartDate) : subMonths(new Date(), 3);
      const cohortEnd = query.cohortEndDate ? parseISO(query.cohortEndDate) : new Date();

      // Get users who signed up in the cohort period
      const signupStages = await this.journeyStageRepository.find({
        where: {
          stage: 'signup',
          reachedAt: Between(cohortStart, cohortEnd),
        },
      });

      const cohortUserIds = signupStages.map((s) => s.userId);
      const totalCohortUsers = cohortUserIds.length;

      if (totalCohortUsers === 0) {
        return this.getEmptyJourneyResponse();
      }

      // Get funnel data for each stage
      const funnel: FunnelStageDto[] = [];
      let previousStageUsers = totalCohortUsers;

      for (const stage of this.journeyStages) {
        const stageData = await this.journeyStageRepository
          .createQueryBuilder('js')
          .where('js.stage = :stage', { stage })
          .andWhere('js.userId IN (:...userIds)', { userIds: cohortUserIds })
          .getMany();

        const usersAtStage = stageData.length;
        const avgDaysToReach =
          stageData.length > 0
            ? stageData.reduce((sum, s) => sum + (s.daysFromSignup || 0), 0) / stageData.length
            : 0;

        const conversionFromPrevious =
          previousStageUsers > 0 ? (usersAtStage / previousStageUsers) * 100 : 0;

        funnel.push({
          stage,
          users: usersAtStage,
          percentage: parseFloat(((usersAtStage / totalCohortUsers) * 100).toFixed(2)),
          avgDaysToReach: parseFloat(avgDaysToReach.toFixed(1)),
          conversionFromPrevious: parseFloat(conversionFromPrevious.toFixed(2)),
        });

        previousStageUsers = usersAtStage;
      }

      // Calculate stage conversions
      const stageConversions: Record<string, number> = {};
      for (let i = 0; i < funnel.length - 1; i++) {
        const fromStage = funnel[i].stage;
        const toStage = funnel[i + 1].stage;
        stageConversions[`${fromStage}_to_${toStage}`] = funnel[i + 1].conversionFromPrevious;
      }

      // Get drop-off insights
      const dropOffInsights = this.generateDropOffInsights(funnel);

      // Calculate overall metrics
      const hiredStage = funnel.find((f) => f.stage === 'hired');
      const firstAppStage = funnel.find((f) => f.stage === 'first_application');

      return {
        funnel,
        overallConversionRate: hiredStage?.percentage || 0,
        avgDaysToFirstApplication: firstAppStage?.avgDaysToReach || 0,
        avgDaysToHired: hiredStage?.avgDaysToReach || 0,
        stageConversions,
        dropOffInsights,
      };
    } catch (error) {
      this.logger.error(`Failed to get user journey: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get retention metrics with cohort analysis
   */
  async getRetentionMetrics(query: RetentionQueryDto): Promise<RetentionMetricsResponseDto> {
    try {
      const cohortEnd = query.cohortEndDate ? parseISO(query.cohortEndDate) : new Date();
      const cohortStart = query.cohortStartDate ? parseISO(query.cohortStartDate) : subMonths(cohortEnd, 3);
      const periodType = query.periodType || 'week';
      const periods = query.periods || 12;

      // Get cohorts
      const cohorts = await this.getCohortRetention(cohortStart, cohortEnd, periodType, periods);

      // Calculate day 1, 7, 30 retention
      const day1Retention = await this.calculateDayNRetention(1);
      const day7Retention = await this.calculateDayNRetention(7);
      const day30Retention = await this.calculateDayNRetention(30);

      // Calculate churn rate (users who haven't logged in for 30+ days)
      const churnRate = await this.calculateChurnRate();

      // Get retention by segment
      const retentionBySegment = await this.getRetentionBySegment();

      // Get retention trend
      const retentionTrend = this.calculateRetentionTrend(cohorts);

      return {
        day1Retention,
        day7Retention,
        day30Retention,
        churnRate,
        cohorts,
        retentionBySegment,
        retentionTrend,
      };
    } catch (error) {
      this.logger.error(`Failed to get retention metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get feature usage analytics
   */
  async getFeatureUsage(query: FeatureUsageQueryDto): Promise<FeatureUsageResponseDto> {
    try {
      const endDate = query.endDate ? parseISO(query.endDate) : new Date();
      const startDate = query.startDate ? parseISO(query.startDate) : subDays(endDate, 30);
      const limit = query.limit || 10;

      // Get total unique users in period for adoption rate calculation
      const totalUsers = await this.getUniqueUsersCount(startDate, endDate);

      // Calculate feature usage
      const features: FeatureUsageItemDto[] = [];
      const adoptionRates: Record<string, number> = {};

      for (const [featureName, activityTypes] of Object.entries(this.featureMapping)) {
        let whereClause: any = {
          activityType: In(activityTypes),
          timestamp: Between(startDate, endDate),
        };

        if (query.userId) {
          whereClause.userId = query.userId;
        }

        // Total usage count
        const totalUsage = await this.activityRepository.count({ where: whereClause });

        // Unique users
        const uniqueUsersResult = await this.activityRepository
          .createQueryBuilder('a')
          .select('COUNT(DISTINCT a.userId)', 'count')
          .where('a.activityType IN (:...types)', { types: activityTypes })
          .andWhere('a.timestamp BETWEEN :start AND :end', { start: startDate, end: endDate })
          .getRawOne();

        const uniqueUsers = parseInt(uniqueUsersResult?.count || '0');
        const adoptionRate = totalUsers > 0 ? (uniqueUsers / totalUsers) * 100 : 0;
        adoptionRates[featureName] = parseFloat(adoptionRate.toFixed(2));

        // Calculate change from previous period
        const previousStart = subDays(startDate, differenceInDays(endDate, startDate));
        const previousUsage = await this.activityRepository.count({
          where: {
            activityType: In(activityTypes),
            timestamp: Between(previousStart, startDate),
          },
        });

        const changePercent = previousUsage > 0 ? ((totalUsage - previousUsage) / previousUsage) * 100 : 0;

        features.push({
          feature: featureName,
          totalUsage,
          uniqueUsers,
          avgUsagePerUser: uniqueUsers > 0 ? parseFloat((totalUsage / uniqueUsers).toFixed(2)) : 0,
          adoptionRate: parseFloat(adoptionRate.toFixed(2)),
          changeFromLastPeriod: parseFloat(changePercent.toFixed(2)),
        });
      }

      // Sort by total usage
      features.sort((a, b) => b.totalUsage - a.totalUsage);

      // Get top and underutilized features
      const topFeatures = features.slice(0, limit).map((f) => f.feature);
      const underutilizedFeatures = features
        .filter((f) => f.adoptionRate < 20)
        .slice(0, 5)
        .map((f) => f.feature);

      // Get usage by segment
      const usageBySegment = await this.getFeatureUsageBySegment(startDate, endDate);

      return {
        features: features.slice(0, limit),
        adoptionRates,
        topFeatures,
        underutilizedFeatures,
        usageBySegment,
      };
    } catch (error) {
      this.logger.error(`Failed to get feature usage: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user segments and segmentation data
   */
  async getUserSegments(query: UserSegmentQueryDto): Promise<UserSegmentsResponseDto> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 50;

      // Get segment summaries
      const segmentSummaries: SegmentSummaryDto[] = [];
      const totalUsersResult = await this.segmentRepository
        .createQueryBuilder('s')
        .select('COUNT(DISTINCT s.userId)', 'count')
        .where('s.isActive = :active', { active: true })
        .getRawOne();

      const totalUsers = parseInt(totalUsersResult?.count || '0');

      for (const segmentType of Object.values(SegmentType)) {
        const segmentData = await this.segmentRepository
          .createQueryBuilder('s')
          .select('COUNT(*)', 'count')
          .addSelect('AVG(s.confidence)', 'avgConfidence')
          .where('s.segmentType = :type', { type: segmentType })
          .andWhere('s.isActive = :active', { active: true })
          .getRawOne();

        const userCount = parseInt(segmentData?.count || '0');

        if (userCount > 0) {
          // Calculate growth rate (compare to 30 days ago)
          const thirtyDaysAgo = subDays(new Date(), 30);
          const previousCount = await this.segmentRepository.count({
            where: {
              segmentType,
              isActive: true,
              assignedAt: LessThanOrEqual(thirtyDaysAgo),
            },
          });

          const growthRate = previousCount > 0 ? ((userCount - previousCount) / previousCount) * 100 : 0;

          segmentSummaries.push({
            segmentType,
            userCount,
            percentageOfTotal: totalUsers > 0 ? parseFloat(((userCount / totalUsers) * 100).toFixed(2)) : 0,
            avgConfidence: parseFloat(parseFloat(segmentData?.avgConfidence || '0').toFixed(2)),
            growthRate: parseFloat(growthRate.toFixed(2)),
          });
        }
      }

      // Sort by user count
      segmentSummaries.sort((a, b) => b.userCount - a.userCount);

      // Calculate distribution by category
      const distribution = this.calculateSegmentDistribution(segmentSummaries, totalUsers);

      // Get recent transitions
      const recentTransitions = await this.getRecentSegmentTransitions();

      return {
        segments: segmentSummaries,
        totalUsers,
        distribution,
        recentTransitions,
      };
    } catch (error) {
      this.logger.error(`Failed to get user segments: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get paginated user activity timeline
   */
  async getUserActivities(query: QueryUserAnalyticsDto): Promise<PaginatedUserActivityDto> {
    const endDate = query.endDate ? parseISO(query.endDate) : new Date();
    const startDate = query.startDate ? parseISO(query.startDate) : subDays(endDate, 30);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.activityRepository
        .createQueryBuilder('a')
        .where('a.timestamp BETWEEN :start AND :end', { start: startDate, end: endDate });

      if (query.userId) {
        queryBuilder.andWhere('a.userId = :userId', { userId: query.userId });
      }

      if (query.activityType) {
        queryBuilder.andWhere('a.activityType = :type', { type: query.activityType });
      }

      const [activities, total] = await queryBuilder
        .orderBy('a.timestamp', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const items: UserActivityItemDto[] = activities.map((a) => ({
        id: a.id,
        activityType: a.activityType,
        userId: a.userId,
        sessionId: a.sessionId,
        timestamp: a.timestamp.toISOString(),
        path: a.path,
        metadata: a.metadata,
        isSuccessful: a.isSuccessful,
        duration: a.duration,
      }));

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get user activities: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  private parseUserAgent(userAgent?: string): { deviceType: string; browser: string; os: string } {
    if (!userAgent) {
      return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
    }

    // Simple UA parsing (in production, use a library like ua-parser-js)
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet/i.test(userAgent)) deviceType = 'tablet';

    let browser = 'unknown';
    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    let os = 'unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios/i.test(userAgent)) os = 'iOS';

    return { deviceType, browser, os };
  }

  private async updateSessionActivity(
    sessionId: string,
    userId: string,
    activityType: UserActivityType,
    path?: string,
  ): Promise<void> {
    let session = await this.sessionRepository.findOne({ where: { sessionId } });

    if (!session) {
      // Create new session
      session = this.sessionRepository.create({
        sessionId,
        userId,
        entryPage: path,
        sessionDate: startOfDay(new Date()),
        pageViews: activityType === UserActivityType.PAGE_VIEW ? 1 : 0,
        activityCount: 1,
      });
    } else {
      // Update existing session
      session.activityCount++;
      session.lastActivityTime = new Date();
      if (path) {
        session.exitPage = path;
      }

      if (activityType === UserActivityType.PAGE_VIEW) {
        session.pageViews++;
      }

      // Update funnel progress
      if ([UserActivityType.JOB_VIEW, UserActivityType.JOB_SEARCH].includes(activityType)) {
        session.viewedJob = true;
      }
      if (activityType === UserActivityType.JOB_SAVE) {
        session.savedJob = true;
      }
      if (activityType === UserActivityType.APPLICATION_START) {
        session.startedApplication = true;
      }
      if (activityType === UserActivityType.APPLICATION_SUBMIT) {
        session.submittedApplication = true;
      }
      if (
        [
          UserActivityType.RESUME_GENERATE,
          UserActivityType.COVER_LETTER_GENERATE,
          UserActivityType.AI_SUGGESTION_ACCEPT,
        ].includes(activityType)
      ) {
        session.usedAiFeature = true;
      }

      // Calculate session duration
      if (session.startTime) {
        session.durationMs = new Date().getTime() - session.startTime.getTime();
      }

      // Update engagement score
      session.engagementScore = this.calculateEngagementScore(session);
    }

    await this.sessionRepository.save(session);
  }

  private calculateEngagementScore(session: UserSession): number {
    let score = 0;

    // Base score from page views (max 30 points)
    score += Math.min(session.pageViews * 3, 30);

    // Score from duration (max 30 points)
    const durationMinutes = session.durationMs / 60000;
    score += Math.min(durationMinutes * 2, 30);

    // Score from funnel progress (max 40 points)
    if (session.viewedJob) score += 5;
    if (session.savedJob) score += 5;
    if (session.startedApplication) score += 10;
    if (session.submittedApplication) score += 15;
    if (session.usedAiFeature) score += 5;

    return Math.min(score, 100);
  }

  private async checkJourneyProgression(userId: string, activityType: UserActivityType): Promise<void> {
    const stageMapping: Partial<Record<UserActivityType, string>> = {
      [UserActivityType.REGISTER]: 'signup',
      [UserActivityType.PROFILE_UPDATE]: 'profile_complete',
      [UserActivityType.JOB_SEARCH]: 'first_search',
      [UserActivityType.APPLICATION_SUBMIT]: 'first_application',
    };

    const stage = stageMapping[activityType];
    if (!stage) return;

    // Check if stage already exists
    const existingStage = await this.journeyStageRepository.findOne({
      where: { userId, stage },
    });

    if (existingStage) return;

    // Get signup date for days calculation
    const signupStage = await this.journeyStageRepository.findOne({
      where: { userId, stage: 'signup' },
    });

    const previousStageIndex = this.journeyStages.indexOf(stage) - 1;
    let daysFromPreviousStage = 0;

    if (previousStageIndex >= 0) {
      const previousStage = await this.journeyStageRepository.findOne({
        where: { userId, stage: this.journeyStages[previousStageIndex] },
      });
      if (previousStage) {
        daysFromPreviousStage = differenceInDays(new Date(), previousStage.reachedAt);
      }
    }

    const newStage = this.journeyStageRepository.create({
      userId,
      stage,
      reachedAt: new Date(),
      daysFromSignup: signupStage ? differenceInDays(new Date(), signupStage.reachedAt) : 0,
      daysFromPreviousStage,
    });

    await this.journeyStageRepository.save(newStage);
  }

  private async updateUserSegments(userId: string): Promise<void> {
    // This would typically run periodically, but we do a lightweight check here
    const recentActivities = await this.activityRepository.count({
      where: {
        userId,
        timestamp: MoreThanOrEqual(subDays(new Date(), 7)),
      },
    });

    // Determine engagement level
    let engagementSegment: SegmentType;
    if (recentActivities >= 50) {
      engagementSegment = SegmentType.POWER_USER;
    } else if (recentActivities >= 20) {
      engagementSegment = SegmentType.ACTIVE_USER;
    } else if (recentActivities >= 5) {
      engagementSegment = SegmentType.CASUAL_USER;
    } else {
      engagementSegment = SegmentType.DORMANT_USER;
    }

    // Check if segment needs updating
    const existingSegment = await this.segmentRepository.findOne({
      where: {
        userId,
        segmentType: In([
          SegmentType.POWER_USER,
          SegmentType.ACTIVE_USER,
          SegmentType.CASUAL_USER,
          SegmentType.DORMANT_USER,
        ]),
        isActive: true,
      },
    });

    if (!existingSegment || existingSegment.segmentType !== engagementSegment) {
      // Deactivate old segment
      if (existingSegment) {
        existingSegment.isActive = false;
        await this.segmentRepository.save(existingSegment);
      }

      // Create new segment
      const newSegment = this.segmentRepository.create({
        userId,
        segmentType: engagementSegment,
        confidence: 0.8,
        source: 'auto',
        criteria: { recentActivityCount: recentActivities },
      });

      await this.segmentRepository.save(newSegment);
    }
  }

  private async getUniqueUsersCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.activityRepository
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.userId)', 'count')
      .where('a.timestamp BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    return parseInt(result?.count || '0');
  }

  private async getSessionMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    avgDuration: number;
    avgSessionsPerUser: number;
    avgPageViews: number;
    bounceRate: number;
  }> {
    const metrics = await this.sessionRepository
      .createQueryBuilder('s')
      .select('AVG(s.durationMs)', 'avgDuration')
      .addSelect('AVG(s.pageViews)', 'avgPageViews')
      .addSelect('COUNT(*)', 'totalSessions')
      .addSelect('COUNT(DISTINCT s.userId)', 'uniqueUsers')
      .where('s.startTime BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    const bouncedSessions = await this.sessionRepository.count({
      where: {
        startTime: Between(startDate, endDate),
        pageViews: 1,
      },
    });

    const totalSessions = parseInt(metrics?.totalSessions || '0');
    const uniqueUsers = parseInt(metrics?.uniqueUsers || '0');
    const avgDurationMs = parseFloat(metrics?.avgDuration || '0');

    return {
      avgDuration: parseFloat((avgDurationMs / 60000).toFixed(2)), // Convert to minutes
      avgSessionsPerUser: uniqueUsers > 0 ? parseFloat((totalSessions / uniqueUsers).toFixed(2)) : 0,
      avgPageViews: parseFloat(parseFloat(metrics?.avgPageViews || '0').toFixed(2)),
      bounceRate: totalSessions > 0 ? parseFloat(((bouncedSessions / totalSessions) * 100).toFixed(2)) : 0,
    };
  }

  private async getDauTrend(startDate: Date, endDate: Date): Promise<DailyActiveUsersDto[]> {
    const results = await this.activityRepository
      .createQueryBuilder('a')
      .select('DATE(a.timestamp)', 'date')
      .addSelect('COUNT(DISTINCT a.userId)', 'count')
      .where('a.timestamp BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('DATE(a.timestamp)')
      .orderBy('DATE(a.timestamp)', 'ASC')
      .getRawMany();

    const trend: DailyActiveUsersDto[] = [];
    let previousCount = 0;

    for (const r of results) {
      const activeUsers = parseInt(r.count);
      const changePercent = previousCount > 0 ? ((activeUsers - previousCount) / previousCount) * 100 : 0;

      trend.push({
        date: format(new Date(r.date), 'yyyy-MM-dd'),
        activeUsers,
        changePercent: parseFloat(changePercent.toFixed(2)),
      });

      previousCount = activeUsers;
    }

    return trend;
  }

  private async getSessionDurationDistribution(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const sessions = await this.sessionRepository.find({
      where: {
        startTime: Between(startDate, endDate),
      },
      select: ['durationMs'],
    });

    const distribution = {
      '0-1min': 0,
      '1-5min': 0,
      '5-15min': 0,
      '15+min': 0,
    };

    for (const session of sessions) {
      const minutes = session.durationMs / 60000;
      if (minutes < 1) distribution['0-1min']++;
      else if (minutes < 5) distribution['1-5min']++;
      else if (minutes < 15) distribution['5-15min']++;
      else distribution['15+min']++;
    }

    // Convert to percentages
    const total = sessions.length || 1;
    return {
      '0-1min': parseFloat(((distribution['0-1min'] / total) * 100).toFixed(2)),
      '1-5min': parseFloat(((distribution['1-5min'] / total) * 100).toFixed(2)),
      '5-15min': parseFloat(((distribution['5-15min'] / total) * 100).toFixed(2)),
      '15+min': parseFloat(((distribution['15+min'] / total) * 100).toFixed(2)),
    };
  }

  private async getCohortRetention(
    startDate: Date,
    endDate: Date,
    periodType: 'day' | 'week' | 'month',
    periods: number,
  ): Promise<CohortRetentionDto[]> {
    const cohorts: CohortRetentionDto[] = [];

    // Generate cohort dates based on period type
    let currentDate = startDate;
    const cohortDates: Date[] = [];

    while (currentDate <= endDate) {
      cohortDates.push(currentDate);
      if (periodType === 'day') {
        currentDate = subDays(currentDate, -1);
      } else if (periodType === 'week') {
        currentDate = subWeeks(currentDate, -1);
      } else {
        currentDate = subMonths(currentDate, -1);
      }
    }

    // For each cohort, calculate retention
    for (const cohortDate of cohortDates.slice(0, Math.min(cohortDates.length, 12))) {
      let cohortEnd: Date;
      if (periodType === 'day') {
        cohortEnd = endOfDay(cohortDate);
      } else if (periodType === 'week') {
        cohortEnd = endOfDay(subDays(subWeeks(cohortDate, -1), 1));
      } else {
        cohortEnd = endOfDay(subDays(subMonths(cohortDate, -1), 1));
      }

      // Get users who signed up in this cohort period
      const cohortUsers = await this.journeyStageRepository.find({
        where: {
          stage: 'signup',
          reachedAt: Between(cohortDate, cohortEnd),
        },
      });

      const cohortSize = cohortUsers.length;
      if (cohortSize === 0) continue;

      const userIds = cohortUsers.map((u) => u.userId);
      const retention: number[] = [100]; // Period 0 is always 100%

      // Calculate retention for each subsequent period
      for (let p = 1; p <= periods; p++) {
        let periodStart: Date;
        let periodEnd: Date;

        if (periodType === 'day') {
          periodStart = subDays(cohortDate, -p);
          periodEnd = endOfDay(periodStart);
        } else if (periodType === 'week') {
          periodStart = subWeeks(cohortDate, -p);
          periodEnd = endOfDay(subDays(subWeeks(periodStart, -1), 1));
        } else {
          periodStart = subMonths(cohortDate, -p);
          periodEnd = endOfDay(subDays(subMonths(periodStart, -1), 1));
        }

        if (periodStart > new Date()) break;

        const activeInPeriod = await this.activityRepository
          .createQueryBuilder('a')
          .select('COUNT(DISTINCT a.userId)', 'count')
          .where('a.userId IN (:...userIds)', { userIds })
          .andWhere('a.timestamp BETWEEN :start AND :end', { start: periodStart, end: periodEnd })
          .getRawOne();

        const retainedCount = parseInt(activeInPeriod?.count || '0');
        retention.push(parseFloat(((retainedCount / cohortSize) * 100).toFixed(2)));
      }

      cohorts.push({
        cohort: format(cohortDate, periodType === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd'),
        cohortSize,
        retention,
      });
    }

    return cohorts;
  }

  private async calculateDayNRetention(n: number): Promise<number> {
    const targetDate = subDays(new Date(), n);
    const targetStart = startOfDay(targetDate);
    const targetEnd = endOfDay(targetDate);

    // Get users who signed up on target date
    const signups = await this.journeyStageRepository.find({
      where: {
        stage: 'signup',
        reachedAt: Between(targetStart, targetEnd),
      },
    });

    if (signups.length === 0) return 0;

    const userIds = signups.map((s) => s.userId);

    // Check how many were active today
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const activeToday = await this.activityRepository
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.userId)', 'count')
      .where('a.userId IN (:...userIds)', { userIds })
      .andWhere('a.timestamp BETWEEN :start AND :end', { start: today, end: todayEnd })
      .getRawOne();

    const retainedCount = parseInt(activeToday?.count || '0');
    return parseFloat(((retainedCount / signups.length) * 100).toFixed(2));
  }

  private async calculateChurnRate(): Promise<number> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);

    // Users active 30-60 days ago
    const previouslyActive = await this.activityRepository
      .createQueryBuilder('a')
      .select('DISTINCT a.userId', 'userId')
      .where('a.timestamp BETWEEN :start AND :end', { start: sixtyDaysAgo, end: thirtyDaysAgo })
      .getRawMany();

    if (previouslyActive.length === 0) return 0;

    const userIds = previouslyActive.map((u) => u.userId);

    // Of those, how many were NOT active in last 30 days
    const stillActive = await this.activityRepository
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.userId)', 'count')
      .where('a.userId IN (:...userIds)', { userIds })
      .andWhere('a.timestamp >= :date', { date: thirtyDaysAgo })
      .getRawOne();

    const stillActiveCount = parseInt(stillActive?.count || '0');
    const churnedCount = previouslyActive.length - stillActiveCount;

    return parseFloat(((churnedCount / previouslyActive.length) * 100).toFixed(2));
  }

  private async getRetentionBySegment(): Promise<Record<string, number>> {
    const segments = [SegmentType.POWER_USER, SegmentType.ACTIVE_USER, SegmentType.CASUAL_USER];
    const retentionBySegment: Record<string, number> = {};

    for (const segmentType of segments) {
      const segmentUsers = await this.segmentRepository.find({
        where: { segmentType, isActive: true },
        select: ['userId'],
      });

      if (segmentUsers.length === 0) {
        retentionBySegment[segmentType] = 0;
        continue;
      }

      const userIds = segmentUsers.map((s) => s.userId);
      const sevenDaysAgo = subDays(new Date(), 7);

      const activeCount = await this.activityRepository
        .createQueryBuilder('a')
        .select('COUNT(DISTINCT a.userId)', 'count')
        .where('a.userId IN (:...userIds)', { userIds })
        .andWhere('a.timestamp >= :date', { date: sevenDaysAgo })
        .getRawOne();

      const retention = (parseInt(activeCount?.count || '0') / segmentUsers.length) * 100;
      retentionBySegment[segmentType] = parseFloat(retention.toFixed(2));
    }

    return retentionBySegment;
  }

  private calculateRetentionTrend(
    cohorts: CohortRetentionDto[],
  ): Array<{ period: string; retained: number; churned: number }> {
    if (cohorts.length === 0) return [];

    // Use the most recent cohort for trend
    const latestCohort = cohorts[cohorts.length - 1];
    const trend: Array<{ period: string; retained: number; churned: number }> = [];

    for (let i = 0; i < latestCohort.retention.length; i++) {
      const retained = latestCohort.retention[i];
      const churned = i === 0 ? 0 : latestCohort.retention[i - 1] - retained;

      trend.push({
        period: `Period ${i}`,
        retained,
        churned: parseFloat(churned.toFixed(2)),
      });
    }

    return trend;
  }

  private async getFeatureUsageBySegment(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, Record<string, number>>> {
    const usageBySegment: Record<string, Record<string, number>> = {};

    const relevantSegments = [SegmentType.POWER_USER, SegmentType.ACTIVE_USER, SegmentType.AI_ENTHUSIAST];

    for (const segmentType of relevantSegments) {
      const segmentUsers = await this.segmentRepository.find({
        where: { segmentType, isActive: true },
        select: ['userId'],
      });

      if (segmentUsers.length === 0) continue;

      const userIds = segmentUsers.map((s) => s.userId);
      usageBySegment[segmentType] = {};

      for (const [featureName, activityTypes] of Object.entries(this.featureMapping)) {
        const usage = await this.activityRepository.count({
          where: {
            userId: In(userIds),
            activityType: In(activityTypes),
            timestamp: Between(startDate, endDate),
          },
        });

        const avgUsage = segmentUsers.length > 0 ? usage / segmentUsers.length : 0;
        usageBySegment[segmentType][featureName] = parseFloat(avgUsage.toFixed(2));
      }
    }

    return usageBySegment;
  }

  private calculateSegmentDistribution(
    summaries: SegmentSummaryDto[],
    totalUsers: number,
  ): Record<string, Record<string, number>> {
    const distribution: Record<string, Record<string, number>> = {
      engagement: {},
      lifecycle: {},
      behavior: {},
    };

    const engagementTypes = [
      SegmentType.POWER_USER,
      SegmentType.ACTIVE_USER,
      SegmentType.CASUAL_USER,
      SegmentType.DORMANT_USER,
    ];

    const lifecycleTypes = [
      SegmentType.NEW_USER,
      SegmentType.ONBOARDING,
      SegmentType.ESTABLISHED,
      SegmentType.AT_RISK,
    ];

    const behaviorTypes = [
      SegmentType.ACTIVE_SEEKER,
      SegmentType.PASSIVE_SEEKER,
      SegmentType.AI_ENTHUSIAST,
      SegmentType.TRADITIONAL_USER,
    ];

    for (const summary of summaries) {
      if (engagementTypes.includes(summary.segmentType)) {
        distribution.engagement[summary.segmentType] = summary.percentageOfTotal;
      } else if (lifecycleTypes.includes(summary.segmentType)) {
        distribution.lifecycle[summary.segmentType] = summary.percentageOfTotal;
      } else if (behaviorTypes.includes(summary.segmentType)) {
        distribution.behavior[summary.segmentType] = summary.percentageOfTotal;
      }
    }

    return distribution;
  }

  private async getRecentSegmentTransitions(): Promise<
    Array<{ from: string; to: string; count: number; percentage: number }>
  > {
    // This would require tracking segment history
    // For now, return a simplified version
    const thirtyDaysAgo = subDays(new Date(), 30);

    const recentSegments = await this.segmentRepository.find({
      where: {
        assignedAt: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { assignedAt: 'DESC' },
      take: 1000,
    });

    // Group by user and find transitions
    const userSegments = new Map<string, string[]>();
    for (const seg of recentSegments) {
      const existing = userSegments.get(seg.userId) || [];
      existing.push(seg.segmentType);
      userSegments.set(seg.userId, existing);
    }

    const transitionCounts = new Map<string, number>();
    for (const [, segments] of userSegments) {
      if (segments.length >= 2) {
        const transition = `${segments[1]}|${segments[0]}`;
        transitionCounts.set(transition, (transitionCounts.get(transition) || 0) + 1);
      }
    }

    const totalTransitions = Array.from(transitionCounts.values()).reduce((a, b) => a + b, 0) || 1;

    const transitions: Array<{ from: string; to: string; count: number; percentage: number }> = [];
    for (const [key, count] of transitionCounts) {
      const [from, to] = key.split('|');
      transitions.push({
        from,
        to,
        count,
        percentage: parseFloat(((count / totalTransitions) * 100).toFixed(2)),
      });
    }

    return transitions.slice(0, 10);
  }

  private generateDropOffInsights(funnel: FunnelStageDto[]): Record<string, string> {
    const insights: Record<string, string> = {};

    for (let i = 0; i < funnel.length - 1; i++) {
      const current = funnel[i];
      const next = funnel[i + 1];

      if (next.conversionFromPrevious < 50) {
        const recommendations: Record<string, string> = {
          signup: 'Simplify registration flow or offer social login options',
          profile_complete: 'Add progress indicators and highlight benefits of completing profile',
          first_search: 'Show personalized job recommendations on dashboard',
          first_application: 'Enable one-click apply and AI resume optimization',
          first_interview: 'Provide interview preparation resources and tips',
        };

        insights[next.stage] = recommendations[next.stage] || 'Analyze user feedback for this stage';
      }
    }

    return insights;
  }

  private getEmptyJourneyResponse(): UserJourneyResponseDto {
    return {
      funnel: this.journeyStages.map((stage) => ({
        stage,
        users: 0,
        percentage: 0,
        avgDaysToReach: 0,
        conversionFromPrevious: 0,
      })),
      overallConversionRate: 0,
      avgDaysToFirstApplication: 0,
      avgDaysToHired: 0,
      stageConversions: {},
      dropOffInsights: {},
    };
  }
}
