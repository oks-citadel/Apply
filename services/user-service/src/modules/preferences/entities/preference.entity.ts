import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { RemotePreference, ExperienceLevel } from '../../../common/enums/subscription-tier.enum';

@Entity('preferences')
@Index(['user_id'], { unique: true })
export class Preference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'text', array: true, default: '{}' })
  target_job_titles: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  target_locations: string[];

  @Column({ type: 'int', nullable: true })
  salary_min: number;

  @Column({ type: 'int', nullable: true })
  salary_max: number;

  @Column({
    type: 'enum',
    enum: RemotePreference,
    default: RemotePreference.ANY,
  })
  remote_preference: RemotePreference;

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
  })
  experience_level: ExperienceLevel;

  @Column({ type: 'text', array: true, default: '{}' })
  industries: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  excluded_companies: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  preferred_company_sizes: string[];

  @Column({ type: 'boolean', default: true })
  open_to_relocation: boolean;

  @Column({ type: 'boolean', default: true })
  open_to_sponsorship: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  required_benefits: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
