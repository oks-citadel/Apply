# Package Updates for ApplyforUs Rebranding

This document details all package.json file updates required for the rebranding from JobPilot to ApplyforUs.

---

## Summary

- **Total package.json files:** 13
- **Root package:** 1
- **Application packages:** 4
- **Service packages:** 8
- **Shared library packages:** Multiple (in packages/ directory)

---

## 1. Root Package

### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\package.json`

#### Current Content:
```json
{
  "name": "jobpilot-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ]
}
```

#### Updated Content:
```json
{
  "name": "applyforus-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ]
}
```

#### Changes:
- ✓ Package name: `jobpilot-platform` → `applyforus-platform`

---

## 2. Application Packages

### 2.1 Web Application

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\web\package.json`

#### Current Content (Excerpt):
```json
{
  "name": "@jobpilot/web",
  "version": "1.0.0",
  "private": true
}
```

#### Updated Content:
```json
{
  "name": "@applyforus/web",
  "version": "1.0.0",
  "private": true
}
```

#### Changes:
- ✓ Package name: `@jobpilot/web` → `@applyforus/web`

---

### 2.2 Admin Dashboard

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\admin\package.json`

#### Current Content (Excerpt):
```json
{
  "name": "@jobpilot/admin",
  "version": "1.0.0",
  "private": true,
  "description": "JobPilot Admin Dashboard"
}
```

#### Updated Content:
```json
{
  "name": "@applyforus/admin",
  "version": "1.0.0",
  "private": true,
  "description": "ApplyforUs Admin Dashboard"
}
```

#### Changes:
- ✓ Package name: `@jobpilot/admin` → `@applyforus/admin`
- ✓ Description: `JobPilot Admin Dashboard` → `ApplyforUs Admin Dashboard`

---

### 2.3 Mobile Application

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\mobile\package.json`

#### Current Content (Excerpt):
```json
{
  "name": "@jobpilot/mobile",
  "version": "1.0.0",
  "description": "JobPilot AI Platform Mobile Application",
  "main": "index.js"
}
```

#### Updated Content:
```json
{
  "name": "@applyforus/mobile",
  "version": "1.0.0",
  "description": "ApplyforUs AI Platform Mobile Application",
  "main": "index.js"
}
```

#### Changes:
- ✓ Package name: `@jobpilot/mobile` → `@applyforus/mobile`
- ✓ Description: `JobPilot AI Platform Mobile Application` → `ApplyforUs AI Platform Mobile Application`

---

### 2.4 Browser Extension

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\extension\package.json`

#### Current Content (Excerpt):
```json
{
  "name": "@job-apply-platform/extension",
  "version": "1.0.0",
  "description": "JobPilot AI - Chrome Extension for automated job applications"
}
```

#### Updated Content:
```json
{
  "name": "@applyforus/extension",
  "version": "1.0.0",
  "description": "ApplyforUs AI - Chrome Extension for automated job applications"
}
```

#### Changes:
- ✓ Package name: `@job-apply-platform/extension` → `@applyforus/extension`
- ✓ Description: `JobPilot AI - Chrome Extension` → `ApplyforUs AI - Chrome Extension`

---

## 3. Service Packages

### 3.1 Auth Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\auth-service\package.json`

#### Current Content (Excerpt):
```json
{
  "name": "jobpilot-auth-service",
  "version": "1.0.0",
  "description": "Authentication and Authorization Service for JobPilot AI Platform",
  "author": "JobPilot Team",
  "private": true,
  "license": "MIT",
  "dependencies": {
    "@jobpilot/telemetry": "workspace:*",
    "@jobpilot/logging": "workspace:*",
    "@jobpilot/security": "workspace:*"
  }
}
```

#### Updated Content:
```json
{
  "name": "applyforus-auth-service",
  "version": "1.0.0",
  "description": "Authentication and Authorization Service for ApplyforUs AI Platform",
  "author": "ApplyforUs Team",
  "private": true,
  "license": "MIT",
  "dependencies": {
    "@applyforus/telemetry": "workspace:*",
    "@applyforus/logging": "workspace:*",
    "@applyforus/security": "workspace:*"
  }
}
```

#### Changes:
- ✓ Package name: `jobpilot-auth-service` → `applyforus-auth-service`
- ✓ Description: `JobPilot AI Platform` → `ApplyforUs AI Platform`
- ✓ Author: `JobPilot Team` → `ApplyforUs Team`
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

### 3.2 User Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\user-service\package.json`

#### Current Content (Excerpt):
```json
{
  "name": "jobpilot-user-service",
  "version": "1.0.0",
  "description": "User Management Service for JobPilot AI Platform",
  "author": "JobPilot Team",
  "dependencies": {
    "@jobpilot/telemetry": "workspace:*",
    "@jobpilot/logging": "workspace:*",
    "@jobpilot/security": "workspace:*"
  }
}
```

#### Updated Content:
```json
{
  "name": "applyforus-user-service",
  "version": "1.0.0",
  "description": "User Management Service for ApplyforUs AI Platform",
  "author": "ApplyforUs Team",
  "dependencies": {
    "@applyforus/telemetry": "workspace:*",
    "@applyforus/logging": "workspace:*",
    "@applyforus/security": "workspace:*"
  }
}
```

#### Changes:
- ✓ Package name: `jobpilot-user-service` → `applyforus-user-service`
- ✓ Description: `JobPilot AI Platform` → `ApplyforUs AI Platform`
- ✓ Author: `JobPilot Team` → `ApplyforUs Team`
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

### 3.3 Job Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\job-service\package.json`

#### Changes (Same pattern):
- ✓ Package name: `jobpilot-job-service` → `applyforus-job-service`
- ✓ Description: Update platform name
- ✓ Author: Update team name
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

### 3.4 Resume Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\resume-service\package.json`

#### Changes (Same pattern):
- ✓ Package name: `jobpilot-resume-service` → `applyforus-resume-service`
- ✓ Description: Update platform name
- ✓ Author: Update team name
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

### 3.5 Auto-Apply Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\auto-apply-service\package.json`

#### Changes (Same pattern):
- ✓ Package name: `jobpilot-auto-apply-service` → `applyforus-auto-apply-service`
- ✓ Description: Update platform name
- ✓ Author: Update team name
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

### 3.6 Analytics Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\analytics-service\package.json`

#### Changes (Same pattern):
- ✓ Package name: `jobpilot-analytics-service` → `applyforus-analytics-service`
- ✓ Description: Update platform name
- ✓ Author: Update team name
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

### 3.7 Notification Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\notification-service\package.json`

#### Changes (Same pattern):
- ✓ Package name: `jobpilot-notification-service` → `applyforus-notification-service`
- ✓ Description: Update platform name
- ✓ Author: Update team name
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

### 3.8 Orchestrator Service

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\orchestrator-service\package.json`

#### Changes (Same pattern):
- ✓ Package name: `jobpilot-orchestrator-service` → `applyforus-orchestrator-service`
- ✓ Description: Update platform name
- ✓ Author: Update team name
- ✓ Dependencies: `@jobpilot/*` → `@applyforus/*`

---

## 4. Shared Library Packages

### 4.1 Telemetry Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\telemetry\package.json`

#### Current:
```json
{
  "name": "@jobpilot/telemetry"
}
```

#### Updated:
```json
{
  "name": "@applyforus/telemetry"
}
```

---

### 4.2 Logging Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\logging\package.json`

#### Changes:
- ✓ Package name: `@jobpilot/logging` → `@applyforus/logging`

---

### 4.3 Security Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\security\package.json`

#### Changes:
- ✓ Package name: `@jobpilot/security` → `@applyforus/security`

---

### 4.4 Types Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\types\package.json`

#### Changes:
- ✓ Package name: `@jobpilot/types` → `@applyforus/types`

---

### 4.5 Utils Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\utils\package.json`

#### Changes:
- ✓ Package name: `@jobpilot/utils` → `@applyforus/utils`

---

### 4.6 UI Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\ui\package.json`

#### Changes:
- ✓ Package name: `@jobpilot/ui` → `@applyforus/ui`

---

### 4.7 Config Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\config\package.json`

#### Changes:
- ✓ Package name: `@jobpilot/config` → `@applyforus/config`

---

### 4.8 Feature Flags Package

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\packages\feature-flags\package.json`

#### Changes:
- ✓ Package name: `@jobpilot/feature-flags` → `@applyforus/feature-flags`

---

## 5. Update Strategy

### Phase 1: Update Shared Libraries First
1. Update all packages in `packages/` directory
2. This ensures dependencies are available when services are updated

### Phase 2: Update Services
1. Update all service package.json files
2. Update their dependencies to reference `@applyforus/*`

### Phase 3: Update Applications
1. Update all application package.json files
2. Update their dependencies to reference `@applyforus/*`

### Phase 4: Update Root Package
1. Update root package.json
2. This is largely independent but should be done last

---

## 6. Post-Update Actions

### 6.1 Clear and Reinstall Dependencies
```bash
# Remove all node_modules and lock files
find . -name "node_modules" -type d -prune -exec rm -rf {} +
find . -name "pnpm-lock.yaml" -delete

# Reinstall dependencies
pnpm install
```

### 6.2 Verify Workspace Resolution
```bash
# Check workspace dependencies are correctly resolved
pnpm list --depth 0
pnpm list @applyforus/telemetry
pnpm list @applyforus/logging
pnpm list @applyforus/security
```

### 6.3 Update Import Statements
After package renames, update all import statements in code:

```typescript
// OLD
import { Logger } from '@jobpilot/logging';
import { SecurityGuard } from '@jobpilot/security';

// NEW
import { Logger } from '@applyforus/logging';
import { SecurityGuard } from '@applyforus/security';
```

### 6.4 Build Test
```bash
# Test builds across all workspaces
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

---

## 7. Dependency Update Summary

### Workspace Dependencies to Update

All internal workspace dependencies need updating:

```json
// OLD
"dependencies": {
  "@jobpilot/telemetry": "workspace:*",
  "@jobpilot/logging": "workspace:*",
  "@jobpilot/security": "workspace:*",
  "@jobpilot/types": "workspace:*",
  "@jobpilot/utils": "workspace:*"
}

// NEW
"dependencies": {
  "@applyforus/telemetry": "workspace:*",
  "@applyforus/logging": "workspace:*",
  "@applyforus/security": "workspace:*",
  "@applyforus/types": "workspace:*",
  "@applyforus/utils": "workspace:*"
}
```

---

## 8. Package.json Fields to Update

For each package.json, check and update these fields:

- ✓ `name` - Package name
- ✓ `description` - Package description (if contains JobPilot)
- ✓ `author` - Author name (if contains JobPilot Team)
- ✓ `homepage` - Homepage URL (if contains jobpilot domain)
- ✓ `repository` - Repository URL (if contains JobPilot)
- ✓ `bugs` - Bug tracker URL (if contains jobpilot domain)
- ✓ `dependencies` - All `@jobpilot/*` dependencies
- ✓ `devDependencies` - All `@jobpilot/*` devDependencies
- ✓ `peerDependencies` - All `@jobpilot/*` peerDependencies (if any)

---

## 9. Automated Update Script

```bash
#!/bin/bash
# update-package-names.sh

# Update package names in all package.json files
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i 's/@jobpilot\//@applyforus\//g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i 's/"jobpilot-/"applyforus-/g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i 's/"@job-apply-platform\//"@applyforus\//g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i 's/JobPilot/ApplyforUs/g' {} \;
find . -name "package.json" -not -path "*/node_modules/*" -exec sed -i 's/JobPilot Team/ApplyforUs Team/g' {} \;

echo "Package names updated successfully!"
```

---

## 10. Verification Checklist

After updating all package.json files:

- [ ] All package names follow new convention
- [ ] All descriptions updated
- [ ] All author fields updated
- [ ] All workspace dependencies use `@applyforus/*`
- [ ] No references to `@jobpilot/*` remain
- [ ] No references to `jobpilot-*` remain
- [ ] pnpm install runs successfully
- [ ] All builds complete successfully
- [ ] Type checking passes
- [ ] Tests run successfully

---

## 11. Rollback Plan

If issues occur, rollback using:

```bash
# Restore from git
git checkout -- "**package.json"

# Or restore from backup
cp -r package.json.backup/* .
```

---

## 12. Complete Package List

| Current Name | New Name | Type |
|--------------|----------|------|
| `jobpilot-platform` | `applyforus-platform` | Root |
| `@jobpilot/web` | `@applyforus/web` | App |
| `@jobpilot/admin` | `@applyforus/admin` | App |
| `@jobpilot/mobile` | `@applyforus/mobile` | App |
| `@job-apply-platform/extension` | `@applyforus/extension` | App |
| `jobpilot-auth-service` | `applyforus-auth-service` | Service |
| `jobpilot-user-service` | `applyforus-user-service` | Service |
| `jobpilot-job-service` | `applyforus-job-service` | Service |
| `jobpilot-resume-service` | `applyforus-resume-service` | Service |
| `jobpilot-auto-apply-service` | `applyforus-auto-apply-service` | Service |
| `jobpilot-analytics-service` | `applyforus-analytics-service` | Service |
| `jobpilot-notification-service` | `applyforus-notification-service` | Service |
| `jobpilot-orchestrator-service` | `applyforus-orchestrator-service` | Service |
| `@jobpilot/telemetry` | `@applyforus/telemetry` | Package |
| `@jobpilot/logging` | `@applyforus/logging` | Package |
| `@jobpilot/security` | `@applyforus/security` | Package |
| `@jobpilot/types` | `@applyforus/types` | Package |
| `@jobpilot/utils` | `@applyforus/utils` | Package |
| `@jobpilot/ui` | `@applyforus/ui` | Package |
| `@jobpilot/config` | `@applyforus/config` | Package |
| `@jobpilot/feature-flags` | `@applyforus/feature-flags` | Package |

---

**Generated:** 2025-12-08
**Status:** Ready for execution
**Priority:** HIGH - Must be done before Docker/K8s updates
