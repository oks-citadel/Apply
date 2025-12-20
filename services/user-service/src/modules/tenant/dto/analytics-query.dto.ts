import { Type } from 'class-transformer';
import { IsOptional, IsString, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum AnalyticsType {
  PLACEMENT = 'placement',
  USER_ACTIVITY = 'user_activity',
  APPLICATIONS = 'applications',
  DEPARTMENT = 'department',
  COHORT = 'cohort',
}

export enum TimeRange {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsEnum(AnalyticsType)
  type?: AnalyticsType;

  @IsOptional()
  @IsEnum(TimeRange)
  time_range?: TimeRange;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  cohort?: string;

  @IsOptional()
  @IsString()
  graduation_year?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
