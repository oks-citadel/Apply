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
import { Company } from '../../companies/entities/company.entity';

export enum EmployerVerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  SUSPICIOUS = 'suspicious',
  BLACKLISTED = 'blacklisted',
}

export enum EmployerRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('employer_profiles')
@Index(['company_id'], { unique: true })
@Index(['verification_status'])
@Index(['credibility_score'])
@Index(['risk_level'])
export class EmployerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // Verification
  @Column({
    type: 'enum',
    enum: EmployerVerificationStatus,
    default: EmployerVerificationStatus.UNVERIFIED,
  })
  @Index()
  verification_status: EmployerVerificationStatus;

  @Column({ type: 'boolean', default: false })
  is_verified_employer: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verified_by: string;

  @Column({ type: 'text', array: true, default: [] })
  verification_methods: string[]; // ['email', 'domain', 'linkedin', 'manual']

  // Credibility Score (0-100)
  @Column({ type: 'int', default: 50 })
  @Index()
  credibility_score: number;

  @Column({ type: 'jsonb' })
  credibility_breakdown: {
    company_age?: number; // 0-20 points
    online_presence?: number; // 0-15 points
    review_quality?: number; // 0-25 points
    job_history?: number; // 0-20 points
    response_rate?: number; // 0-10 points
    transparency?: number; // 0-10 points
  };

  // Risk Assessment
  @Column({
    type: 'enum',
    enum: EmployerRiskLevel,
    default: EmployerRiskLevel.LOW,
  })
  @Index()
  risk_level: EmployerRiskLevel;

  @Column({ type: 'text', array: true, default: [] })
  risk_factors: string[]; // Red flags

  @Column({ type: 'int', default: 0 })
  scam_reports_count: number;

  @Column({ type: 'int', default: 0 })
  verified_scam_count: number;

  @Column({ type: 'boolean', default: false })
  has_fake_reviews: boolean;

  // Company Data
  @Column({ type: 'varchar', length: 255, nullable: true })
  legal_business_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  registration_number: string; // Business registration

  @Column({ type: 'varchar', length: 100, nullable: true })
  registration_country: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tax_id: string; // EIN, VAT, etc.

  @Column({ type: 'timestamp', nullable: true })
  company_founded_date: Date;

  @Column({ type: 'int', nullable: true })
  company_age_years: number;

  // Online Presence
  @Column({ type: 'boolean', default: false })
  has_verified_domain: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verified_domain: string;

  @Column({ type: 'timestamp', nullable: true })
  domain_registered_date: Date;

  @Column({ type: 'boolean', default: false })
  has_active_website: boolean;

  @Column({ type: 'boolean', default: false })
  has_linkedin_page: boolean;

  @Column({ type: 'int', nullable: true })
  linkedin_followers: number;

  @Column({ type: 'boolean', default: false })
  has_glassdoor_profile: boolean;

  @Column({ type: 'boolean', default: false })
  has_indeed_profile: boolean;

  // Review Data
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  glassdoor_rating: number;

  @Column({ type: 'int', default: 0 })
  glassdoor_review_count: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  glassdoor_recommend_percent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  glassdoor_ceo_approval: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  indeed_rating: number;

  @Column({ type: 'int', default: 0 })
  indeed_review_count: number;

  @Column({ type: 'jsonb', nullable: true })
  review_breakdown: {
    culture_rating?: number;
    compensation_rating?: number;
    work_life_balance_rating?: number;
    management_rating?: number;
    career_growth_rating?: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  last_review_date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  review_sentiment_score: number; // -1 to 1

  // Job Posting History
  @Column({ type: 'int', default: 0 })
  total_jobs_posted: number;

  @Column({ type: 'int', default: 0 })
  active_jobs_count: number;

  @Column({ type: 'int', default: 0 })
  expired_jobs_count: number;

  @Column({ type: 'int', default: 0 })
  filled_jobs_count: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  job_fill_rate: number; // % of jobs that get filled

  @Column({ type: 'int', nullable: true })
  avg_time_to_fill_days: number;

  @Column({ type: 'int', nullable: true })
  avg_applications_per_job: number;

  @Column({ type: 'timestamp', nullable: true })
  first_job_posted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_job_posted_at: Date;

  // Response and Engagement
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  response_rate: number; // % of applications responded to

  @Column({ type: 'int', nullable: true })
  avg_response_time_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interview_rate: number; // % of applicants who get interview

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  offer_rate: number; // % of candidates who get offers

  @Column({ type: 'int', default: 0 })
  ghosted_candidates_count: number;

  @Column({ type: 'int', default: 0 })
  positive_experiences_count: number;

  @Column({ type: 'int', default: 0 })
  negative_experiences_count: number;

  // Transparency
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  salary_transparency_score: number; // % of jobs with salary

  @Column({ type: 'boolean', default: false })
  posts_salary_ranges: boolean;

  @Column({ type: 'boolean', default: false })
  posts_detailed_descriptions: boolean;

  @Column({ type: 'boolean', default: false })
  responds_to_inquiries: boolean;

  // Red Flags
  @Column({ type: 'text', array: true, default: [] })
  detected_red_flags: string[];

  @Column({ type: 'int', default: 0 })
  duplicate_jobs_count: number;

  @Column({ type: 'int', default: 0 })
  fake_job_reports: number;

  @Column({ type: 'boolean', default: false })
  posts_unrealistic_salaries: boolean;

  @Column({ type: 'boolean', default: false })
  requires_payment_from_applicants: boolean;

  @Column({ type: 'boolean', default: false })
  poor_communication_history: boolean;

  // External Data Sources
  @Column({ type: 'jsonb', nullable: true })
  external_data_sources: {
    crunchbase_id?: string;
    linkedin_id?: string;
    glassdoor_id?: string;
    indeed_id?: string;
    duns_number?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  last_external_data_sync: Date;

  // Machine Learning Scores
  @Column({ type: 'int', nullable: true })
  ml_fraud_score: number; // 0-100

  @Column({ type: 'int', nullable: true })
  ml_quality_score: number; // 0-100

  @Column({ type: 'varchar', length: 100, nullable: true })
  ml_model_version: string;

  @Column({ type: 'jsonb', nullable: true })
  ml_features: {
    text_quality?: number;
    posting_patterns?: number;
    engagement_signals?: number;
    external_validation?: number;
  };

  // Manual Review
  @Column({ type: 'boolean', default: false })
  requires_manual_review: boolean;

  @Column({ type: 'text', nullable: true })
  manual_review_notes: string;

  @Column({ type: 'timestamp', nullable: true })
  last_reviewed_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewed_by: string;

  // User Reports
  @Column({ type: 'int', default: 0 })
  total_reports: number;

  @Column({ type: 'int', default: 0 })
  verified_reports: number;

  @Column({ type: 'int', default: 0 })
  dismissed_reports: number;

  @Column({ type: 'jsonb', nullable: true })
  report_breakdown: {
    scam?: number;
    spam?: number;
    fake_company?: number;
    misleading?: number;
    poor_experience?: number;
    other?: number;
  };

  // Additional Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  notes: {
    internal_notes?: string;
    verification_notes?: string;
    risk_assessment_notes?: string;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_credibility_update: Date;
}
