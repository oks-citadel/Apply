# TypeORM Migration Guide for JobPilot AI Platform

This guide explains how to set up and run TypeORM database migrations for all NestJS services in the JobPilot AI platform.

## Database Configuration

All services are configured to connect to the same PostgreSQL database:

```
Host: localhost
Port: 5434
Database: jobpilot
Username: postgres
Password: postgres
```

## Services with Migrations

The following services have been configured with TypeORM migrations:

1. **auth-service** - User authentication and authorization
2. **job-service** - Job listings and search
3. **resume-service** - Resume management
4. **user-service** - User profiles and preferences
5. **notification-service** - Notifications and messaging
6. **auto-apply-service** - Automated job applications
7. **analytics-service** - Analytics and metrics

## Migration Files Created

### Data Source Configuration Files

I've created `data-source.ts` files for each service in their respective `src/config/` directories:

- `services/auth-service/src/config/data-source.ts`
- `services/job-service/src/config/data-source.ts`
- `services/user-service/src/config/data-source.ts`
- `services/notification-service/src/config/data-source.ts`
- `services/auto-apply-service/src/config/data-source.ts`
- `services/analytics-service/src/config/data-source.ts`
- `services/resume-service/src/config/database.config.ts` (already existed)

### Package.json Scripts

Updated all services' `package.json` files with migration scripts:

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d src/config/data-source.ts",
    "migration:run": "npm run typeorm -- migration:run -d src/config/data-source.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d src/config/data-source.ts"
  }
}
```

## Existing Migrations

### auth-service
- `1733280000000-AddSubscriptionAndAITracking.ts` - Adds subscription tier tracking and AI generation tracking

### job-service
- `1733300000000-InitialSchema.ts` - Initial schema for jobs, companies, and alerts
- `1733400000000-CreateReportsTable.ts` - Creates reports table

### resume-service
- `1733200000000-EnableUuidExtension.ts` - Enables UUID extension
- `1733300000000-InitialSchema.ts` - Initial schema for resumes

### user-service
- `1733300000000-InitialSchema.ts` - Initial schema for user profiles

### notification-service
- `1733300000000-InitialSchema.ts` - Initial schema for notifications
- `1733400000000-AddNotificationPreferences.ts` - Adds notification preferences
- `1733500000000-AddDeviceTokens.ts` - Adds device tokens for push notifications

### auto-apply-service
- `1733300000000-InitialSchema.ts` - Initial schema for applications

### analytics-service
- `1733300000000-InitialSchema.ts` - Initial schema for analytics events

## How to Run Migrations

### Option 1: Run All Migrations Using Node.js Script

```bash
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
node run-migrations.js
```

### Option 2: Run All Migrations Using Bash Script

```bash
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
bash run-migrations.sh
```

### Option 3: Run Migrations for Each Service Individually

Navigate to each service directory and run:

```bash
# auth-service
cd services/auth-service
npm run migration:run

# job-service
cd services/job-service
npm run migration:run

# resume-service
cd services/resume-service
npm run migration:run

# user-service
cd services/user-service
npm run migration:run

# notification-service
cd services/notification-service
npm run migration:run

# auto-apply-service
cd services/auto-apply-service
npm run migration:run

# analytics-service
cd services/analytics-service
npm run migration:run
```

### Option 4: Run Migrations Using TypeORM CLI Directly

```bash
# Example for auth-service
cd services/auth-service
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/config/data-source.ts
```

## Prerequisites

Before running migrations, ensure:

1. **PostgreSQL is running** on `localhost:5434`
2. **Database `jobpilot` exists**:
   ```sql
   CREATE DATABASE jobpilot;
   ```
3. **Environment variables are set** (or use .env files):
   - DB_HOST=localhost
   - DB_PORT=5434
   - DB_USERNAME=postgres
   - DB_PASSWORD=postgres
   - DB_DATABASE=jobpilot

4. **Dependencies are installed** for each service:
   ```bash
   cd services/[service-name]
   npm install
   ```

## Troubleshooting

### Issue: "nest command not found" when building

**Solution**: Install dependencies first:
```bash
cd services/[service-name]
npm install
```

### Issue: TypeScript compilation errors

**Solution**: The migrations can run without building the entire service. Use the TypeORM CLI directly with ts-node:
```bash
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/config/data-source.ts
```

### Issue: "Cannot find module" errors

**Solution**: Ensure you're running the command from the correct directory (the service root) and that node_modules exists.

### Issue: Database connection errors

**Solution**:
1. Verify PostgreSQL is running: `psql -h localhost -p 5434 -U postgres -d jobpilot`
2. Check that the database exists
3. Verify credentials in .env file

### Issue: "No migrations are pending"

**Solution**: This means all migrations have already been run. To verify, check the `migrations` table in your database:
```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

## Generating New Migrations

To generate a new migration after modifying entities:

```bash
cd services/[service-name]
npm run migration:generate -- src/migrations/MigrationName
```

This will compare your entities with the current database schema and generate a migration file.

## Reverting Migrations

To revert the last migration:

```bash
cd services/[service-name]
npm run migration:revert
```

## Migration Execution Order

Migrations should be run in this order to respect foreign key dependencies:

1. auth-service (creates users table)
2. user-service (depends on users)
3. job-service
4. resume-service
5. notification-service
6. auto-apply-service
7. analytics-service

The provided scripts handle this order automatically.

## Database Schema Verification

After running all migrations, verify the schema:

```sql
-- List all tables
\dt

-- Check specific tables
\d users
\d jobs
\d resumes
\d applications
\d notifications
\d analytics_events
```

## Notes

- All services use the **same database** (`jobpilot`) but different tables
- Migrations use **UUID** for primary keys (requires `uuid-ossp` extension)
- All timestamps are stored as `timestamp with time zone`
- Migration files are located in `src/migrations/` for each service
- Compiled migration files should be in `dist/migrations/` after build

## Common Database Setup Commands

```sql
-- Create database
CREATE DATABASE jobpilot;

-- Connect to database
\c jobpilot

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- List all migrations
SELECT * FROM migrations ORDER BY timestamp;

-- Drop all tables (CAUTION!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Support

If you encounter issues not covered in this guide:

1. Check the TypeORM documentation: https://typeorm.io/migrations
2. Verify your database connection settings
3. Check the migration file syntax
4. Look at the error logs for specific table/column issues
