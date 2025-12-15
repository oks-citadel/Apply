import { IsNotEmpty, IsString, IsUUID, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateAlignedResumeDto {
  @ApiProperty({
    description: 'Resume ID to align',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  resumeId: string;

  @ApiProperty({
    description: 'Job ID from job service (optional if jobDescription provided)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({
    description: 'Job description text (optional if jobId provided)',
    example: 'We are looking for a Senior Full Stack Developer...',
    required: false,
  })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Senior Full Stack Developer',
    required: false,
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    description: 'Company name',
    example: 'TechCorp Inc.',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: 'Regional playbook to apply',
    example: 'united-states',
    enum: ['united-states', 'canada', 'united-kingdom', 'european-union', 'australia', 'global-remote'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['united-states', 'canada', 'united-kingdom', 'european-union', 'australia', 'global-remote'])
  playbookRegion?: string;

  @ApiProperty({
    description: 'Apply ATS optimization',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  applyAtsOptimization?: boolean;

  @ApiProperty({
    description: 'Title for the aligned resume',
    example: 'Resume for Senior Full Stack Developer at TechCorp',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;
}
