import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';

import { AgentType } from '../interfaces/agent.interface';
import { WorkflowType, WorkflowStatus } from '../interfaces/workflow.interface';

export class ExecuteWorkflowDto {
  @ApiProperty({ enum: WorkflowType, description: 'Type of workflow to execute' })
  @IsEnum(WorkflowType)
  workflow_type: WorkflowType;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  user_id: string;

  @ApiPropertyOptional({ description: 'Workflow parameters' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Callback URL for completion notification' })
  @IsOptional()
  @IsString()
  callback_url?: string;
}

export class WorkflowStepResultDto {
  @ApiProperty({ description: 'Step ID' })
  step_id: string;

  @ApiProperty({ enum: AgentType, description: 'Agent that executed the step' })
  agent: AgentType;

  @ApiProperty({ enum: WorkflowStatus, description: 'Step status' })
  status: WorkflowStatus;

  @ApiPropertyOptional({ description: 'Step start time' })
  started_at?: Date;

  @ApiPropertyOptional({ description: 'Step completion time' })
  completed_at?: Date;

  @ApiPropertyOptional({ description: 'Step result data' })
  result?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiProperty({ description: 'Number of retry attempts' })
  retry_count: number;
}

export class WorkflowExecutionDto {
  @ApiProperty({ description: 'Workflow execution ID' })
  id: string;

  @ApiProperty({ enum: WorkflowType, description: 'Workflow type' })
  workflow_type: WorkflowType;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ enum: WorkflowStatus, description: 'Overall workflow status' })
  status: WorkflowStatus;

  @ApiProperty({ description: 'Workflow steps', type: [WorkflowStepResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepResultDto)
  steps: WorkflowStepResultDto[];

  @ApiProperty({ description: 'Workflow start time' })
  started_at: Date;

  @ApiPropertyOptional({ description: 'Workflow completion time' })
  completed_at?: Date;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Final result data' })
  result?: Record<string, unknown>;
}

export class JobDiscoveryWorkflowParamsDto {
  @ApiPropertyOptional({ description: 'Search keywords' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Job titles to search' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  titles?: string[];

  @ApiPropertyOptional({ description: 'Locations to search' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({ description: 'Include remote positions' })
  @IsOptional()
  remote?: boolean;

  @ApiPropertyOptional({ description: 'Minimum salary' })
  @IsOptional()
  min_salary?: number;

  @ApiPropertyOptional({ description: 'Maximum salary' })
  @IsOptional()
  max_salary?: number;

  @ApiPropertyOptional({ description: 'Experience levels' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  experience_levels?: string[];

  @ApiPropertyOptional({ description: 'Job sources to search' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[];
}

export class ApplicationWorkflowParamsDto {
  @ApiProperty({ description: 'Job ID to apply to' })
  @IsString()
  job_id: string;

  @ApiPropertyOptional({ description: 'Resume ID to use' })
  @IsOptional()
  @IsString()
  resume_id?: string;

  @ApiPropertyOptional({ description: 'Generate cover letter' })
  @IsOptional()
  generate_cover_letter?: boolean;

  @ApiPropertyOptional({ description: 'Custom cover letter content' })
  @IsOptional()
  @IsString()
  custom_cover_letter?: string;

  @ApiPropertyOptional({ description: 'Additional notes for application' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InterviewPrepWorkflowParamsDto {
  @ApiProperty({ description: 'Job ID for interview prep' })
  @IsString()
  job_id: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  company: string;

  @ApiPropertyOptional({ description: 'Interview type' })
  @IsOptional()
  @IsString()
  interview_type?: string;

  @ApiPropertyOptional({ description: 'Interviewer name' })
  @IsOptional()
  @IsString()
  interviewer_name?: string;

  @ApiPropertyOptional({ description: 'Interview date' })
  @IsOptional()
  interview_date?: Date;

  @ApiPropertyOptional({ description: 'Include salary research' })
  @IsOptional()
  include_salary_research?: boolean;
}
