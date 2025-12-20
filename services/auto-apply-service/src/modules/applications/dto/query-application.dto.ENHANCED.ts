import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';

import { ApplicationStatus } from '../entities/application.entity';


export class QueryApplicationDto {
  @ApiPropertyOptional({
    description: 'Filter by application status',
    enum: ApplicationStatus,
    example: 'pending',
    enumName: 'ApplicationStatus',
  })
  @IsEnum(ApplicationStatus, {
    message: 'Status must be one of: pending, in_review, interview_scheduled, offer_received, accepted, rejected, withdrawn',
  })
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Filter by company name (partial match, case-insensitive)',
    example: 'Tech Corp',
    maxLength: 255,
  })
  @IsString({ message: 'Company name must be a string' })
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by ATS platform',
    example: 'Greenhouse',
    enum: ['Greenhouse', 'Lever', 'Workday', 'Taleo', 'iCIMS', 'BambooHR', 'SAP SuccessFactors', 'Oracle Taleo', 'Other'],
  })
  @IsString({ message: 'ATS platform must be a string' })
  @IsOptional()
  ats_platform?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsNumber({}, { message: 'Page must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    type: Number,
  })
  @IsNumber({}, { message: 'Limit must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort results by',
    example: 'created_at',
    default: 'created_at',
    enum: ['created_at', 'updated_at', 'submitted_at', 'company_name', 'position_title', 'match_score', 'status'],
  })
  @IsString({ message: 'Sort by must be a string' })
  @IsOptional()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order (ascending or descending)',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsString({ message: 'Sort order must be a string' })
  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
