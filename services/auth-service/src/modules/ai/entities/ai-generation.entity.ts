import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum GenerationType {
  SUMMARY = 'summary',
  BULLETS = 'bullets',
  COVER_LETTER = 'cover_letter',
  ATS_SCORE = 'ats_score',
  JOB_MATCH = 'job_match',
  INTERVIEW_QUESTIONS = 'interview_questions',
}

@Entity('ai_generations')
@Index(['userId'])
@Index(['generationType'])
@Index(['createdAt'])
export class AIGeneration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: GenerationType,
  })
  @Index()
  generationType: GenerationType;

  @Column({ type: 'jsonb' })
  inputData: Record<string, any>;

  @Column({ type: 'jsonb' })
  outputData: Record<string, any>;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  modelUsed: string;

  @Column({ type: 'integer' })
  tokensUsed: number;

  @Column({ type: 'integer' })
  latencyMs: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
