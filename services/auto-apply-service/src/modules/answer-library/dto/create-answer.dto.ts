import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsEnum, IsOptional, IsArray, IsBoolean, IsNumber, Min, Max, ValidateNested } from 'class-validator';

import { QuestionCategory, AnswerType } from '../entities/answer.entity';

export class CreateAnswerDto {
  @ApiProperty({
    description: 'Question category',
    enum: QuestionCategory,
    example: 'work_authorization',
  })
  @IsEnum(QuestionCategory)
  category: QuestionCategory;

  @ApiProperty({
    description: 'Answer type',
    enum: AnswerType,
    example: 'text',
  })
  @IsEnum(AnswerType)
  answer_type: AnswerType;

  @ApiProperty({
    description: 'Question pattern to match (regex or text)',
    example: 'Are you authorized to work in the United States?',
  })
  @IsString()
  question_pattern: string;

  @ApiPropertyOptional({
    description: 'Keywords to help match questions',
    type: [String],
    example: ['work authorization', 'legally authorized', 'work permit'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiProperty({
    description: 'The answer value',
    example: 'Yes',
  })
  @IsString()
  answer_value: string;

  @ApiPropertyOptional({
    description: 'Available options for multiple choice questions',
    type: [String],
    example: ['Yes', 'No', 'Require sponsorship'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  answer_options?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes about this answer',
    example: 'US Citizen, no sponsorship needed',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether this answer is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Confidence score for auto-matching (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence_score?: number;
}

export class UpdateAnswerDto {
  @ApiPropertyOptional({
    description: 'Question category',
    enum: QuestionCategory,
  })
  @IsEnum(QuestionCategory)
  @IsOptional()
  category?: QuestionCategory;

  @ApiPropertyOptional({
    description: 'Answer type',
    enum: AnswerType,
  })
  @IsEnum(AnswerType)
  @IsOptional()
  answer_type?: AnswerType;

  @ApiPropertyOptional({
    description: 'Question pattern to match',
  })
  @IsString()
  @IsOptional()
  question_pattern?: string;

  @ApiPropertyOptional({
    description: 'Keywords to help match questions',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'The answer value',
  })
  @IsString()
  @IsOptional()
  answer_value?: string;

  @ApiPropertyOptional({
    description: 'Available options for multiple choice questions',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  answer_options?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes about this answer',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether this answer is active',
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Confidence score for auto-matching (0-1)',
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence_score?: number;
}

export class BulkCreateAnswersDto {
  @ApiProperty({
    description: 'Array of answers to create',
    type: [CreateAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers: CreateAnswerDto[];
}
