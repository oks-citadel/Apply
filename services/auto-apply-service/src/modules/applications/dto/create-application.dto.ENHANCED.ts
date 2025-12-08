import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'User ID (automatically populated from JWT token)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
    required: false,
  })
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  user_id: string;

  @ApiProperty({
    description: 'Job ID from the job service',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
    required: true,
  })
  @IsUUID(4, { message: 'Job ID must be a valid UUID' })
  job_id: string;

  @ApiPropertyOptional({
    description: 'Resume ID used for this application',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Resume ID must be a valid UUID' })
  @IsOptional()
  resume_id?: string;

  @ApiPropertyOptional({
    description: 'Cover letter ID used for this application',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Cover letter ID must be a valid UUID' })
  @IsOptional()
  cover_letter_id?: string;

  @ApiPropertyOptional({
    description: 'Match score between user profile and job requirements (0-100)',
    example: 85.5,
    minimum: 0,
    maximum: 100,
    type: Number,
  })
  @IsNumber({}, { message: 'Match score must be a number' })
  @Min(0, { message: 'Match score must be at least 0' })
  @Max(100, { message: 'Match score must not exceed 100' })
  @IsOptional()
  match_score?: number;

  @ApiPropertyOptional({
    description: 'Whether the application was submitted automatically by the system',
    example: true,
    default: false,
    type: Boolean,
  })
  @IsBoolean({ message: 'Auto applied must be a boolean value' })
  @IsOptional()
  auto_applied?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes or comments about the application',
    example: 'Great company culture, flexible working hours, competitive salary',
    maxLength: 2000,
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Name of the company',
    example: 'Tech Corp Inc.',
    maxLength: 255,
  })
  @IsString({ message: 'Company name must be a string' })
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Job position title',
    example: 'Senior Software Engineer',
    maxLength: 255,
  })
  @IsString({ message: 'Position title must be a string' })
  @IsOptional()
  position_title?: string;

  @ApiPropertyOptional({
    description: 'URL to the job application page',
    example: 'https://jobs.techcorp.com/apply/12345',
    maxLength: 500,
  })
  @IsString({ message: 'Application URL must be a string' })
  @IsOptional()
  application_url?: string;

  @ApiPropertyOptional({
    description: 'Applicant Tracking System (ATS) platform name',
    example: 'Greenhouse',
    enum: ['Greenhouse', 'Lever', 'Workday', 'Taleo', 'iCIMS', 'BambooHR', 'SAP SuccessFactors', 'Oracle Taleo', 'Other'],
  })
  @IsString({ message: 'ATS platform must be a string' })
  @IsOptional()
  ats_platform?: string;

  @ApiPropertyOptional({
    description: 'Form responses submitted with the application (custom questions and answers)',
    example: {
      'availability': 'Immediately',
      'salary_expectation': '$120,000 - $150,000',
      'willing_to_relocate': true,
      'years_of_experience': 5,
      'why_interested': 'Excited about the company mission and technology stack',
    },
    type: 'object',
  })
  @IsObject({ message: 'Form responses must be an object' })
  @IsOptional()
  form_responses?: Record<string, any>;
}
