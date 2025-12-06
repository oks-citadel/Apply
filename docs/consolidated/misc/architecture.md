# JobPilot AI Platform - System Architecture

This document provides a comprehensive overview of the JobPilot AI Platform architecture, including system design, component interactions, data flow, and technology choices.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture](#system-architecture)
3. [Microservices Architecture](#microservices-architecture)
4. [Data Architecture](#data-architecture)
5. [Communication Patterns](#communication-patterns)
6. [Authentication & Authorization](#authentication--authorization)
7. [Scalability & Performance](#scalability--performance)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Technology Stack](#technology-stack)

## Architecture Overview

JobPilot AI Platform is built using a modern, cloud-native microservices architecture designed for:

- **Scalability**: Horizontal scaling of individual services
- **Resilience**: Fault isolation and graceful degradation
- **Maintainability**: Independent service deployment and versioning
- **Performance**: Optimized for high throughput and low latency
- **Security**: Defense in depth with multiple security layers

### Design Principles

1. **Microservices First**: Each service owns its domain and data
2. **API-First**: Well-defined REST/GraphQL APIs
3. **Event-Driven**: Asynchronous communication via message queues
4. **Cloud-Native**: Container-based, orchestrated with Kubernetes
5. **Security by Design**: Authentication, authorization, and encryption at every layer
6. **Observability**: Comprehensive logging, monitoring, and tracing

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Web App    │    │  Mobile App  │    │  Extension   │              │
│  │  (Next.js)   │    │(React Native)│    │  (Chrome)    │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
└─────────┼────────────────────┼────────────────────┼──────────────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────┐
│                          API GATEWAY LAYER                               │
│                    ┌─────────▼──────────┐                               │
│                    │   API Gateway      │                               │
│                    │   (NestJS/Express) │                               │
│                    │  • Routing         │                               │
│                    │  • Authentication  │                               │
│                    │  • Rate Limiting   │                               │
│                    │  • Request/Response│                               │
│                    │    Transformation  │                               │
│                    └─────────┬──────────┘                               │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────┐
│                       MICROSERVICES LAYER                                │
│    ┌──────────┬──────┼──────┬───────┬──────────┬──────────┬──────────┐ │
│    │          │      │      │       │          │          │          │ │
│ ┌──▼──┐  ┌───▼──┐ ┌─▼───┐ ┌▼────┐ ┌▼───────┐ ┌▼───────┐ ┌▼────────┐ │
│ │Auth │  │User  │ │Resume│ │Job  │ │Auto-   │ │Analytics│ │Notific. │ │
│ │     │  │      │ │      │ │     │ │Apply   │ │        │ │         │ │
│ │:8001│  │:8002 │ │:8003 │ │:8004│ │:8005   │ │:8006   │ │:8007    │ │
│ └─────┘  └──────┘ └──────┘ └─────┘ └────────┘ └────────┘ └─────────┘ │
│                                                                          │
│                          ┌──────────┐                                   │
│                          │ AI Service│                                  │
│                          │ (Python)  │                                  │
│                          │   :8008   │                                  │
│                          └─────┬─────┘                                  │
└────────────────────────────────┼──────────────────────────────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────────────┐
│                       MESSAGE QUEUE LAYER                               │
│                          ┌─────▼─────┐                                 │
│                          │ RabbitMQ  │                                 │
│                          │  • Events │                                 │
│                          │  • Jobs   │                                 │
│                          │  • Queues │                                 │
│                          └───────────┘                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────────────┐
│                          DATA LAYER                                     │
│  ┌────────────┐    ┌────────────┐    ┌──────────────┐                 │
│  │ PostgreSQL │    │   Redis    │    │Elasticsearch │                 │
│  │            │    │            │    │              │                 │
│  │ • User data│    │ • Cache    │    │ • Job search │                 │
│  │ • Resumes  │    │ • Sessions │    │ • Full-text  │                 │
│  │ • Jobs     │    │ • Queues   │    │   search     │                 │
│  │ • Analytics│    │            │    │              │                 │
│  └────────────┘    └────────────┘    └──────────────┘                 │
│                                                                          │
│  ┌────────────┐                                                         │
│  │  AWS S3    │                                                         │
│  │            │                                                         │
│  │ • Resumes  │                                                         │
│  │ • Documents│                                                         │
│  │ • Uploads  │                                                         │
│  └────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Microservices Architecture

### Service Catalog

| Service | Technology | Port | Responsibilities |
|---------|-----------|------|------------------|
| **Auth Service** | NestJS/TypeScript | 8001 | User authentication, JWT token management, OAuth integration, MFA |
| **User Service** | NestJS/TypeScript | 8002 | User profiles, preferences, skills, subscriptions |
| **Resume Service** | NestJS/TypeScript | 8003 | Resume CRUD, versioning, AI parsing, PDF/DOCX generation |
| **Job Service** | NestJS/TypeScript | 8004 | Job aggregation, search, matching, recommendations |
| **Auto-Apply Service** | Python/Selenium | 8005 | Browser automation, form filling, application submission |
| **Analytics Service** | NestJS/TypeScript | 8006 | Metrics collection, reporting, dashboard data |
| **Notification Service** | NestJS/TypeScript | 8007 | Email, SMS, push notifications, in-app messages |
| **AI Service** | Python/FastAPI | 8008 | Resume optimization, job matching, content generation |

### Service Boundaries

Each service follows Domain-Driven Design (DDD) principles:

#### Auth Service Domain
- **Entities**: User, Session, RefreshToken, MFADevice
- **Value Objects**: Email, Password, JWT
- **Aggregates**: User Authentication Context
- **Events**: UserRegistered, UserLoggedIn, PasswordChanged

#### User Service Domain
- **Entities**: User, Profile, Skill, Experience, Education
- **Value Objects**: Name, Location, Salary
- **Aggregates**: User Profile
- **Events**: ProfileUpdated, SkillAdded, SubscriptionChanged

#### Resume Service Domain
- **Entities**: Resume, Section, WorkExperience, Education, Skill
- **Value Objects**: ResumeVersion, Template
- **Aggregates**: Resume Document
- **Events**: ResumeCreated, ResumeUpdated, ResumeExported

#### Job Service Domain
- **Entities**: Job, Company, JobApplication
- **Value Objects**: Salary, Location, JobType
- **Aggregates**: Job Listing
- **Events**: JobPosted, JobMatched, JobSaved

#### Auto-Apply Service Domain
- **Entities**: AutoApplyJob, ApplicationStatus
- **Value Objects**: ApplicationForm, FormField
- **Aggregates**: Application Process
- **Events**: ApplicationStarted, ApplicationCompleted, ApplicationFailed

### Inter-Service Communication

Services communicate using two patterns:

#### 1. Synchronous Communication (REST/HTTP)
- Used for: Request-response operations
- Protocol: RESTful HTTP/HTTPS
- Format: JSON
- Examples:
  - API Gateway → Auth Service: Token validation
  - Resume Service → User Service: Get user profile
  - Job Service → Resume Service: Get resume for matching

#### 2. Asynchronous Communication (Message Queue)
- Used for: Event-driven workflows, background jobs
- Broker: RabbitMQ
- Format: JSON events
- Examples:
  - User registered → Send welcome email
  - Resume updated → Trigger AI optimization
  - Job matched → Notify user
  - Application submitted → Update analytics

### Message Queue Architecture

```
RabbitMQ Exchanges and Queues:

┌─────────────────────────────────────────────────────┐
│                   Exchanges                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  user.events (topic)                                │
│    ├─> user.registered                              │
│    ├─> user.updated                                 │
│    └─> user.deleted                                 │
│                                                      │
│  resume.events (topic)                              │
│    ├─> resume.created                               │
│    ├─> resume.updated                               │
│    └─> resume.exported                              │
│                                                      │
│  job.events (topic)                                 │
│    ├─> job.matched                                  │
│    ├─> job.saved                                    │
│    └─> job.applied                                  │
│                                                      │
│  notification.events (direct)                       │
│    ├─> email.queue                                  │
│    ├─> sms.queue                                    │
│    └─> push.queue                                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Data Architecture

### Database Strategy

We use **Database per Service** pattern:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │  User Service   │    │ Resume Service  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ auth_db         │    │ user_db         │    │ resume_db       │
│ • users         │    │ • profiles      │    │ • resumes       │
│ • sessions      │    │ • skills        │    │ • sections      │
│ • refresh_tokens│    │ • experiences   │    │ • templates     │
│ • mfa_devices   │    │ • education     │    │ • versions      │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Job Service   │    │ Analytics Svc   │    │Auto-Apply Svc   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ job_db          │    │ analytics_db    │    │ autoapply_db    │
│ • jobs          │    │ • metrics       │    │ • applications  │
│ • companies     │    │ • events        │    │ • form_data     │
│ • applications  │    │ • reports       │    │ • statuses      │
│ • saved_jobs    │    │ • dashboards    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Consistency

- **Strong Consistency**: Within service boundaries (ACID transactions)
- **Eventual Consistency**: Across service boundaries (Event sourcing)
- **Saga Pattern**: For distributed transactions

### Caching Strategy

**Redis Cache Layers:**

1. **Session Cache**: User sessions, JWT blacklist
2. **Application Cache**: Frequently accessed data
3. **Query Cache**: Expensive database queries
4. **Rate Limit Cache**: API rate limiting counters

```
┌────────────────────────────────────────┐
│            Redis Cache                  │
├────────────────────────────────────────┤
│                                         │
│  sessions:*          (1 day TTL)       │
│  user:profile:*      (1 hour TTL)      │
│  job:search:*        (15 min TTL)      │
│  resume:*            (30 min TTL)      │
│  rate_limit:*        (1 min TTL)       │
│                                         │
└────────────────────────────────────────┘
```

### Search Architecture

**Elasticsearch Indices:**

```
┌────────────────────────────────────────┐
│         Elasticsearch                   │
├────────────────────────────────────────┤
│                                         │
│  jobs_index                             │
│    • Full-text search on job posts     │
│    • Filters: location, salary, type   │
│    • Ranking: relevance, date          │
│                                         │
│  resumes_index                          │
│    • Full-text search on resumes       │
│    • Skills matching                    │
│    • Experience search                  │
│                                         │
│  companies_index                        │
│    • Company information search         │
│                                         │
└────────────────────────────────────────┘
```

## Communication Patterns

### Request Flow: User Login

```
1. Client → API Gateway: POST /auth/login
2. API Gateway → Auth Service: Validate credentials
3. Auth Service → PostgreSQL: Query user
4. Auth Service → Redis: Create session
5. Auth Service → API Gateway: Return JWT tokens
6. API Gateway → Client: Return response with tokens
```

### Event Flow: Resume Created

```
1. User creates resume via Resume Service
2. Resume Service → PostgreSQL: Save resume
3. Resume Service → RabbitMQ: Publish resume.created event
4. Multiple subscribers receive event:
   - AI Service: Queue for optimization
   - Analytics Service: Track resume creation
   - Notification Service: Send confirmation email
```

### API Gateway Routing

```
/api/auth/*          → Auth Service (8001)
/api/users/*         → User Service (8002)
/api/resumes/*       → Resume Service (8003)
/api/jobs/*          → Job Service (8004)
/api/applications/*  → Auto-Apply Service (8005)
/api/analytics/*     → Analytics Service (8006)
/api/notifications/* → Notification Service (8007)
/api/ai/*            → AI Service (8008)
```

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐                                    ┌─────────────┐
│ Client  │                                    │Auth Service │
└────┬────┘                                    └──────┬──────┘
     │                                                 │
     │ 1. POST /auth/login                            │
     │   (email, password)                            │
     │────────────────────────────────────────────────>│
     │                                                 │
     │                        2. Validate credentials │
     │                           (PostgreSQL + Redis) │
     │                                                 │
     │ 3. Return JWT tokens                           │
     │   (access_token, refresh_token)                │
     │<────────────────────────────────────────────────│
     │                                                 │
     │ 4. Request with token                          │
     │   Authorization: Bearer <access_token>         │
     │────────────────────────────────────────────────>│
     │                                                 │
     │                              5. Validate token │
     │                                                 │
     │ 6. Return protected resource                   │
     │<────────────────────────────────────────────────│
     │                                                 │
```

### Authorization Model

**Role-Based Access Control (RBAC):**

```
Roles:
  - USER: Standard user (default)
  - PREMIUM: Paid subscription
  - ADMIN: Platform administrator
  - SUPER_ADMIN: System administrator

Permissions:
  - resume:read, resume:write, resume:delete
  - job:search, job:apply
  - analytics:view
  - admin:manage_users, admin:view_logs
```

### JWT Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "USER",
    "permissions": ["resume:read", "job:search"],
    "iat": 1234567890,
    "exp": 1234571490
  }
}
```

## Scalability & Performance

### Horizontal Scaling

All services are stateless and can be horizontally scaled:

```
Load Balancer
     │
     ├─> Auth Service (Pod 1)
     ├─> Auth Service (Pod 2)
     └─> Auth Service (Pod 3)
```

### Performance Optimizations

1. **Database Indexing**: All frequently queried fields
2. **Connection Pooling**: Reuse database connections
3. **Caching**: Multi-layer caching strategy
4. **CDN**: Static assets via CloudFront/Azure CDN
5. **Database Read Replicas**: Separate read/write databases
6. **Query Optimization**: Avoid N+1 queries, use joins efficiently

### Load Balancing

- **Layer 7 (Application)**: NGINX/Kubernetes Ingress
- **Database**: PgPool/ProxySQL for connection pooling
- **Cache**: Redis Cluster for high availability

## Security Architecture

### Defense in Depth

```
Layer 1: Network Security
  - VPC/VNET isolation
  - Security groups/NSGs
  - DDoS protection

Layer 2: API Gateway
  - Rate limiting
  - Request validation
  - IP whitelisting/blacklisting

Layer 3: Application Security
  - JWT authentication
  - RBAC authorization
  - Input validation
  - CSRF protection

Layer 4: Data Security
  - Encryption at rest (AES-256)
  - Encryption in transit (TLS 1.3)
  - Database encryption
  - Secrets management (Azure Key Vault)

Layer 5: Monitoring
  - Security scanning
  - Audit logging
  - Intrusion detection
  - SIEM integration
```

### Data Encryption

- **In Transit**: TLS 1.3 for all communications
- **At Rest**: AES-256 for database and file storage
- **Secrets**: Azure Key Vault / AWS Secrets Manager
- **PII**: Field-level encryption for sensitive data

## Deployment Architecture

### Kubernetes Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Namespace: production                              │
│  ┌────────────────────────────────────────────┐    │
│  │  Ingress Controller (NGINX)                │    │
│  │    ├─> Service: web-app                    │    │
│  │    ├─> Service: auth-service               │    │
│  │    └─> Service: api-gateway                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Deployments:                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Web App     │  │Auth Service │  │User Svc   │  │
│  │ Replicas: 3 │  │ Replicas: 3 │  │Replicas: 2│  │
│  └─────────────┘  └─────────────┘  └───────────┘  │
│                                                      │
│  StatefulSets:                                      │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │ PostgreSQL  │  │   Redis     │                  │
│  │ Replicas: 3 │  │ Replicas: 3 │                  │
│  └─────────────┘  └─────────────┘                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### High Availability

- **Service Replicas**: Minimum 2-3 pods per service
- **Database Replication**: Primary + 2 replicas
- **Multi-AZ Deployment**: Services across availability zones
- **Auto-Scaling**: HPA based on CPU/memory/custom metrics

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand, React Query
- **Mobile**: React Native, Expo
- **Extension**: Chrome Extension API (Manifest V3)

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **API Style**: REST + GraphQL
- **Validation**: class-validator, class-transformer
- **ORM**: TypeORM

### AI/ML
- **Framework**: FastAPI (Python)
- **ML Libraries**: Transformers, scikit-learn
- **LLMs**: OpenAI GPT-4, Anthropic Claude
- **Automation**: Selenium, Playwright

### Data Layer
- **Primary DB**: PostgreSQL 15
- **Cache**: Redis 7
- **Search**: Elasticsearch 8
- **Message Queue**: RabbitMQ 3
- **Object Storage**: AWS S3 / Azure Blob

### Infrastructure
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **IaC**: Terraform
- **CI/CD**: GitHub Actions, Azure Pipelines
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Tracing**: Jaeger, OpenTelemetry

## Related Documentation

- [Microservices Details](./architecture/microservices.md)
- [Database Schema](./architecture/database-schema.md)
- [Authentication Flow](./architecture/authentication-flow.md)
- [Event-Driven Architecture](./architecture/event-driven.md)
- [API Documentation](./api/README.md)
- [Deployment Guide](./deployment/README.md)

---

**Last Updated**: 2025-12-05
**Version**: 2.0.0
