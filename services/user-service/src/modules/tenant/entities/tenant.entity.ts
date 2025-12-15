import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { TenantType, TenantStatus } from '../enums/tenant-type.enum';
import { TenantUser } from './tenant-user.entity';
import { TenantDepartment } from './tenant-department.entity';
import { TenantLicense } from './tenant-license.entity';

@Entity('tenants')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['type'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: TenantType,
  })
  type: TenantType;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  // Contact Information
  @Column({ type: 'varchar', length: 255 })
  admin_email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  admin_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billing_email: string;

  // White-label Branding
  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  primary_color: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  secondary_color: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  custom_domain: string;

  @Column({ type: 'jsonb', nullable: true })
  branding_settings: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    customCss?: string;
    customDomain?: string;
    emailFooter?: string;
    termsUrl?: string;
    privacyUrl?: string;
  };

  // SSO Configuration
  @Column({ type: 'boolean', default: false })
  sso_enabled: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sso_provider: string; // 'saml' | 'oidc' | 'oauth2'

  @Column({ type: 'jsonb', nullable: true })
  sso_settings: {
    saml?: {
      entryPoint?: string;
      issuer?: string;
      cert?: string;
      callbackUrl?: string;
    };
    oidc?: {
      issuer?: string;
      clientId?: string;
      clientSecret?: string;
      callbackUrl?: string;
    };
  };

  // API Access
  @Column({ type: 'varchar', length: 255, nullable: true })
  api_key: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  api_secret: string;

  @Column({ type: 'boolean', default: false })
  api_enabled: boolean;

  // Settings
  @Column({ type: 'jsonb', nullable: true })
  settings: {
    features?: {
      bulkImport?: boolean;
      analytics?: boolean;
      whiteLabel?: boolean;
      sso?: boolean;
      apiAccess?: boolean;
      departmentDashboards?: boolean;
      placementTracking?: boolean;
      cohortManagement?: boolean;
    };
    integrations?: {
      slack?: boolean;
      teams?: boolean;
      jira?: boolean;
    };
    notifications?: {
      email?: boolean;
      slack?: boolean;
      webhook?: string;
    };
    security?: {
      ipWhitelist?: string[];
      requireMfa?: boolean;
      sessionTimeout?: number;
    };
  };

  // Metadata
  @Column({ type: 'int', default: 0 })
  user_count: number;

  @Column({ type: 'timestamp', nullable: true })
  trial_ends_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  activated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  suspended_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.tenant)
  tenant_users: TenantUser[];

  @OneToMany(() => TenantDepartment, (department) => department.tenant)
  departments: TenantDepartment[];

  @OneToOne(() => TenantLicense, (license) => license.tenant)
  @JoinColumn()
  license: TenantLicense;
}
