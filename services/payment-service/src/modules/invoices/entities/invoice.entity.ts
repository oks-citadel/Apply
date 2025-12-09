import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('invoices')
@Index(['subscriptionId'])
@Index(['stripeInvoiceId'], { unique: true })
@Index(['stripeCustomerId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  subscriptionId: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.invoices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column({ type: 'varchar', length: 255, unique: true })
  stripeInvoiceId: string;

  @Column({ type: 'varchar', length: 255 })
  stripeCustomerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  invoiceUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  invoicePdfUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isPaid(): boolean {
    return this.status === InvoiceStatus.PAID;
  }

  isOpen(): boolean {
    return this.status === InvoiceStatus.OPEN;
  }

  isVoid(): boolean {
    return this.status === InvoiceStatus.VOID;
  }

  isUncollectible(): boolean {
    return this.status === InvoiceStatus.UNCOLLECTIBLE;
  }
}
