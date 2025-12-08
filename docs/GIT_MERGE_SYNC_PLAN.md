# Git Merge and Sync Plan
## JobPilot AI Platform - Azure DevOps Integration

**Source:** `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform`
**Target:** `https://dev.azure.com/citadelcloudmanagement/_git/ApplyPlatform`
**Date:** December 2024

---

## 1. Current State Assessment

### Repository Status
```
Remote: origin → https://dev.azure.com/citadelcloudmanagement/_git/ApplyPlatform
Branches:
  - main (primary)
  - develop (active development)

Recent Commits:
  8ea1d17 Consolidate documentation and fix frontend TypeScript errors
  3c0e5c9 Add self-hosted agent support for Azure Pipelines
  669cb7a fix: Replace TerraformInstaller task with bash script
  61243b6 Initial commit: JobPilot AI Platform

Uncommitted Changes: 199 files
  - Modified: 71 files
  - Untracked: 128 files (new documentation, tests, features)
```

### Change Categories

| Category | Count | Description |
|----------|-------|-------------|
| Documentation | 35+ | New guides, READMEs, architecture docs |
| Service Updates | 25+ | NestJS service improvements |
| Infrastructure | 15+ | K8s, Terraform updates |
| Frontend Updates | 10+ | React/Next.js improvements |
| New Packages | 3 | feature-flags, telemetry updates |
| Tests | 10+ | New test files |
| CI/CD | 5+ | Workflow additions |

---

## 2. Pre-Sync Checklist

### Authentication Setup
```bash
# Option 1: Personal Access Token (PAT)
git config credential.helper store
git credential approve <<EOF
protocol=https
host=dev.azure.com
username=your-username
password=YOUR_PAT_TOKEN
EOF

# Option 2: Azure CLI Authentication
az login
az extension add --name azure-devops
az devops configure --defaults organization=https://dev.azure.com/citadelcloudmanagement project=ApplyPlatform
```

### Verify Clean State
```bash
# Check for unstaged changes
git status

# Verify branch structure
git branch -a

# Ensure we're on develop branch
git checkout develop
```

---

## 3. Sync Strategy

### Phase 1: Prepare Local Changes

```bash
# Step 1: Stash any work-in-progress
git stash push -m "WIP before Azure sync $(date +%Y%m%d)"

# Step 2: Fetch latest from origin
git fetch origin --all --prune

# Step 3: Update develop branch
git checkout develop
git pull origin develop --rebase

# Step 4: Update main branch
git checkout main
git pull origin main --rebase

# Step 5: Return to develop
git checkout develop
```

### Phase 2: Stage and Organize Changes

The 199 uncommitted changes should be organized into logical commits:

#### Commit 1: Infrastructure Updates
```bash
git add infrastructure/kubernetes/*.yaml
git add infrastructure/kubernetes/services/*.yaml
git add infrastructure/kubernetes/monitoring/*.yaml
git add infrastructure/terraform/**/*.tf
git commit -m "feat(infra): Update Kubernetes manifests and Terraform modules

- Update service deployments with health checks
- Add monitoring stack configuration
- Enhance network policies
- Update Terraform modules for AKS and security

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

#### Commit 2: Backend Service Enhancements
```bash
git add services/auth-service/
git add services/user-service/
git add services/job-service/
git add services/resume-service/
git add services/notification-service/
git add services/auto-apply-service/
git add services/analytics-service/
git add services/ai-service/
git add services/orchestrator-service/
git commit -m "feat(services): Enhance backend microservices

- Add TypeORM migrations for all services
- Implement health checks and telemetry
- Update app modules with proper dependency injection
- Add security enhancements and validation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

#### Commit 3: Frontend Updates
```bash
git add apps/web/
git commit -m "feat(web): Update Next.js frontend application

- Fix TypeScript errors and type safety
- Add new dashboard components
- Implement feature flag hooks
- Update testing configuration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

#### Commit 4: Shared Packages
```bash
git add packages/security/
git add packages/telemetry/
git add packages/feature-flags/
git commit -m "feat(packages): Update shared packages

- Enhance security package with CSRF protection
- Update telemetry with metrics and tracing
- Add feature flags package with TypeORM integration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

#### Commit 5: CI/CD Workflows
```bash
git add .github/workflows/
git commit -m "feat(ci): Add comprehensive CI/CD workflows

- Add integration tests workflow
- Add smoke tests workflow
- Add rollback workflow
- Update build and scan workflow

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

#### Commit 6: Documentation
```bash
git add docs/
git add README.md
git add CONTRIBUTING.md
git add *.md
git commit -m "docs: Add comprehensive platform documentation

- Add architecture documentation for 50 AI features
- Add feature roadmap with 4 release waves
- Add user stories with acceptance criteria
- Add E2E architecture gap analysis
- Add API documentation and Swagger guides
- Add deployment and monitoring guides

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### Phase 3: Push to Azure DevOps

```bash
# Push develop branch
git push origin develop

# If there are conflicts, resolve them:
git pull origin develop --rebase
# Resolve conflicts manually
git add .
git rebase --continue
git push origin develop
```

### Phase 4: Create Pull Request to Main

```bash
# Using Azure CLI
az repos pr create \
  --repository ApplyPlatform \
  --source-branch develop \
  --target-branch main \
  --title "Platform Enhancement: 50 AI Features Architecture & Infrastructure Updates" \
  --description "## Summary
- Infrastructure: Updated K8s manifests and Terraform modules
- Services: Enhanced all 10 microservices with migrations and telemetry
- Frontend: Fixed TypeScript errors and added new components
- Packages: Updated security, telemetry, and feature-flags
- CI/CD: Added integration, smoke, and rollback workflows
- Docs: Comprehensive documentation for 50 AI features

## Test Plan
- [ ] Run unit tests: \`pnpm test\`
- [ ] Run type checks: \`pnpm run type-check\`
- [ ] Build all services: \`pnpm run build\`
- [ ] Verify Docker images build
- [ ] Deploy to dev environment
- [ ] Run smoke tests

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## 4. Conflict Resolution Strategy

### Expected Conflicts
Based on the modified files, potential conflicts may occur in:

1. **CI/CD Workflows** - If Azure has different pipeline configurations
2. **README.md** - Multiple documentation updates
3. **package.json files** - Dependency version differences

### Resolution Priority
```
1. Keep newer dependency versions
2. Merge CI/CD workflows (combine steps if different)
3. Keep comprehensive documentation (larger is usually better)
4. Preserve infrastructure changes (critical for deployment)
```

### Conflict Resolution Commands
```bash
# View conflicts
git diff --name-only --diff-filter=U

# For each conflicted file:
# Option 1: Keep local version
git checkout --ours path/to/file

# Option 2: Keep remote version
git checkout --theirs path/to/file

# Option 3: Manual merge
code path/to/file  # Edit manually
git add path/to/file

# Continue after resolving
git rebase --continue
# or
git merge --continue
```

---

## 5. Post-Sync Verification

### Verification Checklist
```bash
# 1. Verify all branches are synced
git fetch origin
git branch -vv

# 2. Verify commit history
git log --oneline -20

# 3. Run tests
pnpm install
pnpm run type-check
pnpm run test

# 4. Build all services
pnpm run build

# 5. Verify Docker images
docker compose -f docker-compose.build.yml build

# 6. Check CI/CD status in Azure DevOps
az pipelines run --name "CI-Pipeline" --branch develop
```

### Azure DevOps Pipeline Verification
1. Navigate to: `https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_build`
2. Check latest pipeline run
3. Verify all stages pass:
   - Build & Validate
   - Unit Tests
   - Integration Tests
   - Build Docker Images
   - Deploy to Dev

---

## 6. Branch Protection Rules

### Recommended Settings for Azure DevOps

**Main Branch:**
```yaml
# Branch policies
- Require pull request reviews: 1 reviewer
- Check for linked work items: Optional
- Build validation: CI-Pipeline must pass
- Require status checks:
  - build
  - test
  - type-check
  - security-scan
```

**Develop Branch:**
```yaml
# Branch policies
- Require pull request reviews: Optional
- Build validation: CI-Pipeline must pass
- Allow direct pushes: For feature completion
```

### Configure via Azure CLI
```bash
# Get branch policy configuration
az repos policy list --repository ApplyPlatform --branch main

# Create build policy
az repos policy build create \
  --repository-id ApplyPlatform \
  --branch main \
  --build-definition-id <BUILD_DEFINITION_ID> \
  --enabled true \
  --blocking true \
  --display-name "CI Build Validation"

# Create reviewer policy
az repos policy approver-count create \
  --repository-id ApplyPlatform \
  --branch main \
  --minimum-approver-count 1 \
  --creator-vote-counts false \
  --enabled true \
  --blocking true
```

---

## 7. Rollback Procedures

### If Sync Causes Issues
```bash
# Option 1: Revert to previous commit
git revert HEAD
git push origin develop

# Option 2: Hard reset (destructive - use with caution)
git reset --hard <KNOWN_GOOD_COMMIT>
git push origin develop --force-with-lease

# Option 3: Create fix branch
git checkout -b fix/sync-issues
# Fix issues
git commit -m "fix: Resolve sync issues"
git push origin fix/sync-issues
```

### Azure DevOps Rollback
```bash
# Revert a merged PR
az repos pr revert \
  --id <PR_ID> \
  --source-branch develop

# Or use the pipeline rollback workflow
az pipelines run --name "Rollback" --branch main
```

---

## 8. Automated Sync Script

Save as `scripts/sync-azure.sh`:

```bash
#!/bin/bash
set -e

echo "🔄 Starting Azure DevOps Sync..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: Not in project root directory${NC}"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}Warning: Uncommitted changes detected${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Fetch latest
echo -e "${GREEN}Fetching latest from origin...${NC}"
git fetch origin --all --prune

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}Current branch: ${CURRENT_BRANCH}${NC}"

# Pull latest
echo -e "${GREEN}Pulling latest changes...${NC}"
git pull origin ${CURRENT_BRANCH} --rebase || {
  echo -e "${RED}Pull failed. Manual intervention required.${NC}"
  exit 1
}

# Run tests
echo -e "${GREEN}Running tests...${NC}"
pnpm run type-check
pnpm run test

# Push changes
echo -e "${GREEN}Pushing to origin...${NC}"
git push origin ${CURRENT_BRANCH}

echo -e "${GREEN}✅ Sync complete!${NC}"
```

---

## 9. Continuous Integration

### Recommended Git Workflow

```
main (production)
  ↑
  └── develop (integration)
        ↑
        ├── feature/api-gateway
        ├── feature/mobile-app
        ├── feature/admin-dashboard
        └── bugfix/auth-issues
```

### Feature Branch Naming
```
feature/<description>  - New features
bugfix/<description>   - Bug fixes
hotfix/<description>   - Production hotfixes
chore/<description>    - Maintenance tasks
docs/<description>     - Documentation updates
```

---

## 10. Next Steps After Sync

1. **Verify Azure Pipeline Runs**
   - Check build status
   - Review test results
   - Verify Docker image builds

2. **Deploy to Dev Environment**
   - Trigger dev deployment
   - Run smoke tests
   - Verify all services are healthy

3. **Create Feature Branches**
   - `feature/api-gateway` - Critical priority
   - `feature/mobile-app` - Critical priority
   - `feature/admin-dashboard` - High priority

4. **Update Azure Boards**
   - Create work items for gaps identified
   - Link commits to work items
   - Update sprint planning

---

*Document generated as part of Multi-Agent Orchestration System*
*Date: December 2024*
