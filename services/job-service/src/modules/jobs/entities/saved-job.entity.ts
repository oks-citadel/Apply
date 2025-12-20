import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';

import { Job } from './job.entity';

@Entity('saved_jobs')
@Unique(['user_id', 'job_id'])
@Index(['user_id'])
@Index(['job_id'])
export class SavedJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  job_id: string;

  @ManyToOne(() => Job, { eager: true })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string; // interested, applied, interviewing, rejected, accepted

  @Column({ type: 'timestamp', nullable: true })
  applied_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
