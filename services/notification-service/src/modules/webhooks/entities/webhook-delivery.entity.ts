import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WebhookSubscription, WebhookEventType } from './webhook-subscription.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  subscription_id: string;

  @ManyToOne(() => WebhookSubscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: WebhookSubscription;

  @Column({
    type: 'simple-enum',
    enum: WebhookEventType,
  })
  @Index()
  event_type: WebhookEventType;

  @Column({ type: 'simple-json' })
  payload: Record<string, any>;

  @Column({
    type: 'simple-enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  @Index()
  status: DeliveryStatus;

  @Column({ nullable: true })
  response_status_code: number;

  @Column({ type: 'text', nullable: true })
  response_body: string;

  @Column({ nullable: true })
  response_time_ms: number;

  @Column({ default: 0 })
  attempt_count: number;

  @Column({ nullable: true })
  next_retry_at: Date;

  @Column({ nullable: true })
  error_message: string;

  @Column({ type: 'simple-json', nullable: true })
  request_headers: Record<string, string>;

  @Column({ nullable: true })
  delivered_at: Date;

  @Column()
  @Index()
  idempotency_key: string;

  @CreateDateColumn()
  created_at: Date;
}
