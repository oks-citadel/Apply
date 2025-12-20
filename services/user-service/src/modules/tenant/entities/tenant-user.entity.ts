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

import { TenantDepartment } from './tenant-department.entity';
import { Tenant } from './tenant.entity';
import { UserRole } from '../enums/tenant-type.enum';

@Entity('tenant_users')
@Index(['tenant_id', 'user_id'], { unique: true })
@Index(['tenant_id'])
@Index(['user_id'])
@Index(['role'])
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  department_id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  // Additional user metadata within tenant
  @Column({ type: 'varchar', length: 255, nullable: true })
  job_title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employee_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manager_email: string;

  // For university/bootcamp
  @Column({ type: 'varchar', length: 100, nullable: true })
  student_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cohort: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  graduation_year: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  major: string;

  // Status
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  invited_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  joined_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at: Date;

  // Permissions
  @Column({ type: 'jsonb', nullable: true })
  permissions: {
    canManageUsers?: boolean;
    canViewAnalytics?: boolean;
    canExportData?: boolean;
    canManageDepartments?: boolean;
    canConfigureBranding?: boolean;
    canManageLicense?: boolean;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.tenant_users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => TenantDepartment, (department) => department.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'department_id' })
  department: TenantDepartment;
}
