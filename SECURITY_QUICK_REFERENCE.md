# Security Quick Reference Guide
## Job-Apply-Platform - Developer Quick Reference

**Version:** 1.0
**Last Updated:** December 8, 2025

---

## Quick Links

- **Full Audit Report:** [OWASP_SECURITY_AUDIT_2025.md](./OWASP_SECURITY_AUDIT_2025.md)
- **Implementation Guide:** [SECURITY_FIXES_IMPLEMENTATION.md](./SECURITY_FIXES_IMPLEMENTATION.md)
- **Best Practices:** [SECURITY_RECOMMENDATIONS.md](./SECURITY_RECOMMENDATIONS.md)
- **Executive Summary:** [SECURITY_AUDIT_EXECUTIVE_SUMMARY.md](./SECURITY_AUDIT_EXECUTIVE_SUMMARY.md)

---

## Security Status: A- (88/100)

### Overall Assessment
✅ **Production Ready** with minor enhancements recommended

---

## Critical Actions Required

### Before Production Launch

1. **Enable CSRF Protection** (HIGH PRIORITY)
   ```typescript
   // services/auth-service/src/app.module.ts
   providers: [
     {
       provide: APP_GUARD,
       useClass: CsrfGuard,
     },
   ]
   ```

2. **Add Helmet to Services** (HIGH PRIORITY)
   ```bash
   cd services/[service-name]
   npm install helmet @types/helmet
   ```

3. **Enable Database SSL** (HIGH PRIORITY)
   ```typescript
   // Add to typeorm config
   ssl: process.env.NODE_ENV === 'production' ? {
     rejectUnauthorized: true,
   } : false
   ```

---

## Security Checklist

### Authentication
- [x] JWT with 15-minute expiry
- [x] Refresh tokens (7 days)
- [x] Password hashing (bcrypt, 12 rounds)
- [x] MFA support (TOTP)
- [x] Account lockout (5 attempts)
- [x] OAuth integration
- [ ] CSRF protection enabled globally

### Input Validation
- [x] DTO validation (class-validator)
- [x] Type checking
- [x] Whitelist validation
- [x] SQL injection protection (TypeORM)
- [x] XSS protection (CSP + validation)

### Security Headers
- [x] Helmet configured
- [x] HSTS (1 year)
- [x] CSP enabled
- [x] X-Content-Type-Options
- [x] X-Frame-Options
- [ ] All services have Helmet

### Rate Limiting
- [x] Global rate limit (100/min)
- [x] Login rate limit (5/min)
- [x] Registration rate limit (5/min)
- [x] Password reset rate limit (3/min)

### Monitoring & Logging
- [x] Structured logging
- [x] Security event tracking
- [x] Audit trail
- [x] Azure Application Insights
- [ ] Real-time alerting

---

## Environment Variables

### Required Security Variables

```bash
# JWT Configuration
JWT_SECRET=<strong-random-secret-min-64-chars>
JWT_REFRESH_SECRET=<different-strong-secret-min-64-chars>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900

# CSRF Protection
CSRF_ENABLED=true
CSRF_SECRET=<strong-random-secret-min-32-chars>

# Security Headers
HELMET_ENABLED=true
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000

# Database Security
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true

# CORS
CORS_ORIGINS=https://yourdomain.com
CORS_ALLOW_CREDENTIALS=true
```

### Generate Strong Secrets

```bash
# Generate JWT secret (64 bytes)
openssl rand -base64 64

# Generate CSRF secret (32 bytes)
openssl rand -base64 32

# Generate session secret (64 bytes)
openssl rand -base64 64
```

---

## Common Security Patterns

### 1. Secure Route Example

```typescript
import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Get('profile')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Post('admin/users')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Only admins can create users
  }
}
```

### 2. Input Validation Example

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password too weak' }
  )
  password: string;
}
```

### 3. Secure Database Query

```typescript
// ✅ GOOD - Parameterized query
async findUserByEmail(email: string): Promise<User> {
  return this.userRepository.findOne({
    where: { email }, // Safe - parameterized
  });
}

// ✅ GOOD - Query builder with parameters
async searchJobs(keywords: string): Promise<Job[]> {
  return this.jobRepository
    .createQueryBuilder('job')
    .where('job.title LIKE :search', {
      search: `%${keywords}%` // Safe - parameterized
    })
    .getMany();
}

// ❌ BAD - Never do this
async unsafeQuery(input: string): Promise<any> {
  return this.connection.query(
    `SELECT * FROM users WHERE name = '${input}'` // VULNERABLE!
  );
}
```

### 4. File Upload Security

```typescript
import { FileValidator } from '@jobpilot/security';

async uploadFile(file: Buffer, filename: string): Promise<string> {
  // Sanitize filename
  const safeName = FileValidator.sanitizeFilename(filename);

  // Check for executable files
  if (FileValidator.isExecutable(safeName)) {
    throw new BadRequestException('Executable files not allowed');
  }

  // Validate file content (magic numbers)
  const validation = await FileValidator.validateImage(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 2000,
    maxHeight: 2000,
  });

  if (!validation.isValid) {
    throw new BadRequestException(validation.errors.join(', '));
  }

  // Upload using detected MIME type
  return this.storageService.upload(file, validation.metadata.mimeType);
}
```

### 5. Security Event Logging

```typescript
import { SecurityEvent, SecurityAuditService } from '@jobpilot/security';

@Injectable()
export class AuthService {
  constructor(
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async login(loginDto: LoginDto, ip: string): Promise<TokenResponse> {
    try {
      // ... login logic

      // Log successful login
      await this.securityAudit.log(SecurityEvent.LOGIN_SUCCESS, {
        userId: user.id,
        ip,
        userAgent: req.headers['user-agent'],
        result: 'success',
      });

      return tokens;
    } catch (error) {
      // Log failed login
      await this.securityAudit.log(SecurityEvent.LOGIN_FAILURE, {
        ip,
        userAgent: req.headers['user-agent'],
        result: 'failure',
        details: { email: loginDto.email },
      });

      throw error;
    }
  }
}
```

---

## Security Testing

### Run Security Scans

```bash
# NPM audit
npm audit

# NPM audit with fix
npm audit fix

# Check for specific vulnerabilities
npm audit --audit-level=moderate

# Snyk scan (requires account)
npx snyk test

# ESLint security check
npm run lint:security
```

### Manual Security Testing

```bash
# Test HTTPS enforcement
curl -I http://localhost:3000

# Test security headers
curl -I https://localhost:3000

# Test rate limiting
for i in {1..10}; do curl -X POST https://localhost:3000/api/v1/auth/login; done

# Test CORS
curl -H "Origin: https://malicious-site.com" -I https://localhost:3000
```

---

## Common Vulnerabilities to Avoid

### 1. SQL Injection
❌ **NEVER** concatenate user input in SQL queries
✅ **ALWAYS** use parameterized queries (TypeORM does this)

### 2. XSS (Cross-Site Scripting)
❌ **NEVER** trust user input
✅ **ALWAYS** validate and sanitize input
✅ **ALWAYS** encode output
✅ **USE** Content Security Policy

### 3. CSRF (Cross-Site Request Forgery)
❌ **NEVER** rely on cookies alone for authentication
✅ **ALWAYS** use CSRF tokens for state-changing operations
✅ **USE** SameSite cookie attribute

### 4. Insecure Deserialization
❌ **NEVER** deserialize untrusted data
✅ **ALWAYS** validate JSON schema
✅ **USE** class-validator for DTOs

### 5. Sensitive Data Exposure
❌ **NEVER** log passwords or tokens
❌ **NEVER** store passwords in plain text
✅ **ALWAYS** use bcrypt for password hashing
✅ **ALWAYS** use HTTPS in production

### 6. Broken Authentication
❌ **NEVER** use weak password requirements
❌ **NEVER** use long-lived tokens
✅ **ALWAYS** implement account lockout
✅ **ALWAYS** use MFA for sensitive operations

---

## Quick Troubleshooting

### CSRF Token Issues

**Problem:** "CSRF token is required"
**Solution:**
1. Ensure CSRF token is generated on login
2. Include token in request headers: `X-CSRF-Token`
3. Check if endpoint has `@SkipCsrf()` decorator

### Rate Limit Exceeded

**Problem:** "Too many requests"
**Solution:**
1. Check rate limit configuration
2. Implement exponential backoff
3. Use Redis for distributed rate limiting

### JWT Token Expired

**Problem:** "Token has expired"
**Solution:**
1. Use refresh token to get new access token
2. Implement automatic token refresh in frontend
3. Check token expiry times in configuration

### Account Locked

**Problem:** "Account is locked"
**Solution:**
1. Wait for lockout duration (15 minutes)
2. Contact administrator for manual unlock
3. Check failed login attempts in audit logs

---

## Security Contacts

**Security Issues:** security@jobpilot.ai
**Emergency Hotline:** [To be configured]
**Slack Channel:** #security-incidents

---

## Additional Resources

### OWASP Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

### NestJS Security
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS Authorization](https://docs.nestjs.com/security/authorization)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [SonarQube](https://www.sonarqube.org/)
- [OWASP ZAP](https://www.zaproxy.org/)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 8, 2025 | Initial creation |

**Next Review:** March 8, 2026

