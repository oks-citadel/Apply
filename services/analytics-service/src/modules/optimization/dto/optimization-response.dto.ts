import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Application Success Analysis ====================

export class SuccessFactorDto {
  @ApiProperty({ description: 'Name of the success factor', example: 'Resume keyword match' })
  factor: string;

  @ApiProperty({ description: 'Impact score (0-1)', example: 0.85 })
  impactScore: number;

  @ApiProperty({ description: 'Statistical correlation coefficient', example: 0.72 })
  correlation: number;

  @ApiProperty({ description: 'Sample size for this factor', example: 150 })
  sampleSize: number;

  @ApiProperty({ description: 'Description of the factor', example: 'Applications with 70%+ keyword match have higher success' })
  description: string;

  @ApiProperty({ description: 'Actionable recommendation', example: 'Tailor your resume to include job-specific keywords' })
  recommendation: string;
}

export class IndustryBreakdownDto {
  @ApiProperty({ description: 'Industry name', example: 'Technology' })
  industry: string;

  @ApiProperty({ description: 'Success rate for this industry', example: 28.5 })
  successRate: number;

  @ApiProperty({ description: 'Total applications in this industry', example: 200 })
  totalApplications: number;

  @ApiProperty({ description: 'Successful applications in this industry', example: 57 })
  successfulApplications: number;

  @ApiProperty({ description: 'Average response time in days', example: 5.2 })
  avgResponseTime: number;

  @ApiProperty({ description: 'Recommended application strategy', example: 'Apply within first 48 hours of posting' })
  recommendation: string;
}

export class CompanySizeAnalysisDto {
  @ApiProperty({ description: 'Company size category', example: 'Enterprise (1000+)' })
  sizeCategory: string;

  @ApiProperty({ description: 'Success rate for this company size', example: 22.3 })
  successRate: number;

  @ApiProperty({ description: 'Total applications', example: 150 })
  totalApplications: number;

  @ApiProperty({ description: 'Average time to response in days', example: 7.5 })
  avgTimeToResponse: number;

  @ApiProperty({ description: 'Competition level estimate', example: 'High' })
  competitionLevel: 'Low' | 'Medium' | 'High' | 'Very High';
}

export class JobLevelBreakdownDto {
  @ApiProperty({ description: 'Job level', example: 'Senior' })
  level: string;

  @ApiProperty({ description: 'Success rate for this level', example: 35.2 })
  successRate: number;

  @ApiProperty({ description: 'Total applications at this level', example: 80 })
  totalApplications: number;

  @ApiProperty({ description: 'Interview conversion rate', example: 45.0 })
  interviewConversionRate: number;

  @ApiProperty({ description: 'Average salary range', example: '$120k - $150k' })
  avgSalaryRange: string;
}

export class ApplicationSuccessAnalysisDto {
  @ApiProperty({ description: 'Overall success rate percentage', example: 25.5 })
  overallSuccessRate: number;

  @ApiProperty({ description: 'Total applications analyzed', example: 500 })
  totalApplicationsAnalyzed: number;

  @ApiProperty({ description: 'Total successful applications (interviews)', example: 128 })
  totalSuccessfulApplications: number;

  @ApiProperty({ description: 'Key success factors ranked by impact', type: [SuccessFactorDto] })
  successFactors: SuccessFactorDto[];

  @ApiProperty({ description: 'Industry breakdown analysis', type: [IndustryBreakdownDto] })
  industryBreakdown: IndustryBreakdownDto[];

  @ApiProperty({ description: 'Company size analysis', type: [CompanySizeAnalysisDto] })
  companySizeAnalysis: CompanySizeAnalysisDto[];

  @ApiProperty({ description: 'Job level breakdown', type: [JobLevelBreakdownDto] })
  jobLevelBreakdown: JobLevelBreakdownDto[];

  @ApiProperty({ description: 'Top recommendations based on analysis', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Analysis timestamp', example: '2024-01-15T10:30:00Z' })
  analyzedAt: string;

  @ApiProperty({ description: 'Analysis confidence score (0-1)', example: 0.85 })
  confidenceScore: number;
}

// ==================== Optimal Apply Time Analysis ====================

export class HourlySuccessRateDto {
  @ApiProperty({ description: 'Hour of day (0-23)', example: 9 })
  hour: number;

  @ApiProperty({ description: 'Success rate for this hour', example: 32.5 })
  successRate: number;

  @ApiProperty({ description: 'Total applications sent at this hour', example: 45 })
  applicationCount: number;

  @ApiProperty({ description: 'Relative performance vs average', example: 1.25 })
  relativePerformance: number;

  @ApiProperty({ description: 'Recommended priority level', example: 'High' })
  priority: 'Low' | 'Medium' | 'High' | 'Optimal';
}

export class DailySuccessRateDto {
  @ApiProperty({ description: 'Day of week (0=Sunday)', example: 1 })
  dayOfWeek: number;

  @ApiProperty({ description: 'Day name', example: 'Monday' })
  dayName: string;

  @ApiProperty({ description: 'Success rate for this day', example: 28.5 })
  successRate: number;

  @ApiProperty({ description: 'Total applications sent on this day', example: 120 })
  applicationCount: number;

  @ApiProperty({ description: 'Best hours to apply on this day', type: [Number] })
  bestHours: number[];

  @ApiProperty({ description: 'Recommendation for this day', example: 'Apply between 9-11 AM for best results' })
  recommendation: string;
}

export class TimeWindowRecommendationDto {
  @ApiProperty({ description: 'Start hour', example: 9 })
  startHour: number;

  @ApiProperty({ description: 'End hour', example: 11 })
  endHour: number;

  @ApiProperty({ description: 'Best days of week', type: [String] })
  bestDays: string[];

  @ApiProperty({ description: 'Expected success rate lift percentage', example: 15.5 })
  expectedLift: number;

  @ApiProperty({ description: 'Confidence in this recommendation', example: 0.85 })
  confidence: number;

  @ApiProperty({ description: 'Reasoning behind this recommendation', example: 'Recruiters most active during business hours' })
  reasoning: string;
}

export class OptimalApplyTimeDto {
  @ApiProperty({ description: 'Best hour to apply (0-23)', example: 10 })
  bestHour: number;

  @ApiProperty({ description: 'Best day to apply (0=Sunday)', example: 2 })
  bestDayOfWeek: number;

  @ApiProperty({ description: 'Best day name', example: 'Tuesday' })
  bestDayName: string;

  @ApiProperty({ description: 'Hourly success rates', type: [HourlySuccessRateDto] })
  hourlyBreakdown: HourlySuccessRateDto[];

  @ApiProperty({ description: 'Daily success rates', type: [DailySuccessRateDto] })
  dailyBreakdown: DailySuccessRateDto[];

  @ApiProperty({ description: 'Top time window recommendations', type: [TimeWindowRecommendationDto] })
  recommendedTimeWindows: TimeWindowRecommendationDto[];

  @ApiProperty({ description: 'Timezone used for analysis', example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ description: 'Total applications analyzed', example: 500 })
  totalApplicationsAnalyzed: number;

  @ApiProperty({ description: 'Key insights from time analysis', type: [String] })
  insights: string[];

  @ApiProperty({ description: 'Analysis confidence score', example: 0.82 })
  confidenceScore: number;

  @ApiProperty({ description: 'Analysis timestamp', example: '2024-01-15T10:30:00Z' })
  analyzedAt: string;
}

// ==================== Job Match Score Optimization ====================

export class ScoreThresholdAnalysisDto {
  @ApiProperty({ description: 'Match score threshold', example: 0.7 })
  threshold: number;

  @ApiProperty({ description: 'Success rate at this threshold', example: 35.2 })
  successRate: number;

  @ApiProperty({ description: 'Number of applications at this threshold', example: 150 })
  applicationCount: number;

  @ApiProperty({ description: 'Percentage of job pool remaining', example: 45.5 })
  jobPoolPercentage: number;

  @ApiProperty({ description: 'Expected interviews per 100 applications', example: 35 })
  expectedInterviewsPer100: number;

  @ApiProperty({ description: 'Efficiency score (success rate / effort)', example: 0.78 })
  efficiencyScore: number;
}

export class OptimalJobMatchScoreDto {
  @ApiProperty({ description: 'Recommended minimum match score', example: 0.72 })
  recommendedThreshold: number;

  @ApiProperty({ description: 'Optimal range minimum', example: 0.65 })
  optimalRangeMin: number;

  @ApiProperty({ description: 'Optimal range maximum', example: 0.85 })
  optimalRangeMax: number;

  @ApiProperty({ description: 'Current threshold being used (if any)', example: 0.7 })
  currentThreshold?: number;

  @ApiProperty({ description: 'Expected improvement if recommendation followed', example: 12.5 })
  expectedImprovementPercent: number;

  @ApiProperty({ description: 'Analysis by different thresholds', type: [ScoreThresholdAnalysisDto] })
  thresholdAnalysis: ScoreThresholdAnalysisDto[];

  @ApiProperty({ description: 'Success rate by score bucket', example: { '0.6-0.7': 22.5, '0.7-0.8': 35.2, '0.8-0.9': 48.3 } })
  successRateByScoreBucket: Record<string, number>;

  @ApiProperty({ description: 'Total applications analyzed', example: 500 })
  totalApplicationsAnalyzed: number;

  @ApiProperty({ description: 'Recommendations based on analysis', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Trade-off analysis description' })
  tradeOffAnalysis: {
    higherThreshold: string;
    lowerThreshold: string;
    recommendation: string;
  };

  @ApiProperty({ description: 'Analysis confidence score', example: 0.88 })
  confidenceScore: number;

  @ApiProperty({ description: 'Analysis timestamp', example: '2024-01-15T10:30:00Z' })
  analyzedAt: string;
}

// ==================== Optimization Report ====================

export class OptimizationScoreDto {
  @ApiProperty({ description: 'Overall optimization score (0-100)', example: 72 })
  overall: number;

  @ApiProperty({ description: 'Timing optimization score', example: 68 })
  timing: number;

  @ApiProperty({ description: 'Targeting optimization score', example: 75 })
  targeting: number;

  @ApiProperty({ description: 'Resume quality score', example: 80 })
  resumeQuality: number;

  @ApiProperty({ description: 'Application volume score', example: 65 })
  applicationVolume: number;
}

export class RecommendationDto {
  @ApiProperty({ description: 'Unique recommendation ID', example: 'rec_001' })
  id: string;

  @ApiProperty({ description: 'Recommendation category', example: 'Timing' })
  category: 'Timing' | 'Targeting' | 'Resume' | 'Volume' | 'Strategy';

  @ApiProperty({ description: 'Priority level', example: 'High' })
  priority: 'Low' | 'Medium' | 'High' | 'Critical';

  @ApiProperty({ description: 'Short title', example: 'Optimize application timing' })
  title: string;

  @ApiProperty({ description: 'Detailed description', example: 'Apply during morning hours (9-11 AM) for 15% higher response rate' })
  description: string;

  @ApiProperty({ description: 'Expected impact description', example: '+15% response rate' })
  expectedImpact: string;

  @ApiProperty({ description: 'Expected improvement percentage', example: 15 })
  expectedImprovementPercent: number;

  @ApiProperty({ description: 'Effort required to implement', example: 'Low' })
  effortLevel: 'Low' | 'Medium' | 'High';

  @ApiProperty({ description: 'Specific action items', type: [String] })
  actionItems: string[];
}

export class HistoricalComparisonDto {
  @ApiProperty({ description: 'Metric name', example: 'Success Rate' })
  metric: string;

  @ApiProperty({ description: 'Current period value', example: 28.5 })
  currentValue: number;

  @ApiProperty({ description: 'Previous period value', example: 22.3 })
  previousValue: number;

  @ApiProperty({ description: 'Change amount', example: 6.2 })
  change: number;

  @ApiProperty({ description: 'Change percentage', example: 27.8 })
  changePercent: number;

  @ApiProperty({ description: 'Trend direction', example: 'up' })
  trend: 'up' | 'down' | 'stable';
}

export class OptimizationReportDto {
  @ApiProperty({ description: 'Report title', example: 'Application Optimization Report' })
  title: string;

  @ApiProperty({ description: 'Report generation timestamp', example: '2024-01-15T10:30:00Z' })
  generatedAt: string;

  @ApiProperty({ description: 'Analysis period start date', example: '2024-01-01T00:00:00Z' })
  periodStart: string;

  @ApiProperty({ description: 'Analysis period end date', example: '2024-01-15T23:59:59Z' })
  periodEnd: string;

  @ApiProperty({ description: 'User ID (if user-specific)', example: '123e4567-e89b-12d3-a456-426614174000' })
  userId?: string;

  @ApiProperty({ description: 'Optimization scores breakdown', type: OptimizationScoreDto })
  scores: OptimizationScoreDto;

  @ApiProperty({ description: 'Executive summary of findings', type: [String] })
  executiveSummary: string[];

  @ApiProperty({ description: 'Key statistics', example: { totalApplications: 500, successRate: 25.5, avgResponseTime: 5.2 } })
  keyStatistics: {
    totalApplications: number;
    successRate: number;
    avgResponseTime: number;
    bestPerformingDay: string;
    bestPerformingHour: number;
    optimalMatchScore: number;
  };

  @ApiProperty({ description: 'Detailed application success analysis', type: ApplicationSuccessAnalysisDto })
  successAnalysis: ApplicationSuccessAnalysisDto;

  @ApiProperty({ description: 'Optimal timing analysis', type: OptimalApplyTimeDto })
  timingAnalysis: OptimalApplyTimeDto;

  @ApiProperty({ description: 'Job match score optimization', type: OptimalJobMatchScoreDto })
  matchScoreAnalysis: OptimalJobMatchScoreDto;

  @ApiProperty({ description: 'Prioritized recommendations', type: [RecommendationDto] })
  recommendations: RecommendationDto[];

  @ApiProperty({ description: 'Historical comparison data', type: [HistoricalComparisonDto] })
  historicalComparison: HistoricalComparisonDto[];

  @ApiProperty({ description: 'Overall report confidence score', example: 0.85 })
  confidenceScore: number;

  @ApiProperty({ description: 'Next steps summary', type: [String] })
  nextSteps: string[];
}
