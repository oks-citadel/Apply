import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAlignmentTables1734287000000 implements MigrationInterface {
  name = 'CreateAlignmentTables1734287000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create aligned_resumes table
    await queryRunner.createTable(
      new Table({
        name: 'aligned_resumes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'base_resume_id',
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
            name: 'content',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'alignment_metadata',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'match_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
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
            name: 'skill_match_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'experience_match_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'keyword_density',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create generated_cover_letters table
    await queryRunner.createTable(
      new Table({
        name: 'generated_cover_letters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'aligned_resume_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'base_resume_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'content_html',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'relevance_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'tone_appropriateness',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'word_count',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create alignment_analyses table
    await queryRunner.createTable(
      new Table({
        name: 'alignment_analyses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'base_resume_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'aligned_resume_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'job_description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'job_title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'overall_match_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'skill_gap_analysis',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'experience_alignment',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'keyword_analysis',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'alignment_changes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'improvement_suggestions',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'skill_match_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'experience_match_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'education_match_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'certification_match_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'match_explanation',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'strengths',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'weaknesses',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'recommendation',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for aligned_resumes
    await queryRunner.createIndex(
      'aligned_resumes',
      new TableIndex({
        name: 'IDX_aligned_resumes_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'aligned_resumes',
      new TableIndex({
        name: 'IDX_aligned_resumes_job_id',
        columnNames: ['job_id'],
      }),
    );

    await queryRunner.createIndex(
      'aligned_resumes',
      new TableIndex({
        name: 'IDX_aligned_resumes_base_resume_id',
        columnNames: ['base_resume_id'],
      }),
    );

    await queryRunner.createIndex(
      'aligned_resumes',
      new TableIndex({
        name: 'IDX_aligned_resumes_user_job',
        columnNames: ['user_id', 'job_id'],
      }),
    );

    // Create indexes for generated_cover_letters
    await queryRunner.createIndex(
      'generated_cover_letters',
      new TableIndex({
        name: 'IDX_cover_letters_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'generated_cover_letters',
      new TableIndex({
        name: 'IDX_cover_letters_job_id',
        columnNames: ['job_id'],
      }),
    );

    await queryRunner.createIndex(
      'generated_cover_letters',
      new TableIndex({
        name: 'IDX_cover_letters_aligned_resume_id',
        columnNames: ['aligned_resume_id'],
      }),
    );

    // Create indexes for alignment_analyses
    await queryRunner.createIndex(
      'alignment_analyses',
      new TableIndex({
        name: 'IDX_analyses_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'alignment_analyses',
      new TableIndex({
        name: 'IDX_analyses_job_id',
        columnNames: ['job_id'],
      }),
    );

    await queryRunner.createIndex(
      'alignment_analyses',
      new TableIndex({
        name: 'IDX_analyses_aligned_resume_id',
        columnNames: ['aligned_resume_id'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'aligned_resumes',
      new TableForeignKey({
        columnNames: ['base_resume_id'],
        referencedTableName: 'resumes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'generated_cover_letters',
      new TableForeignKey({
        columnNames: ['aligned_resume_id'],
        referencedTableName: 'aligned_resumes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'generated_cover_letters',
      new TableForeignKey({
        columnNames: ['base_resume_id'],
        referencedTableName: 'resumes',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'alignment_analyses',
      new TableForeignKey({
        columnNames: ['base_resume_id'],
        referencedTableName: 'resumes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'alignment_analyses',
      new TableForeignKey({
        columnNames: ['aligned_resume_id'],
        referencedTableName: 'aligned_resumes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const alignedResumesTable = await queryRunner.getTable('aligned_resumes');
    const coverLettersTable = await queryRunner.getTable('generated_cover_letters');
    const analysesTable = await queryRunner.getTable('alignment_analyses');

    const alignedResumesFk = alignedResumesTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('base_resume_id') !== -1,
    );
    if (alignedResumesFk) {
      await queryRunner.dropForeignKey('aligned_resumes', alignedResumesFk);
    }

    const coverLettersAlignedFk = coverLettersTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('aligned_resume_id') !== -1,
    );
    if (coverLettersAlignedFk) {
      await queryRunner.dropForeignKey('generated_cover_letters', coverLettersAlignedFk);
    }

    const coverLettersBaseFk = coverLettersTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('base_resume_id') !== -1,
    );
    if (coverLettersBaseFk) {
      await queryRunner.dropForeignKey('generated_cover_letters', coverLettersBaseFk);
    }

    const analysesBaseFk = analysesTable.foreignKeys.find((fk) => fk.columnNames.indexOf('base_resume_id') !== -1);
    if (analysesBaseFk) {
      await queryRunner.dropForeignKey('alignment_analyses', analysesBaseFk);
    }

    const analysesAlignedFk = analysesTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('aligned_resume_id') !== -1,
    );
    if (analysesAlignedFk) {
      await queryRunner.dropForeignKey('alignment_analyses', analysesAlignedFk);
    }

    // Drop tables
    await queryRunner.dropTable('alignment_analyses');
    await queryRunner.dropTable('generated_cover_letters');
    await queryRunner.dropTable('aligned_resumes');
  }
}
