import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    description: 'Application status',
    enum: ApplicationStatus,
    example: 'interview_scheduled',
    enumName: 'ApplicationStatus',
  })
  @IsEnum(ApplicationStatus, {
    message: 'Status must be one of: pending, in_review, interview_scheduled, offer_received, accepted, rejected, withdrawn',
  })
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Additional notes about the application status or updates',
    example: 'Phone interview scheduled for next Tuesday at 2pm',
    maxLength: 2000,
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when a response was received from the employer (ISO 8601 format)',
    example: '2024-01-16T14:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Response received at must be a valid ISO 8601 date string' })
  @IsOptional()
  response_received_at?: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New application status',
    enum: ApplicationStatus,
    example: 'interview_scheduled',
    required: true,
    enumName: 'ApplicationStatus',
  })
  @IsEnum(ApplicationStatus, {
    message: 'Status must be one of: pending, in_review, interview_scheduled, offer_received, accepted, rejected, withdrawn',
  })
  status: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Optional notes about the status change',
    example: 'Technical interview scheduled for Friday',
    maxLength: 2000,
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;
}
