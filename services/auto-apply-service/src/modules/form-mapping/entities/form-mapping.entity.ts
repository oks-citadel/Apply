import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('form_mappings')
@Index(['company_name', 'ats_platform'])
export class FormMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  company_name: string;

  @Column({ type: 'varchar', length: 100 })
  ats_platform: string;

  @Column({ type: 'varchar', length: 255 })
  field_selector: string;

  @Column({ type: 'varchar', length: 100 })
  field_type: string; // text, email, tel, select, file, textarea, etc.

  @Column({ type: 'varchar', length: 100 })
  semantic_field: string; // first_name, last_name, email, phone, resume, etc.

  @Column({ type: 'json', nullable: true })
  field_attributes: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  confidence_score: number;

  @Column({ type: 'int', default: 1 })
  usage_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
