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
import { Job } from '../../jobs/entities/job.entity';

export enum ReportType {
  SCAM = 'scam',
  SPAM = 'spam',
  FAKE_COMPANY = 'fake_company',
  MISLEADING = 'misleading',
  DUPLICATE = 'duplicate',
  EXPIRED = 'expired',
  INAPPROPRIATE = 'inappropriate',
  DISCRIMINATION = 'discrimination',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  VERIFIED = 'verified',
  DISMISSED = 'dismissed',
  RESOLVED = 'resolved',
}

export enum ReportSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('job_reports')
@Index(['job_id'])
@Index(['status'])
@Index(['report_type'])
@Index(['reporter_id'])
export class JobReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  job_id: string;

  @ManyToOne(() => Job, { nullable: false })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  reporter_id: string; // User who reported

  @Column({ type: 'varchar', length: 255, nullable: true })
  reporter_email: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  @Index()
  report_type: ReportType;

  @Column({
    type: 'enum',
    enum: ReportSeverity,
    default: ReportSeverity.MEDIUM,
  })
  severity: ReportSeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', array: true, default: [] })
  evidence_urls: string[]; // Screenshots, links

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  @Index()
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolved_by: string; // Admin who resolved

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  investigation_details: {
    findings?: string;
    actions_taken?: string[];
    similar_reports?: number;
    verification_results?: Record<string, any>;
  };

  @Column({ type: 'boolean', default: false })
  is_verified: boolean; // Verified by moderator

  @Column({ type: 'int', default: 0 })
  upvotes: number; // Other users confirming

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
