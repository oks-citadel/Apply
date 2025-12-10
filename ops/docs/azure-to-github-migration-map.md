# Azure DevOps to GitHub Actions Migration Map

## Migration Overview

**Project**: ApplyForUs Platform (JobPilot AI)
**Migration Date**: December 2025
**Source**: Azure DevOps (citadelcloudmanagement/ApplyPlatform)
**Target**: GitHub Actions

---

## Executive Summary

This document maps all Azure DevOps pipelines, service connections, variable groups, and environments to their GitHub Actions equivalents. The migration consolidates and modernizes the CI/CD architecture into two tracks:

- **Version A**: Terraform + AKS + ACR CI/CD (Infrastructure-focused)
- **Version B**: Full SaaS Multi-Environment CI/CD (Application-focused)

---

## 1. Azure DevOps Inventory

### 1.1 Pipelines (3 Total)

| Azure DevOps Pipeline | ID | Status | GitHub Actions Equivalent |
|----------------------|-----|--------|---------------------------|
| ApplyForUs-Main-Pipeline | 27 | Active | `.github/workflows/main-pipeline.yml` |
| ApplyForUs-Monitoring | 28 | Active | `.github/workflows/monitoring.yml` |
| ApplyForUs-Self-Healing | 29 | Active | `.github/workflows/self-healing.yml` |

### 1.2 Pipeline Templates

| Azure DevOps Template | Path | GitHub Actions Equivalent |
|----------------------|------|---------------------------|
| install-dependencies.yml | templates/build/ | Composite action or inline |
| lint-typecheck.yml | templates/build/ | Composite action or inline |
| run-tests.yml | templates/build/ | Composite action or inline |
| build-artifacts.yml | templates/build/ | Composite action or inline |
| docker-build.yml | templates/build/ | Composite action or inline |
| docker-push.yml | templates/build/ | Composite action or inline |
| version-manifest.yml | templates/build/ | Composite action or inline |
| deploy-to-aks.yml | templates/aks/ | Composite action or inline |
| sync-secrets.yml | templates/deploy/ | Composite action or inline |
| validate-infrastructure.yml | templates/deploy/ | Composite action or inline |
| create-rollback-plan.yml | templates/deploy/ | Composite action or inline |
| security-scan.yml | templates/security/ | Composite action or inline |
| container-scan.yml | templates/security/ | Composite action or inline |
| policy-validation.yml | templates/security/ | Composite action or inline |
| security-gate.yml | templates/security/ | Composite action or inline |
| health-check.yml | templates/verify/ | Composite action or inline |
| smoke-tests.yml | templates/verify/ | Composite action or inline |
| api-validation.yml | templates/verify/ | Composite action or inline |
| artifact-integrity.yml | templates/verify/ | Composite action or inline |
| final-verification.yml | templates/verify/ | Composite action or inline |
| deployment-summary.yml | templates/verify/ | Composite action or inline |

### 1.3 Service Connections (2 Total)

| Azure DevOps Service Connection | Type | GitHub Actions Equivalent |
|--------------------------------|------|---------------------------|
| ApplyPlatform | Azure Resource Manager (OIDC) | `AZURE_CREDENTIALS` secret + `azure/login@v1` |
| DockerHub-ServiceConnection | Docker Registry | `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` secrets |

### 1.4 Variable Groups (6 Total)

| Azure DevOps Variable Group | ID | GitHub Equivalent |
|----------------------------|-----|-------------------|
| terraform-backend | 10 | Repository secrets + environment variables |
| terraform-credentials | 11 | Repository secrets |
| common-secrets | 21 | Repository secrets |
| dev-secrets | 22 | GitHub Environment: `development` |
| staging-secrets | 23 | GitHub Environment: `staging` |
| prod-secrets | 24 | GitHub Environment: `production` |

### 1.5 Variables Mapping

| Azure DevOps Variable | GitHub Secret/Variable |
|----------------------|------------------------|
| ARM_CLIENT_ID | `AZURE_CLIENT_ID` |
| ARM_CLIENT_SECRET | `AZURE_CLIENT_SECRET` |
| ARM_SUBSCRIPTION_ID | `AZURE_SUBSCRIPTION_ID` |
| ARM_TENANT_ID | `AZURE_TENANT_ID` |
| TF_STATE_RESOURCE_GROUP | `TF_STATE_RESOURCE_GROUP` |
| TF_STATE_STORAGE_ACCOUNT | `TF_STATE_STORAGE_ACCOUNT` |
| TF_STATE_CONTAINER | `TF_STATE_CONTAINER` |
| DOCKER_USERNAME | `DOCKERHUB_USERNAME` |
| DOCKER_PASSWORD | `DOCKERHUB_TOKEN` |
| SQL_ADMIN_USERNAME | `SQL_ADMIN_USERNAME` |
| SQL_ADMIN_PASSWORD_DEV | Environment secret in `development` |
| SQL_ADMIN_PASSWORD_STAGING | Environment secret in `staging` |
| SQL_ADMIN_PASSWORD_PROD | Environment secret in `production` |

### 1.6 Agent Pools

| Azure DevOps Pool | GitHub Actions Runner |
|-------------------|----------------------|
| Default (self-hosted) | Self-hosted runner or `ubuntu-latest` |
| Azure Pipelines | `ubuntu-latest` |
| Hosted Ubuntu 1604 | `ubuntu-latest` (upgraded) |

---

## 2. GitHub Actions Architecture

### 2.1 Workflow Structure

```
.github/
├── workflows/
│   ├── # VERSION A: Terraform + AKS + ACR
│   ├── terraform-plan.yml              # Terraform plan for all environments
│   ├── terraform-apply-dev.yml         # Apply to dev environment
│   ├── terraform-apply-staging.yml     # Apply to staging environment
│   ├── terraform-apply-prod.yml        # Apply to production (with approval)
│   ├── terraform-drift-detection.yml   # Scheduled drift detection
│   │
│   ├── # VERSION B: Full SaaS Multi-Environment
│   ├── ci.yml                          # Existing - enhanced
│   ├── cd-dev.yml                      # Deploy to development
│   ├── cd-staging.yml                  # Deploy to staging
│   ├── cd-prod.yml                     # Deploy to production
│   │
│   ├── # SHARED WORKFLOWS
│   ├── build-and-push.yml              # Build & push container images
│   ├── security-scan.yml               # SAST, SCA, container scanning
│   ├── secret-rotation.yml             # Automated secret rotation
│   ├── drift-repair.yml                # Auto-fix drift issues
│   ├── self-healing.yml                # Autonomous repair agent
│   ├── monitoring.yml                  # Pipeline & infrastructure monitoring
│   ├── api-tests.yml                   # API endpoint validation
│   ├── e2e-tests.yml                   # Existing - enhanced
│   ├── integration-tests.yml           # Existing - enhanced
│   ├── smoke-tests.yml                 # Existing - enhanced
│   ├── rollback.yml                    # Existing - enhanced
│   │
│   ├── # DOCUMENTATION & MAINTENANCE
│   ├── docs-generator.yml              # Auto-generate documentation
│   ├── dependency-update.yml           # Automated dependency updates
│   └── cleanup.yml                     # Resource cleanup
│
├── actions/
│   ├── setup-node/                     # Composite: Node.js + pnpm setup
│   ├── setup-terraform/                # Composite: Terraform setup
│   ├── setup-azure/                    # Composite: Azure CLI + login
│   ├── docker-build/                   # Composite: Docker build + scan
│   ├── deploy-aks/                     # Composite: AKS deployment
│   └── health-check/                   # Composite: Service health validation
│
└── CODEOWNERS                          # Code ownership rules
```

### 2.2 GitHub Environments

| Environment | Protection Rules | Secrets |
|-------------|------------------|---------|
| `development` | None | SQL_ADMIN_PASSWORD, environment-specific configs |
| `staging` | Required reviewers (1) | SQL_ADMIN_PASSWORD, environment-specific configs |
| `production` | Required reviewers (2), Wait timer (10 min) | SQL_ADMIN_PASSWORD, environment-specific configs |

### 2.3 Required GitHub Secrets

#### Repository Secrets (Global)
```yaml
# Azure Authentication
AZURE_CREDENTIALS          # JSON with clientId, clientSecret, subscriptionId, tenantId
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_SUBSCRIPTION_ID
AZURE_TENANT_ID

# Terraform State Backend
TF_STATE_RESOURCE_GROUP    # applyplatform-terraform-state-rg
TF_STATE_STORAGE_ACCOUNT   # applyplatformtfstate
TF_STATE_CONTAINER         # tfstate

# Container Registries
ACR_LOGIN_SERVER           # applyforusacr.azurecr.io
ACR_USERNAME
ACR_PASSWORD
DOCKERHUB_USERNAME         # citadelplatforms
DOCKERHUB_TOKEN

# Security Scanning
SNYK_TOKEN
CODECOV_TOKEN

# Notifications
SLACK_WEBHOOK_URL

# Application Secrets
JWT_SECRET
JWT_REFRESH_SECRET
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SENDGRID_API_KEY
```

#### Environment-Specific Secrets
```yaml
# development
SQL_ADMIN_PASSWORD_DEV
STRIPE_SECRET_KEY_DEV

# staging
SQL_ADMIN_PASSWORD_STAGING
STRIPE_SECRET_KEY_STAGING

# production
SQL_ADMIN_PASSWORD_PROD
STRIPE_SECRET_KEY_PROD
```

---

## 3. Migration Mapping Details

### 3.1 Stage Mapping: BuildAndTest

**Azure DevOps Stage**: `BuildAndTest`

| Azure DevOps Job | GitHub Actions Job | Workflow |
|-----------------|-------------------|----------|
| SecurityScanning | `security-scan` | `ci.yml` |
| DependencyInstall | Part of `lint-and-typecheck` | `ci.yml` |
| LintAndTypeCheck | `lint-and-typecheck` | `ci.yml` |
| UnitTests | `test-services` (matrix) | `ci.yml` |
| BuildArtifacts | `build-web`, `build-services` | `ci.yml` |
| BuildDockerImages | `build-and-push` | `build-and-push.yml` |

### 3.2 Stage Mapping: ContainerPush

**Azure DevOps Stage**: `ContainerPush`

| Azure DevOps Job | GitHub Actions Job | Workflow |
|-----------------|-------------------|----------|
| PushToACR | `push-to-acr` | `build-and-push.yml` |
| ContainerVulnScan | `container-scan` | `security-scan.yml` |
| VersionManifest | `generate-manifest` | `build-and-push.yml` |

### 3.3 Stage Mapping: Deploy to Environments

**Azure DevOps Stages**: `DeployDev`, `DeployTest`, `DeployProd`

| Azure DevOps Stage | GitHub Actions Workflow | Environment |
|-------------------|------------------------|-------------|
| DeployDev | `cd-dev.yml` | `development` |
| DeployTest | `cd-staging.yml` | `staging` |
| DeployProd | `cd-prod.yml` | `production` |

### 3.4 Terraform Workflow Mapping

| Azure DevOps Task | GitHub Actions Equivalent |
|------------------|---------------------------|
| TerraformInstaller@1 | `hashicorp/setup-terraform@v3` |
| TerraformTaskV4@4 (init) | `terraform init` with backend config |
| TerraformTaskV4@4 (plan) | `terraform plan` with artifact upload |
| TerraformTaskV4@4 (apply) | `terraform apply` with approval |

---

## 4. Services to Deploy

### 4.1 Application Services (10 Total)

| Service | Port | Dockerfile | Image Tag Format |
|---------|------|------------|------------------|
| web | 3000 | apps/web/Dockerfile | `applyforusacr.azurecr.io/applyai-web:TAG` |
| auth-service | 8001 | services/auth-service/Dockerfile | `applyforusacr.azurecr.io/applyai-auth:TAG` |
| user-service | 8002 | services/user-service/Dockerfile | `applyforusacr.azurecr.io/applyai-user:TAG` |
| resume-service | 8003 | services/resume-service/Dockerfile | `applyforusacr.azurecr.io/applyai-resume:TAG` |
| job-service | 8004 | services/job-service/Dockerfile | `applyforusacr.azurecr.io/applyai-job:TAG` |
| auto-apply-service | 8005 | services/auto-apply-service/Dockerfile | `applyforusacr.azurecr.io/applyai-autoapply:TAG` |
| analytics-service | 8006 | services/analytics-service/Dockerfile | `applyforusacr.azurecr.io/applyai-analytics:TAG` |
| notification-service | 8007 | services/notification-service/Dockerfile | `applyforusacr.azurecr.io/applyai-notification:TAG` |
| orchestrator-service | 8008 | services/orchestrator-service/Dockerfile | `applyforusacr.azurecr.io/applyai-orchestrator:TAG` |
| ai-service | 8008 | services/ai-service/Dockerfile | `applyforusacr.azurecr.io/applyai-ai:TAG` |
| payment-service | 8009 | services/payment-service/Dockerfile | `applyforusacr.azurecr.io/applyai-payment:TAG` |

### 4.2 Infrastructure Components

| Component | Terraform Module | Azure Service |
|-----------|-----------------|---------------|
| Networking | modules/networking | VNet, Subnets, NSGs |
| Container Registry | modules/container-registry | Azure Container Registry |
| Kubernetes | modules/aks | Azure Kubernetes Service |
| Database | modules/sql-database | Azure Database for PostgreSQL |
| Cache | modules/redis-cache | Azure Cache for Redis |
| Secrets | modules/key-vault | Azure Key Vault |
| Messaging | modules/service-bus | Azure Service Bus |
| CDN/WAF | modules/front-door | Azure Front Door |
| DNS | modules/dns | Azure DNS |
| Monitoring | modules/monitoring | Application Insights |

---

## 5. Post-Migration Actions

### 5.1 Azure DevOps Cleanup Checklist

After successful GitHub Actions deployment:

- [ ] Delete pipeline: ApplyForUs-Main-Pipeline (ID: 27)
- [ ] Delete pipeline: ApplyForUs-Monitoring (ID: 28)
- [ ] Delete pipeline: ApplyForUs-Self-Healing (ID: 29)
- [ ] Delete variable group: terraform-backend (ID: 10)
- [ ] Delete variable group: terraform-credentials (ID: 11)
- [ ] Delete variable group: common-secrets (ID: 21)
- [ ] Delete variable group: dev-secrets (ID: 22)
- [ ] Delete variable group: staging-secrets (ID: 23)
- [ ] Delete variable group: prod-secrets (ID: 24)
- [ ] Delete service connection: ApplyPlatform
- [ ] Delete service connection: DockerHub-ServiceConnection
- [ ] Archive repository in Azure DevOps

### 5.2 GitHub Setup Checklist

- [ ] Create GitHub Environments (development, staging, production)
- [ ] Configure environment protection rules
- [ ] Add all repository secrets
- [ ] Add environment-specific secrets
- [ ] Configure branch protection rules
- [ ] Enable required status checks
- [ ] Set up CODEOWNERS file
- [ ] Configure Dependabot settings

---

## 6. Timeline & Milestones

### Phase 1: Setup & Validation
- Create GitHub environments and secrets
- Migrate CI workflow (build, test, lint)
- Validate with pull request workflow

### Phase 2: Version A - Terraform Workflows
- Create Terraform plan workflow
- Create Terraform apply workflows (dev, staging, prod)
- Implement drift detection
- Test infrastructure deployment

### Phase 3: Version B - Application Deployment
- Create CD workflows for each environment
- Implement container build and push
- Configure AKS deployments
- Set up health checks and smoke tests

### Phase 4: Security & Compliance
- Implement security scanning workflows
- Set up secret rotation
- Configure compliance gates
- Enable vulnerability alerts

### Phase 5: Self-Healing & Monitoring
- Implement self-healing agent workflow
- Set up monitoring workflow
- Configure alerting
- Test auto-recovery scenarios

### Phase 6: Production Deployment
- Run full CI/CD to production
- Validate all services
- Confirm GoDaddy DNS cutover ready
- Clean up Azure DevOps

---

## 7. Contacts & Resources

**Repository**: https://github.com/[org]/Job-Apply-Platform
**Azure DevOps**: https://dev.azure.com/citadelcloudmanagement/ApplyPlatform
**Documentation**: https://docs.applyforus.com
**Production URL**: https://applyforus.com

---

*Document generated by Claude Migration Agent - December 2025*
