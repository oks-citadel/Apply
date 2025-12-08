# Azure DevOps Pipelines - ApplyforUs Platform

Comprehensive CI/CD pipelines for the ApplyforUs job application platform.

## Table of Contents

- [Overview](#overview)
- [Pipeline Architecture](#pipeline-architecture)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Pipeline Descriptions](#pipeline-descriptions)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Overview

The ApplyforUs platform uses Azure DevOps for continuous integration and deployment. This directory contains all pipeline definitions and templates for:

- **Building** microservices and web applications
- **Testing** code with comprehensive coverage
- **Securing** the codebase with multiple scanning tools
- **Deploying** to Azure Kubernetes Service (AKS)
- **Managing** infrastructure with Terraform

### Key Features

- Multi-stage build pipelines with parallel execution
- Docker image building and pushing to ACR
- Comprehensive security scanning (SAST, secrets, dependencies, containers)
- Infrastructure as Code with Terraform
- Environment-specific deployments (dev, test, prod)
- Manual approval gates for production
- Blue-green and canary deployment support
- Automated rollback capabilities
- Health check validation
- Cost estimation for infrastructure changes

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Azure DevOps Pipelines                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐     ┌──────────────────┐             │
│  │  Build Pipeline  │────▶│ Deploy Pipeline  │             │
│  └──────────────────┘     └──────────────────┘             │
│           │                        │                         │
│           │                        ▼                         │
│           │               ┌──────────────────┐              │
│           │               │   Dev Environment │              │
│           │               └──────────────────┘              │
│           │                        │                         │
│           │                        ▼                         │
│           │               ┌──────────────────┐              │
│           │               │  Test Environment │              │
│           │               └──────────────────┘              │
│           │                        │                         │
│           │                        ▼                         │
│           │               ┌──────────────────┐              │
│           │               │  Prod Environment │              │
│           ▼               └──────────────────┘              │
│  ┌──────────────────┐                                       │
│  │Security Pipeline │                                       │
│  └──────────────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │ Infrastructure   │                                       │
│  │    Pipeline      │                                       │
│  └──────────────────┘                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Prerequisites Setup
```bash
# Clone the repository
git clone https://dev.azure.com/your-org/ApplyforUs/_git/ApplyforUs
cd ApplyforUs

# Navigate to pipelines directory
cd .azure/pipelines
```

### 2. Create Variable Groups
See [variable_groups.md](./variable_groups.md) for detailed instructions.

### 3. Create Service Connections
See [service_connections.md](./service_connections.md) for detailed instructions.

### 4. Import Pipelines
1. Go to Azure DevOps Pipelines
2. Click "New Pipeline"
3. Select "Azure Repos Git"
4. Choose your repository
5. Select "Existing Azure Pipelines YAML file"
6. Select the pipeline file
7. Save and run

---

## Prerequisites

### Azure Resources

- **Azure Subscription** with appropriate permissions
- **Azure Container Registry** (ACR) for Docker images
- **Azure Kubernetes Service** (AKS) clusters (dev, test, prod)
- **Azure Storage Account** for Terraform state
- **Azure Key Vault** for secrets management (optional but recommended)

### Azure DevOps

- **Azure DevOps Organization** and Project
- **Service Connections** configured (see [service_connections.md](./service_connections.md))
- **Variable Groups** created (see [variable_groups.md](./variable_groups.md))
- **Appropriate permissions** for pipeline creation and management

### Tools and Software

- **Node.js** 20.x
- **Python** 3.11
- **Docker** for containerization
- **kubectl** for Kubernetes management
- **Helm** for Kubernetes deployments
- **Terraform** for infrastructure management

---

## Pipeline Descriptions

### 1. Build Pipeline
**File:** `azure-pipelines-build.yml`

**Purpose:** Build, test, and package all services

**Stages:**
1. **Code Quality** - Linting, formatting, type checking
2. **Testing** - Unit tests with coverage reporting
3. **Security Scan** - Basic security checks
4. **Build Images** - Docker image building for all services
5. **Push Images** - Push to ACR with semantic versioning
6. **Create Release** - Generate release artifacts

**Triggers:**
- Push to main, develop, feature/* branches
- Pull requests to main, develop

**Services Built:**
- web (Next.js frontend)
- auth-service (Authentication)
- job-service (Job management)
- resume-service (Resume handling)
- user-service (User management)
- ai-service (AI capabilities)
- notification-service (Notifications)
- auto-apply-service (Auto-application)
- analytics-service (Analytics)
- orchestrator-service (Orchestration)

### 2. Deploy Pipeline
**File:** `azure-pipelines-deploy.yml`

**Purpose:** Deploy services to AKS environments

**Stages:**
1. **Pre-Deployment** - Validation and health checks
2. **Deploy Dev** - Automatic deployment to dev
3. **Deploy Test** - Automatic deployment to test
4. **Deploy Prod** - Manual approval required
5. **Post-Deployment** - Validation and reporting

**Deployment Strategies:**
- Rolling Update (default)
- Blue-Green Deployment
- Canary Deployment

**Parameters:**
- Environment (dev/test/prod)
- Deployment Strategy
- Image Tag

### 3. Infrastructure Pipeline
**File:** `azure-pipelines-infrastructure.yml`

**Purpose:** Manage Azure infrastructure with Terraform

**Stages:**
1. **Terraform Plan** - Preview infrastructure changes
2. **Drift Detection** - Check for configuration drift
3. **Terraform Apply** - Apply changes (with approval for prod)
4. **Post-Apply Validation** - Verify deployed resources
5. **Documentation** - Generate infrastructure docs

**Actions:**
- Plan (default) - Preview changes
- Apply - Execute changes
- Destroy - Remove infrastructure (requires approval)

**Parameters:**
- Action (plan/apply/destroy)
- Environment (dev/test/prod)

### 4. Security Pipeline
**File:** `azure-pipelines-security.yml`

**Purpose:** Comprehensive security scanning

**Stages:**
1. **Code Security** - Secret detection, SAST, license compliance
2. **Dependency Scan** - NPM and Python vulnerability scanning
3. **Container Scan** - Image and Dockerfile scanning
4. **Infrastructure Security** - Terraform and Kubernetes manifest scanning
5. **Compliance Reporting** - Generate security reports

**Scans Performed:**
- Secret Detection (TruffleHog, detect-secrets)
- SAST (Semgrep)
- Dependency Vulnerabilities (npm audit, Safety)
- Container Security (Trivy)
- Dockerfile Best Practices (hadolint)
- Infrastructure Security (tfsec, kubesec)

**Triggers:**
- Nightly scheduled scan
- Push to main/develop
- Pull requests

---

## Setup Instructions

### Step 1: Create Azure Resources

#### 1.1 Create Resource Groups
```bash
az group create --name applyforus-common-rg --location eastus
az group create --name applyforus-dev-rg --location eastus
az group create --name applyforus-test-rg --location eastus
az group create --name applyforus-prod-rg --location eastus
az group create --name applyforus-terraform-state-rg --location eastus
```

#### 1.2 Create Container Registry
```bash
az acr create \
  --name applyforusacr \
  --resource-group applyforus-common-rg \
  --sku Standard \
  --admin-enabled true
```

#### 1.3 Create AKS Clusters
```bash
# Dev
az aks create \
  --name applyforus-dev-aks \
  --resource-group applyforus-dev-rg \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --attach-acr applyforusacr

# Test
az aks create \
  --name applyforus-test-aks \
  --resource-group applyforus-test-rg \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --attach-acr applyforusacr

# Prod
az aks create \
  --name applyforus-prod-aks \
  --resource-group applyforus-prod-rg \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-managed-identity \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 10 \
  --attach-acr applyforusacr
```

#### 1.4 Create Terraform State Storage
```bash
# Create storage account
az storage account create \
  --name applyforustfstate \
  --resource-group applyforus-terraform-state-rg \
  --sku Standard_LRS \
  --encryption-services blob

# Get storage account key
ACCOUNT_KEY=$(az storage account keys list \
  --resource-group applyforus-terraform-state-rg \
  --account-name applyforustfstate \
  --query '[0].value' -o tsv)

# Create container
az storage container create \
  --name tfstate \
  --account-name applyforustfstate \
  --account-key $ACCOUNT_KEY
```

### Step 2: Create Service Principal

```bash
# Create service principal for pipelines
az ad sp create-for-rbac \
  --name "applyforus-devops-sp" \
  --role Contributor \
  --scopes /subscriptions/{subscription-id}

# Save the output:
# - appId (use as servicePrincipalId)
# - password (use as servicePrincipalKey)
# - tenant (use as tenantId)
```

### Step 3: Configure Azure DevOps

#### 3.1 Create Service Connections
Follow the detailed guide in [service_connections.md](./service_connections.md) to create:
- Azure Resource Manager connection
- ACR connection
- AKS connections (dev, test, prod)

#### 3.2 Create Variable Groups
Follow the detailed guide in [variable_groups.md](./variable_groups.md) to create:
- applyforus-common
- applyforus-dev
- applyforus-test
- applyforus-prod
- applyforus-terraform
- applyforus-security

### Step 4: Import Pipelines

1. **Build Pipeline**
   - Go to Pipelines > New Pipeline
   - Select Azure Repos Git
   - Choose repository
   - Select "Existing Azure Pipelines YAML file"
   - Path: `.azure/pipelines/azure-pipelines-build.yml`
   - Save as: `ApplyforUs-Build`

2. **Deploy Pipeline**
   - Repeat process with `azure-pipelines-deploy.yml`
   - Save as: `ApplyforUs-Deploy`

3. **Infrastructure Pipeline**
   - Repeat process with `azure-pipelines-infrastructure.yml`
   - Save as: `ApplyforUs-Infrastructure`

4. **Security Pipeline**
   - Repeat process with `azure-pipelines-security.yml`
   - Save as: `ApplyforUs-Security`

### Step 5: Configure Environments

Create deployment environments with approval gates:

1. Go to **Pipelines** > **Environments**
2. Create environments:
   - `ApplyforUs-Dev`
   - `ApplyforUs-Test`
   - `ApplyforUs-Prod`
3. For `ApplyforUs-Prod`:
   - Add **Approvals and checks**
   - Configure required approvers
   - Set timeout policies

---

## Configuration

### Semantic Versioning

The build pipeline uses semantic versioning:
```
{major}.{minor}.{patch}-{buildId}
```

Configure in `azure-pipelines-build.yml`:
```yaml
variables:
  majorVersion: '1'
  minorVersion: '0'
  patchVersion: $[counter(format('{0}.{1}', variables['majorVersion'], variables['minorVersion']), 0)]
```

### Docker Image Tags

Images are tagged with multiple tags:
- `{version}-{buildId}` (e.g., `1.0.5-12345`)
- `{version}` (e.g., `1.0.5`)
- `{branch}` (e.g., `develop`)
- `latest`

### Environment-Specific Configuration

Each environment has its own:
- Variable group
- AKS cluster
- Kubernetes namespace
- Service connection

---

## Usage Guide

### Running the Build Pipeline

1. Navigate to **Pipelines** > **ApplyforUs-Build**
2. Click **Run pipeline**
3. Select branch
4. Click **Run**

The pipeline will:
- Run linting and tests
- Build all service images
- Push to ACR (on main/develop)
- Create release artifacts

### Deploying to Dev/Test

1. Navigate to **Pipelines** > **ApplyforUs-Deploy**
2. Click **Run pipeline**
3. Parameters:
   - Environment: `dev` or `test`
   - Deployment Strategy: `rolling`
   - Image Tag: (leave empty for latest)
4. Click **Run**

### Deploying to Production

1. Navigate to **Pipelines** > **ApplyforUs-Deploy**
2. Click **Run pipeline**
3. Parameters:
   - Environment: `prod`
   - Deployment Strategy: `rolling`, `bluegreen`, or `canary`
   - Image Tag: specific version (e.g., `1.0.5-12345`)
4. Click **Run**
5. Wait for manual approval
6. Approvers review and approve
7. Deployment continues

### Managing Infrastructure

#### Plan Changes
```
Pipeline: ApplyforUs-Infrastructure
Parameters:
  - Action: plan
  - Environment: dev/test/prod
```

#### Apply Changes
```
Pipeline: ApplyforUs-Infrastructure
Parameters:
  - Action: apply
  - Environment: dev/test/prod
```

For production:
- Manual approval required
- State backup created automatically
- Validation performed after apply

### Running Security Scans

Security pipeline runs automatically:
- Nightly at 2 AM UTC
- On push to main/develop
- On pull requests

Manual run:
1. Navigate to **Pipelines** > **ApplyforUs-Security**
2. Click **Run pipeline**
3. Select branch
4. Click **Run**

Review results in pipeline artifacts.

---

## Best Practices

### 1. Branch Strategy

- **main** - Production-ready code
- **develop** - Integration branch
- **feature/** - Feature development
- **hotfix/** - Production fixes

### 2. Commit Messages

Follow conventional commits:
```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: update dependencies
ci: modify pipeline
```

### 3. Pull Requests

- Always create PRs for changes
- Wait for CI checks to pass
- Require code review approval
- Squash commits when merging

### 4. Security

- Never commit secrets
- Use variable groups for sensitive data
- Rotate credentials regularly
- Review security scan results
- Address critical vulnerabilities immediately

### 5. Testing

- Maintain >80% code coverage
- Write unit tests for new features
- Run integration tests before deployment
- Perform smoke tests after deployment

### 6. Deployments

- Deploy to dev first
- Test in test environment
- Deploy to prod during maintenance windows
- Have rollback plan ready
- Monitor after deployment

### 7. Infrastructure

- Always run plan before apply
- Review Terraform changes carefully
- Use separate state per environment
- Tag all resources consistently
- Document infrastructure changes

---

## Troubleshooting

### Build Failures

**Issue:** Tests failing
```bash
# Run tests locally
npm test

# Check test coverage
npm run test:coverage
```

**Issue:** Docker build fails
```bash
# Build locally
docker build -t test-image -f apps/web/Dockerfile .

# Check for build errors
docker build --no-cache -t test-image -f apps/web/Dockerfile .
```

### Deployment Failures

**Issue:** Pod not starting
```bash
# Check pod status
kubectl get pods -n applyforus-dev

# Check pod logs
kubectl logs <pod-name> -n applyforus-dev

# Describe pod
kubectl describe pod <pod-name> -n applyforus-dev
```

**Issue:** Service not accessible
```bash
# Check service
kubectl get svc -n applyforus-dev

# Check ingress
kubectl get ingress -n applyforus-dev

# Test from within cluster
kubectl run test-pod --image=busybox -it --rm -- wget -O- http://service-name
```

### Pipeline Errors

**Issue:** Variable group not found
- Verify variable group exists
- Check variable group name spelling
- Ensure pipeline has access

**Issue:** Service connection fails
- Test service connection in Azure DevOps
- Verify credentials
- Check service principal permissions

**Issue:** Terraform state lock
```bash
# Force unlock (use carefully)
terraform force-unlock <lock-id>
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `No service connection found` | Missing service connection | Create service connection |
| `Variable group not found` | Variable group missing or not accessible | Check variable group exists and has permissions |
| `Image not found in registry` | Docker image not pushed | Run build pipeline first |
| `Terraform state locked` | Previous operation didn't complete | Wait or force unlock |
| `Pod CrashLoopBackOff` | Application error | Check pod logs |
| `ImagePullBackOff` | Cannot pull image | Check ACR credentials |

---

## Pipeline Templates

### Reusable Templates

Located in `templates/` directory:

1. **docker-build.yml** - Build Docker images
2. **docker-push.yml** - Push to ACR with scanning
3. **helm-deploy.yml** - Deploy to AKS with Helm
4. **terraform-plan.yml** - Run Terraform plan
5. **terraform-apply.yml** - Apply Terraform changes
6. **security-scan.yml** - Comprehensive security scanning

### Using Templates

```yaml
steps:
  - template: templates/docker-build.yml
    parameters:
      serviceName: 'web'
      dockerfilePath: 'apps/web/Dockerfile'
      imageTag: '$(Build.BuildId)'
```

---

## Monitoring and Alerts

### Pipeline Monitoring

- Monitor pipeline runs in Azure DevOps
- Set up email notifications for failures
- Review build duration trends
- Track deployment frequency

### Application Monitoring

- Use Azure Monitor for infrastructure
- Application Insights for application telemetry
- Log Analytics for centralized logging
- Set up alerts for critical metrics

### Security Monitoring

- Review security scan results regularly
- Create work items for vulnerabilities
- Track remediation progress
- Audit access and permissions

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review failed pipeline runs
- Check security scan results
- Update dependencies

**Monthly:**
- Rotate service principal credentials
- Review and cleanup old images
- Update documentation
- Review resource costs

**Quarterly:**
- Update tools and extensions
- Review and optimize pipelines
- Conduct security audit
- Update disaster recovery plan

---

## Additional Resources

### Documentation
- [Azure DevOps Pipelines Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/)
- [Azure Kubernetes Service Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Helm Documentation](https://helm.sh/docs/)

### Tools
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/)
- [kubectl](https://kubernetes.io/docs/reference/kubectl/)
- [Terraform](https://www.terraform.io/docs/)
- [Trivy](https://aquasecurity.github.io/trivy/)
- [Semgrep](https://semgrep.dev/docs/)

### Project Links
- Variable Groups: [variable_groups.md](./variable_groups.md)
- Service Connections: [service_connections.md](./service_connections.md)
- Infrastructure: [../../infrastructure/terraform/README.md](../../infrastructure/terraform/README.md)
- Kubernetes: [../../infrastructure/kubernetes/README.md](../../infrastructure/kubernetes/README.md)

---

## Support

### Getting Help

- **Technical Issues:** Open an issue in Azure DevOps
- **Pipeline Questions:** Contact DevOps team
- **Security Concerns:** Contact Security team
- **Emergency:** Use emergency contact procedures

### Contributing

To contribute to pipeline improvements:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request
5. Request review from DevOps team

---

## License

Copyright © 2024 ApplyforUs. All rights reserved.

---

## Changelog

### Version 1.0.0 (2024-12-08)
- Initial pipeline setup
- Build pipeline with all services
- Deploy pipeline with multi-environment support
- Infrastructure pipeline with Terraform
- Security pipeline with comprehensive scanning
- Complete documentation

---

**Happy Deploying! 🚀**
