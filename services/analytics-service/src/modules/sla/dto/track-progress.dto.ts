import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProgressEventType } from '../enums/sla.enums';

class ProgressMetadataDto {
  @ApiPropertyOptional({ description: 'Platform source', example: 'linkedin' })
  @IsOptional()
  @IsString()
  platformSource?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

class ResponseMetadataDto {
  @ApiPropertyOptional({ description: 'Email subject', example: 'RE: Your Application' })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiPropertyOptional({ description: 'Email from', example: 'recruiter@company.com' })
  @IsOptional()
  @IsString()
  emailFrom?: string;

  @ApiPropertyOptional({ description: 'Platform source', example: 'email' })
  @IsOptional()
  @IsString()
  platformSource?: string;
}

class InterviewMetadataDto {
  @ApiPropertyOptional({ description: 'Calendar event ID', example: 'cal_123456' })
  @IsOptional()
  @IsString()
  calendarEventId?: string;

  @ApiPropertyOptional({ description: 'Email subject' })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiPropertyOptional({ description: 'Platform source' })
  @IsOptional()
  @IsString()
  platformSource?: string;

  @ApiPropertyOptional({ description: 'Interviewer name', example: 'John Smith' })
  @IsOptional()
  @IsString()
  interviewerName?: string;

  @ApiPropertyOptional({ description: 'Interviewer email', example: 'john.smith@company.com' })
  @IsOptional()
  @IsString()
  interviewerEmail?: string;
}

export class TrackApplicationDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Application ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  applicationId: string;

  @ApiProperty({ description: 'Job ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Job title', example: 'Senior Software Engineer' })
  @IsString()
  jobTitle: string;

  @ApiProperty({ description: 'Company name', example: 'Tech Corp Inc.' })
  @IsString()
  companyName: string;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.85, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore: number;

  @ApiPropertyOptional({ description: 'Application source', example: 'linkedin' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: ProgressMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProgressMetadataDto)
  metadata?: ProgressMetadataDto;
}

export class TrackResponseDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Application ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  applicationId: string;

  @ApiProperty({ description: 'Response type', example: 'interview_request', enum: ['rejection', 'interview_request', 'offer', 'follow_up'] })
  @IsString()
  responseType: string;

  @ApiPropertyOptional({ description: 'Response content/message' })
  @IsOptional()
  @IsString()
  responseContent?: string;

  @ApiPropertyOptional({ description: 'Response source', example: 'email' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Source reference ID' })
  @IsOptional()
  @IsString()
  sourceReference?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: ResponseMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseMetadataDto)
  metadata?: ResponseMetadataDto;
}

export class TrackInterviewDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Application ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  applicationId: string;

  @ApiProperty({ description: 'Interview scheduled date/time', example: '2024-01-20T14:00:00Z' })
  @IsDateString()
  interviewScheduledAt: string;

  @ApiProperty({ description: 'Interview type', example: 'video', enum: ['phone', 'video', 'onsite', 'panel'] })
  @IsString()
  interviewType: string;

  @ApiPropertyOptional({ description: 'Interview location', example: '123 Main St, San Francisco, CA' })
  @IsOptional()
  @IsString()
  interviewLocation?: string;

  @ApiPropertyOptional({ description: 'Source', example: 'email' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Source reference ID' })
  @IsOptional()
  @IsString()
  sourceReference?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: InterviewMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InterviewMetadataDto)
  metadata?: InterviewMetadataDto;
}

export class VerifyProgressDto {
  @ApiProperty({ description: 'Progress event ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  progressId: string;

  @ApiProperty({ description: 'Whether the progress is verified', example: true })
  @IsBoolean()
  isVerified: boolean;

  @ApiProperty({ description: 'Verified by (admin/system)', example: 'admin_user_id' })
  @IsString()
  verifiedBy: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkTrackProgressDto {
  @ApiPropertyOptional({ description: 'Applications to track', type: [TrackApplicationDto] })
  @ValidateNested({ each: true })
  @Type(() => TrackApplicationDto)
  applications?: TrackApplicationDto[];

  @ApiPropertyOptional({ description: 'Responses to track', type: [TrackResponseDto] })
  @ValidateNested({ each: true })
  @Type(() => TrackResponseDto)
  responses?: TrackResponseDto[];

  @ApiPropertyOptional({ description: 'Interviews to track', type: [TrackInterviewDto] })
  @ValidateNested({ each: true })
  @Type(() => TrackInterviewDto)
  interviews?: TrackInterviewDto[];
}
