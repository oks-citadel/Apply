import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';

import { AssignmentStatus } from '../entities/recruiter-assignment.entity';

export class UpdateAssignmentDto {
  @ApiPropertyOptional({
    description: 'Update assignment status',
    enum: AssignmentStatus,
  })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Recruiter notes' })
  @IsString()
  @IsOptional()
  recruiter_notes?: string;

  @ApiPropertyOptional({ description: 'Number of applications submitted' })
  @IsInt()
  @Min(0)
  @IsOptional()
  applications_submitted?: number;

  @ApiPropertyOptional({ description: 'Number of interviews scheduled' })
  @IsInt()
  @Min(0)
  @IsOptional()
  interviews_scheduled?: number;

  @ApiPropertyOptional({ description: 'Number of offers received' })
  @IsInt()
  @Min(0)
  @IsOptional()
  offers_received?: number;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress_percentage?: number;
}
