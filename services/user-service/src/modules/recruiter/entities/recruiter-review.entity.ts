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

import { RecruiterProfile } from './recruiter-profile.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
}

@Entity('recruiter_reviews')
@Index(['recruiter_id', 'status'])
@Index(['user_id'])
@Index(['rating', 'created_at'])
export class RecruiterReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  recruiter_id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  assignment_id: string;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  communication_rating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  professionalism_rating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  expertise_rating: number; // 1-5

  @Column({ type: 'int', nullable: true })
  responsiveness_rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  review_text: string;

  @Column({ type: 'text', nullable: true })
  review_title: string;

  @Column({ type: 'simple-array', nullable: true })
  pros: string[];

  @Column({ type: 'simple-array', nullable: true })
  cons: string[];

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ type: 'boolean', default: false })
  is_verified_placement: boolean;

  @Column({ type: 'boolean', default: false })
  would_recommend: boolean;

  // Helpful votes
  @Column({ type: 'int', default: 0 })
  helpful_count: number;

  @Column({ type: 'int', default: 0 })
  not_helpful_count: number;

  // Moderation
  @Column({ type: 'int', default: 0 })
  flag_count: number;

  @Column({ type: 'text', nullable: true })
  flag_reason: string;

  @Column({ type: 'uuid', nullable: true })
  moderated_by: string;

  @Column({ type: 'timestamp', nullable: true })
  moderated_at: Date;

  @Column({ type: 'text', nullable: true })
  moderation_notes: string;

  // Response from recruiter
  @Column({ type: 'text', nullable: true })
  recruiter_response: string;

  @Column({ type: 'timestamp', nullable: true })
  recruiter_response_at: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => RecruiterProfile, profile => profile.reviews)
  @JoinColumn({ name: 'recruiter_id' })
  recruiter: RecruiterProfile;

  // Helper methods
  getOverallRating(): number {
    const ratings = [
      this.communication_rating,
      this.professionalism_rating,
      this.expertise_rating,
      this.responsiveness_rating,
    ].filter(r => r !== null) as number[];

    if (ratings.length === 0) {return this.rating;}

    const sum = ratings.reduce((acc, r) => acc + r, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  getHelpfulnessRatio(): number {
    const total = this.helpful_count + this.not_helpful_count;
    if (total === 0) {return 0;}
    return this.helpful_count / total;
  }

  shouldBeFlagged(): boolean {
    return this.flag_count >= 3;
  }
}
