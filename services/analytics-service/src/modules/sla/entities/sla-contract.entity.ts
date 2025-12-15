import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { SLATier, SLAStatus } from '../enums/sla.enums';
import { SLAProgress } from './sla-progress.entity';
import { SLAViolation } from './sla-violation.entity';

/**
 * SLA Contract Entity
 * Represents the formal service level agreement between user and platform
 */
@Entity('sla_contracts')
@Index(['userId'])
@Index(['tier'])
@Index(['status'])
@Index(['endDate'])
export class SLAContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: SLATier,
  })
  tier: SLATier;

  @Column({
    type: 'enum',
    enum: SLAStatus,
    default: SLAStatus.ACTIVE,
  })
  status: SLAStatus;

  // Guarantee Terms
  @Column({ type: 'int' })
  guaranteedInterviews: number;

  @Column({ type: 'int' })
  deadlineDays: number;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  minConfidenceThreshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  contractPrice: number;

  // Contract Dates
  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // Extensions (for violations)
  @Column({ type: 'int', default: 0 })
  extensionDays: number;

  @Column({ type: 'timestamp', nullable: true })
  extendedEndDate: Date;

  // Payment Information
  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // Eligibility Check
  @Column({ type: 'boolean', default: true })
  isEligible: boolean;

  @Column({ type: 'jsonb', nullable: true })
  eligibilityCheckResult: {
    passedFields: string[];
    failedFields: string[];
    resumeScore: number;
    workExperienceMonths: number;
    checkedAt: Date;
  };

  // Progress Summary (denormalized for quick access)
  @Column({ type: 'int', default: 0 })
  totalApplicationsSent: number;

  @Column({ type: 'int', default: 0 })
  totalEmployerResponses: number;

  @Column({ type: 'int', default: 0 })
  totalInterviewsScheduled: number;

  @Column({ type: 'int', default: 0 })
  totalInterviewsCompleted: number;

  @Column({ type: 'int', default: 0 })
  totalOffersReceived: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    referralCode?: string;
    campaignId?: string;
    notes?: string;
    customTerms?: Record<string, any>;
  };

  // Relations
  @OneToMany(() => SLAProgress, (progress) => progress.contract)
  progressEvents: SLAProgress[];

  @OneToMany(() => SLAViolation, (violation) => violation.contract)
  violations: SLAViolation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper Methods
  getEffectiveEndDate(): Date {
    return this.extendedEndDate || this.endDate;
  }

  getDaysRemaining(): number {
    const effectiveEnd = this.getEffectiveEndDate();
    const now = new Date();
    const diffTime = effectiveEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  getProgressPercentage(): number {
    if (this.guaranteedInterviews === 0) return 0;
    return Math.min(
      100,
      (this.totalInterviewsScheduled / this.guaranteedInterviews) * 100
    );
  }

  isGuaranteeMet(): boolean {
    return this.totalInterviewsScheduled >= this.guaranteedInterviews;
  }

  isExpired(): boolean {
    return new Date() > this.getEffectiveEndDate();
  }

  isActive(): boolean {
    return (
      this.status === SLAStatus.ACTIVE &&
      !this.isExpired() &&
      this.isEligible
    );
  }

  shouldCheckForViolation(): boolean {
    return (
      this.status === SLAStatus.ACTIVE &&
      this.isExpired() &&
      !this.isGuaranteeMet()
    );
  }
}
