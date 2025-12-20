import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { AlignedResume } from './aligned-resume.entity';
import { Resume } from '../../resumes/entities/resume.entity';

export interface SkillGapAnalysis {
  matchedSkills: Array<{
    skill: string;
    source: 'resume' | 'inferred';
    proficiency?: string;
    yearsClaimed?: number;
  }>;
  missingSkills: Array<{
    skill: string;
    importance: 'required' | 'preferred' | 'nice-to-have';
    category?: string;
    learnability?: 'easy' | 'moderate' | 'difficult';
  }>;
  transferableSkills: Array<{
    skill: string;
    relatedTo: string[];
    explanation?: string;
  }>;
}

export interface ExperienceAlignment {
  relevantExperiences: Array<{
    experienceId: string;
    company: string;
    position: string;
    relevanceScore: number;
    matchingResponsibilities: string[];
    matchingAchievements: string[];
  }>;
  yearsOfRelevantExperience: number;
  seniority: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  industryMatch: boolean;
  roleTypeMatch: boolean;
}

export interface KeywordAnalysis {
  presentKeywords: Array<{
    keyword: string;
    frequency: number;
    context: string[];
    importance: 'high' | 'medium' | 'low';
  }>;
  missingKeywords: Array<{
    keyword: string;
    importance: 'critical' | 'important' | 'optional';
    suggestedPlacement?: string[];
  }>;
  atsCompatibility: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

export interface AlignmentChanges {
  sectionsReordered: Array<{
    section: string;
    oldPosition: number;
    newPosition: number;
    reason: string;
  }>;
  contentRewritten: Array<{
    section: string;
    itemId?: string;
    originalText: string;
    rewrittenText: string;
    reason: string;
    improvementType: 'keyword-optimization' | 'clarity' | 'relevance' | 'quantification';
  }>;
  itemsHighlighted: Array<{
    section: string;
    itemId?: string;
    reason: string;
  }>;
  keywordsAdded: Array<{
    keyword: string;
    location: string;
    natural: boolean;
  }>;
}

export interface ImprovementSuggestions {
  skillGaps: Array<{
    skill: string;
    priority: 'high' | 'medium' | 'low';
    learningResources?: string[];
    estimatedTimeToLearn?: string;
  }>;
  experienceGaps: Array<{
    gap: string;
    severity: 'critical' | 'moderate' | 'minor';
    mitigationStrategies?: string[];
  }>;
  certificationSuggestions: Array<{
    certification: string;
    relevance: number;
    provider?: string;
    estimatedCost?: string;
  }>;
  resumeImprovements: Array<{
    improvement: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'easy' | 'moderate' | 'significant';
  }>;
}

@Entity('alignment_analyses')
@Index(['userId', 'jobId'])
@Index(['userId', 'createdAt'])
@Index(['alignedResumeId'])
export class AlignmentAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'job_id', type: 'uuid', nullable: true })
  @Index()
  jobId: string;

  @Column({ name: 'base_resume_id', type: 'uuid' })
  baseResumeId: string;

  @ManyToOne(() => Resume, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'base_resume_id' })
  baseResume: Resume;

  @Column({ name: 'aligned_resume_id', type: 'uuid', nullable: true })
  alignedResumeId: string;

  @ManyToOne(() => AlignedResume, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aligned_resume_id' })
  alignedResume: AlignedResume;

  // Job description data
  @Column({ name: 'job_description', type: 'text' })
  jobDescription: string;

  @Column({ name: 'job_title', type: 'varchar', length: 255, nullable: true })
  jobTitle: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName: string;

  // Analysis results
  @Column({ name: 'overall_match_score', type: 'decimal', precision: 5, scale: 2 })
  overallMatchScore: number;

  @Column({ name: 'skill_gap_analysis', type: 'jsonb' })
  skillGapAnalysis: SkillGapAnalysis;

  @Column({ name: 'experience_alignment', type: 'jsonb' })
  experienceAlignment: ExperienceAlignment;

  @Column({ name: 'keyword_analysis', type: 'jsonb' })
  keywordAnalysis: KeywordAnalysis;

  @Column({ name: 'alignment_changes', type: 'jsonb', nullable: true })
  alignmentChanges: AlignmentChanges;

  @Column({ name: 'improvement_suggestions', type: 'jsonb' })
  improvementSuggestions: ImprovementSuggestions;

  // Match breakdown
  @Column({ name: 'skill_match_percentage', type: 'decimal', precision: 5, scale: 2 })
  skillMatchPercentage: number;

  @Column({ name: 'experience_match_percentage', type: 'decimal', precision: 5, scale: 2 })
  experienceMatchPercentage: number;

  @Column({ name: 'education_match_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  educationMatchPercentage: number;

  @Column({ name: 'certification_match_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  certificationMatchPercentage: number;

  // Explanation
  @Column({ name: 'match_explanation', type: 'text' })
  matchExplanation: string; // Human-readable explanation of why the job fits

  @Column({ name: 'strengths', type: 'jsonb' })
  strengths: string[]; // Key strengths for this role

  @Column({ name: 'weaknesses', type: 'jsonb' })
  weaknesses: string[]; // Areas where candidate falls short

  @Column({ name: 'recommendation', type: 'varchar', length: 50 })
  recommendation: 'strong-fit' | 'good-fit' | 'moderate-fit' | 'weak-fit' | 'poor-fit';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
