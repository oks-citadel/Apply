import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GdprRequestStatus, GdprRequestType } from '../entities/gdpr-request.entity';

/**
 * Response DTO for GDPR request
 */
export class GdprRequestResponseDto {
  @ApiProperty({ description: 'Request ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ enum: GdprRequestType, description: 'Type of GDPR request' })
  type: GdprRequestType;

  @ApiProperty({ enum: GdprRequestStatus, description: 'Current status' })
  status: GdprRequestStatus;

  @ApiPropertyOptional({ description: 'Reason provided by user' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Download URL for data export' })
  downloadUrl?: string;

  @ApiPropertyOptional({ description: 'Download expiry date' })
  downloadExpiry?: Date;

  @ApiPropertyOptional({ description: 'Scheduled deletion date' })
  scheduledDeletionDate?: Date;

  @ApiPropertyOptional({ description: 'Services already processed' })
  processedServices?: string[];

  @ApiProperty({ description: 'Request creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Request completion date' })
  completedAt?: Date;
}

/**
 * Response for data export
 */
export class DataExportResponseDto {
  @ApiProperty({ description: 'Request ID' })
  requestId: string;

  @ApiProperty({ description: 'Status message' })
  message: string;

  @ApiProperty({ description: 'Estimated completion time in minutes' })
  estimatedCompletionMinutes: number;
}

/**
 * Response for deletion request
 */
export class DeletionResponseDto {
  @ApiProperty({ description: 'Request ID' })
  requestId: string;

  @ApiProperty({ description: 'Status message' })
  message: string;

  @ApiProperty({ description: 'Scheduled deletion date (after grace period)' })
  scheduledDeletionDate: Date;

  @ApiProperty({ description: 'Grace period in days' })
  gracePeriodDays: number;
}

/**
 * Paginated response for GDPR requests
 */
export class PaginatedGdprRequestsDto {
  @ApiProperty({ type: [GdprRequestResponseDto] })
  items: GdprRequestResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

/**
 * User data export structure
 */
export class UserDataExportDto {
  @ApiProperty({ description: 'Export date' })
  exportDate: string;

  @ApiProperty({ description: 'Export version' })
  exportVersion: string;

  @ApiProperty({ description: 'Export metadata' })
  metadata: {
    exportedAt: Date;
    userId: string;
    exportFormat: string;
    version: string;
  };

  @ApiProperty({ description: 'User profile data' })
  profile: Record<string, any>;

  @ApiPropertyOptional({ description: 'User resumes' })
  resumes?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Job applications' })
  applications?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Saved jobs' })
  savedJobs?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Job alerts' })
  jobAlerts?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'User preferences' })
  preferences?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Activity logs' })
  activityLogs?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Consent history' })
  consentHistory?: {
    consentType: string;
    granted: boolean;
    timestamp: string;
  }[];
}
