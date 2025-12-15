import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCoverLetterDto {
  @ApiProperty({
    description: 'Resume ID to base cover letter on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  resumeId: string;

  @ApiProperty({
    description: 'Aligned resume ID (optional, if already generated)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  alignedResumeId?: string;

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
    description: 'Hiring manager name (if known)',
    example: 'Jane Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  hiringManager?: string;

  @ApiProperty({
    description: 'Tone of the cover letter',
    example: 'professional',
    enum: ['professional', 'casual', 'enthusiastic', 'formal'],
    default: 'professional',
  })
  @IsOptional()
  @IsEnum(['professional', 'casual', 'enthusiastic', 'formal'])
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal';

  @ApiProperty({
    description: 'Style of the cover letter',
    example: 'modern',
    enum: ['traditional', 'modern', 'creative'],
    default: 'modern',
  })
  @IsOptional()
  @IsEnum(['traditional', 'modern', 'creative'])
  style?: 'traditional' | 'modern' | 'creative';

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
    description: 'Title for the cover letter',
    example: 'Cover Letter for Senior Full Stack Developer at TechCorp',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;
}
