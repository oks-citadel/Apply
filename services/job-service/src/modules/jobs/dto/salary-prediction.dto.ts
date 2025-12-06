import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';

export class SalaryPredictionDto {
  @ApiProperty({ description: 'Job title' })
  @IsString()
  jobTitle: string;

  @ApiProperty({ description: 'Location (city, state, country)' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Years of experience' })
  @IsNumber()
  @Min(0)
  experienceYears: number;

  @ApiProperty({ description: 'Required skills', type: [String] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiPropertyOptional({ description: 'Education level' })
  @IsOptional()
  @IsString()
  education?: string;
}

export class SalaryPredictionResponseDto {
  @ApiProperty({
    description: 'Predicted salary range',
    example: { min: 80000, max: 120000, currency: 'USD', period: 'yearly' },
  })
  predictedSalary: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };

  @ApiProperty({ description: 'Confidence level (0-100)' })
  confidence: number;

  @ApiProperty({
    description: 'Factors affecting salary',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        factor: { type: 'string' },
        impact: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
        description: { type: 'string' },
      },
    },
  })
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];

  @ApiProperty({
    description: 'Market salary data',
    example: {
      averageSalary: 100000,
      percentile25: 80000,
      percentile50: 100000,
      percentile75: 120000,
      percentile90: 140000,
    },
  })
  marketData: {
    averageSalary: number;
    percentile25: number;
    percentile50: number;
    percentile75: number;
    percentile90: number;
  };
}
