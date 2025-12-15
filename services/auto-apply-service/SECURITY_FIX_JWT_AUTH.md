# CRITICAL SECURITY FIX: JWT Authentication Implementation

## Summary
Fixed a **CRITICAL** security vulnerability where the Auto-Apply Service had NO authentication guards, allowing anyone to specify any user ID via the `x-user-id` header and perform actions as that user.

## Vulnerability Description
**Severity**: CRITICAL

All endpoints in the auto-apply-service were accepting a user ID via the `x-user-id` HTTP header without any verification. An attacker could:
- Impersonate any user by sending requests with arbitrary user IDs
- Access, modify, or delete any user's applications
- Start auto-apply jobs for other users
- Access sensitive user data and application history
- Manipulate queue operations for other users

**Example Attack**:
```bash
# Attacker could impersonate user with ID: victim-user-id-123
curl -X GET http://api.example.com/applications \
  -H "x-user-id: victim-user-id-123"
```

## Fix Implementation

### 1. Authentication Module
Created a complete JWT authentication module at `src/modules/auth/`:

**Files Created**:
- `auth.module.ts` - Main authentication module with JWT configuration
- `strategies/jwt.strategy.ts` - Passport JWT strategy for token validation
- `guards/jwt-auth.guard.ts` - Auth guard with @Public() decorator support

**Configuration**:
- JWT tokens validated using shared secret from auth-service
- Tokens must include: sub (user ID), email, and role
- Supports issuer and audience verification
- Expired or invalid tokens are rejected

### 2. Decorators
Created custom decorators at `src/common/decorators/`:

**@User() Decorator** (`user.decorator.ts`):
- Extracts authenticated user from JWT payload
- Available after successful authentication
- Usage: `@User('id') userId: string`

**@Public() Decorator** (`public.decorator.ts`):
- Marks endpoints that don't require authentication
- Used for health checks and public endpoints

### 3. Controllers Updated

#### ApplicationsController
**Before**:
```typescript
async findAll(@Headers() headers: any, @Query() query: QueryApplicationDto) {
  const userId = headers['x-user-id']; // INSECURE!
  return await this.applicationsService.findAll(userId, query);
}
```

**After**:
```typescript
@UseGuards(JwtAuthGuard)
async findAll(@User('id') userId: string, @Query() query: QueryApplicationDto) {
  return await this.applicationsService.findAll(userId, query);
}
```

#### EngineController
- All endpoints now require JWT authentication
- User ID extracted from JWT token
- DTOs with userId field are overridden with authenticated user ID to prevent tampering
- Endpoints: `/apply`, `/batch-apply`, `/retry/:applicationId`

#### AnswerLibraryController
- Removed fallback to `x-user-id` header
- All operations now use JWT-authenticated user ID
- Prevents unauthorized access to other users' answer libraries

#### AutoApplyController
- Queue management endpoints now protected
- Settings endpoints use authenticated user
- Path parameters fixed for `/queue/:jobId/retry` and `/queue/:jobId/remove`

### 4. Global Authentication
Added global JWT guard in `app.module.ts`:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

This ensures ALL endpoints require authentication by default unless marked with `@Public()`.

### 5. Health Endpoints
Health check endpoints marked as public using `@Public()` decorator:
- `/health` - Basic health check
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- `/health/circuit-breakers` - Circuit breaker status

### 6. Dependencies Added
Updated `package.json` with required dependencies:
```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1"
}
```

And dev dependencies:
```json
{
  "@types/passport-jwt": "^4.0.0"
}
```

## Security Benefits

### 1. User Impersonation Prevention
- Users can only perform actions as themselves
- User ID is extracted from cryptographically signed JWT
- Cannot be spoofed or tampered with

### 2. Authorization Enforcement
- Every request requires valid JWT token
- Expired tokens are rejected
- Token issuer and audience validated

### 3. Defense in Depth
- Global guard ensures no endpoints are accidentally left unprotected
- Explicit @Public() decorator required for public endpoints
- DTOs with userId fields are overridden with authenticated value

### 4. Audit Trail
- User actions are now tied to authenticated identity
- JWT payload includes email and role for auditing
- Cannot perform anonymous or impersonated actions

## Configuration Required

### Environment Variables
The auto-apply-service requires these environment variables:

```bash
# JWT Configuration (must match auth-service)
JWT_SECRET=your-secret-key-change-in-production
JWT_ISSUER=applyforus-auth
JWT_AUDIENCE=applyforus-api
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
```

**IMPORTANT**: The `JWT_SECRET` must be the SAME secret used by the auth-service to sign tokens.

## Testing Authentication

### 1. Get a JWT Token
First, authenticate with the auth-service:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "user-id-123",
    "email": "user@example.com"
  }
}
```

### 2. Use Token in Requests
Include the token in the Authorization header:
```bash
curl -X GET http://localhost:3005/applications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Verify Protection
Requests without token should be rejected:
```bash
# This will return 401 Unauthorized
curl -X GET http://localhost:3005/applications
```

Requests with invalid token should be rejected:
```bash
# This will return 401 Unauthorized
curl -X GET http://localhost:3005/applications \
  -H "Authorization: Bearer invalid-token"
```

## Migration Notes

### For API Clients
All API clients must be updated to:
1. Obtain JWT token from auth-service
2. Include token in Authorization header
3. Remove any usage of `x-user-id` header

### For Frontend Applications
Update API calls to include JWT token:
```javascript
// Before
const response = await fetch('/applications', {
  headers: {
    'x-user-id': userId, // NO LONGER ACCEPTED
  }
});

// After
const response = await fetch('/applications', {
  headers: {
    'Authorization': `Bearer ${accessToken}`, // REQUIRED
  }
});
```

### For Tests
Update integration tests to:
1. Mock JWT authentication or obtain real tokens
2. Include Authorization header in test requests
3. Remove x-user-id header usage

## Backward Compatibility

**BREAKING CHANGE**: This is a breaking change and is NOT backward compatible.

All existing API clients MUST be updated to use JWT authentication. The `x-user-id` header is no longer accepted and will result in 401 Unauthorized responses.

## Verification Checklist

- [x] JWT strategy implemented
- [x] Auth guard created with @Public() support
- [x] User decorator created
- [x] All controllers use @UseGuards(JwtAuthGuard)
- [x] User ID extracted from JWT, not headers
- [x] DTOs with userId are overridden with authenticated value
- [x] Health endpoints marked as public
- [x] Global guard configured in app.module
- [x] Dependencies added to package.json
- [x] Environment variables documented

## Deployment Steps

1. **Update Environment Variables**
   - Ensure JWT_SECRET matches auth-service
   - Set JWT_ISSUER and JWT_AUDIENCE correctly

2. **Install Dependencies**
   ```bash
   cd services/auto-apply-service
   pnpm install
   ```

3. **Build Service**
   ```bash
   pnpm build
   ```

4. **Update API Clients**
   - Update all frontend applications
   - Update any scripts or automated tools
   - Update documentation

5. **Deploy Service**
   - Deploy to staging first
   - Test authentication flow
   - Deploy to production

6. **Monitor**
   - Watch for 401 errors
   - Monitor authentication failures
   - Check logs for issues

## Related Files

### Created Files
- `src/modules/auth/auth.module.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/modules/auth/guards/jwt-auth.guard.ts`
- `src/common/decorators/user.decorator.ts`
- `src/common/decorators/public.decorator.ts`

### Modified Files
- `src/modules/applications/applications.controller.ts`
- `src/modules/engine/engine.controller.ts`
- `src/modules/answer-library/answer-library.controller.ts`
- `src/modules/applications/auto-apply.controller.ts`
- `src/app.module.ts`
- `src/health.controller.ts`
- `package.json`

## Future Enhancements

1. **Role-Based Access Control (RBAC)**
   - Add role checks for admin endpoints
   - Implement @Roles() decorator
   - Restrict queue management to admins

2. **Rate Limiting**
   - Add rate limiting per user
   - Prevent API abuse

3. **API Key Support**
   - Add API key authentication for service-to-service calls
   - Implement separate authentication for background jobs

4. **Audit Logging**
   - Log all authenticated actions
   - Track failed authentication attempts
   - Alert on suspicious activity

## References

- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
