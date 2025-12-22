import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { OptimizationService } from './optimization.service';
import {
  ApplicationSuccessQueryDto,
  OptimalTimeQueryDto,
  JobMatchScoreQueryDto,
  OptimizationReportQueryDto,
} from './dto/optimization-query.dto';
import {
  ApplicationSuccessAnalysisDto,
  OptimalApplyTimeDto,
  OptimalJobMatchScoreDto,
  OptimizationReportDto,
} from './dto/optimization-response.dto';

/**
 * Optimization Controller
 * REST API endpoints for application optimization analysis
 */
@ApiTags('Optimization')
@Controller('api/v1/optimization')
@UseInterceptors(ClassSerializerInterceptor)
export class OptimizationController {
  private readonly logger = new Logger(OptimizationController.name);

  constructor(private readonly optimizationService: OptimizationService) {}

  /**
   * Analyze application success factors
   */
  @Get('success-factors')
  @ApiOperation({
    summary: 'Analyze application success factors',
    description:
      'Identifies key factors that correlate with successful applications, including industry breakdown, company size analysis, and job level insights.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application success analysis completed',
    type: ApplicationSuccessAnalysisDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter analysis by user ID',
  })
  @ApiQuery({
    name: 'minSampleSize',
    required: false,
    type: Number,
    description: 'Minimum sample size for statistical significance (default: 30)',
  })
  @ApiQuery({
    name: 'includeIndustryBreakdown',
    required: false,
    type: Boolean,
    description: 'Include industry-specific analysis (default: true)',
  })
  @ApiQuery({
    name: 'includeCompanySizeAnalysis',
    required: false,
    type: Boolean,
    description: 'Include company size analysis (default: true)',
  })
  @ApiQuery({
    name: 'includeJobLevelBreakdown',
    required: false,
    type: Boolean,
    description: 'Include job level breakdown (default: true)',
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Failed to analyze success factors' })
  async analyzeApplicationSuccess(
    @Query() query: ApplicationSuccessQueryDto,
  ): Promise<ApplicationSuccessAnalysisDto> {
    this.logger.log(
      `GET /success-factors - Analyzing success factors${query.userId ? ` for user ${query.userId}` : ''}`,
    );
    return this.optimizationService.analyzeApplicationSuccess(query);
  }

  /**
   * Get optimal application timing
   */
  @Get('optimal-time')
  @ApiOperation({
    summary: 'Get optimal application timing',
    description:
      'Analyzes historical data to determine the best times to submit applications based on response rates. Returns hourly and daily breakdowns with recommendations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimal timing analysis completed',
    type: OptimalApplyTimeDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter analysis by user ID',
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    type: String,
    description: 'Timezone for analysis (default: UTC)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day'],
    description: 'Analysis granularity (default: hour)',
  })
  @ApiQuery({
    name: 'minSampleSize',
    required: false,
    type: Number,
    description: 'Minimum sample size for statistical significance (default: 30)',
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Failed to analyze optimal timing' })
  async getOptimalApplyTime(@Query() query: OptimalTimeQueryDto): Promise<OptimalApplyTimeDto> {
    this.logger.log(
      `GET /optimal-time - Analyzing optimal timing${query.userId ? ` for user ${query.userId}` : ''}`,
    );
    return this.optimizationService.getOptimalApplyTime(query);
  }

  /**
   * Get optimal job match score threshold
   */
  @Get('match-score')
  @ApiOperation({
    summary: 'Get optimal job match score threshold',
    description:
      'Analyzes the relationship between job match scores and application success rates. Recommends optimal thresholds that balance quality and volume of applications.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Match score optimization analysis completed',
    type: OptimalJobMatchScoreDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter analysis by user ID',
  })
  @ApiQuery({
    name: 'currentThreshold',
    required: false,
    type: Number,
    description: 'Current threshold to compare against (0-1)',
  })
  @ApiQuery({
    name: 'confidenceLevel',
    required: false,
    type: Number,
    description: 'Minimum confidence level for recommendations (default: 0.8)',
  })
  @ApiQuery({
    name: 'minSampleSize',
    required: false,
    type: Number,
    description: 'Minimum sample size for statistical significance (default: 30)',
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Failed to analyze match score optimization' })
  async getOptimalJobMatchScore(
    @Query() query: JobMatchScoreQueryDto,
  ): Promise<OptimalJobMatchScoreDto> {
    this.logger.log(
      `GET /match-score - Analyzing optimal match score${query.userId ? ` for user ${query.userId}` : ''}`,
    );
    return this.optimizationService.getOptimalJobMatchScore(query);
  }

  /**
   * Generate comprehensive optimization report
   */
  @Get('report')
  @ApiOperation({
    summary: 'Generate comprehensive optimization report',
    description:
      'Generates a complete optimization report combining success factor analysis, timing optimization, match score recommendations, and prioritized action items.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimization report generated successfully',
    type: OptimizationReportDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analysis (ISO 8601)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter analysis by user ID',
  })
  @ApiQuery({
    name: 'includeDetailedSections',
    required: false,
    type: Boolean,
    description: 'Include detailed breakdown sections (default: true)',
  })
  @ApiQuery({
    name: 'includeHistoricalComparison',
    required: false,
    type: Boolean,
    description: 'Include historical comparison data (default: true)',
  })
  @ApiQuery({
    name: 'topRecommendations',
    required: false,
    type: Number,
    description: 'Number of top recommendations to include (default: 10)',
  })
  @ApiQuery({
    name: 'minSampleSize',
    required: false,
    type: Number,
    description: 'Minimum sample size for statistical significance (default: 30)',
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Failed to generate optimization report' })
  async generateOptimizationReport(
    @Query() query: OptimizationReportQueryDto,
  ): Promise<OptimizationReportDto> {
    this.logger.log(
      `GET /report - Generating optimization report${query.userId ? ` for user ${query.userId}` : ''}`,
    );
    return this.optimizationService.generateOptimizationReport(query);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the optimization service is running',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'optimization-service' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  async health() {
    return {
      status: 'ok',
      service: 'optimization-service',
      timestamp: new Date().toISOString(),
    };
  }
}
