import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRolesAndPermissions1733210000000 implements MigrationInterface {
  name = 'SeedRolesAndPermissions1733210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default admin user (for initial setup only)
    // Password: Admin@123456 (bcrypt hashed with 12 rounds)
    await queryRunner.query(`
      INSERT INTO users (
        email,
        username,
        password,
        "firstName",
        "lastName",
        role,
        status,
        "authProvider",
        "isEmailVerified",
        "createdAt",
        "updatedAt"
      ) VALUES (
        'admin@applyforus.com',
        'admin',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIVInCRzUG',
        'System',
        'Administrator',
        'admin',
        'active',
        'local',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // Create roles table if needed for RBAC expansion
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(100) NOT NULL UNIQUE,
        description text,
        permissions jsonb DEFAULT '[]'::jsonb,
        "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO roles (name, description, permissions) VALUES
        ('admin', 'Full system access', '["*"]'::jsonb),
        ('user', 'Standard user access', '["profile:read", "profile:write", "jobs:read", "applications:write"]'::jsonb),
        ('recruiter', 'Recruiter access', '["jobs:write", "candidates:read", "interviews:write"]'::jsonb),
        ('moderator', 'Content moderation access', '["users:read", "content:moderate", "reports:read"]'::jsonb)
      ON CONFLICT (name) DO NOTHING;
    `);

    // Add comment
    await queryRunner.query(`
      COMMENT ON TABLE roles IS 'Role-based access control roles and permissions';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove default admin user
    await queryRunner.query(`
      DELETE FROM users WHERE email = 'admin@applyforus.com';
    `);

    // Drop roles table
    await queryRunner.query(`
      DROP TABLE IF EXISTS roles;
    `);
  }
}
