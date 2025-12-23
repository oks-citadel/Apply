import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEventType {
  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SUBSCRIPTION_RENEWED = 'subscription.renewed',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',

  // Job match events
  JOB_MATCH_FOUND = 'job.match.found',
  JOB_MATCH_BATCH = 'job.match.batch',
  JOB_ALERT_TRIGGERED = 'job.alert.triggered',

  // Application events
  APPLICATION_SUBMITTED = 'application.submitted',
  APPLICATION_STATUS_CHANGED = 'application.status.changed',
  APPLICATION_VIEWED = 'application.viewed',
  APPLICATION_INTERVIEW_SCHEDULED = 'application.interview.scheduled',
  APPLICATION_OFFER_RECEIVED = 'application.offer.received',
  APPLICATION_REJECTED = 'application.rejected',

  // User events
  USER_PROFILE_UPDATED = 'user.profile.updated',
  USER_RESUME_UPLOADED = 'user.resume.uploaded',

  // Payment events
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  INVOICE_CREATED = 'invoice.created',
}

export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @Column({ nullable: true })
  @Index()
  tenant_id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  secret: string;

  @Column({
    type: 'simple-array',
    default: '',
  })
  events: WebhookEventType[];

  @Column({
    type: 'simple-enum',
    enum: WebhookStatus,
    default: WebhookStatus.ACTIVE,
  })
  status: WebhookStatus;

  @Column({ type: 'simple-json', nullable: true })
  headers: Record<string, string>;

  @Column({ default: 0 })
  failure_count: number;

  @Column({ nullable: true })
  last_triggered_at: Date;

  @Column({ nullable: true })
  last_success_at: Date;

  @Column({ nullable: true })
  last_failure_at: Date;

  @Column({ nullable: true })
  last_error: string;

  @Column({ default: true })
  is_enabled: boolean;

  @Column({ default: 3 })
  max_retries: number;

  @Column({ default: 30000 })
  timeout_ms: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
