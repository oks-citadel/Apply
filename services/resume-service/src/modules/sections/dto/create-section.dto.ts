import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsInt,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { SectionType } from '../entities/section.entity';

export class CreateSectionDto {
  @ApiProperty({
    description: 'Section type',
    enum: SectionType,
  })
  @IsEnum(SectionType)
  type: SectionType;

  @ApiProperty({
    description: 'Section title',
    example: 'Work Experience',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Section content',
    type: 'object',
  })
  @IsObject()
  content: any;

  @ApiPropertyOptional({
    description: 'Display order',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({
    description: 'Section visibility',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}
