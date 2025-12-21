import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsArray, Min, Max, IsIn } from 'class-validator';

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
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class JobResponseDto {
  @ApiProperty({ description: 'Job ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'External job ID from source', example: 'linkedin_12345' })
  external_id: string;

  @ApiProperty({ description: 'Job source', example: 'linkedin' })
  source: string;

  @ApiProperty({ description: 'Job title', example: 'Senior Software Engineer' })
  title: string;

  @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  company_id: string;

  @ApiProperty({ description: 'Company name', example: 'Tech Corp Inc.' })
  company_name: string;

  @ApiPropertyOptional({ description: 'Company logo URL', example: 'https://example.com/logo.png' })
  company_logo_url: string;

  @ApiProperty({ description: 'Job location', example: 'San Francisco, CA' })
  location: string;

  @ApiPropertyOptional({ description: 'City', example: 'San Francisco' })
  city: string;

  @ApiPropertyOptional({ description: 'State', example: 'CA' })
  state: string;

  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  country: string;

  @ApiProperty({ description: 'Remote work type', enum: RemoteType, example: 'hybrid' })
  remote_type: RemoteType;

  @ApiPropertyOptional({ description: 'Minimum salary', example: 100000 })
  salary_min: number;

  @ApiPropertyOptional({ description: 'Maximum salary', example: 150000 })
  salary_max: number;

  @ApiPropertyOptional({ description: 'Salary currency', example: 'USD' })
  salary_currency: string;

  @ApiPropertyOptional({ description: 'Salary period', example: 'yearly' })
  salary_period: string;

  @ApiProperty({ description: 'Job description' })
  description: string;

  @ApiPropertyOptional({ description: 'Job requirements', type: [String], example: ['5+ years experience', 'BS in Computer Science'] })
  requirements: string[];

  @ApiPropertyOptional({ description: 'Job benefits', type: [String], example: ['Health insurance', '401k'] })
  benefits: string[];

  @ApiPropertyOptional({ description: 'Required skills', type: [String], example: ['React', 'Node.js', 'TypeScript'] })
  skills: string[];

  @ApiProperty({ description: 'Experience level', enum: ExperienceLevel, example: 'senior' })
  experience_level: ExperienceLevel;

  @ApiPropertyOptional({ description: 'Minimum years of experience', example: 5 })
  experience_years_min: number;

  @ApiPropertyOptional({ description: 'Maximum years of experience', example: 10 })
  experience_years_max: number;

  @ApiProperty({ description: 'Employment type', enum: EmploymentType, example: 'full_time' })
  employment_type: EmploymentType;

  @ApiProperty({ description: 'Date posted', example: '2024-01-15T10:30:00Z' })
  posted_at: Date;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2024-02-15T23:59:59Z' })
  expires_at: Date;

  @ApiProperty({ description: 'Application URL', example: 'https://careers.techcorp.com/apply/123' })
  application_url: string;

  @ApiPropertyOptional({ description: 'ATS platform', example: 'greenhouse' })
  ats_platform: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String], example: ['startup', 'ai', 'machine-learning'] })
  tags: string[];

  @ApiProperty({ description: 'View count', example: 150 })
  view_count: number;

  @ApiProperty({ description: 'Application count', example: 45 })
  application_count: number;

  @ApiProperty({ description: 'Save count', example: 30 })
  save_count: number;

  @ApiProperty({ description: 'Is job active', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'Is featured job', example: false })
  is_featured: boolean;

  @ApiProperty({ description: 'Is verified job', example: true })
  is_verified: boolean;

  @ApiProperty({ description: 'Created timestamp', example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ description: 'Updated timestamp', example: '2024-01-15T10:30:00Z' })
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Match score with user profile (0-100)', example: 85 })
  match_score?: number;

  @ApiPropertyOptional({ description: 'Whether user saved this job', example: true })
  saved?: boolean;
}

export class PaginationDto {
  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total items', example: 150 })
  total: number;

  @ApiProperty({ description: 'Total pages', example: 8 })
  total_pages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  has_next: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  has_prev: boolean;

  @ApiPropertyOptional({ description: 'Cursor for pagination', example: 'eyJpZCI6IjEyMyJ9' })
  cursor?: string;
}

export class FacetItemDto {
  @ApiProperty({ description: 'Facet key', example: 'remote' })
  key: string;

  @ApiProperty({ description: 'Count', example: 25 })
  count: number;
}

export class FacetsDto {
  @ApiPropertyOptional({ description: 'Remote type facets', type: [FacetItemDto] })
  remote_types?: FacetItemDto[];

  @ApiPropertyOptional({ description: 'Experience level facets', type: [FacetItemDto] })
  experience_levels?: FacetItemDto[];

  @ApiPropertyOptional({ description: 'Employment type facets', type: [FacetItemDto] })
  employment_types?: FacetItemDto[];

  @ApiPropertyOptional({ description: 'Top skills facets', type: [FacetItemDto] })
  top_skills?: FacetItemDto[];

  @ApiPropertyOptional({ description: 'Top locations facets', type: [FacetItemDto] })
  top_locations?: FacetItemDto[];

  @ApiPropertyOptional({ description: 'Salary range facets', type: [FacetItemDto] })
  salary_ranges?: FacetItemDto[];
}

export class PaginatedJobsResponseDto {
  @ApiProperty({ description: 'List of jobs', type: [JobResponseDto] })
  data: JobResponseDto[];

  @ApiProperty({ description: 'Pagination info', type: PaginationDto })
  pagination: PaginationDto;

  @ApiPropertyOptional({ description: 'Search facets', type: FacetsDto })
  facets?: FacetsDto;
}
