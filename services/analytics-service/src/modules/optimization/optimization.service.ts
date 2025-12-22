import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { subDays } from 'date-fns';
import { AnalyticsEvent, EventType } from '../analytics/entities/analytics-event.entity';
import {
  ApplicationSuccessQueryDto,
  OptimalTimeQueryDto,
  JobMatchScoreQueryDto,
  OptimizationReportQueryDto,
} from './dto/optimization-query.dto';
import {
  ApplicationSuccessAnalysisDto,
  SuccessFactorDto,
  IndustryBreakdownDto,
  CompanySizeAnalysisDto,
  JobLevelBreakdownDto,
  OptimalApplyTimeDto,
  HourlySuccessRateDto,
  DailySuccessRateDto,
  TimeWindowRecommendationDto,
  OptimalJobMatchScoreDto,
  ScoreThresholdAnalysisDto,
  OptimizationReportDto,
  OptimizationScoreDto,
  RecommendationDto,
  HistoricalComparisonDto,
} from './dto/optimization-response.dto';

@Injectable()
export class OptimizationService {
  private readonly logger = new Logger(OptimizationService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Analyze what makes applications successful
   * Identifies key factors correlated with positive outcomes
   */
  async analyzeApplicationSuccess(
    query: ApplicationSuccessQueryDto,
  ): Promise<ApplicationSuccessAnalysisDto> {
    this.logger.log('Analyzing application success factors');
    const { startDate, endDate } = this.getDateRange(query);

    try {
      // Get all application events
      const applications = await this.getApplicationEvents(startDate, endDate, query.userId);
      const acceptedApplications = await this.getAcceptedApplicationEvents(
        startDate,
        endDate,
        query.userId,
      );

      const totalApplications = applications.length;
      const successfulApplications = acceptedApplications.length;
      const overallSuccessRate =
        totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0;

      // Analyze success factors
      const successFactors = await this.analyzeSuccessFactors(
        applications,
        acceptedApplications,
        query.minSampleSize,
      );

      // Industry breakdown
      const industryBreakdown = query.includeIndustryBreakdown
        ? await this.analyzeIndustryBreakdown(applications, acceptedApplications)
        : [];

      // Company size analysis
      const companySizeAnalysis = query.includeCompanySizeAnalysis
        ? await this.analyzeCompanySize(applications, acceptedApplications)
        : [];

      // Job level breakdown
      const jobLevelBreakdown = query.includeJobLevelBreakdown
        ? await this.analyzeJobLevel(applications, acceptedApplications)
        : [];

      // Generate recommendations
      const recommendations = this.generateSuccessRecommendations(
        overallSuccessRate,
        successFactors,
        industryBreakdown,
        companySizeAnalysis,
      );

      // Calculate confidence score based on sample size
      const confidenceScore = this.calculateConfidenceScore(totalApplications, query.minSampleSize);

      return {
        overallSuccessRate: parseFloat(overallSuccessRate.toFixed(2)),
        totalApplicationsAnalyzed: totalApplications,
        totalSuccessfulApplications: successfulApplications,
        successFactors,
        industryBreakdown,
        companySizeAnalysis,
        jobLevelBreakdown,
        recommendations,
        analyzedAt: new Date().toISOString(),
        confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      };
    } catch (error) {
      this.logger.error('Failed to analyze application success', error.stack);
      throw error;
    }
  }

  /**
   * Determine best times to apply based on response rates
   * Analyzes hourly and daily patterns
   */
  async getOptimalApplyTime(query: OptimalTimeQueryDto): Promise<OptimalApplyTimeDto> {
    this.logger.log('Analyzing optimal application timing');
    const { startDate, endDate } = this.getDateRange(query);

    try {
      // Get applications with their outcomes
      const applicationEvents = await this.analyticsRepository
        .createQueryBuilder('event')
        .where('event.eventType = :eventType', { eventType: EventType.APPLICATION_SUBMITTED })
        .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getMany();

      const acceptedEvents = await this.analyticsRepository
        .createQueryBuilder('event')
        .where('event.eventType = :eventType', { eventType: EventType.APPLICATION_ACCEPTED })
        .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getMany();

      // Create a set of accepted application IDs
      const acceptedAppIds = new Set(acceptedEvents.map((e) => e.applicationId).filter(Boolean));

      // Analyze hourly patterns
      const hourlyBreakdown = this.analyzeHourlyPatterns(applicationEvents, acceptedAppIds);

      // Analyze daily patterns
      const dailyBreakdown = this.analyzeDailyPatterns(applicationEvents, acceptedAppIds);

      // Find best hour and day
      const bestHourData = hourlyBreakdown.reduce((best, current) =>
        current.successRate > best.successRate ? current : best,
      );
      const bestDayData = dailyBreakdown.reduce((best, current) =>
        current.successRate > best.successRate ? current : best,
      );

      // Generate time window recommendations
      const recommendedTimeWindows = this.generateTimeWindowRecommendations(
        hourlyBreakdown,
        dailyBreakdown,
      );

      // Generate insights
      const insights = this.generateTimingInsights(hourlyBreakdown, dailyBreakdown);

      const totalApplications = applicationEvents.length;
      const confidenceScore = this.calculateConfidenceScore(totalApplications, query.minSampleSize);

      return {
        bestHour: bestHourData.hour,
        bestDayOfWeek: bestDayData.dayOfWeek,
        bestDayName: bestDayData.dayName,
        hourlyBreakdown,
        dailyBreakdown,
        recommendedTimeWindows,
        timezone: query.timezone || 'UTC',
        totalApplicationsAnalyzed: totalApplications,
        insights,
        confidenceScore: parseFloat(confidenceScore.toFixed(2)),
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to analyze optimal apply time', error.stack);
      throw error;
    }
  }

  /**
   * Recommend optimal job match score threshold
   * Balances quality vs quantity of applications
   */
  async getOptimalJobMatchScore(query: JobMatchScoreQueryDto): Promise<OptimalJobMatchScoreDto> {
    this.logger.log('Analyzing optimal job match score threshold');
    const { startDate, endDate } = this.getDateRange(query);

    try {
      // Get applications with match scores from metadata
      const applications = await this.analyticsRepository
        .createQueryBuilder('event')
        .where('event.eventType = :eventType', { eventType: EventType.APPLICATION_SUBMITTED })
        .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere("event.metadata->>'matchScore' IS NOT NULL")
        .getMany();

      const acceptedEvents = await this.analyticsRepository
        .createQueryBuilder('event')
        .where('event.eventType = :eventType', { eventType: EventType.APPLICATION_ACCEPTED })
        .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getMany();

      const acceptedAppIds = new Set(acceptedEvents.map((e) => e.applicationId).filter(Boolean));

      // Analyze different thresholds
      const thresholds = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9];
      const thresholdAnalysis: ScoreThresholdAnalysisDto[] = [];

      for (const threshold of thresholds) {
        const analysis = this.analyzeThreshold(applications, acceptedAppIds, threshold);
        thresholdAnalysis.push(analysis);
      }

      // Calculate success rate by score buckets
      const successRateByScoreBucket = this.calculateSuccessRateByBucket(
        applications,
        acceptedAppIds,
      );

      // Find optimal threshold (best efficiency score)
      const optimalThresholdData = thresholdAnalysis.reduce((best, current) =>
        current.efficiencyScore > best.efficiencyScore ? current : best,
      );

      // Calculate optimal range
      const efficientThresholds = thresholdAnalysis.filter(
        (t) => t.efficiencyScore >= optimalThresholdData.efficiencyScore * 0.9,
      );
      const optimalRangeMin =
        efficientThresholds.length > 0
          ? Math.min(...efficientThresholds.map((t) => t.threshold))
          : 0.6;
      const optimalRangeMax =
        efficientThresholds.length > 0
          ? Math.max(...efficientThresholds.map((t) => t.threshold))
          : 0.8;

      // Calculate expected improvement
      let expectedImprovementPercent = 0;
      if (query.currentThreshold) {
        const currentAnalysis = thresholdAnalysis.find(
          (t) => Math.abs(t.threshold - query.currentThreshold!) < 0.05,
        );
        if (currentAnalysis) {
          expectedImprovementPercent =
            ((optimalThresholdData.successRate - currentAnalysis.successRate) /
              currentAnalysis.successRate) *
            100;
        }
      }

      // Generate recommendations
      const recommendations = this.generateMatchScoreRecommendations(
        optimalThresholdData,
        thresholdAnalysis,
        query.currentThreshold,
      );

      // Trade-off analysis
      const tradeOffAnalysis = {
        higherThreshold:
          'Higher thresholds yield better quality matches but fewer opportunities. Use when you can be selective.',
        lowerThreshold:
          'Lower thresholds provide more opportunities but may include weaker matches. Use when volume is important.',
        recommendation: `Based on your data, a threshold of ${optimalThresholdData.threshold.toFixed(2)} balances quality and quantity optimally.`,
      };

      const confidenceScore = this.calculateConfidenceScore(
        applications.length,
        query.minSampleSize,
      );

      return {
        recommendedThreshold: optimalThresholdData.threshold,
        optimalRangeMin,
        optimalRangeMax,
        currentThreshold: query.currentThreshold,
        expectedImprovementPercent: parseFloat(expectedImprovementPercent.toFixed(2)),
        thresholdAnalysis,
        successRateByScoreBucket,
        totalApplicationsAnalyzed: applications.length,
        recommendations,
        tradeOffAnalysis,
        confidenceScore: parseFloat(confidenceScore.toFixed(2)),
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to analyze optimal job match score', error.stack);
      throw error;
    }
  }

  /**
   * Generate comprehensive optimization report
   * Combines all analyses with prioritized recommendations
   */
  async generateOptimizationReport(
    query: OptimizationReportQueryDto,
  ): Promise<OptimizationReportDto> {
    this.logger.log('Generating comprehensive optimization report');
    const { startDate, endDate } = this.getDateRange(query);

    try {
      // Get all sub-analyses
      const successAnalysis = await this.analyzeApplicationSuccess({
        ...query,
        includeIndustryBreakdown: query.includeDetailedSections,
        includeCompanySizeAnalysis: query.includeDetailedSections,
        includeJobLevelBreakdown: query.includeDetailedSections,
      });

      const timingAnalysis = await this.getOptimalApplyTime({
        ...query,
        granularity: 'hour',
      });

      const matchScoreAnalysis = await this.getOptimalJobMatchScore(query);

      // Calculate optimization scores
      const scores = this.calculateOptimizationScores(
        successAnalysis,
        timingAnalysis,
        matchScoreAnalysis,
      );

      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(
        successAnalysis,
        timingAnalysis,
        matchScoreAnalysis,
        scores,
      );

      // Key statistics
      const keyStatistics = {
        totalApplications: successAnalysis.totalApplicationsAnalyzed,
        successRate: successAnalysis.overallSuccessRate,
        avgResponseTime: await this.calculateAverageResponseTime(startDate, endDate, query.userId),
        bestPerformingDay: timingAnalysis.bestDayName,
        bestPerformingHour: timingAnalysis.bestHour,
        optimalMatchScore: matchScoreAnalysis.recommendedThreshold,
      };

      // Generate prioritized recommendations
      const recommendations = this.generatePrioritizedRecommendations(
        successAnalysis,
        timingAnalysis,
        matchScoreAnalysis,
        query.topRecommendations,
      );

      // Historical comparison (if enabled)
      const historicalComparison = query.includeHistoricalComparison
        ? await this.generateHistoricalComparison(startDate, endDate, query.userId)
        : [];

      // Next steps
      const nextSteps = this.generateNextSteps(recommendations);

      // Overall confidence
      const confidenceScore =
        (successAnalysis.confidenceScore +
          timingAnalysis.confidenceScore +
          matchScoreAnalysis.confidenceScore) /
        3;

      return {
        title: 'Application Optimization Report',
        generatedAt: new Date().toISOString(),
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        userId: query.userId,
        scores,
        executiveSummary,
        keyStatistics,
        successAnalysis,
        timingAnalysis,
        matchScoreAnalysis,
        recommendations,
        historicalComparison,
        confidenceScore: parseFloat(confidenceScore.toFixed(2)),
        nextSteps,
      };
    } catch (error) {
      this.logger.error('Failed to generate optimization report', error.stack);
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  private getDateRange(query: { startDate?: string; endDate?: string }): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : subDays(endDate, 90);
    return { startDate, endDate };
  }

  private async getApplicationEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<AnalyticsEvent[]> {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('event')
      .where('event.eventType = :eventType', { eventType: EventType.APPLICATION_SUBMITTED })
      .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (userId) {
      queryBuilder.andWhere('event.userId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  private async getAcceptedApplicationEvents(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<AnalyticsEvent[]> {
    const queryBuilder = this.analyticsRepository
      .createQueryBuilder('event')
      .where('event.eventType = :eventType', { eventType: EventType.APPLICATION_ACCEPTED })
      .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (userId) {
      queryBuilder.andWhere('event.userId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  private async analyzeSuccessFactors(
    applications: AnalyticsEvent[],
    acceptedApplications: AnalyticsEvent[],
    minSampleSize: number = 30,
  ): Promise<SuccessFactorDto[]> {
    const acceptedAppIds = new Set(acceptedApplications.map((a) => a.applicationId).filter(Boolean));
    const successFactors: SuccessFactorDto[] = [];

    // Factor 1: Resume keyword match (from metadata)
    const appsWithKeywordMatch = applications.filter(
      (a) => a.metadata?.keywordMatchScore !== undefined,
    );
    if (appsWithKeywordMatch.length >= minSampleSize) {
      const highMatchApps = appsWithKeywordMatch.filter(
        (a) => (a.metadata?.keywordMatchScore || 0) >= 0.7,
      );
      const highMatchSuccess = highMatchApps.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );
      const lowMatchApps = appsWithKeywordMatch.filter(
        (a) => (a.metadata?.keywordMatchScore || 0) < 0.7,
      );
      const lowMatchSuccess = lowMatchApps.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );

      const highMatchRate = highMatchApps.length > 0 ? highMatchSuccess.length / highMatchApps.length : 0;
      const lowMatchRate = lowMatchApps.length > 0 ? lowMatchSuccess.length / lowMatchApps.length : 0;
      const correlation = highMatchRate - lowMatchRate;

      successFactors.push({
        factor: 'Resume keyword match',
        impactScore: Math.min(Math.abs(correlation) * 2, 1),
        correlation: parseFloat(correlation.toFixed(2)),
        sampleSize: appsWithKeywordMatch.length,
        description:
          'Applications with 70%+ keyword match have significantly higher success rates',
        recommendation: 'Tailor your resume to include job-specific keywords from the posting',
      });
    }

    // Factor 2: Application timing (early vs late)
    const appsWithPostingDate = applications.filter((a) => a.metadata?.jobPostedDate);
    if (appsWithPostingDate.length >= minSampleSize) {
      const earlyApps = appsWithPostingDate.filter((a) => {
        const postedDate = new Date(a.metadata?.jobPostedDate);
        const appliedDate = a.timestamp;
        const daysDiff = (appliedDate.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 3;
      });
      const earlySuccess = earlyApps.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );
      const lateApps = appsWithPostingDate.filter((a) => {
        const postedDate = new Date(a.metadata?.jobPostedDate);
        const appliedDate = a.timestamp;
        const daysDiff = (appliedDate.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 3;
      });
      const lateSuccess = lateApps.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );

      const earlyRate = earlyApps.length > 0 ? earlySuccess.length / earlyApps.length : 0;
      const lateRate = lateApps.length > 0 ? lateSuccess.length / lateApps.length : 0;
      const correlation = earlyRate - lateRate;

      successFactors.push({
        factor: 'Application timing',
        impactScore: Math.min(Math.abs(correlation) * 2, 1),
        correlation: parseFloat(correlation.toFixed(2)),
        sampleSize: appsWithPostingDate.length,
        description: 'Applying within 3 days of job posting correlates with higher success',
        recommendation: 'Set up job alerts and apply within 48 hours of new postings',
      });
    }

    // Factor 3: Cover letter included
    const appsWithCoverLetter = applications.filter(
      (a) => a.metadata?.hasCoverLetter !== undefined,
    );
    if (appsWithCoverLetter.length >= minSampleSize) {
      const withCL = appsWithCoverLetter.filter((a) => a.metadata?.hasCoverLetter === true);
      const withCLSuccess = withCL.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );
      const withoutCL = appsWithCoverLetter.filter((a) => a.metadata?.hasCoverLetter === false);
      const withoutCLSuccess = withoutCL.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );

      const withCLRate = withCL.length > 0 ? withCLSuccess.length / withCL.length : 0;
      const withoutCLRate = withoutCL.length > 0 ? withoutCLSuccess.length / withoutCL.length : 0;
      const correlation = withCLRate - withoutCLRate;

      successFactors.push({
        factor: 'Cover letter included',
        impactScore: Math.min(Math.abs(correlation) * 2, 1),
        correlation: parseFloat(correlation.toFixed(2)),
        sampleSize: appsWithCoverLetter.length,
        description: 'Applications with tailored cover letters show improved response rates',
        recommendation: 'Include a customized cover letter highlighting relevant experience',
      });
    }

    // Factor 4: Job match score
    const appsWithMatchScore = applications.filter((a) => a.metadata?.matchScore !== undefined);
    if (appsWithMatchScore.length >= minSampleSize) {
      const highMatch = appsWithMatchScore.filter((a) => (a.metadata?.matchScore || 0) >= 0.75);
      const highMatchSuccess = highMatch.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );
      const lowMatch = appsWithMatchScore.filter((a) => (a.metadata?.matchScore || 0) < 0.75);
      const lowMatchSuccess = lowMatch.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );

      const highRate = highMatch.length > 0 ? highMatchSuccess.length / highMatch.length : 0;
      const lowRate = lowMatch.length > 0 ? lowMatchSuccess.length / lowMatch.length : 0;
      const correlation = highRate - lowRate;

      successFactors.push({
        factor: 'Job match score',
        impactScore: Math.min(Math.abs(correlation) * 2, 1),
        correlation: parseFloat(correlation.toFixed(2)),
        sampleSize: appsWithMatchScore.length,
        description:
          'Higher job-skill alignment scores correlate with better application outcomes',
        recommendation: 'Focus on jobs with 75%+ match score for optimal results',
      });
    }

    // Sort by impact score
    return successFactors.sort((a, b) => b.impactScore - a.impactScore);
  }

  private async analyzeIndustryBreakdown(
    applications: AnalyticsEvent[],
    acceptedApplications: AnalyticsEvent[],
  ): Promise<IndustryBreakdownDto[]> {
    const acceptedAppIds = new Set(acceptedApplications.map((a) => a.applicationId).filter(Boolean));

    // Group by industry
    const industryMap = new Map<
      string,
      { total: number; successful: number; responseTimes: number[] }
    >();

    for (const app of applications) {
      const industry = app.metadata?.industry || 'Unknown';
      const current = industryMap.get(industry) || { total: 0, successful: 0, responseTimes: [] };
      current.total++;

      if (app.applicationId && acceptedAppIds.has(app.applicationId)) {
        current.successful++;
      }

      if (app.metadata?.responseTime) {
        current.responseTimes.push(app.metadata.responseTime);
      }

      industryMap.set(industry, current);
    }

    const breakdown: IndustryBreakdownDto[] = [];
    for (const [industry, data] of industryMap) {
      const avgResponseTime =
        data.responseTimes.length > 0
          ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length
          : 0;

      breakdown.push({
        industry,
        successRate: parseFloat(((data.successful / data.total) * 100).toFixed(2)),
        totalApplications: data.total,
        successfulApplications: data.successful,
        avgResponseTime: parseFloat(avgResponseTime.toFixed(1)),
        recommendation: this.getIndustryRecommendation(industry, data.successful / data.total),
      });
    }

    return breakdown.sort((a, b) => b.successRate - a.successRate);
  }

  private getIndustryRecommendation(industry: string, successRate: number): string {
    if (successRate > 0.3) {
      return `Strong performance in ${industry}. Continue targeting this industry.`;
    } else if (successRate > 0.15) {
      return `Average performance in ${industry}. Consider optimizing your approach.`;
    } else {
      return `Below average in ${industry}. Review job requirements alignment.`;
    }
  }

  private async analyzeCompanySize(
    applications: AnalyticsEvent[],
    acceptedApplications: AnalyticsEvent[],
  ): Promise<CompanySizeAnalysisDto[]> {
    const acceptedAppIds = new Set(acceptedApplications.map((a) => a.applicationId).filter(Boolean));

    const sizeCategories = [
      { name: 'Startup (1-50)', min: 1, max: 50 },
      { name: 'Small (51-200)', min: 51, max: 200 },
      { name: 'Medium (201-1000)', min: 201, max: 1000 },
      { name: 'Enterprise (1000+)', min: 1001, max: Infinity },
    ];

    const analysis: CompanySizeAnalysisDto[] = [];

    for (const category of sizeCategories) {
      const categoryApps = applications.filter((a) => {
        const size = a.metadata?.companySize || 0;
        return size >= category.min && size <= category.max;
      });

      if (categoryApps.length === 0) continue;

      const successful = categoryApps.filter(
        (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
      );

      const responseTimes = categoryApps
        .filter((a) => a.metadata?.responseTime)
        .map((a) => a.metadata.responseTime);

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

      const successRate = (successful.length / categoryApps.length) * 100;

      analysis.push({
        sizeCategory: category.name,
        successRate: parseFloat(successRate.toFixed(2)),
        totalApplications: categoryApps.length,
        avgTimeToResponse: parseFloat(avgResponseTime.toFixed(1)),
        competitionLevel: this.getCompetitionLevel(category.name, successRate),
      });
    }

    return analysis;
  }

  private getCompetitionLevel(
    sizeCategory: string,
    successRate: number,
  ): 'Low' | 'Medium' | 'High' | 'Very High' {
    if (successRate > 30) return 'Low';
    if (successRate > 20) return 'Medium';
    if (successRate > 10) return 'High';
    return 'Very High';
  }

  private async analyzeJobLevel(
    applications: AnalyticsEvent[],
    acceptedApplications: AnalyticsEvent[],
  ): Promise<JobLevelBreakdownDto[]> {
    const acceptedAppIds = new Set(acceptedApplications.map((a) => a.applicationId).filter(Boolean));

    const levelMap = new Map<string, { total: number; successful: number; salaries: string[] }>();

    for (const app of applications) {
      const level = app.metadata?.jobLevel || 'Unknown';
      const current = levelMap.get(level) || { total: 0, successful: 0, salaries: [] };
      current.total++;

      if (app.applicationId && acceptedAppIds.has(app.applicationId)) {
        current.successful++;
      }

      if (app.metadata?.salaryRange) {
        current.salaries.push(app.metadata.salaryRange);
      }

      levelMap.set(level, current);
    }

    const breakdown: JobLevelBreakdownDto[] = [];
    for (const [level, data] of levelMap) {
      const successRate = (data.successful / data.total) * 100;
      const interviewConversionRate = successRate * 1.5; // Simplified calculation

      breakdown.push({
        level,
        successRate: parseFloat(successRate.toFixed(2)),
        totalApplications: data.total,
        interviewConversionRate: parseFloat(Math.min(interviewConversionRate, 100).toFixed(2)),
        avgSalaryRange: data.salaries[0] || 'N/A',
      });
    }

    return breakdown.sort((a, b) => b.successRate - a.successRate);
  }

  private analyzeHourlyPatterns(
    applications: AnalyticsEvent[],
    acceptedAppIds: Set<string>,
  ): HourlySuccessRateDto[] {
    const hourlyData = new Map<number, { total: number; successful: number }>();

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyData.set(i, { total: 0, successful: 0 });
    }

    for (const app of applications) {
      const hour = app.timestamp.getHours();
      const data = hourlyData.get(hour)!;
      data.total++;
      if (app.applicationId && acceptedAppIds.has(app.applicationId)) {
        data.successful++;
      }
    }

    const totalSuccessRate =
      applications.length > 0
        ? applications.filter((a) => a.applicationId && acceptedAppIds.has(a.applicationId)).length /
          applications.length
        : 0;

    const breakdown: HourlySuccessRateDto[] = [];
    for (const [hour, data] of hourlyData) {
      const successRate = data.total > 0 ? (data.successful / data.total) * 100 : 0;
      const relativePerformance = totalSuccessRate > 0 ? successRate / 100 / totalSuccessRate : 1;

      breakdown.push({
        hour,
        successRate: parseFloat(successRate.toFixed(2)),
        applicationCount: data.total,
        relativePerformance: parseFloat(relativePerformance.toFixed(2)),
        priority: this.getTimePriority(relativePerformance),
      });
    }

    return breakdown;
  }

  private getTimePriority(relativePerformance: number): 'Low' | 'Medium' | 'High' | 'Optimal' {
    if (relativePerformance >= 1.3) return 'Optimal';
    if (relativePerformance >= 1.1) return 'High';
    if (relativePerformance >= 0.9) return 'Medium';
    return 'Low';
  }

  private analyzeDailyPatterns(
    applications: AnalyticsEvent[],
    acceptedAppIds: Set<string>,
  ): DailySuccessRateDto[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData = new Map<number, { total: number; successful: number; hourlySuccess: Map<number, { total: number; successful: number }> }>();

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dailyData.set(i, { total: 0, successful: 0, hourlySuccess: new Map() });
    }

    for (const app of applications) {
      const day = app.timestamp.getDay();
      const hour = app.timestamp.getHours();
      const data = dailyData.get(day)!;
      data.total++;

      if (!data.hourlySuccess.has(hour)) {
        data.hourlySuccess.set(hour, { total: 0, successful: 0 });
      }
      const hourData = data.hourlySuccess.get(hour)!;
      hourData.total++;

      if (app.applicationId && acceptedAppIds.has(app.applicationId)) {
        data.successful++;
        hourData.successful++;
      }
    }

    const breakdown: DailySuccessRateDto[] = [];
    for (const [day, data] of dailyData) {
      const successRate = data.total > 0 ? (data.successful / data.total) * 100 : 0;

      // Find best hours for this day
      const bestHours: number[] = [];
      const sortedHours = Array.from(data.hourlySuccess.entries())
        .filter(([_, hData]) => hData.total >= 3)
        .sort((a, b) => {
          const rateA = a[1].total > 0 ? a[1].successful / a[1].total : 0;
          const rateB = b[1].total > 0 ? b[1].successful / b[1].total : 0;
          return rateB - rateA;
        });

      for (let i = 0; i < Math.min(3, sortedHours.length); i++) {
        bestHours.push(sortedHours[i][0]);
      }

      breakdown.push({
        dayOfWeek: day,
        dayName: dayNames[day],
        successRate: parseFloat(successRate.toFixed(2)),
        applicationCount: data.total,
        bestHours: bestHours.sort((a, b) => a - b),
        recommendation: this.getDayRecommendation(dayNames[day], successRate, bestHours),
      });
    }

    return breakdown;
  }

  private getDayRecommendation(day: string, successRate: number, bestHours: number[]): string {
    if (successRate > 30 && bestHours.length > 0) {
      return `${day} is excellent! Apply between ${bestHours[0]}:00-${bestHours[0] + 2}:00 for best results`;
    } else if (successRate > 20 && bestHours.length > 0) {
      return `${day} shows good performance. Target ${bestHours.join(', ')}:00 hours`;
    } else if (successRate > 10) {
      return `${day} has moderate success. Consider focusing on other days`;
    } else {
      return `${day} has lower response rates. Apply on weekdays for better results`;
    }
  }

  private generateTimeWindowRecommendations(
    hourlyBreakdown: HourlySuccessRateDto[],
    dailyBreakdown: DailySuccessRateDto[],
  ): TimeWindowRecommendationDto[] {
    const recommendations: TimeWindowRecommendationDto[] = [];

    // Find best consecutive hours
    const sortedHours = [...hourlyBreakdown].sort((a, b) => b.successRate - a.successRate);
    const topHours = sortedHours.slice(0, 6);

    // Group consecutive hours
    const windows: { start: number; end: number; avgRate: number }[] = [];
    let currentWindow = { start: topHours[0]?.hour || 9, end: topHours[0]?.hour || 9, avgRate: topHours[0]?.successRate || 0 };

    for (let i = 1; i < topHours.length; i++) {
      if (Math.abs(topHours[i].hour - currentWindow.end) <= 2) {
        currentWindow.end = Math.max(currentWindow.end, topHours[i].hour);
        currentWindow.avgRate = (currentWindow.avgRate + topHours[i].successRate) / 2;
      } else {
        windows.push(currentWindow);
        currentWindow = { start: topHours[i].hour, end: topHours[i].hour, avgRate: topHours[i].successRate };
      }
    }
    windows.push(currentWindow);

    // Find best days
    const sortedDays = [...dailyBreakdown].sort((a, b) => b.successRate - a.successRate);
    const topDays = sortedDays.slice(0, 3).map((d) => d.dayName);

    // Create recommendations
    for (const window of windows.slice(0, 3)) {
      const avgOverall = hourlyBreakdown.reduce((sum, h) => sum + h.successRate, 0) / 24;
      const expectedLift = avgOverall > 0 ? ((window.avgRate - avgOverall) / avgOverall) * 100 : 0;

      recommendations.push({
        startHour: window.start,
        endHour: Math.min(window.end + 1, 23),
        bestDays: topDays,
        expectedLift: parseFloat(expectedLift.toFixed(1)),
        confidence: 0.75,
        reasoning:
          window.start >= 8 && window.start <= 11
            ? 'Morning hours when recruiters review applications'
            : window.start >= 13 && window.start <= 15
              ? 'Early afternoon before end-of-day rush'
              : 'Based on historical success patterns',
      });
    }

    return recommendations.sort((a, b) => b.expectedLift - a.expectedLift);
  }

  private generateTimingInsights(
    hourlyBreakdown: HourlySuccessRateDto[],
    dailyBreakdown: DailySuccessRateDto[],
  ): string[] {
    const insights: string[] = [];

    // Best vs worst hour comparison
    const bestHour = hourlyBreakdown.reduce((best, h) => (h.successRate > best.successRate ? h : best));
    const worstHour = hourlyBreakdown.reduce((worst, h) =>
      h.successRate < worst.successRate && h.applicationCount > 5 ? h : worst,
    );

    if (bestHour.successRate > worstHour.successRate * 1.5) {
      insights.push(
        `Applying at ${bestHour.hour}:00 is ${((bestHour.successRate / worstHour.successRate - 1) * 100).toFixed(0)}% more effective than ${worstHour.hour}:00`,
      );
    }

    // Weekend vs weekday
    const weekdayAvg =
      dailyBreakdown
        .filter((d) => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)
        .reduce((sum, d) => sum + d.successRate, 0) / 5;
    const weekendAvg =
      dailyBreakdown
        .filter((d) => d.dayOfWeek === 0 || d.dayOfWeek === 6)
        .reduce((sum, d) => sum + d.successRate, 0) / 2;

    if (weekdayAvg > weekendAvg * 1.2) {
      insights.push(
        `Weekday applications perform ${((weekdayAvg / weekendAvg - 1) * 100).toFixed(0)}% better than weekend submissions`,
      );
    }

    // Morning vs afternoon
    const morningAvg =
      hourlyBreakdown.filter((h) => h.hour >= 8 && h.hour < 12).reduce((sum, h) => sum + h.successRate, 0) / 4;
    const afternoonAvg =
      hourlyBreakdown.filter((h) => h.hour >= 14 && h.hour < 18).reduce((sum, h) => sum + h.successRate, 0) / 4;

    if (morningAvg > afternoonAvg * 1.1) {
      insights.push('Morning submissions (8 AM - 12 PM) show higher response rates');
    } else if (afternoonAvg > morningAvg * 1.1) {
      insights.push('Afternoon submissions (2 PM - 6 PM) show higher response rates');
    }

    // Best day insight
    const bestDay = dailyBreakdown.reduce((best, d) => (d.successRate > best.successRate ? d : best));
    insights.push(`${bestDay.dayName} is your most successful day for applications`);

    return insights;
  }

  private analyzeThreshold(
    applications: AnalyticsEvent[],
    acceptedAppIds: Set<string>,
    threshold: number,
  ): ScoreThresholdAnalysisDto {
    const totalApps = applications.length;
    const appsAtThreshold = applications.filter((a) => (a.metadata?.matchScore || 0) >= threshold);
    const successfulAtThreshold = appsAtThreshold.filter(
      (a) => a.applicationId && acceptedAppIds.has(a.applicationId),
    );

    const successRate =
      appsAtThreshold.length > 0 ? (successfulAtThreshold.length / appsAtThreshold.length) * 100 : 0;
    const jobPoolPercentage = totalApps > 0 ? (appsAtThreshold.length / totalApps) * 100 : 0;
    const expectedInterviews = (successRate / 100) * 100; // per 100 applications
    const efficiencyScore =
      jobPoolPercentage > 0 ? (successRate * successRate) / jobPoolPercentage / 100 : 0;

    return {
      threshold,
      successRate: parseFloat(successRate.toFixed(2)),
      applicationCount: appsAtThreshold.length,
      jobPoolPercentage: parseFloat(jobPoolPercentage.toFixed(2)),
      expectedInterviewsPer100: parseFloat(expectedInterviews.toFixed(0)),
      efficiencyScore: parseFloat(efficiencyScore.toFixed(2)),
    };
  }

  private calculateSuccessRateByBucket(
    applications: AnalyticsEvent[],
    acceptedAppIds: Set<string>,
  ): Record<string, number> {
    const buckets: Record<string, { total: number; successful: number }> = {
      '0.5-0.6': { total: 0, successful: 0 },
      '0.6-0.7': { total: 0, successful: 0 },
      '0.7-0.8': { total: 0, successful: 0 },
      '0.8-0.9': { total: 0, successful: 0 },
      '0.9-1.0': { total: 0, successful: 0 },
    };

    for (const app of applications) {
      const score = app.metadata?.matchScore || 0;
      let bucket: string;

      if (score >= 0.9) bucket = '0.9-1.0';
      else if (score >= 0.8) bucket = '0.8-0.9';
      else if (score >= 0.7) bucket = '0.7-0.8';
      else if (score >= 0.6) bucket = '0.6-0.7';
      else bucket = '0.5-0.6';

      buckets[bucket].total++;
      if (app.applicationId && acceptedAppIds.has(app.applicationId)) {
        buckets[bucket].successful++;
      }
    }

    const result: Record<string, number> = {};
    for (const [bucket, data] of Object.entries(buckets)) {
      result[bucket] = data.total > 0 ? parseFloat(((data.successful / data.total) * 100).toFixed(2)) : 0;
    }

    return result;
  }

  private generateMatchScoreRecommendations(
    optimalData: ScoreThresholdAnalysisDto,
    allAnalysis: ScoreThresholdAnalysisDto[],
    currentThreshold?: number,
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(
      `Set your minimum match score to ${(optimalData.threshold * 100).toFixed(0)}% for optimal results`,
    );

    if (currentThreshold && currentThreshold !== optimalData.threshold) {
      if (currentThreshold < optimalData.threshold) {
        recommendations.push(
          `Increasing your threshold from ${(currentThreshold * 100).toFixed(0)}% to ${(optimalData.threshold * 100).toFixed(0)}% could improve success rate by ${(optimalData.successRate - (allAnalysis.find((a) => a.threshold === currentThreshold)?.successRate || 0)).toFixed(1)}%`,
        );
      } else {
        recommendations.push(
          `Lowering your threshold from ${(currentThreshold * 100).toFixed(0)}% to ${(optimalData.threshold * 100).toFixed(0)}% could increase opportunities by ${((optimalData.jobPoolPercentage / (allAnalysis.find((a) => a.threshold === currentThreshold)?.jobPoolPercentage || 1) - 1) * 100).toFixed(0)}%`,
        );
      }
    }

    // Volume vs quality recommendation
    const highThreshold = allAnalysis.find((a) => a.threshold === 0.85);
    const lowThreshold = allAnalysis.find((a) => a.threshold === 0.6);

    if (highThreshold && lowThreshold) {
      if (highThreshold.successRate > lowThreshold.successRate * 1.5) {
        recommendations.push(
          'Quality over quantity: Higher match scores significantly improve your success rate',
        );
      } else {
        recommendations.push(
          'Consider applying more broadly - the success rate difference is manageable',
        );
      }
    }

    return recommendations;
  }

  private generateSuccessRecommendations(
    overallSuccessRate: number,
    successFactors: SuccessFactorDto[],
    industryBreakdown: IndustryBreakdownDto[],
    companySizeAnalysis: CompanySizeAnalysisDto[],
  ): string[] {
    const recommendations: string[] = [];

    // Based on success rate
    if (overallSuccessRate < 10) {
      recommendations.push(
        'Your success rate is below average. Focus on improving resume-job alignment.',
      );
    } else if (overallSuccessRate < 20) {
      recommendations.push(
        'Good progress! Fine-tune your application strategy with the insights below.',
      );
    } else {
      recommendations.push(
        'Excellent success rate! Continue with your current strategy.',
      );
    }

    // Top success factors
    for (const factor of successFactors.slice(0, 3)) {
      if (factor.impactScore > 0.5) {
        recommendations.push(factor.recommendation);
      }
    }

    // Best performing industry
    if (industryBreakdown.length > 0) {
      const topIndustry = industryBreakdown[0];
      if (topIndustry.successRate > overallSuccessRate * 1.2) {
        recommendations.push(
          `Focus on ${topIndustry.industry} - your success rate is ${topIndustry.successRate.toFixed(1)}% in this sector`,
        );
      }
    }

    // Company size recommendation
    if (companySizeAnalysis.length > 0) {
      const bestSize = companySizeAnalysis.reduce((best, curr) =>
        curr.successRate > best.successRate ? curr : best,
      );
      recommendations.push(
        `${bestSize.sizeCategory} companies show the best response rate for your profile`,
      );
    }

    return recommendations;
  }

  private calculateConfidenceScore(sampleSize: number, minSampleSize: number = 30): number {
    if (sampleSize < minSampleSize) {
      return (sampleSize / minSampleSize) * 0.6; // Cap at 0.6 for small samples
    }
    if (sampleSize < 100) {
      return 0.6 + ((sampleSize - minSampleSize) / (100 - minSampleSize)) * 0.2;
    }
    if (sampleSize < 500) {
      return 0.8 + ((sampleSize - 100) / 400) * 0.15;
    }
    return 0.95;
  }

  private calculateOptimizationScores(
    successAnalysis: ApplicationSuccessAnalysisDto,
    timingAnalysis: OptimalApplyTimeDto,
    matchScoreAnalysis: OptimalJobMatchScoreDto,
  ): OptimizationScoreDto {
    // Timing score: how well applications are distributed across optimal times
    const optimalHours = timingAnalysis.hourlyBreakdown.filter((h) => h.priority === 'Optimal' || h.priority === 'High');
    const timingScore = Math.min(100, optimalHours.length * 10 + timingAnalysis.confidenceScore * 30);

    // Targeting score: based on success rate and match score optimization
    const targetingScore = Math.min(
      100,
      successAnalysis.overallSuccessRate * 2 + matchScoreAnalysis.confidenceScore * 30,
    );

    // Resume quality: inferred from success factors
    const keywordFactor = successAnalysis.successFactors.find((f) => f.factor.includes('keyword'));
    const resumeQualityScore = keywordFactor
      ? Math.min(100, keywordFactor.impactScore * 100 + 20)
      : 50;

    // Application volume: based on total analyzed
    const volumeScore = Math.min(100, (successAnalysis.totalApplicationsAnalyzed / 500) * 100);

    // Overall score
    const overall = (timingScore + targetingScore + resumeQualityScore + volumeScore) / 4;

    return {
      overall: Math.round(overall),
      timing: Math.round(timingScore),
      targeting: Math.round(targetingScore),
      resumeQuality: Math.round(resumeQualityScore),
      applicationVolume: Math.round(volumeScore),
    };
  }

  private generateExecutiveSummary(
    successAnalysis: ApplicationSuccessAnalysisDto,
    timingAnalysis: OptimalApplyTimeDto,
    matchScoreAnalysis: OptimalJobMatchScoreDto,
    scores: OptimizationScoreDto,
  ): string[] {
    const summary: string[] = [];

    // Overall performance
    summary.push(
      `Your overall optimization score is ${scores.overall}/100 based on ${successAnalysis.totalApplicationsAnalyzed} applications analyzed.`,
    );

    // Success rate context
    if (successAnalysis.overallSuccessRate > 25) {
      summary.push(
        `Excellent success rate of ${successAnalysis.overallSuccessRate.toFixed(1)}% - well above industry average.`,
      );
    } else if (successAnalysis.overallSuccessRate > 15) {
      summary.push(
        `Good success rate of ${successAnalysis.overallSuccessRate.toFixed(1)}% - on par with industry standards.`,
      );
    } else {
      summary.push(
        `Success rate of ${successAnalysis.overallSuccessRate.toFixed(1)}% has room for improvement.`,
      );
    }

    // Key insight
    summary.push(
      `Best results when applying on ${timingAnalysis.bestDayName}s around ${timingAnalysis.bestHour}:00.`,
    );

    // Match score insight
    summary.push(
      `Optimal job match threshold is ${(matchScoreAnalysis.recommendedThreshold * 100).toFixed(0)}%.`,
    );

    return summary;
  }

  private async calculateAverageResponseTime(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<number> {
    // Simplified calculation - would need actual response time data
    const applications = await this.getApplicationEvents(startDate, endDate, userId);
    const responseTimes = applications
      .filter((a) => a.metadata?.responseTime)
      .map((a) => a.metadata.responseTime);

    if (responseTimes.length === 0) return 5.0; // Default

    return parseFloat(
      (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1),
    );
  }

  private generatePrioritizedRecommendations(
    successAnalysis: ApplicationSuccessAnalysisDto,
    timingAnalysis: OptimalApplyTimeDto,
    matchScoreAnalysis: OptimalJobMatchScoreDto,
    topN: number = 10,
  ): RecommendationDto[] {
    const recommendations: RecommendationDto[] = [];
    let idCounter = 1;

    // Timing recommendations
    if (timingAnalysis.recommendedTimeWindows.length > 0) {
      const topWindow = timingAnalysis.recommendedTimeWindows[0];
      recommendations.push({
        id: `rec_${String(idCounter++).padStart(3, '0')}`,
        category: 'Timing',
        priority: topWindow.expectedLift > 15 ? 'High' : 'Medium',
        title: 'Optimize application timing',
        description: `Apply between ${topWindow.startHour}:00-${topWindow.endHour}:00 on ${topWindow.bestDays.join(', ')}`,
        expectedImpact: `+${topWindow.expectedLift.toFixed(0)}% response rate`,
        expectedImprovementPercent: topWindow.expectedLift,
        effortLevel: 'Low',
        actionItems: [
          `Schedule applications for ${topWindow.startHour}:00-${topWindow.endHour}:00`,
          `Prioritize ${topWindow.bestDays[0]} for important applications`,
          'Set up calendar reminders for optimal application windows',
        ],
      });
    }

    // Match score recommendation
    if (matchScoreAnalysis.expectedImprovementPercent > 5) {
      recommendations.push({
        id: `rec_${String(idCounter++).padStart(3, '0')}`,
        category: 'Targeting',
        priority: matchScoreAnalysis.expectedImprovementPercent > 15 ? 'High' : 'Medium',
        title: 'Adjust job match threshold',
        description: `Set minimum match score to ${(matchScoreAnalysis.recommendedThreshold * 100).toFixed(0)}%`,
        expectedImpact: `+${matchScoreAnalysis.expectedImprovementPercent.toFixed(0)}% success rate`,
        expectedImprovementPercent: matchScoreAnalysis.expectedImprovementPercent,
        effortLevel: 'Low',
        actionItems: [
          `Update job search filters to ${(matchScoreAnalysis.recommendedThreshold * 100).toFixed(0)}% minimum match`,
          'Focus on jobs in your optimal range',
          'Review and skip jobs below threshold',
        ],
      });
    }

    // Success factor recommendations
    for (const factor of successAnalysis.successFactors.slice(0, 3)) {
      if (factor.impactScore > 0.3) {
        recommendations.push({
          id: `rec_${String(idCounter++).padStart(3, '0')}`,
          category: factor.factor.includes('Resume') ? 'Resume' : 'Strategy',
          priority: factor.impactScore > 0.7 ? 'High' : 'Medium',
          title: `Improve ${factor.factor.toLowerCase()}`,
          description: factor.description,
          expectedImpact: `+${(factor.correlation * 100).toFixed(0)}% correlation with success`,
          expectedImprovementPercent: factor.correlation * 100,
          effortLevel: factor.factor.includes('Resume') ? 'Medium' : 'Low',
          actionItems: [factor.recommendation],
        });
      }
    }

    // Volume recommendation if needed
    if (successAnalysis.totalApplicationsAnalyzed < 50) {
      recommendations.push({
        id: `rec_${String(idCounter++).padStart(3, '0')}`,
        category: 'Volume',
        priority: 'Medium',
        title: 'Increase application volume',
        description: 'More applications provide better data for optimization',
        expectedImpact: 'Better insights and more opportunities',
        expectedImprovementPercent: 20,
        effortLevel: 'High',
        actionItems: [
          'Set daily application goals',
          'Use job alerts to find new opportunities',
          'Expand job search criteria slightly',
        ],
      });
    }

    // Industry-specific recommendation
    if (successAnalysis.industryBreakdown.length > 0) {
      const topIndustry = successAnalysis.industryBreakdown[0];
      if (topIndustry.successRate > successAnalysis.overallSuccessRate * 1.3) {
        recommendations.push({
          id: `rec_${String(idCounter++).padStart(3, '0')}`,
          category: 'Targeting',
          priority: 'High',
          title: `Focus on ${topIndustry.industry}`,
          description: `Your success rate in ${topIndustry.industry} is ${topIndustry.successRate.toFixed(1)}%`,
          expectedImpact: `${((topIndustry.successRate / successAnalysis.overallSuccessRate - 1) * 100).toFixed(0)}% above average`,
          expectedImprovementPercent:
            (topIndustry.successRate / successAnalysis.overallSuccessRate - 1) * 100,
          effortLevel: 'Low',
          actionItems: [
            `Prioritize ${topIndustry.industry} job postings`,
            `Tailor resume for ${topIndustry.industry}`,
            `Research ${topIndustry.industry} specific requirements`,
          ],
        });
      }
    }

    // Sort by expected improvement and return top N
    return recommendations
      .sort((a, b) => b.expectedImprovementPercent - a.expectedImprovementPercent)
      .slice(0, topN);
  }

  private async generateHistoricalComparison(
    currentStart: Date,
    currentEnd: Date,
    userId?: string,
  ): Promise<HistoricalComparisonDto[]> {
    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = currentStart;

    // Get current period data
    const currentApps = await this.getApplicationEvents(currentStart, currentEnd, userId);
    const currentAccepted = await this.getAcceptedApplicationEvents(currentStart, currentEnd, userId);

    // Get previous period data
    const previousApps = await this.getApplicationEvents(previousStart, previousEnd, userId);
    const previousAccepted = await this.getAcceptedApplicationEvents(previousStart, previousEnd, userId);

    const comparisons: HistoricalComparisonDto[] = [];

    // Application volume
    const currentVolume = currentApps.length;
    const previousVolume = previousApps.length;
    const volumeChange = currentVolume - previousVolume;
    const volumeChangePercent = previousVolume > 0 ? (volumeChange / previousVolume) * 100 : 0;

    comparisons.push({
      metric: 'Application Volume',
      currentValue: currentVolume,
      previousValue: previousVolume,
      change: volumeChange,
      changePercent: parseFloat(volumeChangePercent.toFixed(1)),
      trend: volumeChange > 0 ? 'up' : volumeChange < 0 ? 'down' : 'stable',
    });

    // Success rate
    const currentRate = currentApps.length > 0 ? (currentAccepted.length / currentApps.length) * 100 : 0;
    const previousRate = previousApps.length > 0 ? (previousAccepted.length / previousApps.length) * 100 : 0;
    const rateChange = currentRate - previousRate;

    comparisons.push({
      metric: 'Success Rate',
      currentValue: parseFloat(currentRate.toFixed(1)),
      previousValue: parseFloat(previousRate.toFixed(1)),
      change: parseFloat(rateChange.toFixed(1)),
      changePercent: previousRate > 0 ? parseFloat(((rateChange / previousRate) * 100).toFixed(1)) : 0,
      trend: rateChange > 1 ? 'up' : rateChange < -1 ? 'down' : 'stable',
    });

    // Total interviews
    comparisons.push({
      metric: 'Interviews Secured',
      currentValue: currentAccepted.length,
      previousValue: previousAccepted.length,
      change: currentAccepted.length - previousAccepted.length,
      changePercent:
        previousAccepted.length > 0
          ? parseFloat(
              (
                ((currentAccepted.length - previousAccepted.length) / previousAccepted.length) *
                100
              ).toFixed(1),
            )
          : 0,
      trend:
        currentAccepted.length > previousAccepted.length
          ? 'up'
          : currentAccepted.length < previousAccepted.length
            ? 'down'
            : 'stable',
    });

    return comparisons;
  }

  private generateNextSteps(recommendations: RecommendationDto[]): string[] {
    const nextSteps: string[] = [];

    // Get top 3 high-priority recommendations
    const highPriority = recommendations.filter((r) => r.priority === 'High' || r.priority === 'Critical');

    for (const rec of highPriority.slice(0, 3)) {
      if (rec.actionItems.length > 0) {
        nextSteps.push(rec.actionItems[0]);
      }
    }

    // Add general next steps if we don't have enough
    if (nextSteps.length < 3) {
      nextSteps.push('Review your top-performing applications and identify patterns');
    }
    if (nextSteps.length < 3) {
      nextSteps.push('Set up job alerts for your target roles and companies');
    }
    if (nextSteps.length < 3) {
      nextSteps.push('Schedule weekly review of your application metrics');
    }

    return nextSteps.slice(0, 5);
  }
}
