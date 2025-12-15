import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentType, AssignmentPriority } from '../entities/recruiter-assignment.entity';

export class EscalateApplicationDto {
  @ApiProperty({ description: 'Application ID to escalate' })
  @IsUUID()
  @IsNotEmpty()
  application_id: string;

  @ApiPropertyOptional({ description: 'Specific recruiter to escalate to (optional)' })
  @IsUUID()
  @IsOptional()
  recruiter_id?: string;

  @ApiProperty({ description: 'Reason for escalation' })
  @IsString()
  @IsNotEmpty()
  escalation_reason: string;

  @ApiPropertyOptional({
    description: 'Type of help needed',
    enum: AssignmentType,
    default: AssignmentType.APPLICATION_SUPPORT,
  })
  @IsEnum(AssignmentType)
  @IsOptional()
  assignment_type?: AssignmentType;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: AssignmentPriority,
    default: AssignmentPriority.NORMAL,
  })
  @IsEnum(AssignmentPriority)
  @IsOptional()
  priority?: AssignmentPriority;

  @ApiPropertyOptional({ description: 'Additional notes or context' })
  @IsString()
  @IsOptional()
  notes?: string;
}
