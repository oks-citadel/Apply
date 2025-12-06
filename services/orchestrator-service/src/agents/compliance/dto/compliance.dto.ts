import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ComplianceAction {
  CHECK = 'check',
  LOG = 'log',
  REPORT = 'report',
  CONFIGURE = 'configure',
}

export enum Platform {
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  GLASSDOOR = 'glassdoor',
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  WORKDAY = 'workday',
  ICIMS = 'icims',
  TALEO = 'taleo',
  SMARTRECRUITERS = 'smartrecruiters',
  JOBVITE = 'jobvite',
  GENERIC = 'generic',
}

export enum WarningSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export class ContextDto {
  @ApiProperty({ enum: Platform, description: 'Platform being accessed' })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({ description: 'Operation being performed' })
  @IsString()
  operation: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  user_id: string;
}

export class LimitsDto {
  @ApiPropertyOptional({ description: 'Requests per minute limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requests_per_minute?: number;

  @ApiPropertyOptional({ description: 'Requests per hour limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requests_per_hour?: number;

  @ApiPropertyOptional({ description: 'Requests per day limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requests_per_day?: number;

  @ApiPropertyOptional({ description: 'Applications per day limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  applications_per_day?: number;
}

export class ComplianceCheckRequestDto {
  @ApiProperty({ enum: ComplianceAction, description: 'Action to perform' })
  @IsEnum(ComplianceAction)
  action: ComplianceAction;

  @ApiProperty({ description: 'Context information' })
  @ValidateNested()
  @Type(() => ContextDto)
  context: ContextDto;

  @ApiPropertyOptional({ description: 'Rate limits to check against' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitsDto)
  limits?: LimitsDto;
}

export class RateLimitStatusDto {
  @ApiProperty({ description: 'Current usage count' })
  current_usage: number;

  @ApiProperty({ description: 'Limit value' })
  limit: number;

  @ApiProperty({ description: 'When the limit resets' })
  reset_at: Date;

  @ApiProperty({ description: 'Recommended delay in milliseconds' })
  recommended_delay_ms: number;
}

export class ComplianceWarningDto {
  @ApiProperty({ description: 'Warning type' })
  type: string;

  @ApiProperty({ description: 'Warning message' })
  message: string;

  @ApiProperty({ enum: WarningSeverity, description: 'Warning severity' })
  severity: WarningSeverity;
}

export class ComplianceCheckResponseDto {
  @ApiProperty({ description: 'Whether the action is allowed' })
  allowed: boolean;

  @ApiProperty({ description: 'Rate limit status' })
  rate_limit_status: RateLimitStatusDto;

  @ApiProperty({ description: 'Compliance score (0-100)' })
  compliance_score: number;

  @ApiProperty({ description: 'Compliance warnings', type: [ComplianceWarningDto] })
  warnings: ComplianceWarningDto[];

  @ApiProperty({ description: 'Audit log ID' })
  audit_log_id: string;
}

export class AuditLogEntryDto {
  @ApiProperty({ description: 'Log entry ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Platform' })
  platform: string;

  @ApiProperty({ description: 'Operation performed' })
  operation: string;

  @ApiProperty({ description: 'Whether the operation was allowed' })
  allowed: boolean;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, unknown>;
}
