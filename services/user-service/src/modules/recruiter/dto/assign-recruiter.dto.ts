import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AssignmentType,
  AssignmentPriority,
} from '../entities/recruiter-assignment.entity';

export class AssignRecruiterDto {
  @ApiProperty({ description: 'Recruiter ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  recruiter_id: string;

  @ApiProperty({
    description: 'Type of assignment',
    enum: AssignmentType,
  })
  @IsEnum(AssignmentType)
  assignment_type: AssignmentType;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: AssignmentPriority,
    default: AssignmentPriority.NORMAL,
  })
  @IsEnum(AssignmentPriority)
  @IsOptional()
  priority?: AssignmentPriority;

  @ApiPropertyOptional({ description: 'User requirements and expectations' })
  @IsString()
  @IsOptional()
  user_requirements?: string;

  @ApiPropertyOptional({
    description: 'Target industries',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_industries?: string[];

  @ApiPropertyOptional({
    description: 'Target roles',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_roles?: string[];

  @ApiPropertyOptional({
    description: 'Target locations',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_locations?: string[];

  @ApiPropertyOptional({ description: 'Minimum target salary' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  target_salary_min?: number;

  @ApiPropertyOptional({ description: 'Maximum target salary' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  target_salary_max?: number;

  @ApiPropertyOptional({ description: 'Salary currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  salary_currency?: string;
}
