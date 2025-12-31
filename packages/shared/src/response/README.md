# Standardized API Response Module

This module provides a consistent API response format across all microservices in the ApplyForUs platform.

## Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;        // Indicates if the request was successful
  data?: T;               // Response data (only on success)
  error?: {               // Error details (only on failure)
    code: string;         // Machine-readable error code (e.g., "ERR_NOT_FOUND")
    message: string;      // Human-readable error message
    details?: any;        // Additional error context
    validationErrors?: [  // Field-level validation errors
      {
        field: string;
        message: string;
        value?: any;
        constraint?: string;
      }
    ];
    stack?: string;       // Stack trace (development only)
  };
  meta: {                 // Response metadata
    timestamp: string;    // ISO 8601 timestamp
    requestId: string;    // Unique request identifier
    executionTimeMs?: number;
    apiVersion?: string;
    pagination?: {        // For paginated responses
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}
```

## Installation

The response module is part of the `@applyforus/shared` package:

```typescript
import {
  ResponseModule,
  StandardResponseInterceptor,
  GlobalExceptionFilter,
  ApiResponseBuilder,
} from '@applyforus/shared';
```

## Quick Start

### Option 1: Using the Module (Recommended)

Import the `ResponseModule` in your app module:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ResponseModule } from '@applyforus/shared';

@Module({
  imports: [
    ResponseModule.forRoot({
      globalInterceptor: true,      // Apply response wrapper globally
      globalExceptionFilter: true,   // Apply exception filter globally
      interceptor: {
        apiVersion: '1.0',
        includeExecutionTime: true,
      },
      exceptionFilter: {
        includeStackTrace: process.env.NODE_ENV !== 'production',
      },
    }),
  ],
})
export class AppModule {}
```

### Option 2: Manual Setup

Apply the interceptor and filter in `main.ts`:

```typescript
// main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import {
  StandardResponseInterceptor,
  GlobalExceptionFilter,
} from '@applyforus/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  // Apply response interceptor
  app.useGlobalInterceptors(
    new StandardResponseInterceptor(reflector, {
      apiVersion: '1.0',
      includeExecutionTime: true,
    })
  );

  // Apply exception filter
  app.useGlobalFilters(
    new GlobalExceptionFilter({
      includeStackTrace: process.env.NODE_ENV !== 'production',
    })
  );

  await app.listen(3000);
}
```

## Usage Examples

### Basic Controller Response

Controllers return data directly; the interceptor wraps it automatically:

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return user; // Automatically wrapped
  }
}

// Response:
// {
//   "success": true,
//   "data": { "id": "123", "name": "John" },
//   "meta": {
//     "timestamp": "2024-01-01T00:00:00.000Z",
//     "requestId": "uuid",
//     "executionTimeMs": 15
//   }
// }
```

### Paginated Response

Return data with pagination info:

```typescript
@Controller('jobs')
export class JobsController {
  @Get()
  async listJobs(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    const { items, total } = await this.jobsService.findAll(page, pageSize);

    // Return with pagination info
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  }
}

// Response:
// {
//   "success": true,
//   "data": { "items": [...] },
//   "meta": {
//     "timestamp": "...",
//     "requestId": "...",
//     "pagination": {
//       "page": 1,
//       "pageSize": 20,
//       "total": 100,
//       "totalPages": 5,
//       "hasNextPage": true,
//       "hasPreviousPage": false
//     }
//   }
// }
```

### Skip Response Transformation

For endpoints like health checks or metrics:

```typescript
import { SkipResponseTransform } from '@applyforus/shared';

@Controller('health')
export class HealthController {
  @Get()
  @SkipResponseTransform() // Response returned as-is
  check() {
    return { status: 'ok' };
  }
}
```

### Using Custom Exceptions

Throw custom exceptions for consistent error responses:

```typescript
import {
  ResourceNotFoundException,
  ValidationException,
  ForbiddenException,
  RateLimitException,
} from '@applyforus/shared';

@Controller('users')
export class UsersController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ResourceNotFoundException('User', id);
    }
    return user;
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    const errors = await this.validate(dto);
    if (errors.length) {
      throw new ValidationException(errors);
    }
    return this.usersService.create(dto);
  }
}

// Error Response:
// {
//   "success": false,
//   "error": {
//     "code": "ERR_RESOURCE_NOT_FOUND",
//     "message": "User with ID '123' not found",
//     "details": { "resource": "User", "identifier": "123" }
//   },
//   "meta": {
//     "timestamp": "...",
//     "requestId": "..."
//   }
// }
```

### Manual Response Building

For custom scenarios:

```typescript
import { ApiResponseBuilder } from '@applyforus/shared';

@Controller('reports')
export class ReportsController {
  @Get('summary')
  async getSummary() {
    const data = await this.reportsService.getSummary();

    // Manual response building
    return ApiResponseBuilder.success({
      data,
      requestId: 'custom-id',
      executionTimeMs: 100,
    });
  }
}
```

## Error Codes

The module provides standard error codes:

| Code | Description |
|------|-------------|
| `ERR_UNKNOWN` | Unknown error |
| `ERR_INTERNAL_SERVER` | Internal server error |
| `ERR_SERVICE_UNAVAILABLE` | Service temporarily unavailable |
| `ERR_VALIDATION` | Validation failed |
| `ERR_INVALID_INPUT` | Invalid input data |
| `ERR_MISSING_FIELD` | Required field missing |
| `ERR_UNAUTHORIZED` | Authentication required |
| `ERR_TOKEN_EXPIRED` | Token has expired |
| `ERR_TOKEN_INVALID` | Invalid token |
| `ERR_FORBIDDEN` | Access denied |
| `ERR_INSUFFICIENT_PERMISSIONS` | Insufficient permissions |
| `ERR_NOT_FOUND` | Resource not found |
| `ERR_RESOURCE_EXISTS` | Resource already exists |
| `ERR_RESOURCE_CONFLICT` | Resource conflict |
| `ERR_RATE_LIMIT` | Rate limit exceeded |
| `ERR_BUSINESS_RULE` | Business rule violation |
| `ERR_QUOTA_EXCEEDED` | Quota exceeded |
| `ERR_PAYMENT_REQUIRED` | Payment required |
| `ERR_EXTERNAL_SERVICE` | External service error |
| `ERR_TIMEOUT` | Request timeout |

## Custom Exceptions

Available exceptions:

- `ApiException` - Base exception class
- `ValidationException` - For validation errors
- `ResourceNotFoundException` - Resource not found
- `ResourceExistsException` - Resource already exists
- `UnauthorizedException` - Authentication required
- `TokenExpiredException` - Token expired
- `InvalidTokenException` - Invalid token
- `ForbiddenException` - Access denied
- `InsufficientPermissionsException` - Missing permissions
- `RateLimitException` - Rate limit exceeded
- `BusinessRuleException` - Business rule violation
- `QuotaExceededException` - Quota exceeded
- `PaymentRequiredException` - Payment required
- `ExternalServiceException` - External service error
- `TimeoutException` - Request timeout
- `DependencyFailureException` - Dependency failure
- `ServiceUnavailableException` - Service unavailable
- `BadRequestException` - Bad request
- `ConflictException` - Resource conflict

## Configuration Options

### ResponseInterceptorOptions

```typescript
interface ResponseInterceptorOptions {
  apiVersion?: string;           // API version (default: '1.0')
  includeExecutionTime?: boolean; // Include exec time (default: true)
  requestIdHeader?: string;      // Request ID header (default: 'x-request-id')
  correlationIdHeader?: string;  // Correlation ID header (default: 'x-correlation-id')
}
```

### ExceptionFilterOptions

```typescript
interface ExceptionFilterOptions {
  includeStackTrace?: boolean;  // Include stack traces (default: !production)
  logger?: Logger;              // Custom logger instance
  apiVersion?: string;          // API version (default: '1.0')
  requestIdHeader?: string;     // Request ID header (default: 'x-request-id')
}
```

## Request ID Handling

Request IDs are automatically:
1. Read from incoming `x-request-id` or `x-correlation-id` headers
2. Generated if not present (UUID v4)
3. Stored on `request.requestId` for use in services
4. Included in response `x-request-id` header
5. Included in response `meta.requestId`

## Best Practices

1. **Use Custom Exceptions**: Throw specific exceptions for clear error codes
2. **Return Data Directly**: Let the interceptor handle wrapping
3. **Paginate Lists**: Always include pagination for list endpoints
4. **Log Request IDs**: Use `request.requestId` in your logging
5. **Skip Non-API Endpoints**: Use `@SkipResponseTransform()` for health/metrics
