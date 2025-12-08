# CI/CD Files Index

Complete index of all CI/CD pipeline files and documentation for the ApplyPlatform.

## Quick Navigation

- [Start Here](#start-here)
- [Pipeline Files](#pipeline-files)
- [Configuration Files](#configuration-files)
- [Documentation](#documentation)
- [Statistics](#statistics)

---

## Start Here

### For First-Time Setup
1. Read: [README.md](./README.md) - Overview and introduction
2. Follow: [QUICK_START.md](./QUICK_START.md) - 25-minute setup
3. Reference: [CI-CD_SETUP.md](./CI-CD_SETUP.md) - Complete guide

### For Developers
1. Check pipeline status in Azure DevOps
2. Review: [QUICK_START.md](./QUICK_START.md) for common commands
3. Troubleshoot: [CI-CD_SETUP.md](./CI-CD_SETUP.md#troubleshooting)

### For DevOps Engineers
1. Review: [CI-CD_SETUP.md](./CI-CD_SETUP.md) - Complete implementation
2. Configure: [service-connections.md](./azure-pipelines/service-connections.md)
3. Setup: [variable-groups.yml](./azure-pipelines/variable-groups.yml)

---

## Pipeline Files

### Main Pipeline
**File**: `azure-pipelines/main-pipeline.yml`
**Lines**: 541
**Purpose**: Main CI/CD pipeline with 8 stages

**Stages**:
1. Build - Compile all services
2. Test - Run all test suites
3. Security - Security scanning
4. Package - Build Docker images
5. Deploy Dev - Auto-deploy to dev
6. Deploy Staging - Auto-deploy to staging
7. Deploy Production - Manual approval
8. Post-Deployment - Smoke tests

**Key Features**:
- Trigger configuration
- Multi-environment support
- Parallel execution
- Approval gates
- Comprehensive testing

### Template: Security Scan
**File**: `azure-pipelines/templates/security-scan.yml`
**Lines**: 330
**Purpose**: Security scanning jobs

**Scans Performed**:
- Dependency vulnerability scanning (npm, pip, Snyk)
- SAST (ESLint, Semgrep, SonarCloud)
- Secret scanning (TruffleHog, GitLeaks)
- OWASP Dependency Check
- Security summary generation

**Parameters**:
- `enableDependencyScan` (default: true)
- `enableSAST` (default: true)
- `enableSecretScan` (default: true)
- `failOnHighSeverity` (default: false)

### Template: Build Images
**File**: `azure-pipelines/templates/build-images.yml`
**Lines**: 338
**Purpose**: Docker image building

**Jobs**:
- Build frontend images (web, admin)
- Build backend images (9 NestJS services)
- Build AI service (Python)
- Security scan with Trivy
- Generate image manifest

**Parameters**:
- `containerRegistry` - ACR connection name
- `acrName` - Registry URL
- `imageTag` - Git SHA or custom tag
- `semanticVersion` - Semantic version
- `buildCache` - Enable build cache (default: true)

### Template: Deploy
**File**: `azure-pipelines/templates/deploy.yml`
**Lines**: 330
**Purpose**: Kubernetes deployment

**Capabilities**:
- Deploy to AKS
- Update K8s manifests
- Inject secrets from Key Vault
- Run database migrations
- Health checks
- Smoke tests
- Deployment reports

**Parameters**:
- `environment` - Target environment (dev/staging/production)
- `azureSubscription` - Azure connection
- `aksResourceGroup` - AKS resource group
- `aksClusterName` - AKS cluster name
- `namespace` - Kubernetes namespace
- `imageTag` - Docker image tag
- `requireApproval` - Manual approval flag

---

## Configuration Files

### Variable Groups
**File**: `azure-pipelines/variable-groups.yml`
**Lines**: 303
**Purpose**: Variable group definitions

**Groups Defined**:
1. **ApplyPlatform-Common** (8 variables)
   - Build tool versions
   - Container registry
   - Common settings

2. **ApplyPlatform-Dev** (20+ variables)
   - Dev environment configuration
   - AKS cluster settings
   - Database connections
   - Redis configuration

3. **ApplyPlatform-Staging** (20+ variables)
   - Staging environment
   - Production-like settings

4. **ApplyPlatform-Production** (25+ variables)
   - Production environment
   - Enhanced monitoring
   - Strict rate limits

5. **ApplyPlatform-Secrets** (30+ secrets)
   - Linked from Azure Key Vault
   - Database passwords
   - API keys
   - OAuth secrets

**Categories**:
- Build configuration
- Azure resources
- Databases
- Cache
- Storage
- External services
- OAuth providers
- Monitoring

### Service Connections
**File**: `azure-pipelines/service-connections.md`
**Lines**: 397
**Purpose**: Service connection setup guide

**Connections Documented**:
1. Azure Resource Manager
   - AKS access
   - Key Vault access
   - Resource management

2. Azure Container Registry
   - Image push/pull
   - Authentication

3. GitHub (Optional)
   - Repository integration
   - Release automation

4. Snyk (Optional)
   - Vulnerability scanning

5. SonarCloud (Optional)
   - Code quality analysis

6. Azure Key Vault
   - Secret retrieval
   - Secure configuration

**Includes**:
- Setup instructions
- Security best practices
- Permission requirements
- Testing procedures
- Troubleshooting
- Service principal rotation

---

## Documentation

### README
**File**: `README.md`
**Lines**: 462
**Purpose**: Main documentation hub

**Contents**:
- Overview
- Directory structure
- Pipeline architecture
- Environment details
- Key features
- Getting started
- Quick links
- Support information

**Audience**: All users

### Quick Start Guide
**File**: `QUICK_START.md`
**Lines**: 266
**Purpose**: Fast setup guide

**Setup Time**: 25 minutes

**Sections**:
- Prerequisites checklist
- 5-step setup process
- Verification steps
- Common commands
- Quick troubleshooting

**Audience**: Developers, DevOps engineers

### Comprehensive Setup Guide
**File**: `CI-CD_SETUP.md`
**Lines**: 988 (45+ pages)
**Purpose**: Complete implementation guide

**Major Sections**:
1. Overview (architecture, features)
2. Prerequisites (Azure resources, tools)
3. Architecture (stage flow, services)
4. Setup Instructions (step-by-step)
5. Pipeline Configuration (detailed)
6. Variable Groups (all variables)
7. Service Connections (all connections)
8. Deployment Environments (all envs)
9. Testing Strategy (unit, integration, E2E)
10. Security Scanning (all scans)
11. Monitoring and Alerts (metrics, alerts)
12. Troubleshooting (common issues)
13. Best Practices (recommendations)
14. Maintenance (schedules)
15. Additional Resources (links)

**Audience**: DevOps engineers, system administrators

---

## Statistics

### File Count
- Total files: 9
- Pipeline files: 4 (main + 3 templates)
- Configuration files: 2
- Documentation files: 3

### Line Count
- Total lines: 3,955
- Pipeline YAML: 1,539 lines
- Configuration: 700 lines
- Documentation: 1,716 lines

### Breakdown by Type

#### Pipeline Files (1,539 lines)
- Main pipeline: 541 lines
- Security scan template: 330 lines
- Build images template: 338 lines
- Deploy template: 330 lines

#### Configuration Files (700 lines)
- Variable groups: 303 lines
- Service connections: 397 lines

#### Documentation (1,716 lines)
- CI-CD Setup: 988 lines
- README: 462 lines
- Quick Start: 266 lines

### Services Covered
- Frontend apps: 2
- Backend services: 8 (NestJS)
- AI service: 1 (Python)
- Total services: 11

### Environments Supported
- Development (dev)
- Staging (staging)
- Production (production)

---

## File Details

### azure-pipelines/main-pipeline.yml
```yaml
Purpose: Main CI/CD pipeline
Stages: 8
Jobs: 15+
Triggers: Push, PR, Manual
Environments: 3
Approval Gates: Yes (production)
```

### azure-pipelines/templates/security-scan.yml
```yaml
Purpose: Security scanning
Jobs: 5
Scans: Dependency, SAST, Secret, OWASP
Tools: Snyk, Semgrep, TruffleHog, GitLeaks
Reports: JSON artifacts
```

### azure-pipelines/templates/build-images.yml
```yaml
Purpose: Docker image builds
Images Built: 11
Strategy: Parallel
Scanning: Trivy
Registry: Azure Container Registry
Tagging: SHA, version, latest
```

### azure-pipelines/templates/deploy.yml
```yaml
Purpose: Kubernetes deployment
Target: Azure Kubernetes Service
Strategy: Rolling updates
Secrets: Azure Key Vault
Migrations: Automated (dev/staging)
Validation: Health checks, smoke tests
```

---

## Usage Examples

### Trigger Pipeline
```bash
# Via Azure CLI
az pipelines run --name "ApplyPlatform-CI-CD" --branch develop

# Via Git push
git push origin develop  # Auto-triggers pipeline
```

### Check Pipeline Status
```bash
# List recent runs
az pipelines runs list --top 5

# Show specific run
az pipelines runs show --id <run-id>
```

### Deploy to Environment
```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

# Check deployment status
kubectl get deployments -n applyforus

# Check pods
kubectl get pods -n applyforus
```

---

## Integration Points

### Azure DevOps
- **Organization**: citadelcloudmanagement
- **Project**: ApplyPlatform
- **Repository**: ApplyPlatform
- **Portal**: https://dev.azure.com/citadelcloudmanagement/ApplyPlatform

### Azure Resources
- **Container Registry**: applyforusacr.azurecr.io
- **AKS Clusters**:
  - applyforus-dev-aks
  - applyforus-staging-aks
  - applyforus-prod-aks
- **Key Vault**: applyforus-secrets
- **Resource Groups**:
  - applyforus-dev-rg
  - applyforus-staging-rg
  - applyforus-prod-rg

### External Services
- **Snyk**: Vulnerability scanning
- **SonarCloud**: Code quality
- **SendGrid**: Email notifications
- **OpenAI**: AI features

---

## Maintenance

### Update Schedule

**Daily**:
- Monitor pipeline runs
- Review failures
- Check security alerts

**Weekly**:
- Merge dependency updates
- Review performance metrics
- Clean up old branches

**Monthly**:
- Update pipeline templates
- Review variable groups
- Rotate secrets (non-Key Vault)

**Quarterly**:
- Rotate service principals
- Security audit
- Update documentation

---

## Support

### Getting Help

**Documentation Priority**:
1. [README.md](./README.md) - Start here
2. [QUICK_START.md](./QUICK_START.md) - Fast setup
3. [CI-CD_SETUP.md](./CI-CD_SETUP.md) - Deep dive

**Support Channels**:
- DevOps Team: devops@applyforus.com
- Emergency: PagerDuty
- Azure Support: Via Azure Portal

**Useful Links**:
- [Azure DevOps Docs](https://docs.microsoft.com/azure/devops/)
- [AKS Documentation](https://docs.microsoft.com/azure/aks/)
- [Kubernetes Docs](https://kubernetes.io/docs/)

---

## Version History

### v1.0.0 (2025-01-08)
- Initial release
- Complete CI/CD pipeline
- 8-stage pipeline
- Multi-environment support
- Comprehensive security scanning
- Complete documentation

---

## Related Documentation

### Platform Documentation
- Infrastructure: `infrastructure/kubernetes/README.md`
- Terraform: `infrastructure/terraform/README.md`
- Monitoring: `infrastructure/monitoring/README.md`

### Service Documentation
- Auth Service: `services/auth-service/README.md`
- User Service: `services/user-service/README.md`
- Job Service: `services/job-service/README.md`

---

## Quick Reference

### File Locations
```
ci-cd/
├── README.md                              # Start here
├── QUICK_START.md                         # 25-min setup
├── CI-CD_SETUP.md                         # Complete guide
├── INDEX.md                               # This file
└── azure-pipelines/
    ├── main-pipeline.yml                  # Main pipeline
    ├── variable-groups.yml                # Variables
    ├── service-connections.md             # Connections
    └── templates/
        ├── security-scan.yml              # Security
        ├── build-images.yml               # Docker
        └── deploy.yml                     # Deployment
```

### Command Reference
```bash
# Setup
az pipelines create --name "ApplyPlatform-CI-CD"

# Run
az pipelines run --name "ApplyPlatform-CI-CD" --branch develop

# Status
az pipelines runs list --top 5

# Logs
az pipelines runs show --id <run-id>

# Deploy
kubectl apply -k infrastructure/kubernetes/

# Monitor
kubectl get pods -n applyforus
```

---

**Last Updated**: 2025-01-08
**Status**: Production Ready
**Version**: 1.0.0
