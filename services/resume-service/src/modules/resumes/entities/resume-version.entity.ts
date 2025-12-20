import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Resume } from './resume.entity';

import type { ResumeContent } from './resume.entity';

@Entity('resume_versions')
@Index(['resumeId', 'version'])
export class ResumeVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resume_id', type: 'uuid' })
  @Index()
  resumeId: string;

  @ManyToOne(() => Resume, (resume) => resume.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'jsonb' })
  content: ResumeContent;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy: string;

  @Column({ name: 'change_description', type: 'text', nullable: true })
  changeDescription: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
