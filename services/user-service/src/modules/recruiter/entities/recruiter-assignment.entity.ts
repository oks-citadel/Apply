import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { PlacementOutcome } from './placement-outcome.entity';
import { RecruiterProfile } from './recruiter-profile.entity';

export enum AssignmentStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum AssignmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AssignmentType {
  FULL_SERVICE = 'full_service', // End-to-end recruitment
  RESUME_REVIEW = 'resume_review', // Resume optimization only
  INTERVIEW_PREP = 'interview_prep', // Interview coaching
  APPLICATION_SUPPORT = 'application_support', // Help with specific applications
  CAREER_CONSULTING = 'career_consulting', // Career advice and strategy
}

@Entity('recruiter_assignments')
@Index(['user_id', 'status'])
@Index(['recruiter_id', 'status'])
@Index(['status', 'created_at'])
export class RecruiterAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'uuid' })
  @Index()
  recruiter_id: string;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.REQUESTED,
  })
  status: AssignmentStatus;

  @Column({
    type: 'enum',
    enum: AssignmentType,
    default: AssignmentType.FULL_SERVICE,
  })
  assignment_type: AssignmentType;

  @Column({
    type: 'enum',
    enum: AssignmentPriority,
    default: AssignmentPriority.NORMAL,
  })
  priority: AssignmentPriority;

  @Column({ type: 'text', nullable: true })
  user_requirements: string;

  @Column({ type: 'text', nullable: true })
  recruiter_notes: string;

  @Column({ type: 'simple-array', nullable: true })
  target_industries: string[];

  @Column({ type: 'simple-array', nullable: true })
  target_roles: string[];

  @Column({ type: 'simple-array', nullable: true })
  target_locations: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  target_salary_min: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  target_salary_max: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  salary_currency: string;

  // Timeline
  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  // Progress tracking
  @Column({ type: 'int', default: 0 })
  applications_submitted: number;

  @Column({ type: 'int', default: 0 })
  interviews_scheduled: number;

  @Column({ type: 'int', default: 0 })
  offers_received: number;

  @Column({ type: 'int', default: 0 })
  progress_percentage: number; // 0-100

  @Column({ type: 'timestamp', nullable: true })
  last_activity_at: Date;

  // Communication
  @Column({ type: 'int', default: 0 })
  messages_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date;

  @Column({ type: 'uuid', nullable: true })
  last_message_by: string;

  // Monetization
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  agreed_fee: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  fee_currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platform_fee_percentage: number; // Platform's cut

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_revenue: number;

  @Column({ type: 'boolean', default: false })
  payment_completed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  payment_completed_at: Date;

  // Escalation tracking
  @Column({ type: 'uuid', nullable: true })
  escalated_from_application_id: string;

  @Column({ type: 'text', nullable: true })
  escalation_reason: string;

  @Column({ type: 'boolean', default: false })
  is_escalation: boolean;

  // Quality metrics
  @Column({ type: 'int', nullable: true })
  user_satisfaction: number; // 1-5

  @Column({ type: 'text', nullable: true })
  user_feedback: string;

  @Column({ type: 'timestamp', nullable: true })
  feedback_submitted_at: Date;

  // Cancellation
  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => RecruiterProfile, profile => profile.assignments)
  @JoinColumn({ name: 'recruiter_id' })
  recruiter: RecruiterProfile;

  @OneToMany(() => PlacementOutcome, outcome => outcome.assignment)
  outcomes: PlacementOutcome[];

  // Helper methods
  calculateDuration(): number | null {
    if (!this.started_at) {return null;}
    const endDate = this.completed_at || new Date();
    return Math.ceil(
      (endDate.getTime() - this.started_at.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  isOverdue(): boolean {
    return (
      this.deadline !== null &&
      this.deadline < new Date() &&
      this.status !== AssignmentStatus.COMPLETED &&
      this.status !== AssignmentStatus.CANCELLED
    );
  }

  canBeCancelled(): boolean {
    return (
      this.status !== AssignmentStatus.COMPLETED &&
      this.status !== AssignmentStatus.CANCELLED
    );
  }

  updateProgress(): void {
    // Calculate progress based on milestones
    let progress = 0;

    if (this.status === AssignmentStatus.ACCEPTED) {progress = 10;}
    if (this.status === AssignmentStatus.IN_PROGRESS) {progress = 25;}
    if (this.applications_submitted > 0) {progress += 20;}
    if (this.interviews_scheduled > 0) {progress += 25;}
    if (this.offers_received > 0) {progress += 20;}
    if (this.status === AssignmentStatus.COMPLETED) {progress = 100;}

    this.progress_percentage = Math.min(progress, 100);
  }
}
