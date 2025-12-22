import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OptimizationQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for analysis query',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analysis query',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'User ID to filter analysis by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Minimum sample size for statistical significance',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  minSampleSize?: number = 30;
}

export class ApplicationSuccessQueryDto extends OptimizationQueryDto {
  @ApiPropertyOptional({
    description: 'Include industry breakdown in analysis',
    example: true,
    default: true,
  })
  @IsOptional()
  includeIndustryBreakdown?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include company size analysis',
    example: true,
    default: true,
  })
  @IsOptional()
  includeCompanySizeAnalysis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include job level breakdown',
    example: true,
    default: true,
  })
  @IsOptional()
  includeJobLevelBreakdown?: boolean = true;
}

export class OptimalTimeQueryDto extends OptimizationQueryDto {
  @ApiPropertyOptional({
    description: 'Timezone for time analysis',
    example: 'America/New_York',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';

  @ApiPropertyOptional({
    description: 'Granularity of time analysis (hour or day)',
    example: 'hour',
    default: 'hour',
  })
  @IsOptional()
  @IsString()
  granularity?: 'hour' | 'day' = 'hour';
}

export class JobMatchScoreQueryDto extends OptimizationQueryDto {
  @ApiPropertyOptional({
    description: 'Current match score threshold to compare against',
    example: 0.7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  currentThreshold?: number;

  @ApiPropertyOptional({
    description: 'Minimum confidence level for recommendations',
    example: 0.8,
    default: 0.8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceLevel?: number = 0.8;
}

export class OptimizationReportQueryDto extends OptimizationQueryDto {
  @ApiPropertyOptional({
    description: 'Include all detailed sections in report',
    example: true,
    default: true,
  })
  @IsOptional()
  includeDetailedSections?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include historical comparison data',
    example: true,
    default: true,
  })
  @IsOptional()
  includeHistoricalComparison?: boolean = true;

  @ApiPropertyOptional({
    description: 'Number of top recommendations to include',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  topRecommendations?: number = 10;
}
