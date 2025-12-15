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
import { JobSource } from './job-source.entity';

export enum IngestionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial', // Completed with some errors
}

export enum IngestionTrigger {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  RETRY = 'retry',
}

@Entity('ingestion_jobs')
@Index(['job_source_id'])
@Index(['status'])
@Index(['started_at'])
@Index(['completed_at'])
export class IngestionJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_source_id: string;

  @ManyToOne(() => JobSource, { eager: true })
  @JoinColumn({ name: 'job_source_id' })
  job_source: JobSource;

  @Column({
    type: 'enum',
    enum: IngestionStatus,
    default: IngestionStatus.PENDING,
  })
  @Index()
  status: IngestionStatus;

  @Column({
    type: 'enum',
    enum: IngestionTrigger,
    default: IngestionTrigger.SCHEDULED,
  })
  trigger: IngestionTrigger;

  @Column({ type: 'uuid', nullable: true })
  triggered_by_user_id: string; // If manually triggered

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  completed_at: Date;

  @Column({ type: 'int', nullable: true })
  duration_seconds: number;

  // Ingestion Statistics
  @Column({ type: 'int', default: 0 })
  total_fetched: number; // Raw jobs fetched from source

  @Column({ type: 'int', default: 0 })
  total_processed: number; // Jobs successfully processed

  @Column({ type: 'int', default: 0 })
  total_new: number; // New jobs created

  @Column({ type: 'int', default: 0 })
  total_updated: number; // Existing jobs updated

  @Column({ type: 'int', default: 0 })
  total_duplicates: number; // Jobs identified as duplicates

  @Column({ type: 'int', default: 0 })
  total_invalid: number; // Jobs that failed validation

  @Column({ type: 'int', default: 0 })
  total_errors: number; // Jobs that caused errors

  @Column({ type: 'int', default: 0 })
  total_expired: number; // Jobs marked as expired/closed

  // API/Request Statistics
  @Column({ type: 'int', default: 0 })
  api_requests_made: number;

  @Column({ type: 'int', default: 0 })
  api_requests_failed: number;

  @Column({ type: 'int', default: 0 })
  pages_processed: number;

  @Column({ type: 'int', nullable: true })
  total_pages: number;

  // Progress Tracking
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress_percent: number;

  @Column({ type: 'text', nullable: true })
  current_step: string; // e.g., "Fetching page 3/10", "Processing jobs", etc.

  // Error Tracking
  @Column({ type: 'text', array: true, default: [] })
  errors: string[];

  @Column({ type: 'text', array: true, default: [] })
  warnings: string[];

  @Column({ type: 'text', nullable: true })
  error_message: string; // Primary error if failed

  @Column({ type: 'text', nullable: true })
  error_stack: string;

  // Retry Information
  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'uuid', nullable: true })
  parent_job_id: string; // If this is a retry, reference to original job

  @Column({ type: 'boolean', default: false })
  can_retry: boolean;

  // Performance Metrics
  @Column({ type: 'jsonb', nullable: true })
  performance_metrics: {
    fetch_time_ms?: number;
    processing_time_ms?: number;
    deduplication_time_ms?: number;
    validation_time_ms?: number;
    save_time_ms?: number;
    average_job_processing_ms?: number;
  };

  // Configuration Snapshot (at time of run)
  @Column({ type: 'jsonb', nullable: true })
  config_snapshot: {
    sync_interval_minutes?: number;
    rate_limits?: Record<string, any>;
    filters?: Record<string, any>;
    custom?: Record<string, any>;
  };

  // Logs (condensed, for detailed logs use logging service)
  @Column({ type: 'jsonb', nullable: true })
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    details?: Record<string, any>;
  }>;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ip_address?: string;
    user_agent?: string;
    api_version?: string;
    notes?: string;
    custom?: Record<string, any>;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
