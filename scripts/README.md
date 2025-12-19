# ApplyForUs Platform Scripts

This directory contains operational scripts for the ApplyForUs platform.

## Quick Reference

### Docker Image Building

**Build all Docker images locally:**
```bash
./build-all-images.sh
```

This will build all 14 Docker images (11 backend services + 3 frontend apps) with proper tagging.

See [Docker Build Guide](../docs/DOCKER_BUILD_GUIDE.md) for complete documentation.

### Deployment

- `deploy.sh` - Deploy services to production
- `DEPLOY_FINOPS_CONTROLS.sh` - Deploy with FinOps cost controls
- `rollback.sh` - Rollback to previous deployment

### Azure Container Registry

- `docker-build-push.sh` - Build and push single service to ACR
- `acr-cleanup.sh` - Clean up old images from ACR
- `verify-image-digests.sh` - Verify image SHA256 digests

### Infrastructure

- `infrastructure/` - Infrastructure automation scripts
- `create-redis-production.sh` - Set up Redis cache
- `setup-azure-pipelines.sh` - Configure Azure DevOps pipelines

### Monitoring & Validation

- `cost-monitoring.sh` - Monitor Azure resource costs
- `validate-system.sh` - System-wide validation
- `validate-dns.sh` - DNS configuration validation
- `validate-ssl.sh` - SSL certificate validation
- `smoke-tests.sh` - Quick smoke tests after deployment
- `verify-azure-deployment.sh` - Verify Azure deployment status

### Security

- `setup-secret-management.sh` - Configure Azure Key Vault
- `fix-all-issues.sh` - Automated security and quality fixes

### Database

- `migrate-database.sh` - Run database migrations
- `migrations/` - Database migration scripts

### Performance

- `setup-performance.sh` - Performance monitoring setup
- `performance/` - Performance testing scripts

## Script Naming Conventions

- **Executable scripts**: `.sh` extension, chmod +x
- **PowerShell scripts**: `.ps1` extension (Windows-specific)
- **Infrastructure scripts**: In `infrastructure/` subdirectory
- **Migration scripts**: In `migrations/` subdirectory

## Usage Guidelines

1. **Always run from project root** unless script documentation says otherwise
2. **Check script help**: Most scripts support `--help` or `-h` flag
3. **Review before running**: Production scripts modify live resources
4. **Use with caution**: Some scripts are destructive (marked with warnings)

## Environment Variables

Many scripts use these common environment variables:

```bash
# Azure Configuration
AZURE_SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="applyforus-prod-rg"
ACR_NAME="applyforusacr"

# Docker Configuration
REGISTRY="applyforusacr.azurecr.io"
VERSION="v3.0.0"

# Application Configuration
ENVIRONMENT="production"  # or "staging", "development"
```

## Safety Features

### Destructive Operations

Scripts that modify production resources include:
- Interactive confirmations
- Dry-run modes (where applicable)
- Rollback capabilities
- Comprehensive logging

### Non-Destructive Operations

Build and verification scripts:
- Read-only operations
- Safe to run multiple times
- No side effects on production

## Getting Started

### First Time Setup

1. Install prerequisites (Docker, Azure CLI, kubectl)
2. Configure Azure authentication: `az login`
3. Set environment variables
4. Run validation: `./validate-system.sh`

### Building Images

1. Review [Docker Build Guide](../docs/DOCKER_BUILD_GUIDE.md)
2. Run: `./build-all-images.sh`
3. Verify: Check output for build summary

### Deploying to Azure

1. Build images: `./build-all-images.sh`
2. Push to ACR: Follow push instructions in build output
3. Deploy: `./deploy.sh`
4. Verify: `./verify-azure-deployment.sh`

## Maintenance

### Regular Tasks

**Weekly:**
- Clean up old ACR images: `./acr-cleanup.sh`
- Review costs: `./cost-monitoring.sh`

**Monthly:**
- Update base images in Dockerfiles
- Review and update scripts
- Validate DNS and SSL: `./validate-dns.sh && ./validate-ssl.sh`

**As Needed:**
- Database migrations: `./migrate-database.sh`
- Security fixes: `./fix-all-issues.sh`
- Performance testing: `./performance/run-tests.sh`

## Troubleshooting

### Common Issues

**Permission denied:**
```bash
chmod +x script-name.sh
```

**Azure CLI not authenticated:**
```bash
az login
az account set --subscription "your-subscription-id"
```

**Docker not running:**
- Start Docker Desktop
- Verify: `docker --version`

**Script not found:**
- Ensure you're in project root or scripts directory
- Use absolute paths: `/path/to/Job-Apply-Platform/scripts/script-name.sh`

## Contributing

When adding new scripts:

1. Follow naming conventions
2. Add executable permission: `chmod +x script-name.sh`
3. Include usage documentation in script header
4. Add entry to this README
5. Test in non-production environment first

### Script Template

```bash
#!/bin/bash
# Script Name: script-name.sh
# Description: Brief description of what this script does
# Usage: ./script-name.sh [options]
#
# Options:
#   -h, --help     Show this help message
#   -v, --verbose  Enable verbose output
#
# Example:
#   ./script-name.sh --verbose

set -e  # Exit on error
set -u  # Exit on undefined variable

# Script implementation here
```

## Support

For issues or questions:
- Check script comments and documentation
- Review error messages carefully
- Consult team documentation
- Contact platform team if needed

---

**Last Updated**: 2025-12-19
