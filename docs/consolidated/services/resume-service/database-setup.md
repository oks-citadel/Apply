# Database Setup Guide

Quick guide for setting up the Resume Service database.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ installed
- Database user with CREATE privileges

## Quick Start

### 1. Create Database

```bash
# Create the database
createdb resume_service_db

# Or using psql
psql -U postgres
CREATE DATABASE resume_service_db;
\q
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update database settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=resume_service_db
RUN_MIGRATIONS=false
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
# Run all migrations
npm run migration:run

# Verify migrations
npm run migration:show
```

### 5. Start the Service

```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod
```

## Database Schema

The service creates the following tables:

- **resumes** - User resume documents
- **resume_versions** - Version history
- **sections** - Resume sections
- **templates** - Available templates

See [MIGRATIONS.md](./MIGRATIONS.md) for detailed schema documentation.

## Common Commands

```bash
# View migration status
npm run migration:show

# Create new migration
npm run migration:generate -- MigrationName

# Revert last migration
npm run migration:revert

# Drop all tables (dev only)
npm run schema:drop
```

## Production Deployment

For production deployments, see the [Production Deployment Checklist](./MIGRATIONS.md#production-deployment-checklist) in MIGRATIONS.md.

## Troubleshooting

If you encounter issues:

1. Ensure PostgreSQL is running: `pg_isready`
2. Verify database exists: `psql -l | grep resume_service`
3. Check connection settings in `.env`
4. Review logs in console output

For more help, see [MIGRATIONS.md](./MIGRATIONS.md#troubleshooting).
