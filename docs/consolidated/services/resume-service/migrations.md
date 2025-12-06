# Database Migrations Guide

This document provides comprehensive information about database migrations for the Resume Service.

## Table of Contents

1. [Overview](#overview)
2. [Migration Files](#migration-files)
3. [Running Migrations](#running-migrations)
4. [Creating New Migrations](#creating-new-migrations)
5. [Migration Best Practices](#migration-best-practices)
6. [Troubleshooting](#troubleshooting)

## Overview

The Resume Service uses **TypeORM** for database migrations. Migrations are version-controlled SQL schema changes that ensure database consistency across environments.

### Database Schema

The service manages the following entities:

- **Resumes**: User resume documents with content and metadata
- **Resume Versions**: Version history for resume changes
- **Sections**: Individual sections within a resume
- **Templates**: Resume templates available to users

## Migration Files

All migration files are located in `src/migrations/`:

1. **1733200000000-EnableUuidExtension.ts**
   - Enables PostgreSQL UUID extension
   - Must run first before other migrations

2. **1733300000000-InitialSchema.ts**
   - Creates all initial tables (resumes, resume_versions, sections, templates)
   - Sets up indexes for performance
   - Establishes foreign key relationships
   - Adds table comments for documentation

## Running Migrations

### Development Environment

```bash
# Run all pending migrations
npm run migration:run

# Show migration status
npm run migration:show

# Revert last migration
npm run migration:revert
```

### Production Environment

For production, you have two options:

#### Option 1: Manual Migration (Recommended for first deployment)

```bash
# Build the project first
npm run build

# Run migrations
npm run migration:run:prod
```

#### Option 2: Automatic Migration on Startup

Set the following environment variable:

```bash
RUN_MIGRATIONS=true
```

Then start the service normally. Migrations will run automatically before the application starts.

**Warning**: Use automatic migrations with caution in production. Ensure you have database backups and tested migrations.

### Environment Variables

Add to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=resume_service_db

# Migration Configuration
RUN_MIGRATIONS=false  # Set to 'true' to run migrations on startup
```

## Creating New Migrations

### Auto-generate Migration from Entity Changes

When you modify entity files, TypeORM can automatically generate a migration:

```bash
# Generate migration based on entity changes
npm run migration:generate -- MyMigrationName

# Example
npm run migration:generate -- AddResumeAtsOptimization
```

This will create a new file in `src/migrations/` with timestamp prefix.

### Create Empty Migration Template

To create a custom migration manually:

```bash
npm run migration:create -- MyMigrationName

# Example
npm run migration:create -- AddCustomIndexes
```

### Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MyMigration1234567890000 implements MigrationInterface {
  name = 'MyMigration1234567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your migration logic here
    await queryRunner.query(`
      ALTER TABLE resumes
      ADD COLUMN new_field VARCHAR(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add rollback logic here
    await queryRunner.query(`
      ALTER TABLE resumes
      DROP COLUMN new_field;
    `);
  }
}
```

## Migration Best Practices

### 1. Always Include Rollback Logic

Every migration should have a corresponding `down()` method to revert changes:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.createTable(/* ... */);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.dropTable('table_name');
}
```

### 2. Use Transactions

For complex migrations, wrap multiple operations in a transaction:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(`/* operation 1 */`);
    await queryRunner.query(`/* operation 2 */`);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  }
}
```

The migration runner script automatically uses transactions by default.

### 3. Add Indexes for Performance

Always add indexes on frequently queried columns:

```typescript
await queryRunner.createIndex(
  'resumes',
  new TableIndex({
    name: 'IDX_RESUMES_USER_ID',
    columnNames: ['user_id'],
  })
);
```

### 4. Use Proper Data Types

- **UUID**: Use `uuid` type with `uuid_generate_v4()` default
- **Timestamps**: Use `timestamp with time zone` for proper timezone handling
- **JSONB**: Use `jsonb` instead of `json` for better performance
- **Decimals**: Specify precision and scale (e.g., `decimal(5,2)`)

### 5. Add Column Comments

Document important columns:

```typescript
await queryRunner.query(`
  COMMENT ON COLUMN resumes.ats_score IS 'ATS optimization score (0-100)';
`);
```

### 6. Handle Nullable Columns

Be explicit about nullable fields:

```typescript
{
  name: 'deleted_at',
  type: 'timestamp with time zone',
  isNullable: true,  // Explicit nullable
}
```

### 7. Soft Delete Support

Implement soft deletes with `deleted_at` column:

```typescript
{
  name: 'deleted_at',
  type: 'timestamp with time zone',
  isNullable: true,
}
```

## Database Schema Details

### Resumes Table

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  template_id UUID,
  content JSONB DEFAULT '{}',
  ats_score DECIMAL(5,2),
  is_primary BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  file_path VARCHAR(500),
  original_filename VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IDX_RESUMES_USER_ID ON resumes(user_id);
CREATE INDEX IDX_RESUMES_USER_ID_CREATED_AT ON resumes(user_id, created_at);
CREATE INDEX IDX_RESUMES_USER_ID_IS_PRIMARY ON resumes(user_id, is_primary);
CREATE INDEX IDX_RESUMES_IS_PRIMARY ON resumes(is_primary);
```

### Resume Versions Table

```sql
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_by UUID NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IDX_RESUME_VERSIONS_RESUME_ID ON resume_versions(resume_id);
CREATE INDEX IDX_RESUME_VERSIONS_RESUME_ID_VERSION ON resume_versions(resume_id, version);
```

### Sections Table

```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL,
  type section_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB DEFAULT '{}',
  "order" INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IDX_SECTIONS_RESUME_ID ON sections(resume_id);
CREATE INDEX IDX_SECTIONS_RESUME_ID_TYPE ON sections(resume_id, type);
```

### Templates Table

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  preview_url VARCHAR(500),
  category VARCHAR(100),
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IDX_TEMPLATES_IS_ACTIVE ON templates(is_active);
CREATE INDEX IDX_TEMPLATES_CATEGORY ON templates(category);
```

## Troubleshooting

### Migration Already Exists

If you see "Migration already executed":

```bash
# Check migration status
npm run migration:show

# If needed, revert the last migration
npm run migration:revert
```

### UUID Extension Error

If you get "uuid_generate_v4() does not exist":

```bash
# The EnableUuidExtension migration should handle this
# If it fails, manually run in PostgreSQL:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Connection Issues

Verify your database configuration:

```bash
# Test database connection
psql -h localhost -U postgres -d resume_service_db

# Check environment variables
echo $DB_HOST
echo $DB_DATABASE
```

### Migration Rollback

To rollback migrations:

```bash
# Revert last migration
npm run migration:revert

# Revert multiple migrations (run command multiple times)
npm run migration:revert
npm run migration:revert
```

### Clear All Data (Development Only)

**WARNING**: This will delete all data!

```bash
# Drop all tables
npm run schema:drop

# Run migrations again
npm run migration:run
```

## Production Deployment Checklist

Before deploying to production:

- [ ] Test all migrations in staging environment
- [ ] Backup production database
- [ ] Review migration SQL queries
- [ ] Ensure migrations are idempotent
- [ ] Test rollback procedures
- [ ] Set `RUN_MIGRATIONS=false` (run manually)
- [ ] Document any data migration steps
- [ ] Plan maintenance window if needed

## CI/CD Integration

### Docker Deployment

```dockerfile
# In Dockerfile
COPY src/migrations ./src/migrations
COPY src/scripts ./src/scripts

# Run migrations in entrypoint script
CMD ["sh", "-c", "npm run migration:run:prod && npm run start:prod"]
```

### Kubernetes Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: resume-service-migrations
spec:
  template:
    spec:
      containers:
      - name: migrations
        image: resume-service:latest
        command: ["npm", "run", "migration:run:prod"]
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
      restartPolicy: Never
```

## Support

For issues or questions:

1. Check the [TypeORM Documentation](https://typeorm.io/migrations)
2. Review migration logs in `logs/` directory
3. Contact the development team
