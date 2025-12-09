import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export enum ApplicationStatusEnum {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SUBMITTED = 'submitted',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum QueueStatusEnum {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export class ProgressInfo {
  step: string;
  percentage: number;
  message: string;
}

export class RetryInfo {
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
}

export class SubmissionResultDto {
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

export class ErrorInfo {
  message: string;
  type: string;
  stack?: string;
  requiresManualIntervention: boolean;
}

export class TimestampsInfo {
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
}

export class ApplicationStatusResponseDto {
  applicationId: string;
  jobId: string;
  userId: string;
  status: ApplicationStatusEnum;
  queueStatus?: QueueStatusEnum;
  progress?: ProgressInfo;
  result?: SubmissionResultDto;
  retryInfo?: RetryInfo;
  timestamps: TimestampsInfo;
  error?: ErrorInfo;
}

export class BatchApplicationResponseDto {
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

export class StartApplicationResponseDto {
  applicationId: string;
  jobId: string;
  userId: string;
  status: ApplicationStatusEnum;
  queueStatus?: QueueStatusEnum;
  message: string;
  scheduledAt?: Date;
}

export class RetryApplicationResponseDto {
  applicationId: string;
  success: boolean;
  message: string;
  newStatus: ApplicationStatusEnum;
  retryCount: number;
}
