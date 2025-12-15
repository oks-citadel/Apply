import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProgressEventType } from '../enums/sla.enums';
import { SLAContract } from './sla-contract.entity';

/**
 * SLA Progress Entity
 * Tracks all progress events related to an SLA contract
 */
@Entity('sla_progress')
@Index(['contractId'])
@Index(['userId'])
@Index(['eventType'])
@Index(['createdAt'])
export class SLAProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  contractId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ProgressEventType,
  })
  eventType: ProgressEventType;

  // Application Details
  @Column({ type: 'uuid', nullable: true })
  applicationId: string;

  @Column({ type: 'uuid', nullable: true })
  jobId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  jobTitle: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  companyName: string;

  // Confidence Score (for applications)
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidenceScore: number;

  @Column({ type: 'boolean', default: true })
  meetsConfidenceThreshold: boolean;

  // Interview Details
  @Column({ type: 'timestamp', nullable: true })
  interviewScheduledAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  interviewType: string; // phone, video, onsite, etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  interviewLocation: string;

  // Response Details
  @Column({ type: 'text', nullable: true })
  responseContent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  responseType: string; // rejection, interview_request, offer, etc.

  // Verification
  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verifiedBy: string;

  // Source Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // auto, manual, integration, etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceReference: string; // email ID, calendar event ID, etc.

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    emailSubject?: string;
    emailFrom?: string;
    calendarEventId?: string;
    platformSource?: string;
    notes?: string;
    attachments?: string[];
  };

  // Relations
  @ManyToOne(() => SLAContract, (contract) => contract.progressEvents)
  @JoinColumn({ name: 'contractId' })
  contract: SLAContract;

  @CreateDateColumn()
  createdAt: Date;

  // Helper Methods
  countsTowardGuarantee(): boolean {
    return (
      this.isVerified &&
      this.meetsConfidenceThreshold &&
      (this.eventType === ProgressEventType.INTERVIEW_SCHEDULED ||
        this.eventType === ProgressEventType.INTERVIEW_COMPLETED)
    );
  }

  isInterviewEvent(): boolean {
    return (
      this.eventType === ProgressEventType.INTERVIEW_SCHEDULED ||
      this.eventType === ProgressEventType.INTERVIEW_COMPLETED
    );
  }

  isPositiveResponse(): boolean {
    return (
      this.eventType === ProgressEventType.INTERVIEW_SCHEDULED ||
      this.eventType === ProgressEventType.OFFER_RECEIVED
    );
  }
}
