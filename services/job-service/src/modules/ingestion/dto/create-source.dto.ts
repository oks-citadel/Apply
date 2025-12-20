import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsNumber, Min } from 'class-validator';

import { SourceProvider, SourceType } from '../entities/job-source.entity';

export class CreateJobSourceDto {
  @IsString()
  name: string;

  @IsEnum(SourceProvider)
  provider: SourceProvider;

  @IsEnum(SourceType)
  type: SourceType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  base_url?: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @IsOptional()
  @IsObject()
  config?: {
    requests_per_minute?: number;
    requests_per_hour?: number;
    requests_per_day?: number;
    timeout_ms?: number;
    retry_attempts?: number;
    retry_delay_ms?: number;
    user_agent?: string;
    headers?: Record<string, string>;
    proxy?: string;
    max_pages?: number;
    page_size?: number;
    countries?: string[];
    job_types?: string[];
    keywords?: string[];
    exclude_keywords?: string[];
    custom?: Record<string, any>;
  };

  @IsOptional()
  @IsNumber()
  @Min(1)
  sync_interval_minutes?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
