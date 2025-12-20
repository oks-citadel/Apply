import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Assignment ID this review is for' })
  @IsUUID()
  @IsNotEmpty()
  assignment_id: string;

  @ApiProperty({ description: 'Overall rating (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Communication rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  communication_rating?: number;

  @ApiPropertyOptional({
    description: 'Professionalism rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  professionalism_rating?: number;

  @ApiPropertyOptional({
    description: 'Expertise rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  expertise_rating?: number;

  @ApiPropertyOptional({
    description: 'Responsiveness rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  responsiveness_rating?: number;

  @ApiPropertyOptional({ description: 'Review title' })
  @IsString()
  @IsOptional()
  review_title?: string;

  @ApiPropertyOptional({ description: 'Detailed review text' })
  @IsString()
  @IsOptional()
  review_text?: string;

  @ApiPropertyOptional({
    description: 'List of positive aspects',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pros?: string[];

  @ApiPropertyOptional({
    description: 'List of negative aspects',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cons?: string[];

  @ApiPropertyOptional({
    description: 'Would you recommend this recruiter?',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  would_recommend?: boolean;
}
