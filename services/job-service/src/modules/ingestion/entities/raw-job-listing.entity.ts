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
import { IngestionJob } from './ingestion-job.entity';

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  DUPLICATE = 'duplicate',
  INVALID = 'invalid',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

@Entity('raw_job_listings')
@Index(['job_source_id'])
@Index(['ingestion_job_id'])
@Index(['processing_status'])
@Index(['fingerprint'])
@Index(['external_id', 'job_source_id'], { unique: true })
@Index(['created_at'])
export class RawJobListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_source_id: string;

  @ManyToOne(() => JobSource)
  @JoinColumn({ name: 'job_source_id' })
  job_source: JobSource;

  @Column({ type: 'uuid', nullable: true })
  ingestion_job_id: string;

  @ManyToOne(() => IngestionJob)
  @JoinColumn({ name: 'ingestion_job_id' })
  ingestion_job: IngestionJob;

  @Column({ type: 'varchar', length: 500 })
  @Index()
  external_id: string; // ID from the source platform

  @Column({ type: 'varchar', length: 64 })
  @Index()
  fingerprint: string; // Hash for deduplication (MD5/SHA256 of key fields)

  // Raw Data
  @Column({ type: 'jsonb' })
  raw_data: Record<string, any>; // Complete raw response from source

  // Normalized/Extracted Fields (for easier querying before full processing)
  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url: string;

  @Column({ type: 'timestamp', nullable: true })
  posted_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_date: Date;

  // Processing Status
  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  @Index()
  processing_status: ProcessingStatus;

  @Column({ type: 'uuid', nullable: true })
  processed_job_id: string; // Reference to the normalized Job entity if processed

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  // Deduplication
  @Column({ type: 'uuid', nullable: true })
  duplicate_of_id: string; // If duplicate, reference to the original raw listing

  @Column({ type: 'text', array: true, default: [] })
  similar_jobs: string[]; // Array of job IDs that are similar

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  similarity_score: number; // Similarity score if duplicate

  // Validation
  @Column({ type: 'boolean', default: false })
  is_valid: boolean;

  @Column({ type: 'text', array: true, default: [] })
  validation_errors: string[];

  @Column({ type: 'text', array: true, default: [] })
  validation_warnings: string[];

  // Error Tracking
  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'text', nullable: true })
  error_stack: string;

  @Column({ type: 'int', default: 0 })
  processing_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  last_processing_attempt_at: Date;

  // Quality Metrics
  @Column({ type: 'jsonb', nullable: true })
  quality_metrics: {
    completeness_score?: number; // 0-100, how complete is the data
    confidence_score?: number; // 0-100, confidence in extraction
    missing_fields?: string[];
    data_issues?: string[];
  };

  // Enrichment Data (added during processing)
  @Column({ type: 'jsonb', nullable: true })
  enrichment_data: {
    detected_skills?: string[];
    detected_experience_level?: string;
    detected_salary_range?: { min?: number; max?: number; currency?: string };
    detected_remote_type?: string;
    detected_employment_type?: string;
    ai_generated_summary?: string;
    classification?: Record<string, any>;
  };

  // Change Tracking
  @Column({ type: 'boolean', default: true })
  is_latest: boolean; // Is this the latest version from source

  @Column({ type: 'uuid', nullable: true })
  previous_version_id: string; // Reference to previous version if updated

  @Column({ type: 'jsonb', nullable: true })
  changes_detected: {
    fields_changed?: string[];
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  };

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    fetch_timestamp?: string;
    source_page?: number;
    source_url?: string;
    user_agent?: string;
    proxy_used?: string;
    response_time_ms?: number;
    http_status?: number;
    custom?: Record<string, any>;
  };

  @Column({ type: 'boolean', default: false })
  is_archived: boolean; // Soft delete for old/expired raw listings

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
