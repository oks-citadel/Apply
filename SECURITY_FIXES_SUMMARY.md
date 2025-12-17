# Security Fixes Summary - ApplyForUs Platform

## Overview
This document summarizes the security improvements implemented across the ApplyForUs platform to address critical security vulnerabilities in authentication, CORS configuration, and rate limiting.

## Date
December 16, 2025

## Security Issues Fixed

### 1. OAuth Token Security (CRITICAL)
**Issue**: OAuth tokens were being passed in URL parameters during OAuth callbacks, exposing them in browser history, server logs, and referrer headers.

**Fix**: Implemented secure HttpOnly cookie-based token storage
- **File**: `services/auth-service/src/modules/auth/auth.controller.ts`
- **Changes**:
  - Added `setAuthCookies()` private method with security flags:
    - `httpOnly: true` - Prevents JavaScript access to cookies
    - `secure: true` (production only) - Requires HTTPS
    - `sameSite: 'strict'` - Prevents CSRF attacks
    - Proper `maxAge` settings (15 min for access token, 7 days for refresh token)
  - Updated OAuth callback endpoints (Google, LinkedIn, GitHub):
    - Tokens now set in secure cookies instead of URL parameters
    - Redirect URL changed from `/oauth/callback?access_token=...&refresh_token=...` to `/oauth/callback?success=true`
    - Error handling maintained with descriptive error messages

**Impact**:
- Tokens no longer visible in browser history or server logs
- Protection against XSS attacks (HttpOnly flag)
- Protection against CSRF attacks (SameSite=Strict)
- MITM protection in production (Secure flag)

### 2. CORS Configuration (HIGH)
**Issue**: Services were configured with `origin: '*'` or `origin: true`, allowing any domain to make requests to the API, potentially enabling CSRF attacks and unauthorized access.

**Fix**: Implemented strict CORS origin validation
- **Files Modified**:
  - `services/auth-service/src/main.ts`
  - `services/user-service/src/main.ts`
  - `services/job-service/src/main.ts`

- **Changes**:
  - Replaced wildcard CORS with explicit allowed origins:
    ```typescript
    const allowedOrigins = corsOrigins
      ? corsOrigins.split(',').map(o => o.trim())
      : [
          'https://applyforus.com',
          'https://dev.applyforus.com',
          'http://localhost:3000', // For local development
        ];
    ```
  - Implemented origin validation callback:
    - Allows requests with no origin (server-to-server, mobile apps, Postman)
    - Validates origin against allowed list
    - Logs unauthorized CORS attempts for security monitoring
    - Returns proper error for unauthorized origins

**Impact**:
- Only trusted domains can make API requests
- Prevents CSRF attacks from malicious websites
- Maintains flexibility through `CORS_ORIGINS` environment variable
- Enables security monitoring through logging

### 3. Rate Limiting on OAuth Endpoints (MEDIUM)
**Issue**: OAuth endpoints lacked rate limiting, potentially allowing abuse through repeated authentication attempts.

**Fix**: Applied `@Throttle` decorator to all OAuth endpoints
- **File**: `services/auth-service/src/modules/auth/auth.controller.ts`
- **Changes**:
  - Added rate limiting (10 requests/minute) to:
    - `GET /auth/google` - OAuth initiation
    - `GET /auth/google/callback` - OAuth callback
    - `GET /auth/linkedin` - OAuth initiation
    - `GET /auth/linkedin/callback` - OAuth callback
    - `GET /auth/github` - OAuth initiation
    - `GET /auth/github/callback` - OAuth callback

**Impact**:
- Protection against OAuth abuse and DoS attacks
- Prevents rapid-fire authentication attempts
- Maintains usability with reasonable limits (10/min)

### 4. Health Endpoint Rate Limiting Exclusion (LOW)
**Issue**: Health check endpoints need to be exempt from rate limiting for Kubernetes liveness/readiness probes.

**Fix**: Added `@SkipThrottle()` decorator to health controllers
- **Files Modified**:
  - `services/auth-service/src/health/health.controller.ts` (already had it)
  - `services/user-service/src/health/health.controller.ts`
  - `services/analytics-service/src/health/health.controller.ts`
  - `services/resume-service/src/health/health.controller.ts`

- **Changes**:
  - Added `@SkipThrottle()` decorator to controller class
  - Added import: `import { SkipThrottle } from '@nestjs/throttler';`
  - Updated documentation comments

**Impact**:
- Kubernetes probes won't be rate-limited
- Prevents false-positive pod restarts
- Maintains service reliability

## Configuration Requirements

### Environment Variables
To use custom CORS origins, set the `CORS_ORIGINS` environment variable:

```bash
# Production
CORS_ORIGINS=https://applyforus.com,https://api.applyforus.com

# Development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Default (if not set)
# Fallback to: https://applyforus.com,https://dev.applyforus.com,http://localhost:3000
```

### Cookie Requirements
- **Production**: Requires HTTPS for secure cookies (`secure: true` flag)
- **Development**: Works with HTTP (secure flag disabled in non-production)
- **Frontend**: Must be configured to send credentials with requests:
  ```typescript
  fetch(url, {
    credentials: 'include', // Required for cookies
  })
  ```

## Testing Recommendations

### 1. OAuth Flow Testing
- Verify tokens are set in cookies (check DevTools > Application > Cookies)
- Verify tokens are NOT in URL after OAuth callback
- Test cookie flags are correct (HttpOnly, Secure in prod, SameSite)
- Test cookie expiration times

### 2. CORS Testing
- Test requests from allowed origins succeed
- Test requests from unauthorized origins fail with proper error
- Test server-to-server requests (no origin) succeed
- Check logs for unauthorized CORS attempts

### 3. Rate Limiting Testing
- Test OAuth endpoints respect rate limits (10/min)
- Test health endpoints are NOT rate limited
- Verify rate limit headers are present in responses

### 4. Integration Testing
- Test full OAuth flow (Google, LinkedIn, GitHub)
- Test cookie-based authentication on subsequent requests
- Test token refresh flow with cookies
- Test logout clears cookies properly

## Migration Notes

### Frontend Changes Required
The frontend OAuth callback handler needs to be updated to read tokens from cookies instead of URL parameters:

**Before**:
```typescript
// Reading from URL
const params = new URLSearchParams(window.location.search);
const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');
```

**After**:
```typescript
// Tokens are automatically included in cookies
// Just check for success/error
const params = new URLSearchParams(window.location.search);
if (params.get('success') === 'true') {
  // OAuth successful, cookies are set
  // Make authenticated request to verify
  const response = await fetch('/auth/me', {
    credentials: 'include',
  });
}
```

### API Client Configuration
Ensure all API clients send credentials with requests:

```typescript
// Axios
axios.defaults.withCredentials = true;

// Fetch API
fetch(url, {
  credentials: 'include',
});

// Or in a base API client
const apiClient = axios.create({
  baseURL: process.env.API_URL,
  withCredentials: true, // Important for cookies
});
```

## Security Best Practices Applied

1. **Defense in Depth**: Multiple layers of security (cookies, CORS, rate limiting)
2. **Least Privilege**: Only allowed origins can access the API
3. **Secure by Default**: Secure flags enabled in production automatically
4. **Fail Securely**: Unknown origins are rejected with proper errors
5. **Audit Logging**: Unauthorized CORS attempts are logged
6. **Rate Limiting**: Prevents abuse and DoS attacks
7. **CSRF Protection**: SameSite=Strict cookies prevent cross-site attacks

## Files Modified

### Critical Security Files
- `services/auth-service/src/modules/auth/auth.controller.ts` - OAuth token security
- `services/auth-service/src/main.ts` - CORS configuration

### CORS Security Updates
- `services/user-service/src/main.ts`
- `services/job-service/src/main.ts`

### Health Endpoint Protection
- `services/user-service/src/health/health.controller.ts`
- `services/analytics-service/src/health/health.controller.ts`
- `services/resume-service/src/health/health.controller.ts`

## Verification Checklist

- [x] OAuth tokens moved from URL to HttpOnly cookies
- [x] Cookie security flags properly configured (HttpOnly, Secure, SameSite)
- [x] CORS restricted to specific allowed origins
- [x] CORS origin validation with logging
- [x] Rate limiting applied to OAuth endpoints
- [x] Health endpoints exempt from rate limiting
- [x] Error handling maintained for OAuth flows
- [x] Documentation updated

## Next Steps

1. **Frontend Update**: Update OAuth callback handler to use cookies
2. **API Client Update**: Configure clients to send credentials
3. **Testing**: Run integration tests for OAuth flows
4. **Monitoring**: Watch logs for unauthorized CORS attempts
5. **Environment Variables**: Set CORS_ORIGINS in production/staging
6. **Documentation**: Update API documentation with cookie requirements

## Support

For questions or issues related to these security fixes, please contact the security team or refer to:
- OAuth Documentation: `docs/oauth-integration.md`
- CORS Configuration: `docs/cors-setup.md`
- Rate Limiting: `docs/rate-limiting.md`

---

**Security Level**: Production Ready
**Deployment Impact**: Requires frontend updates
**Breaking Changes**: Yes - OAuth callback URL parameter format changed
