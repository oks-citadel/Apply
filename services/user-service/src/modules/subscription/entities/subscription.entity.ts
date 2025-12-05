import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SubscriptionTier, SubscriptionStatus } from '../../../common/enums/subscription-tier.enum';

@Entity('subscriptions')
@Index(['user_id'], { unique: true })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_customer_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_subscription_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_price_id: string;

  @Column({ type: 'timestamp', nullable: true })
  current_period_start: Date;

  @Column({ type: 'timestamp', nullable: true })
  current_period_end: Date;

  @Column({ type: 'timestamp', nullable: true })
  trial_end: Date;

  @Column({ type: 'boolean', default: false })
  cancel_at_period_end: boolean;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date;

  // Feature usage tracking
  @Column({ type: 'int', default: 0 })
  applications_this_month: number;

  @Column({ type: 'int', default: 0 })
  ai_cover_letters_this_month: number;

  @Column({ type: 'int', default: 0 })
  resume_uploads: number;

  @Column({ type: 'timestamp', nullable: true })
  usage_reset_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
