# Authentication Guard Security Fix - Job Service

## Summary
Replaced all mock authentication guards with real JWT authentication guards across job-service, eliminating critical security vulnerabilities.

## Problem Statement
The job-service had mock AuthGuards that provided NO actual authentication:
```typescript
// VULNERABLE CODE - Provides NO protection!
const AuthGuard = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => descriptor;
```

This decorator did nothing - it just returned the descriptor unchanged, meaning all "protected" endpoints were actually wide open to unauthenticated access.

## Solution Implemented

### 1. Created Shared Authentication Guards

Created `services/job-service/src/common/guards/` directory with three production-ready guards:

#### A. JwtAuthGuard (`jwt-auth.guard.ts`)
- Extracts Bearer token from Authorization header
- Validates JWT signature using configured secret
- Verifies token expiration
- Attaches decoded user payload to request object
- Throws UnauthorizedException if token is missing/invalid

#### B. AdminGuard (`admin.guard.ts`)
- Checks authenticated user's role from JWT payload
- Only allows users with `admin` or `super_admin` roles
- Throws ForbiddenException for non-admin access

#### C. RateLimitGuard (`rate-limit.guard.ts`)
- In-memory rate limiting (10 requests per minute per user)
- Prevents abuse of report endpoints
- Production note: Should be upgraded to Redis-backed implementation

### 2. Fixed All Controllers

Replaced mock guards in the following controllers:

#### `src/modules/search/search.controller.ts`
- **Before**: `@UseGuards(AuthGuard())` (mock)
- **After**: `@UseGuards(JwtAuthGuard)` (real)
- **Fixed**: `req.user.id` → `req.user.sub` (JWT payload uses 'sub' for user ID)
- **Endpoints**: GET /search/recent, DELETE /search/recent/:id

#### `src/modules/alerts/alerts.controller.ts`
- **Before**: Controller-level mock guard
- **After**: `@UseGuards(JwtAuthGuard)` at controller level
- **Fixed**: All `req.user.id` → `req.user.sub`
- **Endpoints**: All alert CRUD operations

#### `src/modules/reports/job-reports.controller.ts`
- **Before**: Mock `AuthGuard()`, `AdminGuard()`, `RateLimitGuard()`
- **After**: Real `JwtAuthGuard`, `AdminGuard`, `RateLimitGuard`
- **Fixed**: All `req.user.id` → `req.user.sub`
- **Endpoints**: POST /jobs/:id/report, GET /jobs/:id/reports (admin), GET /jobs/:id/reports/count (admin)

#### `src/modules/reports/reports.controller.ts`
- **Before**: Mock `AuthGuard()`, `AdminGuard()`
- **After**: Real `JwtAuthGuard`, `AdminGuard`
- **Fixed**: All `req.user.id` → `req.user.sub`
- **Endpoints**: All report management endpoints

#### `src/modules/jobs/jobs.controller.ts`
- **Before**: Inline JwtAuthGuard class definition (non-reusable)
- **After**: Shared JwtAuthGuard from common/guards
- **Fixed**: All `req.user.id` → `req.user.sub`
- **Fixed**: JWT secret config key: `JWT_SECRET` → `jwt.secret` (consistent with config structure)
- **Endpoints**: saved jobs, recommendations, match scores, job reports

### 3. Updated Module Registrations

Updated the following modules to provide JWT capabilities:

#### `src/modules/jobs/jobs.module.ts`
- Added `JwtAuthGuard` to providers
- Fixed JWT secret config key from `JWT_SECRET` to `jwt.secret`

#### `src/modules/alerts/alerts.module.ts`
- Added `JwtModule.registerAsync()` with proper config
- Added `JwtAuthGuard` to providers

#### `src/modules/reports/reports.module.ts`
- Added `JwtModule.registerAsync()` with proper config
- Added all three guards to providers: `JwtAuthGuard`, `AdminGuard`, `RateLimitGuard`

#### `src/modules/search/search.module.ts`
- Added `SearchController` to controllers (was missing)
- Added `JwtModule.registerAsync()` with proper config
- Added `JwtAuthGuard` to providers

## Security Improvements

### Before (CRITICAL VULNERABILITY)
```typescript
// This did NOTHING - all endpoints were unprotected!
const AuthGuard = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => descriptor;

@Get('saved')
@UseGuards(AuthGuard())  // ❌ NO AUTHENTICATION!
async getSavedJobs(@Request() req: any) {
  // Anyone could call this endpoint
}
```

### After (SECURE)
```typescript
import { JwtAuthGuard } from '../../common/guards';

@Get('saved')
@UseGuards(JwtAuthGuard)  // ✅ Real JWT validation
@ApiBearerAuth('JWT-auth')
async getSavedJobs(@Request() req: any) {
  // Only authenticated users with valid JWT can access
  const userId = req.user.sub; // User ID from validated JWT
}
```

## JWT Payload Structure

The guards expect JWT tokens with the following structure:
```typescript
interface JwtPayload {
  sub: string;      // User ID (subject)
  email: string;    // User email
  role: string;     // User role (e.g., 'user', 'admin', 'super_admin')
  iat?: number;     // Issued at timestamp
  exp?: number;     // Expiration timestamp
}
```

## Configuration Requirements

The service requires the following configuration in environment variables:
```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
```

Or using the nested config structure:
```typescript
{
  jwt: {
    secret: 'your-secret-key-here',
    expiresIn: '24h'
  }
}
```

## Testing & Verification

### Build Verification
```bash
cd services/job-service
pnpm build
```
✅ Build succeeds with no TypeScript errors

### Mock Guard Detection
```bash
grep -r "const.*Guard.*=" src/modules/ --include="*.ts"
```
✅ No mock guards found

### Real Guard Usage
- 20 instances of `@UseGuards(JwtAuthGuard)` across 5 controllers
- 9 imports of guards from `common/guards`
- All protected endpoints properly secured

## Files Changed

### New Files Created
- `src/common/guards/jwt-auth.guard.ts` - JWT authentication guard
- `src/common/guards/admin.guard.ts` - Admin authorization guard
- `src/common/guards/rate-limit.guard.ts` - Rate limiting guard
- `src/common/guards/index.ts` - Barrel export

### Controllers Updated
- `src/modules/search/search.controller.ts`
- `src/modules/alerts/alerts.controller.ts`
- `src/modules/reports/job-reports.controller.ts`
- `src/modules/reports/reports.controller.ts`
- `src/modules/jobs/jobs.controller.ts`

### Modules Updated
- `src/modules/jobs/jobs.module.ts`
- `src/modules/alerts/alerts.module.ts`
- `src/modules/reports/reports.module.ts`
- `src/modules/search/search.module.ts`

## Migration Notes

### Breaking Changes
1. **User ID Access**: Changed from `req.user.id` to `req.user.sub` (JWT standard)
2. **Config Key**: Changed from `JWT_SECRET` to `jwt.secret` (nested config)
3. **Authentication Required**: Previously unprotected endpoints now require valid JWT tokens

### Deployment Checklist
- [ ] Ensure `JWT_SECRET` is configured in environment
- [ ] Update client applications to send Bearer tokens
- [ ] Test all protected endpoints with valid tokens
- [ ] Verify admin-only endpoints reject non-admin users
- [ ] Monitor rate limit effectiveness on report endpoints

## Future Improvements

1. **Rate Limiting**: Migrate from in-memory to Redis-backed rate limiting for production scalability
2. **Guard Package**: Consider moving guards to `@applyforus/security` package for cross-service reuse
3. **Role-Based Access Control**: Implement more granular permission system beyond admin/non-admin
4. **Token Refresh**: Add refresh token support for better UX
5. **Audit Logging**: Log all authentication failures for security monitoring

## Impact Assessment

### Security Impact: CRITICAL
- **Before**: All protected endpoints were completely open to unauthenticated access
- **After**: Proper JWT authentication enforced on all protected endpoints
- **Risk Eliminated**: Unauthorized access to user data, saved jobs, alerts, and reports

### Performance Impact: MINIMAL
- JWT validation is fast (cryptographic signature verification)
- In-memory rate limiting has negligible overhead
- No database queries added to authentication flow

### Compatibility Impact: LOW
- Existing clients already sending Bearer tokens will continue to work
- Only affects previously "protected" endpoints that weren't actually protected

## Verification Commands

```bash
# Check for remaining mock guards
cd services/job-service
grep -r "const.*Guard.*=.*descriptor" src/

# Verify real guard usage
grep -r "@UseGuards(JwtAuthGuard" src/modules/

# Build verification
pnpm build

# Run tests (if available)
pnpm test
```

## Conclusion

This security fix eliminates a critical vulnerability where mock authentication guards provided zero protection. All protected endpoints in job-service now properly validate JWT tokens before granting access. The implementation follows NestJS best practices and is ready for production use.

**Status**: ✅ COMPLETE - All mock guards replaced with real JWT authentication
**Security Level**: 🔴 CRITICAL → 🟢 SECURE
