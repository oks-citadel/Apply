import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCertificationsToUserId1734380000000 implements MigrationInterface {
  name = 'UpdateCertificationsToUserId1734380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "certifications"
      DROP CONSTRAINT IF EXISTS "FK_certifications_profile"
    `);

    // Drop the old index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_certifications_profile_id"`);

    // Add the new user_id column
    await queryRunner.query(`
      ALTER TABLE "certifications"
      ADD COLUMN IF NOT EXISTS "user_id" uuid
    `);

    // Migrate data: populate user_id from profiles table
    await queryRunner.query(`
      UPDATE "certifications" c
      SET "user_id" = p."user_id"
      FROM "profiles" p
      WHERE c."profile_id" = p."id"
    `);

    // Make user_id NOT NULL after data migration
    await queryRunner.query(`
      ALTER TABLE "certifications"
      ALTER COLUMN "user_id" SET NOT NULL
    `);

    // Drop the old profile_id column
    await queryRunner.query(`
      ALTER TABLE "certifications"
      DROP COLUMN IF EXISTS "profile_id"
    `);

    // Create index for user_id
    await queryRunner.query(`CREATE INDEX "IDX_certifications_user_id" ON "certifications" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_certifications_user_id"`);

    // Add back the profile_id column
    await queryRunner.query(`
      ALTER TABLE "certifications"
      ADD COLUMN IF NOT EXISTS "profile_id" uuid
    `);

    // Migrate data back: populate profile_id from profiles table
    await queryRunner.query(`
      UPDATE "certifications" c
      SET "profile_id" = p."id"
      FROM "profiles" p
      WHERE c."user_id" = p."user_id"
    `);

    // Make profile_id NOT NULL after data migration
    await queryRunner.query(`
      ALTER TABLE "certifications"
      ALTER COLUMN "profile_id" SET NOT NULL
    `);

    // Drop the user_id column
    await queryRunner.query(`
      ALTER TABLE "certifications"
      DROP COLUMN IF EXISTS "user_id"
    `);

    // Recreate index for profile_id
    await queryRunner.query(`CREATE INDEX "IDX_certifications_profile_id" ON "certifications" ("profile_id")`);

    // Recreate foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "certifications"
      ADD CONSTRAINT "FK_certifications_profile"
      FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE
    `);
  }
}
