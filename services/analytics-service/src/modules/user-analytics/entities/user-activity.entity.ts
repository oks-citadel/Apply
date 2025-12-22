import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Types of user activities that can be tracked
 */
export enum UserActivityType {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_RESET = 'password_reset',

  // Profile
  PROFILE_VIEW = 'profile_view',
  PROFILE_UPDATE = 'profile_update',
  RESUME_UPLOAD = 'resume_upload',
  RESUME_UPDATE = 'resume_update',

  // Job Search
  JOB_SEARCH = 'job_search',
  JOB_VIEW = 'job_view',
  JOB_SAVE = 'job_save',
  JOB_UNSAVE = 'job_unsave',
  JOB_FILTER = 'job_filter',

  // Applications
  APPLICATION_START = 'application_start',
  APPLICATION_SUBMIT = 'application_submit',
  APPLICATION_VIEW = 'application_view',
  APPLICATION_WITHDRAW = 'application_withdraw',

  // AI Features
  RESUME_GENERATE = 'resume_generate',
  COVER_LETTER_GENERATE = 'cover_letter_generate',
  AI_SUGGESTION_VIEW = 'ai_suggestion_view',
  AI_SUGGESTION_ACCEPT = 'ai_suggestion_accept',
  AI_SUGGESTION_REJECT = 'ai_suggestion_reject',

  // Notifications
  NOTIFICATION_VIEW = 'notification_view',
  NOTIFICATION_CLICK = 'notification_click',
  EMAIL_OPEN = 'email_open',

  // Settings
  SETTINGS_VIEW = 'settings_view',
  SETTINGS_UPDATE = 'settings_update',
  SUBSCRIPTION_VIEW = 'subscription_view',
  SUBSCRIPTION_UPGRADE = 'subscription_upgrade',
  SUBSCRIPTION_DOWNGRADE = 'subscription_downgrade',

  // Pages
  PAGE_VIEW = 'page_view',
  FEATURE_CLICK = 'feature_click',
  BUTTON_CLICK = 'button_click',

  // Export/Import
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
}

/**
 * Entity for tracking individual user activities
 * Optimized for time-series queries with proper indexing
 */
@Entity('user_activities')
@Index(['userId', 'timestamp'])
@Index(['activityType', 'timestamp'])
@Index(['userId', 'activityType', 'timestamp'])
@Index(['sessionId', 'timestamp'])
@Index(['timestamp'])
@Index(['activityDate'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: UserActivityType,
  })
  @Index()
  activityType: UserActivityType;

  @Column({ nullable: true })
  @Index()
  sessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  path: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  deviceType: string; // desktop, mobile, tablet

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'integer', nullable: true })
  duration: number; // Duration in milliseconds

  @Column({ default: true })
  isSuccessful: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @Column({ type: 'date', nullable: true })
  @Index()
  activityDate: Date;

  // Computed field for hour-based aggregation
  @Column({ type: 'smallint', nullable: true })
  @Index()
  activityHour: number;
}
