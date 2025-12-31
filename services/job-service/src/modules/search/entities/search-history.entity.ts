import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('search_history')
@Index(['user_id', 'created_at'])
@Index(['user_id'])
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: {
    location?: string;
    remote_type?: string;
    salary_min?: number;
    salary_max?: number;
    experience_level?: string;
    employment_type?: string;
    skills?: string[];
    company_id?: string;
    posted_within_days?: number;
  };

  @Column({ type: 'int', default: 0 })
  results_count: number;

  @CreateDateColumn()
  created_at: Date;
}
