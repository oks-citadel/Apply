import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

export enum AlertFrequency {
  INSTANT = 'instant',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

@Entity('job_alerts')
@Index(['user_id'])
@Index(['is_active'])
export class JobAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  keywords: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: RemoteType,
    nullable: true,
  })
  remote_type: RemoteType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_min: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_max: number;

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
  })
  experience_level: ExperienceLevel;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    nullable: true,
  })
  employment_type: EmploymentType;

  @Column({ type: 'text', array: true, default: [] })
  skills: string[];

  @Column({ type: 'uuid', nullable: true })
  company_id: string;

  @Column({
    type: 'enum',
    enum: AlertFrequency,
    default: AlertFrequency.DAILY,
  })
  frequency: AlertFrequency;

  @Column({ type: 'boolean', default: true })
  @Index()
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_checked_at: Date;

  @Column({ type: 'int', default: 0 })
  jobs_sent_count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
