import { Table, TableIndex, TableForeignKey } from 'typeorm';

import type { MigrationInterface, QueryRunner} from 'typeorm';

export class InitialSchema1733300000000 implements MigrationInterface {
  name = 'InitialSchema1733300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE section_type AS ENUM ('summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages', 'custom');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create resumes table
    await queryRunner.createTable(
      new Table({
        name: 'resumes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'ats_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'original_filename',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes on resumes
    await queryRunner.createIndex(
      'resumes',
      new TableIndex({
        name: 'IDX_RESUMES_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'resumes',
      new TableIndex({
        name: 'IDX_RESUMES_USER_ID_CREATED_AT',
        columnNames: ['user_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'resumes',
      new TableIndex({
        name: 'IDX_RESUMES_USER_ID_IS_PRIMARY',
        columnNames: ['user_id', 'is_primary'],
      })
    );

    await queryRunner.createIndex(
      'resumes',
      new TableIndex({
        name: 'IDX_RESUMES_IS_PRIMARY',
        columnNames: ['is_primary'],
      })
    );

    // Create resume_versions table
    await queryRunner.createTable(
      new Table({
        name: 'resume_versions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resume_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'changed_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'change_description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on resume_versions
    await queryRunner.createIndex(
      'resume_versions',
      new TableIndex({
        name: 'IDX_RESUME_VERSIONS_RESUME_ID',
        columnNames: ['resume_id'],
      })
    );

    await queryRunner.createIndex(
      'resume_versions',
      new TableIndex({
        name: 'IDX_RESUME_VERSIONS_RESUME_ID_VERSION',
        columnNames: ['resume_id', 'version'],
      })
    );

    // Add foreign key for resume_versions -> resumes
    await queryRunner.createForeignKey(
      'resume_versions',
      new TableForeignKey({
        name: 'FK_RESUME_VERSIONS_RESUME',
        columnNames: ['resume_id'],
        referencedTableName: 'resumes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Create sections table
    await queryRunner.createTable(
      new Table({
        name: 'sections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resume_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages', 'custom'],
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'order',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'visible',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on sections
    await queryRunner.createIndex(
      'sections',
      new TableIndex({
        name: 'IDX_SECTIONS_RESUME_ID',
        columnNames: ['resume_id'],
      })
    );

    await queryRunner.createIndex(
      'sections',
      new TableIndex({
        name: 'IDX_SECTIONS_RESUME_ID_TYPE',
        columnNames: ['resume_id', 'type'],
      })
    );

    // Create templates table (referenced by resumes but not defined in entities)
    await queryRunner.createTable(
      new Table({
        name: 'templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'preview_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_premium',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'config',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'usage_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes on templates
    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_TEMPLATES_IS_ACTIVE',
        columnNames: ['is_active'],
      })
    );

    await queryRunner.createIndex(
      'templates',
      new TableIndex({
        name: 'IDX_TEMPLATES_CATEGORY',
        columnNames: ['category'],
      })
    );

    // Add foreign key for resumes -> templates
    await queryRunner.createForeignKey(
      'resumes',
      new TableForeignKey({
        name: 'FK_RESUMES_TEMPLATE',
        columnNames: ['template_id'],
        referencedTableName: 'templates',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE resumes IS 'User resumes with content and metadata';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE resume_versions IS 'Version history for resume changes';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE sections IS 'Individual sections within a resume';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE templates IS 'Resume templates available to users';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('resumes', 'FK_RESUMES_TEMPLATE');
    await queryRunner.dropForeignKey('resume_versions', 'FK_RESUME_VERSIONS_RESUME');

    // Drop indexes
    await queryRunner.dropIndex('templates', 'IDX_TEMPLATES_CATEGORY');
    await queryRunner.dropIndex('templates', 'IDX_TEMPLATES_IS_ACTIVE');
    await queryRunner.dropIndex('sections', 'IDX_SECTIONS_RESUME_ID_TYPE');
    await queryRunner.dropIndex('sections', 'IDX_SECTIONS_RESUME_ID');
    await queryRunner.dropIndex('resume_versions', 'IDX_RESUME_VERSIONS_RESUME_ID_VERSION');
    await queryRunner.dropIndex('resume_versions', 'IDX_RESUME_VERSIONS_RESUME_ID');
    await queryRunner.dropIndex('resumes', 'IDX_RESUMES_IS_PRIMARY');
    await queryRunner.dropIndex('resumes', 'IDX_RESUMES_USER_ID_IS_PRIMARY');
    await queryRunner.dropIndex('resumes', 'IDX_RESUMES_USER_ID_CREATED_AT');
    await queryRunner.dropIndex('resumes', 'IDX_RESUMES_USER_ID');

    // Drop tables
    await queryRunner.dropTable('templates');
    await queryRunner.dropTable('sections');
    await queryRunner.dropTable('resume_versions');
    await queryRunner.dropTable('resumes');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS section_type`);
  }
}
