import { ApiProperty } from '@nestjs/swagger';

import type { ResumeContent } from '../entities/resume.entity';

export class OptimizationSuggestion {
  @ApiProperty({
    description: 'Section of the resume being suggested',
    example: 'summary',
  })
  section: string;

  @ApiProperty({
    description: 'Type of suggestion',
    example: 'improvement',
    enum: ['improvement', 'addition', 'removal', 'rewrite'],
  })
  type: 'improvement' | 'addition' | 'removal' | 'rewrite';

  @ApiProperty({
    description: 'Current content (if applicable)',
    example: 'Software developer with experience in web applications',
  })
  currentContent?: string;

  @ApiProperty({
    description: 'Suggested content',
    example: 'Results-driven Senior Software Engineer with 5+ years of experience building scalable web applications...',
  })
  suggestedContent: string;

  @ApiProperty({
    description: 'Reason for the suggestion',
    example: 'Your summary should highlight quantifiable achievements and align with the job requirements',
  })
  reason: string;

  @ApiProperty({
    description: 'Priority level of the suggestion',
    example: 'high',
    enum: ['low', 'medium', 'high'],
  })
  priority: 'low' | 'medium' | 'high';
}

export class ResumeOptimizationResponseDto {
  @ApiProperty({
    description: 'Resume ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  resumeId: string;

  @ApiProperty({
    description: 'Original resume content',
    type: 'object',
  })
  originalContent: ResumeContent;

  @ApiProperty({
    description: 'Optimized resume content with AI suggestions applied',
    type: 'object',
  })
  optimizedContent: ResumeContent;

  @ApiProperty({
    description: 'List of optimization suggestions',
    type: [OptimizationSuggestion],
  })
  suggestions: OptimizationSuggestion[];

  @ApiProperty({
    description: 'Overall ATS score before optimization',
    example: 75,
  })
  originalScore: number;

  @ApiProperty({
    description: 'Projected ATS score after optimization',
    example: 92,
  })
  projectedScore: number;

  @ApiProperty({
    description: 'Overall optimization summary',
    example: 'Your resume has been optimized with 8 suggestions to better match the job description. Key improvements include enhanced summary, quantified achievements, and relevant skill highlighting.',
  })
  summary: string;

  @ApiProperty({
    description: 'Keywords missing from resume that are in job description',
    type: [String],
    example: ['microservices', 'kubernetes', 'CI/CD'],
  })
  missingKeywords: string[];

  @ApiProperty({
    description: 'Keywords already present in resume',
    type: [String],
    example: ['javascript', 'react', 'node.js', 'typescript'],
  })
  matchedKeywords: string[];
}
