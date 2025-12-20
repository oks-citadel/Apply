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

export interface CoverLetterMetadata {
  targetJobTitle?: string;
  targetCompany?: string;
  targetHiringManager?: string;
  targetLocation?: string;
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'formal';
  style?: 'traditional' | 'modern' | 'creative';
  playbookRegion?: string;
  keyPointsHighlighted?: string[];
  skillsEmphasized?: string[];
}

@Entity('generated_cover_letters')
@Index(['userId', 'jobId'])
@Index(['userId', 'createdAt'])
@Index(['alignedResumeId'])
export class GeneratedCoverLetter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'job_id', type: 'uuid', nullable: true })
  @Index()
  jobId: string;

  @Column({ name: 'aligned_resume_id', type: 'uuid', nullable: true })
  alignedResumeId: string;

  @ManyToOne(() => AlignedResume, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'aligned_resume_id' })
  alignedResume: AlignedResume;

  @Column({ name: 'base_resume_id', type: 'uuid', nullable: true })
  baseResumeId: string;

  @ManyToOne(() => Resume, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'base_resume_id' })
  baseResume: Resume;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string; // The actual cover letter text

  @Column({ name: 'content_html', type: 'text', nullable: true })
  contentHtml: string; // HTML formatted version

  @Column({ type: 'jsonb' })
  metadata: CoverLetterMetadata;

  @Column({ name: 'relevance_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  relevanceScore: number; // How well it addresses the job (0-100)

  @Column({ name: 'tone_appropriateness', type: 'decimal', precision: 5, scale: 2, nullable: true })
  toneAppropriateness: number; // Tone/style match score (0-100)

  @Column({ name: 'word_count', type: 'int', nullable: true })
  wordCount: number;

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
