import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNumber, IsArray, IsUUID, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AutoApplyFiltersDto {
  @ApiPropertyOptional({
    description: 'Target job titles to apply for',
    example: ['Software Engineer', 'Full Stack Developer'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  jobTitle?: string[];

  @ApiPropertyOptional({
    description: 'Target locations',
    example: ['San Francisco, CA', 'New York, NY', 'Remote'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  location?: string[];

  @ApiPropertyOptional({
    description: 'Experience levels to target',
    example: ['mid', 'senior'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  experienceLevel?: string[];

  @ApiPropertyOptional({
    description: 'Employment types to target',
    example: ['full-time', 'contract'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  employmentType?: string[];

  @ApiPropertyOptional({
    description: 'Minimum salary requirement',
    example: 100000,
  })
  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @ApiPropertyOptional({
    description: 'Keywords to match in job descriptions',
    example: ['React', 'TypeScript', 'Node.js'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'Keywords to exclude from job search',
    example: ['PHP', 'WordPress'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeKeywords?: string[];
}

export class UpdateAutoApplySettingsDto {
  @ApiProperty({
    description: 'Enable or disable auto-apply',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'Job search filters for auto-apply',
    type: AutoApplyFiltersDto,
  })
  @ValidateNested()
  @Type(() => AutoApplyFiltersDto)
  filters: AutoApplyFiltersDto;

  @ApiProperty({
    description: 'Default resume ID to use for applications',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  resumeId: string;

  @ApiPropertyOptional({
    description: 'Cover letter template content',
    example: 'Dear Hiring Manager, I am excited to apply for the {position} role at {company}...',
  })
  @IsString()
  @IsOptional()
  coverLetterTemplate?: string;

  @ApiPropertyOptional({
    description: 'Maximum applications to submit per day',
    example: 25,
    default: 20,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxApplicationsPerDay?: number;

  @ApiPropertyOptional({
    description: 'Automatically respond to common screening questions',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoResponse?: boolean;
}

export class AutoApplyStatusDto {
  @ApiProperty({
    description: 'Whether auto-apply is currently running',
    example: true,
  })
  isRunning: boolean;

  @ApiProperty({
    description: 'Number of applications submitted today',
    example: 12,
  })
  applicationsToday: number;

  @ApiProperty({
    description: 'Total applications submitted all time',
    example: 345,
  })
  totalApplications: number;

  @ApiProperty({
    description: 'Success rate percentage',
    example: 78.5,
  })
  successRate: number;

  @ApiPropertyOptional({
    description: 'Last time auto-apply ran',
    example: '2024-01-15T10:30:00Z',
  })
  lastRunAt?: string;

  @ApiPropertyOptional({
    description: 'Next scheduled auto-apply run',
    example: '2024-01-15T11:00:00Z',
  })
  nextRunAt?: string;
}
