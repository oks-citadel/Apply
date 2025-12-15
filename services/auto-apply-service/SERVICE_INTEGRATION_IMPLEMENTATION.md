# Auto-Apply Service - Service-to-Service Integration Implementation

## Overview

This document describes the implementation of real service-to-service integrations in the Auto-Apply Service, replacing placeholder mock data with actual HTTP calls to other microservices.

## Implementation Date
**Completed:** 2025-12-15

## Changes Summary

### 1. Created ServiceClientService (`src/modules/engine/service-client.service.ts`)

A robust service client implementing the **Circuit Breaker Pattern** for resilient inter-service communication.

#### Key Features:
- **Circuit Breaker Pattern**: Prevents cascading failures when services are unavailable
  - States: CLOSED, OPEN, HALF_OPEN
  - Configurable thresholds and timeouts
  - Automatic recovery mechanism
- **Retry Logic**: Automatic retry on transient failures (2 retries with 1s delay)
- **Timeout Management**: 30s timeout for standard requests, 60s for AI operations
- **Error Handling**: Converts service errors to appropriate NestJS exceptions
- **Logging**: Comprehensive logging for monitoring and debugging

#### Circuit Breaker Configuration:
- Failure Threshold: 5 consecutive failures trigger OPEN state
- Success Threshold: 2 consecutive successes in HALF_OPEN restore to CLOSED
- Reset Timeout: 60 seconds before attempting recovery
- Request Timeout: 30 seconds (standard), 60 seconds (AI service)

#### Service Methods:
1. **getJob(jobId)** - Fetch job data from job-service
2. **getUserProfile(userId, authToken?)** - Fetch user profile from user-service
3. **getResume(resumeId, userId, authToken?)** - Fetch resume from resume-service
4. **getUserResumes(userId, authToken?)** - Fetch all user resumes from resume-service
5. **getCoverLetter(coverLetterId, userId, authToken?)** - Fetch cover letter from resume-service
6. **generateCoverLetter(jobData, resumeData, authToken?)** - Generate cover letter via AI service
7. **getCircuitBreakerStatus()** - Get status of all circuit breakers

### 2. Updated EngineController (`src/modules/engine/engine.controller.ts`)

Replaced all placeholder methods with real service integrations:

#### Implemented Methods:

##### `fetchJobData(jobId: string): Promise<JobData>`
- Calls `job-service` via GET `/jobs/:id`
- Maps response to internal `JobData` interface
- Handles field variations (company name, URLs, ATS type)
- Extracts requirements from description if not explicitly provided
- Throws `NotFoundException` on failure

##### `fetchUserProfile(userId: string): Promise<UserProfile>`
- Calls `user-service` via GET `/profile`
- Maps response to internal `UserProfile` interface
- Handles field variations (firstName/first_name, etc.)
- Extracts skills from various formats
- Calculates years of experience from work history if not provided
- Throws `NotFoundException` on failure

##### `fetchResume(resumeId: string, userId: string): Promise<Resume>`
- Calls `resume-service` via GET `/resumes/:id`
- Maps response to internal `Resume` interface
- Extracts skills, experience, and education from sections
- Handles multiple resume formats and field variations
- Throws `NotFoundException` on failure

##### `fetchUserResumes(userId: string): Promise<Resume[]>`
- Calls `resume-service` via GET `/resumes`
- Returns array of resumes
- Handles paginated responses (requests up to 100 resumes)
- Returns empty array on failure (graceful degradation)

##### `fetchCoverLetter(coverLetterId: string, userId: string): Promise<CoverLetter>`
- Calls `resume-service` via GET `/cover-letters/:id`
- Maps response to internal `CoverLetter` interface
- Returns `undefined` on failure (cover letters are optional)
- Logs warning but doesn't throw to allow processing to continue

#### Helper Methods Added:
- `extractRequirements(description)` - Extract requirements from job description
- `extractSkills(profileResponse)` - Extract skills from profile response
- `calculateYearsOfExperience(workExperience[])` - Calculate years from work history
- `extractResumeSkills(resumeResponse)` - Extract skills from resume sections
- `extractExperience(resumeResponse)` - Extract experience from resume sections
- `extractEducation(resumeResponse)` - Extract education from resume sections

### 3. Updated EngineModule (`src/modules/engine/engine.module.ts`)

Added necessary imports and providers:
- Imported `HttpModule` from `@nestjs/axios`
- Added `ServiceClientService` to providers
- Exported `ServiceClientService` for use in other modules

### 4. Updated AppModule (`src/app.module.ts`)

Added global HTTP module configuration:
```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT', 30000),
    maxRedirects: 5,
  }),
})
```

### 5. Updated HealthController (`src/health.controller.ts`)

Added circuit breaker monitoring endpoint:
- **GET `/health/circuit-breakers`** - Returns status of all circuit breakers
- Provides visibility into service health and availability
- Returns states: CLOSED (healthy), OPEN (failing), HALF_OPEN (recovering)

### 6. Updated Environment Configuration (`.env.example`)

Added service URL configurations:
```bash
# External Services
AUTH_SERVICE_URL=http://localhost:8001/api/v1
USER_SERVICE_URL=http://localhost:8002/api/v1
RESUME_SERVICE_URL=http://localhost:8003/api/v1
JOB_SERVICE_URL=http://localhost:8004/api/v1
AI_SERVICE_URL=http://localhost:8007/api/v1

# HTTP Client Configuration
HTTP_TIMEOUT=30000
```

## Service Dependencies

The Auto-Apply Service now depends on the following services:

1. **Job Service** (port 8004)
   - Endpoint: `GET /api/v1/jobs/:id`
   - Used for: Fetching job details and requirements

2. **User Service** (port 8002)
   - Endpoint: `GET /api/v1/profile`
   - Used for: Fetching user profile, skills, and preferences

3. **Resume Service** (port 8003)
   - Endpoints:
     - `GET /api/v1/resumes/:id` - Get specific resume
     - `GET /api/v1/resumes` - Get all user resumes
     - `GET /api/v1/cover-letters/:id` - Get cover letter
   - Used for: Fetching resume and cover letter data

4. **AI Service** (port 8007) - Future use
   - Endpoint: `POST /api/v1/cover-letters/generate`
   - Used for: Generating cover letters (not yet implemented in controller)

## Error Handling Strategy

### Circuit Breaker States
1. **CLOSED** (Normal Operation)
   - All requests pass through
   - Failures are counted
   - Transitions to OPEN after 5 consecutive failures

2. **OPEN** (Failure Mode)
   - All requests immediately fail with `ServiceUnavailableException`
   - No calls are made to the failing service
   - After 60 seconds, transitions to HALF_OPEN

3. **HALF_OPEN** (Recovery Mode)
   - Limited requests are allowed through
   - After 2 consecutive successes, transitions back to CLOSED
   - Any failure returns to OPEN state

### Exception Handling
- **404 Not Found**: Throws `NotFoundException` for missing resources
- **5xx Server Errors**: Throws `ServiceUnavailableException`
- **Network/Timeout Errors**: Throws `ServiceUnavailableException`
- **Circuit Breaker OPEN**: Throws `ServiceUnavailableException`

### Graceful Degradation
- **Cover Letters**: Returns `undefined` if unavailable (optional field)
- **User Resumes**: Returns empty array if service fails
- **Required Data**: Throws exceptions to prevent partial applications

## Testing Recommendations

### Unit Tests
1. Test ServiceClientService circuit breaker logic
2. Test error handling and retry mechanisms
3. Test response mapping in EngineController
4. Mock HTTP calls for isolated testing

### Integration Tests
1. Test end-to-end application flow with all services
2. Test service failure scenarios
3. Test circuit breaker behavior under load
4. Test recovery from service outages

### Load Tests
1. Test concurrent applications
2. Test circuit breaker under high failure rates
3. Test timeout handling under slow services

## Monitoring and Observability

### Health Check Endpoints
- `GET /health/circuit-breakers` - Circuit breaker status
- `GET /health/ready` - Service readiness (includes dependencies)
- `GET /health/live` - Service liveness

### Logging
All service calls are logged with:
- Request details (service name, endpoint, parameters)
- Response status
- Errors and failures
- Circuit breaker state changes

### Metrics to Monitor
1. Circuit breaker state changes
2. Service call success/failure rates
3. Average response times per service
4. Timeout occurrences
5. Retry counts

## Configuration

All service URLs can be configured via environment variables:
- `JOB_SERVICE_URL` - Job service base URL
- `USER_SERVICE_URL` - User service base URL
- `RESUME_SERVICE_URL` - Resume service base URL
- `AI_SERVICE_URL` - AI service base URL
- `HTTP_TIMEOUT` - HTTP request timeout (milliseconds)

## Migration Notes

### Before (Mock Implementation)
- All methods returned hardcoded mock data
- No external service dependencies
- No error handling for service failures
- No resilience patterns

### After (Real Implementation)
- All methods make actual HTTP calls to microservices
- Full circuit breaker implementation
- Comprehensive error handling
- Retry logic and timeout management
- Response mapping for flexibility
- Health monitoring capabilities

## Files Modified

1. **New Files:**
   - `src/modules/engine/service-client.service.ts` (new)

2. **Modified Files:**
   - `src/modules/engine/engine.controller.ts`
   - `src/modules/engine/engine.module.ts`
   - `src/app.module.ts`
   - `src/health.controller.ts`
   - `.env.example`

## Next Steps

1. **Authentication**: Add JWT token passing for authenticated service calls
2. **Caching**: Implement response caching to reduce service calls
3. **Rate Limiting**: Add rate limiting for external service calls
4. **Metrics**: Add Prometheus metrics for circuit breaker monitoring
5. **Service Discovery**: Consider service mesh or discovery service
6. **Cover Letter Generation**: Implement AI service integration for cover letters

## Security Considerations

1. Service URLs should be secured and validated
2. Implement service-to-service authentication
3. Use TLS for all inter-service communication in production
4. Sanitize and validate all external service responses
5. Implement rate limiting to prevent abuse
6. Monitor for unusual service call patterns

## Performance Considerations

1. Circuit breaker prevents cascading failures
2. Retry logic helps recover from transient failures
3. Timeouts prevent hanging requests
4. Connection pooling handled by axios
5. Consider implementing request caching for frequently accessed data

## Dependencies

Required npm packages (already installed):
- `@nestjs/axios` - HTTP client for NestJS
- `rxjs` - Reactive extensions for async operations
- `axios` - HTTP client library

## Conclusion

The Auto-Apply Service now implements robust, production-ready service-to-service integrations with:
- Circuit breaker pattern for resilience
- Comprehensive error handling
- Flexible response mapping
- Health monitoring
- Proper logging and observability

All placeholder TODO comments have been removed and replaced with real implementations.
