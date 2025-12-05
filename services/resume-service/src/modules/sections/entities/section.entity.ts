import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SectionType {
  SUMMARY = 'summary',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  CERTIFICATIONS = 'certifications',
  PROJECTS = 'projects',
  LANGUAGES = 'languages',
  CUSTOM = 'custom',
}

@Entity('sections')
@Index(['resumeId', 'type'])
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resume_id', type: 'uuid' })
  @Index()
  resumeId: string;

  @Column({
    type: 'enum',
    enum: SectionType,
  })
  type: SectionType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'jsonb', default: {} })
  content: any;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
