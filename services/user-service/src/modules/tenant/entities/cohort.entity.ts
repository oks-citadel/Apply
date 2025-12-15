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

@Entity('cohorts')
@Index(['tenant_id', 'name'], { unique: true })
@Index(['tenant_id'])
@Index(['status'])
export class Cohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  program: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'date', nullable: true })
  graduation_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active' | 'completed' | 'archived'

  // Enrollment
  @Column({ type: 'int', default: 0 })
  enrolled_count: number;

  @Column({ type: 'int', nullable: true })
  target_enrollment: number;

  @Column({ type: 'int', default: 0 })
  graduated_count: number;

  // Staff
  @Column({ type: 'jsonb', nullable: true })
  instructors: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  coordinator_email: string;

  // Placement metrics
  @Column({ type: 'int', default: 0 })
  placed_count: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  placement_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  average_salary: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  average_days_to_placement: number;

  // Resources
  @Column({ type: 'jsonb', nullable: true })
  resources: {
    syllabusUrl?: string;
    coursewareUrl?: string;
    slackChannel?: string;
    googleClassroomId?: string;
  };

  // Settings
  @Column({ type: 'jsonb', nullable: true })
  settings: {
    autoTrackPlacements?: boolean;
    requireGraduationSurvey?: boolean;
    enablePeerNetworking?: boolean;
    customFields?: Record<string, any>;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
