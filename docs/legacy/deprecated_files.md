# Deprecated Files and Assets for Removal

This document lists all files that should be removed or archived after the ApplyforUs rebranding is complete.

---

## 1. Documentation Files with Old Branding

### Files to Archive (Move to archive/ directory first):

#### API Documentation
- `docs/api/JobPilot-API.postman_collection.json` → **Rename to:** `ApplyforUs-API.postman_collection.json`

#### Summary Files (Review and update, don't delete)
- `CICD_IMPLEMENTATION_SUMMARY.md` - Update branding
- `SECURITY_CHANGES_SUMMARY.md` - Update branding
- `PERFORMANCE_SUMMARY.md` - Update branding
- `LOGGING_IMPLEMENTATION_SUMMARY.md` - Update branding
- `FEATURE_FLAGS_IMPLEMENTATION_SUMMARY.md` - Update branding
- `ALERTING_IMPLEMENTATION_COMPLETE.md` - Update branding

---

## 2. Generated/Temporary Files (Safe to Delete)

### Build Artifacts
```
dist/
build/
.next/
out/
coverage/
.nyc_output/
```

### Dependency Files
```
node_modules/
.pnpm-store/
```

### Cache Files
```
.cache/
.turbo/
.eslintcache
.vscode/.ropeproject
**/__pycache__/
**/*.pyc
**/*.pyo
**/*.pyd
.Python
```

### Log Files
```
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
```

### OS Files
```
.DS_Store
Thumbs.db
desktop.ini
```

---

## 3. Old Environment Files (After Migration)

### Files to Review and Remove:
```
services/*/\.env (after backing up and recreating)
apps/*/\.env.local (after backing up)
.env (root level, after recreation)
```

**Action:**
1. Backup all .env files to a secure location
2. After migration, create new .env files with updated values
3. Delete old backups after verification

---

## 4. Old Docker Resources (After Migration Complete)

### Commands to Clean Up:
```bash
# Remove old containers
docker ps -a --filter name=jobpilot --format "{{.ID}}" | xargs docker rm -f

# Remove old images
docker images --filter=reference='jobpilot/*' --format "{{.ID}}" | xargs docker rmi -f
docker images --filter=reference='*jobpilot*' --format "{{.ID}}" | xargs docker rmi -f

# Remove old volumes (CAUTION: This deletes data!)
docker volume ls --filter name=jobpilot --format "{{.Name}}" | xargs docker volume rm

# Remove old networks
docker network ls --filter name=jobpilot --format "{{.ID}}" | xargs docker network rm
```

---

## 5. Old Documentation Files

### Files That May No Longer Be Relevant:

#### Temporary Implementation Notes
```
LOGGING_CHANGES_SUMMARY.txt
ENV_FILES_CREATED.txt
PACKAGE_UPDATES_NEEDED.md
```

**Action:** Review content and incorporate into official docs, then delete

#### Old Architecture Diagrams
- Any diagrams with "JobPilot" branding should be updated or archived

---

## 6. Script Files to Update or Remove

### Python Scripts with Hardcoded Paths
```
fix_services.py - Update paths or remove if no longer needed
fix_k8s_manifests.py - Update paths or remove if no longer needed
```

**Action:** Update with new paths or remove if scripts were one-time use

---

## 7. Test Files and Fixtures

### Files Containing Old Test Data:
```
services/*/test/fixtures/*jobpilot*.json
apps/*/src/__tests__/fixtures/*jobpilot*.json
```

**Action:** Update test fixtures with new branding

---

## 8. Old Kubernetes Resources (After Migration)

### Commands to Clean Up:
```bash
# Delete old namespace (after confirming new namespace works)
kubectl delete namespace jobpilot

# This will automatically delete:
# - All pods in the namespace
# - All services
# - All deployments
# - All configmaps
# - All secrets
# - All persistent volume claims
```

**CAUTION:** Only run after successful migration and verification period!

---

## 9. Old Azure Resources (After Migration)

### Resources to Delete (Terraform or Azure CLI):

#### Resource Groups
```bash
az group delete --name jobpilot-dev-rg --yes --no-wait
az group delete --name jobpilot-staging-rg --yes --no-wait
# Keep jobpilot-prod-rg until confident in migration
```

#### AKS Clusters
```bash
az aks delete --name jobpilot-dev-aks --resource-group jobpilot-dev-rg --yes --no-wait
az aks delete --name jobpilot-staging-aks --resource-group jobpilot-staging-rg --yes --no-wait
```

#### Storage Accounts
```bash
az storage account delete --name jobpilotstorage --resource-group jobpilot-shared-rg --yes
```

#### Container Registries
```bash
# Only if creating a new ACR instead of renaming
az acr delete --name jobpilotacr --resource-group jobpilot-shared-rg --yes
```

**Note:** Renaming is often not possible for many Azure resources. You'll need to create new resources and migrate data.

---

## 10. Old Git Branches (Optional Cleanup)

### After Migration is Complete:
```bash
# Delete feature branches related to old branding
git branch -D feature/jobpilot-*
git push origin --delete feature/jobpilot-*

# Delete old tags if any
git tag -d jobpilot-v1.0.0
git push origin --delete jobpilot-v1.0.0
```

---

## 11. Backup Files Created During Migration

### After Successful Migration:
```
**/*.backup
**/*.bak
**/*.old
**/*.orig
```

**Action:** Keep for 30 days, then delete

---

## 12. CI/CD Artifacts

### Old Pipeline Runs
- Archive or delete old Azure DevOps pipeline runs
- Archive or delete old GitHub Actions workflow runs (automatic after retention period)

### Old Container Images
```bash
# Azure Container Registry
az acr repository list --name jobpilotacr --output table
az acr repository delete --name jobpilotacr --repository jobpilot/* --yes

# Docker Hub
docker hub rm jobpilot/service-name
```

---

## 13. Monitoring Data

### Old Metrics and Logs
- Old Prometheus data (will be retained based on retention policy)
- Old Grafana dashboards with "JobPilot" in title
- Old log files in centralized logging (will be retained based on policy)

**Action:**
- Export important metrics before cleanup
- Update dashboard names
- No need to delete logs (historical data)

---

## 14. DNS Records (After Migration)

### Old DNS Entries to Remove:
```
jobpilot.ai
*.jobpilot.ai
api.jobpilot.ai
docs.jobpilot.ai
status.jobpilot.ai
```

**Action:**
1. Set up redirects from old domains to new domains
2. Keep redirects active for 6-12 months
3. Then let old domains expire

---

## 15. SSL Certificates

### Old Certificates to Remove:
- Let's Encrypt certificates for *.jobpilot.ai
- Let's Encrypt certificates for *.jobpilot.com

**Action:** Allow to expire naturally after DNS migration

---

## 16. Email Accounts

### Old Email Addresses:
```
support@jobpilot.ai
dev@jobpilot.ai
ops@jobpilot.ai
security@jobpilot.ai
```

**Action:**
1. Set up email forwarding to new addresses
2. Keep forwarding active for 12 months
3. Update all registrations to use new emails
4. Then close old email accounts

---

## 17. Third-Party Service Configurations

### Services to Update/Remove:

#### Monitoring & Alerting
- PagerDuty: Update integration keys
- Datadog: Update service names
- New Relic: Update application names

#### Email Services
- SendGrid: Update sender domains
- Mailgun: Update sending domains

#### Analytics
- Google Analytics: Set up new properties
- Mixpanel: Update project name

#### Error Tracking
- Sentry: Update project names
- Rollbar: Update project names

---

## 18. Documentation Sites

### Old Documentation:
- docs.jobpilot.ai - Redirect to docs.applyforus.com
- status.jobpilot.ai - Redirect to status.applyforus.com

**Action:** Set up 301 redirects, maintain for 12 months

---

## 19. Social Media and Marketing

### Old Social Media Handles (If Any):
- Twitter: @jobpilot
- LinkedIn: /company/jobpilot
- GitHub: github.com/jobpilot

**Action:**
- Rebrand or redirect to new handles
- Update all links in documentation

---

## 20. Legal and Compliance

### Documents to Update:
- Privacy Policy (update company name)
- Terms of Service (update company name)
- Cookie Policy (update domain names)
- GDPR compliance documents

---

## File Removal Script

### Safe Cleanup Script

#### File: `scripts/cleanup-old-branding.sh`
```bash
#!/bin/bash

echo "🧹 ApplyforUs Cleanup Script"
echo "Removing deprecated files and artifacts..."
echo ""

# Create backup directory
BACKUP_DIR="backups/pre-cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup before deletion
echo "📦 Creating backups..."
cp -r .env* "$BACKUP_DIR/" 2>/dev/null || true
cp -r *.backup "$BACKUP_DIR/" 2>/dev/null || true

# Remove build artifacts
echo "🗑️  Removing build artifacts..."
rm -rf dist/
rm -rf build/
rm -rf .next/
rm -rf out/
rm -rf coverage/
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove cache files
echo "🗑️  Removing cache files..."
rm -rf .cache/
rm -rf .turbo/
rm -f .eslintcache
find . -name "__pycache__" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

# Remove log files
echo "🗑️  Removing log files..."
find . -name "*.log" -delete 2>/dev/null || true

# Remove OS files
echo "🗑️  Removing OS files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true

# Remove backup files (older than 30 days)
echo "🗑️  Removing old backup files..."
find . -name "*.backup" -mtime +30 -delete 2>/dev/null || true
find . -name "*.bak" -mtime +30 -delete 2>/dev/null || true
find . -name "*.old" -mtime +30 -delete 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo "📦 Backups stored in: $BACKUP_DIR"
echo ""
echo "⚠️  Manual steps still required:"
echo "  - Clean up Docker resources (see deprecated_files.md)"
echo "  - Clean up Kubernetes resources (after migration)"
echo "  - Clean up Azure resources (after migration)"
echo "  - Update DNS records"
echo "  - Set up email forwarding"
```

---

## Cleanup Timeline

### Immediate (During Migration)
- [x] Remove build artifacts
- [x] Remove cache files
- [x] Remove log files
- [x] Remove OS files

### Post-Migration (Within 1 Week)
- [ ] Clean up Docker resources
- [ ] Update test fixtures
- [ ] Update documentation
- [ ] Archive old summary files

### Short-Term (Within 1 Month)
- [ ] Clean up old Kubernetes namespace (dev/staging)
- [ ] Clean up old Azure dev resources
- [ ] Remove old Git branches
- [ ] Update third-party integrations

### Medium-Term (Within 3 Months)
- [ ] Clean up production Kubernetes resources
- [ ] Clean up production Azure resources
- [ ] Remove old backup files
- [ ] Archive old monitoring data

### Long-Term (6-12 Months)
- [ ] Remove DNS redirects
- [ ] Close old email accounts
- [ ] Let old domains expire
- [ ] Let old SSL certificates expire

---

## Safety Checklist

Before deleting any resources:

- [ ] Confirm new resources are working
- [ ] Verify data has been migrated
- [ ] Ensure backups exist
- [ ] Document what was removed
- [ ] Notify team of cleanup
- [ ] Test rollback procedure (if needed)
- [ ] Monitor for 24-48 hours after cleanup

---

## Rollback Plan

If you need to restore after cleanup:

```bash
# Restore from backup
cp -r "$BACKUP_DIR"/* .

# Restore Docker resources
docker-compose -f docker-compose.backup.yml up -d

# Restore Kubernetes namespace
kubectl apply -f backup/kubernetes/

# Restore Azure resources (if using Terraform)
cd infrastructure/terraform
terraform apply -var-file="backup/terraform.tfvars"
```

---

## Archive Directory Structure

Create an archive for historical reference:

```
archive/
├── jobpilot-branding/
│   ├── documentation/
│   ├── marketing-assets/
│   ├── configurations/
│   └── README.md
├── migration-logs/
│   ├── 2025-12-08-migration-log.txt
│   └── verification-results.txt
└── backups/
    ├── pre-migration/
    └── post-migration/
```

---

**Generated:** 2025-12-08
**Status:** Reference guide for post-migration cleanup
**Priority:** LOW - Only after successful migration and verification
**Safety:** Always backup before deleting!
