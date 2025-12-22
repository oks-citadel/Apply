import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  CompanySize,
  RoleLevel,
  InteractionType,
  PredictedOutcome,
} from '../interfaces';

/**
 * DTO for a single historical interaction
 */
export class InteractionDto {
  @ApiProperty({
    description: 'Type of interaction',
    enum: InteractionType,
    example: InteractionType.APPLICATION_SUBMITTED,
  })
  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @ApiProperty({
    description: 'When the interaction occurred',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Whether a response was received',
    example: true,
  })
  @IsBoolean()
  responseReceived: boolean;

  @ApiPropertyOptional({
    description: 'Time to receive response in hours',
    example: 48,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  responseTimeHours?: number;

  @ApiPropertyOptional({
    description: 'Platform where interaction occurred',
    example: 'LinkedIn',
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Job title related to the interaction',
    example: 'Senior Software Engineer',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}

/**
 * Request DTO for predicting recruiter response
 */
export class PredictResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the recruiter',
    example: 'recruiter-123',
  })
  @IsString()
  recruiterId: string;

  @ApiPropertyOptional({
    description: 'Recruiter email address',
    example: 'recruiter@company.com',
  })
  @IsOptional()
  @IsString()
  recruiterEmail?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Tech Corp',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Industry of the company',
    example: 'Technology',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Size of the company',
    enum: CompanySize,
    example: CompanySize.LARGE,
  })
  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @ApiPropertyOptional({
    description: 'Level of the role being applied for',
    enum: RoleLevel,
    example: RoleLevel.SENIOR,
  })
  @IsOptional()
  @IsEnum(RoleLevel)
  roleLevel?: RoleLevel;

  @ApiPropertyOptional({
    description: 'Date of application',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  applicationDate?: string;

  @ApiPropertyOptional({
    description: 'Platform used for application',
    example: 'LinkedIn',
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Whether applicant has an existing connection with recruiter',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasConnection?: boolean;

  @ApiPropertyOptional({
    description: 'Source of referral if any',
    example: 'employee_referral',
  })
  @IsOptional()
  @IsString()
  referralSource?: string;

  @ApiPropertyOptional({
    description: 'Days since job was posted',
    example: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  jobPostingAge?: number;

  @ApiPropertyOptional({
    description: 'Previous interactions with this recruiter',
    type: [InteractionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractionDto)
  previousInteractions?: InteractionDto[];
}

/**
 * Response factor DTO
 */
export class ResponseFactorDto {
  @ApiProperty({
    description: 'Name of the factor',
    example: 'Response History',
  })
  name: string;

  @ApiProperty({
    description: 'Impact of this factor',
    enum: ['positive', 'negative', 'neutral'],
    example: 'positive',
  })
  impact: 'positive' | 'negative' | 'neutral';

  @ApiProperty({
    description: 'Weight of this factor (0-1)',
    example: 0.3,
  })
  weight: number;

  @ApiProperty({
    description: 'Description of the factor',
    example: 'Recruiter has responded to 80% of previous messages',
  })
  description: string;
}

/**
 * Response DTO for recruiter response prediction
 */
export class ResponsePredictionDto {
  @ApiProperty({
    description: 'Recruiter ID',
    example: 'recruiter-123',
  })
  recruiterId: string;

  @ApiProperty({
    description: 'Likelihood of response (0-100)',
    example: 75,
  })
  likelihood: number;

  @ApiProperty({
    description: 'Confidence in the prediction (0-100)',
    example: 85,
  })
  confidenceScore: number;

  @ApiProperty({
    description: 'Factors influencing the prediction',
    type: [ResponseFactorDto],
  })
  factors: ResponseFactorDto[];

  @ApiProperty({
    description: 'Recommendation based on prediction',
    example: 'High chance of response. Consider following up in 3-5 business days.',
  })
  recommendation: string;

  @ApiProperty({
    description: 'Predicted outcome category',
    enum: PredictedOutcome,
    example: PredictedOutcome.LIKELY_RESPONSE,
  })
  predictedOutcome: PredictedOutcome;
}
