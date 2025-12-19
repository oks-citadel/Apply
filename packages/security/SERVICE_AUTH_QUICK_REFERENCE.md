# Service-to-Service Authentication - Quick Reference

## Quick Start

### 1. Add to Your Module
```typescript
import { ServiceAuthModule } from '@applyforus/security';

@Module({
  imports: [ServiceAuthModule],
})
export class YourModule {}
```

### 2. Call Another Service
```typescript
import { ServiceAuthService } from '@applyforus/security';

@Injectable()
export class YourClient {
  constructor(private serviceAuth: ServiceAuthService) {}

  async callService() {
    const token = this.serviceAuth.generateServiceToken('your-service-name');

    return axios.post('http://other-service/api/internal/endpoint', data, {
      headers: { 'x-service-auth': token }
    });
  }
}
```

### 3. Protect Your Endpoints
```typescript
import { ServiceAuthGuard } from '@applyforus/security';

@Controller('api/internal')
@UseGuards(ServiceAuthGuard)
export class InternalController {
  @Get('data')
  getData() {
    return { protected: true };
  }
}
```

## Environment Setup

```bash
# .env
SERVICE_JWT_SECRET=your-super-secret-key-min-32-chars
```

## Common Patterns

### Pattern 1: Simple Internal API Call
```typescript
// Calling service
const token = this.serviceAuth.generateServiceToken('auth-service');
await this.http.get(url, { headers: { 'x-service-auth': token } });
```

### Pattern 2: Access Service Name in Handler
```typescript
// Receiving service
@Get('data')
@UseGuards(ServiceAuthGuard)
getData(@Req() req: any) {
  const callingService = req.serviceAuth.sub;
  console.log(`Called by: ${callingService}`);
}
```

### Pattern 3: Custom Validation
```typescript
@Injectable()
export class CustomValidator {
  constructor(private serviceAuth: ServiceAuthService) {}

  validate(token: string): boolean {
    const payload = this.serviceAuth.verifyServiceToken(token);
    return payload?.type === 'service';
  }
}
```

## Token Details

- **Header**: `x-service-auth`
- **Expiration**: 5 minutes
- **Payload**: `{ sub: 'service-name', type: 'service', iat: timestamp }`

## Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Service authentication required` | Missing header | Add `x-service-auth` header |
| `Invalid service token` | Bad/expired token | Generate new token |

## Testing

```typescript
// Mock the service
{
  provide: ServiceAuthService,
  useValue: {
    generateServiceToken: jest.fn().mockReturnValue('mock.token'),
    verifyServiceToken: jest.fn().mockReturnValue({ sub: 'test', type: 'service' }),
  },
}
```

## Files Created

| File | Purpose |
|------|---------|
| `service-auth.module.ts` | NestJS module configuration |
| `service-auth.service.ts` | Token generation and verification |
| `service-auth.guard.ts` | Request authentication guard |
| `index.ts` | Barrel export |

## Architecture

```
Service A                          Service B
   │                                  │
   ├─ Generate Token ─────────────→  │
   │  (ServiceAuthService)            │
   │                                  ├─ Verify Token
   ├─ Add to Header                   │  (ServiceAuthGuard)
   │  x-service-auth: <token>         │
   │                                  ├─ Extract Service Info
   ├─ HTTP Request ────────────────→  │  req.serviceAuth
   │                                  │
   │  ←──────────────── Response      │
```

## Security Checklist

- [ ] Set unique `SERVICE_JWT_SECRET` in production
- [ ] Use HTTPS for all service-to-service calls
- [ ] Keep services in private network
- [ ] Monitor authentication failures
- [ ] Rotate secrets regularly
- [ ] Implement rate limiting on internal endpoints

## Common Service Names

- `auth-service`
- `user-service`
- `job-service`
- `payment-service`
- `notification-service`
- `resume-service`
- `analytics-service`
- `ai-service`
- `auto-apply-service`
- `orchestrator-service`

## Complete Example

```typescript
// ============================================
// SERVICE A: Making the Request
// ============================================
// user-service/src/clients/job.client.ts
import { Injectable } from '@nestjs/common';
import { ServiceAuthService } from '@applyforus/security';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JobServiceClient {
  constructor(
    private readonly serviceAuth: ServiceAuthService,
    private readonly http: HttpService,
  ) {}

  async getJobsForUser(userId: string) {
    const token = this.serviceAuth.generateServiceToken('user-service');

    const response = await firstValueFrom(
      this.http.get(`http://job-service:3002/api/internal/jobs/user/${userId}`, {
        headers: { 'x-service-auth': token },
      })
    );

    return response.data;
  }
}

// ============================================
// SERVICE B: Receiving the Request
// ============================================
// job-service/src/controllers/internal-jobs.controller.ts
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ServiceAuthGuard } from '@applyforus/security';
import { JobsService } from '../services/jobs.service';

@Controller('api/internal/jobs')
@UseGuards(ServiceAuthGuard)
export class InternalJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('user/:userId')
  async getJobsForUser(
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    // Optional: Log which service made the request
    console.log(`Request from: ${req.serviceAuth.sub}`);

    return this.jobsService.findByUserId(userId);
  }
}

// ============================================
// BOTH SERVICES: Module Setup
// ============================================
// app.module.ts (both services)
import { Module } from '@nestjs/common';
import { ServiceAuthModule } from '@applyforus/security';

@Module({
  imports: [
    ServiceAuthModule, // Add this to enable service auth
    // ... other imports
  ],
})
export class AppModule {}
```

## Next Steps

1. Read the [full documentation](./SERVICE_AUTH_USAGE.md)
2. Review [security best practices](./README.md)
3. Implement in your microservices
4. Write integration tests
5. Monitor authentication metrics

## Support

- Documentation: `packages/security/SERVICE_AUTH_USAGE.md`
- Examples: See above complete example
- Issues: Contact platform security team
