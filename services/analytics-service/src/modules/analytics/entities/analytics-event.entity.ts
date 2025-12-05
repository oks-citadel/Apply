import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EventType {
  PAGE_VIEW = 'page_view',
  APPLICATION_SUBMITTED = 'application_submitted',
  APPLICATION_VIEWED = 'application_viewed',
  APPLICATION_ACCEPTED = 'application_accepted',
  APPLICATION_REJECTED = 'application_rejected',
  JOB_SEARCHED = 'job_searched',
  JOB_VIEWED = 'job_viewed',
  JOB_SAVED = 'job_saved',
  RESUME_GENERATED = 'resume_generated',
  COVER_LETTER_GENERATED = 'cover_letter_generated',
  AI_SUGGESTION_USED = 'ai_suggestion_used',
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  PROFILE_UPDATED = 'profile_updated',
  EXPORT_DATA = 'export_data',
  ERROR_OCCURRED = 'error_occurred',
}

export enum EventCategory {
  USER = 'user',
  APPLICATION = 'application',
  JOB = 'job',
  AI = 'ai',
  SYSTEM = 'system',
}

@Entity('analytics_events')
@Index(['eventType', 'timestamp'])
@Index(['userId', 'timestamp'])
@Index(['category', 'timestamp'])
@Index(['timestamp'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  @Index()
  eventType: EventType;

  @Column({
    type: 'enum',
    enum: EventCategory,
  })
  @Index()
  category: EventCategory;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  applicationId: string;

  @Column({ nullable: true })
  jobId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  path: string;

  @Column({ type: 'integer', default: 1 })
  count: number;

  @Column({ type: 'integer', nullable: true })
  duration: number; // Duration in milliseconds

  @Column({ default: true })
  isSuccessful: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  // Computed field for date-based aggregation
  @Column({ type: 'date', nullable: true })
  @Index()
  eventDate: Date;
}
