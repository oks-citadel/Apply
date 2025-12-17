import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Current step name', example: 'filling_form' })
  step: string;

  @ApiProperty({ description: 'Progress percentage (0-100)', example: 75 })
  percentage: number;

  @ApiProperty({ description: 'Human-readable progress message', example: 'Filling application form' })
  message: string;
}

export class RetryInfo {
  @ApiProperty({ description: 'Current retry attempt', example: 2 })
  retryCount: number;

  @ApiProperty({ description: 'Maximum retries allowed', example: 3 })
  maxRetries: number;

  @ApiPropertyOptional({ description: 'Scheduled next retry time', example: '2024-01-15T10:30:00Z' })
  nextRetryAt?: Date;
}

export class SubmissionResultDto {
  @ApiProperty({ description: 'Whether submission was successful', example: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Internal application ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Company/ATS reference ID', example: 'APP-2024-00123' })
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Path to submission screenshot', example: '/screenshots/app-123.png' })
  screenshotPath?: string;

  @ApiPropertyOptional({ description: 'Submission timestamp', example: '2024-01-15T10:30:00Z' })
  submittedAt?: Date;

  @ApiPropertyOptional({ description: 'Error message if failed', example: 'CAPTCHA verification required' })
  error?: string;

  @ApiPropertyOptional({
    description: 'Type of error encountered',
    enum: ['captcha', 'rate_limit', 'invalid_form', 'network', 'authentication', 'unknown'],
    example: 'captcha'
  })
  errorType?: 'captcha' | 'rate_limit' | 'invalid_form' | 'network' | 'authentication' | 'unknown';

  @ApiPropertyOptional({ description: 'Whether manual user action is required', example: true })
  requiresManualIntervention?: boolean;

  @ApiPropertyOptional({ description: 'Whether this error can be retried', example: true })
  retryable?: boolean;

  @ApiPropertyOptional({ description: 'Additional result metadata', example: { confirmationNumber: '12345' } })
  metadata?: Record<string, any>;
}

export class ErrorInfo {
  @ApiProperty({ description: 'Error message', example: 'Network timeout while submitting form' })
  message: string;

  @ApiProperty({ description: 'Error type classification', example: 'NetworkError' })
  type: string;

  @ApiPropertyOptional({ description: 'Error stack trace (debug only)' })
  stack?: string;

  @ApiProperty({ description: 'Whether manual intervention is needed', example: false })
  requiresManualIntervention: boolean;
}

export class TimestampsInfo {
  @ApiProperty({ description: 'When application was created', example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'When processing started', example: '2024-01-15T10:05:00Z' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'When processing completed', example: '2024-01-15T10:10:00Z' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'When processing failed', example: '2024-01-15T10:08:00Z' })
  failedAt?: Date;
}

export class ApplicationStatusResponseDto {
  @ApiProperty({ description: 'Application ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  applicationId: string;

  @ApiProperty({ description: 'Job ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  jobId: string;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  userId: string;

  @ApiProperty({ description: 'Application status', enum: ApplicationStatusEnum, example: 'processing' })
  status: ApplicationStatusEnum;

  @ApiPropertyOptional({ description: 'Queue status', enum: QueueStatusEnum, example: 'active' })
  queueStatus?: QueueStatusEnum;

  @ApiPropertyOptional({ description: 'Processing progress', type: ProgressInfo })
  progress?: ProgressInfo;

  @ApiPropertyOptional({ description: 'Submission result (when completed)', type: SubmissionResultDto })
  result?: SubmissionResultDto;

  @ApiPropertyOptional({ description: 'Retry information', type: RetryInfo })
  retryInfo?: RetryInfo;

  @ApiProperty({ description: 'Timestamps', type: TimestampsInfo })
  timestamps: TimestampsInfo;

  @ApiPropertyOptional({ description: 'Error information (if failed)', type: ErrorInfo })
  error?: ErrorInfo;
}

export class QueuedApplicationDto {
  @ApiProperty({ description: 'Job ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  jobId: string;

  @ApiProperty({ description: 'Queue item ID', example: 'queue-item-123' })
  queueItemId: string;

  @ApiProperty({ description: 'Scheduled processing time', example: '2024-01-15T10:30:00Z' })
  scheduledAt: Date;
}

export class RejectedApplicationDto {
  @ApiProperty({ description: 'Job ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  jobId: string;

  @ApiProperty({ description: 'Rejection reason', example: 'User does not meet experience requirements' })
  reason: string;
}

export class BatchApplicationResponseDto {
  @ApiProperty({ description: 'Total number of jobs in batch', example: 10 })
  totalJobs: number;

  @ApiProperty({ description: 'Number of jobs successfully queued', example: 8 })
  queued: number;

  @ApiProperty({ description: 'Number of jobs rejected', example: 2 })
  rejected: number;

  @ApiProperty({
    description: 'List of successfully queued applications',
    type: [QueuedApplicationDto],
  })
  queuedApplications: QueuedApplicationDto[];

  @ApiProperty({
    description: 'List of rejected applications with reasons',
    type: [RejectedApplicationDto],
  })
  rejectedApplications: RejectedApplicationDto[];
}

export class StartApplicationResponseDto {
  @ApiProperty({ description: 'Application ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  applicationId: string;

  @ApiProperty({ description: 'Job ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  jobId: string;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  userId: string;

  @ApiProperty({ description: 'Application status', enum: ApplicationStatusEnum, example: 'queued' })
  status: ApplicationStatusEnum;

  @ApiPropertyOptional({ description: 'Queue status', enum: QueueStatusEnum, example: 'waiting' })
  queueStatus?: QueueStatusEnum;

  @ApiProperty({ description: 'Status message', example: 'Application queued successfully' })
  message: string;

  @ApiPropertyOptional({ description: 'Scheduled processing time', example: '2024-01-15T10:30:00Z' })
  scheduledAt?: Date;
}

export class RetryApplicationResponseDto {
  @ApiProperty({ description: 'Application ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  applicationId: string;

  @ApiProperty({ description: 'Whether retry was initiated', example: true })
  success: boolean;

  @ApiProperty({ description: 'Status message', example: 'Application queued for retry' })
  message: string;

  @ApiProperty({ description: 'New application status', enum: ApplicationStatusEnum, example: 'queued' })
  newStatus: ApplicationStatusEnum;

  @ApiProperty({ description: 'Current retry count', example: 2 })
  retryCount: number;
}
