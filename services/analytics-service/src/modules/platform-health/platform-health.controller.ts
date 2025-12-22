import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { PlatformHealthService } from './platform-health.service';
import {
  HealthReportQueryDto,
  LatencyMetricsQueryDto,
  ErrorRatesQueryDto,
  ServicesHealthResponseDto,
  QueueHealthResponseDto,
  DatabaseHealthResponseDto,
  ApiLatencyMetricsResponseDto,
  ErrorRatesResponseDto,
  PlatformHealthReportDto,
} from './dto';

/**
 * Platform Health Controller
 * REST endpoints for platform-wide health monitoring
 */
@ApiTags('platform-health')
@Controller('platform-health')
@UseInterceptors(ClassSerializerInterceptor)
export class PlatformHealthController {
  private readonly logger = new Logger(PlatformHealthController.name);

  constructor(private readonly platformHealthService: PlatformHealthService) {}

  /**
   * Get health status of all microservices
   */
  @Get('services')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all services health',
    description:
      'Checks the health status of all microservices in the platform and returns aggregated results',
  })
  @ApiResponse({
    status: 200,
    description: 'Services health retrieved successfully',
    type: ServicesHealthResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve services health' })
  async getServiceHealth(): Promise<ServicesHealthResponseDto> {
    this.logger.log('GET /platform-health/services - Fetching services health');
    return this.platformHealthService.getServiceHealth();
  }

  /**
   * Get RabbitMQ/Redis queue health
   */
  @Get('queues')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get queue health',
    description:
      'Checks the health status of RabbitMQ and Redis queues including message counts and consumer status',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue health retrieved successfully',
    type: QueueHealthResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve queue health' })
  async getQueueHealth(): Promise<QueueHealthResponseDto> {
    this.logger.log('GET /platform-health/queues - Fetching queue health');
    return this.platformHealthService.getQueueHealth();
  }

  /**
   * Get PostgreSQL database health
   */
  @Get('database')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get database health',
    description:
      'Checks PostgreSQL database connection health, connection pool status, and query performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Database health retrieved successfully',
    type: DatabaseHealthResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve database health' })
  async getDatabaseHealth(): Promise<DatabaseHealthResponseDto> {
    this.logger.log('GET /platform-health/database - Fetching database health');
    return this.platformHealthService.getDatabaseHealth();
  }

  /**
   * Get API latency metrics with percentiles
   */
  @Get('latency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get API latency metrics',
    description:
      'Returns response time percentiles (P50, P90, P95, P99) for all services and endpoints',
  })
  @ApiResponse({
    status: 200,
    description: 'Latency metrics retrieved successfully',
    type: ApiLatencyMetricsResponseDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for metrics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for metrics period (ISO 8601)',
  })
  @ApiQuery({
    name: 'serviceName',
    required: false,
    type: String,
    description: 'Filter by specific service name',
  })
  @ApiQuery({
    name: 'endpoint',
    required: false,
    type: String,
    description: 'Filter by specific endpoint',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve latency metrics' })
  async getApiLatencyMetrics(
    @Query() query: LatencyMetricsQueryDto,
  ): Promise<ApiLatencyMetricsResponseDto> {
    this.logger.log('GET /platform-health/latency - Fetching API latency metrics');
    return this.platformHealthService.getApiLatencyMetrics(query);
  }

  /**
   * Get error rates by service and endpoint
   */
  @Get('errors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get error rates',
    description:
      'Returns error rates grouped by service and endpoint, including critical errors requiring attention',
  })
  @ApiResponse({
    status: 200,
    description: 'Error rates retrieved successfully',
    type: ErrorRatesResponseDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for error rates period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for error rates period (ISO 8601)',
  })
  @ApiQuery({
    name: 'serviceName',
    required: false,
    type: String,
    description: 'Filter by specific service name',
  })
  @ApiQuery({
    name: 'minErrorRate',
    required: false,
    type: Number,
    description: 'Minimum error rate threshold (percentage)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve error rates' })
  async getErrorRates(@Query() query: ErrorRatesQueryDto): Promise<ErrorRatesResponseDto> {
    this.logger.log('GET /platform-health/errors - Fetching error rates');
    return this.platformHealthService.getErrorRates(query);
  }

  /**
   * Generate comprehensive platform health report
   */
  @Get('report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate health report',
    description:
      'Generates a comprehensive platform health report including all components, alerts, recommendations, and metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Health report generated successfully',
    type: PlatformHealthReportDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for report period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for report period (ISO 8601)',
  })
  @ApiQuery({
    name: 'includeMetrics',
    required: false,
    type: Boolean,
    description: 'Include detailed metrics in report (default: true)',
  })
  @ApiQuery({
    name: 'includeAlerts',
    required: false,
    type: Boolean,
    description: 'Include active alerts in report (default: true)',
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to generate health report' })
  async generateHealthReport(
    @Query() query: HealthReportQueryDto,
  ): Promise<PlatformHealthReportDto> {
    this.logger.log('GET /platform-health/report - Generating health report');
    return this.platformHealthService.generateHealthReport(query);
  }

  /**
   * Quick health check endpoint
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick health check',
    description: 'Returns a quick overview of platform health status',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform health status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy', 'degraded', 'unknown'],
          example: 'healthy',
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
        summary: {
          type: 'object',
          properties: {
            servicesHealthy: { type: 'number', example: 10 },
            servicesTotal: { type: 'number', example: 10 },
            queueStatus: { type: 'string', example: 'healthy' },
            databaseStatus: { type: 'string', example: 'healthy' },
          },
        },
      },
    },
  })
  async getQuickHealth(): Promise<{
    status: string;
    timestamp: string;
    summary: {
      servicesHealthy: number;
      servicesTotal: number;
      queueStatus: string;
      databaseStatus: string;
    };
  }> {
    this.logger.log('GET /platform-health - Quick health check');

    const [servicesHealth, queueHealth, databaseHealth] = await Promise.all([
      this.platformHealthService.getServiceHealth(),
      this.platformHealthService.getQueueHealth(),
      this.platformHealthService.getDatabaseHealth(),
    ]);

    // Determine overall status
    let status = 'healthy';
    if (
      servicesHealth.overallStatus === 'unhealthy' ||
      queueHealth.overallStatus === 'unhealthy' ||
      databaseHealth.overallStatus === 'unhealthy'
    ) {
      status = 'unhealthy';
    } else if (
      servicesHealth.overallStatus === 'degraded' ||
      queueHealth.overallStatus === 'degraded' ||
      databaseHealth.overallStatus === 'degraded'
    ) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      summary: {
        servicesHealthy: servicesHealth.summary.healthy,
        servicesTotal: servicesHealth.summary.total,
        queueStatus: queueHealth.overallStatus,
        databaseStatus: databaseHealth.overallStatus,
      },
    };
  }
}
