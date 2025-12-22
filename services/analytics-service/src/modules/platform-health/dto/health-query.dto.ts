import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * Query parameters for health report generation
 */
export class HealthReportQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the report period (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the report period (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Include detailed metrics in the report',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Include active alerts in the report',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeAlerts?: boolean;
}

/**
 * Query parameters for latency metrics
 */
export class LatencyMetricsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the metrics period (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the metrics period (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by service name',
    example: 'auth-service',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific endpoint',
    example: '/api/users',
  })
  @IsOptional()
  @IsString()
  endpoint?: string;
}

/**
 * Query parameters for error rates
 */
export class ErrorRatesQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the error rates period (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the error rates period (ISO 8601)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by service name',
    example: 'job-service',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Minimum error rate threshold (percentage)',
    example: 1.0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minErrorRate?: number;
}
