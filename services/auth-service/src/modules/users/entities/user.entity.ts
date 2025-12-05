import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  RECRUITER = 'recruiter',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  LINKEDIN = 'linkedin',
}

@Entity('users')
@Index(['email'])
@Index(['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ unique: true, nullable: true })
  @Index()
  username: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @Column({ nullable: true })
  providerId: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ nullable: true })
  emailVerificationExpiry: Date;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpiry: Date;

  @Column({ default: false })
  isMfaEnabled: boolean;

  @Column({ nullable: true })
  @Exclude()
  mfaSecret: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true })
  lockedUntil: Date;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  get fullName(): string {
    return this.firstName && this.lastName
      ? `${this.firstName} ${this.lastName}`
      : this.firstName || this.lastName || this.email;
  }

  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  // Methods
  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = null;
  }

  lockAccount(duration: number): void {
    this.lockedUntil = new Date(Date.now() + duration * 1000);
  }
}
