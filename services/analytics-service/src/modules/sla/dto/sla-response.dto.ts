import { SLATier, SLAStatus, EligibilityStatus, SLAViolationType, RemedyType, RemedyStatus } from '../enums/sla.enums';

export class SLAStatusResponseDto {
  id: string;
  userId: string;
  tier: SLATier;
  status: SLAStatus;

  // Guarantee Terms
  guaranteedInterviews: number;
  deadlineDays: number;
  minConfidenceThreshold: number;
  contractPrice: number;

  // Dates
  startDate: Date;
  endDate: Date;
  extendedEndDate?: Date;
  daysRemaining: number;

  // Progress
  totalApplicationsSent: number;
  totalEmployerResponses: number;
  totalInterviewsScheduled: number;
  totalInterviewsCompleted: number;
  totalOffersReceived: number;

  // Calculated Metrics
  progressPercentage: number;
  responseRate: number;
  interviewRate: number;
  isGuaranteeMet: boolean;
  isActive: boolean;
  isExpired: boolean;

  // Eligibility
  isEligible: boolean;
  eligibilityDetails?: EligibilityCheckResultDto;

  // Violations
  hasViolations: boolean;
  violationCount: number;
  activeViolation?: SLAViolationSummaryDto;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class EligibilityCheckResponseDto {
  userId: string;
  tier: SLATier;
  status: EligibilityStatus;
  isEligible: boolean;
  checkResult: EligibilityCheckResultDto;
  recommendations: string[];
  checkedAt: Date;
}

export class EligibilityCheckResultDto {
  passedFields: string[];
  failedFields: string[];
  profileCompleteness: number;
  resumeScore: number;
  workExperienceMonths: number;
  hasApprovedResume: boolean;
  meetsMinimumRequirements: boolean;
  details: {
    basicInfo?: boolean;
    contactInfo?: boolean;
    workExperience?: boolean;
    education?: boolean;
    skills?: boolean;
    resume?: boolean;
    preferences?: boolean;
  };
}

export class SLADashboardResponseDto {
  contract: SLAStatusResponseDto;
  recentProgress: ProgressEventSummaryDto[];
  analytics: SLAAnalyticsDto;
  milestones: MilestoneDto[];
  recommendations: string[];
}

export class ProgressEventSummaryDto {
  id: string;
  eventType: string;
  jobTitle?: string;
  companyName?: string;
  confidenceScore?: number;
  interviewScheduledAt?: Date;
  createdAt: Date;
  isVerified: boolean;
}

export class SLAAnalyticsDto {
  // Time-based
  daysActive: number;
  daysRemaining: number;
  timeUtilization: number; // percentage of time used

  // Application metrics
  applicationsPerDay: number;
  totalApplications: number;
  qualifyingApplications: number; // above confidence threshold

  // Response metrics
  responseRate: number;
  avgResponseTime: number; // in days
  positiveResponses: number;
  negativeResponses: number;

  // Interview metrics
  interviewRate: number;
  interviewsRemaining: number;
  projectedInterviews: number;
  onTrackToMeetGuarantee: boolean;

  // Trend analysis
  weeklyApplicationTrend: number[];
  weeklyResponseTrend: number[];
  weeklyInterviewTrend: number[];
}

export class MilestoneDto {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  isCompleted: boolean;
  completedAt?: Date;
  dueDate?: Date;
}

export class SLAViolationSummaryDto {
  id: string;
  violationType: SLAViolationType;
  detectedAt: Date;
  guaranteedInterviews: number;
  actualInterviews: number;
  interviewsShortfall: number;
  daysOverDeadline?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  remediesIssued: number;
}

export class SLAViolationDetailDto extends SLAViolationSummaryDto {
  contractId: string;
  userId: string;
  totalApplicationsSent: number;
  totalEmployerResponses: number;
  responseRate: number;
  interviewRate: number;
  rootCauseFactors: any;
  analysisNotes?: string;
  isEscalated: boolean;
  escalationDetails?: {
    escalatedAt: Date;
    escalatedTo: string;
    ticketId: string;
  };
  remedies: RemedySummaryDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class RemedySummaryDto {
  id: string;
  remedyType: RemedyType;
  status: RemedyStatus;
  description?: string;
  issuedAt?: Date;
  completedAt?: Date;
  financialImpact?: number;
}

export class RemedyDetailDto extends RemedySummaryDto {
  violationId: string;
  userId: string;
  contractId: string;
  remedyDetails: any;
  requiresApproval: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  executedBy?: string;
  executedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateSLAResponseDto {
  success: boolean;
  contract: SLAStatusResponseDto;
  message: string;
}

export class TrackProgressResponseDto {
  success: boolean;
  progressEvent: ProgressEventSummaryDto;
  contractUpdated: boolean;
  newMetrics: {
    totalApplications: number;
    totalInterviews: number;
    progressPercentage: number;
  };
  message: string;
}

export class BulkTrackResponseDto {
  success: boolean;
  processed: number;
  failed: number;
  results: {
    applications: TrackProgressResponseDto[];
    responses: TrackProgressResponseDto[];
    interviews: TrackProgressResponseDto[];
  };
  errors: Array<{
    type: string;
    data: any;
    error: string;
  }>;
}
