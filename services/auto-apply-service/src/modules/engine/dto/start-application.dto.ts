import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsObject,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class StartApplicationDto {
  @ApiProperty({
    description: 'User ID (automatically set from authenticated user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Job ID to apply for',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({
    description: 'Resume ID to use for the application',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  resumeId?: string;

  @ApiPropertyOptional({
    description: 'Cover letter ID to use for the application',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsOptional()
  coverLetterId?: string;

  @ApiPropertyOptional({
    description: 'Automatically select the best matching resume for this job',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoSelectResume?: boolean;

  @ApiPropertyOptional({
    description: 'Application priority (1-10, higher = processed sooner)',
    example: 5,
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for the application',
    example: { source: 'job-board', referrer: 'linkedin' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ScheduleConfig {
  @ApiPropertyOptional({
    description: 'When to start processing the batch',
    example: '2024-01-15T10:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  startAt?: Date;

  @ApiPropertyOptional({
    description: 'Delay between applications in milliseconds',
    example: 60000,
    minimum: 1000,
    default: 60000,
  })
  @IsNumber()
  @IsOptional()
  @Min(1000)
  delayBetween?: number;

  @ApiPropertyOptional({
    description: 'Maximum concurrent applications',
    example: 3,
    minimum: 1,
    maximum: 10,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxConcurrent?: number;
}

export class BatchApplicationDto {
  @ApiProperty({
    description: 'User ID (automatically set from authenticated user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'List of job IDs to apply for',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  jobIds: string[];

  @ApiPropertyOptional({
    description: 'Resume ID to use for all applications',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsOptional()
  resumeId?: string;

  @ApiPropertyOptional({
    description: 'Cover letter ID to use for all applications',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @IsUUID()
  @IsOptional()
  coverLetterId?: string;

  @ApiPropertyOptional({
    description: 'Use primary resume for all applications',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoSelectResume?: boolean;

  @ApiPropertyOptional({
    description: 'Application priority (1-10)',
    example: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Scheduling configuration for batch processing',
    type: ScheduleConfig,
  })
  @ValidateNested()
  @Type(() => ScheduleConfig)
  @IsOptional()
  schedule?: ScheduleConfig;

  @ApiPropertyOptional({
    description: 'Additional metadata for all applications',
    example: { campaign: 'weekly-apply' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RetryApplicationDto {
  @ApiProperty({
    description: 'User ID (automatically set from authenticated user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'Force retry even if max retries reached',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  force?: boolean;

  @ApiPropertyOptional({
    description: 'Override application data for retry',
    example: { useAlternateResume: true },
  })
  @IsObject()
  @IsOptional()
  overrides?: Record<string, any>;
}
