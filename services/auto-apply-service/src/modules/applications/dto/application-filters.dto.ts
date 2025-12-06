import { IsOptional, IsEnum, IsString, IsArray, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus, ApplicationSource } from '../entities/application.entity';

export class ApplicationFiltersDto {
  @IsArray()
  @IsEnum(ApplicationStatus, { each: true })
  @IsOptional()
  status?: ApplicationStatus[];

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsArray()
  @IsEnum(ApplicationSource, { each: true })
  @IsOptional()
  source?: ApplicationSource[];

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  sortBy?: 'appliedAt' | 'updatedAt' | 'company' | 'status' = 'appliedAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
