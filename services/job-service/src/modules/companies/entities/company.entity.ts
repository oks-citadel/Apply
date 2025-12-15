import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum CompanySize {
  STARTUP = 'startup', // 1-50
  SMALL = 'small', // 51-200
  MEDIUM = 'medium', // 201-1000
  LARGE = 'large', // 1001-10000
  ENTERPRISE = 'enterprise', // 10000+
}

@Entity('companies')
@Index(['name'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  headquarters: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({
    type: 'enum',
    enum: CompanySize,
    nullable: true,
  })
  size: CompanySize;

  @Column({ type: 'int', nullable: true })
  employee_count: number;

  @Column({ type: 'int', nullable: true })
  founded_year: number;

  @Column({ type: 'text', array: true, default: [] })
  specialties: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  linkedin_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  glassdoor_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  indeed_url: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'int', default: 0 })
  review_count: number;

  @Column({ type: 'jsonb', nullable: true })
  culture_values: {
    diversity_inclusion?: number;
    work_life_balance?: number;
    career_growth?: number;
    compensation?: number;
    management?: number;
  };

  @Column({ type: 'text', array: true, default: [] })
  benefits: string[];

  @Column({ type: 'text', array: true, default: [] })
  tech_stack: string[];

  @Column({ type: 'boolean', default: true })
  @Index()
  is_verified: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany('Job', 'company')
  jobs: any[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual field
  active_jobs_count?: number;
}
