import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Playbook } from './playbook.entity';

export enum ApplicationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPLIED = 'applied',
  UNDER_REVIEW = 'under_review',
  INTERVIEW = 'interview',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
  WITHDRAWN = 'withdrawn',
}

export interface PlaybookAdjustments {
  resume_format_changed: boolean;
  cover_letter_style_changed: boolean;
  salary_adjusted: boolean;
  custom_modifications: string[];
}

export interface ApplicationMetrics {
  application_time_seconds: number;
  resume_score: number;
  ats_compatibility_score: number;
  playbook_match_score: number;
  modifications_made: number;
}

@Entity('playbook_applications')
@Index(['user_id'])
@Index(['job_id'])
@Index(['playbook_id'])
@Index(['status'])
@Index(['applied_at'])
export class PlaybookApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  job_id: string;

  @Column({ type: 'uuid' })
  playbook_id: string;

  @ManyToOne(() => Playbook, { eager: true })
  @JoinColumn({ name: 'playbook_id' })
  playbook: Playbook;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ type: 'uuid', nullable: true })
  resume_id: string; // ID of the resume used

  @Column({ type: 'uuid', nullable: true })
  cover_letter_id: string; // ID of the cover letter used

  @Column({ type: 'boolean', default: false })
  resume_auto_formatted: boolean;

  @Column({ type: 'boolean', default: false })
  cover_letter_auto_generated: boolean;

  @Column({ type: 'jsonb', nullable: true })
  playbook_adjustments: PlaybookAdjustments;

  @Column({ type: 'jsonb', nullable: true })
  application_metrics: ApplicationMetrics;

  @Column({ type: 'jsonb', nullable: true })
  original_resume_data: Record<string, any>; // Backup of original resume

  @Column({ type: 'jsonb', nullable: true })
  formatted_resume_data: Record<string, any>; // Playbook-formatted resume

  @Column({ type: 'text', nullable: true })
  application_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ats_system_detected: string;

  @Column({ type: 'boolean', default: false })
  ats_optimized: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_min_proposed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_max_proposed: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  salary_currency: string;

  @Column({ type: 'timestamp', nullable: true })
  applied_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  response_received_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  interview_scheduled_at: Date;

  @Column({ type: 'int', nullable: true })
  response_time_hours: number; // Time to get response from employer

  @Column({ type: 'boolean', default: false })
  got_interview: boolean;

  @Column({ type: 'boolean', default: false })
  got_offer: boolean;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'text', nullable: true })
  user_notes: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  user_rating: number; // 1-5 rating of playbook effectiveness

  @Column({ type: 'text', nullable: true })
  user_feedback: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
