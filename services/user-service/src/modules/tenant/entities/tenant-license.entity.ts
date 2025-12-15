import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { LicenseType } from '../enums/tenant-type.enum';
import { Tenant } from './tenant.entity';

@Entity('tenant_licenses')
@Index(['tenant_id'], { unique: true })
@Index(['status'])
export class TenantLicense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  tenant_id: string;

  @Column({
    type: 'enum',
    enum: LicenseType,
  })
  license_type: LicenseType;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active' | 'expired' | 'suspended' | 'cancelled'

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthly_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  annual_price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  // Billing
  @Column({ type: 'varchar', length: 50, default: 'monthly' })
  billing_cycle: string; // 'monthly' | 'annual' | 'quarterly'

  @Column({ type: 'timestamp', nullable: true })
  billing_start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  billing_end_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  next_billing_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_subscription_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_price_id: string;

  // Limits
  @Column({ type: 'int', nullable: true })
  max_users: number;

  @Column({ type: 'int', default: 0 })
  current_users: number;

  @Column({ type: 'int', nullable: true })
  max_applications_per_month: number;

  @Column({ type: 'int', default: 0 })
  applications_this_month: number;

  @Column({ type: 'int', nullable: true })
  max_api_calls_per_day: number;

  @Column({ type: 'int', default: 0 })
  api_calls_today: number;

  @Column({ type: 'int', nullable: true })
  max_storage_gb: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  storage_used_gb: number;

  // Feature Flags
  @Column({ type: 'jsonb', nullable: true })
  features: {
    bulkImport?: boolean;
    advancedAnalytics?: boolean;
    whiteLabeling?: boolean;
    ssoIntegration?: boolean;
    apiAccess?: boolean;
    prioritySupport?: boolean;
    customIntegrations?: boolean;
    dedicatedAccountManager?: boolean;
    dataExport?: boolean;
    auditLogs?: boolean;
    customReports?: boolean;
    mobileApp?: boolean;
    aiFeatures?: boolean;
    placementTracking?: boolean;
    cohortManagement?: boolean;
    resumeTemplates?: boolean;
    careerCenterDashboard?: boolean;
  };

  // Rate Limiting
  @Column({ type: 'jsonb', nullable: true })
  rate_limits: {
    apiCallsPerMinute?: number;
    apiCallsPerHour?: number;
    apiCallsPerDay?: number;
    bulkImportPerDay?: number;
    concurrentUsers?: number;
  };

  // Usage Reset
  @Column({ type: 'timestamp', nullable: true })
  usage_reset_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  api_usage_reset_date: Date;

  // Trial
  @Column({ type: 'boolean', default: false })
  is_trial: boolean;

  @Column({ type: 'timestamp', nullable: true })
  trial_start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  trial_end_date: Date;

  // Cancellation
  @Column({ type: 'boolean', default: false })
  cancel_at_period_end: boolean;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => Tenant, (tenant) => tenant.license)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
