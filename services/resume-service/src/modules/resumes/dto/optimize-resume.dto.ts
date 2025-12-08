import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class OptimizeResumeDto {
  @ApiPropertyOptional({
    description: 'Job description to optimize resume against',
    example: 'We are looking for a Senior Software Engineer with 5+ years of experience in Node.js, React, and TypeScript...',
    maxLength: 10000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  jobDescription?: string;

  @ApiPropertyOptional({
    description: 'Job title to target',
    example: 'Senior Software Engineer',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  jobTitle?: string;

  @ApiPropertyOptional({
    description: 'Company name to target',
    example: 'Google',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;
}
