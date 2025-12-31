import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UseGuards,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { RequiresTier } from '@applyforus/security';

import { Public } from '../../auth/public.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RecruiterPredictionService } from './recruiter-prediction.service';
import {
  PredictResponseDto,
  ResponsePredictionDto,
  PredictTimeToResponseDto,
  TimeToResponsePredictionDto,
  AnalyzePatternsDto,
  RecruiterPatternDto,
  ScoreEngagementDto,
  RecruiterEngagementDto,
  GetInsightsDto,
  RecruiterInsightsDto,
} from './dto';

/**
 * Controller for recruiter behavior prediction endpoints.
 * PREMIUM FEATURE: Requires PROFESSIONAL tier or higher
 *
 * Provides REST API endpoints for:
 * - Predicting recruiter response likelihood
 * - Estimating time to response
 * - Analyzing recruiter activity patterns
 * - Scoring recruiter engagement
 * - Getting actionable insights
 */
@ApiTags('recruiter-prediction')
@ApiBearerAuth()
@Controller('recruiter-prediction')
@UseGuards(JwtAuthGuard) // Require authentication for recruiter prediction endpoints
@UseInterceptors(ClassSerializerInterceptor)
@RequiresTier('professional') // Recruiter insights requires Professional tier
export class RecruiterPredictionController {
  constructor(private readonly predictionService: RecruiterPredictionService) {}

  /**
   * Predict the likelihood of a recruiter responding
   */
  @Post('predict-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Predict recruiter response likelihood',
    description:
      'Analyzes various factors to predict the probability of a recruiter responding to an application or message. Uses historical data, company characteristics, and other signals.',
  })
  @ApiResponse({
    status: 200,
    description: 'Response prediction calculated successfully',
    type: ResponsePredictionDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate prediction' })
  async predictRecruiterResponse(
    @Body() input: PredictResponseDto,
  ): Promise<ResponsePredictionDto> {
    const result = await this.predictionService.predictRecruiterResponse(input);

    return {
      recruiterId: result.recruiterId,
      likelihood: result.likelihood,
      confidenceScore: result.confidenceScore,
      factors: result.factors.map((f) => ({
        name: f.name,
        impact: f.impact,
        weight: f.weight,
        description: f.description,
      })),
      recommendation: result.recommendation,
      predictedOutcome: result.predictedOutcome,
    };
  }

  /**
   * Predict estimated time until a recruiter responds
   */
  @Post('predict-time')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Predict time to response',
    description:
      'Estimates how many days until a recruiter is likely to respond. Takes into account company size, role level, and historical response patterns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Time prediction calculated successfully',
    type: TimeToResponsePredictionDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate prediction' })
  async predictTimeToResponse(
    @Body() input: PredictTimeToResponseDto,
  ): Promise<TimeToResponsePredictionDto> {
    const result = await this.predictionService.predictTimeToResponse(input);

    return {
      recruiterId: result.recruiterId,
      estimatedDays: result.estimatedDays,
      estimatedRange: result.estimatedRange,
      confidenceScore: result.confidenceScore,
      basedOnSampleSize: result.basedOnSampleSize,
      factors: result.factors.map((f) => ({
        name: f.name,
        effect: f.effect,
        adjustmentDays: f.adjustmentDays,
        description: f.description,
      })),
    };
  }

  /**
   * Analyze recruiter activity patterns
   */
  @Post('analyze-patterns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze recruiter activity patterns',
    description:
      'Identifies when a recruiter is most active and responsive. Provides hourly and daily activity breakdowns, peak times, and seasonal patterns.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pattern analysis completed successfully',
    type: RecruiterPatternDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to analyze patterns' })
  async analyzeRecruiterPatterns(
    @Body() input: AnalyzePatternsDto,
  ): Promise<RecruiterPatternDto> {
    const result = await this.predictionService.analyzeRecruiterPatterns(input);

    return {
      recruiterId: result.recruiterId,
      activeHours: result.activeHours.map((h) => ({
        hour: h.hour,
        activityScore: h.activityScore,
        responseRate: h.responseRate,
        sampleSize: h.sampleSize,
      })),
      activeDays: result.activeDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        dayName: d.dayName,
        activityScore: d.activityScore,
        isHighActivity: d.isHighActivity,
      })),
      peakActivityTime: result.peakActivityTime,
      responseRateByDayOfWeek: result.responseRateByDayOfWeek.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        dayName: d.dayName,
        responseRate: d.responseRate,
        averageResponseTimeHours: d.averageResponseTimeHours,
      })),
      averageResponseTimeByDay: result.averageResponseTimeByDay.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        dayName: d.dayName,
        averageHours: d.averageHours,
        medianHours: d.medianHours,
      })),
      seasonalPatterns: result.seasonalPatterns?.map((s) => ({
        period: s.period,
        activityLevel: s.activityLevel,
        description: s.description,
      })),
    };
  }

  /**
   * Score recruiter engagement level
   */
  @Post('score-engagement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Score recruiter engagement',
    description:
      'Calculates an engagement score for a recruiter based on response rates, response times, and interaction patterns. Includes comparison with industry averages.',
  })
  @ApiResponse({
    status: 200,
    description: 'Engagement score calculated successfully',
    type: RecruiterEngagementDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to calculate engagement score' })
  async scoreRecruiterEngagement(
    @Body() input: ScoreEngagementDto,
  ): Promise<RecruiterEngagementDto> {
    const result = await this.predictionService.scoreRecruiterEngagement(input);

    return {
      recruiterId: result.recruiterId,
      overallScore: result.overallScore,
      engagementLevel: result.engagementLevel,
      metrics: {
        responseRate: result.metrics.responseRate,
        averageResponseTime: result.metrics.averageResponseTime,
        interactionFrequency: result.metrics.interactionFrequency,
        followThroughRate: result.metrics.followThroughRate,
        profileCompleteness: result.metrics.profileCompleteness,
        lastActiveDate: result.metrics.lastActiveDate instanceof Date
          ? result.metrics.lastActiveDate.toISOString()
          : (result.metrics.lastActiveDate as string | undefined),
        totalInteractions: result.metrics.totalInteractions,
      },
      trend: {
        direction: result.trend.direction,
        percentageChange: result.trend.percentageChange,
        period: result.trend.period,
        dataPoints: result.trend.dataPoints.map((p) => ({
          date: p.date,
          score: p.score,
        })),
      },
      comparison: {
        recruiterScore: result.comparison.recruiterScore,
        industryAverage: result.comparison.industryAverage,
        percentile: result.comparison.percentile,
        comparisonGroup: result.comparison.comparisonGroup,
      },
    };
  }

  /**
   * Get actionable insights about a recruiter
   */
  @Post('insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recruiter insights',
    description:
      'Generates actionable insights and recommendations for engaging with a specific recruiter. Includes risk assessment and opportunity scoring.',
  })
  @ApiResponse({
    status: 200,
    description: 'Insights generated successfully',
    type: RecruiterInsightsDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiInternalServerErrorResponse({ description: 'Failed to generate insights' })
  async getRecruiterInsights(@Body() input: GetInsightsDto): Promise<RecruiterInsightsDto> {
    const result = await this.predictionService.getRecruiterInsights(input);

    return {
      recruiterId: result.recruiterId,
      insights: result.insights.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        importance: i.importance,
        dataSupport: i.dataSupport,
      })),
      recommendations: result.recommendations.map((r) => ({
        id: r.id,
        action: r.action,
        rationale: r.rationale,
        priority: r.priority,
        expectedImpact: r.expectedImpact,
        confidence: r.confidence,
      })),
      riskAssessment: {
        overallRisk: result.riskAssessment.overallRisk,
        riskFactors: result.riskAssessment.riskFactors.map((f) => ({
          name: f.name,
          severity: f.severity,
          description: f.description,
        })),
        mitigationSuggestions: result.riskAssessment.mitigationSuggestions,
      },
      opportunityScore: result.opportunityScore,
      summary: result.summary,
    };
  }

  /**
   * Health check endpoint
   */
  @Post('health')
  @Public() // Health checks don't require authentication
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the recruiter prediction service is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'recruiter-prediction' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
      },
    },
  })
  async healthCheck() {
    return {
      status: 'ok',
      service: 'recruiter-prediction',
      timestamp: new Date().toISOString(),
    };
  }
}
