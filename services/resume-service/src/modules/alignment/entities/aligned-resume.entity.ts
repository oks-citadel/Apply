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

import { Resume } from '../../resumes/entities/resume.entity';

export interface AlignedContent {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  summary?: string;
  experience?: Array<{
    id?: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description: string;
    achievements?: string[];
    highlighted?: boolean; // Marked for emphasis
    relevanceScore?: number; // 0-100
  }>;
  education?: Array<{
    id?: string;
    institution: string;
    degree: string;
    field: string;
    location?: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    achievements?: string[];
    highlighted?: boolean;
    relevanceScore?: number;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
    tools?: string[];
    matched?: string[]; // Skills that match job requirements
    missing?: string[]; // Skills from job description not in resume
  };
  certifications?: Array<{
    id?: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
    highlighted?: boolean;
    relevanceScore?: number;
  }>;
  projects?: Array<{
    id?: string;
    name: string;
    description: string;
    technologies?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    github?: string;
    highlighted?: boolean;
    relevanceScore?: number;
  }>;
  languages?: Array<{
    id?: string;
    language: string;
    proficiency: string;
    highlighted?: boolean;
  }>;
  customSections?: Array<{
    id?: string;
    title: string;
    content: string;
    order?: number;
    highlighted?: boolean;
  }>;
}

export interface AlignmentMetadata {
  targetJobTitle?: string;
  targetCompany?: string;
  targetIndustry?: string;
  targetLocation?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  keywords?: string[];
  atsOptimizationApplied?: boolean;
  playbookRegion?: string;
  playbookApplied?: boolean;
}

@Entity('aligned_resumes')
@Index(['userId', 'jobId'])
@Index(['userId', 'createdAt'])
@Index(['baseResumeId'])
export class AlignedResume {
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

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'jsonb' })
  content: AlignedContent;

  @Column({ name: 'alignment_metadata', type: 'jsonb' })
  alignmentMetadata: AlignmentMetadata;

  @Column({ name: 'match_score', type: 'decimal', precision: 5, scale: 2 })
  matchScore: number; // Overall match score (0-100)

  @Column({ name: 'ats_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  atsScore: number; // ATS compatibility score (0-100)

  @Column({ name: 'skill_match_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  skillMatchScore: number; // Skill match score (0-100)

  @Column({ name: 'experience_match_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  experienceMatchScore: number; // Experience relevance score (0-100)

  @Column({ name: 'keyword_density', type: 'decimal', precision: 5, scale: 2, nullable: true })
  keywordDensity: number; // Percentage of job keywords present

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: true })
  filePath: string; // Path to generated PDF/DOCX

  @Column({ name: 'file_type', type: 'varchar', length: 50, nullable: true })
  fileType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
