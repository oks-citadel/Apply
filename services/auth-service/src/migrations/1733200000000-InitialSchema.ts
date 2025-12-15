import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1733200000000 implements MigrationInterface {
  name = 'InitialSchema1733200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create user_role enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'user', 'recruiter', 'moderator');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create user_status enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create auth_provider enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE auth_provider AS ENUM ('local', 'google', 'linkedin', 'github');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'profilePicture',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'user', 'recruiter', 'moderator'],
            default: "'user'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'suspended', 'pending_verification'],
            default: "'pending_verification'",
            isNullable: false,
          },
          {
            name: 'authProvider',
            type: 'enum',
            enum: ['local', 'google', 'linkedin', 'github'],
            default: "'local'",
            isNullable: false,
          },
          {
            name: 'providerId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'isEmailVerified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'emailVerificationToken',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'emailVerificationExpiry',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'passwordResetToken',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'passwordResetExpiry',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'isMfaEnabled',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'mfaSecret',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'lastLoginIp',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'loginAttempts',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'lockedUntil',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'refreshToken',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_USERNAME',
        columnNames: ['username'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_ROLE',
        columnNames: ['role'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_AUTH_PROVIDER',
        columnNames: ['authProvider', 'providerId'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL_VERIFICATION_TOKEN',
        columnNames: ['emailVerificationToken'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_PASSWORD_RESET_TOKEN',
        columnNames: ['passwordResetToken'],
      })
    );

    // Add comments
    await queryRunner.query(`
      COMMENT ON TABLE users IS 'Authentication and user account management';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN users.password IS 'Bcrypt hashed password';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN users.mfaSecret IS 'TOTP secret for multi-factor authentication';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN users.loginAttempts IS 'Failed login attempt counter';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN users.lockedUntil IS 'Account lock expiration timestamp';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('users', 'IDX_USERS_PASSWORD_RESET_TOKEN');
    await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL_VERIFICATION_TOKEN');
    await queryRunner.dropIndex('users', 'IDX_USERS_AUTH_PROVIDER');
    await queryRunner.dropIndex('users', 'IDX_USERS_STATUS');
    await queryRunner.dropIndex('users', 'IDX_USERS_ROLE');
    await queryRunner.dropIndex('users', 'IDX_USERS_USERNAME');
    await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL');

    // Drop table
    await queryRunner.dropTable('users');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS auth_provider`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
