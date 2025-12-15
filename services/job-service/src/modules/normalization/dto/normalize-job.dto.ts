import { IsString, IsOptional, IsUUID, IsArray, IsObject, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportSeverity } from '../entities/job-report.entity';

export class NormalizeJobDto {
  @ApiProperty({ description: 'Job ID to normalize' })
  @IsUUID()
  job_id: string;

  @ApiPropertyOptional({ description: 'Force re-normalization even if already normalized' })
  @IsOptional()
  force?: boolean;
}

export class BatchNormalizeJobsDto {
  @ApiProperty({ description: 'Array of job IDs to normalize' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  job_ids: string[];

  @ApiPropertyOptional({ description: 'Force re-normalization' })
  @IsOptional()
  force?: boolean;

  @ApiPropertyOptional({ description: 'Process asynchronously' })
  @IsOptional()
  async?: boolean;
}

export class ReportJobDto {
  @ApiProperty({ description: 'Job ID being reported' })
  @IsUUID()
  job_id: string;

  @ApiProperty({
    enum: ReportType,
    description: 'Type of report'
  })
  @IsEnum(ReportType)
  report_type: ReportType;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    enum: ReportSeverity,
    description: 'Severity of the report'
  })
  @IsOptional()
  @IsEnum(ReportSeverity)
  severity?: ReportSeverity;

  @ApiPropertyOptional({ description: 'URLs to evidence (screenshots, etc.)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence_urls?: string[];

  @ApiPropertyOptional({ description: 'Reporter user ID' })
  @IsOptional()
  @IsUUID()
  reporter_id?: string;

  @ApiPropertyOptional({ description: 'Reporter email if not logged in' })
  @IsOptional()
  @IsString()
  reporter_email?: string;
}

export class UpdateEmployerVerificationDto {
  @ApiProperty({ description: 'Company ID' })
  @IsUUID()
  company_id: string;

  @ApiPropertyOptional({ description: 'Verification status' })
  @IsOptional()
  @IsString()
  verification_status?: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Verified by user ID' })
  @IsOptional()
  @IsString()
  verified_by?: string;
}

export class QualityScoreResponseDto {
  @ApiProperty({ description: 'Overall quality score (0-100)' })
  quality_score: number;

  @ApiProperty({ description: 'Confidence score (0-100)' })
  confidence_score: number;

  @ApiProperty({ description: 'Quality signals breakdown' })
  quality_signals: {
    has_salary: boolean;
    has_detailed_description: boolean;
    has_clear_requirements: boolean;
    has_company_info: boolean;
    description_length: number;
    readability_score: number;
  };

  @ApiProperty({ description: 'Whether this is a duplicate' })
  is_duplicate: boolean;

  @ApiProperty({ description: 'Scam detection score (0-100)' })
  scam_score: number;

  @ApiProperty({ description: 'Scam indicators if any' })
  scam_indicators: string[];

  @ApiProperty({ description: 'Freshness score (0-100)' })
  freshness_score: number;

  @ApiProperty({ description: 'Job age in days' })
  age_days: number;
}

export class EmployerCredibilityResponseDto {
  @ApiProperty({ description: 'Overall credibility score (0-100)' })
  credibility_score: number;

  @ApiProperty({ description: 'Verification status' })
  verification_status: string;

  @ApiProperty({ description: 'Risk level' })
  risk_level: string;

  @ApiProperty({ description: 'Credibility breakdown' })
  credibility_breakdown: {
    company_age: number;
    online_presence: number;
    review_quality: number;
    job_history: number;
    response_rate: number;
    transparency: number;
  };

  @ApiProperty({ description: 'Review data' })
  review_data: {
    glassdoor_rating?: number;
    glassdoor_review_count?: number;
    indeed_rating?: number;
    indeed_review_count?: number;
  };

  @ApiProperty({ description: 'Risk factors' })
  risk_factors: string[];

  @ApiProperty({ description: 'Number of scam reports' })
  scam_reports_count: number;
}

export class NormalizationResultDto {
  @ApiProperty({ description: 'Job ID' })
  job_id: string;

  @ApiProperty({ description: 'Normalized job ID' })
  normalized_job_id: string;

  @ApiProperty({ description: 'Standardized title' })
  standardized_title: string;

  @ApiProperty({ description: 'Seniority level detected' })
  seniority_level?: string;

  @ApiProperty({ description: 'Function category' })
  function_category: string;

  @ApiProperty({ description: 'Quality score' })
  quality_score: number;

  @ApiProperty({ description: 'Confidence score' })
  confidence_score: number;

  @ApiProperty({ description: 'Whether normalization succeeded' })
  success: boolean;

  @ApiProperty({ description: 'Any errors encountered' })
  errors?: string[];
}
