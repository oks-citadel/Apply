import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUuidExtension1733200000000 implements MigrationInterface {
  name = 'EnableUuidExtension1733200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension for PostgreSQL
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Verify the extension is enabled
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
        ) THEN
          RAISE EXCEPTION 'uuid-ossp extension could not be enabled';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop UUID extension (only if no dependencies exist)
    // This is generally not recommended in production
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE`);
  }
}
