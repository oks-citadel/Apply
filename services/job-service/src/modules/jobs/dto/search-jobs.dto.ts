import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { RemoteType, ExperienceLevel, EmploymentType } from '../entities/job.entity';

export class SearchJobsDto {
  @ApiPropertyOptional({ description: 'Search keywords (title, skills, company)' })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiPropertyOptional({ description: 'Location (city, state, or country)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Remote work type', enum: RemoteType })
  @IsOptional()
  @IsEnum(RemoteType)
  remote_type?: RemoteType;

  @ApiPropertyOptional({ description: 'Minimum salary' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary_min?: number;

  @ApiPropertyOptional({ description: 'Maximum salary' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary_max?: number;

  @ApiPropertyOptional({ description: 'Experience level', enum: ExperienceLevel })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experience_level?: ExperienceLevel;

  @ApiPropertyOptional({ description: 'Employment type', enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @ApiPropertyOptional({ description: 'Required skills (comma-separated)', type: [String] })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(s => s.trim()) : value))
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsString()
  company_id?: string;

  @ApiPropertyOptional({ description: 'Posted within days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  posted_within_days?: number;

  @ApiPropertyOptional({ description: 'Only featured jobs' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ description: 'Only verified jobs' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'posted_at' })
  @IsOptional()
  @IsString()
  sort_by?: string = 'posted_at';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class JobResponseDto {
  id: string;
  external_id: string;
  source: string;
  title: string;
  company_id: string;
  company_name: string;
  company_logo_url: string;
  location: string;
  city: string;
  state: string;
  country: string;
  remote_type: RemoteType;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  salary_period: string;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
  experience_level: ExperienceLevel;
  experience_years_min: number;
  experience_years_max: number;
  employment_type: EmploymentType;
  posted_at: Date;
  expires_at: Date;
  application_url: string;
  ats_platform: string;
  tags: string[];
  view_count: number;
  application_count: number;
  save_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  match_score?: number;
  saved?: boolean;
}

export class PaginatedJobsResponseDto {
  data: JobResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    cursor?: string;
  };
  facets?: {
    remote_types?: { key: string; count: number }[];
    experience_levels?: { key: string; count: number }[];
    employment_types?: { key: string; count: number }[];
    top_skills?: { key: string; count: number }[];
    top_locations?: { key: string; count: number }[];
    salary_ranges?: { key: string; count: number }[];
  };
}
