# Security Implementation Guide

This guide provides step-by-step instructions for implementing and deploying the security improvements made to the Job-Apply-Platform.

## Table of Contents

1. [Installation Steps](#installation-steps)
2. [Configuration](#configuration)
3. [Files Modified](#files-modified)
4. [Files Created](#files-created)
5. [Testing Security Features](#testing-security-features)
6. [Deployment Checklist](#deployment-checklist)

---

## Installation Steps

### 1. Install New Dependencies

Run the following commands to install security-related packages:

#### Auth Service
```bash
cd services/auth-service
npm install helmet@^7.1.0 @types/helmet@^4.0.0
```

#### Resume Service
```bash
cd services/resume-service
npm install @nestjs/throttler@^5.1.1 helmet@^7.1.0 compression@^1.7.4
npm install -D @types/helmet@^4.0.0 @types/compression@^1.7.5
```

#### User Service
```bash
cd services/user-service
npm install @nestjs/throttler@^5.1.1
```

#### Job Service
```bash
cd services/job-service
# Already has helmet - no additional packages needed
```

#### Security Package
```bash
cd packages/security
npm install @nestjs/common@^10.3.0 helmet@^7.1.0
npm install -D @types/helmet@^4.0.0
```

---

## Configuration

### 1. Update Environment Variables

Copy the updated `.env.example` to `.env` and configure the following security variables:

#### Auth Service (.env)

```env
# JWT Configuration
JWT_SECRET=<generate-with-openssl-rand-base64-64>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_SECRET=<different-secret>
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=jobpilot-auth-service
JWT_AUDIENCE=jobpilot-platform

# Password Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# CSRF Protection
CSRF_ENABLED=true
CSRF_SECRET=<generate-with-openssl-rand-base64-64>

# Security Headers
HELMET_ENABLED=true
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. Generate Strong Secrets

Use OpenSSL to generate cryptographically secure secrets:

```bash
# Generate JWT Secret
openssl rand -base64 64

# Generate JWT Refresh Secret
openssl rand -base64 64

# Generate CSRF Secret
openssl rand -base64 64

# Generate Session Secret
openssl rand -base64 64
```

### 3. Configure CORS Origins

Update CORS_ORIGINS for each service based on your deployment:

**Development:**
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Production:**
```env
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## Files Modified

### Auth Service

1. **`services/auth-service/.env.example`**
   - Added comprehensive security configuration
   - Added documentation for each setting
   - Added token storage recommendations

2. **`services/auth-service/src/config/configuration.ts`**
   - Added security configuration section
   - Added CSRF and Helmet settings

3. **`services/auth-service/src/main.ts`**
   - Added Helmet middleware
   - Enhanced CORS configuration
   - Added security headers

4. **`services/auth-service/package.json`**
   - Added helmet dependency
   - Added @types/helmet dev dependency

### Resume Service

1. **`services/resume-service/src/main.ts`**
   - Added Helmet middleware
   - Added compression middleware
   - Enhanced security headers

2. **`services/resume-service/src/app.module.ts`**
   - Added ThrottlerModule
   - Added ThrottlerGuard as global guard

### User Service

1. **`services/user-service/src/main.ts`**
   - Enhanced Helmet configuration
   - Improved CORS setup

2. **`services/user-service/src/app.module.ts`**
   - Added ThrottlerModule
   - Added ThrottlerGuard as global guard

### AI Service (Python)

1. **`services/ai-service/src/main.py`**
   - Added security middleware imports
   - Enhanced CORS configuration
   - Added security headers middleware

### Security Package

1. **`packages/security/src/index.ts`**
   - Added new exports for NestJS security and CSRF

---

## Files Created

### Security Package

1. **`packages/security/src/nestjs-security.ts`**
   - NestJS security configuration helper
   - Helmet configuration presets
   - CORS configuration utility
   - CSP directives for API and Swagger

2. **`packages/security/src/csrf-guard.ts`**
   - CSRF guard implementation
   - CSRF service for token generation
   - @SkipCsrf() decorator

### AI Service

1. **`services/ai-service/src/api/middleware/security.py`**
   - SecurityHeadersMiddleware
   - RateLimitMiddleware
   - InputSanitizationMiddleware
   - RequestSizeLimitMiddleware

### Documentation

1. **`SECURITY_AUDIT_REPORT.md`**
   - Comprehensive security audit findings
   - Detailed analysis of all security aspects
   - Compliance assessment

2. **`SECURITY_IMPLEMENTATION_GUIDE.md`**
   - This file - implementation instructions

---

## Testing Security Features

### 1. Test Rate Limiting

```bash
# Test login rate limiting (should block after 10 attempts)
for i in {1..15}; do
  curl -X POST http://localhost:8001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -v
done

# Should return 429 Too Many Requests after 10 attempts
```

### 2. Test Security Headers

```bash
# Check security headers
curl -I http://localhost:8001/api/v1/health

# Should see:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: default-src 'self'
```

### 3. Test Input Validation

```bash
# Test invalid email
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "Test123!"
  }'

# Should return 422 Validation Error
```

### 4. Test Password Policy

```bash
# Test weak password
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak"
  }'

# Should return validation error with specific requirements
```

### 5. Test JWT Expiration

```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.accessToken')

# Use token immediately (should work)
curl http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Wait 16 minutes and try again (should fail)
# Access token expires after 15 minutes
```

### 6. Test CORS

```bash
# Test from unauthorized origin
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -v

# Should see CORS error in response
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Generate production secrets with OpenSSL
- [ ] Update all .env files with production values
- [ ] Set CORS_ORIGINS to production domains only
- [ ] Set NODE_ENV=production for all services
- [ ] Disable Swagger docs in production (check main.ts files)
- [ ] Review and update BCRYPT_ROUNDS (10-12 for production)
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up Redis for rate limiting (replace in-memory)

### Environment Variables Checklist

#### Auth Service
- [ ] JWT_SECRET (unique, 64+ chars)
- [ ] JWT_REFRESH_SECRET (different from JWT_SECRET)
- [ ] CSRF_SECRET (unique, 64+ chars)
- [ ] SESSION_SECRET (unique, 64+ chars)
- [ ] CORS_ORIGINS (production domains only)
- [ ] DATABASE_URL (production database)
- [ ] SMTP credentials (production email service)

#### All Services
- [ ] THROTTLE_TTL and THROTTLE_LIMIT configured
- [ ] CORS_ORIGINS set correctly
- [ ] Database SSL enabled (production)
- [ ] HELMET_ENABLED=true
- [ ] HSTS_ENABLED=true

### Security Configuration

- [ ] Enable HTTPS/TLS on all services
- [ ] Configure firewall rules
- [ ] Set up DDoS protection (CloudFlare, Azure Front Door)
- [ ] Enable database encryption at rest
- [ ] Configure secret management (Azure Key Vault)
- [ ] Set up security monitoring and alerts
- [ ] Configure log aggregation

### Post-Deployment

- [ ] Run security header tests
- [ ] Test rate limiting
- [ ] Verify CORS configuration
- [ ] Test authentication flows
- [ ] Check JWT token expiration
- [ ] Monitor error logs for security issues
- [ ] Run penetration testing
- [ ] Set up regular security audits

---

## Using the Security Package

### NestJS Services

```typescript
import { configureNestSecurity, SWAGGER_CSP_DIRECTIVES } from '@jobpilot/security';

// In main.ts
configureNestSecurity(app, {
  helmetEnabled: true,
  hstsEnabled: true,
  corsOrigins: process.env.CORS_ORIGINS,
  cspDirectives: SWAGGER_CSP_DIRECTIVES, // Use for services with Swagger
});
```

### CSRF Protection

```typescript
// Enable globally in app.module.ts
import { CsrfGuard } from '@jobpilot/security';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}

// Skip CSRF for specific endpoints
import { SkipCsrf } from '@jobpilot/security';

@SkipCsrf()
@Post('public-endpoint')
async publicEndpoint() {
  // CSRF check skipped
}
```

### Input Sanitization

```typescript
import { sanitizeUserInput, sanitizeEmail } from '@jobpilot/security';

// Sanitize user input
const cleanInput = sanitizeUserInput(userInput);

// Sanitize email
const cleanEmail = sanitizeEmail(email);
```

---

## Monitoring Security

### Key Metrics to Track

1. **Failed Login Attempts**
   - Monitor for brute force attacks
   - Alert on excessive failures from single IP

2. **Rate Limit Violations**
   - Track 429 responses
   - Identify potential DDoS attacks

3. **JWT Token Failures**
   - Monitor invalid/expired tokens
   - Track suspicious token usage

4. **Input Validation Errors**
   - Monitor 422 validation errors
   - Identify potential injection attempts

### Logging

All security events are logged with structured logging:

```typescript
logger.warning('Login failed', {
  email: 'user@example.com',
  ip: '192.168.1.1',
  reason: 'Invalid password',
  attempts: 3,
});
```

### Alerts

Set up alerts for:
- Multiple failed login attempts (>5 per minute)
- Rate limit exceeded (>100 per minute per IP)
- CSRF token validation failures
- Suspicious input patterns (XSS attempts)

---

## Troubleshooting

### CORS Issues

**Problem:** Frontend can't make requests to API
**Solution:**
1. Check CORS_ORIGINS includes frontend domain
2. Verify credentials: true in CORS config
3. Check frontend sends correct Origin header

### Rate Limiting Too Strict

**Problem:** Legitimate users getting rate limited
**Solution:**
1. Increase THROTTLE_LIMIT in .env
2. Adjust per-endpoint limits in controllers
3. Implement user-based (not IP-based) rate limiting

### JWT Token Issues

**Problem:** Tokens expire too quickly
**Solution:**
1. Adjust JWT_ACCESS_TOKEN_EXPIRY (but keep < 1 hour)
2. Implement refresh token flow properly
3. Check token storage on client side

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Last Updated:** December 6, 2025
**Version:** 1.0.0
