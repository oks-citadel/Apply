import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

import { ResumeVersion } from './resume-version.entity';
import { Template } from '../../templates/entities/template.entity';

export interface ResumeContent {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  summary?: string;
  experience?: Array<{
    id?: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description: string;
    achievements?: string[];
  }>;
  education?: Array<{
    id?: string;
    institution: string;
    degree: string;
    field: string;
    location?: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    achievements?: string[];
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
    tools?: string[];
  };
  certifications?: Array<{
    id?: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
  }>;
  projects?: Array<{
    id?: string;
    name: string;
    description: string;
    technologies?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    github?: string;
  }>;
  languages?: Array<{
    id?: string;
    language: string;
    proficiency: string;
  }>;
  customSections?: Array<{
    id?: string;
    title: string;
    content: string;
    order?: number;
  }>;
}

@Entity('resumes')
@Index(['userId', 'createdAt'])
@Index(['userId', 'isPrimary'])
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string;

  @ManyToOne(() => Template, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column({ type: 'jsonb', default: {} })
  content: ResumeContent;

  @Column({ name: 'ats_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  atsScore: number;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  @Index()
  isPrimary: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 255, nullable: true })
  originalFilename: string;

  @Column({ name: 'file_type', type: 'varchar', length: 50, nullable: true })
  fileType: string;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize: number;

  @OneToMany(() => ResumeVersion, (version) => version.resume)
  versions: ResumeVersion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
