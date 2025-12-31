import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
  UseInterceptors,
  UseGuards,
  ClassSerializerInterceptor,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryAnalyticsDto, ExportAnalyticsDto } from './dto/query-analytics.dto';
import {
  DashboardMetricsDto,
  ApplicationFunnelDto,
  PaginatedActivityDto,
  EventResponseDto,
} from './dto/analytics-response.dto';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { Public } from '../../auth/public.decorator';
import { RequiresTier } from '@applyforus/security';

/**
 * Analytics Controller
 * REST API endpoints for analytics data and dashboard metrics.
 *
 * Subscription Requirements:
 * - Basic tracking endpoints: Available to STARTER tier and above
 * - Dashboard/funnel endpoints: Included with STARTER tier
 * - Export endpoint: Admin only (no tier check, admin-gated)
 */
@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseInterceptors(ClassSerializerInterceptor)
@RequiresTier('starter') // Basic analytics requires STARTER tier
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track analytics event',
    description: 'Records a new analytics event in the system',
  })
  @ApiResponse({
    status: 201,
    description: 'Event tracked successfully',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid event data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to track event' })
  async trackEvent(
    @Body() createEventDto: CreateEventDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ): Promise<EventResponseDto> {
    return this.analyticsService.trackEvent(createEventDto, userAgent, ipAddress);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard metrics (Admin or own data)',
    description:
      'Retrieves aggregated metrics for the analytics dashboard including user counts, application stats, and trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    type: DashboardMetricsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required for aggregate data' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve dashboard metrics' })
  async getDashboardMetrics(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DashboardMetricsDto> {
    // IDOR protection: Non-admins can only query their own data
    if (user.role !== 'admin') {
      if (!query.userId || query.userId !== user.id) {
        throw new ForbiddenException('You can only access your own analytics data');
      }
    }
    return this.analyticsService.getDashboardMetrics(query);
  }

  @Get('applications')
  @ApiOperation({
    summary: 'Get application funnel statistics (Admin or own data)',
    description:
      'Retrieves application funnel data showing conversion rates from job views to applications to acceptances',
  })
  @ApiResponse({
    status: 200,
    description: 'Application funnel data retrieved successfully',
    type: ApplicationFunnelDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required for aggregate data' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve application funnel' })
  async getApplicationFunnel(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApplicationFunnelDto> {
    // IDOR protection: Non-admins can only query their own data
    if (user.role !== 'admin') {
      if (!query.userId || query.userId !== user.id) {
        throw new ForbiddenException('You can only access your own analytics data');
      }
    }
    return this.analyticsService.getApplicationFunnel(query);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Get recent activity (Admin or own data)',
    description: 'Retrieves a paginated list of recent analytics events',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
    type: PaginatedActivityDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required for aggregate data' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({
    name: 'eventType',
    required: false,
    type: String,
    description: 'Filter by event type',
  })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
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
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve activity' })
  async getRecentActivity(
    @Query() query: QueryAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedActivityDto> {
    // IDOR protection: Non-admins can only query their own activity
    if (user.role !== 'admin') {
      if (!query.userId || query.userId !== user.id) {
        throw new ForbiddenException('You can only access your own activity data');
      }
    }
    return this.analyticsService.getRecentActivity(query);
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export analytics data (Admin only)',
    description: 'Exports analytics data in CSV or JSON format. Admin-only for bulk export.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data exported successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required for data export' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['csv', 'json'],
    description: 'Export format (default: csv)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({
    name: 'eventType',
    required: false,
    type: String,
    description: 'Filter by event type',
  })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
  @ApiInternalServerErrorResponse({ description: 'Failed to export analytics data' })
  async exportAnalytics(
    @Query() query: ExportAnalyticsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    // Admin-only for bulk data export (data protection requirement)
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can export analytics data');
    }
    return this.analyticsService.exportAnalytics(query);
  }

  @Get('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the analytics service is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'analytics-service' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'analytics-service',
      timestamp: new Date().toISOString(),
    };
  }
}
