# ApplyForUs Infrastructure

## Overview

This directory contains the complete infrastructure-as-code for deploying the ApplyForUs platform to Azure Kubernetes Service (AKS).

## Directory Structure

```
infrastructure/
├── terraform/                    # Terraform modules for Azure resources
│   ├── main.tf                   # Main configuration
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # Output values
│   ├── cosmosdb.tf               # CosmosDB module integration
│   └── modules/
│       ├── aks/                  # AKS cluster
│       ├── acr/                  # Container Registry
│       ├── postgresql/           # Azure PostgreSQL
│       ├── redis/                # Azure Redis Cache
│       ├── keyvault/             # Key Vault
│       └── cosmosdb/             # CosmosDB (SQL API)
│
├── helm/                         # Helm charts
│   ├── app/                      # Main application chart
│   │   ├── Chart.yaml            # Chart metadata
│   │   ├── values.yaml           # Default values
│   │   └── templates/            # K8s templates
│   ├── postgresql/               # Bitnami PostgreSQL values
│   ├── redis/                    # Bitnami Redis values
│   └── ingress-nginx/            # NGINX Ingress values
│
├── kubernetes/                   # Raw Kubernetes manifests
│   ├── network-policies/         # Zero Trust network policies
│   ├── rbac/                     # RBAC roles and bindings
│   └── pod-security/             # Pod Security Standards
│
└── docs/                         # Documentation
    ├── architecture.md           # Architecture overview
    ├── runbook.md                # Operations runbook
    └── disaster-recovery.md      # DR procedures
```

## Quick Start

### Prerequisites

- Azure CLI (`az`) >= 2.50
- Terraform >= 1.6
- Helm >= 3.12
- kubectl >= 1.28
- Docker >= 24.0

### 1. Deploy Infrastructure

```bash
# Login to Azure
az login
az account set --subscription "your-subscription-id"

# Deploy with Terraform
cd infrastructure/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Get AKS credentials
az aks get-credentials --resource-group applyforus-prod-rg --name applyforus-aks
```

### 2. Deploy Application

```bash
# Setup Helm repositories
./scripts/deploy/setup-helm.sh repos

# Build and push Docker images
./scripts/deploy/setup-acr.sh build-push

# Deploy application
./scripts/deploy/aks-deploy.sh -e prod all
```

### 3. Verify Deployment

```bash
# Check pods
kubectl get pods -n applyforus

# Check services
kubectl get svc -n applyforus

# Check ingress
kubectl get ingress -n applyforus
```

## Environment Configuration

| Environment | Namespace | Branch | Auto-Deploy |
|-------------|-----------|--------|-------------|
| Development | applyforus-dev | develop | Yes |
| Staging | applyforus-staging | release/* | Yes |
| Production | applyforus | main | Manual approval |

## Services

| Service | Port | Description |
|---------|------|-------------|
| web | 3000 | Next.js web application |
| auth-service | 8001 | Authentication & JWT |
| user-service | 8002 | User management |
| job-service | 8003 | Job listings |
| resume-service | 8004 | Resume processing |
| notification-service | 8005 | Notifications |
| auto-apply-service | 8006 | Automated applications |
| analytics-service | 8007 | Analytics |
| ai-service | 8000 | AI/ML (Python) |
| payment-service | 8009 | Payments (Stripe) |
| orchestrator-service | 8010 | Workflow orchestration |

## CI/CD Pipelines

### GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci-cd.yml` | push/PR | Full CI/CD pipeline |
| `terraform.yml` | push/schedule | Infrastructure management |
| `docker-build.yml` | manual/reusable | Docker image builds |
| `rollback.yml` | manual | Emergency rollback |

### Running Workflows

```bash
# Trigger Docker build
gh workflow run docker-build.yml -f services=all

# Trigger rollback
gh workflow run rollback.yml \
  -f environment=prod \
  -f rollback_type=helm-previous \
  -f confirm=ROLLBACK
```

## Security

### Network Policies

- Default deny all ingress/egress
- Explicit allow rules for:
  - DNS resolution
  - Ingress controller → services
  - Inter-service communication
  - Database access
  - External APIs
  - Prometheus monitoring

### RBAC

- Separate service accounts per service
- Least privilege role assignments
- Azure Workload Identity integration

### Pod Security

- Restricted Pod Security Standards
- Non-root containers
- Read-only root filesystem
- No privilege escalation

## Monitoring

Access monitoring dashboards:

```bash
# Port forward Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Port forward Prometheus
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090 -n monitoring
```

## Troubleshooting

### Common Issues

1. **Pods not starting**: Check resource quotas and limits
   ```bash
   kubectl describe pod <pod-name> -n applyforus
   ```

2. **Network connectivity**: Verify network policies
   ```bash
   kubectl get networkpolicies -n applyforus
   ```

3. **Image pull errors**: Check ACR authentication
   ```bash
   az acr login --name applyforusacr
   ```

### Logs

```bash
# Service logs
kubectl logs -l app.kubernetes.io/name=<service> -n applyforus --tail=100

# All container logs
kubectl logs <pod-name> --all-containers -n applyforus
```

## Documentation

- [Architecture](./docs/architecture.md) - System architecture
- [Runbook](./docs/runbook.md) - Operations procedures
- [Disaster Recovery](./docs/disaster-recovery.md) - DR plan

## Support

- Platform Team: platform@applyforus.com
- On-call: PagerDuty applyforus-oncall
