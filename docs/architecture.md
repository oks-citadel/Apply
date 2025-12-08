# JobPilot AI Platform - System Architecture

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [High-Level Architecture](#high-level-architecture)
- [Microservices Architecture](#microservices-architecture)
- [Data Architecture](#data-architecture)
- [Infrastructure Architecture](#infrastructure-architecture)
- [Security Architecture](#security-architecture)
- [Scalability & Performance](#scalability--performance)
- [Technology Stack](#technology-stack)

## Overview

JobPilot AI Platform is built using a modern microservices architecture pattern, designed for scalability, maintainability, and high availability. The system is containerized using Docker and orchestrated with Kubernetes, supporting deployment across multiple cloud providers.

### Design Goals

1. **Scalability**: Handle millions of users and job applications
2. **Reliability**: 99.9% uptime with fault tolerance
3. **Maintainability**: Clean code, modular design, comprehensive testing
4. **Performance**: Sub-second response times for critical operations
5. **Security**: Enterprise-grade security with data encryption and compliance
6. **Extensibility**: Easy to add new features and integrations

## Architecture Principles

### 1. Microservices Pattern

Each service is:
- **Independent**: Can be developed, deployed, and scaled independently
- **Single Responsibility**: Focused on one business domain
- **Loosely Coupled**: Communicates via well-defined APIs
- **Technology Agnostic**: Can use different tech stacks per service

### 2. Domain-Driven Design (DDD)

Services are organized around business domains:
- Authentication & Authorization
- User Management
- Job Management
- Resume Management
- Application Tracking
- Analytics & Reporting
- AI/ML Operations
- Notifications

### 3. API-First Design

- RESTful APIs with OpenAPI/Swagger documentation
- Consistent response formats across services
- Versioned endpoints for backward compatibility
- GraphQL endpoint for complex data queries (future)

### 4. Event-Driven Architecture

- Asynchronous communication via message queues
- Event sourcing for audit trails
- CQRS (Command Query Responsibility Segregation) pattern
- Real-time updates via WebSockets

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Web App     │  Mobile App  │  Extension   │  3rd Party APIs    │
│  (Next.js)   │  (React Native)│ (Chrome)   │  (REST/GraphQL)    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer                 │
│         (NGINX / AWS ALB / Azure Application Gateway)            │
│  - Request Routing   - Load Balancing   - Rate Limiting          │
│  - SSL Termination   - Authentication   - Request Transformation │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Microservices Layer                        │
├──────────┬──────────┬──────────┬──────────┬────────────────────┤
│   Auth   │   User   │  Resume  │   Job    │   Auto-Apply       │
│  Service │  Service │  Service │  Service │    Service         │
│  :8001   │  :8002   │  :8003   │  :8004   │    :8005           │
├──────────┼──────────┼──────────┼──────────┼────────────────────┤
│ Analytics│ Notification│   AI   │Orchestrator│                 │
│  Service │  Service │  Service │  Service │                    │
│  :8006   │  :8007   │  :8000   │  :8008   │                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Message Queue Layer                         │
│  ┌──────────────────┐              ┌────────────────────┐       │
│  │    RabbitMQ      │              │    Redis Pub/Sub   │       │
│  │  Message Broker  │              │   Event Streaming  │       │
│  └──────────────────┘              └────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
├────────────┬────────────┬──────────────┬────────────────────────┤
│ PostgreSQL │   Redis    │ Elasticsearch│     AWS S3             │
│  (Primary) │  (Cache)   │   (Search)   │  (File Storage)        │
│   :5432    │   :6379    │    :9200     │                        │
└────────────┴────────────┴──────────────┴────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├──────────┬──────────┬──────────┬──────────┬────────────────────┤
│  OpenAI  │ SendGrid │LinkedIn  │  Indeed  │    Stripe          │
│   API    │  (Email) │   API    │   API    │  (Payments)        │
└──────────┴──────────┴──────────┴──────────┴────────────────────┘
```

## Microservices Architecture

### Service Catalog

#### 1. Auth Service (Port 8001)

**Responsibility**: Authentication and authorization

**Key Features**:
- User registration and login
- JWT token generation and validation
- OAuth integration (Google, LinkedIn, GitHub)
- Multi-factor authentication (MFA)
- Password reset and email verification
- Session management

**Technologies**: Node.js, TypeScript, NestJS, Passport.js

**Database**: PostgreSQL (users, sessions, tokens)

**APIs**:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/verify-email` - Email verification

#### 2. User Service (Port 8002)

**Responsibility**: User profile and preferences management

**Key Features**:
- User profile CRUD operations
- Skills and experience management
- Job preferences and alerts
- Subscription management
- User settings and preferences
- Profile photo upload

**Technologies**: Node.js, TypeScript, NestJS

**Database**: PostgreSQL (user profiles, skills, preferences)

**APIs**:
- `GET /api/v1/users/:id` - Get user profile
- `PATCH /api/v1/users/:id` - Update user profile
- `POST /api/v1/users/:id/skills` - Add skills
- `GET /api/v1/users/:id/preferences` - Get preferences

#### 3. Resume Service (Port 8003)

**Responsibility**: Resume creation, management, and parsing

**Key Features**:
- Resume CRUD operations
- Resume parsing (PDF, DOCX to structured data)
- AI-powered resume optimization
- Multiple resume versions
- Resume export (PDF, DOCX, TXT)
- Template management
- Resume sharing and public links

**Technologies**: Node.js, TypeScript, NestJS, Python (parsing)

**Database**: PostgreSQL (resume data, versions)

**Storage**: AWS S3 (resume files)

**APIs**:
- `POST /api/v1/resumes` - Create resume
- `GET /api/v1/resumes/:id` - Get resume
- `PATCH /api/v1/resumes/:id` - Update resume
- `POST /api/v1/resumes/parse` - Parse uploaded resume
- `POST /api/v1/resumes/:id/optimize` - AI optimization
- `GET /api/v1/resumes/:id/export` - Export resume

#### 4. Job Service (Port 8004)

**Responsibility**: Job listings, search, and matching

**Key Features**:
- Job aggregation from multiple sources
- Advanced job search and filtering
- Job recommendations based on user profile
- Saved jobs and job alerts
- Job details and company information
- Salary prediction using ML
- Interview question generation
- Job reporting and flagging

**Technologies**: Node.js, TypeScript, NestJS

**Database**: PostgreSQL (job listings, saved jobs)

**Search**: Elasticsearch (job search indexing)

**APIs**:
- `GET /api/v1/jobs` - Search jobs
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs/:id/save` - Save job
- `GET /api/v1/jobs/recommendations` - Get recommendations
- `POST /api/v1/jobs/:id/match-score` - Get match score
- `POST /api/v1/jobs/:id/interview-questions` - Generate questions

#### 5. Auto-Apply Service (Port 8005)

**Responsibility**: Automated job application submission

**Key Features**:
- Automated application to job boards
- Browser automation (Playwright)
- Application tracking and status updates
- Auto-apply settings and preferences
- Application history and analytics
- Rate limiting per platform
- CAPTCHA handling

**Technologies**: Node.js, TypeScript, NestJS, Playwright

**Database**: PostgreSQL (applications, settings)

**Queue**: RabbitMQ (application jobs)

**APIs**:
- `POST /api/v1/applications` - Submit application
- `GET /api/v1/applications` - List applications
- `GET /api/v1/applications/:id` - Get application status
- `PATCH /api/v1/applications/:id` - Update application
- `POST /api/v1/auto-apply/settings` - Configure auto-apply
- `POST /api/v1/auto-apply/start` - Start auto-apply

#### 6. Analytics Service (Port 8006)

**Responsibility**: Analytics, metrics, and reporting

**Key Features**:
- Application success rate tracking
- User engagement metrics
- Job market analytics
- Performance dashboards
- Custom reports and exports
- A/B testing analytics
- User behavior tracking

**Technologies**: Node.js, TypeScript, NestJS

**Database**: PostgreSQL (analytics data)

**Cache**: Redis (metrics aggregation)

**APIs**:
- `GET /api/v1/analytics/dashboard` - Get dashboard data
- `GET /api/v1/analytics/applications` - Application metrics
- `GET /api/v1/analytics/jobs` - Job market analytics
- `POST /api/v1/analytics/track` - Track custom event

#### 7. Notification Service (Port 8007)

**Responsibility**: Email, push, and in-app notifications

**Key Features**:
- Email notifications (SendGrid)
- Push notifications (Firebase)
- In-app notifications
- Notification preferences management
- Email templates
- Batch notifications
- Notification history

**Technologies**: Node.js, TypeScript, NestJS

**Database**: PostgreSQL (notification history, preferences)

**Queue**: RabbitMQ (notification jobs)

**APIs**:
- `POST /api/v1/notifications/send` - Send notification
- `GET /api/v1/notifications` - List notifications
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `GET /api/v1/notifications/preferences` - Get preferences
- `POST /api/v1/notifications/subscribe` - Subscribe to push

#### 8. AI Service (Port 8000)

**Responsibility**: AI/ML operations and intelligence

**Key Features**:
- Resume parsing and analysis
- Job matching algorithm
- Resume optimization suggestions
- Cover letter generation
- Salary prediction
- Interview question generation
- Skills gap analysis
- Vector embeddings (resume/job similarity)

**Technologies**: Python, FastAPI, OpenAI API, scikit-learn

**Database**: PostgreSQL (AI models metadata)

**Vector DB**: Pinecone (embeddings)

**APIs**:
- `POST /api/v1/ai/parse-resume` - Parse resume
- `POST /api/v1/ai/match-jobs` - Match jobs to resume
- `POST /api/v1/ai/optimize-resume` - Optimize resume
- `POST /api/v1/ai/generate-cover-letter` - Generate cover letter
- `POST /api/v1/ai/predict-salary` - Predict salary
- `POST /api/v1/ai/generate-questions` - Generate interview questions

#### 9. Orchestrator Service (Port 8008)

**Responsibility**: Workflow orchestration and service coordination

**Key Features**:
- Multi-service workflow coordination
- Saga pattern implementation
- Distributed transaction management
- Service health monitoring
- Circuit breaker implementation
- Retry logic and fallback strategies

**Technologies**: Node.js, TypeScript, NestJS

**Database**: PostgreSQL (workflow state)

## Data Architecture

### Database Design

#### PostgreSQL - Primary Database

**Schema Organization**:
- Each service has its own schema (database per service pattern)
- Shared reference data in common schema
- Connection pooling with PgBouncer

**Key Tables by Service**:

**Auth Service**:
- `users` - User authentication data
- `sessions` - Active sessions
- `tokens` - Refresh tokens
- `oauth_providers` - OAuth connections

**User Service**:
- `user_profiles` - User profile information
- `skills` - User skills
- `experiences` - Work experience
- `educations` - Educational background
- `preferences` - User preferences and settings
- `subscriptions` - Subscription tiers

**Resume Service**:
- `resumes` - Resume metadata
- `resume_versions` - Version history
- `resume_sections` - Resume sections (work, education, etc.)
- `resume_templates` - Resume templates

**Job Service**:
- `jobs` - Job listings
- `saved_jobs` - User saved jobs
- `job_alerts` - Job alert configurations
- `companies` - Company information

**Auto-Apply Service**:
- `applications` - Application records
- `application_history` - Application status history
- `auto_apply_settings` - User auto-apply configurations
- `platform_credentials` - Encrypted platform credentials

**Analytics Service**:
- `events` - User events
- `metrics` - Aggregated metrics
- `reports` - Generated reports

**Notification Service**:
- `notifications` - Notification records
- `notification_preferences` - User notification preferences
- `device_tokens` - Push notification device tokens
- `email_templates` - Email templates

### Caching Strategy (Redis)

**Use Cases**:
1. **Session Storage**: User sessions and JWT tokens
2. **API Response Caching**: Frequently accessed data (TTL: 5-15 minutes)
3. **Rate Limiting**: Request counting per user/IP
4. **Job Listings Cache**: Recent job listings (TTL: 1 hour)
5. **User Profile Cache**: Active user profiles (TTL: 30 minutes)
6. **Analytics Aggregation**: Real-time metrics accumulation

**Cache Patterns**:
- Cache-aside (lazy loading)
- Write-through (critical data)
- Cache invalidation on updates
- TTL-based expiration

### Search Engine (Elasticsearch)

**Indexed Data**:
- Job listings (full-text search)
- Resume content (keyword matching)
- Company information
- Skills taxonomy

**Features**:
- Full-text search with relevance scoring
- Fuzzy matching for typo tolerance
- Faceted search and filtering
- Autocomplete suggestions
- Geo-location search

### Message Queue (RabbitMQ)

**Queue Structure**:

1. **Application Queue**: Auto-apply job processing
2. **Notification Queue**: Email and push notifications
3. **Analytics Queue**: Event processing and aggregation
4. **Resume Processing Queue**: Resume parsing and optimization
5. **Job Aggregation Queue**: Job scraping and updates

**Patterns**:
- Work queues for job distribution
- Publish/Subscribe for event broadcasting
- Dead Letter Queues (DLQ) for failed messages
- Message priority for urgent tasks

### File Storage (AWS S3)

**Bucket Structure**:
- `jobpilot-resumes-{env}` - Resume files
- `jobpilot-user-uploads-{env}` - User uploaded files
- `jobpilot-exports-{env}` - Exported documents
- `jobpilot-backups-{env}` - Database backups

**Features**:
- Versioning enabled
- Server-side encryption (AES-256)
- Lifecycle policies for cost optimization
- CloudFront CDN for fast delivery

## Infrastructure Architecture

### Containerization (Docker)

**Container Strategy**:
- One container per service
- Multi-stage builds for optimization
- Alpine Linux base images for smaller size
- Health checks for container monitoring

**Docker Compose**:
- Local development environment
- Service orchestration
- Network isolation
- Volume management

### Orchestration (Kubernetes)

**Cluster Architecture**:
```
┌─────────────────────────────────────────────┐
│            Kubernetes Cluster               │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │        Ingress Controller            │  │
│  │  (NGINX / Traefik / AWS ALB)         │  │
│  └──────────────────────────────────────┘  │
│                    │                        │
│  ┌─────────────────┼─────────────────────┐ │
│  │           Services Layer              │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │ │
│  │  │ Auth │ │ User │ │Resume│ │ Job  │ │ │
│  │  │  Pod │ │  Pod │ │  Pod │ │  Pod │ │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │ │
│  │  │Auto- │ │Analyt│ │Notif │ │  AI  │ │ │
│  │  │Apply │ │ ics  │ │  Pod │ │  Pod │ │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ │ │
│  └───────────────────────────────────────┘ │
│                    │                        │
│  ┌─────────────────┼─────────────────────┐ │
│  │           StatefulSets                │ │
│  │  ┌──────────┐ ┌──────┐ ┌──────────┐  │ │
│  │  │PostgreSQL│ │Redis │ │RabbitMQ  │  │ │
│  │  └──────────┘ └──────┘ └──────────┘  │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Kubernetes Resources**:
- **Deployments**: Stateless services (APIs)
- **StatefulSets**: Stateful services (databases)
- **Services**: Internal service discovery
- **Ingress**: External traffic routing
- **ConfigMaps**: Configuration management
- **Secrets**: Sensitive data (encrypted)
- **PersistentVolumes**: Data persistence
- **HorizontalPodAutoscaler**: Auto-scaling

### CI/CD Pipeline (GitHub Actions)

**Pipeline Stages**:

1. **Build Stage**:
   - Code checkout
   - Dependency installation
   - Linting and type checking
   - Unit tests
   - Build artifacts

2. **Test Stage**:
   - Integration tests
   - E2E tests
   - Security scanning (Trivy, Snyk)
   - Code coverage reporting

3. **Docker Build Stage**:
   - Build Docker images
   - Tag with version and commit hash
   - Push to container registry (ACR/ECR/GCR)

4. **Deploy Stage**:
   - Update Kubernetes manifests
   - Apply deployments
   - Run database migrations
   - Health checks
   - Smoke tests

5. **Post-Deploy Stage**:
   - Notify team (Slack)
   - Update documentation
   - Create release notes

### Cloud Deployment

**Multi-Cloud Support**:
- **Azure**: Azure Kubernetes Service (AKS), Azure Database for PostgreSQL
- **AWS**: Amazon EKS, RDS, S3, CloudFront
- **GCP**: Google Kubernetes Engine (GKE), Cloud SQL

**Infrastructure as Code**:
- Terraform for cloud resources
- Kubernetes manifests for application deployment
- Helm charts for package management

## Security Architecture

### Authentication & Authorization

**Authentication Flow**:
1. User submits credentials
2. Auth Service validates against database
3. JWT access token (15 min) + refresh token (7 days) issued
4. Client stores tokens securely
5. Access token in Authorization header for API requests
6. Refresh token used to get new access token

**Authorization**:
- Role-Based Access Control (RBAC)
- Roles: User, Premium, Admin, Super Admin
- Resource-based permissions
- Service-to-service authentication via API keys

### Data Security

**Encryption**:
- **At Rest**: AES-256 encryption for databases and S3
- **In Transit**: TLS 1.3 for all API communications
- **Secrets**: Encrypted environment variables, Kubernetes Secrets

**Sensitive Data Handling**:
- Password hashing: bcrypt (10 rounds)
- Platform credentials: AES-256-GCM encryption
- PII data: Encrypted columns in database
- Data masking in logs

### Network Security

**Firewall Rules**:
- Microservices in private subnet
- Only API Gateway exposed to internet
- Database accessible only from service layer
- Egress filtering for external API calls

**Rate Limiting**:
- Per-IP rate limiting at gateway
- Per-user rate limiting in services
- Distributed rate limiting via Redis
- Adaptive rate limiting based on load

### Security Best Practices

1. **Input Validation**: Strict validation on all inputs
2. **SQL Injection Prevention**: Parameterized queries, ORMs
3. **XSS Prevention**: Content Security Policy, output encoding
4. **CSRF Protection**: CSRF tokens, SameSite cookies
5. **Dependency Scanning**: Automated vulnerability scanning
6. **Security Headers**: HSTS, X-Frame-Options, CSP
7. **Audit Logging**: All sensitive operations logged
8. **Penetration Testing**: Regular security audits

## Scalability & Performance

### Horizontal Scaling

**Auto-Scaling Strategy**:
- **CPU-based**: Scale when CPU > 70%
- **Memory-based**: Scale when memory > 80%
- **Request-based**: Scale when queue depth > threshold
- **Scheduled**: Pre-scale during peak hours

**Service Scaling Targets**:
- Auth Service: 3-10 replicas
- Job Service: 5-20 replicas (high traffic)
- AI Service: 2-8 replicas (GPU-based)
- Other Services: 2-5 replicas

### Performance Optimization

**Caching Strategy**:
- CDN for static assets
- Redis for API responses
- Browser caching with ETags
- Database query result caching

**Database Optimization**:
- Connection pooling (PgBouncer)
- Read replicas for read-heavy operations
- Database indexing on frequently queried columns
- Query optimization and EXPLAIN analysis
- Partitioning for large tables

**API Optimization**:
- Response compression (gzip)
- Pagination for large datasets
- Field selection (sparse fieldsets)
- Batch endpoints for bulk operations
- GraphQL for efficient data fetching

### Monitoring & Observability

**Metrics Collection**:
- Prometheus for metrics aggregation
- Grafana for visualization
- Custom dashboards per service
- SLI/SLO tracking

**Logging**:
- Centralized logging (ELK Stack / CloudWatch)
- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracing

**Distributed Tracing**:
- OpenTelemetry integration
- Jaeger for trace visualization
- End-to-end request tracking
- Performance bottleneck identification

**Alerting**:
- PagerDuty for critical alerts
- Slack for non-critical notifications
- Alert rules based on SLOs
- On-call rotation

## Technology Stack

### Frontend

- **Framework**: Next.js 14+ (React 18)
- **Language**: TypeScript
- **Styling**: TailwindCSS, shadcn/ui
- **State Management**: React Query, Zustand
- **Forms**: React Hook Form, Zod
- **Testing**: Jest, React Testing Library, Playwright

### Backend

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: TypeORM, Prisma
- **Validation**: class-validator
- **Testing**: Jest, Supertest

### AI/ML Service

- **Language**: Python 3.11+
- **Framework**: FastAPI
- **ML Libraries**: scikit-learn, pandas, numpy
- **AI APIs**: OpenAI, Anthropic Claude
- **Vector DB**: Pinecone
- **Testing**: pytest

### Data Stores

- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: Elasticsearch 8+
- **Message Queue**: RabbitMQ 3.12+
- **Object Storage**: AWS S3

### DevOps & Infrastructure

- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **IaC**: Terraform
- **CI/CD**: GitHub Actions, Azure Pipelines
- **Monitoring**: Prometheus, Grafana, Jaeger
- **Cloud Providers**: Azure, AWS, GCP

### External Services

- **AI**: OpenAI GPT-4, Anthropic Claude
- **Email**: SendGrid
- **Push Notifications**: Firebase Cloud Messaging
- **Payment**: Stripe
- **Job Boards**: LinkedIn API, Indeed API
- **Analytics**: Google Analytics, Mixpanel

## Conclusion

The JobPilot AI Platform is built with modern architecture patterns and best practices to ensure scalability, reliability, and maintainability. The microservices architecture allows independent development and deployment of services, while the comprehensive infrastructure setup enables high availability and performance.

For more details on specific components, see:
- [API Reference](api-reference.md)
- [Database Schema](database-schema.md)
- [Deployment Guide](deployment/README.md)
- [Security Policy](SECURITY.md)
- [Architecture Decision Records](adr/)
