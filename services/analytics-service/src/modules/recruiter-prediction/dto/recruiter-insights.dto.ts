import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InteractionDto } from './predict-response.dto';
import { CompanySize, RoleLevel, InsightType } from '../interfaces';

/**
 * Request DTO for getting recruiter insights
 */
export class GetInsightsDto {
  @ApiProperty({
    description: 'Unique identifier for the recruiter',
    example: 'recruiter-123',
  })
  @IsString()
  recruiterId: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Tech Corp',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Industry',
    example: 'Technology',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company size',
    enum: CompanySize,
    example: CompanySize.LARGE,
  })
  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @ApiPropertyOptional({
    description: 'Role level',
    enum: RoleLevel,
    example: RoleLevel.SENIOR,
  })
  @IsOptional()
  @IsEnum(RoleLevel)
  roleLevel?: RoleLevel;

  @ApiPropertyOptional({
    description: 'Platform',
    example: 'LinkedIn',
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Historical interactions',
    type: [InteractionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractionDto)
  previousInteractions?: InteractionDto[];
}

/**
 * Individual insight DTO
 */
export class InsightDto {
  @ApiProperty({
    description: 'Unique insight ID',
    example: 'insight-001',
  })
  id: string;

  @ApiProperty({
    description: 'Type of insight',
    enum: InsightType,
    example: InsightType.TIMING,
  })
  type: InsightType;

  @ApiProperty({
    description: 'Insight title',
    example: 'Best Time to Contact',
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description',
    example: 'This recruiter is most responsive on Tuesday mornings between 9-11 AM',
  })
  description: string;

  @ApiProperty({
    description: 'Importance level',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  importance: 'high' | 'medium' | 'low';

  @ApiProperty({
    description: 'Data supporting this insight',
    example: 'Based on analysis of 45 past interactions with 78% response rate during this window',
  })
  dataSupport: string;
}

/**
 * Recommendation DTO
 */
export class RecommendationDto {
  @ApiProperty({
    description: 'Unique recommendation ID',
    example: 'rec-001',
  })
  id: string;

  @ApiProperty({
    description: 'Recommended action',
    example: 'Send a follow-up message on Tuesday at 10 AM',
  })
  action: string;

  @ApiProperty({
    description: 'Why this action is recommended',
    example:
      'Analysis shows this recruiter responds 40% faster to messages sent during this time window',
  })
  rationale: string;

  @ApiProperty({
    description: 'Priority of the recommendation',
    enum: ['immediate', 'soon', 'when_possible'],
    example: 'soon',
  })
  priority: 'immediate' | 'soon' | 'when_possible';

  @ApiProperty({
    description: 'Expected impact of following this recommendation',
    example: 'Increase response likelihood by approximately 25%',
  })
  expectedImpact: string;

  @ApiProperty({
    description: 'Confidence in this recommendation (0-100)',
    example: 85,
  })
  confidence: number;
}

/**
 * Risk factor DTO
 */
export class RiskFactorDto {
  @ApiProperty({
    description: 'Risk factor name',
    example: 'Low Response Rate',
  })
  name: string;

  @ApiProperty({
    description: 'Severity of the risk',
    enum: ['low', 'medium', 'high'],
    example: 'medium',
  })
  severity: 'low' | 'medium' | 'high';

  @ApiProperty({
    description: 'Description of the risk',
    example: 'This recruiter has a below-average response rate of 35%',
  })
  description: string;
}

/**
 * Risk assessment DTO
 */
export class RiskAssessmentDto {
  @ApiProperty({
    description: 'Overall risk level',
    enum: ['low', 'medium', 'high'],
    example: 'low',
  })
  overallRisk: 'low' | 'medium' | 'high';

  @ApiProperty({
    description: 'Individual risk factors',
    type: [RiskFactorDto],
  })
  riskFactors: RiskFactorDto[];

  @ApiProperty({
    description: 'Suggestions to mitigate risks',
    type: [String],
    example: ['Ensure your profile is complete', 'Include relevant keywords in your message'],
  })
  mitigationSuggestions: string[];
}

/**
 * Response DTO for recruiter insights
 */
export class RecruiterInsightsDto {
  @ApiProperty({
    description: 'Recruiter ID',
    example: 'recruiter-123',
  })
  recruiterId: string;

  @ApiProperty({
    description: 'List of insights',
    type: [InsightDto],
  })
  insights: InsightDto[];

  @ApiProperty({
    description: 'Actionable recommendations',
    type: [RecommendationDto],
  })
  recommendations: RecommendationDto[];

  @ApiProperty({
    description: 'Risk assessment',
    type: RiskAssessmentDto,
  })
  riskAssessment: RiskAssessmentDto;

  @ApiProperty({
    description: 'Opportunity score (0-100)',
    example: 72,
  })
  opportunityScore: number;

  @ApiProperty({
    description: 'Summary of key findings',
    example:
      'This recruiter shows above-average engagement with a 75% response rate. Best contacted on weekday mornings.',
  })
  summary: string;
}
