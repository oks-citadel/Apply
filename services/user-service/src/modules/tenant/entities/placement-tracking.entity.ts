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

import { Tenant } from './tenant.entity';

@Entity('placement_tracking')
@Index(['tenant_id', 'cohort'])
@Index(['tenant_id', 'user_id'])
@Index(['placement_date'])
export class PlacementTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  // Student/Graduate Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  student_id: string;

  @Column({ type: 'varchar', length: 255 })
  student_name: string;

  @Column({ type: 'varchar', length: 255 })
  student_email: string;

  @Column({ type: 'varchar', length: 100 })
  cohort: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  program: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  major: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  graduation_year: string;

  @Column({ type: 'date', nullable: true })
  graduation_date: Date;

  // Placement Information
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  placement_status: string; // 'pending' | 'placed' | 'seeking' | 'not_seeking'

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  job_title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employment_type: string; // 'full-time' | 'part-time' | 'contract' | 'internship'

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  salary_currency: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  placement_date: Date;

  @Column({ type: 'int', nullable: true })
  days_to_placement: number; // Days from graduation to placement

  // Application Journey
  @Column({ type: 'int', default: 0 })
  total_applications: number;

  @Column({ type: 'int', default: 0 })
  interviews_attended: number;

  @Column({ type: 'int', default: 0 })
  offers_received: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  job_source: string; // 'platform' | 'career_fair' | 'referral' | 'direct' | 'other'

  // Additional Information
  @Column({ type: 'boolean', default: false })
  used_platform: boolean;

  @Column({ type: 'boolean', default: false })
  attended_career_services: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'jsonb', nullable: true })
  certifications: string[];

  // Contact and Follow-up
  @Column({ type: 'date', nullable: true })
  last_contact_date: Date;

  @Column({ type: 'date', nullable: true })
  next_followup_date: Date;

  @Column({ type: 'boolean', default: true })
  is_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verified_by: string;

  // Satisfaction
  @Column({ type: 'int', nullable: true })
  satisfaction_score: number; // 1-5

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
