import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationDto {
  @ApiPropertyOptional({
    description: 'Application status',
    enum: ApplicationStatus,
    example: 'interviewing',
  })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'User notes about the application',
    example: 'Had a great phone screen, moving to technical interview',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Date when response was received from company',
    example: '2024-01-20T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  response_received_at?: string;

  @ApiPropertyOptional({
    description: 'User ID (internal use)',
  })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Queue processing status',
    example: 'completed',
  })
  @IsString()
  @IsOptional()
  queue_status?: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New application status',
    enum: ApplicationStatus,
    example: 'interviewing',
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Optional notes about the status change',
    example: 'Scheduled for second round interview',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
