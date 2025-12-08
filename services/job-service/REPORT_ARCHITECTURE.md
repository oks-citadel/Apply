# Job Report Persistence - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│                  (Web App, Mobile App, API Clients)             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Controllers                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  JobsController  │  │ ReportsController│  │ JobReports   │  │
│  │                  │  │                  │  │ Controller   │  │
│  │ POST /jobs/:id/  │  │ GET /reports     │  │ GET /jobs/   │  │
│  │      report      │  │ GET /reports/    │  │    :id/      │  │
│  │                  │  │     my-reports   │  │    reports   │  │
│  │ GET /jobs/:id/   │  │ GET /reports/    │  │              │  │
│  │     has-reported │  │     stats        │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Dependency Injection
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Service Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     JobsService                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  reportJob(jobId, dto, userId)                     │  │   │
│  │  │  - Validates job exists                            │  │   │
│  │  │  - Maps DTO format                                 │  │   │
│  │  │  - Calls reportsService.createReport()             │  │   │
│  │  │  - Returns report ID                               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  getJobReports(jobId, page, limit)                 │  │   │
│  │  │  - Proxies to reportsService                       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  hasUserReportedJob(userId, jobId)                 │  │   │
│  │  │  - Checks duplicate reports                        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                 │                                │
│                                 │ Calls                          │
│                                 ▼                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ReportsService                         │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  createReport(jobId, userId, dto)                  │  │   │
│  │  │  - Validates job exists                            │  │   │
│  │  │  - Checks for duplicates                           │  │   │
│  │  │  - Creates report entity                           │  │   │
│  │  │  - Saves to database                               │  │   │
│  │  │  - Returns ReportResponseDto                       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  getReports(queryDto)                              │  │   │
│  │  │  - Filters by status, type, user, job              │  │   │
│  │  │  - Supports pagination                             │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  getReportsByJobId(jobId, page, limit)             │  │   │
│  │  │  getReportsByUserId(userId, page, limit)           │  │   │
│  │  │  updateReport(reportId, adminId, dto)              │  │   │
│  │  │  deleteReport(reportId)                            │  │   │
│  │  │  getReportStats()                                  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ TypeORM
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Repository Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐           ┌──────────────────────────┐    │
│  │  JobRepository   │           │  JobReportRepository     │    │
│  │  (Job Entity)    │           │  (JobReport Entity)      │    │
│  └──────────────────┘           └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ SQL Queries
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL Database                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      jobs Table                            │ │
│  │  - id (PK)                                                 │ │
│  │  - title, description, company_name                        │ │
│  │  - is_active, view_count, save_count, application_count   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                 │                                │
│                                 │ FK (job_id)                    │
│                                 ▼                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   job_reports Table                        │ │
│  │  - id (PK)                                                 │ │
│  │  - job_id (FK → jobs.id)                                  │ │
│  │  - user_id                                                 │ │
│  │  - report_type (ENUM)                                      │ │
│  │  - reason, description                                     │ │
│  │  - status (ENUM)                                           │ │
│  │  - resolved_by, resolved_at, resolution_notes             │ │
│  │  - metadata (JSONB)                                        │ │
│  │  - created_at, updated_at                                  │ │
│  │                                                            │ │
│  │  UNIQUE INDEX: (user_id, job_id) ← Prevent duplicates     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Creating a Report

```
┌──────┐      ┌──────────────┐      ┌─────────────┐      ┌────────────────┐
│Client│      │JobsController│      │JobsService  │      │ReportsService  │
└──┬───┘      └──────┬───────┘      └──────┬──────┘      └───────┬────────┘
   │                 │                     │                     │
   │ POST /jobs/     │                     │                     │
   │  :id/report     │                     │                     │
   ├────────────────►│                     │                     │
   │                 │  reportJob()        │                     │
   │                 ├────────────────────►│                     │
   │                 │                     │                     │
   │                 │                     │ Validate job exists │
   │                 │                     ├─────────────┐       │
   │                 │                     │             │       │
   │                 │                     │◄────────────┘       │
   │                 │                     │                     │
   │                 │                     │ createReport()      │
   │                 │                     ├────────────────────►│
   │                 │                     │                     │
   │                 │                     │                     │ Check job exists
   │                 │                     │                     ├──────────┐
   │                 │                     │                     │          │
   │                 │                     │                     │◄─────────┘
   │                 │                     │                     │
   │                 │                     │                     │ Check duplicates
   │                 │                     │                     ├──────────┐
   │                 │                     │                     │          │
   │                 │                     │                     │◄─────────┘
   │                 │                     │                     │
   │                 │                     │                     │ Save to DB
   │                 │                     │                     ├──────────┐
   │                 │                     │                     │          │
   │                 │                     │                     │◄─────────┘
   │                 │                     │  ReportResponseDto  │
   │                 │                     │◄────────────────────┤
   │                 │                     │                     │
   │                 │ Report with ID      │                     │
   │                 │◄────────────────────┤                     │
   │                 │                     │                     │
   │   Response      │                     │                     │
   │◄────────────────┤                     │                     │
   │                 │                     │                     │
```

### Admin Resolving a Report

```
┌──────┐     ┌──────────────────┐     ┌────────────────┐     ┌──────────┐
│Admin │     │ReportsController │     │ReportsService  │     │Database  │
└──┬───┘     └────────┬─────────┘     └───────┬────────┘     └────┬─────┘
   │                  │                       │                   │
   │ PATCH /reports/  │                       │                   │
   │     :id          │                       │                   │
   ├─────────────────►│                       │                   │
   │                  │  updateReport()       │                   │
   │                  ├──────────────────────►│                   │
   │                  │                       │ Find report       │
   │                  │                       ├──────────────────►│
   │                  │                       │                   │
   │                  │                       │ Report entity     │
   │                  │                       │◄──────────────────┤
   │                  │                       │                   │
   │                  │                       │ Update status     │
   │                  │                       │ Set resolved_by   │
   │                  │                       │ Set resolved_at   │
   │                  │                       ├──────────┐        │
   │                  │                       │          │        │
   │                  │                       │◄─────────┘        │
   │                  │                       │                   │
   │                  │                       │ Save to DB        │
   │                  │                       ├──────────────────►│
   │                  │                       │                   │
   │                  │                       │ If spam/expired/  │
   │                  │                       │ inappropriate:    │
   │                  │                       │ Deactivate job    │
   │                  │                       ├──────────────────►│
   │                  │                       │                   │
   │                  │ Updated report        │                   │
   │                  │◄──────────────────────┤                   │
   │                  │                       │                   │
   │   Response       │                       │                   │
   │◄─────────────────┤                       │                   │
   │                  │                       │                   │
```

## Module Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                        AppModule                             │
│                                                              │
│  ┌────────────────┐      ┌─────────────────────────────┐    │
│  │   JobsModule   │──────│     ReportsModule           │    │
│  │                │import│                             │    │
│  │  Components:   │      │  Components:                │    │
│  │  - Controller  │      │  - ReportsController        │    │
│  │  - Service     │      │  - JobReportsController     │    │
│  │  - Entities    │      │  - ReportsService           │    │
│  │  - DTOs        │      │  - JobReport Entity         │    │
│  │                │      │  - DTOs                     │    │
│  │  Depends on:   │      │  - Enums                    │    │
│  │  - ReportsModule      │                             │    │
│  │  - SearchModule│      │  Exports:                   │    │
│  └────────────────┘      │  - ReportsService           │    │
│                          └─────────────────────────────┘    │
│                                                              │
│  ┌────────────────┐                                         │
│  │  SearchModule  │                                         │
│  └────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### 1. User Reports a Job

```
Request:
  POST /jobs/abc-123/report
  Headers:
    Authorization: Bearer eyJhbGc...
  Body:
    {
      "reason": "spam",
      "details": "Fraudulent posting"
    }

Flow:
  1. JobsController.reportJob() receives request
  2. Extracts user ID from JWT token
  3. Calls JobsService.reportJob(jobId, dto, userId)
  4. JobsService validates job exists in job_repository
  5. JobsService maps DTO and calls ReportsService.createReport()
  6. ReportsService checks for duplicate (user_id + job_id)
  7. ReportsService creates JobReport entity
  8. ReportsService saves to database
  9. Response flows back with report ID

Response:
  {
    "message": "Job reported successfully...",
    "reportId": "def-456"
  }
```

### 2. Admin Reviews Reports

```
Request:
  GET /reports?status=pending&page=1&limit=20
  Headers:
    Authorization: Bearer eyJhbGc... (admin token)

Flow:
  1. ReportsController.getReports() receives request
  2. Validates admin role via AdminGuard
  3. Calls ReportsService.getReports(queryDto)
  4. Service builds TypeORM query with filters
  5. Executes findAndCount() with pagination
  6. Maps entities to DTOs
  7. Returns paginated response

Response:
  {
    "data": [...reports...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
```

## Security Layers

```
┌───────────────────────────────────────────────────────────┐
│                    Security Layers                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  1. Authentication (JWT)                                  │
│     ┌─────────────────────────────────────────────┐      │
│     │  AuthGuard validates JWT token              │      │
│     │  Extracts user ID and roles                 │      │
│     └─────────────────────────────────────────────┘      │
│                                                           │
│  2. Authorization (Role-Based)                            │
│     ┌─────────────────────────────────────────────┐      │
│     │  AdminGuard checks user role                │      │
│     │  Only admins can access certain endpoints   │      │
│     └─────────────────────────────────────────────┘      │
│                                                           │
│  3. Rate Limiting                                         │
│     ┌─────────────────────────────────────────────┐      │
│     │  RateLimitGuard prevents abuse              │      │
│     │  Limits report submissions per user         │      │
│     └─────────────────────────────────────────────┘      │
│                                                           │
│  4. Input Validation                                      │
│     ┌─────────────────────────────────────────────┐      │
│     │  class-validator decorators                 │      │
│     │  Enum validation for report types           │      │
│     │  String length limits                       │      │
│     └─────────────────────────────────────────────┘      │
│                                                           │
│  5. Database Constraints                                  │
│     ┌─────────────────────────────────────────────┐      │
│     │  UNIQUE (user_id, job_id) prevents spam     │      │
│     │  Foreign key constraints maintain integrity │      │
│     │  NOT NULL constraints on required fields    │      │
│     └─────────────────────────────────────────────┘      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Entity Relationships

```
┌─────────────────────────────────┐
│             Job                 │
│  ┌───────────────────────────┐  │
│  │  id: UUID (PK)            │  │
│  │  title: string            │  │
│  │  description: text        │  │
│  │  company_name: string     │  │
│  │  is_active: boolean       │  │
│  │  created_at: timestamp    │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
                │
                │ 1:N
                │
                ▼
┌─────────────────────────────────┐
│          JobReport              │
│  ┌───────────────────────────┐  │
│  │  id: UUID (PK)            │  │
│  │  job_id: UUID (FK)        │◄─┘
│  │  user_id: UUID            │
│  │  report_type: enum        │
│  │  reason: string           │
│  │  description: text        │
│  │  status: enum             │
│  │  resolved_by: UUID        │
│  │  resolved_at: timestamp   │
│  │  resolution_notes: text   │
│  │  metadata: jsonb          │
│  │  created_at: timestamp    │
│  │  updated_at: timestamp    │
│  │                           │
│  │  UNIQUE(user_id, job_id)  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## State Machine: Report Status

```
                    ┌──────────┐
                    │ PENDING  │ ← Initial state
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐          ┌──────────┐
        │ REVIEWED │          │DISMISSED │ ← Final state
        └────┬─────┘          └──────────┘
             │
             │
             ▼
        ┌──────────┐
        │ RESOLVED │ ← Final state
        └──────────┘
             │
             │ (if spam/expired/inappropriate)
             ▼
     Job is deactivated
```

## Component Interaction Timeline

```
User Report Submission:
T0: User clicks "Report Job" button
T1: Frontend sends POST request
T2: JobsController receives request
T3: AuthGuard validates JWT token
T4: JobsService.reportJob() validates job
T5: ReportsService.createReport() called
T6: Database query checks duplicates
T7: New report entity created
T8: Database INSERT operation
T9: Response sent to client
T10: Frontend shows success message

Admin Review:
T0: Admin opens reports dashboard
T1: Frontend sends GET /reports?status=pending
T2: ReportsController receives request
T3: AuthGuard + AdminGuard validate
T4: ReportsService.getReports() queries DB
T5: Results paginated and formatted
T6: Response sent to admin
T7: Admin clicks "Resolve" on a report
T8: Frontend sends PATCH /reports/:id
T9: Report status updated in database
T10: If spam type: Job deactivated
T11: Response confirms resolution
```

## Performance Considerations

### Indexes (for fast queries)

```sql
-- Primary lookup by job
CREATE INDEX idx_job_reports_job_id ON job_reports(job_id);

-- Lookup user's reports
CREATE INDEX idx_job_reports_user_id ON job_reports(user_id);

-- Admin filtering by status
CREATE INDEX idx_job_reports_status ON job_reports(status);

-- Date-based queries
CREATE INDEX idx_job_reports_created_at ON job_reports(created_at);

-- Type-based analytics
CREATE INDEX idx_job_reports_report_type ON job_reports(report_type);

-- Prevent duplicate reports
CREATE UNIQUE INDEX idx_job_reports_user_job_unique
  ON job_reports(user_id, job_id);
```

### Pagination Strategy

```
Large dataset optimization:
- Default limit: 20 items
- Maximum limit: 100 items
- Use offset/limit for simplicity
- Consider cursor-based pagination for very large datasets

Query:
  SELECT * FROM job_reports
  WHERE status = 'pending'
  ORDER BY created_at DESC
  LIMIT 20 OFFSET 0;
```

## Error Handling Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   Validation    │
│  (DTOs, Guards) │
└──────┬──────────┘
       │
       ├─── Validation Error ──► 400 Bad Request
       │
       ▼
┌─────────────────┐
│ Business Logic  │
│   (Services)    │
└──────┬──────────┘
       │
       ├─── Job Not Found ──────► 404 Not Found
       ├─── Already Reported ───► 409 Conflict
       ├─── Unauthorized ───────► 401 Unauthorized
       ├─── Forbidden ──────────► 403 Forbidden
       │
       ▼
┌─────────────────┐
│   Database      │
└──────┬──────────┘
       │
       ├─── DB Error ───────────► 500 Internal Server Error
       │
       ▼
┌─────────────────┐
│   Success       │
│  200/201 OK     │
└─────────────────┘
```

This architecture ensures scalability, maintainability, and security for the job report persistence feature.
