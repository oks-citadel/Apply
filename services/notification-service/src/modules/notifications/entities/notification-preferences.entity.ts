import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notification_preferences')
@Index(['userId'], { unique: true })
export class NotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  // Email notification preferences
  @Column({ name: 'email_enabled', default: true })
  emailEnabled: boolean;

  @Column({ name: 'email_welcome', default: true })
  emailWelcome: boolean;

  @Column({ name: 'email_verification', default: true })
  emailVerification: boolean;

  @Column({ name: 'email_password_reset', default: true })
  emailPasswordReset: boolean;

  @Column({ name: 'email_application_status', default: true })
  emailApplicationStatus: boolean;

  @Column({ name: 'email_job_alerts', default: true })
  emailJobAlerts: boolean;

  @Column({ name: 'email_weekly_digest', default: true })
  emailWeeklyDigest: boolean;

  @Column({ name: 'email_marketing', default: false })
  emailMarketing: boolean;

  // Push notification preferences
  @Column({ name: 'push_enabled', default: true })
  pushEnabled: boolean;

  @Column({ name: 'push_application_status', default: true })
  pushApplicationStatus: boolean;

  @Column({ name: 'push_job_alerts', default: true })
  pushJobAlerts: boolean;

  @Column({ name: 'push_messages', default: true })
  pushMessages: boolean;

  // SMS notification preferences (for future use)
  @Column({ name: 'sms_enabled', default: false })
  smsEnabled: boolean;

  @Column({ name: 'sms_application_status', default: false })
  smsApplicationStatus: boolean;

  // Notification frequency settings
  @Column({
    type: 'enum',
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
    default: 'immediate',
    name: 'digest_frequency',
  })
  digestFrequency: string;

  @Column({ name: 'quiet_hours_start', type: 'time', nullable: true })
  quietHoursStart: string; // Format: HH:MM

  @Column({ name: 'quiet_hours_end', type: 'time', nullable: true })
  quietHoursEnd: string; // Format: HH:MM

  @Column({ name: 'timezone', default: 'UTC' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
