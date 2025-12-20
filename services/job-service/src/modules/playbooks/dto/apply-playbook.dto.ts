import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean, IsNumber, IsObject, Min, Max } from 'class-validator';

export class ApplyPlaybookDto {
  @ApiProperty({ description: 'Job ID to apply the playbook to' })
  @IsUUID()
  job_id: string;

  @ApiProperty({ description: 'Playbook ID to use' })
  @IsUUID()
  playbook_id: string;

  @ApiProperty({ description: 'User ID applying' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ description: 'Resume ID to use' })
  @IsOptional()
  @IsUUID()
  resume_id?: string;

  @ApiPropertyOptional({ description: 'Cover letter ID to use' })
  @IsOptional()
  @IsUUID()
  cover_letter_id?: string;

  @ApiPropertyOptional({ description: 'Auto-format resume according to playbook' })
  @IsOptional()
  @IsBoolean()
  auto_format_resume?: boolean;

  @ApiPropertyOptional({ description: 'Auto-generate cover letter according to playbook' })
  @IsOptional()
  @IsBoolean()
  auto_generate_cover_letter?: boolean;

  @ApiPropertyOptional({ description: 'Optimize for ATS system' })
  @IsOptional()
  @IsBoolean()
  optimize_for_ats?: boolean;

  @ApiPropertyOptional({ description: 'Minimum salary expectation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary_min?: number;

  @ApiPropertyOptional({ description: 'Maximum salary expectation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary_max?: number;

  @ApiPropertyOptional({ description: 'Additional user notes' })
  @IsOptional()
  @IsString()
  user_notes?: string;

  @ApiPropertyOptional({ description: 'Custom modifications to playbook' })
  @IsOptional()
  @IsObject()
  custom_modifications?: Record<string, any>;
}

export class ApplyPlaybookResponseDto {
  @ApiProperty()
  application_id: string;

  @ApiProperty()
  playbook_id: string;

  @ApiProperty()
  job_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  resume_formatted: boolean;

  @ApiProperty()
  cover_letter_generated: boolean;

  @ApiProperty()
  ats_optimized: boolean;

  @ApiProperty()
  ats_compatibility_score: number;

  @ApiProperty()
  playbook_match_score: number;

  @ApiProperty()
  recommendations: string[];

  @ApiProperty()
  warnings: string[];

  @ApiProperty()
  next_steps: string[];

  @ApiProperty()
  estimated_application_time: number; // in seconds

  @ApiProperty()
  created_at: Date;
}

export class UpdateApplicationStatusDto {
  @ApiProperty()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  user_rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_feedback?: string;
}

export class ApplicationStatsDto {
  @ApiProperty()
  total_applications: number;

  @ApiProperty()
  applications_by_status: Record<string, number>;

  @ApiProperty()
  applications_by_region: Record<string, number>;

  @ApiProperty()
  average_response_time_hours: number;

  @ApiProperty()
  interview_rate: number;

  @ApiProperty()
  offer_rate: number;

  @ApiProperty()
  success_rate_by_playbook: Array<{
    playbook_id: string;
    playbook_name: string;
    region: string;
    total_applications: number;
    interview_rate: number;
    offer_rate: number;
    average_rating: number;
  }>;

  @ApiProperty()
  most_successful_playbook: {
    playbook_id: string;
    playbook_name: string;
    region: string;
    success_rate: number;
  };
}
