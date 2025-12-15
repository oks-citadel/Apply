import { ApiProperty } from '@nestjs/swagger';
import {
  AlignmentAnalysis,
  SkillGapAnalysis,
  ExperienceAlignment,
  KeywordAnalysis,
  AlignmentChanges,
  ImprovementSuggestions,
} from '../entities/alignment-analysis.entity';
import { AlignedResume } from '../entities/aligned-resume.entity';
import { GeneratedCoverLetter } from '../entities/generated-cover-letter.entity';

export class AlignmentAnalysisResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', nullable: true })
  jobId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  baseResumeId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003', nullable: true })
  alignedResumeId: string;

  @ApiProperty({ example: 'Senior Full Stack Developer' })
  jobTitle: string;

  @ApiProperty({ example: 'TechCorp Inc.' })
  companyName: string;

  @ApiProperty({ example: 85.5 })
  overallMatchScore: number;

  @ApiProperty()
  skillGapAnalysis: SkillGapAnalysis;

  @ApiProperty()
  experienceAlignment: ExperienceAlignment;

  @ApiProperty()
  keywordAnalysis: KeywordAnalysis;

  @ApiProperty()
  improvementSuggestions: ImprovementSuggestions;

  @ApiProperty({ example: 88.0 })
  skillMatchPercentage: number;

  @ApiProperty({ example: 92.0 })
  experienceMatchPercentage: number;

  @ApiProperty({ example: 75.0, nullable: true })
  educationMatchPercentage: number;

  @ApiProperty({ example: 80.0, nullable: true })
  certificationMatchPercentage: number;

  @ApiProperty({
    example:
      'You are a strong fit for this role based on your extensive full-stack development experience and strong match with required technologies.',
  })
  matchExplanation: string;

  @ApiProperty({
    example: ['5+ years of React experience', 'Strong Node.js background', 'Cloud architecture experience'],
  })
  strengths: string[];

  @ApiProperty({ example: ['No AWS certification', 'Limited DevOps experience'] })
  weaknesses: string[];

  @ApiProperty({ example: 'strong-fit', enum: ['strong-fit', 'good-fit', 'moderate-fit', 'weak-fit', 'poor-fit'] })
  recommendation: string;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(entity: AlignmentAnalysis): AlignmentAnalysisResponseDto {
    const dto = new AlignmentAnalysisResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.jobId = entity.jobId;
    dto.baseResumeId = entity.baseResumeId;
    dto.alignedResumeId = entity.alignedResumeId;
    dto.jobTitle = entity.jobTitle;
    dto.companyName = entity.companyName;
    dto.overallMatchScore = Number(entity.overallMatchScore);
    dto.skillGapAnalysis = entity.skillGapAnalysis;
    dto.experienceAlignment = entity.experienceAlignment;
    dto.keywordAnalysis = entity.keywordAnalysis;
    dto.improvementSuggestions = entity.improvementSuggestions;
    dto.skillMatchPercentage = Number(entity.skillMatchPercentage);
    dto.experienceMatchPercentage = Number(entity.experienceMatchPercentage);
    dto.educationMatchPercentage = entity.educationMatchPercentage ? Number(entity.educationMatchPercentage) : null;
    dto.certificationMatchPercentage = entity.certificationMatchPercentage
      ? Number(entity.certificationMatchPercentage)
      : null;
    dto.matchExplanation = entity.matchExplanation;
    dto.strengths = entity.strengths;
    dto.weaknesses = entity.weaknesses;
    dto.recommendation = entity.recommendation;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}

export class AlignedResumeResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', nullable: true })
  jobId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  baseResumeId: string;

  @ApiProperty({ example: 'Resume for Senior Full Stack Developer at TechCorp' })
  title: string;

  @ApiProperty()
  content: any;

  @ApiProperty()
  alignmentMetadata: any;

  @ApiProperty({ example: 85.5 })
  matchScore: number;

  @ApiProperty({ example: 92.0 })
  atsScore: number;

  @ApiProperty({ example: 88.0 })
  skillMatchScore: number;

  @ApiProperty({ example: 90.0 })
  experienceMatchScore: number;

  @ApiProperty({ example: 75.0 })
  keywordDensity: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: AlignedResume): AlignedResumeResponseDto {
    const dto = new AlignedResumeResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.jobId = entity.jobId;
    dto.baseResumeId = entity.baseResumeId;
    dto.title = entity.title;
    dto.content = entity.content;
    dto.alignmentMetadata = entity.alignmentMetadata;
    dto.matchScore = Number(entity.matchScore);
    dto.atsScore = entity.atsScore ? Number(entity.atsScore) : null;
    dto.skillMatchScore = entity.skillMatchScore ? Number(entity.skillMatchScore) : null;
    dto.experienceMatchScore = entity.experienceMatchScore ? Number(entity.experienceMatchScore) : null;
    dto.keywordDensity = entity.keywordDensity ? Number(entity.keywordDensity) : null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

export class GeneratedCoverLetterResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', nullable: true })
  jobId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', nullable: true })
  alignedResumeId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003', nullable: true })
  baseResumeId: string;

  @ApiProperty({ example: 'Cover Letter for Senior Full Stack Developer at TechCorp' })
  title: string;

  @ApiProperty({ example: 'Dear Hiring Manager,\n\n...' })
  content: string;

  @ApiProperty()
  metadata: any;

  @ApiProperty({ example: 90.0 })
  relevanceScore: number;

  @ApiProperty({ example: 95.0 })
  toneAppropriateness: number;

  @ApiProperty({ example: 350 })
  wordCount: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: GeneratedCoverLetter): GeneratedCoverLetterResponseDto {
    const dto = new GeneratedCoverLetterResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.jobId = entity.jobId;
    dto.alignedResumeId = entity.alignedResumeId;
    dto.baseResumeId = entity.baseResumeId;
    dto.title = entity.title;
    dto.content = entity.content;
    dto.metadata = entity.metadata;
    dto.relevanceScore = entity.relevanceScore ? Number(entity.relevanceScore) : null;
    dto.toneAppropriateness = entity.toneAppropriateness ? Number(entity.toneAppropriateness) : null;
    dto.wordCount = entity.wordCount;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

export class ExplainAlignmentResponseDto {
  @ApiProperty()
  analysis: AlignmentAnalysisResponseDto;

  @ApiProperty({ nullable: true })
  alignmentChanges: AlignmentChanges;

  @ApiProperty({
    example: {
      original: { summary: '...', experience: [] },
      aligned: { summary: '...', experience: [] },
    },
  })
  beforeAfter: {
    original: any;
    aligned: any;
  };

  @ApiProperty({
    example: [
      {
        change: 'Reordered experience section to highlight cloud architecture projects',
        impact: 'Increased relevance score by 15%',
      },
    ],
  })
  changeExplanations: Array<{
    change: string;
    impact: string;
  }>;
}
