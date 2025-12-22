import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { UserActivityType } from '../entities/user-activity.entity';
import { SegmentType } from '../entities/user-segment.entity';

export class QueryUserAnalyticsDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics query (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics query (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'User ID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: UserActivityType,
    description: 'Activity type to filter by',
  })
  @IsOptional()
  @IsEnum(UserActivityType)
  activityType?: UserActivityType;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class EngagementMetricsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for metrics query',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for metrics query',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Granularity for metrics',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month' = 'day';
}

export class UserJourneyQueryDto {
  @ApiPropertyOptional({
    description: 'User ID for journey analysis',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Start date for cohort',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  cohortStartDate?: string;

  @ApiPropertyOptional({
    description: 'End date for cohort',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  cohortEndDate?: string;
}

export class RetentionQueryDto {
  @ApiPropertyOptional({
    description: 'Cohort start date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  cohortStartDate?: string;

  @ApiPropertyOptional({
    description: 'Cohort end date',
    example: '2024-03-31',
  })
  @IsOptional()
  @IsDateString()
  cohortEndDate?: string;

  @ApiPropertyOptional({
    description: 'Retention period type',
    enum: ['day', 'week', 'month'],
    default: 'week',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  periodType?: 'day' | 'week' | 'month' = 'week';

  @ApiPropertyOptional({
    description: 'Number of periods to analyze',
    example: 12,
    default: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  periods?: number = 12;
}

export class FeatureUsageQueryDto {
  @ApiPropertyOptional({
    description: 'Start date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'User ID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Limit number of features returned',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class UserSegmentQueryDto {
  @ApiPropertyOptional({
    description: 'Segment type to filter by',
    enum: SegmentType,
  })
  @IsOptional()
  @IsEnum(SegmentType)
  segmentType?: SegmentType;

  @ApiPropertyOptional({
    description: 'Minimum confidence level (0-1)',
    example: 0.7,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  minConfidence?: number;

  @ApiPropertyOptional({
    description: 'Include only active segments',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  activeOnly?: boolean = true;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
