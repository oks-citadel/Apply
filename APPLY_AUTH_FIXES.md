# Quick Guide: Apply Auth + Data Integrity Fixes

## Prerequisites

- Azure PostgreSQL server running: `applyforus-postgres.postgres.database.azure.com`
- Kubernetes cluster configured with `applyforus` namespace
- `applyforus-secrets` secret created with required keys
- Docker access to `applyforusacr.azurecr.io`

## Step 1: Apply Code Changes (5 minutes)

### Auth Service Configuration

Edit `services/auth-service/src/config/configuration.ts`:
```typescript
// Line 16 - Change:
database: process.env.DB_NAME || 'applyforus_auth',

// To:
database: process.env.DB_DATABASE || 'applyforus_auth',
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

Edit `services/auth-service/src/config/typeorm.config.ts`:
```typescript
// Line 14 - Change:
database: process.env.DB_NAME || 'applyforus',

// To:
database: process.env.DB_DATABASE || 'applyforus_auth',
```

Edit `services/auth-service/src/config/data-source.ts`:
```typescript
// Line 11 - Change port:
port: parseInt(process.env.DB_PORT || '5434', 10),

// To:
port: parseInt(process.env.DB_PORT || '5432', 10),

// Line 14 - Change database:
database: process.env.DB_DATABASE || 'applyforus',

// To:
database: process.env.DB_DATABASE || 'applyforus_auth',

// After line 19 - Add SSL:
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

### User Service Data Source

Edit `services/user-service/src/config/data-source.ts`:
```typescript
// Line 15 - Change port:
port: parseInt(process.env.DB_PORT || '5434', 10),

// To:
port: parseInt(process.env.DB_PORT || '5432', 10),

// Line 18 - Change database:
database: process.env.DB_DATABASE || 'applyforus',

// To:
database: process.env.DB_DATABASE || 'applyforus_user',

// After line 27 - Add SSL:
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

### Job Service Data Source

Edit `services/job-service/src/config/data-source.ts`:
```typescript
// Line 18 - Change port:
port: parseInt(process.env.DB_PORT || '5434', 10),

// To:
port: parseInt(process.env.DB_PORT || '5432', 10),

// Line 21 - Change database:
database: process.env.DB_DATABASE || 'applyforus',

// To:
database: process.env.DB_DATABASE || 'applyforus_job',

// After line 27 - Add SSL:
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

### Analytics Service Data Source

Edit `services/analytics-service/src/config/data-source.ts`:
```typescript
// Line 14 - Change port:
port: parseInt(process.env.DB_PORT || '5434', 10),

// To:
port: parseInt(process.env.DB_PORT || '5432', 10),

// Line 17 - Change database:
database: process.env.DB_DATABASE || 'applyforus',

// To:
database: process.env.DB_DATABASE || 'applyforus_analytics',

// After line 28 - Add SSL:
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

### Notification Service Data Source

Edit `services/notification-service/src/config/data-source.ts`:
```typescript
// Line 12 - Change port:
port: parseInt(process.env.DB_PORT || '5434', 10),

// To:
port: parseInt(process.env.DB_PORT || '5432', 10),

// Line 15 - Change database:
database: process.env.DB_DATABASE || 'applyforus',

// To:
database: process.env.DB_DATABASE || 'applyforus_notification',

// After line 20 - Add SSL:
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

### Auto-Apply Service Data Source

Edit `services/auto-apply-service/src/config/data-source.ts`:
```typescript
// Line 12 - Change port:
port: parseInt(process.env.DB_PORT || '5434', 10),

// To:
port: parseInt(process.env.DB_PORT || '5432', 10),

// Line 15 - Change database:
database: process.env.DB_DATABASE || 'applyforus',

// To:
database: process.env.DB_DATABASE || 'applyforus_autoapply',

// After line 20 - Add SSL:
ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
```

## Step 2: Verify New Files Created (2 minutes)

Confirm these files exist:
- `services/auth-service/src/migrations/1733200000000-InitialSchema.ts` ✓
- `services/auth-service/src/migrations/1733210000000-SeedRolesAndPermissions.ts` ✓
- `infrastructure/kubernetes/base/database-config.yaml` ✓
- `infrastructure/kubernetes/jobs/db-init-job.yaml` ✓
- `infrastructure/kubernetes/production/auth-service-deployment-updated.yaml` ✓
- `infrastructure/kubernetes/production/user-service-deployment-updated.yaml` ✓
- `infrastructure/kubernetes/production/job-service-deployment-updated.yaml` ✓

## Step 3: Build and Push Images (10 minutes)

```bash
# From project root
cd C:/Users/kogun/OneDrive/Documents/Job-Apply-Platform

# Build auth service
docker build -t applyforusacr.azurecr.io/applyai-auth-service:latest -f services/auth-service/Dockerfile services/auth-service
docker push applyforusacr.azurecr.io/applyai-auth-service:latest

# Build user service
docker build -t applyforusacr.azurecr.io/applyai-user-service:latest -f services/user-service/Dockerfile services/user-service
docker push applyforusacr.azurecr.io/applyai-user-service:latest

# Build job service
docker build -t applyforusacr.azurecr.io/applyai-job-service:latest -f services/job-service/Dockerfile services/job-service
docker push applyforusacr.azurecr.io/applyai-job-service:latest
```

## Step 4: Deploy to Kubernetes (5 minutes)

```bash
# 1. Apply database configuration
kubectl apply -f infrastructure/kubernetes/base/database-config.yaml

# 2. Run database initialization
kubectl apply -f infrastructure/kubernetes/jobs/db-init-job.yaml

# 3. Wait for database creation (max 5 minutes)
kubectl wait --for=condition=complete --timeout=300s job/database-init -n applyforus

# 4. Check database creation logs
kubectl logs job/database-init -n applyforus

# 5. Wait for migrations (max 10 minutes)
kubectl wait --for=condition=complete --timeout=600s job/database-migrations -n applyforus

# 6. Check migration logs
kubectl logs job/database-migrations -n applyforus -c auth-migrations
kubectl logs job/database-migrations -n applyforus -c user-migrations
kubectl logs job/database-migrations -n applyforus -c job-migrations

# 7. Deploy services
kubectl apply -f infrastructure/kubernetes/production/auth-service-deployment-updated.yaml
kubectl apply -f infrastructure/kubernetes/production/user-service-deployment-updated.yaml
kubectl apply -f infrastructure/kubernetes/production/job-service-deployment-updated.yaml

# 8. Monitor rollout
kubectl rollout status deployment/auth-service -n applyforus
kubectl rollout status deployment/user-service -n applyforus
kubectl rollout status deployment/job-service -n applyforus
```

## Step 5: Verify Deployment (5 minutes)

```bash
# 1. Check all pods running
kubectl get pods -n applyforus

# Expected output:
# auth-service-xxxxx-xxxxx      1/1     Running   0          2m
# user-service-xxxxx-xxxxx      1/1     Running   0          2m
# job-service-xxxxx-xxxxx       1/1     Running   0          2m

# 2. Check for errors in logs
kubectl logs -f deployment/auth-service -n applyforus --tail=50
# Look for: "Database connected successfully" or similar

# 3. Test health endpoint
kubectl port-forward svc/auth-service 4000:4000 -n applyforus &
curl http://localhost:4000/health

# Expected: {"status":"ok"} or similar

# 4. Test user registration
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User"
  }'

# Expected: 201 Created with user object

# 5. Test user login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'

# Expected: 200 OK with accessToken and refreshToken
```

## Step 6: Database Verification (3 minutes)

```bash
# Connect to auth database
psql -h applyforus-postgres.postgres.database.azure.com \
     -U applyforusadmin \
     -d applyforus_auth \
     --set=sslmode=require

# Run these SQL commands:

# 1. List tables
\dt

# Expected tables:
# - users
# - ai_generations
# - roles
# - migrations

# 2. Check user count
SELECT COUNT(*) FROM users;

# Expected: At least 2 (admin + test user)

# 3. Verify admin user
SELECT email, role, status FROM users WHERE role = 'admin';

# Expected: admin@applyforus.com

# 4. Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE tablename = 'users';

# Expected: All IDX_USERS_* indexes

# 5. Exit
\q
```

## Troubleshooting

### Problem: Database Init Job Fails

```bash
# Check job logs
kubectl logs job/database-init -n applyforus

# Common issues:
# - Wrong database credentials → Check applyforus-secrets
# - Network connectivity → Verify firewall rules
# - SSL not configured → Ensure PGSSLMODE=require

# Fix: Delete and recreate job
kubectl delete job database-init -n applyforus
kubectl apply -f infrastructure/kubernetes/jobs/db-init-job.yaml
```

### Problem: Migration Job Fails

```bash
# Check specific migration logs
kubectl logs job/database-migrations -n applyforus -c auth-migrations

# Common issues:
# - Tables already exist → Check if migration already ran
# - Connection timeout → Increase timeout in job spec
# - Missing database → Ensure database-init completed

# Fix: Delete migration job and rerun
kubectl delete job database-migrations -n applyforus
# Edit job to skip failed migration or fix issue
kubectl apply -f infrastructure/kubernetes/jobs/db-init-job.yaml
```

### Problem: Pod CrashLoopBackOff

```bash
# Check pod logs
kubectl logs deployment/auth-service -n applyforus

# Check previous container logs
kubectl logs deployment/auth-service -n applyforus --previous

# Common issues:
# - DB_DATABASE not set → Check deployment env vars
# - SSL connection failed → Verify DB_SSL=true
# - Wrong database name → Check ConfigMap

# Fix: Update deployment
kubectl set env deployment/auth-service \
  DB_DATABASE=applyforus_auth \
  DB_SSL=true \
  -n applyforus
```

### Problem: Cannot Connect to Database

```bash
# Test from within cluster
kubectl run -it --rm debug \
  --image=postgres:15-alpine \
  --restart=Never \
  -n applyforus \
  -- psql -h applyforus-postgres.postgres.database.azure.com \
         -U applyforusadmin \
         -d applyforus_auth \
         --set=sslmode=require

# If this fails:
# - Check Azure PostgreSQL firewall rules
# - Verify credentials in secret
# - Ensure SSL is configured
```

## Rollback

If something goes wrong:

```bash
# 1. Rollback deployments
kubectl rollout undo deployment/auth-service -n applyforus
kubectl rollout undo deployment/user-service -n applyforus
kubectl rollout undo deployment/job-service -n applyforus

# 2. Delete jobs
kubectl delete job database-init database-migrations -n applyforus

# 3. Check status
kubectl get pods -n applyforus
```

## Success Criteria

You've successfully applied the fixes when:

- ✓ All pods show status: Running
- ✓ Health endpoints return 200 OK
- ✓ User registration works
- ✓ User login returns valid JWT tokens
- ✓ Database tables exist in correct databases
- ✓ SSL connections are active
- ✓ No "database does not exist" errors in logs
- ✓ Admin user can login (admin@applyforus.com / Admin@123456)

## Next Steps

After successful deployment:

1. Change admin password immediately
2. Set up monitoring for auth endpoints
3. Configure automated backups
4. Test OAuth providers (Google, LinkedIn, GitHub)
5. Enable MFA for admin accounts
6. Review and adjust rate limiting
7. Set up audit logging

## Support

For detailed information, see:
- `AUTH_DATA_INTEGRITY_SUMMARY.md` - Complete overview
- `ops/docs/AUTH_DATA_INTEGRITY_VERIFICATION.md` - Full checklist

## Estimated Total Time

- Code changes: 5 minutes
- Build & push: 10 minutes
- Deployment: 5 minutes
- Verification: 5 minutes
- **Total: ~25 minutes**
