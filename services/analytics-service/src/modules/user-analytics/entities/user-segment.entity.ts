import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Predefined user segment types based on behavior patterns
 */
export enum SegmentType {
  // Engagement Level
  POWER_USER = 'power_user', // High activity, frequent logins
  ACTIVE_USER = 'active_user', // Regular activity
  CASUAL_USER = 'casual_user', // Occasional activity
  DORMANT_USER = 'dormant_user', // Haven't logged in recently
  CHURNED_USER = 'churned_user', // Likely to leave

  // Job Search Behavior
  ACTIVE_SEEKER = 'active_seeker', // Actively applying
  PASSIVE_SEEKER = 'passive_seeker', // Browsing but not applying
  SELECTIVE_APPLIER = 'selective_applier', // Few but targeted applications

  // Feature Usage
  AI_ENTHUSIAST = 'ai_enthusiast', // Heavy AI feature usage
  TRADITIONAL_USER = 'traditional_user', // Minimal AI feature usage
  PREMIUM_USER = 'premium_user', // Uses premium features

  // Lifecycle Stage
  NEW_USER = 'new_user', // Recently registered
  ONBOARDING = 'onboarding', // In onboarding process
  ESTABLISHED = 'established', // Completed onboarding, regular usage
  AT_RISK = 'at_risk', // Declining activity

  // Success Level
  HIGH_PERFORMER = 'high_performer', // High interview/acceptance rate
  AVERAGE_PERFORMER = 'average_performer', // Average success
  NEEDS_HELP = 'needs_help', // Low success rate, may need intervention
}

/**
 * Entity for storing user segment assignments
 * Users can belong to multiple segments simultaneously
 */
@Entity('user_segments')
@Index(['userId', 'segmentType'])
@Index(['segmentType', 'isActive'])
@Index(['userId', 'isActive'])
@Index(['assignedAt'])
export class UserSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: SegmentType,
  })
  @Index()
  segmentType: SegmentType;

  @Column({ type: 'float', default: 1.0 })
  confidence: number; // 0-1, confidence level of segment assignment

  @Column({ type: 'jsonb', nullable: true })
  criteria: Record<string, any>; // Criteria used to assign segment

  @Column({ type: 'jsonb', nullable: true })
  metrics: Record<string, any>; // Metrics snapshot when assigned

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  source: string; // How segment was assigned: 'auto', 'manual', 'ml'

  @CreateDateColumn()
  @Index()
  assignedAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // Optional expiration for time-limited segments
}

/**
 * Entity for tracking cohorts (groups of users who share a common characteristic)
 * Useful for retention analysis
 */
@Entity('user_cohorts')
@Index(['cohortType', 'cohortDate'])
@Index(['userId', 'cohortType'])
export class UserCohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  cohortType: string; // e.g., 'signup_week', 'first_application_month'

  @Column({ type: 'date' })
  @Index()
  cohortDate: Date; // The date that defines the cohort

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

/**
 * Entity for tracking user journey stages
 */
@Entity('user_journey_stages')
@Index(['userId', 'stage'])
@Index(['stage', 'reachedAt'])
@Index(['userId', 'reachedAt'])
export class UserJourneyStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  stage: string; // signup, profile_complete, first_search, first_application, first_interview, hired

  @Column({ type: 'timestamp' })
  @Index()
  reachedAt: Date;

  @Column({ type: 'integer', nullable: true })
  daysFromSignup: number;

  @Column({ type: 'integer', nullable: true })
  daysFromPreviousStage: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
