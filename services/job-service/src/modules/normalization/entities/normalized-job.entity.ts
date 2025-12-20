import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';

import { Job } from '../../jobs/entities/job.entity';

export enum SeniorityLevel {
  INTERN = 'intern',
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  PRINCIPAL = 'principal',
  STAFF = 'staff',
  DIRECTOR = 'director',
  VP = 'vp',
  C_LEVEL = 'c_level',
}

export enum FunctionCategory {
  ENGINEERING = 'engineering',
  PRODUCT = 'product',
  DESIGN = 'design',
  DATA = 'data',
  MARKETING = 'marketing',
  SALES = 'sales',
  CUSTOMER_SUCCESS = 'customer_success',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
  LEGAL = 'legal',
  HR = 'hr',
  EXECUTIVE = 'executive',
  OTHER = 'other',
}

export enum IndustryCategory {
  TECHNOLOGY = 'technology',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  CONSULTING = 'consulting',
  MEDIA = 'media',
  REAL_ESTATE = 'real_estate',
  TRANSPORTATION = 'transportation',
  ENERGY = 'energy',
  GOVERNMENT = 'government',
  NON_PROFIT = 'non_profit',
  OTHER = 'other',
}

export enum ApplicationComplexity {
  SIMPLE = 'simple', // Email or quick apply
  MODERATE = 'moderate', // Form with basic fields
  COMPLEX = 'complex', // Multi-step, assessments
  VERY_COMPLEX = 'very_complex', // Video, portfolio, extensive
}

export enum VisaSupport {
  NOT_SPECIFIED = 'not_specified',
  NO_SPONSORSHIP = 'no_sponsorship',
  TRANSFER_ONLY = 'transfer_only',
  WILL_SPONSOR = 'will_sponsor',
}

@Entity('normalized_jobs')
@Index(['job_id'], { unique: true })
@Index(['standardized_title'])
@Index(['seniority_level'])
@Index(['function_category'])
@Index(['industry_category'])
@Index(['quality_score'])
@Index(['confidence_score'])
@Index(['is_duplicate'])
@Index(['is_scam'])
export class NormalizedJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  job_id: string;

  @OneToOne(() => Job, { nullable: false })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  // Normalized Title
  @Column({ type: 'varchar', length: 255 })
  @Index()
  standardized_title: string;

  @Column({
    type: 'enum',
    enum: SeniorityLevel,
    nullable: true,
  })
  @Index()
  seniority_level: SeniorityLevel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  role_family: string; // e.g., "Software Engineer", "Product Manager"

  // Classification
  @Column({
    type: 'enum',
    enum: FunctionCategory,
  })
  @Index()
  function_category: FunctionCategory;

  @Column({
    type: 'enum',
    enum: IndustryCategory,
    nullable: true,
  })
  @Index()
  industry_category: IndustryCategory;

  // Normalized Skills (categorized)
  @Column({ type: 'jsonb' })
  categorized_skills: {
    technical?: string[]; // Programming languages, tools
    soft?: string[]; // Leadership, communication
    domain?: string[]; // Industry-specific knowledge
    certifications?: string[]; // Required certifications
  };

  @Column({ type: 'text', array: true, default: [] })
  required_skills: string[]; // Must-have skills

  @Column({ type: 'text', array: true, default: [] })
  preferred_skills: string[]; // Nice-to-have skills

  // Normalized Experience
  @Column({ type: 'int', nullable: true })
  min_years_experience: number;

  @Column({ type: 'int', nullable: true })
  max_years_experience: number;

  @Column({ type: 'int', nullable: true })
  typical_years_for_level: number; // Expected years for this seniority

  // Normalized Location
  @Column({ type: 'varchar', length: 255, nullable: true })
  normalized_location: string; // Standardized format

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  country_code: string; // ISO country code

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string; // e.g., "North America", "EMEA"

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string; // For remote jobs

  @Column({ type: 'boolean', default: false })
  allows_remote: boolean;

  @Column({ type: 'boolean', default: false })
  requires_relocation: boolean;

  @Column({
    type: 'enum',
    enum: VisaSupport,
    default: VisaSupport.NOT_SPECIFIED,
  })
  visa_support: VisaSupport;

  // Normalized Compensation
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary_min_usd: number; // Converted to USD

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary_max_usd: number; // Converted to USD

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary_median_usd: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  compensation_period: string; // Normalized to yearly, hourly, etc.

  @Column({ type: 'jsonb', nullable: true })
  compensation_breakdown: {
    base?: number;
    bonus?: number;
    equity?: number;
    benefits_value?: number;
  };

  @Column({ type: 'int', nullable: true })
  market_percentile: number; // 0-100, compared to market rate

  // Application Method
  @Column({
    type: 'enum',
    enum: ApplicationComplexity,
    default: ApplicationComplexity.MODERATE,
  })
  application_complexity: ApplicationComplexity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ats_system: string; // Normalized ATS name

  @Column({ type: 'int', nullable: true })
  estimated_application_time_minutes: number;

  @Column({ type: 'boolean', default: false })
  has_screening_questions: boolean;

  @Column({ type: 'boolean', default: false })
  requires_cover_letter: boolean;

  @Column({ type: 'boolean', default: false })
  requires_portfolio: boolean;

  @Column({ type: 'boolean', default: false })
  requires_assessment: boolean;

  // Quality Metrics
  @Column({ type: 'int', default: 0 })
  @Index()
  quality_score: number; // 0-100

  @Column({ type: 'int', default: 0 })
  @Index()
  confidence_score: number; // 0-100, confidence in normalization

  @Column({ type: 'jsonb' })
  quality_signals: {
    has_salary?: boolean;
    has_detailed_description?: boolean;
    has_clear_requirements?: boolean;
    has_company_info?: boolean;
    description_length?: number;
    readability_score?: number;
  };

  // Duplicate Detection
  @Column({ type: 'boolean', default: false })
  @Index()
  is_duplicate: boolean;

  @Column({ type: 'uuid', nullable: true })
  duplicate_of_job_id: string; // Reference to original job

  @Column({ type: 'varchar', length: 64, nullable: true })
  @Index()
  content_hash: string; // Hash for duplicate detection

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  similarity_score: number; // Similarity to original (0-100)

  // Scam/Spam Detection
  @Column({ type: 'boolean', default: false })
  @Index()
  is_scam: boolean;

  @Column({ type: 'int', default: 0 })
  scam_score: number; // 0-100, higher = more likely scam

  @Column({ type: 'text', array: true, default: [] })
  scam_indicators: string[]; // List of detected red flags

  @Column({ type: 'jsonb', nullable: true })
  fraud_signals: {
    suspicious_salary?: boolean;
    fake_company?: boolean;
    poor_grammar?: boolean;
    requires_payment?: boolean;
    too_good_to_be_true?: boolean;
    phishing_links?: boolean;
  };

  // Freshness
  @Column({ type: 'int', default: 0 })
  age_days: number; // Days since posted

  @Column({ type: 'int', default: 100 })
  freshness_score: number; // 0-100, decays over time

  @Column({ type: 'boolean', default: false })
  is_expired: boolean;

  @Column({ type: 'timestamp', nullable: true })
  estimated_expiry: Date;

  // ML Model Metadata
  @Column({ type: 'varchar', length: 100, nullable: true })
  normalization_model_version: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  classification_model_version: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fraud_detection_model_version: string;

  @Column({ type: 'timestamp', nullable: true })
  last_normalized_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  ml_confidence_scores: {
    title_normalization?: number;
    skill_extraction?: number;
    classification?: number;
    fraud_detection?: number;
  };

  // Additional Metadata
  @Column({ type: 'jsonb', nullable: true })
  extraction_metadata: {
    parsing_confidence?: number;
    field_completeness?: number;
    data_quality_issues?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  normalization_notes: {
    manual_overrides?: string[];
    data_quality_warnings?: string[];
    field_transformations?: Record<string, string>;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
