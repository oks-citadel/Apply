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

import { RecruiterAssignment } from './recruiter-assignment.entity';

export enum PlacementStatus {
  PENDING = 'pending',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWING = 'interviewing',
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_DECLINED = 'offer_declined',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum InterviewStage {
  SCREENING = 'screening',
  PHONE = 'phone',
  TECHNICAL = 'technical',
  ONSITE = 'onsite',
  FINAL = 'final',
  CULTURAL_FIT = 'cultural_fit',
}

@Entity('placement_outcomes')
@Index(['assignment_id', 'status'])
@Index(['user_id', 'status'])
@Index(['status', 'created_at'])
export class PlacementOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  assignment_id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'uuid' })
  @Index()
  recruiter_id: string;

  @Column({ type: 'uuid', nullable: true })
  application_id: string; // Link to auto-apply application

  @Column({ type: 'varchar', length: 255 })
  company_name: string;

  @Column({ type: 'varchar', length: 255 })
  position_title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  job_location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  job_type: string; // Full-time, Part-time, Contract

  @Column({
    type: 'enum',
    enum: PlacementStatus,
    default: PlacementStatus.PENDING,
  })
  status: PlacementStatus;

  // Interview tracking
  @Column({ type: 'timestamp', nullable: true })
  interview_date: Date;

  @Column({
    type: 'enum',
    enum: InterviewStage,
    nullable: true,
  })
  interview_stage: InterviewStage;

  @Column({ type: 'int', default: 0 })
  interview_count: number;

  @Column({ type: 'text', nullable: true })
  interview_notes: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  interview_calendar_link: string;

  // Offer details
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  offered_salary: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  salary_currency: string;

  @Column({ type: 'text', nullable: true })
  offer_benefits: string;

  @Column({ type: 'timestamp', nullable: true })
  offer_received_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  offer_deadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  offer_accepted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  // Revenue tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  placement_fee: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  fee_currency: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  fee_percentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  recruiter_payout: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platform_commission: number;

  @Column({ type: 'boolean', default: false })
  fee_paid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fee_paid_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_transaction_id: string;

  // Guarantee period (for refund if candidate leaves early)
  @Column({ type: 'int', default: 90 })
  guarantee_period_days: number;

  @Column({ type: 'timestamp', nullable: true })
  guarantee_end_date: Date;

  @Column({ type: 'boolean', default: false })
  guarantee_claimed: boolean;

  @Column({ type: 'text', nullable: true })
  guarantee_claim_reason: string;

  // Rejection/Withdrawal tracking
  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  rejected_at: Date;

  @Column({ type: 'text', nullable: true })
  withdrawal_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  withdrawn_at: Date;

  // Feedback
  @Column({ type: 'text', nullable: true })
  company_feedback: string;

  @Column({ type: 'text', nullable: true })
  candidate_feedback: string;

  // Success metrics
  @Column({ type: 'int', nullable: true })
  days_to_hire: number;

  @Column({ type: 'int', nullable: true })
  total_interview_rounds: number;

  // Documents
  @Column({ type: 'varchar', length: 500, nullable: true })
  offer_letter_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  contract_url: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => RecruiterAssignment, assignment => assignment.outcomes)
  @JoinColumn({ name: 'assignment_id' })
  assignment: RecruiterAssignment;

  // Helper methods
  isSuccessfulPlacement(): boolean {
    return (
      this.status === PlacementStatus.HIRED ||
      this.status === PlacementStatus.OFFER_ACCEPTED
    );
  }

  calculatePlacementFee(): number {
    if (!this.offered_salary || !this.fee_percentage) {return 0;}
    return (this.offered_salary * this.fee_percentage) / 100;
  }

  calculateRevenueSplit(platformCommissionRate: number): {
    recruiterPayout: number;
    platformCommission: number;
  } {
    const totalFee = this.placement_fee || this.calculatePlacementFee();
    const platformCommission = (totalFee * platformCommissionRate) / 100;
    const recruiterPayout = totalFee - platformCommission;

    return {
      recruiterPayout,
      platformCommission,
    };
  }

  setGuaranteeEndDate(): void {
    if (this.start_date) {
      this.guarantee_end_date = new Date(
        this.start_date.getTime() + this.guarantee_period_days * 24 * 60 * 60 * 1000
      );
    }
  }

  isWithinGuaranteePeriod(): boolean {
    return (
      this.guarantee_end_date !== null &&
      new Date() <= this.guarantee_end_date
    );
  }

  calculateDaysToHire(): void {
    if (this.created_at && this.start_date) {
      this.days_to_hire = Math.ceil(
        (this.start_date.getTime() - this.created_at.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }
}
