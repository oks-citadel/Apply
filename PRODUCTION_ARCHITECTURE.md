# Production Architecture - Azure Native (No Docker Desktop)

## Visual Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 INTERNET                                     │
│                          (Users, Developers, APIs)                           │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                         AZURE FRONT DOOR (Optional)                          │
│                     • Global CDN & Load Balancing                            │
│                     • WAF (Web Application Firewall)                         │
│                     • SSL/TLS Termination                                    │
│                     • DDoS Protection                                        │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                    AZURE KUBERNETES SERVICE (AKS)                            │
│                          applyforus-aks                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INGRESS CONTROLLER (Kong)                        │   │
│  │              • API Gateway & Routing                                │   │
│  │              • Rate Limiting                                        │   │
│  │              • Authentication                                       │   │
│  └────────┬──────────┬──────────┬──────────┬──────────┬───────────────┘   │
│           │          │          │          │          │                     │
│  ┌────────▼─────┐ ┌─▼────────┐ ┌▼────────┐ ┌▼────────┐ ┌▼──────────┐     │
│  │   Web App    │ │  Auth    │ │  User   │ │   Job   │ │  Resume   │     │
│  │  (Next.js)   │ │ Service  │ │ Service │ │ Service │ │  Service  │     │
│  │              │ │          │ │         │ │         │ │           │     │
│  │ Port: 3000   │ │ Port:    │ │ Port:   │ │ Port:   │ │ Port:     │     │
│  │ Replicas: 2  │ │ 8001     │ │ 8002    │ │ 8004    │ │ 8003      │     │
│  └──────────────┘ │ Replicas:│ │Replicas:│ │Replicas:│ │ Replicas: │     │
│                   │ 2        │ │ 2       │ │ 2       │ │ 2         │     │
│  ┌────────────┐   └──────────┘ └─────────┘ └─────────┘ └───────────┘     │
│  │ Auto-Apply │ ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────┐     │
│  │  Service   │ │Analytics │ │   AI     │ │Notification│ │Orchestr.│     │
│  │            │ │ Service  │ │ Service  │ │  Service   │ │ Service │     │
│  │ Port: 8005 │ │Port: 8006│ │Port: 8000│ │Port: 8007  │ │Port:8008│     │
│  │ Replicas:2 │ │Replicas:2│ │Replicas:2│ │Replicas: 2 │ │Replicas │     │
│  └────────────┘ └──────────┘ └──────────┘ └────────────┘ └─────────┘     │
│                                                                               │
│  All pods communicate via Kubernetes internal DNS:                          │
│  http://<service-name>.applyforus.svc.cluster.local:<port>                  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────┘
         │                │               │              │              │
         │                │               │              │              │
         │                │               │              │              │
┌────────▼────────┐ ┌────▼──────┐ ┌──────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
│   PostgreSQL    │ │  Redis    │ │  Service    │ │   Blob   │ │     Key     │
│   Flexible      │ │  Cache    │ │    Bus      │ │ Storage  │ │   Vault     │
│   Server        │ │           │ │             │ │          │ │             │
├─────────────────┤ ├───────────┤ ├─────────────┤ ├──────────┤ ├─────────────┤
│ Version: PG 16  │ │ Tier:     │ │ Namespace:  │ │ Account: │ │ Secrets:    │
│ SKU: GP_Gen5_2  │ │ Premium   │ │ applyforus  │ │ applyfor │ │ - DB creds  │
│ Storage: 128GB  │ │ Cache: 6GB│ │ -servicebus │ │ usstorage│ │ - API keys  │
│ Backup: 7 days  │ │ Port: 6380│ │             │ │          │ │ - JWT secret│
│ SSL: Required   │ │ SSL: Yes  │ │ Queues:     │ │Containers│ │ - OAuth     │
│ HA: Zone        │ │ Persist:  │ │ - jobs      │ │ -resumes │ │   secrets   │
│  Redundant      │ │   Yes     │ │ - notifs    │ │ -uploads │ │             │
│                 │ │           │ │ - analytics │ │ -parsed  │ │             │
│ FQDN:           │ │ FQDN:     │ │             │ │ -docs    │ │             │
│ applyforus-     │ │ applyforus│ │ Endpoint:   │ │          │ │             │
│ postgres.       │ │ -redis.   │ │ sb://apply  │ │          │ │             │
│ postgres.       │ │ redis.    │ │ forus-      │ │          │ │             │
│ database.       │ │ cache.    │ │ servicebus  │ │          │ │             │
│ azure.com:5432  │ │ windows.  │ │ .servicebus │ │          │ │             │
│                 │ │ net:6380  │ │ .windows.net│ │          │ │             │
└─────────────────┘ └───────────┘ └─────────────┘ └──────────┘ └─────────────┘
         │                │               │              │              │
         └────────────────┴───────────────┴──────────────┴──────────────┘
                                      │
                                      │
                         ┌────────────▼──────────────┐
                         │  Application Insights     │
                         │  (Monitoring & Logging)   │
                         │                           │
                         │  • Distributed Tracing    │
                         │  • Performance Metrics    │
                         │  • Log Aggregation        │
                         │  • Alerts & Dashboards    │
                         └───────────────────────────┘
```

---

## Container Registry Flow

```
┌──────────────────┐
│  Developer       │
│  Workstation     │
└────────┬─────────┘
         │
         │ git push
         │
┌────────▼─────────┐
│  GitHub Actions  │
│  CI/CD Pipeline  │
├──────────────────┤
│ 1. Checkout code │
│ 2. Run tests     │
│ 3. Build images  │
│ 4. Security scan │
└────────┬─────────┘
         │
         │ docker push
         │
┌────────▼──────────────────────┐
│  Azure Container Registry     │
│  (ACR)                         │
│  applyforusacr.azurecr.io     │
├────────────────────────────────┤
│ Images:                        │
│ • applyai-web:v1.0.123        │
│ • applyai-auth-service:v1.0.123│
│ • applyai-user-service:v1.0.123│
│ • applyai-job-service:v1.0.123 │
│ • applyai-resume-service:...  │
│ • applyai-auto-apply-service..│
│ • applyai-analytics-service...│
│ • applyai-ai-service:v1.0.123 │
│ • applyai-notification-...    │
│ • applyai-orchestrator-...    │
└────────┬──────────────────────┘
         │
         │ kubectl set image
         │
┌────────▼─────────┐
│  AKS Cluster     │
│  (Production)    │
│                  │
│  Pulls images    │
│  from ACR        │
└──────────────────┘
```

---

## Data Flow Architecture

### User Request Flow

```
1. User Request
   │
   ├─► Front Door (Global routing)
   │   └─► WAF (Security check)
   │
2. AKS Ingress (Kong API Gateway)
   │
   ├─► Authentication (Auth Service)
   │   ├─► Redis (Session check)
   │   └─► PostgreSQL (User verification)
   │
3. Business Logic (Microservices)
   │
   ├─► User Service
   │   └─► PostgreSQL (User data)
   │
   ├─► Job Service
   │   ├─► PostgreSQL (Job data)
   │   └─► Elasticsearch (Job search)
   │
   ├─► Resume Service
   │   ├─► PostgreSQL (Resume metadata)
   │   ├─► Blob Storage (Resume files)
   │   └─► AI Service (Optimization)
   │
   ├─► Auto-Apply Service
   │   ├─► Service Bus (Job queue)
   │   └─► Redis (Rate limiting)
   │
4. Response
   │
   └─► Application Insights (Logging)
```

---

## Service Communication Matrix

| Service | Communicates With | Protocol | Purpose |
|---------|------------------|----------|---------|
| **Web App** | Auth Service | HTTP | User authentication |
| | User Service | HTTP | Profile management |
| | Job Service | HTTP | Job listings |
| | Resume Service | HTTP | Resume operations |
| **Auth Service** | PostgreSQL | TCP | User credentials |
| | Redis | TCP | Session storage |
| | User Service | HTTP | User details |
| **User Service** | PostgreSQL | TCP | User data |
| | Redis | TCP | Caching |
| | Auth Service | HTTP | Token validation |
| **Job Service** | PostgreSQL | TCP | Job storage |
| | Elasticsearch | HTTP | Job search |
| | AI Service | HTTP | Job matching |
| **Resume Service** | PostgreSQL | TCP | Resume metadata |
| | Blob Storage | HTTPS | File storage |
| | AI Service | HTTP | Resume parsing |
| **Auto-Apply Service** | Service Bus | AMQP | Job queue |
| | Job Service | HTTP | Job details |
| | Resume Service | HTTP | Resume data |
| | User Service | HTTP | User preferences |
| **Analytics Service** | PostgreSQL | TCP | Metrics storage |
| | Redis | TCP | Real-time data |
| | Service Bus | AMQP | Event streaming |
| **AI Service** | Redis | TCP | Caching |
| | OpenAI API | HTTPS | LLM requests |
| | Azure OpenAI | HTTPS | Enterprise LLM |
| **Notification Service** | Service Bus | AMQP | Event listening |
| | SendGrid | HTTPS | Email delivery |
| | Firebase | HTTPS | Push notifications |
| **Orchestrator Service** | All Services | HTTP | Workflow coordination |
| | Service Bus | AMQP | Event coordination |

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Virtual Network (VNet)                      │
│                    10.0.0.0/16 (65,536 IPs)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AKS Subnet                                             │   │
│  │  10.0.1.0/24 (256 IPs)                                  │   │
│  │  • Kubernetes nodes                                     │   │
│  │  • Pod network (delegated)                              │   │
│  │  • Load balancers                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Database Subnet                                        │   │
│  │  10.0.2.0/24 (256 IPs)                                  │   │
│  │  • PostgreSQL Flexible Server                           │   │
│  │  • Private endpoints                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Cache Subnet                                           │   │
│  │  10.0.3.0/24 (256 IPs)                                  │   │
│  │  • Azure Redis Cache                                    │   │
│  │  • Private endpoints                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Private Endpoints Subnet                               │   │
│  │  10.0.4.0/24 (256 IPs)                                  │   │
│  │  • Key Vault endpoint                                   │   │
│  │  • Storage Account endpoint                             │   │
│  │  • Service Bus endpoint                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Network Security:
• NSG (Network Security Groups) on each subnet
• Azure Firewall for egress traffic
• Private endpoints for PaaS services
• No public IPs on databases
• VNet peering for cross-region DR
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Perimeter Security                                    │
│  ├─► Azure Front Door WAF (OWASP Top 10)                       │
│  ├─► DDoS Protection Standard                                  │
│  └─► Azure Firewall (Egress filtering)                         │
│                                                                  │
│  Layer 2: Network Security                                      │
│  ├─► Network Security Groups (NSGs)                            │
│  ├─► Private Endpoints (No public IPs)                         │
│  └─► VNet isolation                                            │
│                                                                  │
│  Layer 3: Identity & Access                                     │
│  ├─► Azure AD (Authentication)                                 │
│  ├─► Managed Identities (No passwords)                         │
│  ├─► RBAC (Role-Based Access Control)                          │
│  └─► Key Vault (Secret management)                             │
│                                                                  │
│  Layer 4: Application Security                                  │
│  ├─► JWT tokens (Short-lived)                                  │
│  ├─► OAuth 2.0 / OIDC                                          │
│  ├─► Rate limiting (Kong + Redis)                              │
│  ├─► Input validation                                          │
│  └─► CORS policies                                             │
│                                                                  │
│  Layer 5: Data Security                                         │
│  ├─► TLS 1.3 everywhere                                        │
│  ├─► Data encryption at rest                                   │
│  ├─► PostgreSQL SSL required                                   │
│  ├─► Redis TLS required                                        │
│  └─► Blob Storage encryption                                   │
│                                                                  │
│  Layer 6: Monitoring & Response                                 │
│  ├─► Application Insights (APM)                                │
│  ├─► Azure Security Center                                     │
│  ├─► Log Analytics                                             │
│  └─► Azure Sentinel (SIEM)                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## High Availability & Disaster Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                    High Availability Setup                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AKS Cluster:                                                    │
│  ├─► 3 availability zones                                       │
│  ├─► Auto-scaling: 3-10 nodes                                   │
│  ├─► Pod replicas: 2-5 per service                             │
│  └─► Health checks & liveness probes                           │
│                                                                  │
│  PostgreSQL:                                                     │
│  ├─► Zone-redundant HA                                          │
│  ├─► Automatic failover (< 60s)                                │
│  ├─► Geo-redundant backups (35 days)                           │
│  └─► Point-in-time restore                                     │
│                                                                  │
│  Redis:                                                          │
│  ├─► Premium tier (99.9% SLA)                                   │
│  ├─► Zone redundancy                                            │
│  ├─► Data persistence (RDB + AOF)                              │
│  └─► Geo-replication (optional)                                │
│                                                                  │
│  Storage:                                                        │
│  ├─► LRS (Locally Redundant Storage)                           │
│  ├─► ZRS (Zone-Redundant Storage)                              │
│  ├─► GRS (Geo-Redundant Storage)                               │
│  └─► RA-GRS (Read-Access GRS)                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Recovery Objectives:
• RTO (Recovery Time Objective): < 15 minutes
• RPO (Recovery Point Objective): < 5 minutes
• Backup frequency: Continuous + hourly snapshots
• Disaster Recovery region: West US 2 (secondary)
```

---

## Scaling Strategy

### Horizontal Pod Autoscaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Cluster Autoscaling

```
Node Pools:
├─► System pool: 2-3 nodes (B4ms)
│   • Kubernetes system components
│   • Ingress controller
│
└─► User pool: 3-10 nodes (D4s_v3)
    • Application workloads
    • Auto-scales based on demand
    • Scale-in delay: 10 minutes
```

---

## Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│              Application Insights Dashboard                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │ Request Rate    │  │ Response Time   │  │ Error Rate   │   │
│  │ 1,234 req/min   │  │ Avg: 123ms      │  │ 0.12%        │   │
│  │ ▲ +12%          │  │ P95: 456ms      │  │ ▼ -5%        │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │ Active Users    │  │ Database Conn   │  │ Cache Hit    │   │
│  │ 567 users       │  │ 45/100 active   │  │ 92.3%        │   │
│  │ ▲ +23%          │  │ Avg: 12ms       │  │ ▲ +2%        │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
│                                                                  │
│  Service Health:                                                │
│  ✅ Web App (2/2 pods healthy)                                 │
│  ✅ Auth Service (2/2 pods healthy)                            │
│  ✅ User Service (3/3 pods healthy)                            │
│  ✅ Job Service (2/2 pods healthy)                             │
│  ✅ Resume Service (2/2 pods healthy)                          │
│  ✅ PostgreSQL (Primary + Standby)                             │
│  ✅ Redis (Master + Replica)                                   │
│                                                                  │
│  Alerts (Last 24h):                                             │
│  ⚠️ High CPU on user-service (resolved)                        │
│  ⚠️ Slow query on PostgreSQL (resolved)                        │
│  ✅ No active alerts                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Optimization

### Monthly Estimated Costs (Production)

```
Service                         Tier/SKU              Monthly Cost
─────────────────────────────────────────────────────────────────
AKS Cluster (3-10 nodes)       D4s_v3               $350 - $1,200
PostgreSQL Flexible            GP_Standard_D4s_v3    $250
Azure Redis Cache              Premium P1            $180
Service Bus                    Standard              $10
Blob Storage                   Standard LRS          $25
Container Registry             Premium               $40
Application Insights           Pay-as-you-go         $50
Key Vault                      Standard              $5
Virtual Network                Standard              $0
Front Door (optional)          Premium               $150
─────────────────────────────────────────────────────────────────
Total (baseline):                                    $1,060/month
Total (with scaling):                                $1,910/month

Cost Optimization Strategies:
✅ Reserved instances for predictable workloads
✅ Auto-scaling based on demand
✅ Blob Storage lifecycle policies
✅ Application Insights sampling
✅ Dev/test environments on lower tiers
```

---

## Deployment Workflow

```
┌───────────────┐
│  Developer    │
│  Makes Change │
└───────┬───────┘
        │
        │ git commit & push
        │
┌───────▼────────────────────────────────────────────┐
│  GitHub Actions (CI/CD Pipeline)                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  Stage 1: Build & Test                             │
│  ├─► Checkout code                                 │
│  ├─► Install dependencies (pnpm)                   │
│  ├─► Run linters (ESLint, Prettier)               │
│  ├─► Run unit tests (Jest)                        │
│  └─► Run integration tests                        │
│                                                     │
│  Stage 2: Docker Build                             │
│  ├─► Build Docker images (multi-arch)             │
│  ├─► Run security scan (Trivy)                    │
│  ├─► Tag images with version                      │
│  └─► Push to ACR                                  │
│                                                     │
│  Stage 3: Deploy to AKS                            │
│  ├─► Login to Azure                                │
│  ├─► Set AKS context                               │
│  ├─► Update ConfigMaps/Secrets                     │
│  ├─► Update deployments (kubectl)                 │
│  ├─► Wait for rollout                              │
│  └─► Run smoke tests                               │
│                                                     │
│  Stage 4: Verify                                    │
│  ├─► Check pod health                              │
│  ├─► Test service endpoints                        │
│  ├─► Verify database connections                   │
│  └─► Generate deployment report                    │
│                                                     │
└────────────────────────────────────────────────────┘
        │
        │ Success notification
        │
┌───────▼───────┐
│  Production   │
│  Updated      │
└───────────────┘
```

---

## Summary: Why No Docker Desktop?

### Production Environment

**Docker Desktop is NOT NEEDED because:**

1. ✅ **Container Runtime:** Azure Kubernetes Service provides the runtime
2. ✅ **Image Storage:** Azure Container Registry stores images
3. ✅ **Database:** Azure PostgreSQL Flexible Server (managed)
4. ✅ **Cache:** Azure Redis Cache (managed)
5. ✅ **Message Queue:** Azure Service Bus (managed)
6. ✅ **File Storage:** Azure Blob Storage (managed)
7. ✅ **Secrets:** Azure Key Vault (managed)
8. ✅ **Monitoring:** Application Insights (managed)
9. ✅ **Networking:** Azure VNet & Load Balancers
10. ✅ **Scaling:** Kubernetes Horizontal Pod Autoscaler

**Everything is managed by Azure.**

### Local Development

**Docker Desktop is OPTIONAL because:**

Developers can choose:
- **Option A:** Use Docker Compose for local infrastructure
- **Option B:** Connect directly to Azure dev resources
- **Option C:** Mix of both (local services, cloud databases)

**It's a developer convenience tool, not a production requirement.**

---

**Architecture Document Version:** 1.0.0
**Last Updated:** 2025-12-15
**Production Status:** ACTIVE
**Azure Region:** East US (Primary), West US 2 (DR)
