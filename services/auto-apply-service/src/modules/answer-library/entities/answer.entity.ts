import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum QuestionCategory {
  WORK_AUTHORIZATION = 'work_authorization',
  AVAILABILITY = 'availability',
  SALARY = 'salary',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  DIVERSITY = 'diversity',
  RELOCATION = 'relocation',
  REMOTE_WORK = 'remote_work',
  BACKGROUND_CHECK = 'background_check',
  REFERRAL = 'referral',
  COVER_LETTER = 'cover_letter',
  VETERAN_STATUS = 'veteran_status',
  DISABILITY = 'disability',
  CUSTOM = 'custom',
}

export enum AnswerType {
  TEXT = 'text',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  NUMBER = 'number',
  YES_NO = 'yes_no',
}

@Entity('answers')
@Index(['user_id', 'category'])
@Index(['user_id', 'question_pattern'])
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column({
    type: 'enum',
    enum: QuestionCategory,
    default: QuestionCategory.CUSTOM,
  })
  category: QuestionCategory;

  @Column({
    type: 'enum',
    enum: AnswerType,
    default: AnswerType.TEXT,
  })
  answer_type: AnswerType;

  @Column({ type: 'text' })
  question_pattern: string;

  @Column({ type: 'text', array: true, default: [] })
  keywords: string[];

  @Column({ type: 'text' })
  answer_value: string;

  @Column({ type: 'jsonb', nullable: true })
  answer_options: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  usage_count: number;

  @Column({ type: 'float', default: 1.0 })
  confidence_score: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
