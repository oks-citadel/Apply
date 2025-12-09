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
import { Type } from 'class-transformer';

export class StartApplicationDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  jobId: string;

  @IsUUID()
  @IsOptional()
  resumeId?: string;

  @IsUUID()
  @IsOptional()
  coverLetterId?: string;

  @IsBoolean()
  @IsOptional()
  autoSelectResume?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ScheduleConfig {
  @IsOptional()
  @Type(() => Date)
  startAt?: Date;

  @IsNumber()
  @IsOptional()
  @Min(1000)
  delayBetween?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxConcurrent?: number;
}

export class BatchApplicationDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  jobIds: string[];

  @IsUUID()
  @IsOptional()
  resumeId?: string;

  @IsUUID()
  @IsOptional()
  coverLetterId?: string;

  @IsBoolean()
  @IsOptional()
  autoSelectResume?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  priority?: number;

  @ValidateNested()
  @Type(() => ScheduleConfig)
  @IsOptional()
  schedule?: ScheduleConfig;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RetryApplicationDto {
  @IsUUID()
  userId: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;

  @IsObject()
  @IsOptional()
  overrides?: Record<string, any>;
}
