# JobPilot Kubernetes Deployment

Complete Kubernetes deployment configuration for the JobPilot AI Platform.

## Quick Links

- [Quick Start Guide](QUICK-START.md) - Fast reference for common commands
- [Testing Guide](TESTING-GUIDE.md) - Comprehensive testing documentation
- [Validation Report](VALIDATION-REPORT.md) - Complete validation results
- [Deployment Summary](DEPLOYMENT-SUMMARY.md) - What was done and how

## Status

✅ **VALIDATED AND READY FOR DEPLOYMENT**

- All manifests validated
- All syntax errors fixed
- Monitoring stack configured
- Environment overlays created
- Testing scripts ready
- Documentation complete

## Directory Structure

```
infrastructure/kubernetes/
├── base/                          # Base configurations (9 files)
│   ├── namespace.yaml            # Namespace definition
│   ├── configmap.yaml            # Application configuration
│   ├── secrets.yaml              # Secret management + Azure Key Vault
│   ├── ingress.yaml              # Ingress rules + TLS + ClusterIssuers
│   ├── networkpolicy.yaml        # Network security policies
│   ├── poddisruptionbudget.yaml  # High availability configuration
│   ├── resourcequota.yaml        # Resource quotas + limit ranges
│   └── serviceaccount.yaml       # Service account + RBAC
│
├── services/                      # Service deployments (10 files)
│   ├── auth-service.yaml         # Authentication service (port 3001)
│   ├── user-service.yaml         # User management (port 3002)
│   ├── job-service.yaml          # Job listings (port 3003)
│   ├── ai-service.yaml           # AI/ML features (port 3004)
│   ├── resume-service.yaml       # Resume processing (port 3005)
│   ├── analytics-service.yaml    # Analytics (port 3006)
│   ├── notification-service.yaml # Notifications (port 3007)
│   ├── auto-apply-service.yaml   # Auto-apply (port 3008)
│   ├── orchestrator-service.yaml # Orchestration (port 3009)
│   └── web-app.yaml             # Frontend (port 3000)
│
├── monitoring/                    # Monitoring stack (3 files)
│   ├── prometheus.yaml           # Metrics collection + alerts
│   ├── grafana.yaml              # Dashboards + visualization
│   └── alertmanager.yaml         # Alert routing + notifications
│
├── overlays/                      # Environment-specific configs
│   ├── dev/                      # Development environment
│   │   └── kustomization.yaml   # Dev overlay config
│   ├── staging/                  # Staging environment
│   │   └── kustomization.yaml   # Staging overlay config
│   └── production/               # Production environment
│       └── kustomization.yaml   # Production overlay config
│
├── kustomization.yaml            # Root kustomization file
├── validate-manifests.sh         # Validation automation script
├── test-local.sh                 # Local testing automation script
│
├── README.md                     # This file
├── QUICK-START.md                # Quick reference guide
├── TESTING-GUIDE.md              # Comprehensive testing guide
├── VALIDATION-REPORT.md          # Detailed validation report
└── DEPLOYMENT-SUMMARY.md         # Complete summary of changes
```

## Quick Start

### 1. Validate Everything

```bash
cd infrastructure/kubernetes
./validate-manifests.sh
```

### 2. Test Locally

```bash
# Requires Docker Desktop, Minikube, or Kind
./test-local.sh
```

### 3. Deploy to Environment

```bash
# Development
kubectl apply -k overlays/dev

# Staging
kubectl apply -k overlays/staging

# Production
kubectl apply -k overlays/production
```

## What's Included

### Infrastructure (Base)
- ✅ Namespace with proper labels
- ✅ ConfigMap for all app configuration
- ✅ Secrets management via Azure Key Vault
- ✅ Ingress with TLS/SSL (Let's Encrypt)
- ✅ Network policies for all services
- ✅ PodDisruptionBudgets for HA
- ✅ ResourceQuotas and LimitRanges
- ✅ ServiceAccount with RBAC

### Services (10 microservices)
Each service includes:
- ✅ Deployment with proper configuration
- ✅ Service (ClusterIP)
- ✅ HorizontalPodAutoscaler
- ✅ Resource requests and limits
- ✅ Liveness and readiness probes
- ✅ Security context (non-root, read-only FS)
- ✅ Anti-affinity rules
- ✅ Prometheus metrics annotations

### Monitoring Stack
- ✅ Prometheus server with service discovery
- ✅ Grafana with pre-configured datasource
- ✅ Alertmanager with email notifications
- ✅ Pre-configured alert rules
- ✅ Ingress for each monitoring tool
- ✅ Persistent storage

### Environment Overlays
- ✅ Development (minimal resources)
- ✅ Staging (production-like)
- ✅ Production (full HA)

### Testing & Validation
- ✅ Automated validation script
- ✅ Local testing script
- ✅ Comprehensive documentation
- ✅ Troubleshooting guides

## Common Commands

### Validation
```bash
./validate-manifests.sh
```

### Deployment
```bash
# Apply to specific environment
kubectl apply -k overlays/dev
kubectl apply -k overlays/staging
kubectl apply -k overlays/production
```

### Monitoring
```bash
# Check status
kubectl get pods -n jobpilot

# View logs
kubectl logs -f deployment/auth-service -n jobpilot

# Check events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'
```

### Port Forwarding
```bash
# Web App
kubectl port-forward -n jobpilot svc/web-app 3000:3000

# Auth Service
kubectl port-forward -n jobpilot svc/auth-service 3001:3001

# Prometheus
kubectl port-forward -n jobpilot svc/prometheus 9090:9090

# Grafana
kubectl port-forward -n jobpilot svc/grafana 3000:3000
```

### Debugging
```bash
# Get shell in pod
kubectl exec -it <pod-name> -n jobpilot -- /bin/sh

# Check resource usage
kubectl top pods -n jobpilot

# Describe resource
kubectl describe pod <pod-name> -n jobpilot
```

## Service Ports

| Service | Port | Health Check |
|---------|------|--------------|
| web-app | 3000 | /api/health |
| auth-service | 3001 | /health |
| user-service | 3002 | /health |
| job-service | 3003 | /health |
| ai-service | 3004 | /health |
| resume-service | 3005 | /health |
| analytics-service | 3006 | /health |
| notification-service | 3007 | /health |
| auto-apply-service | 3008 | /health |
| orchestrator-service | 3009 | /health/live |
| prometheus | 9090 | /-/healthy |
| grafana | 3000 | /api/health |
| alertmanager | 9093 | /-/healthy |

## Features

### High Availability
- Multiple replicas for critical services
- PodDisruptionBudgets to maintain availability
- Anti-affinity rules for pod distribution
- Auto-scaling based on CPU/memory

### Security
- Pod Security Standards (restricted profile)
- Non-root containers
- Read-only root filesystems
- Network policies enforcing least privilege
- Azure Key Vault integration
- TLS/SSL everywhere

### Observability
- Prometheus metrics from all services
- Grafana dashboards
- Alertmanager for notifications
- Health check endpoints
- Structured logging

### DevOps
- Environment-specific overlays
- GitOps-ready
- Automated validation
- Local testing support
- Comprehensive documentation

## Prerequisites

### Required Tools
- kubectl (v1.25+)
- kustomize (v5.0+)
- Docker Desktop / Minikube / Kind (for local testing)
- helm (v3.0+, for local testing)

### Optional Tools
- kubeval (enhanced validation)
- k9s (terminal UI)
- stern (log tailing)

### Azure Resources (for production)
- Azure Kubernetes Service (AKS)
- Azure Container Registry (ACR)
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Key Vault
- Azure Storage Account

## Next Steps

1. **Validate** - Run validation script
   ```bash
   ./validate-manifests.sh
   ```

2. **Test Locally** - Deploy to local K8s
   ```bash
   ./test-local.sh
   ```

3. **Build Images** - Build and push to ACR
   ```bash
   # Build images for all services
   # Push to jobpilotacr.azurecr.io
   ```

4. **Configure Azure** - Set up Azure resources
   - Create AKS cluster
   - Set up PostgreSQL database
   - Set up Redis cache
   - Configure Key Vault with secrets

5. **Deploy to Staging** - Test in staging
   ```bash
   kubectl apply -k overlays/staging
   ```

6. **Deploy to Production** - Go live
   ```bash
   kubectl apply -k overlays/production
   ```

## Documentation

- **[QUICK-START.md](QUICK-START.md)** - Quick reference for common tasks
- **[TESTING-GUIDE.md](TESTING-GUIDE.md)** - Complete testing procedures
- **[VALIDATION-REPORT.md](VALIDATION-REPORT.md)** - Detailed validation results
- **[DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)** - Summary of all changes

## Issues Fixed

This deployment includes fixes for:
- ✅ Invalid pod template label placement (9 services)
- ✅ Invalid spec labels in auth-service
- ✅ Incorrect port mappings in orchestrator-service
- ✅ Missing monitoring stack
- ✅ Missing environment overlays
- ✅ Missing validation tools
- ✅ Missing documentation

See [VALIDATION-REPORT.md](VALIDATION-REPORT.md) for details.

## Support

For issues or questions:
1. Check the [TESTING-GUIDE.md](TESTING-GUIDE.md) troubleshooting section
2. Review pod logs: `kubectl logs <pod-name> -n jobpilot`
3. Check events: `kubectl get events -n jobpilot`
4. Consult the validation report

## Contributing

When making changes:
1. Update the relevant manifest files
2. Run `./validate-manifests.sh` to validate
3. Test locally with `./test-local.sh`
4. Update documentation if needed
5. Submit changes for review

## License

Copyright (c) 2025 JobPilot AI Platform

---

**Last Updated:** 2025-12-06
**Status:** Production Ready
**Version:** 1.0.0
