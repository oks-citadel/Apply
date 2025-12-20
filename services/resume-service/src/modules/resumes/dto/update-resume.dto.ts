import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

import { CreateResumeDto } from './create-resume.dto';

export class UpdateResumeDto extends PartialType(CreateResumeDto) {
  @ApiPropertyOptional({
    description: 'ATS score (0-100)',
    minimum: 0,
    maximum: 100,
    example: 85.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  atsScore?: number;
}
