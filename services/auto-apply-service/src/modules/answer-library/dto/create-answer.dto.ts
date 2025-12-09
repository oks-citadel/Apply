import { IsString, IsEnum, IsOptional, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { QuestionCategory, AnswerType } from '../entities/answer.entity';

export class CreateAnswerDto {
  @IsEnum(QuestionCategory)
  category: QuestionCategory;

  @IsEnum(AnswerType)
  answer_type: AnswerType;

  @IsString()
  question_pattern: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsString()
  answer_value: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  answer_options?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence_score?: number;
}

export class UpdateAnswerDto {
  @IsEnum(QuestionCategory)
  @IsOptional()
  category?: QuestionCategory;

  @IsEnum(AnswerType)
  @IsOptional()
  answer_type?: AnswerType;

  @IsString()
  @IsOptional()
  question_pattern?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  answer_value?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  answer_options?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence_score?: number;
}

export class BulkCreateAnswersDto {
  @IsArray()
  answers: CreateAnswerDto[];
}
