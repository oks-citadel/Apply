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
import { EngagementLevel } from '../interfaces';

/**
 * Request DTO for scoring recruiter engagement
 */
export class ScoreEngagementDto {
  @ApiProperty({
    description: 'Unique identifier for the recruiter',
    example: 'recruiter-123',
  })
  @IsString()
  recruiterId: string;

  @ApiPropertyOptional({
    description: 'Industry for comparison',
    example: 'Technology',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Historical interactions to analyze',
    type: [InteractionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractionDto)
  interactions?: InteractionDto[];

  @ApiPropertyOptional({
    description: 'Date of last known activity',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  lastActiveDate?: string;
}

/**
 * Engagement metrics DTO
 */
export class EngagementMetricsDto {
  @ApiProperty({
    description: 'Response rate percentage',
    example: 75,
  })
  responseRate: number;

  @ApiProperty({
    description: 'Average response time in hours',
    example: 24,
  })
  averageResponseTime: number;

  @ApiProperty({
    description: 'Interaction frequency (interactions per month)',
    example: 5,
  })
  interactionFrequency: number;

  @ApiProperty({
    description: 'Rate of interactions leading to next steps',
    example: 60,
  })
  followThroughRate: number;

  @ApiProperty({
    description: 'Profile completeness if known (0-100)',
    example: 85,
  })
  profileCompleteness: number;

  @ApiPropertyOptional({
    description: 'Date of last activity',
    example: '2024-01-15T10:30:00Z',
  })
  lastActiveDate?: string;

  @ApiProperty({
    description: 'Total number of interactions',
    example: 25,
  })
  totalInteractions: number;
}

/**
 * Trend data point DTO
 */
export class TrendDataPointDto {
  @ApiProperty({
    description: 'Date of data point',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Engagement score at this point',
    example: 72,
  })
  score: number;
}

/**
 * Engagement trend DTO
 */
export class EngagementTrendDto {
  @ApiProperty({
    description: 'Trend direction',
    enum: ['increasing', 'stable', 'decreasing'],
    example: 'increasing',
  })
  direction: 'increasing' | 'stable' | 'decreasing';

  @ApiProperty({
    description: 'Percentage change over period',
    example: 15,
  })
  percentageChange: number;

  @ApiProperty({
    description: 'Period analyzed',
    example: 'last 30 days',
  })
  period: string;

  @ApiProperty({
    description: 'Trend data points',
    type: [TrendDataPointDto],
  })
  dataPoints: TrendDataPointDto[];
}

/**
 * Industry comparison DTO
 */
export class IndustryComparisonDto {
  @ApiProperty({
    description: 'This recruiter score',
    example: 78,
  })
  recruiterScore: number;

  @ApiProperty({
    description: 'Industry average score',
    example: 65,
  })
  industryAverage: number;

  @ApiProperty({
    description: 'Percentile ranking',
    example: 82,
  })
  percentile: number;

  @ApiProperty({
    description: 'Comparison group',
    example: 'Tech Recruiters',
  })
  comparisonGroup: string;
}

/**
 * Response DTO for recruiter engagement score
 */
export class RecruiterEngagementDto {
  @ApiProperty({
    description: 'Recruiter ID',
    example: 'recruiter-123',
  })
  recruiterId: string;

  @ApiProperty({
    description: 'Overall engagement score (0-100)',
    example: 78,
  })
  overallScore: number;

  @ApiProperty({
    description: 'Engagement level classification',
    enum: EngagementLevel,
    example: EngagementLevel.HIGHLY_ENGAGED,
  })
  engagementLevel: EngagementLevel;

  @ApiProperty({
    description: 'Detailed engagement metrics',
    type: EngagementMetricsDto,
  })
  metrics: EngagementMetricsDto;

  @ApiProperty({
    description: 'Engagement trend over time',
    type: EngagementTrendDto,
  })
  trend: EngagementTrendDto;

  @ApiProperty({
    description: 'Comparison with industry averages',
    type: IndustryComparisonDto,
  })
  comparison: IndustryComparisonDto;
}
