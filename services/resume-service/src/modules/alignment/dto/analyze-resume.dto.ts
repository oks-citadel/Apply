import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class AnalyzeResumeDto {
  @ApiProperty({
    description: 'Resume ID to analyze',
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
    description: 'Additional job metadata',
    example: {
      location: 'San Francisco, CA',
      industry: 'Technology',
      salary: '$120k-$180k',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  jobMetadata?: Record<string, any>;
}
