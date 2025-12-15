import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaxonomyType {
  JOB_TITLE = 'job_title',
  SKILL = 'skill',
  INDUSTRY = 'industry',
  CERTIFICATION = 'certification',
  TOOL = 'tool',
  LANGUAGE = 'language',
}

export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT = 'soft',
  DOMAIN = 'domain',
  CERTIFICATION = 'certification',
}

@Entity('job_taxonomy')
@Index(['taxonomy_type', 'canonical_name'], { unique: true })
@Index(['taxonomy_type'])
@Index(['canonical_name'])
export class JobTaxonomy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TaxonomyType,
  })
  @Index()
  taxonomy_type: TaxonomyType;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  canonical_name: string; // Standard/normalized name

  @Column({ type: 'text', array: true, default: [] })
  aliases: string[]; // Alternative names, variations

  @Column({ type: 'text', array: true, default: [] })
  common_misspellings: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  parent_id: string; // For hierarchical taxonomy

  @Column({ type: 'int', default: 0 })
  hierarchy_level: number; // 0 = root, 1 = child, etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    category?: string;
    subcategory?: string;
    popularity?: number; // Usage frequency
    market_demand?: number; // 0-100
    growth_trend?: string; // 'rising', 'stable', 'declining'
  };

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  usage_count: number; // How many jobs use this

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('job_title_mappings')
@Index(['raw_title'])
@Index(['standardized_title'])
export class JobTitleMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  @Index()
  raw_title: string; // Original job title

  @Column({ type: 'varchar', length: 255 })
  @Index()
  standardized_title: string; // Normalized title

  @Column({ type: 'varchar', length: 100, nullable: true })
  seniority_level: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  function_category: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  confidence_score: number; // 0-100

  @Column({ type: 'int', default: 1 })
  occurrence_count: number; // How often we've seen this mapping

  @Column({ type: 'boolean', default: false })
  is_verified: boolean; // Manually verified by human

  @Column({ type: 'varchar', length: 255, nullable: true })
  verified_by: string;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('skill_mappings')
@Index(['raw_skill'])
@Index(['standardized_skill'])
export class SkillMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  raw_skill: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  standardized_skill: string;

  @Column({
    type: 'enum',
    enum: SkillCategory,
    default: SkillCategory.TECHNICAL,
  })
  category: SkillCategory;

  @Column({ type: 'text', array: true, default: [] })
  related_skills: string[]; // Similar or related skills

  @Column({ type: 'int', default: 50 })
  importance_score: number; // 0-100

  @Column({ type: 'int', default: 1 })
  occurrence_count: number;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('industry_mappings')
@Index(['raw_industry'])
@Index(['standardized_industry'])
export class IndustryMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  raw_industry: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  standardized_industry: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry_category: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sub_industry: string;

  @Column({ type: 'int', default: 1 })
  occurrence_count: number;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
