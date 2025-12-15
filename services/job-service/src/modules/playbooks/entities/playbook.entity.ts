import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum Region {
  UNITED_STATES = 'united_states',
  CANADA = 'canada',
  UNITED_KINGDOM = 'united_kingdom',
  EUROPEAN_UNION = 'european_union',
  AUSTRALIA = 'australia',
  GLOBAL_REMOTE = 'global_remote',
}

export enum ResumeFormat {
  CHRONOLOGICAL = 'chronological',
  FUNCTIONAL = 'functional',
  COMBINATION = 'combination',
  TARGETED = 'targeted',
}

export enum CoverLetterStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  SEMI_FORMAL = 'semi_formal',
  CREATIVE = 'creative',
}

export enum VisaType {
  NONE_REQUIRED = 'none_required',
  WORK_PERMIT_REQUIRED = 'work_permit_required',
  SPONSORSHIP_AVAILABLE = 'sponsorship_available',
  SPONSORSHIP_REQUIRED = 'sponsorship_required',
  EU_CITIZEN_ONLY = 'eu_citizen_only',
  PR_HOLDER_PREFERRED = 'pr_holder_preferred',
}

export interface ResumeSectionOrder {
  sections: string[];
  optional_sections: string[];
}

export interface SalaryNorms {
  currency: string;
  typical_range_min: number;
  typical_range_max: number;
  negotiation_culture: 'aggressive' | 'moderate' | 'conservative' | 'discouraged';
  salary_discussion_timing: 'early' | 'mid_process' | 'after_offer';
  benefits_importance: 'high' | 'medium' | 'low';
}

export interface HiringTimeline {
  typical_response_days: number;
  typical_interview_rounds: number;
  typical_total_process_days: number;
  follow_up_acceptable: boolean;
  follow_up_days: number;
}

export interface CulturalPreferences {
  formality_level: 'very_formal' | 'formal' | 'neutral' | 'casual';
  communication_style: 'direct' | 'indirect' | 'balanced';
  emphasis_on_education: 'high' | 'medium' | 'low';
  emphasis_on_experience: 'high' | 'medium' | 'low';
  value_job_hopping: boolean;
  preferred_references: 'required' | 'optional' | 'not_expected';
  photo_on_resume: 'required' | 'common' | 'optional' | 'discouraged';
  age_disclosure: 'common' | 'optional' | 'illegal';
}

@Entity('playbooks')
@Index(['region'], { unique: true })
@Index(['country'])
@Index(['is_active'])
export class Playbook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Region,
  })
  region: Region;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string; // Specific country if applicable (e.g., for EU variations)

  @Column({ type: 'text', nullable: true })
  description: string;

  // Resume Configuration
  @Column({
    type: 'enum',
    enum: ResumeFormat,
    default: ResumeFormat.CHRONOLOGICAL,
  })
  preferred_resume_format: ResumeFormat;

  @Column({ type: 'int', default: 2 })
  resume_max_pages: number;

  @Column({ type: 'jsonb' })
  resume_section_order: ResumeSectionOrder;

  @Column({ type: 'text', array: true, default: [] })
  resume_required_sections: string[];

  @Column({ type: 'boolean', default: true })
  include_summary_section: boolean;

  @Column({ type: 'boolean', default: false })
  include_photo: boolean;

  @Column({ type: 'boolean', default: false })
  include_date_of_birth: boolean;

  @Column({ type: 'boolean', default: false })
  include_marital_status: boolean;

  @Column({ type: 'varchar', length: 50, default: 'letter' })
  page_size: string; // A4, letter, etc.

  @Column({ type: 'text', array: true, default: [] })
  preferred_fonts: string[];

  @Column({ type: 'int', default: 11 })
  recommended_font_size: number;

  // Cover Letter Configuration
  @Column({
    type: 'enum',
    enum: CoverLetterStyle,
    default: CoverLetterStyle.FORMAL,
  })
  cover_letter_style: CoverLetterStyle;

  @Column({ type: 'boolean', default: true })
  cover_letter_required: boolean;

  @Column({ type: 'int', default: 400 })
  cover_letter_word_count_min: number;

  @Column({ type: 'int', default: 600 })
  cover_letter_word_count_max: number;

  @Column({ type: 'text', nullable: true })
  cover_letter_opening_template: string;

  @Column({ type: 'text', nullable: true })
  cover_letter_closing_template: string;

  // Salary Configuration
  @Column({ type: 'jsonb' })
  salary_norms: SalaryNorms;

  @Column({ type: 'boolean', default: true })
  include_salary_expectations: boolean;

  @Column({ type: 'text', array: true, default: [] })
  common_benefits: string[];

  // ATS Systems Common in Region
  @Column({ type: 'text', array: true, default: [] })
  common_ats_systems: string[];

  @Column({ type: 'jsonb', nullable: true })
  ats_optimization_tips: Record<string, any>;

  // Hiring Timeline
  @Column({ type: 'jsonb' })
  hiring_timeline: HiringTimeline;

  // Visa and Work Authorization
  @Column({
    type: 'enum',
    enum: VisaType,
    default: VisaType.NONE_REQUIRED,
  })
  visa_requirements: VisaType;

  @Column({ type: 'text', nullable: true })
  visa_information: string;

  @Column({ type: 'boolean', default: true })
  ask_work_authorization: boolean;

  @Column({ type: 'text', array: true, default: [] })
  acceptable_work_permits: string[];

  // Cultural Preferences
  @Column({ type: 'jsonb' })
  cultural_preferences: CulturalPreferences;

  @Column({ type: 'text', array: true, default: [] })
  interview_tips: string[];

  @Column({ type: 'text', array: true, default: [] })
  common_interview_formats: string[]; // phone, video, in-person, panel, technical

  // Language Requirements
  @Column({ type: 'varchar', length: 50, default: 'en' })
  primary_language: string;

  @Column({ type: 'text', array: true, default: [] })
  acceptable_languages: string[];

  @Column({ type: 'boolean', default: false })
  require_language_certification: boolean;

  // Application Best Practices
  @Column({ type: 'text', array: true, default: [] })
  application_dos: string[];

  @Column({ type: 'text', array: true, default: [] })
  application_donts: string[];

  @Column({ type: 'text', nullable: true })
  special_considerations: string;

  // Legal and Compliance
  @Column({ type: 'text', array: true, default: [] })
  protected_characteristics: string[]; // Things that should NOT be included

  @Column({ type: 'text', array: true, default: [] })
  required_disclosures: string[];

  @Column({ type: 'jsonb', nullable: true })
  privacy_regulations: Record<string, any>; // GDPR, CCPA, etc.

  // Metadata
  @Column({ type: 'int', default: 0 })
  usage_count: number;

  @Column({ type: 'float', default: 0.0 })
  success_rate: number; // Percentage of applications that got responses

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
