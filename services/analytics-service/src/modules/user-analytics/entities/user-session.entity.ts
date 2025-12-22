import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entity for tracking user sessions
 * Used for calculating session duration, engagement metrics, and user journeys
 */
@Entity('user_sessions')
@Index(['userId', 'startTime'])
@Index(['userId', 'isActive'])
@Index(['startTime'])
@Index(['sessionDate'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ unique: true })
  @Index()
  sessionId: string;

  @CreateDateColumn()
  @Index()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'integer', default: 0 })
  durationMs: number; // Total session duration in milliseconds

  @Column({ type: 'integer', default: 0 })
  pageViews: number;

  @Column({ type: 'integer', default: 0 })
  activityCount: number;

  @Column({ nullable: true })
  entryPage: string;

  @Column({ nullable: true })
  exitPage: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  utmSource: string;

  @Column({ nullable: true })
  utmMedium: string;

  @Column({ nullable: true })
  utmCampaign: string;

  @Column({ nullable: true })
  deviceType: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  os: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: true })
  isActive: boolean;

  // Track funnel progress within session
  @Column({ default: false })
  viewedJob: boolean;

  @Column({ default: false })
  savedJob: boolean;

  @Column({ default: false })
  startedApplication: boolean;

  @Column({ default: false })
  submittedApplication: boolean;

  @Column({ default: false })
  usedAiFeature: boolean;

  // Session quality indicators
  @Column({ type: 'float', default: 0 })
  bounceScore: number; // 0-1, lower is better

  @Column({ type: 'float', default: 0 })
  engagementScore: number; // 0-100, higher is better

  @Column({ type: 'date', nullable: true })
  @Index()
  sessionDate: Date;

  @UpdateDateColumn()
  lastActivityTime: Date;
}
