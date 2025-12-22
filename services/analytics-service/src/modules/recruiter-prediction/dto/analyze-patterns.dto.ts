import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InteractionDto } from './predict-response.dto';

/**
 * Request DTO for analyzing recruiter patterns
 */
export class AnalyzePatternsDto {
  @ApiProperty({
    description: 'Unique identifier for the recruiter',
    example: 'recruiter-123',
  })
  @IsString()
  recruiterId: string;

  @ApiPropertyOptional({
    description: 'Start date for analysis period',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analysis period',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Historical interactions to analyze',
    type: [InteractionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractionDto)
  interactions?: InteractionDto[];
}

/**
 * Hourly activity DTO
 */
export class HourlyActivityDto {
  @ApiProperty({
    description: 'Hour of day (0-23)',
    example: 10,
  })
  hour: number;

  @ApiProperty({
    description: 'Activity score (0-100)',
    example: 85,
  })
  activityScore: number;

  @ApiProperty({
    description: 'Response rate at this hour',
    example: 72,
  })
  responseRate: number;

  @ApiProperty({
    description: 'Number of samples',
    example: 45,
  })
  sampleSize: number;
}

/**
 * Daily activity DTO
 */
export class DailyActivityDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday)',
    example: 2,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Name of day',
    example: 'Tuesday',
  })
  dayName: string;

  @ApiProperty({
    description: 'Activity score (0-100)',
    example: 90,
  })
  activityScore: number;

  @ApiProperty({
    description: 'Whether this is a high activity day',
    example: true,
  })
  isHighActivity: boolean;
}

/**
 * Response rate by day DTO
 */
export class DayResponseRateDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday)',
    example: 2,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Name of day',
    example: 'Tuesday',
  })
  dayName: string;

  @ApiProperty({
    description: 'Response rate percentage',
    example: 78,
  })
  responseRate: number;

  @ApiProperty({
    description: 'Average response time in hours',
    example: 24,
  })
  averageResponseTimeHours: number;
}

/**
 * Response time by day DTO
 */
export class DayResponseTimeDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday)',
    example: 2,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Name of day',
    example: 'Tuesday',
  })
  dayName: string;

  @ApiProperty({
    description: 'Average response time in hours',
    example: 24,
  })
  averageHours: number;

  @ApiProperty({
    description: 'Median response time in hours',
    example: 18,
  })
  medianHours: number;
}

/**
 * Seasonal pattern DTO
 */
export class SeasonalPatternDto {
  @ApiProperty({
    description: 'Period identifier',
    example: 'Q1',
  })
  period: string;

  @ApiProperty({
    description: 'Activity level',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  activityLevel: 'high' | 'medium' | 'low';

  @ApiProperty({
    description: 'Description of the pattern',
    example: 'Q1 typically sees increased hiring activity',
  })
  description: string;
}

/**
 * Response DTO for recruiter pattern analysis
 */
export class RecruiterPatternDto {
  @ApiProperty({
    description: 'Recruiter ID',
    example: 'recruiter-123',
  })
  recruiterId: string;

  @ApiProperty({
    description: 'Activity by hour of day',
    type: [HourlyActivityDto],
  })
  activeHours: HourlyActivityDto[];

  @ApiProperty({
    description: 'Activity by day of week',
    type: [DailyActivityDto],
  })
  activeDays: DailyActivityDto[];

  @ApiProperty({
    description: 'Peak activity time',
    example: 'Tuesday 10:00 AM',
  })
  peakActivityTime: string;

  @ApiProperty({
    description: 'Response rate by day of week',
    type: [DayResponseRateDto],
  })
  responseRateByDayOfWeek: DayResponseRateDto[];

  @ApiProperty({
    description: 'Average response time by day',
    type: [DayResponseTimeDto],
  })
  averageResponseTimeByDay: DayResponseTimeDto[];

  @ApiPropertyOptional({
    description: 'Seasonal hiring patterns',
    type: [SeasonalPatternDto],
  })
  seasonalPatterns?: SeasonalPatternDto[];
}
