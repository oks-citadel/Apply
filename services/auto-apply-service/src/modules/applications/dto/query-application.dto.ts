import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';
import { Type } from 'class-transformer';

export class QueryApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  ats_platform?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  sort_by?: string = 'created_at';

  @IsString()
  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
