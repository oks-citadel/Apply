import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('education')
@Index(['user_id'])
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  institution: string;

  @Column({ type: 'varchar', length: 255 })
  degree: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  field_of_study: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'boolean', default: false })
  is_current: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gpa: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', array: true, default: '{}' })
  achievements: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
