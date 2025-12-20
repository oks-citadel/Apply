import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

import {
  IndustrySpecialization,
  RoleSpecialization,
  RecruiterTier,
  RecruiterStatus,
} from '../entities/recruiter-profile.entity';

export class SearchRecruitersDto {
  @ApiPropertyOptional({
    description: 'Filter by industry specializations',
    enum: IndustrySpecialization,
    isArray: true,
  })
  @IsArray()
  @IsEnum(IndustrySpecialization, { each: true })
  @IsOptional()
  industries?: IndustrySpecialization[];

  @ApiPropertyOptional({
    description: 'Filter by role specializations',
    enum: RoleSpecialization,
    isArray: true,
  })
  @IsArray()
  @IsEnum(RoleSpecialization, { each: true })
  @IsOptional()
  roles?: RoleSpecialization[];

  @ApiPropertyOptional({
    description: 'Filter by regions',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  regions?: string[];

  @ApiPropertyOptional({
    description: 'Filter by recruiter tier',
    enum: RecruiterTier,
  })
  @IsEnum(RecruiterTier)
  @IsOptional()
  tier?: RecruiterTier;

  @ApiPropertyOptional({
    description: 'Minimum quality score (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  min_quality_score?: number;

  @ApiPropertyOptional({
    description: 'Minimum average rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @IsOptional()
  min_rating?: number;

  @ApiPropertyOptional({
    description: 'Only show recruiters accepting new assignments',
    default: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  accepting_assignments?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    default: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  verified_only?: boolean;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['quality_score', 'average_rating', 'total_placements', 'created_at'],
    default: 'quality_score',
  })
  @IsString()
  @IsOptional()
  sort_by?: 'quality_score' | 'average_rating' | 'total_placements' | 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsString()
  @IsOptional()
  sort_order?: 'ASC' | 'DESC';
}
