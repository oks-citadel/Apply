import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('profiles')
@Index(['user_id'], { unique: true })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  headline: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkedin_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  github_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  portfolio_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profile_photo_url: string;

  @Column({ type: 'int', default: 0 })
  completeness_score: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
