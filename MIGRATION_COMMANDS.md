# Database Migration Commands Reference

## Migration Scripts in package.json

All NestJS services already have migration scripts configured:

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

## Local Development Migration Commands

### Auth Service

```bash
# Navigate to auth service
cd services/auth-service

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=applyforus_auth
export DB_SSL=false

# Run migrations
npm run migration:run

# Expected output:
# query: SELECT * FROM "migrations" "migrations"
# query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
# query: CREATE TYPE user_role AS ENUM (...)
# Migration InitialSchema1733200000000 has been executed successfully.
# Migration SeedRolesAndPermissions1733210000000 has been executed successfully.

# Verify
psql -h localhost -U postgres -d applyforus_auth -c "\dt"
# Should show: users, ai_generations, roles, migrations
```

### User Service

```bash
cd services/user-service

export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=applyforus_user
export DB_SSL=false

npm run migration:run
```

### Job Service

```bash
cd services/job-service

export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=applyforus_job
export DB_SSL=false

npm run migration:run
```

### Other Services

Repeat pattern for:
- analytics-service → applyforus_analytics
- notification-service → applyforus_notification
- auto-apply-service → applyforus_autoapply
- resume-service → applyforus_resume
- payment-service → applyforus_payment

## Production Migration Commands

### Option 1: Via Kubernetes Job (Recommended)

Already configured in `infrastructure/kubernetes/jobs/db-init-job.yaml`:

```bash
# Apply the job
kubectl apply -f infrastructure/kubernetes/jobs/db-init-job.yaml

# Monitor progress
kubectl logs -f job/database-migrations -n applyforus -c auth-migrations
kubectl logs -f job/database-migrations -n applyforus -c user-migrations
kubectl logs -f job/database-migrations -n applyforus -c job-migrations

# Check completion
kubectl get jobs -n applyforus
```

### Option 2: Manual Execution via Pod

```bash
# Run migration from within a pod
kubectl exec -it deployment/auth-service -n applyforus -- npm run migration:run

# Or create a one-time job
kubectl run migration-runner \
  --image=applyforusacr.azurecr.io/applyai-auth-service:latest \
  --restart=Never \
  --env="DB_HOST=applyforus-postgres.postgres.database.azure.com" \
  --env="DB_PORT=5432" \
  --env="DB_DATABASE=applyforus_auth" \
  --env="DB_SSL=true" \
  -n applyforus \
  -- npm run migration:run

# Check logs
kubectl logs migration-runner -n applyforus

# Cleanup
kubectl delete pod migration-runner -n applyforus
```

## Creating New Migrations

### Generate Migration from Entity Changes

```bash
# Make changes to entities
# Then generate migration

cd services/auth-service
npm run migration:generate -- src/migrations/AddNewField

# This creates: src/migrations/[timestamp]-AddNewField.ts
```

### Create Empty Migration

```bash
# Create migration manually
cd services/auth-service
npm run typeorm -- migration:create src/migrations/CustomMigration

# Edit the generated file to add your changes
```

### Migration Template

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1234567890123 implements MigrationInterface {
  name = 'MigrationName1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your up migration logic here
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add your down migration logic here
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN new_field;
    `);
  }
}
```

## Migration Best Practices

### 1. Always Test Locally First

```bash
# Create test database
createdb applyforus_auth_test

# Run migration
DB_DATABASE=applyforus_auth_test npm run migration:run

# Verify
psql applyforus_auth_test -c "\d users"

# Revert if needed
DB_DATABASE=applyforus_auth_test npm run migration:revert

# Drop test database
dropdb applyforus_auth_test
```

### 2. Check Migration Status

```bash
# View applied migrations
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE -c "SELECT * FROM migrations;"

# Count migrations
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE -c "SELECT COUNT(*) FROM migrations;"
```

### 3. Handle Failed Migrations

```bash
# If migration fails mid-way, you may need to manually fix

# 1. Check which migrations ran
psql -d applyforus_auth -c "SELECT * FROM migrations ORDER BY timestamp DESC;"

# 2. Manually remove failed migration record
psql -d applyforus_auth -c "DELETE FROM migrations WHERE name = 'FailedMigration1234567890123';"

# 3. Fix the issue in migration file

# 4. Re-run migration
npm run migration:run
```

### 4. Reverting Migrations

```bash
# Revert last migration
npm run migration:revert

# Revert multiple migrations
npm run migration:revert
npm run migration:revert
npm run migration:revert

# Warning: This runs the 'down' method
# Make sure your down() method is correct!
```

## Database Initialization Workflow

### Complete Setup from Scratch

```bash
# 1. Create databases
kubectl apply -f infrastructure/kubernetes/jobs/db-init-job.yaml
kubectl wait --for=condition=complete job/database-init -n applyforus

# 2. Run all migrations
kubectl wait --for=condition=complete job/database-migrations -n applyforus

# 3. Verify databases
for db in auth user job analytics notification autoapply resume payment; do
  echo "Checking applyforus_${db}..."
  psql -h applyforus-postgres.postgres.database.azure.com \
       -U applyforusadmin \
       -d applyforus_${db} \
       --set=sslmode=require \
       -c "SELECT COUNT(*) as migration_count FROM migrations;"
done

# 4. Check table counts
psql -h applyforus-postgres.postgres.database.azure.com \
     -U applyforusadmin \
     -d applyforus_auth \
     --set=sslmode=require \
     -c "SELECT 'users' as table_name, COUNT(*) FROM users
         UNION ALL
         SELECT 'roles', COUNT(*) FROM roles;"
```

## Troubleshooting Migration Issues

### Issue: "relation already exists"

```bash
# The table was created manually or by synchronize=true

# Solution 1: Mark migration as run without executing
psql -d applyforus_auth -c "
  INSERT INTO migrations (timestamp, name)
  VALUES (1733200000000, 'InitialSchema1733200000000');
"

# Solution 2: Drop and recreate (DANGER - loses data)
# Only do this in development!
psql -d applyforus_auth -c "DROP TABLE users CASCADE;"
npm run migration:run
```

### Issue: "column already exists"

```bash
# Migration partially ran

# Solution: Wrap changes in DO blocks
# Edit migration to check existence:

await queryRunner.query(`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'new_column'
    ) THEN
      ALTER TABLE users ADD COLUMN new_column VARCHAR(255);
    END IF;
  END $$;
`);
```

### Issue: Migration timeout

```bash
# For large migrations, increase timeout

# In Kubernetes job:
apiVersion: batch/v1
kind: Job
spec:
  activeDeadlineSeconds: 1800  # 30 minutes
  template:
    spec:
      containers:
        - name: migrations
          command:
            - sh
            - -c
            - npm run migration:run || exit 1
```

## Migration Checklist

Before running migrations in production:

- [ ] Test migration locally
- [ ] Verify down() method works
- [ ] Check migration is idempotent (can run multiple times safely)
- [ ] Backup database before running
- [ ] Run during maintenance window if adding indexes to large tables
- [ ] Monitor query performance
- [ ] Have rollback plan ready
- [ ] Verify data integrity after migration
- [ ] Update documentation

## Environment-Specific Configurations

### Local Development

```bash
# .env.local
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=applyforus_auth
DB_SSL=false
```

### Staging

```bash
# .env.staging
DB_HOST=applyforus-staging-postgres.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=stagingadmin
DB_DATABASE=applyforus_auth
DB_SSL=true
```

### Production

```bash
# Set via Kubernetes secrets/configmaps
DB_HOST=applyforus-postgres.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=<from-secret>
DB_PASSWORD=<from-secret>
DB_DATABASE=<from-configmap>
DB_SSL=true
```

## Quick Reference Commands

```bash
# Check migration status
npm run typeorm migration:show -d src/config/data-source.ts

# Generate migration from entity changes
npm run migration:generate -- src/migrations/MigrationName

# Create empty migration
npm run typeorm migration:create src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# View TypeORM help
npm run typeorm -- --help
```

## Kubernetes Migration Job Pattern

For any service, you can create a migration job:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: SERVICE-migrations
  namespace: applyforus
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrations
          image: applyforusacr.azurecr.io/applyai-SERVICE:latest
          env:
            - name: DB_HOST
              value: "applyforus-postgres.postgres.database.azure.com"
            - name: DB_PORT
              value: "5432"
            - name: DB_DATABASE
              value: "applyforus_SERVICE"
            - name: DB_SSL
              value: "true"
            - name: DB_USERNAME
              valueFrom:
                secretKeyRef:
                  name: applyforus-secrets
                  key: DB_USERNAME
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: applyforus-secrets
                  key: DB_PASSWORD
          command:
            - npm
            - run
            - migration:run
```

Apply with:
```bash
kubectl apply -f migration-job.yaml
kubectl wait --for=condition=complete job/SERVICE-migrations -n applyforus
kubectl logs job/SERVICE-migrations -n applyforus
```

## Additional Resources

- TypeORM Migrations: https://typeorm.io/migrations
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Kubernetes Jobs: https://kubernetes.io/docs/concepts/workloads/controllers/job/
