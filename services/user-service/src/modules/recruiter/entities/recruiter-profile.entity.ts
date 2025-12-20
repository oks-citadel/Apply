import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

import { RecruiterAssignment } from './recruiter-assignment.entity';
import { RecruiterReview } from './recruiter-review.entity';

export enum RecruiterStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum RecruiterTier {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ELITE = 'elite',
}

export enum IndustrySpecialization {
  TECHNOLOGY = 'technology',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  EDUCATION = 'education',
  CONSULTING = 'consulting',
  GOVERNMENT = 'government',
  NONPROFIT = 'nonprofit',
  MEDIA = 'media',
  LEGAL = 'legal',
  REAL_ESTATE = 'real_estate',
  HOSPITALITY = 'hospitality',
  TRANSPORTATION = 'transportation',
  ENERGY = 'energy',
  OTHER = 'other',
}

export enum RoleSpecialization {
  SOFTWARE_ENGINEERING = 'software_engineering',
  DATA_SCIENCE = 'data_science',
  PRODUCT_MANAGEMENT = 'product_management',
  DESIGN = 'design',
  MARKETING = 'marketing',
  SALES = 'sales',
  OPERATIONS = 'operations',
  FINANCE_ACCOUNTING = 'finance_accounting',
  HUMAN_RESOURCES = 'human_resources',
  CUSTOMER_SUCCESS = 'customer_success',
  EXECUTIVE = 'executive',
  ENGINEERING_MANAGEMENT = 'engineering_management',
  BUSINESS_DEVELOPMENT = 'business_development',
  LEGAL_COMPLIANCE = 'legal_compliance',
  OTHER = 'other',
}

@Entity('recruiter_profiles')
@Index(['user_id'], { unique: true })
@Index(['status', 'tier'])
@Index(['quality_score'])
export class RecruiterProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  company_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  company_website: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'int', default: 0 })
  years_of_experience: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkedin_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certification: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  certification_url: string;

  @Column({
    type: 'enum',
    enum: RecruiterStatus,
    default: RecruiterStatus.PENDING,
  })
  @Index()
  status: RecruiterStatus;

  @Column({
    type: 'enum',
    enum: RecruiterTier,
    default: RecruiterTier.STANDARD,
  })
  tier: RecruiterTier;

  @Column({ type: 'simple-array', nullable: true })
  industries: IndustrySpecialization[];

  @Column({ type: 'simple-array', nullable: true })
  roles: RoleSpecialization[];

  @Column({ type: 'simple-array', nullable: true })
  regions: string[];

  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  // Performance metrics
  @Column({ type: 'int', default: 0 })
  total_placements: number;

  @Column({ type: 'int', default: 0 })
  successful_placements: number;

  @Column({ type: 'int', default: 0 })
  active_assignments: number;

  @Column({ type: 'int', default: 0 })
  total_assignments: number;

  @Column({ type: 'float', default: 0 })
  success_rate: number;

  @Column({ type: 'float', default: 0 })
  average_time_to_placement: number; // in days

  @Column({ type: 'float', default: 0 })
  average_rating: number;

  @Column({ type: 'int', default: 0 })
  total_reviews: number;

  @Column({ type: 'float', default: 50 })
  quality_score: number; // 0-100

  // Availability
  @Column({ type: 'int', default: 5 })
  max_concurrent_assignments: number;

  @Column({ type: 'boolean', default: true })
  accepting_new_assignments: boolean;

  @Column({ type: 'simple-array', nullable: true })
  available_hours: string[]; // e.g., ["9-12", "14-18"]

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  // Monetization
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  placement_fee_percentage: number; // e.g., 15.00 for 15%

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_revenue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pending_revenue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paid_revenue: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_account_id: string;

  @Column({ type: 'boolean', default: false })
  payouts_enabled: boolean;

  // Verification
  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ type: 'uuid', nullable: true })
  verified_by: string;

  @Column({ type: 'text', nullable: true })
  verification_notes: string;

  // Document uploads
  @Column({ type: 'varchar', length: 500, nullable: true })
  id_document_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  business_license_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  certification_document_url: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RecruiterAssignment, assignment => assignment.recruiter)
  assignments: RecruiterAssignment[];

  @OneToMany(() => RecruiterReview, review => review.recruiter)
  reviews: RecruiterReview[];

  // Helper methods
  calculateQualityScore(): number {
    let score = 50; // Base score

    // Success rate component (up to 30 points)
    if (this.total_placements > 0) {
      score += this.success_rate * 0.3;
    }

    // Rating component (up to 25 points)
    if (this.total_reviews > 0) {
      score += (this.average_rating / 5) * 25;
    }

    // Experience component (up to 15 points)
    score += Math.min(this.years_of_experience, 15);

    // Volume component (up to 15 points)
    score += Math.min(this.total_placements * 0.5, 15);

    // Time efficiency component (up to 15 points)
    if (this.average_time_to_placement > 0) {
      const efficiency = Math.max(0, 30 - this.average_time_to_placement) / 2;
      score += Math.min(efficiency, 15);
    }

    return Math.min(Math.max(score, 0), 100);
  }

  updateSuccessRate(): void {
    if (this.total_placements > 0) {
      this.success_rate = (this.successful_placements / this.total_placements) * 100;
    }
  }

  canAcceptAssignment(): boolean {
    return (
      this.status === RecruiterStatus.ACTIVE &&
      this.is_verified &&
      this.accepting_new_assignments &&
      this.active_assignments < this.max_concurrent_assignments
    );
  }
}
