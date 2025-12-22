import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserActivityType } from '../entities/user-activity.entity';
import { SegmentType } from '../entities/user-segment.entity';

// Track Activity Response
export class TrackActivityResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'login' })
  activityType: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  timestamp: string;

  @ApiProperty({ example: true })
  success: boolean;
}

export class BatchTrackActivityResponseDto {
  @ApiProperty({ example: 10 })
  tracked: number;

  @ApiProperty({ example: 0 })
  failed: number;

  @ApiProperty({ type: [String] })
  errors: string[];
}

// Engagement Metrics Response
export class DailyActiveUsersDto {
  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ example: 1500 })
  activeUsers: number;

  @ApiProperty({ example: 5.2 })
  changePercent: number;
}

export class EngagementMetricsResponseDto {
  @ApiProperty({ example: 1500, description: 'Daily Active Users (DAU)' })
  dau: number;

  @ApiProperty({ example: 8500, description: 'Weekly Active Users (WAU)' })
  wau: number;

  @ApiProperty({ example: 25000, description: 'Monthly Active Users (MAU)' })
  mau: number;

  @ApiProperty({ example: 17.6, description: 'DAU/MAU ratio (stickiness)' })
  stickiness: number;

  @ApiProperty({ example: 12.5, description: 'Average session duration in minutes' })
  avgSessionDuration: number;

  @ApiProperty({ example: 3.2, description: 'Average sessions per user per day' })
  avgSessionsPerUser: number;

  @ApiProperty({ example: 8.5, description: 'Average page views per session' })
  avgPageViewsPerSession: number;

  @ApiProperty({ example: 25.3, description: 'Bounce rate percentage' })
  bounceRate: number;

  @ApiProperty({
    type: [DailyActiveUsersDto],
    description: 'Daily active users trend',
  })
  dauTrend: DailyActiveUsersDto[];

  @ApiProperty({
    example: { '0-1min': 20, '1-5min': 35, '5-15min': 30, '15+min': 15 },
    description: 'Session duration distribution',
  })
  sessionDurationDistribution: Record<string, number>;
}

// User Journey Response
export class FunnelStageDto {
  @ApiProperty({ example: 'signup' })
  stage: string;

  @ApiProperty({ example: 10000 })
  users: number;

  @ApiProperty({ example: 100 })
  percentage: number;

  @ApiProperty({ example: 2.5 })
  avgDaysToReach: number;

  @ApiProperty({ example: 75 })
  conversionFromPrevious: number;
}

export class UserJourneyResponseDto {
  @ApiProperty({ type: [FunnelStageDto] })
  funnel: FunnelStageDto[];

  @ApiProperty({ example: 15.2, description: 'Overall conversion rate (signup to hired)' })
  overallConversionRate: number;

  @ApiProperty({ example: 45.5, description: 'Average days from signup to first application' })
  avgDaysToFirstApplication: number;

  @ApiProperty({ example: 90, description: 'Average days from signup to hired' })
  avgDaysToHired: number;

  @ApiProperty({
    example: {
      signup_to_profile: 85,
      profile_to_search: 70,
      search_to_apply: 45,
      apply_to_interview: 25,
      interview_to_hired: 40,
    },
    description: 'Stage-to-stage conversion rates',
  })
  stageConversions: Record<string, number>;

  @ApiProperty({
    example: {
      profile_complete: 'Add work experience',
      first_application: 'Use AI resume optimization',
    },
    description: 'Drop-off points with recommendations',
  })
  dropOffInsights: Record<string, string>;
}

// Retention Metrics Response
export class CohortRetentionDto {
  @ApiProperty({ example: '2024-01' })
  cohort: string;

  @ApiProperty({ example: 1000 })
  cohortSize: number;

  @ApiProperty({
    example: [100, 65, 55, 50, 48, 45, 43, 42, 41, 40, 39, 38],
    description: 'Retention percentage for each period',
  })
  retention: number[];
}

export class RetentionMetricsResponseDto {
  @ApiProperty({ example: 65, description: 'Day 1 retention rate' })
  day1Retention: number;

  @ApiProperty({ example: 45, description: 'Day 7 retention rate' })
  day7Retention: number;

  @ApiProperty({ example: 30, description: 'Day 30 retention rate' })
  day30Retention: number;

  @ApiProperty({ example: 5.2, description: 'Monthly churn rate percentage' })
  churnRate: number;

  @ApiProperty({ type: [CohortRetentionDto] })
  cohorts: CohortRetentionDto[];

  @ApiProperty({
    example: {
      power_users: 85,
      active_users: 55,
      casual_users: 25,
    },
    description: 'Retention by user segment',
  })
  retentionBySegment: Record<string, number>;

  @ApiProperty({
    example: [
      { period: 'Week 1', retained: 65, churned: 35 },
      { period: 'Week 2', retained: 55, churned: 10 },
    ],
    description: 'Retention trend over time',
  })
  retentionTrend: Array<{ period: string; retained: number; churned: number }>;
}

// Feature Usage Response
export class FeatureUsageItemDto {
  @ApiProperty({ example: 'job_search' })
  feature: string;

  @ApiProperty({ example: 15000 })
  totalUsage: number;

  @ApiProperty({ example: 8500 })
  uniqueUsers: number;

  @ApiProperty({ example: 1.76 })
  avgUsagePerUser: number;

  @ApiProperty({ example: 85 })
  adoptionRate: number;

  @ApiProperty({ example: 12.5 })
  changeFromLastPeriod: number;
}

export class FeatureUsageResponseDto {
  @ApiProperty({ type: [FeatureUsageItemDto] })
  features: FeatureUsageItemDto[];

  @ApiProperty({
    example: { job_search: 85, resume_generate: 45, cover_letter: 35 },
    description: 'Feature adoption rates',
  })
  adoptionRates: Record<string, number>;

  @ApiProperty({
    example: ['job_search', 'resume_generate', 'application_submit'],
    description: 'Most used features in order',
  })
  topFeatures: string[];

  @ApiProperty({
    example: ['data_export', 'subscription_view'],
    description: 'Least used features',
  })
  underutilizedFeatures: string[];

  @ApiProperty({
    example: {
      ai_enthusiast: { resume_generate: 95, cover_letter: 90 },
      traditional_user: { job_search: 75, application_submit: 60 },
    },
    description: 'Feature usage by user segment',
  })
  usageBySegment: Record<string, Record<string, number>>;
}

// User Segments Response
export class UserSegmentDetailDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  userId: string;

  @ApiProperty({ enum: SegmentType })
  segmentType: SegmentType;

  @ApiProperty({ example: 0.85 })
  confidence: number;

  @ApiProperty({ example: { loginCount: 50, applicationsSubmitted: 25 } })
  criteria: Record<string, any>;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  assignedAt: string;
}

export class SegmentSummaryDto {
  @ApiProperty({ enum: SegmentType })
  segmentType: SegmentType;

  @ApiProperty({ example: 1500 })
  userCount: number;

  @ApiProperty({ example: 15 })
  percentageOfTotal: number;

  @ApiProperty({ example: 0.82 })
  avgConfidence: number;

  @ApiProperty({ example: 5.2 })
  growthRate: number;
}

export class UserSegmentsResponseDto {
  @ApiProperty({ type: [SegmentSummaryDto] })
  segments: SegmentSummaryDto[];

  @ApiProperty({ example: 10000 })
  totalUsers: number;

  @ApiProperty({
    example: {
      engagement: { power_user: 15, active_user: 35, casual_user: 30, dormant_user: 20 },
      lifecycle: { new_user: 10, onboarding: 5, established: 70, at_risk: 15 },
    },
    description: 'Segment distribution by category',
  })
  distribution: Record<string, Record<string, number>>;

  @ApiProperty({
    example: [
      { from: 'active_user', to: 'power_user', count: 150, percentage: 10 },
      { from: 'casual_user', to: 'dormant_user', count: 200, percentage: 20 },
    ],
    description: 'Recent segment transitions',
  })
  recentTransitions: Array<{
    from: string;
    to: string;
    count: number;
    percentage: number;
  }>;
}

// User Activity Timeline Response
export class UserActivityItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ enum: UserActivityType })
  activityType: UserActivityType;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  userId: string;

  @ApiPropertyOptional({ example: 'sess_123456' })
  sessionId?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  timestamp: string;

  @ApiPropertyOptional({ example: '/jobs/search' })
  path?: string;

  @ApiPropertyOptional({ example: { query: 'software engineer' } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: true })
  isSuccessful: boolean;

  @ApiPropertyOptional({ example: 5000 })
  duration?: number;
}

export class PaginatedUserActivityDto {
  @ApiProperty({ type: [UserActivityItemDto] })
  items: UserActivityItemDto[];

  @ApiProperty({ example: 500 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 25 })
  totalPages: number;
}
