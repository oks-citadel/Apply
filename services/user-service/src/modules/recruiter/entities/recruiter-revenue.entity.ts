import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RevenueType {
  PLACEMENT_FEE = 'placement_fee',
  SUBSCRIPTION = 'subscription',
  PREMIUM_LISTING = 'premium_listing',
  FEATURED_PLACEMENT = 'featured_placement',
  BONUS = 'bonus',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum RevenueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

@Entity('recruiter_revenue')
@Index(['recruiter_id', 'status'])
@Index(['placement_id'])
@Index(['created_at'])
export class RecruiterRevenue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  recruiter_id: string;

  @Column({ type: 'uuid', nullable: true })
  placement_id: string;

  @Column({ type: 'uuid', nullable: true })
  assignment_id: string;

  @Column({
    type: 'enum',
    enum: RevenueType,
    default: RevenueType.PLACEMENT_FEE,
  })
  revenue_type: RevenueType;

  @Column({
    type: 'enum',
    enum: RevenueStatus,
    default: RevenueStatus.PENDING,
  })
  status: RevenueStatus;

  // Amounts
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  gross_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platform_commission: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  platform_commission_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  net_amount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  // Payment details
  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_method: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_transfer_id: string;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expected_payout_date: Date;

  // Tax and compliance
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_withheld: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tax_form_type: string; // e.g., 1099, W9

  @Column({ type: 'boolean', default: false })
  tax_form_submitted: boolean;

  // Description and notes
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Refund tracking
  @Column({ type: 'uuid', nullable: true })
  refund_for_revenue_id: string;

  @Column({ type: 'text', nullable: true })
  refund_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date;

  // Dispute tracking
  @Column({ type: 'text', nullable: true })
  dispute_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  disputed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  disputed_by: string;

  @Column({ type: 'text', nullable: true })
  dispute_resolution: string;

  @Column({ type: 'timestamp', nullable: true })
  dispute_resolved_at: Date;

  // Invoice
  @Column({ type: 'varchar', length: 100, nullable: true })
  invoice_number: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  invoice_url: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Helper methods
  calculateNetAmount(): number {
    return this.gross_amount - this.platform_commission - this.tax_withheld;
  }

  isPending(): boolean {
    return this.status === RevenueStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.status === RevenueStatus.COMPLETED;
  }

  canBeRefunded(): boolean {
    return (
      this.status === RevenueStatus.COMPLETED &&
      this.paid_at !== null &&
      new Date().getTime() - this.paid_at.getTime() < 90 * 24 * 60 * 60 * 1000 // Within 90 days
    );
  }
}
