import { IsString, IsBoolean, IsOptional, IsNumber, IsArray, IsUUID, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AutoApplyFiltersDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  jobTitle?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  location?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  experienceLevel?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  employmentType?: string[];

  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeKeywords?: string[];
}

export class UpdateAutoApplySettingsDto {
  @IsBoolean()
  enabled: boolean;

  @ValidateNested()
  @Type(() => AutoApplyFiltersDto)
  filters: AutoApplyFiltersDto;

  @IsUUID()
  resumeId: string;

  @IsString()
  @IsOptional()
  coverLetterTemplate?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxApplicationsPerDay?: number;

  @IsBoolean()
  @IsOptional()
  autoResponse?: boolean;
}

export class AutoApplyStatusDto {
  isRunning: boolean;
  applicationsToday: number;
  totalApplications: number;
  successRate: number;
  lastRunAt?: string;
  nextRunAt?: string;
}
