# ApplyForUs Infrastructure Architecture

## Overview

ApplyForUs is a cloud-native job application platform built on Azure Kubernetes Service (AKS) with a microservices architecture. This document describes the infrastructure architecture, components, and deployment topology.

## Architecture Diagram

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                     AZURE CLOUD                              │
                                    │  ┌─────────────────────────────────────────────────────────┐│
                                    │  │              Azure Front Door / CDN                     ││
                                    │  └─────────────────────────┬───────────────────────────────┘│
                                    │                            │                                 │
                                    │  ┌─────────────────────────▼───────────────────────────────┐│
                                    │  │              NGINX Ingress Controller                   ││
                                    │  │              (with TLS termination)                      ││
                                    │  └─────────────────────────┬───────────────────────────────┘│
                                    │                            │                                 │
┌───────────────┐                   │  ┌─────────────────────────▼───────────────────────────────┐│
│   Internet    │◄──────────────────┤  │                  Azure Kubernetes Service              ││
│   Users       │                   │  │                     (AKS Cluster)                       ││
└───────────────┘                   │  │  ┌─────────────────────────────────────────────────────┐││
                                    │  │  │                 applyforus Namespace                │││
                                    │  │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐         │││
                                    │  │  │  │  Web App  │ │Auth Service│ │User Service│        │││
                                    │  │  │  │ (Next.js) │ │ (NestJS)  │ │ (NestJS)  │         │││
                                    │  │  │  └───────────┘ └───────────┘ └───────────┘         │││
                                    │  │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐         │││
                                    │  │  │  │Job Service│ │AI Service │ │Resume Svc │         │││
                                    │  │  │  │ (NestJS)  │ │ (FastAPI) │ │ (NestJS)  │         │││
                                    │  │  │  └───────────┘ └───────────┘ └───────────┘         │││
                                    │  │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐         │││
                                    │  │  │  │Analytics  │ │Notify Svc │ │Auto-Apply │         │││
                                    │  │  │  │ (NestJS)  │ │ (NestJS)  │ │ (NestJS)  │         │││
                                    │  │  │  └───────────┘ └───────────┘ └───────────┘         │││
                                    │  │  │  ┌───────────┐ ┌───────────┐                       │││
                                    │  │  │  │Orchestratr│ │Payment Svc│                       │││
                                    │  │  │  │ (NestJS)  │ │ (NestJS)  │                       │││
                                    │  │  │  └───────────┘ └───────────┘                       │││
                                    │  │  └─────────────────────────────────────────────────────┘││
                                    │  └─────────────────────────────────────────────────────────┘│
                                    │                            │                                 │
                                    │  ┌─────────────────────────▼───────────────────────────────┐│
                                    │  │                    DATA LAYER                           ││
                                    │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐││
                                    │  │  │ PostgreSQL  │ │    Redis    │ │     CosmosDB       │││
                                    │  │  │ (Bitnami)   │ │ (Sentinel)  │ │   (SQL API)        │││
                                    │  │  │  Primary    │ │   Master    │ │ Global Distribution│││
                                    │  │  │  Replica    │ │   Replicas  │ └─────────────────────┘││
                                    │  │  └─────────────┘ └─────────────┘                        ││
                                    │  └─────────────────────────────────────────────────────────┘│
                                    │                                                              │
                                    │  ┌─────────────────────────────────────────────────────────┐│
                                    │  │                  SUPPORT SERVICES                       ││
                                    │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐││
                                    │  │  │Azure KeyVault│ │     ACR    │ │ Azure Service Bus  │││
                                    │  │  │  (Secrets)  │ │  (Images)  │ │   (Messaging)      │││
                                    │  │  └─────────────┘ └─────────────┘ └─────────────────────┘││
                                    │  └─────────────────────────────────────────────────────────┘│
                                    └──────────────────────────────────────────────────────────────┘
```

## Components

### Compute Layer (AKS)

| Component | Description | Technology |
|-----------|-------------|------------|
| AKS Cluster | Managed Kubernetes | Azure Kubernetes Service 1.28+ |
| Node Pools | Auto-scaling worker nodes | Standard_D4s_v3 |
| Ingress | Traffic routing | NGINX Ingress Controller |
| cert-manager | TLS certificates | Let's Encrypt |

### Application Services

| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| web | 3000 | Next.js 14 | Main web application |
| auth-service | 8001 | NestJS | Authentication & JWT |
| user-service | 8002 | NestJS | User management |
| job-service | 8003 | NestJS | Job listings & search |
| resume-service | 8004 | NestJS | Resume parsing & storage |
| notification-service | 8005 | NestJS | Email/push notifications |
| auto-apply-service | 8006 | NestJS | Automated job applications |
| analytics-service | 8007 | NestJS | User analytics & metrics |
| ai-service | 8000 | FastAPI (Python) | AI/ML processing |
| payment-service | 8009 | NestJS | Stripe/Flutterwave payments |
| orchestrator-service | 8010 | NestJS | Workflow orchestration |

### Data Layer

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| PostgreSQL | ACID transactions | Bitnami Helm, Primary + 1 Replica |
| Redis | Caching & sessions | Bitnami Helm, Sentinel HA |
| CosmosDB | NoSQL data | SQL API, Multi-region |

### Supporting Services

| Service | Purpose |
|---------|---------|
| Azure Container Registry | Docker image storage |
| Azure Key Vault | Secrets management |
| Azure Service Bus | Message queuing |
| Azure Monitor | Logging & monitoring |

## Network Architecture

### Network Policies (Zero Trust)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Network Policies                             │
├─────────────────────────────────────────────────────────────────────┤
│  default-deny-all          │ Deny all ingress/egress by default    │
│  allow-dns                 │ Allow CoreDNS access                  │
│  allow-ingress-to-services │ Allow ingress controller → services   │
│  allow-inter-service       │ Allow service-to-service communication│
│  allow-database-access     │ Allow services → databases            │
│  allow-external-services   │ Allow egress to external APIs         │
│  allow-monitoring          │ Allow Prometheus scraping             │
└─────────────────────────────────────────────────────────────────────┘
```

### RBAC Structure

```
ServiceAccounts:
├── applyforus-sa          (main application SA)
├── auth-service-sa        (auth service - needs secret access)
├── job-service-sa         (job service)
├── ai-service-sa          (AI service)
├── payment-service-sa     (payment - needs Stripe secrets)
└── auto-apply-service-sa  (auto-apply service)

Roles:
├── secret-reader          (read specific secrets)
├── configmap-reader       (read configmaps)
├── orchestrator-role      (manage jobs, cronjobs, pods)
└── pod-viewer             (view pods for health checks)
```

## Deployment Topology

### Environments

| Environment | Namespace | Purpose | Auto-deploy |
|-------------|-----------|---------|-------------|
| Development | applyforus-dev | Feature testing | On push to develop |
| Staging | applyforus-staging | Pre-production | On push to release/* |
| Production | applyforus | Live application | Manual approval on main |

### Resource Quotas (Production)

```yaml
ResourceQuota:
  requests.cpu: 50 cores
  requests.memory: 100Gi
  limits.cpu: 100 cores
  limits.memory: 200Gi
  pods: 200
  services: 50
  secrets: 100
  configmaps: 100

LimitRange (per container):
  default: 500m CPU, 512Mi memory
  max: 4 CPU, 8Gi memory
  min: 10m CPU, 32Mi memory
```

## High Availability

### Database HA

- **PostgreSQL**: Primary + Replica with automatic failover
- **Redis**: Sentinel mode with 3-node quorum
- **CosmosDB**: Multi-region with automatic failover

### Application HA

- **Pod Disruption Budgets**: minAvailable: 50%
- **Horizontal Pod Autoscaling**: CPU/Memory based scaling
- **Anti-affinity**: Spread pods across availability zones

## Security

### Authentication Flow

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐
│  Client  │───▶│ Auth Service│───▶│ Azure AD B2C │
└──────────┘    └─────────────┘    └──────────────┘
      │                │
      │     JWT Token  │
      ▼                │
┌──────────┐           │
│ API Call │◀──────────┘
└──────────┘
```

### Secrets Management

- All secrets stored in Azure Key Vault
- External Secrets Operator for K8s integration
- Workload Identity for Azure access
- Automatic rotation every 90 days

### Pod Security Standards

- **Profile**: Restricted
- **runAsNonRoot**: true
- **readOnlyRootFilesystem**: true
- **allowPrivilegeEscalation**: false
- **capabilities**: Drop all

## Monitoring & Observability

### Stack

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection |
| Grafana | Visualization |
| AlertManager | Alerting |
| Loki | Log aggregation |
| Jaeger | Distributed tracing |

### Key Metrics

- Request latency (p50, p95, p99)
- Error rates
- Pod resource usage
- Database connection pools
- Queue depths

## Disaster Recovery

### RTO/RPO Targets

| Tier | RTO | RPO |
|------|-----|-----|
| Critical (auth, payment) | 5 min | 1 min |
| Standard (job, user) | 15 min | 5 min |
| Non-critical (analytics) | 1 hour | 15 min |

### Backup Strategy

- PostgreSQL: Continuous WAL archiving
- Redis: RDB snapshots + AOF
- CosmosDB: Automatic continuous backup

## Infrastructure as Code

### Terraform Modules

```
infrastructure/terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── modules/
│   ├── aks/             # AKS cluster
│   ├── acr/             # Container registry
│   ├── postgresql/      # Azure PostgreSQL
│   ├── redis/           # Azure Redis Cache
│   ├── keyvault/        # Key Vault
│   └── cosmosdb/        # CosmosDB
```

### Helm Charts

```
infrastructure/helm/
├── app/                 # Application chart (all services)
├── postgresql/          # Bitnami PostgreSQL values
├── redis/               # Bitnami Redis values
└── ingress-nginx/       # Ingress controller values
```

## Related Documentation

- [Runbook](./runbook.md) - Operational procedures
- [Disaster Recovery](./disaster-recovery.md) - DR procedures
- [Security](./security.md) - Security guidelines
- [Cost Optimization](./cost-optimization.md) - FinOps practices
