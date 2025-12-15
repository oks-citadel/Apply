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

export enum RemoteType {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

export enum JobSource {
  INDEED = 'indeed',
  LINKEDIN = 'linkedin',
  GLASSDOOR = 'glassdoor',
  DIRECT = 'direct',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  EXECUTIVE = 'executive',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
  INTERNSHIP = 'internship',
}

@Entity('jobs')
@Index(['posted_at'])
@Index(['expires_at'])
@Index(['company_id'])
@Index(['source', 'external_id'], { unique: true })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  external_id: string;

  @Column({
    type: 'enum',
    enum: JobSource,
    default: JobSource.DIRECT,
  })
  source: JobSource;

  @Column({ type: 'varchar', length: 500 })
  @Index()
  title: string;

  @Column({ type: 'uuid', nullable: true })
  company_id: string;

  @ManyToOne('Company', 'jobs', { nullable: true, eager: false })
  @JoinColumn({ name: 'company_id' })
  company: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_name: string;

  @Column({ type: 'text', nullable: true })
  company_logo_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({
    type: 'enum',
    enum: RemoteType,
    default: RemoteType.ONSITE,
  })
  @Index()
  remote_type: RemoteType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_min: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_max: number;

  @Column({ type: 'varchar', length: 50, default: 'USD' })
  salary_currency: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  salary_period: string; // yearly, monthly, hourly

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', array: true, default: [] })
  requirements: string[];

  @Column({ type: 'text', array: true, default: [] })
  benefits: string[];

  @Column({ type: 'text', array: true, default: [] })
  @Index('idx_skills_gin', { synchronize: false })
  skills: string[];

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
  })
  experience_level: ExperienceLevel;

  @Column({ type: 'int', nullable: true })
  experience_years_min: number;

  @Column({ type: 'int', nullable: true })
  experience_years_max: number;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  employment_type: EmploymentType;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  posted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expires_at: Date;

  @Column({ type: 'text', nullable: true })
  application_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ats_platform: string; // Workday, Greenhouse, Lever, etc.

  @Column({ type: 'jsonb', nullable: true })
  ats_metadata: Record<string, any>;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  application_count: number;

  @Column({ type: 'int', default: 0 })
  save_count: number;

  @Column({ type: 'boolean', default: true })
  @Index()
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  // Vector embedding for semantic search (stored as text, processed by Elasticsearch)
  @Column({ type: 'text', nullable: true })
  embedding: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual fields for responses
  match_score?: number;
  saved?: boolean;
}
