import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';
import { Invoice } from '../../invoices/entities/invoice.entity';

@Entity('subscriptions')
@Index(['userId'])
@Index(['stripeCustomerId'])
@Index(['stripeSubscriptionId'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  stripeSubscriptionId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREEMIUM,
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEnd: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Invoice, (invoice) => invoice.subscription)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || this.status === SubscriptionStatus.TRIALING;
  }

  isCanceled(): boolean {
    return this.status === SubscriptionStatus.CANCELED;
  }

  isPastDue(): boolean {
    return this.status === SubscriptionStatus.PAST_DUE;
  }

  hasAccess(): boolean {
    if (!this.isActive()) {
      return false;
    }

    const now = new Date();

    // Check trial expiration if in trialing status
    if (this.status === SubscriptionStatus.TRIALING && this.trialEnd) {
      if (now > this.trialEnd) {
        return false; // Trial expired
      }
    }

    // Check subscription period expiration
    if (this.currentPeriodEnd) {
      return now <= this.currentPeriodEnd;
    }

    return true;
  }

  /**
   * Check if trial has expired
   */
  isTrialExpired(): boolean {
    if (!this.trialEnd) {
      return false;
    }
    return new Date() > this.trialEnd;
  }

  /**
   * Get days remaining in trial
   */
  getTrialDaysRemaining(): number {
    if (!this.trialEnd) {
      return 0;
    }
    const now = new Date();
    const diffMs = this.trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }
}
