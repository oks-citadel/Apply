# ApplyPlatform CI/CD Documentation

Complete CI/CD pipeline implementation for the ApplyPlatform monorepo using Azure DevOps.

## Overview

This directory contains all configurations and documentation for the ApplyPlatform CI/CD pipeline. The pipeline automates building, testing, security scanning, and deployment of the entire monorepo to Azure Kubernetes Service (AKS).

## Directory Structure

```
ci-cd/
├── azure-pipelines/
│   ├── main-pipeline.yml              # Main CI/CD pipeline
│   ├── templates/
│   │   ├── security-scan.yml          # Security scanning template
│   │   ├── build-images.yml           # Docker image build template
│   │   └── deploy.yml                 # Deployment template
│   ├── variable-groups.yml            # Variable group definitions
│   └── service-connections.md         # Service connection setup guide
├── CI-CD_SETUP.md                     # Comprehensive setup guide
├── QUICK_START.md                     # Quick setup guide (25 min)
└── README.md                          # This file
```

## Documentation Index

### For DevOps Engineers

1. **[CI-CD_SETUP.md](./CI-CD_SETUP.md)** - Complete setup guide
   - Prerequisites
   - Step-by-step setup instructions
   - Architecture overview
   - Troubleshooting
   - Best practices

2. **[service-connections.md](./azure-pipelines/service-connections.md)** - Service connections
   - Azure Resource Manager setup
   - Container Registry configuration
   - Security best practices
   - Troubleshooting guide

3. **[variable-groups.yml](./azure-pipelines/variable-groups.yml)** - Variable groups
   - All required variables
   - Environment-specific configurations
   - Secret management
   - Azure Key Vault integration

### For Developers

1. **[QUICK_START.md](./QUICK_START.md)** - Fast setup (25 min)
   - Quick commands
   - Essential steps only
   - Common commands
   - Quick troubleshooting

### For Managers

- **Pipeline Overview**: See [Architecture](#pipeline-architecture) below
- **Deployment Strategy**: See [Environments](#environments) below
- **Security**: See [Security Scanning](#security-scanning) below

## Pipeline Architecture

### Stage Overview

```
┌──────────┐
│  BUILD   │ Compile all services, run linting and type checking
└────┬─────┘
     │
┌────┴─────┬──────────┬──────────┐
│   TEST   │ SECURITY │ PACKAGE  │ Run tests, scan for vulnerabilities, build Docker images
└────┬─────┴────┬─────┴────┬─────┘
     │          │          │
     └──────────┴──────────┘
             │
┌────────────┴─────────────┐
│       DEPLOY DEV         │ Auto-deploy to dev on develop branch
└────────────┬─────────────┘
             │
┌────────────┴─────────────┐
│     DEPLOY STAGING       │ Auto-deploy to staging on main branch
└────────────┬─────────────┘
             │
┌────────────┴─────────────┐
│   DEPLOY PRODUCTION      │ Manual approval required
└────────────┬─────────────┘
             │
┌────────────┴─────────────┐
│     SMOKE TESTS          │ Post-deployment validation
└──────────────────────────┘
```

### Services Built

The pipeline builds and deploys these services:

**Frontend:**
- Web Application (Next.js)
- Admin Dashboard (Next.js)

**Backend (NestJS):**
- Auth Service (port 4000)
- User Service (port 4001)
- Job Service (port 4002)
- Resume Service (port 4003)
- Notification Service (port 4004)
- Auto Apply Service (port 4005)
- Analytics Service (port 4006)
- Orchestrator Service (port 4007)

**AI Service:**
- AI Service (Python/FastAPI, port 5000)

## Environments

### Development (dev)

- **URL**: https://dev.applyforus.com
- **Deployment**: Automatic on push to `develop` branch
- **Purpose**: Feature development and testing
- **Approval**: None required
- **Resources**: Minimal (cost-effective)

### Staging (staging)

- **URL**: https://staging.applyforus.com
- **Deployment**: Automatic on push to `main` branch
- **Purpose**: Pre-production validation
- **Approval**: None required
- **Resources**: Production-like

### Production (production)

- **URL**: https://applyforus.com
- **Deployment**: Manual after staging validation
- **Purpose**: Live user-facing application
- **Approval**: **Required** (multiple reviewers)
- **Resources**: Optimized for scale

## Key Features

### Build & Test

- **Monorepo Support**: Uses Turbo and pnpm for efficient builds
- **Parallel Execution**: Jobs run concurrently where possible
- **Comprehensive Testing**:
  - Unit tests (Jest/Vitest)
  - Integration tests
  - E2E tests (Playwright)
  - Code coverage reporting

### Security Scanning

Multiple layers of security scanning:

1. **Dependency Scanning**
   - npm audit (Node.js)
   - safety (Python)
   - Snyk (comprehensive)

2. **SAST (Static Application Security Testing)**
   - ESLint with security plugin
   - Semgrep
   - SonarCloud (optional)

3. **Secret Scanning**
   - TruffleHog
   - GitLeaks

4. **Container Scanning**
   - Trivy (vulnerability scanning)
   - Image signing (future)

### Docker Image Management

- **Multi-stage builds**: Optimized image sizes
- **Parallel builds**: All services built concurrently
- **Smart tagging**:
  - Git SHA: `$(Build.SourceVersion)`
  - Semantic version: `1.0.$(Build.BuildId)`
  - Latest: `latest`
- **Registry**: Azure Container Registry (ACR)

### Deployment

- **Target**: Azure Kubernetes Service (AKS)
- **Strategy**: Rolling updates
- **Health Checks**: Automated post-deployment validation
- **Rollback**: Manual or automatic on failure
- **Secrets**: Managed via Azure Key Vault

## Getting Started

### For First-Time Setup

Follow the [Quick Start Guide](./QUICK_START.md) for a 25-minute setup.

Or follow the [Complete Setup Guide](./CI-CD_SETUP.md) for detailed instructions.

### For Ongoing Development

#### Trigger a Build

Push to `develop` or `main`:
```bash
git push origin develop
```

#### Manual Trigger

Via Azure DevOps:
1. Go to Pipelines
2. Select "ApplyPlatform-CI-CD"
3. Click "Run pipeline"
4. Select branch and options

Via Azure CLI:
```bash
az pipelines run --name "ApplyPlatform-CI-CD" --branch develop
```

#### Check Build Status

```bash
# List recent builds
az pipelines runs list --top 5

# Show specific build
az pipelines runs show --id <run-id>
```

#### View Deployment

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

# Check deployments
kubectl get deployments -n applyforus

# Check pods
kubectl get pods -n applyforus

# Check services
kubectl get services -n applyforus
```

## Pipeline Variables

### Variable Groups

Five variable groups control pipeline behavior:

1. **ApplyPlatform-Common**: Shared across all environments
2. **ApplyPlatform-Dev**: Development environment
3. **ApplyPlatform-Staging**: Staging environment
4. **ApplyPlatform-Production**: Production environment
5. **ApplyPlatform-Secrets**: Sensitive secrets (from Key Vault)

See [variable-groups.yml](./azure-pipelines/variable-groups.yml) for details.

### Modifying Variables

Via Azure DevOps:
1. Pipelines → Library
2. Select variable group
3. Edit variables
4. Save

Via Azure CLI:
```bash
az pipelines variable-group variable update \
  --group-id <group-id> \
  --name <variable-name> \
  --value <new-value>
```

## Service Connections

Required service connections:

1. **ApplyPlatform-Azure-Connection**: Azure Resource Manager
2. **applyforus-acr**: Azure Container Registry

Optional:
3. **Snyk**: Vulnerability scanning
4. **SonarCloud**: Code quality

See [service-connections.md](./azure-pipelines/service-connections.md) for setup.

## Security Best Practices

### Secrets Management

- **Never commit secrets** to code
- Use **Azure Key Vault** for all secrets
- Rotate secrets **every 90 days**
- Use **separate secrets** per environment
- Enable **audit logging**

### Access Control

- Use **service principals**, not personal accounts
- Grant **minimum required permissions**
- Enable **branch protection** on main/develop
- Require **code reviews** for all PRs
- Use **approval gates** for production

### Scanning and Monitoring

- Enable **all security scans**
- Review **scan results** regularly
- Set up **alerts** for security findings
- Monitor **deployed applications**
- Regular **security audits**

## Troubleshooting

### Quick Fixes

#### Build Fails
```bash
# Clear cache
# In pipeline, delete cache artifacts
# Re-run pipeline
```

#### Deployment Fails
```bash
# Check cluster health
kubectl get nodes
kubectl get pods -n applyforus

# Check events
kubectl get events -n applyforus --sort-by='.lastTimestamp'

# View pod logs
kubectl logs <pod-name> -n applyforus
```

#### Tests Fail
```bash
# Run tests locally
pnpm run test

# Check test logs in pipeline
# Download test results artifact
```

### Detailed Troubleshooting

See [CI-CD_SETUP.md - Troubleshooting](./CI-CD_SETUP.md#troubleshooting) section.

## Maintenance

### Daily
- Monitor pipeline success rates
- Review failed builds
- Check security alerts

### Weekly
- Merge dependency updates
- Review pipeline performance
- Clean up old branches

### Monthly
- Update pipeline templates
- Review variable groups
- Rotate secrets (non-Key Vault)

### Quarterly
- Rotate service principal credentials
- Security audit
- Update documentation

## Performance Metrics

### Target Metrics

- **Build Time**: < 15 minutes
- **Test Coverage**: > 80%
- **Success Rate**: > 95%
- **Deployment Time**: < 10 minutes
- **Mean Time to Recovery**: < 30 minutes

### Monitoring

View metrics in Azure DevOps:
- Pipelines → Analytics
- Test Plans → Test Analytics

## Support

### Internal Support

- **DevOps Team**: devops@applyforus.com
- **Documentation**: This directory
- **Emergency**: PagerDuty

### External Resources

- [Azure DevOps Docs](https://docs.microsoft.com/azure/devops/)
- [AKS Documentation](https://docs.microsoft.com/azure/aks/)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Contributing

When modifying the pipeline:

1. Test changes in a feature branch
2. Document all changes
3. Update relevant documentation
4. Get review from DevOps team
5. Deploy to dev first
6. Validate thoroughly before production

### Pipeline Modification Checklist

- [ ] Changes tested locally
- [ ] Documentation updated
- [ ] Variable groups updated (if needed)
- [ ] Service connections verified
- [ ] Security scans pass
- [ ] Team review completed
- [ ] Dev deployment successful
- [ ] Staging deployment successful
- [ ] Production deployment approved

## Version History

### v1.0.0 (2025-01-08)
- Initial CI/CD pipeline implementation
- Multi-stage pipeline with 8 stages
- Comprehensive security scanning
- Multi-environment deployment
- Docker image building and scanning
- Integration with Azure services

## License

Internal use only - ApplyForUs Platform
Copyright © 2025 Citadel Cloud Management

---

## Quick Links

- [Quick Start Guide](./QUICK_START.md) - Get started in 25 minutes
- [Complete Setup Guide](./CI-CD_SETUP.md) - Detailed instructions
- [Service Connections](./azure-pipelines/service-connections.md) - Setup guide
- [Variable Groups](./azure-pipelines/variable-groups.yml) - Configuration reference
- [Main Pipeline](./azure-pipelines/main-pipeline.yml) - Pipeline YAML
- [Azure DevOps Portal](https://dev.azure.com/citadelcloudmanagement/ApplyPlatform)

---

**Questions?** Contact the DevOps team at devops@applyforus.com
