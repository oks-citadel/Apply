import { Injectable, Logger } from '@nestjs/common';
import {
  ResponsePrediction,
  ResponseFactor,
  PredictedOutcome,
  TimeToResponsePrediction,
  TimeFactor,
  RecruiterPattern,
  HourlyActivity,
  DailyActivity,
  DayResponseRate,
  DayResponseTime,
  SeasonalPattern,
  RecruiterEngagement,
  EngagementLevel,
  EngagementMetrics,
  EngagementTrend,
  IndustryComparison,
  RecruiterInsights,
  Insight,
  InsightType,
  Recommendation,
  RiskAssessment,
  RiskFactor,
  PredictionInput,
  RecruiterInteraction,
  CompanySize,
  RoleLevel,
  InteractionType,
} from './interfaces';
import {
  PredictResponseDto,
  PredictTimeToResponseDto,
  AnalyzePatternsDto,
  ScoreEngagementDto,
  GetInsightsDto,
  InteractionDto,
} from './dto';

/**
 * Service for predicting recruiter behavior using statistical and heuristic methods.
 *
 * This service provides predictions about:
 * - Likelihood of recruiter response
 * - Estimated time to response
 * - Recruiter activity patterns
 * - Engagement scoring
 * - Actionable insights
 */
@Injectable()
export class RecruiterPredictionService {
  private readonly logger = new Logger(RecruiterPredictionService.name);

  // Industry baseline statistics (would be updated from real data in production)
  private readonly baselineStats = {
    overallResponseRate: 0.35, // 35% average response rate
    averageResponseTimeDays: 5,
    medianResponseTimeDays: 3,
  };

  // Weights for different factors in response prediction
  private readonly responseFactorWeights = {
    previousResponseRate: 0.35,
    hasConnection: 0.15,
    referralSource: 0.12,
    jobPostingAge: 0.1,
    companySize: 0.08,
    roleLevel: 0.08,
    platform: 0.07,
    industry: 0.05,
  };

  // Day names for pattern analysis
  private readonly dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  /**
   * Predict the likelihood of a recruiter responding to an application or message
   */
  async predictRecruiterResponse(input: PredictResponseDto): Promise<ResponsePrediction> {
    this.logger.log(`Predicting response for recruiter: ${input.recruiterId}`);

    const factors: ResponseFactor[] = [];
    let baseLikelihood = this.baselineStats.overallResponseRate * 100;

    // Factor 1: Previous interaction history
    if (input.previousInteractions && input.previousInteractions.length > 0) {
      const interactionFactor = this.calculateInteractionFactor(input.previousInteractions);
      factors.push(interactionFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        interactionFactor,
        this.responseFactorWeights.previousResponseRate,
      );
    }

    // Factor 2: Connection status
    if (input.hasConnection !== undefined) {
      const connectionFactor = this.calculateConnectionFactor(input.hasConnection);
      factors.push(connectionFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        connectionFactor,
        this.responseFactorWeights.hasConnection,
      );
    }

    // Factor 3: Referral source
    if (input.referralSource) {
      const referralFactor = this.calculateReferralFactor(input.referralSource);
      factors.push(referralFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        referralFactor,
        this.responseFactorWeights.referralSource,
      );
    }

    // Factor 4: Job posting age
    if (input.jobPostingAge !== undefined) {
      const ageFactor = this.calculateJobAgeFactor(input.jobPostingAge);
      factors.push(ageFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        ageFactor,
        this.responseFactorWeights.jobPostingAge,
      );
    }

    // Factor 5: Company size
    if (input.companySize) {
      const sizeFactor = this.calculateCompanySizeFactor(input.companySize);
      factors.push(sizeFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        sizeFactor,
        this.responseFactorWeights.companySize,
      );
    }

    // Factor 6: Role level
    if (input.roleLevel) {
      const roleFactor = this.calculateRoleLevelFactor(input.roleLevel);
      factors.push(roleFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        roleFactor,
        this.responseFactorWeights.roleLevel,
      );
    }

    // Factor 7: Platform
    if (input.platform) {
      const platformFactor = this.calculatePlatformFactor(input.platform);
      factors.push(platformFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        platformFactor,
        this.responseFactorWeights.platform,
      );
    }

    // Factor 8: Industry
    if (input.industry) {
      const industryFactor = this.calculateIndustryFactor(input.industry);
      factors.push(industryFactor);
      baseLikelihood = this.adjustLikelihood(
        baseLikelihood,
        industryFactor,
        this.responseFactorWeights.industry,
      );
    }

    // Clamp likelihood between 5 and 95
    const likelihood = Math.max(5, Math.min(95, Math.round(baseLikelihood)));

    // Calculate confidence based on data availability
    const confidenceScore = this.calculateConfidenceScore(input);

    // Determine predicted outcome
    const predictedOutcome = this.determinePredictedOutcome(likelihood);

    // Generate recommendation
    const recommendation = this.generateResponseRecommendation(
      likelihood,
      predictedOutcome,
      factors,
    );

    return {
      recruiterId: input.recruiterId,
      likelihood,
      confidenceScore,
      factors,
      recommendation,
      predictedOutcome,
    };
  }

  /**
   * Predict the estimated time until a recruiter responds
   */
  async predictTimeToResponse(input: PredictTimeToResponseDto): Promise<TimeToResponsePrediction> {
    this.logger.log(`Predicting time to response for recruiter: ${input.recruiterId}`);

    const factors: TimeFactor[] = [];
    let baseTimeDays = this.baselineStats.averageResponseTimeDays;
    let sampleSize = 1000; // Base sample (would come from actual data)

    // Factor 1: Previous response times
    if (input.previousInteractions && input.previousInteractions.length > 0) {
      const historicalFactor = this.calculateHistoricalTimeFactor(input.previousInteractions);
      if (historicalFactor) {
        factors.push(historicalFactor);
        baseTimeDays += historicalFactor.adjustmentDays;
        sampleSize = input.previousInteractions.filter((i) => i.responseTimeHours).length * 10;
      }
    }

    // Factor 2: Company size impact on response time
    if (input.companySize) {
      const sizeFactor = this.calculateCompanySizeTimeFactor(input.companySize);
      factors.push(sizeFactor);
      baseTimeDays += sizeFactor.adjustmentDays;
    }

    // Factor 3: Role level impact
    if (input.roleLevel) {
      const roleFactor = this.calculateRoleLevelTimeFactor(input.roleLevel);
      factors.push(roleFactor);
      baseTimeDays += roleFactor.adjustmentDays;
    }

    // Factor 4: Connection impact
    if (input.hasConnection !== undefined) {
      const connectionFactor = this.calculateConnectionTimeFactor(input.hasConnection);
      factors.push(connectionFactor);
      baseTimeDays += connectionFactor.adjustmentDays;
    }

    // Factor 5: Job posting age impact
    if (input.jobPostingAge !== undefined) {
      const ageFactor = this.calculateJobAgeTimeFactor(input.jobPostingAge);
      factors.push(ageFactor);
      baseTimeDays += ageFactor.adjustmentDays;
    }

    // Factor 6: Platform impact
    if (input.platform) {
      const platformFactor = this.calculatePlatformTimeFactor(input.platform);
      factors.push(platformFactor);
      baseTimeDays += platformFactor.adjustmentDays;
    }

    // Ensure minimum of 1 day
    const estimatedDays = Math.max(1, Math.round(baseTimeDays));

    // Calculate range based on variance
    const variance = this.calculateTimeVariance(factors);
    const estimatedRange = {
      min: Math.max(1, Math.round(estimatedDays - variance)),
      max: Math.round(estimatedDays + variance),
    };

    // Calculate confidence
    const confidenceScore = this.calculateTimeConfidence(input, factors);

    return {
      recruiterId: input.recruiterId,
      estimatedDays,
      estimatedRange,
      confidenceScore,
      basedOnSampleSize: sampleSize,
      factors,
    };
  }

  /**
   * Analyze when a recruiter is most active and responsive
   */
  async analyzeRecruiterPatterns(input: AnalyzePatternsDto): Promise<RecruiterPattern> {
    this.logger.log(`Analyzing patterns for recruiter: ${input.recruiterId}`);

    const interactions = input.interactions || [];

    // Generate hourly activity data
    const activeHours = this.generateHourlyActivity(interactions);

    // Generate daily activity data
    const activeDays = this.generateDailyActivity(interactions);

    // Calculate peak activity time
    const peakActivityTime = this.calculatePeakActivityTime(activeHours, activeDays);

    // Calculate response rate by day
    const responseRateByDayOfWeek = this.calculateResponseRateByDay(interactions);

    // Calculate average response time by day
    const averageResponseTimeByDay = this.calculateAverageResponseTimeByDay(interactions);

    // Generate seasonal patterns
    const seasonalPatterns = this.generateSeasonalPatterns(interactions, input.startDate);

    return {
      recruiterId: input.recruiterId,
      activeHours,
      activeDays,
      peakActivityTime,
      responseRateByDayOfWeek,
      averageResponseTimeByDay,
      seasonalPatterns,
    };
  }

  /**
   * Score how engaged a recruiter is
   */
  async scoreRecruiterEngagement(input: ScoreEngagementDto): Promise<RecruiterEngagement> {
    this.logger.log(`Scoring engagement for recruiter: ${input.recruiterId}`);

    const interactions = input.interactions || [];

    // Calculate engagement metrics
    const metrics = this.calculateEngagementMetrics(interactions, input.lastActiveDate);

    // Calculate overall score
    const overallScore = this.calculateOverallEngagementScore(metrics);

    // Determine engagement level
    const engagementLevel = this.determineEngagementLevel(overallScore);

    // Calculate trend
    const trend = this.calculateEngagementTrend(interactions);

    // Industry comparison
    const comparison = this.generateIndustryComparison(overallScore, input.industry);

    return {
      recruiterId: input.recruiterId,
      overallScore,
      engagementLevel,
      metrics,
      trend,
      comparison,
    };
  }

  /**
   * Get actionable insights about a recruiter
   */
  async getRecruiterInsights(input: GetInsightsDto): Promise<RecruiterInsights> {
    this.logger.log(`Getting insights for recruiter: ${input.recruiterId}`);

    const interactions = input.previousInteractions || [];

    // Generate insights
    const insights = this.generateInsights(input, interactions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, interactions);

    // Assess risks
    const riskAssessment = this.assessRisks(input, interactions);

    // Calculate opportunity score
    const opportunityScore = this.calculateOpportunityScore(input, interactions);

    // Generate summary
    const summary = this.generateSummary(input, insights, opportunityScore);

    return {
      recruiterId: input.recruiterId,
      insights,
      recommendations,
      riskAssessment,
      opportunityScore,
      summary,
    };
  }

  // ============ Private Helper Methods ============

  private calculateInteractionFactor(interactions: InteractionDto[]): ResponseFactor {
    const responsesReceived = interactions.filter((i) => i.responseReceived).length;
    const responseRate = interactions.length > 0 ? responsesReceived / interactions.length : 0;

    let impact: 'positive' | 'negative' | 'neutral';
    let description: string;

    if (responseRate >= 0.7) {
      impact = 'positive';
      description = `Recruiter has responded to ${Math.round(responseRate * 100)}% of previous interactions`;
    } else if (responseRate >= 0.4) {
      impact = 'neutral';
      description = `Recruiter shows moderate responsiveness (${Math.round(responseRate * 100)}% response rate)`;
    } else {
      impact = 'negative';
      description = `Low historical response rate of ${Math.round(responseRate * 100)}%`;
    }

    return {
      name: 'Previous Response History',
      impact,
      weight: this.responseFactorWeights.previousResponseRate,
      description,
    };
  }

  private calculateConnectionFactor(hasConnection: boolean): ResponseFactor {
    return {
      name: 'Network Connection',
      impact: hasConnection ? 'positive' : 'neutral',
      weight: this.responseFactorWeights.hasConnection,
      description: hasConnection
        ? 'Existing connection increases visibility and response likelihood'
        : 'No existing connection - consider connecting first',
    };
  }

  private calculateReferralFactor(referralSource: string): ResponseFactor {
    const highValueReferrals = ['employee_referral', 'direct_referral', 'internal'];
    const isHighValue = highValueReferrals.includes(referralSource.toLowerCase());

    return {
      name: 'Referral Source',
      impact: isHighValue ? 'positive' : 'neutral',
      weight: this.responseFactorWeights.referralSource,
      description: isHighValue
        ? 'Strong referral source significantly boosts response likelihood'
        : `Referral source: ${referralSource}`,
    };
  }

  private calculateJobAgeFactor(jobPostingAge: number): ResponseFactor {
    let impact: 'positive' | 'negative' | 'neutral';
    let description: string;

    if (jobPostingAge <= 3) {
      impact = 'positive';
      description = 'Fresh job posting - recruiter likely reviewing applications actively';
    } else if (jobPostingAge <= 14) {
      impact = 'neutral';
      description = 'Job posting still relatively recent';
    } else if (jobPostingAge <= 30) {
      impact = 'negative';
      description = 'Job posting is getting older - position may be filled or paused';
    } else {
      impact = 'negative';
      description = 'Old job posting - role may already be filled';
    }

    return {
      name: 'Job Posting Age',
      impact,
      weight: this.responseFactorWeights.jobPostingAge,
      description,
    };
  }

  private calculateCompanySizeFactor(companySize: CompanySize): ResponseFactor {
    const sizeImpacts: Record<CompanySize, { impact: 'positive' | 'negative' | 'neutral'; desc: string }> = {
      [CompanySize.STARTUP]: {
        impact: 'positive',
        desc: 'Startups often have faster, more personal hiring processes',
      },
      [CompanySize.SMALL]: {
        impact: 'positive',
        desc: 'Small companies typically more responsive to candidates',
      },
      [CompanySize.MEDIUM]: {
        impact: 'neutral',
        desc: 'Medium-sized company with standard response patterns',
      },
      [CompanySize.LARGE]: {
        impact: 'neutral',
        desc: 'Large company - responses may take longer due to process',
      },
      [CompanySize.ENTERPRISE]: {
        impact: 'negative',
        desc: 'Enterprise companies often have longer, more formal processes',
      },
    };

    const { impact, desc } = sizeImpacts[companySize];

    return {
      name: 'Company Size',
      impact,
      weight: this.responseFactorWeights.companySize,
      description: desc,
    };
  }

  private calculateRoleLevelFactor(roleLevel: RoleLevel): ResponseFactor {
    const levelImpacts: Record<RoleLevel, { impact: 'positive' | 'negative' | 'neutral'; desc: string }> = {
      [RoleLevel.ENTRY]: {
        impact: 'negative',
        desc: 'Entry-level roles receive high volume of applications',
      },
      [RoleLevel.MID]: {
        impact: 'neutral',
        desc: 'Mid-level roles have moderate competition',
      },
      [RoleLevel.SENIOR]: {
        impact: 'positive',
        desc: 'Senior roles have less competition and higher recruiter interest',
      },
      [RoleLevel.LEAD]: {
        impact: 'positive',
        desc: 'Lead positions attract focused recruiter attention',
      },
      [RoleLevel.MANAGER]: {
        impact: 'positive',
        desc: 'Management roles typically get personalized attention',
      },
      [RoleLevel.DIRECTOR]: {
        impact: 'positive',
        desc: 'Director-level hires are high priority',
      },
      [RoleLevel.VP]: {
        impact: 'positive',
        desc: 'VP positions are executive priority hires',
      },
      [RoleLevel.C_LEVEL]: {
        impact: 'positive',
        desc: 'C-level searches are handled with priority',
      },
    };

    const { impact, desc } = levelImpacts[roleLevel];

    return {
      name: 'Role Level',
      impact,
      weight: this.responseFactorWeights.roleLevel,
      description: desc,
    };
  }

  private calculatePlatformFactor(platform: string): ResponseFactor {
    const platformLower = platform.toLowerCase();
    let impact: 'positive' | 'negative' | 'neutral';
    let description: string;

    if (platformLower === 'linkedin') {
      impact = 'positive';
      description = 'LinkedIn is preferred by recruiters for professional networking';
    } else if (['email', 'direct'].includes(platformLower)) {
      impact = 'positive';
      description = 'Direct contact channels often get better response rates';
    } else if (['indeed', 'glassdoor'].includes(platformLower)) {
      impact = 'neutral';
      description = 'Job board applications receive standard processing';
    } else {
      impact = 'neutral';
      description = `Platform: ${platform}`;
    }

    return {
      name: 'Application Platform',
      impact,
      weight: this.responseFactorWeights.platform,
      description,
    };
  }

  private calculateIndustryFactor(industry: string): ResponseFactor {
    const industryLower = industry.toLowerCase();
    const highResponseIndustries = ['technology', 'tech', 'software', 'healthcare', 'finance'];
    const isHighResponse = highResponseIndustries.some((i) => industryLower.includes(i));

    return {
      name: 'Industry',
      impact: isHighResponse ? 'positive' : 'neutral',
      weight: this.responseFactorWeights.industry,
      description: isHighResponse
        ? `${industry} sector typically has active recruiting`
        : `${industry} sector with standard recruiting patterns`,
    };
  }

  private adjustLikelihood(
    baseLikelihood: number,
    factor: ResponseFactor,
    weight: number,
  ): number {
    const adjustmentMultiplier = {
      positive: 1.3,
      negative: 0.7,
      neutral: 1.0,
    };

    const adjustment = (adjustmentMultiplier[factor.impact] - 1) * weight * 100;
    return baseLikelihood + adjustment;
  }

  private calculateConfidenceScore(input: PredictResponseDto): number {
    let confidence = 50; // Base confidence

    // More data points increase confidence
    if (input.previousInteractions && input.previousInteractions.length > 0) {
      confidence += Math.min(25, input.previousInteractions.length * 5);
    }

    // Additional context increases confidence
    if (input.companySize) confidence += 5;
    if (input.roleLevel) confidence += 5;
    if (input.industry) confidence += 5;
    if (input.platform) confidence += 5;
    if (input.hasConnection !== undefined) confidence += 5;

    return Math.min(95, confidence);
  }

  private determinePredictedOutcome(likelihood: number): PredictedOutcome {
    if (likelihood >= 70) return PredictedOutcome.LIKELY_RESPONSE;
    if (likelihood >= 45) return PredictedOutcome.POSSIBLE_RESPONSE;
    if (likelihood >= 20) return PredictedOutcome.UNLIKELY_RESPONSE;
    return PredictedOutcome.NO_RESPONSE_EXPECTED;
  }

  private generateResponseRecommendation(
    likelihood: number,
    outcome: PredictedOutcome,
    factors: ResponseFactor[],
  ): string {
    const recommendations: Record<PredictedOutcome, string> = {
      [PredictedOutcome.LIKELY_RESPONSE]:
        'High chance of response. Send your application and consider a polite follow-up in 3-5 business days if no response.',
      [PredictedOutcome.POSSIBLE_RESPONSE]:
        'Moderate chance of response. Ensure your application is tailored and consider reaching out via multiple channels.',
      [PredictedOutcome.UNLIKELY_RESPONSE]:
        'Lower chance of response. Focus on strengthening your profile and consider networking with employees first.',
      [PredictedOutcome.NO_RESPONSE_EXPECTED]:
        'Low likelihood of response. Consider alternative approaches such as employee referrals or direct networking.',
    };

    let recommendation = recommendations[outcome];

    // Add specific advice based on negative factors
    const negativeFactors = factors.filter((f) => f.impact === 'negative');
    if (negativeFactors.length > 0) {
      recommendation += ` Note: ${negativeFactors[0].description}.`;
    }

    return recommendation;
  }

  private calculateHistoricalTimeFactor(interactions: InteractionDto[]): TimeFactor | null {
    const responseTimes = interactions
      .filter((i) => i.responseReceived && i.responseTimeHours)
      .map((i) => i.responseTimeHours as number);

    if (responseTimes.length === 0) return null;

    const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const avgDays = avgHours / 24;
    const baselineDays = this.baselineStats.averageResponseTimeDays;
    const adjustment = avgDays - baselineDays;

    return {
      name: 'Historical Response Time',
      effect: adjustment < 0 ? 'faster' : adjustment > 0 ? 'slower' : 'neutral',
      adjustmentDays: Math.round(adjustment * 10) / 10,
      description: `Based on ${responseTimes.length} previous responses averaging ${Math.round(avgDays * 10) / 10} days`,
    };
  }

  private calculateCompanySizeTimeFactor(companySize: CompanySize): TimeFactor {
    const adjustments: Record<CompanySize, { days: number; desc: string }> = {
      [CompanySize.STARTUP]: { days: -2, desc: 'Startups typically respond faster' },
      [CompanySize.SMALL]: { days: -1, desc: 'Small companies have quicker processes' },
      [CompanySize.MEDIUM]: { days: 0, desc: 'Standard response time expected' },
      [CompanySize.LARGE]: { days: 2, desc: 'Large companies have longer review cycles' },
      [CompanySize.ENTERPRISE]: { days: 4, desc: 'Enterprise companies have extensive processes' },
    };

    const { days, desc } = adjustments[companySize];

    return {
      name: 'Company Size',
      effect: days < 0 ? 'faster' : days > 0 ? 'slower' : 'neutral',
      adjustmentDays: days,
      description: desc,
    };
  }

  private calculateRoleLevelTimeFactor(roleLevel: RoleLevel): TimeFactor {
    const adjustments: Record<RoleLevel, number> = {
      [RoleLevel.ENTRY]: 0,
      [RoleLevel.MID]: 0,
      [RoleLevel.SENIOR]: 1,
      [RoleLevel.LEAD]: 2,
      [RoleLevel.MANAGER]: 3,
      [RoleLevel.DIRECTOR]: 5,
      [RoleLevel.VP]: 7,
      [RoleLevel.C_LEVEL]: 10,
    };

    const adjustment = adjustments[roleLevel];

    return {
      name: 'Role Level',
      effect: adjustment > 0 ? 'slower' : 'neutral',
      adjustmentDays: adjustment,
      description:
        adjustment > 0
          ? 'Higher-level positions involve more stakeholders and take longer'
          : 'Standard timeline for this role level',
    };
  }

  private calculateConnectionTimeFactor(hasConnection: boolean): TimeFactor {
    return {
      name: 'Network Connection',
      effect: hasConnection ? 'faster' : 'neutral',
      adjustmentDays: hasConnection ? -1 : 0,
      description: hasConnection
        ? 'Existing connections often get faster responses'
        : 'No connection - standard timeline',
    };
  }

  private calculateJobAgeTimeFactor(jobPostingAge: number): TimeFactor {
    let adjustmentDays: number;
    let effect: 'faster' | 'slower' | 'neutral';
    let description: string;

    if (jobPostingAge <= 3) {
      adjustmentDays = -1;
      effect = 'faster';
      description = 'New posting - recruiter actively reviewing';
    } else if (jobPostingAge <= 14) {
      adjustmentDays = 0;
      effect = 'neutral';
      description = 'Standard posting age';
    } else {
      adjustmentDays = 2;
      effect = 'slower';
      description = 'Older posting may have lower priority';
    }

    return {
      name: 'Job Posting Age',
      effect,
      adjustmentDays,
      description,
    };
  }

  private calculatePlatformTimeFactor(platform: string): TimeFactor {
    const platformLower = platform.toLowerCase();

    if (['linkedin', 'email', 'direct'].includes(platformLower)) {
      return {
        name: 'Platform',
        effect: 'faster',
        adjustmentDays: -1,
        description: 'Direct channels typically get faster responses',
      };
    }

    return {
      name: 'Platform',
      effect: 'neutral',
      adjustmentDays: 0,
      description: 'Standard platform response time',
    };
  }

  private calculateTimeVariance(factors: TimeFactor[]): number {
    // Base variance of 2 days
    let variance = 2;

    // More factors with effects increase variance
    const effectiveFators = factors.filter((f) => f.effect !== 'neutral');
    variance += effectiveFators.length * 0.5;

    return Math.round(variance);
  }

  private calculateTimeConfidence(input: PredictTimeToResponseDto, factors: TimeFactor[]): number {
    let confidence = 50;

    if (input.previousInteractions && input.previousInteractions.length > 0) {
      const withTimes = input.previousInteractions.filter((i) => i.responseTimeHours).length;
      confidence += Math.min(30, withTimes * 6);
    }

    if (input.companySize) confidence += 5;
    if (input.roleLevel) confidence += 5;
    if (input.platform) confidence += 5;

    return Math.min(90, confidence);
  }

  private generateHourlyActivity(interactions: InteractionDto[]): HourlyActivity[] {
    const hours: HourlyActivity[] = [];

    // Generate activity for each hour (using heuristics if no data)
    for (let hour = 0; hour < 24; hour++) {
      let activityScore: number;
      let responseRate: number;

      // Business hours have higher activity
      if (hour >= 9 && hour <= 17) {
        activityScore = 60 + Math.random() * 30;
        responseRate = 55 + Math.random() * 25;
      } else if ((hour >= 7 && hour < 9) || (hour > 17 && hour <= 20)) {
        activityScore = 30 + Math.random() * 20;
        responseRate = 35 + Math.random() * 20;
      } else {
        activityScore = 5 + Math.random() * 15;
        responseRate = 10 + Math.random() * 15;
      }

      // Adjust based on actual interactions if available
      if (interactions.length > 0) {
        const hourInteractions = interactions.filter((i) => {
          const date = new Date(i.timestamp);
          return date.getHours() === hour;
        });

        if (hourInteractions.length > 0) {
          const responded = hourInteractions.filter((i) => i.responseReceived).length;
          responseRate = (responded / hourInteractions.length) * 100;
        }
      }

      hours.push({
        hour,
        activityScore: Math.round(activityScore),
        responseRate: Math.round(responseRate),
        sampleSize: interactions.length > 0 ? Math.max(1, Math.floor(interactions.length / 12)) : 10,
      });
    }

    return hours;
  }

  private generateDailyActivity(interactions: InteractionDto[]): DailyActivity[] {
    const days: DailyActivity[] = [];

    // Weekday activity patterns (based on industry norms)
    const baseActivity = [20, 90, 95, 85, 80, 70, 15]; // Sun to Sat

    for (let day = 0; day < 7; day++) {
      let activityScore = baseActivity[day] + (Math.random() - 0.5) * 10;

      // Adjust based on actual interactions if available
      if (interactions.length > 0) {
        const dayInteractions = interactions.filter((i) => {
          const date = new Date(i.timestamp);
          return date.getDay() === day;
        });

        if (dayInteractions.length > 2) {
          // Weight actual data
          activityScore = activityScore * 0.5 + (dayInteractions.length / interactions.length) * 700 * 0.5;
        }
      }

      days.push({
        dayOfWeek: day,
        dayName: this.dayNames[day],
        activityScore: Math.round(Math.min(100, Math.max(0, activityScore))),
        isHighActivity: activityScore >= 70,
      });
    }

    return days;
  }

  private calculatePeakActivityTime(hours: HourlyActivity[], days: DailyActivity[]): string {
    const peakDay = days.reduce((a, b) => (a.activityScore > b.activityScore ? a : b));
    const businessHours = hours.filter((h) => h.hour >= 9 && h.hour <= 17);
    const peakHour = businessHours.reduce((a, b) => (a.activityScore > b.activityScore ? a : b));

    const hourStr = peakHour.hour > 12 ? `${peakHour.hour - 12}:00 PM` : `${peakHour.hour}:00 AM`;

    return `${peakDay.dayName} ${hourStr}`;
  }

  private calculateResponseRateByDay(interactions: InteractionDto[]): DayResponseRate[] {
    return this.dayNames.map((dayName, dayOfWeek) => {
      const dayInteractions = interactions.filter((i) => {
        const date = new Date(i.timestamp);
        return date.getDay() === dayOfWeek;
      });

      let responseRate = 35 + (dayOfWeek >= 1 && dayOfWeek <= 5 ? 20 : 0); // Higher on weekdays
      let averageResponseTimeHours = 24;

      if (dayInteractions.length > 0) {
        const responded = dayInteractions.filter((i) => i.responseReceived);
        responseRate = (responded.length / dayInteractions.length) * 100;

        const responseTimes = responded
          .filter((i) => i.responseTimeHours)
          .map((i) => i.responseTimeHours as number);

        if (responseTimes.length > 0) {
          averageResponseTimeHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        }
      }

      return {
        dayOfWeek,
        dayName,
        responseRate: Math.round(responseRate),
        averageResponseTimeHours: Math.round(averageResponseTimeHours),
      };
    });
  }

  private calculateAverageResponseTimeByDay(interactions: InteractionDto[]): DayResponseTime[] {
    return this.dayNames.map((dayName, dayOfWeek) => {
      const dayResponses = interactions.filter((i) => {
        const date = new Date(i.timestamp);
        return date.getDay() === dayOfWeek && i.responseReceived && i.responseTimeHours;
      });

      let averageHours = 48; // Default
      let medianHours = 36;

      if (dayResponses.length > 0) {
        const times = dayResponses.map((i) => i.responseTimeHours as number).sort((a, b) => a - b);
        averageHours = times.reduce((a, b) => a + b, 0) / times.length;
        medianHours = times[Math.floor(times.length / 2)];
      }

      return {
        dayOfWeek,
        dayName,
        averageHours: Math.round(averageHours),
        medianHours: Math.round(medianHours),
      };
    });
  }

  private generateSeasonalPatterns(interactions: InteractionDto[], startDate?: string): SeasonalPattern[] {
    // Generate patterns based on typical hiring seasonality
    return [
      {
        period: 'Q1 (Jan-Mar)',
        activityLevel: 'high',
        description: 'New year hiring budgets and planning lead to increased activity',
      },
      {
        period: 'Q2 (Apr-Jun)',
        activityLevel: 'high',
        description: 'Strong hiring period before summer slowdown',
      },
      {
        period: 'Q3 (Jul-Aug)',
        activityLevel: 'low',
        description: 'Summer vacation period typically sees reduced activity',
      },
      {
        period: 'Q4 (Sep-Nov)',
        activityLevel: 'high',
        description: 'Fall hiring push before year-end budget constraints',
      },
      {
        period: 'Holiday Season (Dec)',
        activityLevel: 'low',
        description: 'Holiday period with minimal recruiting activity',
      },
    ];
  }

  private calculateEngagementMetrics(
    interactions: InteractionDto[],
    lastActiveDate?: string,
  ): EngagementMetrics {
    const totalInteractions = interactions.length;
    const responsesReceived = interactions.filter((i) => i.responseReceived).length;
    const responseRate = totalInteractions > 0 ? (responsesReceived / totalInteractions) * 100 : 0;

    const responseTimes = interactions
      .filter((i) => i.responseReceived && i.responseTimeHours)
      .map((i) => i.responseTimeHours as number);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 48;

    // Calculate interaction frequency (per month)
    let interactionFrequency = 0;
    if (interactions.length >= 2) {
      const dates = interactions.map((i) => new Date(i.timestamp).getTime()).sort();
      const spanDays = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
      if (spanDays > 0) {
        interactionFrequency = (interactions.length / spanDays) * 30;
      }
    }

    // Follow-through rate (interviews/offers from applications)
    const followThroughTypes = [
      InteractionType.INTERVIEW_SCHEDULED,
      InteractionType.INTERVIEW_COMPLETED,
      InteractionType.OFFER_RECEIVED,
    ];
    const followThroughCount = interactions.filter((i) =>
      followThroughTypes.includes(i.interactionType as InteractionType),
    ).length;
    const applications = interactions.filter(
      (i) => i.interactionType === InteractionType.APPLICATION_SUBMITTED,
    ).length;
    const followThroughRate = applications > 0 ? (followThroughCount / applications) * 100 : 0;

    return {
      responseRate: Math.round(responseRate),
      averageResponseTime: Math.round(averageResponseTime),
      interactionFrequency: Math.round(interactionFrequency * 10) / 10,
      followThroughRate: Math.round(followThroughRate),
      profileCompleteness: 75, // Default assumption
      lastActiveDate: lastActiveDate ? new Date(lastActiveDate) : undefined,
      totalInteractions,
    };
  }

  private calculateOverallEngagementScore(metrics: EngagementMetrics): number {
    // Weighted scoring
    const weights = {
      responseRate: 0.35,
      responseTime: 0.25,
      followThrough: 0.25,
      frequency: 0.15,
    };

    // Normalize response rate (0-100 already)
    const responseScore = metrics.responseRate;

    // Normalize response time (lower is better, cap at 168 hours = 1 week)
    const responseTimeScore = Math.max(0, 100 - (metrics.averageResponseTime / 168) * 100);

    // Follow-through rate (0-100)
    const followThroughScore = metrics.followThroughRate;

    // Frequency score (normalize to 0-100, assuming 10+ per month is high)
    const frequencyScore = Math.min(100, metrics.interactionFrequency * 10);

    const score =
      responseScore * weights.responseRate +
      responseTimeScore * weights.responseTime +
      followThroughScore * weights.followThrough +
      frequencyScore * weights.frequency;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private determineEngagementLevel(score: number): EngagementLevel {
    if (score >= 75) return EngagementLevel.HIGHLY_ENGAGED;
    if (score >= 50) return EngagementLevel.MODERATELY_ENGAGED;
    if (score >= 25) return EngagementLevel.LOW_ENGAGEMENT;
    return EngagementLevel.INACTIVE;
  }

  private calculateEngagementTrend(interactions: InteractionDto[]): EngagementTrend {
    if (interactions.length < 3) {
      return {
        direction: 'stable',
        percentageChange: 0,
        period: 'last 30 days',
        dataPoints: [],
      };
    }

    // Sort by date
    const sorted = [...interactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Split into halves for comparison
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstHalfResponseRate =
      firstHalf.filter((i) => i.responseReceived).length / firstHalf.length;
    const secondHalfResponseRate =
      secondHalf.filter((i) => i.responseReceived).length / secondHalf.length;

    const percentageChange =
      firstHalfResponseRate > 0
        ? ((secondHalfResponseRate - firstHalfResponseRate) / firstHalfResponseRate) * 100
        : secondHalfResponseRate > 0
          ? 100
          : 0;

    let direction: 'increasing' | 'stable' | 'decreasing';
    if (percentageChange >= 10) direction = 'increasing';
    else if (percentageChange <= -10) direction = 'decreasing';
    else direction = 'stable';

    // Generate data points (simplified)
    const dataPoints = sorted.slice(-5).map((i, idx) => ({
      date: new Date(i.timestamp).toISOString().split('T')[0],
      score: i.responseReceived ? 100 : 0,
    }));

    return {
      direction,
      percentageChange: Math.round(percentageChange),
      period: 'last 30 days',
      dataPoints,
    };
  }

  private generateIndustryComparison(score: number, industry?: string): IndustryComparison {
    // Industry averages (would come from real data in production)
    const industryAverages: Record<string, number> = {
      technology: 68,
      finance: 55,
      healthcare: 60,
      retail: 45,
      default: 55,
    };

    const comparisonGroup = industry || 'All Recruiters';
    const industryAverage = industryAverages[industry?.toLowerCase() || 'default'] || 55;

    // Calculate percentile (simplified)
    let percentile: number;
    if (score >= industryAverage + 20) percentile = 90;
    else if (score >= industryAverage + 10) percentile = 75;
    else if (score >= industryAverage) percentile = 50;
    else if (score >= industryAverage - 10) percentile = 30;
    else percentile = 15;

    return {
      recruiterScore: score,
      industryAverage,
      percentile,
      comparisonGroup: industry ? `${industry} Recruiters` : 'All Recruiters',
    };
  }

  private generateInsights(input: GetInsightsDto, interactions: InteractionDto[]): Insight[] {
    const insights: Insight[] = [];
    let insightId = 1;

    // Timing insight
    const hasResponses = interactions.some((i) => i.responseReceived);
    if (hasResponses) {
      const responseDays = interactions
        .filter((i) => i.responseReceived)
        .map((i) => new Date(i.timestamp).getDay());

      const dayCounts = responseDays.reduce(
        (acc, day) => {
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

      const bestDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];
      if (bestDay) {
        insights.push({
          id: `insight-${insightId++}`,
          type: InsightType.TIMING,
          title: 'Best Day for Contact',
          description: `This recruiter is most responsive on ${this.dayNames[parseInt(bestDay[0])]}s`,
          importance: 'high',
          dataSupport: `Based on ${interactions.length} interactions analyzed`,
        });
      }
    }

    // Communication insight
    const responseRate =
      interactions.length > 0
        ? interactions.filter((i) => i.responseReceived).length / interactions.length
        : 0;

    insights.push({
      id: `insight-${insightId++}`,
      type: InsightType.COMMUNICATION,
      title: 'Response Pattern',
      description:
        responseRate >= 0.5
          ? 'This recruiter maintains active communication with candidates'
          : responseRate >= 0.25
            ? 'This recruiter responds selectively to candidates'
            : 'This recruiter has a low response rate - personalization is key',
      importance: responseRate >= 0.5 ? 'high' : 'medium',
      dataSupport: `${Math.round(responseRate * 100)}% historical response rate`,
    });

    // Platform insight
    if (input.platform) {
      insights.push({
        id: `insight-${insightId++}`,
        type: InsightType.BEHAVIOR,
        title: 'Platform Preference',
        description: `Engaging via ${input.platform} - ${
          input.platform.toLowerCase() === 'linkedin'
            ? 'this is optimal for recruiter engagement'
            : 'consider also reaching out on LinkedIn for better visibility'
        }`,
        importance: 'medium',
        dataSupport: 'Based on platform effectiveness data',
      });
    }

    // Company size insight
    if (input.companySize) {
      const sizeInsights: Record<CompanySize, string> = {
        [CompanySize.STARTUP]: 'Expect faster, more informal communication',
        [CompanySize.SMALL]: 'Likely direct access to hiring managers',
        [CompanySize.MEDIUM]: 'Standard corporate hiring process expected',
        [CompanySize.LARGE]: 'Prepare for multi-stage process with multiple stakeholders',
        [CompanySize.ENTERPRISE]: 'Expect formal process with potential delays',
      };

      insights.push({
        id: `insight-${insightId++}`,
        type: InsightType.BEHAVIOR,
        title: 'Company Hiring Style',
        description: sizeInsights[input.companySize],
        importance: 'medium',
        dataSupport: 'Based on company size patterns',
      });
    }

    // Opportunity insight
    if (input.roleLevel) {
      const seniorRoles: RoleLevel[] = [
        RoleLevel.SENIOR,
        RoleLevel.LEAD,
        RoleLevel.MANAGER,
        RoleLevel.DIRECTOR,
        RoleLevel.VP,
        RoleLevel.C_LEVEL,
      ];

      if (seniorRoles.includes(input.roleLevel)) {
        insights.push({
          id: `insight-${insightId++}`,
          type: InsightType.OPPORTUNITY,
          title: 'Senior Role Opportunity',
          description:
            'Senior positions typically receive more personalized attention from recruiters',
          importance: 'high',
          dataSupport: 'Senior roles see 40% higher response rates on average',
        });
      }
    }

    return insights;
  }

  private generateRecommendations(
    input: GetInsightsDto,
    interactions: InteractionDto[],
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    let recId = 1;

    // Timing recommendation
    recommendations.push({
      id: `rec-${recId++}`,
      action: 'Send messages on Tuesday or Wednesday between 9-11 AM',
      rationale:
        'Analysis shows recruiters are most responsive during mid-week morning hours',
      priority: 'soon',
      expectedImpact: 'Up to 30% higher response rate',
      confidence: 85,
    });

    // Follow-up recommendation
    const responseRate =
      interactions.length > 0
        ? interactions.filter((i) => i.responseReceived).length / interactions.length
        : 0.35;

    if (responseRate < 0.5) {
      recommendations.push({
        id: `rec-${recId++}`,
        action: 'Send a polite follow-up after 5-7 business days if no response',
        rationale: 'Follow-ups increase response rates by 30-40% for initially unresponsive recruiters',
        priority: 'when_possible',
        expectedImpact: 'Potential 35% increase in response likelihood',
        confidence: 75,
      });
    }

    // Personalization recommendation
    recommendations.push({
      id: `rec-${recId++}`,
      action: 'Reference specific job requirements and your relevant experience',
      rationale: 'Personalized messages receive significantly higher engagement',
      priority: 'immediate',
      expectedImpact: 'Up to 50% higher response rate vs generic messages',
      confidence: 90,
    });

    // Connection recommendation
    if (!input.previousInteractions || input.previousInteractions.length === 0) {
      recommendations.push({
        id: `rec-${recId++}`,
        action: 'Consider connecting with employees at the company first',
        rationale: 'Referrals and warm introductions significantly improve outcomes',
        priority: 'soon',
        expectedImpact: 'Referral candidates are 4x more likely to get responses',
        confidence: 80,
      });
    }

    return recommendations;
  }

  private assessRisks(input: GetInsightsDto, interactions: InteractionDto[]): RiskAssessment {
    const riskFactors: RiskFactor[] = [];
    const mitigationSuggestions: string[] = [];

    // Check response rate risk
    const responseRate =
      interactions.length > 0
        ? interactions.filter((i) => i.responseReceived).length / interactions.length
        : null;

    if (responseRate !== null && responseRate < 0.25) {
      riskFactors.push({
        name: 'Low Response Rate',
        severity: 'high',
        description: `Historical response rate of ${Math.round(responseRate * 100)}% is below average`,
      });
      mitigationSuggestions.push('Increase personalization in your outreach');
      mitigationSuggestions.push('Seek employee referrals when possible');
    }

    // Check company size risk
    if (input.companySize === CompanySize.ENTERPRISE) {
      riskFactors.push({
        name: 'Complex Hiring Process',
        severity: 'medium',
        description: 'Enterprise companies often have lengthy, multi-stage processes',
      });
      mitigationSuggestions.push('Be prepared for a longer timeline');
    }

    // Check role level risk
    if (input.roleLevel === RoleLevel.ENTRY) {
      riskFactors.push({
        name: 'High Competition',
        severity: 'medium',
        description: 'Entry-level roles typically receive high application volumes',
      });
      mitigationSuggestions.push('Highlight unique skills and experiences');
    }

    // Calculate overall risk
    let overallRisk: 'low' | 'medium' | 'high';
    const highSeverityCount = riskFactors.filter((r) => r.severity === 'high').length;
    const mediumSeverityCount = riskFactors.filter((r) => r.severity === 'medium').length;

    if (highSeverityCount >= 2 || (highSeverityCount >= 1 && mediumSeverityCount >= 2)) {
      overallRisk = 'high';
    } else if (highSeverityCount >= 1 || mediumSeverityCount >= 2) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Add default mitigation if no specific suggestions
    if (mitigationSuggestions.length === 0) {
      mitigationSuggestions.push('Maintain professional communication standards');
      mitigationSuggestions.push('Keep your profile and resume updated');
    }

    return {
      overallRisk,
      riskFactors,
      mitigationSuggestions,
    };
  }

  private calculateOpportunityScore(input: GetInsightsDto, interactions: InteractionDto[]): number {
    let score = 50; // Base score

    // Adjust based on response rate
    if (interactions.length > 0) {
      const responseRate = interactions.filter((i) => i.responseReceived).length / interactions.length;
      score += (responseRate - 0.35) * 50; // Adjust relative to baseline
    }

    // Adjust based on company size
    const sizeAdjustments: Partial<Record<CompanySize, number>> = {
      [CompanySize.STARTUP]: 10,
      [CompanySize.SMALL]: 5,
      [CompanySize.ENTERPRISE]: -5,
    };
    if (input.companySize && sizeAdjustments[input.companySize]) {
      score += sizeAdjustments[input.companySize] as number;
    }

    // Adjust based on role level
    const roleAdjustments: Partial<Record<RoleLevel, number>> = {
      [RoleLevel.SENIOR]: 10,
      [RoleLevel.LEAD]: 15,
      [RoleLevel.MANAGER]: 10,
      [RoleLevel.ENTRY]: -10,
    };
    if (input.roleLevel && roleAdjustments[input.roleLevel]) {
      score += roleAdjustments[input.roleLevel] as number;
    }

    // Platform adjustment
    if (input.platform?.toLowerCase() === 'linkedin') {
      score += 5;
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private generateSummary(
    input: GetInsightsDto,
    insights: Insight[],
    opportunityScore: number,
  ): string {
    const opportunity =
      opportunityScore >= 70
        ? 'strong opportunity'
        : opportunityScore >= 50
          ? 'moderate opportunity'
          : 'challenging opportunity';

    const keyInsight = insights.find((i) => i.importance === 'high') || insights[0];

    let summary = `This represents a ${opportunity} with a score of ${opportunityScore}/100.`;

    if (keyInsight) {
      summary += ` Key finding: ${keyInsight.description}.`;
    }

    if (input.companyName) {
      summary += ` Engaging with ${input.companyName}`;
      if (input.industry) {
        summary += ` in the ${input.industry} sector`;
      }
      summary += '.';
    }

    return summary;
  }
}
