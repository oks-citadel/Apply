import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator';

import { Region, ResumeFormat, CoverLetterStyle, VisaType } from '../entities/playbook.entity';

export class PlaybookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: Region })
  region: Region;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ResumeFormat })
  preferred_resume_format: ResumeFormat;

  @ApiProperty()
  resume_max_pages: number;

  @ApiProperty()
  resume_section_order: any;

  @ApiProperty()
  resume_required_sections: string[];

  @ApiProperty()
  include_summary_section: boolean;

  @ApiProperty()
  include_photo: boolean;

  @ApiProperty()
  include_date_of_birth: boolean;

  @ApiProperty()
  include_marital_status: boolean;

  @ApiProperty()
  page_size: string;

  @ApiProperty()
  preferred_fonts: string[];

  @ApiProperty()
  recommended_font_size: number;

  @ApiProperty({ enum: CoverLetterStyle })
  cover_letter_style: CoverLetterStyle;

  @ApiProperty()
  cover_letter_required: boolean;

  @ApiProperty()
  cover_letter_word_count_min: number;

  @ApiProperty()
  cover_letter_word_count_max: number;

  @ApiPropertyOptional()
  cover_letter_opening_template?: string;

  @ApiPropertyOptional()
  cover_letter_closing_template?: string;

  @ApiProperty()
  salary_norms: any;

  @ApiProperty()
  include_salary_expectations: boolean;

  @ApiProperty()
  common_benefits: string[];

  @ApiProperty()
  common_ats_systems: string[];

  @ApiProperty()
  ats_optimization_tips: any;

  @ApiProperty()
  hiring_timeline: any;

  @ApiProperty({ enum: VisaType })
  visa_requirements: VisaType;

  @ApiPropertyOptional()
  visa_information?: string;

  @ApiProperty()
  ask_work_authorization: boolean;

  @ApiProperty()
  acceptable_work_permits: string[];

  @ApiProperty()
  cultural_preferences: any;

  @ApiProperty()
  interview_tips: string[];

  @ApiProperty()
  common_interview_formats: string[];

  @ApiProperty()
  primary_language: string;

  @ApiProperty()
  acceptable_languages: string[];

  @ApiProperty()
  require_language_certification: boolean;

  @ApiProperty()
  application_dos: string[];

  @ApiProperty()
  application_donts: string[];

  @ApiPropertyOptional()
  special_considerations?: string;

  @ApiProperty()
  protected_characteristics: string[];

  @ApiProperty()
  required_disclosures: string[];

  @ApiProperty()
  privacy_regulations: any;

  @ApiProperty()
  usage_count: number;

  @ApiProperty()
  success_rate: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  version: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class PlaybookSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: Region })
  region: Region;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  usage_count: number;

  @ApiProperty()
  success_rate: number;

  @ApiProperty()
  is_active: boolean;
}

export class RecommendPlaybookDto {
  @ApiProperty()
  @IsString()
  job_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_id?: string;
}

export class RecommendationResponseDto {
  @ApiProperty()
  recommended_playbook: PlaybookResponseDto;

  @ApiProperty()
  match_score: number;

  @ApiProperty()
  match_reasons: string[];

  @ApiProperty()
  alternative_playbooks: PlaybookSummaryDto[];
}
