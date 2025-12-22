import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAnalyticsController } from './user-analytics.controller';
import { UserAnalyticsService } from './user-analytics.service';
import { UserActivity } from './entities/user-activity.entity';
import { UserSession } from './entities/user-session.entity';
import { UserSegment, UserCohort, UserJourneyStage } from './entities/user-segment.entity';

/**
 * User Analytics Module
 *
 * Provides comprehensive user analytics capabilities including:
 * - Activity tracking (login, apply, search, etc.)
 * - Engagement metrics (DAU, MAU, session duration)
 * - User journey funnel analysis (signup -> profile -> apply -> hired)
 * - Retention and cohort analysis
 * - Feature usage analytics
 * - User segmentation by behavior
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserActivity,
      UserSession,
      UserSegment,
      UserCohort,
      UserJourneyStage,
    ]),
  ],
  controllers: [UserAnalyticsController],
  providers: [UserAnalyticsService],
  exports: [UserAnalyticsService],
})
export class UserAnalyticsModule {}
