import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  RemoteType,
  ExperienceLevel,
  EmploymentType,
} from '../../jobs/entities/job.entity';
import { AlertFrequency } from '../entities/job-alert.entity';

export class CreateAlertDto {
  @ApiProperty({ description: 'Alert name', example: 'Senior Frontend Developer in NYC' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Search keywords', example: 'React TypeScript' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  keywords?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'New York, NY' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Remote work type', enum: RemoteType })
  @IsOptional()
  @IsEnum(RemoteType)
  remote_type?: RemoteType;

  @ApiPropertyOptional({ description: 'Minimum salary', example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary_min?: number;

  @ApiPropertyOptional({ description: 'Maximum salary', example: 150000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary_max?: number;

  @ApiPropertyOptional({ description: 'Experience level', enum: ExperienceLevel })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experience_level?: ExperienceLevel;

  @ApiPropertyOptional({ description: 'Employment type', enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @ApiPropertyOptional({
    description: 'Required skills',
    type: [String],
    example: ['React', 'TypeScript', 'Node.js'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Company ID to filter by' })
  @IsOptional()
  @IsString()
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Alert frequency',
    enum: AlertFrequency,
    default: AlertFrequency.DAILY,
  })
  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;

  @ApiPropertyOptional({ description: 'Is alert active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateAlertDto {
  @ApiPropertyOptional({ description: 'Alert name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Search keywords' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  keywords?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Remote work type', enum: RemoteType })
  @IsOptional()
  @IsEnum(RemoteType)
  remote_type?: RemoteType;

  @ApiPropertyOptional({ description: 'Minimum salary' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary_min?: number;

  @ApiPropertyOptional({ description: 'Maximum salary' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salary_max?: number;

  @ApiPropertyOptional({ description: 'Experience level', enum: ExperienceLevel })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experience_level?: ExperienceLevel;

  @ApiPropertyOptional({ description: 'Employment type', enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @ApiPropertyOptional({ description: 'Required skills', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Company ID to filter by' })
  @IsOptional()
  @IsString()
  company_id?: string;

  @ApiPropertyOptional({ description: 'Alert frequency', enum: AlertFrequency })
  @IsOptional()
  @IsEnum(AlertFrequency)
  frequency?: AlertFrequency;

  @ApiPropertyOptional({ description: 'Is alert active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
