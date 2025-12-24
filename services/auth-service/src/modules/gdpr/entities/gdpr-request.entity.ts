import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Types of GDPR requests
 */
export enum GdprRequestType {
  DATA_EXPORT = 'data_export',
  ACCOUNT_DELETION = 'account_deletion',
}

/**
 * Status of GDPR requests
 */
export enum GdprRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Entity to track GDPR data requests (export and deletion)
 * Implements GDPR Article 17 (Right to Erasure) and Article 20 (Right to Data Portability)
 */
@Entity('gdpr_requests')
@Index(['userId', 'createdAt'])
@Index(['status', 'type'])
export class GdprRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  userEmail: string;

  @Column({ type: 'enum', enum: GdprRequestType })
  type: GdprRequestType;

  @Column({ type: 'enum', enum: GdprRequestStatus, default: GdprRequestStatus.PENDING })
  status: GdprRequestStatus;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  // For data export requests
  @Column({ name: 'download_url', type: 'text', nullable: true })
  downloadUrl: string;

  @Column({ name: 'download_expiry', type: 'timestamp', nullable: true })
  downloadExpiry: Date;

  // For deletion requests
  @Column({ name: 'scheduled_deletion_date', type: 'timestamp', nullable: true })
  scheduledDeletionDate: Date;

  @Column({ name: 'soft_deleted_at', type: 'timestamp', nullable: true })
  softDeletedAt: Date;

  @Column({ name: 'hard_deleted_at', type: 'timestamp', nullable: true })
  hardDeletedAt: Date;

  // Processing metadata
  @Column({ type: 'jsonb', nullable: true })
  processingDetails: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'processed_services', type: 'jsonb', default: '[]' })
  processedServices: string[];

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
