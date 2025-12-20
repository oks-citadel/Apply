import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCertificationsTable1734370000000 implements MigrationInterface {
  name = 'AddCertificationsTable1734370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create certifications table
    await queryRunner.query(`
      CREATE TABLE "certifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "issuing_organization" varchar(255) NOT NULL,
        "issue_date" date NOT NULL,
        "expiration_date" date,
        "credential_id" varchar(255),
        "credential_url" varchar(500),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create index for profile_id
    await queryRunner.query(`CREATE INDEX "IDX_certifications_profile_id" ON "certifications" ("profile_id")`);

    // Add foreign key constraint (assuming profiles table exists)
    await queryRunner.query(`
      ALTER TABLE "certifications"
      ADD CONSTRAINT "FK_certifications_profile"
      FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "certifications" DROP CONSTRAINT "FK_certifications_profile"`);

    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_certifications_profile_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "certifications"`);
  }
}
