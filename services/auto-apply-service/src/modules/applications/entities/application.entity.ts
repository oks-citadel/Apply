import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ApplicationStatus {
  APPLIED = 'applied',
  VIEWED = 'viewed',
  INTERVIEWING = 'interviewing',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Entity('applications')
@Index(['user_id', 'created_at'])
@Index(['status', 'created_at'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'uuid' })
  @Index()
  job_id: string;

  @Column({ type: 'uuid', nullable: true })
  resume_id: string;

  @Column({ type: 'uuid', nullable: true })
  cover_letter_id: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status: ApplicationStatus;

  @Column({ type: 'timestamp', nullable: true })
  applied_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  response_received_at: Date;

  @Column({ type: 'float', nullable: true })
  match_score: number;

  @Column({ type: 'boolean', default: false })
  auto_applied: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position_title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  application_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ats_platform: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  application_reference_id: string;

  @Column({ type: 'text', nullable: true })
  screenshot_url: string;

  @Column({ type: 'json', nullable: true })
  form_responses: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  error_log: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  queue_status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
