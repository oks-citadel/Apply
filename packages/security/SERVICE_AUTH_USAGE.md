# Service-to-Service Authentication

This module provides secure authentication for internal microservice communication using JWT tokens.

## Overview

The service-auth module includes:
- **ServiceAuthModule**: NestJS module for dependency injection
- **ServiceAuthService**: Service for generating and verifying service tokens
- **ServiceAuthGuard**: Guard for protecting endpoints requiring service authentication

## Installation

The module is part of the `@applyforus/security` package. Install dependencies:

```bash
pnpm install @nestjs/common @nestjs/core @nestjs/jwt
```

## Configuration

Set the `SERVICE_JWT_SECRET` environment variable for token signing:

```bash
SERVICE_JWT_SECRET=your-secure-secret-key-change-in-production
```

**Important**: Use a strong, unique secret in production. Tokens expire after 5 minutes by default.

## Usage

### 1. Import the Module

Import `ServiceAuthModule` in your service module:

```typescript
import { Module } from '@nestjs/common';
import { ServiceAuthModule } from '@applyforus/security';

@Module({
  imports: [ServiceAuthModule],
  // ... your controllers and providers
})
export class YourServiceModule {}
```

### 2. Generate Service Tokens

Use `ServiceAuthService` to generate tokens when making requests to other services:

```typescript
import { Injectable } from '@nestjs/common';
import { ServiceAuthService } from '@applyforus/security';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ExternalServiceClient {
  constructor(
    private readonly serviceAuth: ServiceAuthService,
    private readonly http: HttpService,
  ) {}

  async callOtherService() {
    // Generate a token for this service
    const token = this.serviceAuth.generateServiceToken('user-service');

    // Make HTTP request with service auth header
    return this.http.post(
      'http://job-service:3002/api/internal/jobs',
      { data: 'payload' },
      {
        headers: {
          'x-service-auth': token,
        },
      },
    ).toPromise();
  }
}
```

### 3. Protect Internal Endpoints

Use `ServiceAuthGuard` to protect endpoints that should only be accessible by other services:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '@applyforus/security';

@Controller('internal')
export class InternalController {
  // Protect single endpoint
  @Get('jobs')
  @UseGuards(ServiceAuthGuard)
  getJobs() {
    return { message: 'This endpoint requires service authentication' };
  }
}
```

Or protect an entire controller:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '@applyforus/security';

@Controller('internal')
@UseGuards(ServiceAuthGuard)
export class InternalController {
  @Get('jobs')
  getJobs() {
    return { message: 'All endpoints in this controller require service auth' };
  }

  @Get('users')
  getUsers() {
    return { message: 'Protected by service auth' };
  }
}
```

### 4. Access Service Information

The guard adds service authentication information to the request object:

```typescript
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '@applyforus/security';
import { Request } from 'express';

interface ServiceAuthRequest extends Request {
  serviceAuth: {
    sub: string;  // service name
    type: string; // 'service'
  };
}

@Controller('internal')
export class InternalController {
  @Get('jobs')
  @UseGuards(ServiceAuthGuard)
  getJobs(@Req() req: ServiceAuthRequest) {
    const serviceName = req.serviceAuth.sub;
    console.log(`Request from service: ${serviceName}`);
    return { message: 'Success' };
  }
}
```

### 5. Manual Token Verification

For custom authentication logic, use the service directly:

```typescript
import { Injectable } from '@nestjs/common';
import { ServiceAuthService } from '@applyforus/security';

@Injectable()
export class CustomAuthService {
  constructor(private readonly serviceAuth: ServiceAuthService) {}

  validateServiceRequest(token: string): boolean {
    const payload = this.serviceAuth.verifyServiceToken(token);

    if (!payload || payload.type !== 'service') {
      return false;
    }

    // Additional validation logic
    const allowedServices = ['user-service', 'job-service', 'auth-service'];
    return allowedServices.includes(payload.sub);
  }
}
```

## Architecture Pattern

### Service A calling Service B

```
┌─────────────────┐                    ┌─────────────────┐
│   Service A     │                    │   Service B     │
│  (user-service) │                    │  (job-service)  │
├─────────────────┤                    ├─────────────────┤
│                 │                    │                 │
│ 1. Generate     │                    │ 4. Verify token │
│    token        │                    │    using Guard  │
│    ↓            │                    │    ↓            │
│ 2. Add to       │  ───────────→      │ 5. Process      │
│    x-service-   │  HTTP Request      │    request      │
│    auth header  │  with token        │                 │
│    ↓            │                    │                 │
│ 3. Send request │                    │ 6. Return data  │
│                 │  ←───────────      │                 │
└─────────────────┘   HTTP Response    └─────────────────┘
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for service-to-service communication in production
2. **Network Isolation**: Run services in a private network with firewall rules
3. **Strong Secrets**: Use strong, randomly generated secrets for `SERVICE_JWT_SECRET`
4. **Rotate Secrets**: Implement secret rotation policies
5. **Token Expiration**: Keep short expiration times (default: 5 minutes)
6. **Audit Logs**: Log all service-to-service authentication attempts
7. **Service Registry**: Maintain a whitelist of allowed service names

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_JWT_SECRET` | Secret key for signing JWT tokens | `service-secret-change-in-production` |

## Token Payload Structure

```typescript
{
  sub: string;    // Service name (e.g., 'user-service')
  type: 'service' // Token type identifier
  iat: number;    // Issued at timestamp
  exp: number;    // Expiration timestamp (iat + 5 minutes)
}
```

## HTTP Headers

| Header | Direction | Description |
|--------|-----------|-------------|
| `x-service-auth` | Request | JWT token for service authentication |

## Error Responses

The guard throws `UnauthorizedException` with the following messages:

- `Service authentication required` - No token provided
- `Invalid service token` - Token verification failed or type is not 'service'

## Example: Complete Service Setup

### auth-service (Calling Service)

```typescript
// auth-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ServiceAuthModule } from '@applyforus/security';
import { HttpModule } from '@nestjs/axios';
import { UserServiceClient } from './clients/user-service.client';

@Module({
  imports: [
    ServiceAuthModule,
    HttpModule,
  ],
  providers: [UserServiceClient],
})
export class AppModule {}

// auth-service/src/clients/user-service.client.ts
import { Injectable } from '@nestjs/common';
import { ServiceAuthService } from '@applyforus/security';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserServiceClient {
  private readonly userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';

  constructor(
    private readonly serviceAuth: ServiceAuthService,
    private readonly http: HttpService,
  ) {}

  async getUserById(userId: string) {
    const token = this.serviceAuth.generateServiceToken('auth-service');

    const response = await firstValueFrom(
      this.http.get(`${this.userServiceUrl}/api/internal/users/${userId}`, {
        headers: {
          'x-service-auth': token,
        },
      })
    );

    return response.data;
  }
}
```

### user-service (Receiving Service)

```typescript
// user-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ServiceAuthModule } from '@applyforus/security';
import { InternalUsersController } from './controllers/internal-users.controller';
import { UsersService } from './services/users.service';

@Module({
  imports: [ServiceAuthModule],
  controllers: [InternalUsersController],
  providers: [UsersService],
})
export class AppModule {}

// user-service/src/controllers/internal-users.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '@applyforus/security';
import { UsersService } from '../services/users.service';

@Controller('api/internal/users')
@UseGuards(ServiceAuthGuard)
export class InternalUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
```

## Testing

### Unit Testing the Service

```typescript
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ServiceAuthService } from '@applyforus/security';

describe('ServiceAuthService', () => {
  let service: ServiceAuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceAuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceAuthService>(ServiceAuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should generate service token', () => {
    const token = 'test.jwt.token';
    jest.spyOn(jwtService, 'sign').mockReturnValue(token);

    const result = service.generateServiceToken('test-service');

    expect(result).toBe(token);
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'test-service',
      type: 'service',
      iat: expect.any(Number),
    });
  });

  it('should verify valid token', () => {
    const payload = { sub: 'test-service', type: 'service' };
    jest.spyOn(jwtService, 'verify').mockReturnValue(payload);

    const result = service.verifyServiceToken('valid.token');

    expect(result).toEqual(payload);
  });

  it('should return null for invalid token', () => {
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const result = service.verifyServiceToken('invalid.token');

    expect(result).toBeNull();
  });
});
```

### Integration Testing with Guard

```typescript
import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ServiceAuthGuard } from '@applyforus/security';
import { ServiceAuthService } from '@applyforus/security';

describe('ServiceAuthGuard', () => {
  let guard: ServiceAuthGuard;
  let service: ServiceAuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceAuthGuard,
        {
          provide: ServiceAuthService,
          useValue: {
            verifyServiceToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ServiceAuthGuard>(ServiceAuthGuard);
    service = module.get<ServiceAuthService>(ServiceAuthService);
  });

  it('should allow valid service token', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-service-auth': 'valid.token' },
        }),
      }),
    } as ExecutionContext;

    jest.spyOn(service, 'verifyServiceToken').mockReturnValue({
      sub: 'test-service',
      type: 'service',
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should reject missing token', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow('Service authentication required');
  });

  it('should reject invalid token', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-service-auth': 'invalid.token' },
        }),
      }),
    } as ExecutionContext;

    jest.spyOn(service, 'verifyServiceToken').mockReturnValue(null);

    expect(() => guard.canActivate(mockContext)).toThrow('Invalid service token');
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: `UnauthorizedException: Service authentication required`
- **Cause**: Missing `x-service-auth` header
- **Solution**: Ensure the calling service includes the header with a valid token

**Issue**: `UnauthorizedException: Invalid service token`
- **Cause**: Token verification failed
- **Solution**: Check that `SERVICE_JWT_SECRET` is the same across all services

**Issue**: Token expired errors
- **Cause**: Token lifetime exceeded (5 minutes)
- **Solution**: Generate a new token for each request or implement token caching with refresh logic

**Issue**: `Module not found: @nestjs/jwt`
- **Cause**: Missing dependency
- **Solution**: Run `pnpm install @nestjs/jwt`

## Migration Guide

If you're migrating from API key authentication or other methods:

1. Install the module and dependencies
2. Add `ServiceAuthModule` to your service modules
3. Update HTTP clients to generate tokens
4. Replace existing guards with `ServiceAuthGuard`
5. Update integration tests
6. Deploy services in a rolling update to ensure compatibility

## Related Documentation

- [Subscription Guard](./SUBSCRIPTION_GUARD_USAGE.md)
- [CSRF Protection](./src/csrf-guard.ts)
- [RBAC](./src/rbac/)
- [Security Package README](./README.md)

## Support

For issues or questions, please refer to the main security package documentation or contact the platform security team.
