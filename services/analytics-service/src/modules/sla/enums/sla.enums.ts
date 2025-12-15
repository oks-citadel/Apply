/**
 * SLA Tier Enums and Types
 * Defines the interview-guarantee service level agreement tiers
 */

export enum SLATier {
  PROFESSIONAL = 'professional',
  PREMIUM = 'premium',
  ELITE = 'elite',
}

export enum SLAStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  VIOLATED = 'violated',
  CANCELLED = 'cancelled',
}

export enum SLAViolationType {
  INTERVIEW_GUARANTEE_NOT_MET = 'interview_guarantee_not_met',
  DEADLINE_EXCEEDED = 'deadline_exceeded',
  ELIGIBILITY_LOST = 'eligibility_lost',
}

export enum RemedyType {
  SERVICE_EXTENSION = 'service_extension',
  HUMAN_RECRUITER_ESCALATION = 'human_recruiter_escalation',
  SERVICE_CREDIT = 'service_credit',
  PARTIAL_REFUND = 'partial_refund',
  FULL_REFUND = 'full_refund',
}

export enum RemedyStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ProgressEventType {
  APPLICATION_SENT = 'application_sent',
  EMPLOYER_RESPONSE = 'employer_response',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  OFFER_RECEIVED = 'offer_received',
}

export enum EligibilityStatus {
  ELIGIBLE = 'eligible',
  INELIGIBLE = 'ineligible',
  PENDING_REVIEW = 'pending_review',
}

export enum ProfileCompletenessField {
  BASIC_INFO = 'basic_info',
  CONTACT_INFO = 'contact_info',
  WORK_EXPERIENCE = 'work_experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  RESUME = 'resume',
  PREFERENCES = 'preferences',
}

/**
 * SLA Tier Configuration
 */
export interface SLATierConfig {
  tier: SLATier;
  name: string;
  price: number;
  guaranteedInterviews: number;
  deadlineDays: number;
  minConfidenceThreshold: number;
  features: string[];
  escalationPriority: number;
}

export const SLA_TIER_CONFIGS: Record<SLATier, SLATierConfig> = {
  [SLATier.PROFESSIONAL]: {
    tier: SLATier.PROFESSIONAL,
    name: 'Professional',
    price: 89.99,
    guaranteedInterviews: 3,
    deadlineDays: 60,
    minConfidenceThreshold: 0.65,
    features: [
      'AI-powered job matching',
      'Auto-apply to jobs',
      'Resume optimization',
      'Email support',
    ],
    escalationPriority: 3,
  },
  [SLATier.PREMIUM]: {
    tier: SLATier.PREMIUM,
    name: 'Premium',
    price: 149.99,
    guaranteedInterviews: 5,
    deadlineDays: 45,
    minConfidenceThreshold: 0.7,
    features: [
      'All Professional features',
      'Priority application processing',
      'Advanced analytics',
      'Interview preparation resources',
      'Priority support',
    ],
    escalationPriority: 2,
  },
  [SLATier.ELITE]: {
    tier: SLATier.ELITE,
    name: 'Elite',
    price: 299.99,
    guaranteedInterviews: 10,
    deadlineDays: 30,
    minConfidenceThreshold: 0.75,
    features: [
      'All Premium features',
      'Dedicated recruiter support',
      'Custom job search strategy',
      'Direct employer connections',
      'Salary negotiation assistance',
      '24/7 priority support',
    ],
    escalationPriority: 1,
  },
};

/**
 * Eligibility Requirements Configuration
 */
export interface EligibilityRequirements {
  requiredFields: ProfileCompletenessField[];
  minResumeScore: number;
  minConfidenceThreshold: number;
  mustHaveApprovedResume: boolean;
  minWorkExperience: number; // in months
}

export const SLA_ELIGIBILITY_REQUIREMENTS: Record<SLATier, EligibilityRequirements> = {
  [SLATier.PROFESSIONAL]: {
    requiredFields: [
      ProfileCompletenessField.BASIC_INFO,
      ProfileCompletenessField.CONTACT_INFO,
      ProfileCompletenessField.WORK_EXPERIENCE,
      ProfileCompletenessField.RESUME,
    ],
    minResumeScore: 70,
    minConfidenceThreshold: 0.65,
    mustHaveApprovedResume: true,
    minWorkExperience: 0,
  },
  [SLATier.PREMIUM]: {
    requiredFields: [
      ProfileCompletenessField.BASIC_INFO,
      ProfileCompletenessField.CONTACT_INFO,
      ProfileCompletenessField.WORK_EXPERIENCE,
      ProfileCompletenessField.EDUCATION,
      ProfileCompletenessField.SKILLS,
      ProfileCompletenessField.RESUME,
      ProfileCompletenessField.PREFERENCES,
    ],
    minResumeScore: 75,
    minConfidenceThreshold: 0.7,
    mustHaveApprovedResume: true,
    minWorkExperience: 6,
  },
  [SLATier.ELITE]: {
    requiredFields: [
      ProfileCompletenessField.BASIC_INFO,
      ProfileCompletenessField.CONTACT_INFO,
      ProfileCompletenessField.WORK_EXPERIENCE,
      ProfileCompletenessField.EDUCATION,
      ProfileCompletenessField.SKILLS,
      ProfileCompletenessField.RESUME,
      ProfileCompletenessField.PREFERENCES,
    ],
    minResumeScore: 80,
    minConfidenceThreshold: 0.75,
    mustHaveApprovedResume: true,
    minWorkExperience: 12,
  },
};
