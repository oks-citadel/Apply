import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVALID = 'invalid',
}

@Entity('device_tokens')
@Index(['userId', 'platform'])
@Unique(['token', 'platform'])
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  @Index()
  token: string;

  @Column({
    type: 'enum',
    enum: DevicePlatform,
  })
  @Index()
  platform: DevicePlatform;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.ACTIVE,
  })
  status: DeviceStatus;

  @Column({ name: 'device_name', nullable: true })
  deviceName: string;

  @Column({ name: 'device_model', nullable: true })
  deviceModel: string;

  @Column({ name: 'os_version', nullable: true })
  osVersion: string;

  @Column({ name: 'app_version', nullable: true })
  appVersion: string;

  @Column({ name: 'language', default: 'en' })
  language: string;

  @Column({ name: 'timezone', nullable: true })
  timezone: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'invalid_at', type: 'timestamp', nullable: true })
  invalidAt: Date;

  @Column({ name: 'invalid_reason', nullable: true })
  invalidReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
