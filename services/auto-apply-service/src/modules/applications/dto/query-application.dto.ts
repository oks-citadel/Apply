import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';
import { Type } from 'class-transformer';

export class QueryApplicationDto {
  @ApiPropertyOptional({
    description: 'Filter by application status',
    enum: ApplicationStatus,
    example: 'applied',
  })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Filter by company name (partial match)',
    example: 'Google',
  })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Filter by ATS platform',
    example: 'greenhouse',
  })
  @IsString()
  @IsOptional()
  ats_platform?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
    minimum: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'created_at',
    default: 'created_at',
  })
  @IsString()
  @IsOptional()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsString()
  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
