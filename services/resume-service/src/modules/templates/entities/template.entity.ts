import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface TemplateConfig {
  layout?: {
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    spacing?: {
      section?: number;
      paragraph?: number;
      line?: number;
    };
    columns?: number;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    fontSize?: {
      heading1?: number;
      heading2?: number;
      heading3?: number;
      body?: number;
    };
  };
  colors?: {
    primary?: string;
    secondary?: string;
    text?: string;
    accent?: string;
  };
  sections?: {
    enabled?: string[];
    order?: string[];
  };
  styles?: {
    headerStyle?: string;
    sectionStyle?: string;
    listStyle?: string;
  };
}

@Entity('templates')
@Index(['isActive'])
@Index(['category'])
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'preview_url', type: 'varchar', length: 500, nullable: true })
  previewUrl: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ name: 'is_premium', type: 'boolean', default: false })
  isPremium: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  config: TemplateConfig;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
