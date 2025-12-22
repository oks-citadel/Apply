import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CompanySize, RoleLevel } from '../interfaces';
import { InteractionDto } from './predict-response.dto';

/**
 * Request DTO for predicting time to response
 */
export class PredictTimeToResponseDto {
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
 * Time factor DTO
 */
export class TimeFactorDto {
  @ApiProperty({
    description: 'Name of the factor',
    example: 'Company Size',
  })
  name: string;

  @ApiProperty({
    description: 'Effect on response time',
    enum: ['faster', 'slower', 'neutral'],
    example: 'slower',
  })
  effect: 'faster' | 'slower' | 'neutral';

  @ApiProperty({
    description: 'Adjustment in days',
    example: 2,
  })
  adjustmentDays: number;

  @ApiProperty({
    description: 'Description of the effect',
    example: 'Large companies typically have longer hiring processes',
  })
  description: string;
}

/**
 * Response DTO for time to response prediction
 */
export class TimeToResponsePredictionDto {
  @ApiProperty({
    description: 'Recruiter ID',
    example: 'recruiter-123',
  })
  recruiterId: string;

  @ApiProperty({
    description: 'Estimated days until response',
    example: 5,
  })
  estimatedDays: number;

  @ApiProperty({
    description: 'Estimated range for response time',
    example: { min: 3, max: 7 },
  })
  estimatedRange: {
    min: number;
    max: number;
  };

  @ApiProperty({
    description: 'Confidence in the prediction (0-100)',
    example: 75,
  })
  confidenceScore: number;

  @ApiProperty({
    description: 'Sample size used for prediction',
    example: 150,
  })
  basedOnSampleSize: number;

  @ApiProperty({
    description: 'Factors affecting response time',
    type: [TimeFactorDto],
  })
  factors: TimeFactorDto[];
}
