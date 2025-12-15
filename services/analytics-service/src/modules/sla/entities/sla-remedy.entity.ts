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
import { RemedyType, RemedyStatus } from '../enums/sla.enums';
import { SLAViolation } from './sla-violation.entity';

/**
 * SLA Remedy Entity
 * Tracks remedies issued for SLA violations
 */
@Entity('sla_remedies')
@Index(['violationId'])
@Index(['userId'])
@Index(['remedyType'])
@Index(['status'])
export class SLARemedy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  violationId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  contractId: string;

  @Column({
    type: 'enum',
    enum: RemedyType,
  })
  remedyType: RemedyType;

  @Column({
    type: 'enum',
    enum: RemedyStatus,
    default: RemedyStatus.PENDING,
  })
  status: RemedyStatus;

  // Remedy Details
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  remedyDetails: {
    // For SERVICE_EXTENSION
    extensionDays?: number;
    newEndDate?: Date;

    // For SERVICE_CREDIT
    creditAmount?: number;
    creditCurrency?: string;
    creditExpiryDate?: Date;
    creditCode?: string;

    // For PARTIAL_REFUND or FULL_REFUND
    refundAmount?: number;
    refundCurrency?: string;
    refundPercentage?: number;
    stripeRefundId?: string;

    // For HUMAN_RECRUITER_ESCALATION
    recruiterId?: string;
    recruiterName?: string;
    escalationLevel?: string;
    ticketId?: string;
    meetingScheduled?: boolean;
    meetingDate?: Date;
  };

  // Execution
  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuedBy: string; // system or admin ID

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  executedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  // Approval (for high-value remedies)
  @Column({ type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy: string;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

  // Financial Impact
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  financialImpact: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  // User Communication
  @Column({ type: 'boolean', default: false })
  userNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  userNotifiedAt: Date;

  @Column({ type: 'boolean', default: false })
  userAcknowledged: boolean;

  @Column({ type: 'timestamp', nullable: true })
  userAcknowledgedAt: Date;

  // Tracking
  @Column({ type: 'jsonb', nullable: true })
  executionLog: Array<{
    timestamp: Date;
    action: string;
    result: string;
    details?: Record<string, any>;
  }>;

  // Relations
  @ManyToOne(() => SLAViolation, (violation) => violation.remedies)
  @JoinColumn({ name: 'violationId' })
  violation: SLAViolation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper Methods
  isComplete(): boolean {
    return this.status === RemedyStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === RemedyStatus.FAILED;
  }

  isPending(): boolean {
    return this.status === RemedyStatus.PENDING;
  }

  needsApproval(): boolean {
    return this.requiresApproval && !this.isApproved;
  }

  canExecute(): boolean {
    if (this.requiresApproval && !this.isApproved) {
      return false;
    }
    return this.status === RemedyStatus.PENDING;
  }

  addExecutionLogEntry(action: string, result: string, details?: Record<string, any>) {
    if (!this.executionLog) {
      this.executionLog = [];
    }
    this.executionLog.push({
      timestamp: new Date(),
      action,
      result,
      details,
    });
  }
}
