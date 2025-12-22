import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UserAnalyticsService } from './user-analytics.service';
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
} from './dto';
import { UserActivityType } from './entities/user-activity.entity';
import { SegmentType } from './entities/user-segment.entity';

/**
 * User Analytics Controller
 * REST API endpoints for user analytics, engagement metrics, and behavior tracking
 */
@ApiTags('user-analytics')
@Controller('api/v1/user-analytics')
@UseInterceptors(ClassSerializerInterceptor)
export class UserAnalyticsController {
  private readonly logger = new Logger(UserAnalyticsController.name);

  constructor(private readonly userAnalyticsService: UserAnalyticsService) {}

  // ==================== Activity Tracking ====================

  @Post('track')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track user activity',
    description: 'Records a single user activity event for analytics tracking',
  })
  @ApiResponse({
    status: 201,
    description: 'Activity tracked successfully',
    type: TrackActivityResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid activity data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to track activity' })
  async trackActivity(
    @Body() dto: TrackActivityDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<TrackActivityResponseDto> {
    this.logger.log(`POST /track - Tracking ${dto.activityType} for user ${dto.userId}`);
    return this.userAnalyticsService.trackUserActivity(dto, userAgent, ipAddress);
  }

  @Post('track/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track multiple user activities',
    description: 'Records multiple user activity events in a single request',
  })
  @ApiBody({ type: BatchTrackActivityDto })
  @ApiResponse({
    status: 201,
    description: 'Activities tracked successfully',
    type: BatchTrackActivityResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid activity data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to track activities' })
  async trackBatchActivities(
    @Body() dto: BatchTrackActivityDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<BatchTrackActivityResponseDto> {
    this.logger.log(`POST /track/batch - Tracking ${dto.activities.length} activities`);
    return this.userAnalyticsService.trackBatchActivities(dto, userAgent, ipAddress);
  }

  @Get('activities')
  @ApiOperation({
    summary: 'Get user activities',
    description: 'Retrieves a paginated list of user activities',
  })
  @ApiResponse({
    status: 200,
    description: 'User activities retrieved successfully',
    type: PaginatedUserActivityDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    enum: UserActivityType,
    description: 'Filter by activity type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve activities' })
  async getUserActivities(@Query() query: QueryUserAnalyticsDto): Promise<PaginatedUserActivityDto> {
    this.logger.log(`GET /activities - Fetching activities`);
    return this.userAnalyticsService.getUserActivities(query);
  }

  @Get('activities/:userId')
  @ApiOperation({
    summary: 'Get activities for a specific user',
    description: 'Retrieves a paginated list of activities for a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User activities retrieved successfully',
    type: PaginatedUserActivityDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    enum: UserActivityType,
    description: 'Filter by activity type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve user activities' })
  async getUserActivitiesById(
    @Param('userId') userId: string,
    @Query() query: QueryUserAnalyticsDto,
  ): Promise<PaginatedUserActivityDto> {
    this.logger.log(`GET /activities/${userId} - Fetching activities for user`);
    return this.userAnalyticsService.getUserActivities({ ...query, userId });
  }

  // ==================== Engagement Metrics ====================

  @Get('engagement')
  @ApiOperation({
    summary: 'Get user engagement metrics',
    description:
      'Retrieves engagement metrics including DAU, MAU, session duration, and engagement trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Engagement metrics retrieved successfully',
    type: EngagementMetricsResponseDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for metrics (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for metrics (ISO 8601)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Granularity for trend data (default: day)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve engagement metrics' })
  async getEngagementMetrics(
    @Query() query: EngagementMetricsQueryDto,
  ): Promise<EngagementMetricsResponseDto> {
    this.logger.log(`GET /engagement - Fetching engagement metrics`);
    return this.userAnalyticsService.getUserEngagementMetrics(query);
  }

  // ==================== User Journey ====================

  @Get('journey')
  @ApiOperation({
    summary: 'Get user journey funnel analysis',
    description:
      'Retrieves funnel analysis data showing user progression from signup to hired',
  })
  @ApiResponse({
    status: 200,
    description: 'User journey data retrieved successfully',
    type: UserJourneyResponseDto,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'User ID for individual journey analysis',
  })
  @ApiQuery({
    name: 'cohortStartDate',
    required: false,
    type: String,
    description: 'Cohort start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'cohortEndDate',
    required: false,
    type: String,
    description: 'Cohort end date (ISO 8601)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve user journey' })
  async getUserJourney(@Query() query: UserJourneyQueryDto): Promise<UserJourneyResponseDto> {
    this.logger.log(`GET /journey - Fetching user journey funnel`);
    return this.userAnalyticsService.getUserJourney(query);
  }

  @Get('journey/:userId')
  @ApiOperation({
    summary: 'Get journey for a specific user',
    description: 'Retrieves journey progression for a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User journey data retrieved successfully',
    type: UserJourneyResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve user journey' })
  async getUserJourneyById(@Param('userId') userId: string): Promise<UserJourneyResponseDto> {
    this.logger.log(`GET /journey/${userId} - Fetching journey for user`);
    return this.userAnalyticsService.getUserJourney({ userId });
  }

  // ==================== Retention Metrics ====================

  @Get('retention')
  @ApiOperation({
    summary: 'Get retention metrics',
    description:
      'Retrieves retention metrics including cohort analysis, churn rate, and retention trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Retention metrics retrieved successfully',
    type: RetentionMetricsResponseDto,
  })
  @ApiQuery({
    name: 'cohortStartDate',
    required: false,
    type: String,
    description: 'Cohort start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'cohortEndDate',
    required: false,
    type: String,
    description: 'Cohort end date (ISO 8601)',
  })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Retention period type (default: week)',
  })
  @ApiQuery({
    name: 'periods',
    required: false,
    type: Number,
    description: 'Number of periods to analyze (default: 12, max: 52)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve retention metrics' })
  async getRetentionMetrics(@Query() query: RetentionQueryDto): Promise<RetentionMetricsResponseDto> {
    this.logger.log(`GET /retention - Fetching retention metrics`);
    return this.userAnalyticsService.getRetentionMetrics(query);
  }

  // ==================== Feature Usage ====================

  @Get('features')
  @ApiOperation({
    summary: 'Get feature usage analytics',
    description:
      'Retrieves analytics on which features users use most, adoption rates, and usage trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature usage data retrieved successfully',
    type: FeatureUsageResponseDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of features to return (default: 10, max: 50)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve feature usage' })
  async getFeatureUsage(@Query() query: FeatureUsageQueryDto): Promise<FeatureUsageResponseDto> {
    this.logger.log(`GET /features - Fetching feature usage analytics`);
    return this.userAnalyticsService.getFeatureUsage(query);
  }

  @Get('features/:userId')
  @ApiOperation({
    summary: 'Get feature usage for a specific user',
    description: 'Retrieves feature usage analytics for a specific user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User feature usage data retrieved successfully',
    type: FeatureUsageResponseDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve user feature usage' })
  async getFeatureUsageById(
    @Param('userId') userId: string,
    @Query() query: FeatureUsageQueryDto,
  ): Promise<FeatureUsageResponseDto> {
    this.logger.log(`GET /features/${userId} - Fetching feature usage for user`);
    return this.userAnalyticsService.getFeatureUsage({ ...query, userId });
  }

  // ==================== User Segments ====================

  @Get('segments')
  @ApiOperation({
    summary: 'Get user segments',
    description:
      'Retrieves user segment distribution and analytics based on behavior patterns',
  })
  @ApiResponse({
    status: 200,
    description: 'User segments retrieved successfully',
    type: UserSegmentsResponseDto,
  })
  @ApiQuery({
    name: 'segmentType',
    required: false,
    enum: SegmentType,
    description: 'Filter by segment type',
  })
  @ApiQuery({
    name: 'minConfidence',
    required: false,
    type: Number,
    description: 'Minimum confidence level (0-1)',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Include only active segments (default: true)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 100)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve user segments' })
  async getUserSegments(@Query() query: UserSegmentQueryDto): Promise<UserSegmentsResponseDto> {
    this.logger.log(`GET /segments - Fetching user segments`);
    return this.userAnalyticsService.getUserSegments(query);
  }

  // ==================== Health Check ====================

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the user analytics service is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'user-analytics' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'user-analytics',
      timestamp: new Date().toISOString(),
    };
  }
}
