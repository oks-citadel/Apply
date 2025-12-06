# Quick Start: Running TypeORM Migrations

## Prerequisites Check

```bash
# 1. Check if PostgreSQL is running
psql -h localhost -p 5434 -U postgres -l

# 2. Create database if needed
psql -h localhost -p 5434 -U postgres -c "CREATE DATABASE jobpilot;"
```

## Run All Migrations (Choose One Method)

### Method 1: Automated Script (Easiest)

```bash
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
node run-migrations.js
```

### Method 2: Manual (One Service at a Time)

```bash
# Run for each service in this order:
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\auth-service
npm install && npm run migration:run

cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\user-service
npm install && npm run migration:run

cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\job-service
npm install && npm run migration:run

cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\resume-service
npm install && npm run migration:run

cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\notification-service
npm install && npm run migration:run

cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\auto-apply-service
npm install && npm run migration:run

cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\analytics-service
npm install && npm run migration:run
```

## Verify Migrations Ran Successfully

```bash
psql -h localhost -p 5434 -U postgres -d jobpilot
```

Then in psql:
```sql
-- Check migration history
SELECT * FROM migrations ORDER BY timestamp DESC;

-- List all tables (should show ~20+ tables)
\dt

-- Exit
\q
```

## Expected Result

After successful migration, you should see tables like:
- users
- profiles
- jobs
- resumes
- applications
- notifications
- analytics_events
- migrations (and more)

## If Something Goes Wrong

### Database connection errors
```bash
# Check PostgreSQL is running
pg_ctl status

# Check database exists
psql -h localhost -p 5434 -U postgres -l | grep jobpilot
```

### "No migrations pending" message
- This is OKAY - it means migrations already ran
- Verify with: `SELECT * FROM migrations;`

### TypeScript compilation errors
- Don't worry - migrations can run without building
- Use: `npm run migration:run` (uses ts-node)

## Database Configuration

All services use:
- **Host:** localhost
- **Port:** 5434
- **Database:** jobpilot
- **Username:** postgres
- **Password:** postgres

## Need More Help?

See full documentation:
- `MIGRATION_GUIDE.md` - Detailed guide
- `MIGRATION_SETUP_COMPLETE.md` - What was configured
