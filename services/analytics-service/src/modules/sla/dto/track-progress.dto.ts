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

export class TrackApplicationDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  applicationId: string;

  @IsUUID()
  jobId: string;

  @IsString()
  jobTitle: string;

  @IsString()
  companyName: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProgressMetadataDto)
  metadata?: ProgressMetadataDto;
}

export class TrackResponseDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  applicationId: string;

  @IsString()
  responseType: string; // rejection, interview_request, offer, etc.

  @IsOptional()
  @IsString()
  responseContent?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceReference?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponseMetadataDto)
  metadata?: ResponseMetadataDto;
}

export class TrackInterviewDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  applicationId: string;

  @IsDateString()
  interviewScheduledAt: string;

  @IsString()
  interviewType: string; // phone, video, onsite, etc.

  @IsOptional()
  @IsString()
  interviewLocation?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  sourceReference?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InterviewMetadataDto)
  metadata?: InterviewMetadataDto;
}

export class VerifyProgressDto {
  @IsUUID()
  progressId: string;

  @IsBoolean()
  isVerified: boolean;

  @IsString()
  verifiedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkTrackProgressDto {
  @ValidateNested({ each: true })
  @Type(() => TrackApplicationDto)
  applications?: TrackApplicationDto[];

  @ValidateNested({ each: true })
  @Type(() => TrackResponseDto)
  responses?: TrackResponseDto[];

  @ValidateNested({ each: true })
  @Type(() => TrackInterviewDto)
  interviews?: TrackInterviewDto[];
}

class ProgressMetadataDto {
  @IsOptional()
  @IsString()
  platformSource?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class ResponseMetadataDto {
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailFrom?: string;

  @IsOptional()
  @IsString()
  platformSource?: string;
}

class InterviewMetadataDto {
  @IsOptional()
  @IsString()
  calendarEventId?: string;

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  platformSource?: string;

  @IsOptional()
  @IsString()
  interviewerName?: string;

  @IsOptional()
  @IsString()
  interviewerEmail?: string;
}
