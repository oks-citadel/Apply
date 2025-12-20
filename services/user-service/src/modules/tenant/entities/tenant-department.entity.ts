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

import { TenantUser } from './tenant-user.entity';
import { Tenant } from './tenant.entity';

@Entity('tenant_departments')
@Index(['tenant_id'])
@Index(['tenant_id', 'name'], { unique: true })
export class TenantDepartment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  parent_department_id: string;

  @Column({ type: 'uuid', nullable: true })
  manager_user_id: string;

  // Budget and metrics
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  annual_budget: number;

  @Column({ type: 'int', default: 0 })
  headcount: number;

  @Column({ type: 'int', nullable: true })
  target_headcount: number;

  // Analytics
  @Column({ type: 'int', default: 0 })
  total_applications: number;

  @Column({ type: 'int', default: 0 })
  successful_placements: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  placement_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  average_salary_placed: number;

  // Status
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at: Date;

  // Settings
  @Column({ type: 'jsonb', nullable: true })
  settings: {
    autoApproveApplications?: boolean;
    requireManagerApproval?: boolean;
    notificationEmail?: string;
    customFields?: Record<string, any>;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.departments)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => TenantUser, (tenantUser) => tenantUser.department)
  users: TenantUser[];
}
