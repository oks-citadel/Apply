/**
 * Recruiter Prediction Interfaces
 *
 * Type definitions for recruiter behavior prediction and analysis
 */

/**
 * Historical interaction with a recruiter
 */
export interface RecruiterInteraction {
  recruiterId: string;
  recruiterEmail?: string;
  recruiterName?: string;
  companyName?: string;
  interactionType: InteractionType;
  timestamp: Date;
  responseReceived: boolean;
  responseTimeHours?: number;
  platform?: string;
  jobTitle?: string;
  applicationId?: string;
}

/**
 * Types of interactions with recruiters
 */
export enum InteractionType {
  APPLICATION_SUBMITTED = 'application_submitted',
  FOLLOW_UP_SENT = 'follow_up_sent',
  MESSAGE_SENT = 'message_sent',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  OFFER_RECEIVED = 'offer_received',
  REJECTION_RECEIVED = 'rejection_received',
  CONNECTION_REQUEST = 'connection_request',
}

/**
 * Response likelihood prediction result
 */
export interface ResponsePrediction {
  recruiterId: string;
  likelihood: number; // 0-100 percentage
  confidenceScore: number; // 0-100 confidence in prediction
  factors: ResponseFactor[];
  recommendation: string;
  predictedOutcome: PredictedOutcome;
}

/**
 * Factors influencing response prediction
 */
export interface ResponseFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1 indicating importance
  description: string;
}

/**
 * Predicted outcome types
 */
export enum PredictedOutcome {
  LIKELY_RESPONSE = 'likely_response',
  POSSIBLE_RESPONSE = 'possible_response',
  UNLIKELY_RESPONSE = 'unlikely_response',
  NO_RESPONSE_EXPECTED = 'no_response_expected',
}

/**
 * Time to response prediction
 */
export interface TimeToResponsePrediction {
  recruiterId: string;
  estimatedDays: number;
  estimatedRange: {
    min: number;
    max: number;
  };
  confidenceScore: number;
  basedOnSampleSize: number;
  factors: TimeFactor[];
}

/**
 * Factors affecting response time
 */
export interface TimeFactor {
  name: string;
  effect: 'faster' | 'slower' | 'neutral';
  adjustmentDays: number;
  description: string;
}

/**
 * Recruiter activity pattern
 */
export interface RecruiterPattern {
  recruiterId: string;
  activeHours: HourlyActivity[];
  activeDays: DailyActivity[];
  peakActivityTime: string; // e.g., "Tuesday 10:00 AM"
  responseRateByDayOfWeek: DayResponseRate[];
  averageResponseTimeByDay: DayResponseTime[];
  seasonalPatterns?: SeasonalPattern[];
}

/**
 * Hourly activity breakdown
 */
export interface HourlyActivity {
  hour: number; // 0-23
  activityScore: number; // 0-100
  responseRate: number; // percentage
  sampleSize: number;
}

/**
 * Daily activity breakdown
 */
export interface DailyActivity {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  activityScore: number; // 0-100
  isHighActivity: boolean;
}

/**
 * Response rate by day of week
 */
export interface DayResponseRate {
  dayOfWeek: number;
  dayName: string;
  responseRate: number;
  averageResponseTimeHours: number;
}

/**
 * Response time by day
 */
export interface DayResponseTime {
  dayOfWeek: number;
  dayName: string;
  averageHours: number;
  medianHours: number;
}

/**
 * Seasonal hiring patterns
 */
export interface SeasonalPattern {
  period: string; // e.g., "Q1", "January", "Holiday Season"
  activityLevel: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Recruiter engagement score
 */
export interface RecruiterEngagement {
  recruiterId: string;
  overallScore: number; // 0-100
  engagementLevel: EngagementLevel;
  metrics: EngagementMetrics;
  trend: EngagementTrend;
  comparison: IndustryComparison;
}

/**
 * Engagement level classification
 */
export enum EngagementLevel {
  HIGHLY_ENGAGED = 'highly_engaged',
  MODERATELY_ENGAGED = 'moderately_engaged',
  LOW_ENGAGEMENT = 'low_engagement',
  INACTIVE = 'inactive',
}

/**
 * Detailed engagement metrics
 */
export interface EngagementMetrics {
  responseRate: number;
  averageResponseTime: number;
  interactionFrequency: number;
  followThroughRate: number; // percentage of interactions that led to next steps
  profileCompleteness: number; // if known
  lastActiveDate?: Date;
  totalInteractions: number;
}

/**
 * Engagement trend over time
 */
export interface EngagementTrend {
  direction: 'increasing' | 'stable' | 'decreasing';
  percentageChange: number;
  period: string; // e.g., "last 30 days"
  dataPoints: TrendDataPoint[];
}

/**
 * Data point for trend analysis
 */
export interface TrendDataPoint {
  date: string;
  score: number;
}

/**
 * Comparison with industry averages
 */
export interface IndustryComparison {
  recruiterScore: number;
  industryAverage: number;
  percentile: number; // which percentile this recruiter falls into
  comparisonGroup: string; // e.g., "Tech Recruiters", "Healthcare Recruiters"
}

/**
 * Actionable insights about a recruiter
 */
export interface RecruiterInsights {
  recruiterId: string;
  insights: Insight[];
  recommendations: Recommendation[];
  riskAssessment: RiskAssessment;
  opportunityScore: number; // 0-100
  summary: string;
}

/**
 * Individual insight
 */
export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  dataSupport: string; // explanation of data backing this insight
}

/**
 * Types of insights
 */
export enum InsightType {
  TIMING = 'timing',
  COMMUNICATION = 'communication',
  BEHAVIOR = 'behavior',
  OPPORTUNITY = 'opportunity',
  WARNING = 'warning',
}

/**
 * Actionable recommendation
 */
export interface Recommendation {
  id: string;
  action: string;
  rationale: string;
  priority: 'immediate' | 'soon' | 'when_possible';
  expectedImpact: string;
  confidence: number; // 0-100
}

/**
 * Risk assessment for engaging with recruiter
 */
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  mitigationSuggestions: string[];
}

/**
 * Individual risk factor
 */
export interface RiskFactor {
  name: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Input data for predictions (can come from various sources)
 */
export interface PredictionInput {
  recruiterId: string;
  recruiterEmail?: string;
  companyName?: string;
  industry?: string;
  companySize?: CompanySize;
  roleLevel?: RoleLevel;
  applicationDate?: Date;
  platform?: string;
  hasConnection?: boolean;
  referralSource?: string;
  jobPostingAge?: number; // days since job was posted
  previousInteractions?: RecruiterInteraction[];
}

/**
 * Company size classification
 */
export enum CompanySize {
  STARTUP = 'startup', // 1-50
  SMALL = 'small', // 51-200
  MEDIUM = 'medium', // 201-1000
  LARGE = 'large', // 1001-5000
  ENTERPRISE = 'enterprise', // 5000+
}

/**
 * Role level classification
 */
export enum RoleLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  VP = 'vp',
  C_LEVEL = 'c_level',
}

/**
 * Aggregated statistics for analysis
 */
export interface AggregatedStats {
  totalRecruiters: number;
  totalInteractions: number;
  overallResponseRate: number;
  averageResponseTime: number;
  medianResponseTime: number;
  responseRateByIndustry: Record<string, number>;
  responseRateByCompanySize: Record<CompanySize, number>;
  responseRateByRoleLevel: Record<RoleLevel, number>;
}
