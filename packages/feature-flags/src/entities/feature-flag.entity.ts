import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FeatureFlagType, FeatureFlagStatus } from '../types';

/**
 * Feature Flag Entity
 * Stores feature flag configuration in the database
 */
@Entity('feature_flags')
@Index(['key'], { unique: true })
export class FeatureFlagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: FeatureFlagType,
    default: FeatureFlagType.BOOLEAN,
  })
  type: FeatureFlagType;

  @Column({
    type: 'enum',
    enum: FeatureFlagStatus,
    default: FeatureFlagStatus.ENABLED,
  })
  @Index()
  status: FeatureFlagStatus;

  @Column({ type: 'boolean', default: false })
  defaultValue: boolean;

  @Column({ type: 'int', nullable: true, default: null })
  rolloutPercentage: number | null;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  enabledUserIds: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  disabledUserIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Convert entity to plain config object
   */
  toConfig() {
    return {
      name: this.name,
      key: this.key,
      description: this.description,
      type: this.type,
      status: this.status,
      defaultValue: this.defaultValue,
      rolloutPercentage: this.rolloutPercentage,
      enabledUserIds: this.enabledUserIds || [],
      disabledUserIds: this.disabledUserIds || [],
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
