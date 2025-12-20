import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export enum TaskType {
  DISCOVER = 'discover',
  APPLY = 'apply',
  ANALYZE = 'analyze',
  PREPARE = 'prepare',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class ConstraintsDto {
  @ApiPropertyOptional({ description: 'Maximum applications per day' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  max_applications_per_day?: number;

  @ApiPropertyOptional({ description: 'Companies to exclude from applications' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blacklisted_companies?: string[];

  @ApiPropertyOptional({ description: 'Required keywords in job listings' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_keywords?: string[];

  @ApiPropertyOptional({ description: 'Minimum match score to apply' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  min_match_score?: number;
}

export class TaskParametersDto {
  @ApiPropertyOptional({ description: 'Job IDs to process' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  job_ids?: string[];

  @ApiPropertyOptional({ description: 'Resume ID to use' })
  @IsOptional()
  @IsString()
  resume_id?: string;

  @ApiPropertyOptional({ description: 'User preferences' })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Task constraints' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConstraintsDto)
  constraints?: ConstraintsDto;

  @ApiPropertyOptional({ description: 'Search keywords' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Locations to search' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({ description: 'Include remote jobs' })
  @IsOptional()
  @IsBoolean()
  remote?: boolean;
}

export class OrchestrateRequestDto {
  @ApiProperty({ description: 'User ID making the request' })
  @IsString()
  user_id: string;

  @ApiProperty({ enum: TaskType, description: 'Type of task to execute' })
  @IsEnum(TaskType)
  task_type: TaskType;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;

  @ApiPropertyOptional({ description: 'Task parameters' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaskParametersDto)
  parameters?: TaskParametersDto;

  @ApiPropertyOptional({ description: 'Callback URL for task completion' })
  @IsOptional()
  @IsString()
  callback_url?: string;

  @ApiPropertyOptional({ description: 'Task timeout in seconds', default: 300 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3600)
  timeout_seconds?: number = 300;
}

export class AgentStateDto {
  @ApiProperty({ description: 'Agent status' })
  status: string;

  @ApiPropertyOptional({ description: 'Last run timestamp' })
  last_run?: Date;

  @ApiPropertyOptional({ description: 'Items processed' })
  items_processed?: number;
}

export class TaskErrorDto {
  @ApiProperty({ description: 'Agent that encountered the error' })
  agent: string;

  @ApiProperty({ description: 'Error message' })
  error: string;

  @ApiProperty({ description: 'Whether the error is recoverable' })
  recoverable: boolean;
}

export class TaskResultDto {
  @ApiPropertyOptional({ description: 'Number of jobs discovered' })
  jobs_discovered?: number;

  @ApiPropertyOptional({ description: 'Number of applications submitted' })
  applications_submitted?: number;

  @ApiPropertyOptional({ description: 'Jobs matched' })
  jobs_matched?: number;

  @ApiPropertyOptional({ description: 'Errors encountered' })
  @IsArray()
  errors?: TaskErrorDto[];
}

export class OrchestrateResponseDto {
  @ApiProperty({ description: 'Task ID' })
  task_id: string;

  @ApiProperty({
    enum: ['queued', 'processing', 'completed', 'failed', 'partial'],
    description: 'Task status',
  })
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'partial';

  @ApiProperty({ description: 'Task start time' })
  started_at: Date;

  @ApiPropertyOptional({ description: 'Task completion time' })
  completed_at?: Date;

  @ApiPropertyOptional({ description: 'Task results' })
  results?: TaskResultDto;

  @ApiPropertyOptional({ description: 'Individual agent states' })
  agent_states?: Record<string, AgentStateDto>;

  @ApiPropertyOptional({ description: 'Next scheduled run' })
  next_scheduled_run?: Date;
}
