import type { ApplicationStatusEnum, QueueStatusEnum } from '../dto/application-status.dto';

export interface JobData {
  id: string;
  title: string;
  company: string;
  url: string;
  description?: string;
  requirements?: string[];
  location?: string;
  salary?: string;
  atsType?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  linkedinUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number;
  currentCompany?: string;
  currentTitle?: string;
  skills?: string[];
  preferences?: {
    salaryExpectation?: string;
    availability?: string;
    workAuthorization?: boolean;
    requiresSponsorship?: boolean;
    willingToRelocate?: boolean;
    remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  };
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  title?: string;
  isPrimary?: boolean;
  skills?: string[];
  experience?: string[];
  education?: string[];
  matchScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverLetter {
  id: string;
  userId: string;
  fileName?: string;
  filePath?: string;
  content?: string;
  title?: string;
  isTemplate?: boolean;
  createdAt: Date;
}

export interface EligibilityResult {
  eligible: boolean;
  score: number;
  reasons: string[];
  missingRequirements?: string[];
  matchedSkills?: string[];
  recommendations?: string[];
}

export interface ResumeSelectionResult {
  selectedResume: Resume;
  matchScore: number;
  matchReasons: string[];
  alternativeResumes?: Array<{
    resume: Resume;
    score: number;
    reason: string;
  }>;
}

export interface PreparedApplication {
  jobId: string;
  userId: string;
  resumeId: string;
  resumePath: string;
  coverLetterId?: string;
  coverLetterPath?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  workInfo?: {
    currentCompany?: string;
    currentTitle?: string;
    yearsOfExperience?: number;
  };
  preferences?: {
    salaryExpectation?: string;
    availability?: string;
    workAuthorization?: boolean;
    requiresSponsorship?: boolean;
  };
  additionalData?: Record<string, any>;
}

export interface SubmissionResult {
  success: boolean;
  applicationId?: string;
  referenceId?: string;
  screenshotPath?: string;
  submittedAt?: Date;
  error?: string;
  errorType?: 'captcha' | 'rate_limit' | 'invalid_form' | 'network' | 'authentication' | 'unknown';
  requiresManualIntervention?: boolean;
  retryable?: boolean;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  status: 'confirmed' | 'pending' | 'failed' | 'unknown';
  confirmationDetails?: {
    applicationId?: string;
    referenceNumber?: string;
    confirmationEmail?: boolean;
    confirmationPage?: boolean;
  };
  error?: string;
}

export interface RetryStrategy {
  maxRetries: number;
  currentRetry: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ApplicationQueueItem {
  id: string;
  userId: string;
  jobId: string;
  priority: number;
  scheduledAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface BatchApplicationRequest {
  userId: string;
  jobIds: string[];
  resumeId?: string;
  coverLetterId?: string;
  autoSelectResume?: boolean;
  priority?: number;
  schedule?: {
    startAt?: Date;
    delayBetween?: number;
    maxConcurrent?: number;
  };
}

export interface BatchApplicationResult {
  totalJobs: number;
  queued: number;
  rejected: number;
  queuedApplications: Array<{
    jobId: string;
    queueItemId: string;
    scheduledAt: Date;
  }>;
  rejectedApplications: Array<{
    jobId: string;
    reason: string;
  }>;
}

export interface ApplicationStatusInfo {
  applicationId: string;
  jobId: string;
  userId: string;
  status: ApplicationStatusEnum;
  queueStatus?: QueueStatusEnum;
  progress?: {
    step: string;
    percentage: number;
    message: string;
  };
  result?: SubmissionResult;
  retryInfo?: {
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: Date;
  };
  timestamps: {
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
  };
  error?: {
    message: string;
    type: string;
    stack?: string;
    requiresManualIntervention: boolean;
  };
}
