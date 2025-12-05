import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';

export enum ReviewSource {
  GLASSDOOR = 'glassdoor',
  INDEED = 'indeed',
  INTERNAL = 'internal',
}

@Entity('company_reviews')
@Index(['company_id'])
@Index(['created_at'])
export class CompanyReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({
    type: 'enum',
    enum: ReviewSource,
    default: ReviewSource.INTERNAL,
  })
  source: ReviewSource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  review_text: string;

  @Column({ type: 'text', nullable: true })
  pros: string;

  @Column({ type: 'text', nullable: true })
  cons: string;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  overall_rating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  work_life_balance_rating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  culture_rating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  career_opportunities_rating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  compensation_rating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  management_rating: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  job_title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employment_status: string; // current, former

  @Column({ type: 'int', nullable: true })
  years_at_company: number;

  @Column({ type: 'boolean', default: false })
  recommend_to_friend: boolean;

  @Column({ type: 'boolean', default: false })
  approve_of_ceo: boolean;

  @Column({ type: 'int', default: 0 })
  helpful_count: number;

  @Column({ type: 'boolean', default: true })
  is_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
