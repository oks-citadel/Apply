import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, IsObject, IsEnum } from 'class-validator';

import { ApplicationSource } from '../entities/application.entity';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'User ID (automatically set from authenticated user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'Job ID to apply for',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  job_id: string;

  @ApiPropertyOptional({
    description: 'Application source',
    enum: ApplicationSource,
    example: 'manual',
  })
  @IsEnum(ApplicationSource)
  @IsOptional()
  source?: ApplicationSource;

  @ApiPropertyOptional({
    description: 'Resume ID to use for the application',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  resume_id?: string;

  @ApiPropertyOptional({
    description: 'Cover letter ID to use for the application',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsOptional()
  cover_letter_id?: string;

  @ApiPropertyOptional({
    description: 'Match score between resume and job (0-100)',
    example: 85,
  })
  @IsNumber()
  @IsOptional()
  match_score?: number;

  @ApiPropertyOptional({
    description: 'Whether this was an auto-applied application',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  auto_applied?: boolean;

  @ApiPropertyOptional({
    description: 'User notes about the application',
    example: 'Referred by John from engineering team',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Tech Corp Inc.',
  })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Position title',
    example: 'Senior Software Engineer',
  })
  @IsString()
  @IsOptional()
  position_title?: string;

  @ApiPropertyOptional({
    description: 'URL to the job application',
    example: 'https://careers.techcorp.com/jobs/123',
  })
  @IsString()
  @IsOptional()
  application_url?: string;

  @ApiPropertyOptional({
    description: 'ATS platform used by the company',
    example: 'greenhouse',
  })
  @IsString()
  @IsOptional()
  ats_platform?: string;

  @ApiPropertyOptional({
    description: 'Form responses for application questions',
    example: { yearsOfExperience: '5', workAuthorization: 'yes' },
  })
  @IsObject()
  @IsOptional()
  form_responses?: Record<string, any>;
}
