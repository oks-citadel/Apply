# CI/CD Quick Fixes - Immediate Action Items

**Priority:** CRITICAL
**Time to Implement:** 1-2 hours
**Impact:** HIGH - Prevents broken/vulnerable code from reaching production

---

## 1. Remove `continue-on-error` from Tests (CRITICAL)

### Problem
Tests are currently allowed to fail without blocking deployment, which means broken code can reach production.

### Files to Fix

#### File: `.github/workflows/cd-dev.yml`

**Line 96-97:** Remove continue-on-error from linting
```yaml
# BEFORE
- name: Run linting
  run: pnpm run lint --if-present
  continue-on-error: true

# AFTER
- name: Run linting
  run: pnpm run lint --if-present
  # Linting errors now block deployment
```

**Line 99-104:** Remove continue-on-error from tests
```yaml
# BEFORE
- name: Run tests
  run: pnpm run test --if-present
  continue-on-error: true
  env:
    CI: true
    NODE_ENV: test

# AFTER
- name: Run tests
  run: pnpm run test --if-present
  env:
    CI: true
    NODE_ENV: test
  # Tests must pass for deployment to proceed
```

#### File: `.github/workflows/cd-staging.yml`

**Line 366:** Remove continue-on-error from integration tests
```yaml
# BEFORE
- name: Run integration tests
  run: |
    npm run test:integration || true
  env:
    TEST_BASE_URL: https://staging.applyforus.com
    TEST_API_URL: https://staging-api.applyforus.com
    CI: true

# AFTER
- name: Run integration tests
  run: npm run test:integration
  env:
    TEST_BASE_URL: https://staging.applyforus.com
    TEST_API_URL: https://staging-api.applyforus.com
    CI: true
  # Integration tests must pass
```

---

## 2. Make Security Scans Blocking (CRITICAL)

### Problem
Security scans detect vulnerabilities but don't prevent vulnerable containers from being deployed.

### Files to Fix

#### File: `.github/workflows/cd-prod.yml`

**Line 212-226:** Change Trivy to blocking
```yaml
# BEFORE
- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.ACR_LOGIN_SERVER }}/${{ env.IMAGE_PREFIX }}-${{ matrix.service }}:${{ needs.validate.outputs.image_tag }}
    format: 'sarif'
    output: 'trivy-${{ matrix.service }}.sarif'
    severity: 'CRITICAL'
    exit-code: '1'

# AFTER (This is already correct! exit-code: '1' means it will fail)
# No change needed - production already blocks on CRITICAL vulnerabilities
```

#### File: `.github/workflows/cd-staging.yml`

**Line 127-133:** Change exit-code to blocking
```yaml
# BEFORE
- name: Security scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.ACR_LOGIN_SERVER }}/${{ env.IMAGE_PREFIX }}-${{ matrix.service }}:${{ needs.prepare.outputs.image_tag }}
    format: 'table'
    exit-code: '0'
    severity: 'CRITICAL'

# AFTER
- name: Security scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.ACR_LOGIN_SERVER }}/${{ env.IMAGE_PREFIX }}-${{ matrix.service }}:${{ needs.prepare.outputs.image_tag }}
    format: 'sarif'
    output: 'trivy-${{ matrix.service }}.sarif'
    exit-code: '1'  # Block on CRITICAL vulnerabilities
    severity: 'CRITICAL,HIGH'
```

#### File: `.github/workflows/security-scan.yml`

**Line 54-56:** Remove continue-on-error from CodeQL
```yaml
# BEFORE
- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
  with:
    category: "/language:javascript"

# AFTER
- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
  with:
    category: "/language:javascript"
    # Do not use continue-on-error - let it fail the workflow
```

---

## 3. Remove Production Staging Bypass (CRITICAL)

### Problem
The production workflow allows bypassing staging verification, which is a critical safety check.

### File to Fix

#### File: `.github/workflows/cd-prod.yml`

**Line 13-17:** Remove skip_staging_check input
```yaml
# BEFORE
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy (must match a tag)'
        required: true
        type: string
      skip_staging_check:
        description: 'Skip staging verification (emergency only)'
        required: false
        type: boolean
        default: false

# AFTER
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy (must match a tag)'
        required: true
        type: string
      # Removed skip_staging_check - staging verification is always required
```

**Line 69:** Remove the conditional skip check
```yaml
# BEFORE
- name: Verify staging deployment
  id: check
  if: github.event.inputs.skip_staging_check != 'true'
  run: |
    # ...

# AFTER
- name: Verify staging deployment
  id: check
  run: |
    # Always verify staging - no bypass option
```

---

## 4. Add Integration Tests as Deployment Gate

### Problem
Integration tests run after deployment in staging, meaning broken integrations can still be deployed.

### File to Fix

#### File: `.github/workflows/cd-staging.yml`

**Add before line 80 (build-and-push job):**

```yaml
integration-tests:
  name: Pre-Deploy Integration Tests
  runs-on: ubuntu-latest
  needs: [prepare, security-gate]
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: jobpilot_test
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
    redis:
      image: redis:7-alpine
      ports:
        - 6379:6379
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/jobpilot_test
        REDIS_URL: redis://localhost:6379
        NODE_ENV: test
        CI: true
      # Tests must pass - no continue-on-error
```

**Then update line 80 (build-and-push) dependencies:**
```yaml
# BEFORE
build-and-push:
  name: Build & Push Images
  runs-on: ubuntu-latest
  needs: [prepare, security-gate]

# AFTER
build-and-push:
  name: Build & Push Images
  runs-on: ubuntu-latest
  needs: [prepare, security-gate, integration-tests]
  # Build only proceeds if integration tests pass
```

---

## 5. Harden Terraform Security Scanning

### Problem
Terraform security scans (tfsec, Checkov) are set to soft_fail, meaning they report issues but don't block infrastructure changes.

### File to Fix

#### File: `.github/workflows/terraform-plan.yml`

**Line 98-102:** Change tfsec to hard fail
```yaml
# BEFORE
- name: Run tfsec
  uses: aquasecurity/tfsec-action@v1.0.3
  with:
    working_directory: ${{ env.TF_WORKING_DIR }}
    soft_fail: true

# AFTER
- name: Run tfsec
  uses: aquasecurity/tfsec-action@v1.0.3
  with:
    working_directory: ${{ env.TF_WORKING_DIR }}
    soft_fail: false  # Block on security issues
    severity_filter: CRITICAL,HIGH  # Only fail on critical/high
```

**Line 104-111:** Change Checkov to hard fail
```yaml
# BEFORE
- name: Run Checkov
  uses: bridgecrewio/checkov-action@v12
  with:
    directory: ${{ env.TF_WORKING_DIR }}
    framework: terraform
    soft_fail: true
    output_format: cli,sarif
    output_file_path: console,results.sarif

# AFTER
- name: Run Checkov
  uses: bridgecrewio/checkov-action@v12
  with:
    directory: ${{ env.TF_WORKING_DIR }}
    framework: terraform
    soft_fail: false  # Block on security issues
    output_format: cli,sarif
    output_file_path: console,results.sarif
    skip_check: CKV_AZURE_4  # Example: skip specific checks if needed
```

---

## 6. Verification Commands

After making these changes, verify they work:

### Test the Changes Locally

```bash
# 1. Test that tests actually run
pnpm run test

# 2. Test that linting works
pnpm run lint

# 3. If you have integration tests
npm run test:integration

# 4. Verify Terraform formatting
cd infrastructure/terraform
terraform fmt -check -recursive

# 5. Run tfsec locally
tfsec infrastructure/terraform/
```

### Test in CI/CD

```bash
# 1. Create a test branch
git checkout -b test/cicd-hardening

# 2. Make the changes above
# Edit the workflow files

# 3. Commit and push
git add .github/workflows/
git commit -m "fix: Harden CI/CD pipelines - remove continue-on-error from tests"
git push origin test/cicd-hardening

# 4. Create a PR and watch the workflows
# The workflows should now fail if tests fail
```

### Expected Behavior After Fixes

1. **Tests fail = Deployment blocked**
   - If unit tests fail, build-and-push won't run
   - If integration tests fail, deployment won't proceed

2. **Security vulnerabilities = Build blocked**
   - CRITICAL vulnerabilities will fail the build
   - HIGH vulnerabilities will fail the build in staging/prod

3. **Terraform security issues = PR blocked**
   - tfsec/Checkov findings will require fixing before merge

4. **Production always verifies staging**
   - No way to skip staging verification

---

## 7. Rollback Plan

If these changes cause issues, you can quickly revert:

```bash
# Option 1: Revert the commit
git revert <commit-hash>
git push

# Option 2: Temporarily disable the workflow
# Add this to the top of the workflow file:
on:
  workflow_dispatch:  # Manual trigger only
  # Commented out automatic triggers temporarily
  # push:
  #   branches: [develop]
```

---

## 8. Communication Template

When rolling out these changes, inform your team:

```markdown
### CI/CD Pipeline Hardening - Breaking Changes

**What's changing:**
We're removing `continue-on-error` from test jobs and making security scans blocking.

**Why:**
To prevent broken code and security vulnerabilities from reaching production.

**Impact on your workflow:**
- PRs will now be blocked if tests fail
- PRs will be blocked if security scans find CRITICAL/HIGH issues
- You'll need to fix test failures before merging

**What to do if your PR is blocked:**
1. Run tests locally: `pnpm run test`
2. Fix failing tests
3. Commit and push again

**What to do if security scan blocks you:**
1. Review the security findings in the Actions tab
2. Update vulnerable dependencies: `npm audit fix`
3. If a vulnerability has no fix, document it and request exception

**Questions?** Ask in #devops or #engineering
```

---

## 9. Success Metrics

After implementing these fixes, track:

1. **Deployment failure rate**
   - Target: < 5% (down from current unknown rate)

2. **Security vulnerabilities in production**
   - Target: 0 CRITICAL, < 5 HIGH

3. **Test failure detection**
   - Target: 100% of test failures block deployment

4. **Time to detect issues**
   - Target: Issues detected in CI, not production

---

## 10. Next Steps After Quick Fixes

Once these critical fixes are in place, tackle these medium-priority items:

1. **Add image signature verification** (2-3 hours)
2. **Implement secret rotation workflow** (4-6 hours)
3. **Add canary deployment for production** (6-8 hours)
4. **Expand security scanning to all services** (1-2 hours)
5. **Add test coverage gates** (2-3 hours)

---

**Owner:** DevOps Team
**Review Date:** 2025-12-22 (1 week after implementation)
**Status:** Ready for Implementation

**Approval Required:** DevOps Lead, Engineering Manager
