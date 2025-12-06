import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('auto_apply_settings')
@Index(['user_id'], { unique: true })
export class AutoApplySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  filters: {
    jobTitle?: string[];
    location?: string[];
    experienceLevel?: string[];
    employmentType?: string[];
    salaryMin?: number;
    keywords?: string[];
    excludeKeywords?: string[];
  };

  @Column({ type: 'uuid' })
  resume_id: string;

  @Column({ type: 'text', nullable: true })
  cover_letter_template: string;

  @Column({ type: 'int', default: 50 })
  max_applications_per_day: number;

  @Column({ type: 'boolean', default: false })
  auto_response: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
