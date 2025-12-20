import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

import type { ResumeContent } from '../entities/resume.entity';

export class CreateResumeDto {
  @ApiProperty({
    description: 'Resume title',
    example: 'Senior Software Engineer Resume',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Template ID to use',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Resume content in structured format',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  content?: ResumeContent;

  @ApiPropertyOptional({
    description: 'Set as primary resume',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
