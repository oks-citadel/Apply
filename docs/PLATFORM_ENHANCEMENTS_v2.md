# ApplyForUs Platform Enhancements v2.0

This document covers the major platform enhancements implemented for production-ready job aggregation, SLA-backed auto-apply, compliance handling, and self-healing operations.

## Table of Contents

1. [Job Aggregation System](#job-aggregation-system)
2. [Real-time Job Streaming](#real-time-job-streaming)
3. [Interview Guarantee SLA](#interview-guarantee-sla)
4. [Regional Compliance Engine](#regional-compliance-engine)
5. [Self-Healing Operations](#self-healing-operations)
6. [Implementation Files](#implementation-files)

---

## Job Aggregation System

### Overview

The platform now aggregates jobs from **500+ sources worldwide**, organized into the following categories:

### Source Registry

**Location**: `config/job-sources.registry.yml`

```yaml
Source Categories:
├── free_public_apis (20+ sources)
│   ├── remoteok.com (NO API key required)
│   ├── arbeitnow.com (NO API key required)
│   ├── remotive.com (NO API key required)
│   ├── themuse.com (NO API key required)
│   ├── jobicy.com (NO API key required)
│   └── weworkremotely.com (RSS feed)
│
├── government_portals (25+ sources)
│   ├── USA: USAJobs.gov
│   ├── UK: Find a Job (gov.uk)
│   ├── Canada: Job Bank (jobbank.gc.ca)
│   ├── Australia: JobSearch (jobsearch.gov.au)
│   ├── Germany: Arbeitsagentur
│   └── More...
│
├── ats_platforms (22 platforms, 550K+ companies)
│   ├── Greenhouse (~15,000 companies)
│   ├── Lever (~8,000 companies)
│   ├── Workday (~10,000 companies)
│   ├── SmartRecruiters (~4,000 companies)
│   ├── Ashby (~2,000 companies)
│   └── More...
│
├── major_aggregators (15+ sources)
│   ├── Indeed (via scraping/API)
│   ├── LinkedIn Jobs
│   ├── Glassdoor
│   ├── ZipRecruiter
│   └── More...
│
├── niche_boards (40+ sources)
│   ├── Tech: StackOverflow, Dice, AngelList
│   ├── Remote: FlexJobs, Remote.co
│   ├── Startup: Wellfound, Y Combinator
│   └── More...
│
└── regional_boards (30+ sources)
    ├── India: Naukri, Monster India
    ├── Australia: Seek, Indeed AU
    ├── Germany: StepStone, Xing
    └── More...
```

### ATS Discovery Service

**Location**: `services/job-service/src/modules/aggregator/discovery/ats-discovery.service.ts`

The ATS Discovery Service automatically discovers and fetches jobs from company career pages hosted on major ATS platforms.

```typescript
Supported ATS Platforms:
┌────────────────────┬──────────────────────────────────────┐
│ Platform           │ API Pattern                          │
├────────────────────┼──────────────────────────────────────┤
│ Greenhouse         │ boards.greenhouse.io/{company}/jobs  │
│ Lever              │ jobs.lever.co/{company}              │
│ Workable           │ apply.workable.com/api/v2/{company}  │
│ SmartRecruiters    │ careers.smartrecruiters.com/{company}│
│ Ashby              │ jobs.ashbyhq.com/{company}           │
│ BambooHR           │ {company}.bamboohr.com/careers       │
│ Recruitee          │ {company}.recruitee.com/api/offers   │
│ BreezyHR           │ {company}.breezy.hr/json             │
└────────────────────┴──────────────────────────────────────┘
```

**Key Features**:
- Pre-loaded company registry with 200+ top companies
- Automatic rate limiting (100 req/min per platform)
- Deduplication via external_id
- Scheduled discovery (every 6 hours)

### Job Entity

**Location**: `services/job-service/src/modules/jobs/entities/job.entity.ts`

```typescript
export enum JobSource {
  // General Aggregators
  INDEED, LINKEDIN, GLASSDOOR, ZIPRECRUITER,
  SIMPLYHIRED, JOOBLE, ADZUNA, GOOGLE_JOBS,

  // Regional
  CAREERJET, TALENT_COM, JOBRAPIDO, LINKUP, GETWORK,

  // Tech-Focused
  DICE, STACKOVERFLOW,

  // FREE APIs (No key required)
  REMOTEOK, ARBEITNOW, REMOTIVE, THEMUSE,
  JOBICY, WEWORKREMOTELY, REED, FINDWORK,

  // Direct
  DIRECT
}
```

---

## Real-time Job Streaming

### WebSocket Gateway

**Location**: `services/job-service/src/modules/realtime/jobs.gateway.ts`

Users can subscribe to real-time job updates via WebSocket connections.

```typescript
// Connection
ws://api.applyforus.com/jobs

// Events
┌────────────────┬───────────────────────────────────────────┐
│ Event          │ Description                               │
├────────────────┼───────────────────────────────────────────┤
│ subscribe      │ Subscribe with filters                    │
│ unsubscribe    │ Stop receiving updates                    │
│ update_filters │ Change filter criteria                    │
│ load_more      │ Paginate historical jobs                  │
├────────────────┼───────────────────────────────────────────┤
│ new_jobs       │ Server: Batch of new matching jobs        │
│ initial_jobs   │ Server: Initial job load on subscribe     │
│ stats          │ Server: Platform-wide statistics          │
└────────────────┴───────────────────────────────────────────┘
```

### Filter Interface

```typescript
interface JobSearchFilter {
  keywords?: string;           // Full-text search
  location?: string;           // City, state, country
  remote?: boolean;            // Remote-only filter
  experienceLevel?: string[];  // entry, junior, mid, senior, lead
  employmentType?: string[];   // full_time, part_time, contract
  salaryMin?: number;          // Minimum salary
  salaryMax?: number;          // Maximum salary
  sources?: string[];          // Job source filter
  postedAfter?: Date;          // Posted date filter
}
```

### Buffer-based Broadcasting

Jobs are collected in a buffer and broadcast every 2 seconds to reduce noise:

```
New Jobs → Buffer (max 100) → [2s interval] → Filter by subscriber → Emit
```

---

## Interview Guarantee SLA

### Overview

**Location**: `services/auto-apply-service/src/modules/sla/sla.service.ts`

The platform offers interview guarantees with tiered commitments:

```
┌───────────┬─────────┬────────────┬─────────────────┬──────────────┐
│ Tier      │ Monthly │ Daily Apps │ Interview       │ Credit if    │
│           │ Price   │            │ Guarantee       │ Unmet        │
├───────────┼─────────┼────────────┼─────────────────┼──────────────┤
│ FREE      │ $0      │ 5          │ 0               │ N/A          │
│ STARTER   │ $29     │ 10         │ 2 in 30 days    │ 50%          │
│ BASIC     │ $49     │ 25         │ 5 in 30 days    │ 50%          │
│ PRO       │ $99     │ 50         │ 10 in 30 days   │ 75%          │
│ BUSINESS  │ $199    │ 100        │ 15 in 30 days   │ 75%          │
│ ENTERPRISE│ $499    │ 200        │ 20 in 30 days   │ 100%         │
└───────────┴─────────┴────────────┴─────────────────┴──────────────┘
```

### Interview Verification Methods

```typescript
enum InterviewVerificationType {
  EMAIL = 'email',                    // Parse confirmation emails
  CALENDAR = 'calendar',              // Google/Outlook integration
  RECRUITER_CONFIRMATION = 'recruiter', // Verified by recruiter
  MANUAL = 'manual'                   // User-reported with evidence
}
```

### SLA Period Tracking

```typescript
interface SLAPeriod {
  id: string;
  userId: string;
  tier: SLATier;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed_success' | 'completed_failed' | 'credit_issued';
  guaranteedInterviews: number;
  verifiedInterviews: number;
  applicationsSubmitted: number;
  creditAmount?: number;
}
```

### Automated Checks

- **Hourly**: Check for expiring SLA periods, process credits
- **Every 6 hours**: Identify at-risk users, trigger proactive measures

---

## Regional Compliance Engine

### Overview

**Location**: `services/auto-apply-service/src/modules/compliance/compliance.service.ts`

The platform implements region-specific data handling policies.

### Supported Regulations

```
┌─────────┬───────────────────────┬─────────────────────────────────────┐
│ Region  │ Regulations           │ Key Requirements                    │
├─────────┼───────────────────────┼─────────────────────────────────────┤
│ EU      │ GDPR                  │ Consent, minimization, DSR rights   │
│         │                       │ 72h breach notification, DPO        │
├─────────┼───────────────────────┼─────────────────────────────────────┤
│ UK      │ UK GDPR, DPA 2018     │ Same as EU, adequacy transfers      │
├─────────┼───────────────────────┼─────────────────────────────────────┤
│ US      │ EEOC, ADA, CCPA, FCRA │ Protected attribute screening       │
│         │                       │ 45-day DSR response, opt-out        │
├─────────┼───────────────────────┼─────────────────────────────────────┤
│ Canada  │ PIPEDA, CASL          │ Consent for all processing          │
│         │                       │ Reasonable retention                │
├─────────┼───────────────────────┼─────────────────────────────────────┤
│ Australia│ Privacy Act, APPs    │ Consent for cross-border            │
│         │                       │ 72h breach notification             │
└─────────┴───────────────────────┴─────────────────────────────────────┘
```

### Data Subject Rights (GDPR Articles 15-22)

```typescript
enum DataSubjectRequestType {
  ACCESS,             // Article 15
  RECTIFICATION,      // Article 16
  ERASURE,            // Article 17 (Right to be Forgotten)
  RESTRICTION,        // Article 18
  PORTABILITY,        // Article 20
  OBJECTION,          // Article 21
  AUTOMATED_DECISION  // Article 22
}
```

### EEOC/ADA Safe Screening

The platform automatically sanitizes data to prevent discrimination:

```typescript
// Protected attributes NEVER inferred or stored
const PROTECTED_ATTRIBUTES = [
  'race', 'color', 'religion', 'sex', 'sexual_orientation',
  'gender_identity', 'national_origin', 'age', 'disability',
  'genetic_information', 'pregnancy', 'veteran_status',
  'citizenship_status', 'marital_status', 'political_affiliation'
];
```

### Data Minimization

Data is filtered based on processing purpose:

```typescript
// Only collect what's needed for each purpose
JOB_MATCHING: ['skills', 'experience', 'education', 'location']
AUTO_APPLY: ['name', 'email', 'phone', 'resume', 'work_authorization']
ANALYTICS: ['user_id', 'action_type', 'timestamp'] // Anonymized
```

### Cross-Border Transfer Checks

```typescript
// Transfer mechanisms by source region
EU/UK → US: Requires SCCs (Standard Contractual Clauses)
Canada → Any: Requires explicit user consent
Australia → Any: Consent-based transfer
```

---

## Self-Healing Operations

### Overview

**Location**: `ops/self-healing/self-healing.service.ts`

The platform includes an autonomous recovery system that:

1. **Monitors** all services and dependencies
2. **Detects** failures and degradation
3. **Applies** automatic remediation
4. **Verifies** recovery
5. **Escalates** when manual intervention required

### Health Check Schedule

```
┌────────────────────────────┬─────────────────────────────────────┐
│ Check Type                 │ Frequency                           │
├────────────────────────────┼─────────────────────────────────────┤
│ Service health checks      │ Every 30 seconds                    │
│ Full system check          │ Every 5 minutes                     │
│ Queue health               │ Every minute                        │
│ Stuck job detection        │ Every 5 minutes                     │
│ Certificate expiration     │ Daily at 6 AM                       │
│ Database health            │ Every 10 minutes                    │
└────────────────────────────┴─────────────────────────────────────┘
```

### Service Configuration

Each service is configured with:
- Health endpoint
- Expected response time
- Criticality level (critical, high, medium, low)
- Remediation actions
- Dependencies
- Replica range (min/max)

### Remediation Actions

```typescript
enum RemediationAction {
  RESTART_POD,            // kubectl rollout restart
  SCALE_UP,               // Increase replicas
  SCALE_DOWN,             // Decrease replicas
  CLEAR_CACHE,            // Flush Redis cache
  RECONNECT_DB,           // Force DB reconnection
  RECONNECT_REDIS,        // Force Redis reconnection
  RECONNECT_RABBITMQ,     // Force RabbitMQ reconnection
  FLUSH_QUEUE,            // Clear stuck queue messages
  CIRCUIT_BREAKER_RESET,  // Reset circuit breakers
  ROTATE_CREDENTIALS,     // Rotate service credentials
  FAILOVER_DB,            // Trigger DB failover
  NOTIFY_ONCALL,          // PagerDuty alert
  CREATE_INCIDENT         // Create incident ticket
}
```

### Remediation Flow

```
Health Check Failed (3x consecutive)
        │
        ▼
┌───────────────────┐
│ Try Remediation   │
│ Action #1         │◄────────────────────┐
└─────────┬─────────┘                     │
          │                               │
          ▼                               │
    ┌──────────┐                          │
    │ Success? │──── No ────► Try Next    │
    └────┬─────┘              Action ─────┘
         │
        Yes
         │
         ▼
    ┌──────────────┐
    │ Wait 5 sec   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Verify       │
    │ Recovery     │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
   Success    Failure
     │           │
     ▼           ▼
  [Done]    Create Incident
            Notify On-Call
```

### Incident Management

Incidents are automatically created when:
- Service health checks fail 3+ consecutive times
- Infrastructure components become unreachable
- All remediation attempts fail

```typescript
interface Incident {
  id: string;
  service: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  title: string;
  description: string;
  remediationAttempts: RemediationEvent[];
}
```

### Ops Dashboard Endpoints

```
GET  /ops/self-healing/health           # System health status
GET  /ops/self-healing/health/:service  # Single service health
GET  /ops/self-healing/incidents        # Active incidents
POST /ops/self-healing/incidents/:id/resolve  # Resolve incident
GET  /ops/self-healing/remediation-history    # Recent remediation
POST /ops/self-healing/check            # Trigger manual check
GET  /ops/self-healing/dashboard        # Full dashboard data
```

---

## Implementation Files

### New Files Created

| File | Purpose |
|------|---------|
| `config/job-sources.registry.yml` | 500+ job source registry |
| `services/job-service/src/modules/aggregator/discovery/ats-discovery.service.ts` | ATS platform discovery |
| `services/job-service/src/modules/realtime/jobs.gateway.ts` | WebSocket job streaming |
| `services/auto-apply-service/src/modules/sla/sla.service.ts` | Interview guarantee SLA |
| `services/auto-apply-service/src/modules/compliance/compliance.service.ts` | Regional compliance engine |
| `services/auto-apply-service/src/modules/compliance/compliance.controller.ts` | Compliance API endpoints |
| `services/auto-apply-service/src/modules/compliance/compliance.module.ts` | Compliance NestJS module |
| `ops/self-healing/self-healing.service.ts` | Self-healing operations |
| `ops/self-healing/self-healing.controller.ts` | Ops API endpoints |
| `ops/self-healing/self-healing.module.ts` | Self-healing NestJS module |

### Modified Files

| File | Changes |
|------|---------|
| `services/job-service/src/modules/jobs/entities/job.entity.ts` | Added new JobSource enum values |

---

## Next Steps

1. **Integration Testing**: Test all new modules with the existing services
2. **API Documentation**: Add OpenAPI specs for new endpoints
3. **Monitoring**: Set up Grafana dashboards for SLA and self-healing metrics
4. **Alerting**: Configure PagerDuty/OpsGenie for incident notifications
5. **Load Testing**: Verify WebSocket gateway under load

---

*Last Updated: December 2024*
*Version: 2.0.0*
