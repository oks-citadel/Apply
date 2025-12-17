# Security Recommendations and Best Practices
## Job-Apply-Platform - Production Security Guide

**Date:** December 8, 2025
**Version:** 1.0
**Classification:** Internal Use

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Network Security](#network-security)
5. [Application Security](#application-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Monitoring & Incident Response](#monitoring--incident-response)
8. [Compliance & Governance](#compliance--governance)
9. [Security Training](#security-training)
10. [Appendices](#appendices)

---

## Executive Summary

This document provides comprehensive security recommendations for the Job-Apply-Platform. These guidelines ensure the platform maintains the highest security standards while protecting user data and maintaining regulatory compliance.

### Security Principles

1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Minimum necessary access rights
3. **Fail Securely** - Default to secure state on errors
4. **Complete Mediation** - Check every access attempt
5. **Separation of Duties** - No single point of failure
6. **Open Design** - Security through design, not obscurity

---

## Authentication & Authorization

### Password Management

#### Strong Password Policy

**Implementation:**
```typescript
// Current implementation in register.dto.ts
@Matches(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  },
)
password: string;
```

**Recommendations:**

1. **Password Requirements:**
   - Minimum 8 characters (12+ recommended)
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character
   - No common passwords (implement password blacklist)
   - No personal information (name, email, username)

2. **Password Storage:**
   - ✅ Use bcrypt with 12 salt rounds (implemented)
   - Never store passwords in plain text
   - Never log passwords (even in error messages)
   - Hash passwords before database storage

3. **Password Reset:**
   - Time-limited reset tokens (1 hour max)
   - Single-use reset tokens
   - Invalidate all sessions on password change
   - Notify user via email of password changes
   - Rate limit reset requests (3 per hour)

**Enhanced Implementation:**

```typescript
// Implement password blacklist
const commonPasswords = [
  'password', 'password123', '12345678', 'qwerty',
  'abc123', 'password1', '111111', '123456789',
];

export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;

  // Complexity checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

  // Common password check
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('This password is too common');
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }

  return { score, feedback };
}
```

### Multi-Factor Authentication (MFA)

**Current Status:** ✅ TOTP-based MFA implemented

**Recommendations:**

1. **Enforce MFA for:**
   - Administrators and privileged accounts
   - Access to sensitive data
   - Financial transactions
   - Account settings changes
   - Password resets

2. **MFA Methods:**
   - ✅ TOTP (Google Authenticator, Authy) - Implemented
   - 📝 SMS (less secure, use as fallback only)
   - 📝 Email verification codes
   - 📝 Hardware tokens (YubiKey)
   - 📝 Push notifications
   - 📝 Biometric authentication (mobile apps)

3. **Backup Codes:**
   - Generate 10 single-use backup codes
   - Store hashed in database
   - Allow download/print once
   - Regenerate on use

**Implementation:**

```typescript
export class MfaService {
  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);

      // Store hashed version
      const hashedCode = await bcrypt.hash(code, 10);
      await this.backupCodeRepository.save({
        userId,
        code: hashedCode,
        used: false,
      });
    }

    this.logger.log(`Generated backup codes for user: ${userId}`);
    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const backupCodes = await this.backupCodeRepository.find({
      where: { userId, used: false },
    });

    for (const backupCode of backupCodes) {
      const isValid = await bcrypt.compare(code, backupCode.code);
      if (isValid) {
        // Mark as used
        backupCode.used = true;
        await this.backupCodeRepository.save(backupCode);
        return true;
      }
    }

    return false;
  }
}
```

### Session Management

**Current Status:** ✅ JWT-based sessions with refresh tokens

**Recommendations:**

1. **Token Configuration:**
   - ✅ Access token: 15 minutes (implemented)
   - ✅ Refresh token: 7 days (implemented)
   - Use shorter expiry for sensitive operations
   - Implement token rotation on refresh

2. **Token Storage (Frontend):**
   - **Access Tokens:** Memory only (React state, Vuex store)
   - **Refresh Tokens:** httpOnly, secure, sameSite cookies
   - **Never:** localStorage or sessionStorage

3. **Token Revocation:**
   - ✅ Invalidate on logout (implemented)
   - Invalidate all tokens on password change
   - Implement token blacklist for compromised tokens
   - Use Redis for fast token blacklist lookup

**Enhanced Implementation:**

```typescript
@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async blacklistToken(token: string, expirySeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.redis.setex(key, expirySeconds, '1');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.redis.get(key);
    return result !== null;
  }
}

// Use in JWT strategy
async validate(payload: JwtPayload): Promise<User> {
  const token = this.extractTokenFromRequest();

  // Check if token is blacklisted
  const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token has been revoked');
  }

  // ... rest of validation
}
```

### Role-Based Access Control (RBAC)

**Recommendations:**

1. **Role Hierarchy:**
   ```
   SUPER_ADMIN (all permissions)
     ├── ADMIN (platform management)
     ├── EMPLOYER (job posting, candidate viewing)
     ├── USER (job search, applications)
     └── GUEST (limited read access)
   ```

2. **Permission Model:**
   ```typescript
   enum Permission {
     // User permissions
     READ_OWN_PROFILE = 'user:read:own',
     UPDATE_OWN_PROFILE = 'user:update:own',
     DELETE_OWN_ACCOUNT = 'user:delete:own',

     // Job permissions
     CREATE_JOB = 'job:create',
     READ_JOB = 'job:read',
     UPDATE_JOB = 'job:update',
     DELETE_JOB = 'job:delete',

     // Admin permissions
     MANAGE_USERS = 'admin:users:manage',
     MANAGE_JOBS = 'admin:jobs:manage',
     VIEW_ANALYTICS = 'admin:analytics:view',
     MANAGE_SYSTEM = 'admin:system:manage',
   }

   const rolePermissions: Record<UserRole, Permission[]> = {
     [UserRole.SUPER_ADMIN]: Object.values(Permission),
     [UserRole.ADMIN]: [
       Permission.MANAGE_USERS,
       Permission.MANAGE_JOBS,
       Permission.VIEW_ANALYTICS,
       Permission.READ_JOB,
     ],
     [UserRole.EMPLOYER]: [
       Permission.CREATE_JOB,
       Permission.READ_JOB,
       Permission.UPDATE_JOB,
       Permission.DELETE_JOB,
       Permission.READ_OWN_PROFILE,
       Permission.UPDATE_OWN_PROFILE,
     ],
     [UserRole.USER]: [
       Permission.READ_JOB,
       Permission.READ_OWN_PROFILE,
       Permission.UPDATE_OWN_PROFILE,
       Permission.DELETE_OWN_ACCOUNT,
     ],
   };
   ```

3. **Permission Guard:**
   ```typescript
   @Injectable()
   export class PermissionGuard implements CanActivate {
     constructor(private reflector: Reflector) {}

     canActivate(context: ExecutionContext): boolean {
       const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
         'permissions',
         [context.getHandler(), context.getClass()],
       );

       if (!requiredPermissions) {
         return true;
       }

       const { user } = context.switchToHttp().getRequest();
       const userPermissions = rolePermissions[user.role] || [];

       return requiredPermissions.every(permission =>
         userPermissions.includes(permission),
       );
     }
   }

   // Usage
   @Permissions(Permission.MANAGE_USERS)
   @UseGuards(JwtAuthGuard, PermissionGuard)
   @Get('users')
   async getUsers() {
     // Only accessible to users with MANAGE_USERS permission
   }
   ```

---

## Data Protection

### Data Classification

**Classification Levels:**

1. **Public** - No restrictions
   - Job listings (public)
   - Company information (public)
   - Platform documentation

2. **Internal** - Employee access only
   - System logs
   - Internal documentation
   - Aggregated analytics

3. **Confidential** - Authorized access only
   - User profiles
   - Application data
   - Resume content
   - AI-generated content

4. **Restricted** - Strict access controls
   - Authentication credentials
   - Payment information
   - Personal identifiable information (PII)
   - API keys and secrets

### Data Encryption

#### At Rest

**Recommendations:**

1. **Database Encryption:**
   - Enable Transparent Data Encryption (TDE) on PostgreSQL
   - Use Azure SQL Database encryption
   - Encrypt backups with strong keys

2. **Field-Level Encryption:**
   ```typescript
   import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

   export class EncryptionService {
     private readonly algorithm = 'aes-256-gcm';
     private readonly keyLength = 32;
     private readonly ivLength = 16;
     private readonly tagLength = 16;

     constructor(private readonly masterKey: string) {}

     encrypt(plaintext: string): string {
       const iv = randomBytes(this.ivLength);
       const cipher = createCipheriv(
         this.algorithm,
         Buffer.from(this.masterKey, 'hex'),
         iv,
       );

       let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
       ciphertext += cipher.final('hex');

       const tag = cipher.getAuthTag();

       // Return iv + ciphertext + tag (all hex encoded)
       return iv.toString('hex') + ciphertext + tag.toString('hex');
     }

     decrypt(encrypted: string): string {
       const iv = Buffer.from(encrypted.slice(0, this.ivLength * 2), 'hex');
       const tag = Buffer.from(encrypted.slice(-this.tagLength * 2), 'hex');
       const ciphertext = encrypted.slice(
         this.ivLength * 2,
         -this.tagLength * 2,
       );

       const decipher = createDecipheriv(
         this.algorithm,
         Buffer.from(this.masterKey, 'hex'),
         iv,
       );
       decipher.setAuthTag(tag);

       let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
       plaintext += decipher.final('utf8');

       return plaintext;
     }
   }

   // Usage in entity
   @Entity()
   export class User {
     @Column({ type: 'text' })
     @Transform(({ value }) => encryptionService.encrypt(value), { toClassOnly: false })
     @Transform(({ value }) => encryptionService.decrypt(value), { toPlainOnly: false })
     ssn?: string; // Social Security Number - encrypted at field level
   }
   ```

3. **File Encryption:**
   - Encrypt files before S3 upload
   - Use S3 server-side encryption (SSE-S3 or SSE-KMS)
   - Encrypt file metadata

#### In Transit

**Recommendations:**

1. **HTTPS Enforcement:**
   - ✅ HSTS headers enabled (implemented)
   - Force HTTPS redirect
   - Use TLS 1.3 (minimum TLS 1.2)
   - Strong cipher suites only

2. **API Security:**
   - ✅ JWT tokens over HTTPS (implemented)
   - Validate SSL certificates
   - Implement certificate pinning (mobile apps)

3. **Internal Communication:**
   - Service-to-service encryption
   - Mutual TLS (mTLS) for microservices
   - VPN for administrative access

### Data Retention and Deletion

**Recommendations:**

1. **Retention Policies:**
   ```typescript
   enum DataRetention {
     USER_PROFILE = 365 * 2, // 2 years after account deletion
     APPLICATION_DATA = 365 * 3, // 3 years
     AUDIT_LOGS = 365 * 7, // 7 years (compliance)
     SESSION_LOGS = 90, // 90 days
     AI_GENERATIONS = 365, // 1 year
   }

   @Injectable()
   export class DataRetentionService {
     async deleteExpiredData(): Promise<void> {
       const now = new Date();

       // Delete old user accounts (soft deleted > 2 years ago)
       await this.userRepository
         .createQueryBuilder()
         .delete()
         .where('deletedAt IS NOT NULL')
         .andWhere('deletedAt < :date', {
           date: new Date(now.getTime() - DataRetention.USER_PROFILE * 24 * 60 * 60 * 1000),
         })
         .execute();

       // Delete old session logs
       await this.sessionLogRepository
         .createQueryBuilder()
         .delete()
         .where('createdAt < :date', {
           date: new Date(now.getTime() - DataRetention.SESSION_LOGS * 24 * 60 * 60 * 1000),
         })
         .execute();

       this.logger.log('Expired data deleted successfully');
     }
   }
   ```

2. **Right to be Forgotten (GDPR):**
   ```typescript
   @Injectable()
   export class GdprService {
     async deleteUserData(userId: string): Promise<void> {
       // 1. Anonymize user data
       await this.userRepository.update(userId, {
         email: `deleted-${userId}@anonymized.local`,
         firstName: 'Deleted',
         lastName: 'User',
         phoneNumber: null,
         profilePicture: null,
         deletedAt: new Date(),
       });

       // 2. Delete associated data
       await this.resumeService.deleteUserResumes(userId);
       await this.applicationService.anonymizeApplications(userId);
       await this.storageService.deleteUserFiles(userId);

       // 3. Revoke all tokens
       await this.authService.revokeAllUserTokens(userId);

       // 4. Log deletion for audit trail
       this.logger.log(`User data deleted (GDPR): ${userId}`);
     }
   }
   ```

---

## Network Security

### API Gateway Security

**Recommendations:**

1. **Rate Limiting (Implemented):**
   - Global: 100 req/min
   - Login: 5 req/min
   - Registration: 5 req/min
   - API calls: 1000 req/hour per user

2. **IP Whitelisting:**
   ```typescript
   @Injectable()
   export class IpWhitelistMiddleware implements NestMiddleware {
     private readonly whitelist: string[];

     constructor(configService: ConfigService) {
       this.whitelist = configService
         .get<string>('IP_WHITELIST', '')
         .split(',')
         .filter(Boolean);
     }

     use(req: Request, res: Response, next: NextFunction) {
       if (this.whitelist.length === 0) {
         return next();
       }

       const clientIp = req.ip || req.connection.remoteAddress;

       if (!this.whitelist.includes(clientIp)) {
         throw new ForbiddenException('IP address not allowed');
       }

       next();
     }
   }
   ```

3. **DDoS Protection:**
   - Use Azure DDoS Protection
   - Implement request throttling
   - Set up CloudFlare or similar CDN
   - Monitor for attack patterns

### Firewall Configuration

**Recommendations:**

1. **Network Segmentation:**
   ```
   ┌─────────────────────────────────────────┐
   │         Internet (Public)               │
   └─────────────────┬───────────────────────┘
                     │
   ┌─────────────────▼───────────────────────┐
   │      DMZ (Web/API Gateway)              │
   │  - Load Balancer                        │
   │  - API Gateway                          │
   │  - WAF (Web Application Firewall)       │
   └─────────────────┬───────────────────────┘
                     │
   ┌─────────────────▼───────────────────────┐
   │    Application Tier (Private Subnet)    │
   │  - NestJS Services                      │
   │  - Python AI Service                    │
   └─────────────────┬───────────────────────┘
                     │
   ┌─────────────────▼───────────────────────┐
   │     Data Tier (Private Subnet)          │
   │  - PostgreSQL                           │
   │  - Redis                                │
   │  - Vector Database                      │
   └─────────────────────────────────────────┘
   ```

2. **Firewall Rules:**
   ```yaml
   # Azure Network Security Group Rules
   inbound_rules:
     - name: "Allow HTTPS"
       priority: 100
       source: "Internet"
       destination: "DMZ"
       port: 443
       protocol: "TCP"
       action: "Allow"

     - name: "Allow HTTP (redirect to HTTPS)"
       priority: 110
       source: "Internet"
       destination: "DMZ"
       port: 80
       protocol: "TCP"
       action: "Allow"

     - name: "Deny All Other"
       priority: 4096
       source: "Any"
       destination: "Any"
       port: "Any"
       protocol: "Any"
       action: "Deny"
   ```

---

## Application Security

### Input Validation

**Current Status:** ✅ class-validator implemented

**Recommendations:**

1. **Validation Layers:**
   - ✅ DTO validation (implemented)
   - ✅ Type checking (implemented)
   - 📝 Business logic validation
   - 📝 Database constraints

2. **Enhanced Validation:**
   ```typescript
   import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

   @ValidatorConstraint({ name: 'noSqlInjection', async: false })
   export class NoSqlInjectionConstraint implements ValidatorConstraintInterface {
     validate(value: any): boolean {
       if (typeof value === 'string') {
         // Check for SQL injection patterns
         const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i;
         if (sqlPatterns.test(value)) {
           return false;
         }

         // Check for MongoDB injection patterns
         const noSqlPatterns = /(\$where|\$ne|\$gt|\$lt|\$or|\$and)/i;
         if (noSqlPatterns.test(value)) {
           return false;
         }
       }

       return true;
     }

     defaultMessage(): string {
       return 'Input contains potentially malicious content';
     }
   }

   // Usage
   export class SearchDto {
     @IsString()
     @Validate(NoSqlInjectionConstraint)
     query: string;
   }
   ```

### Output Encoding

**Recommendations:**

1. **HTML Encoding:**
   ```typescript
   import * as escapeHtml from 'escape-html';

   export class OutputEncoder {
     static encodeHtml(input: string): string {
       return escapeHtml(input);
     }

     static encodeAttribute(input: string): string {
       return input
         .replace(/&/g, '&amp;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#x27;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;');
     }

     static encodeJavaScript(input: string): string {
       return input
         .replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(/"/g, '\\"')
         .replace(/\n/g, '\\n')
         .replace(/\r/g, '\\r')
         .replace(/\t/g, '\\t');
     }

     static encodeUrl(input: string): string {
       return encodeURIComponent(input);
     }
   }
   ```

2. **Content Security Policy:**
   ```typescript
   // Strict CSP for frontend
   const cspDirectives = {
     defaultSrc: ["'self'"],
     scriptSrc: [
       "'self'",
       "'nonce-{RANDOM_NONCE}'", // Generate per request
     ],
     styleSrc: [
       "'self'",
       "'nonce-{RANDOM_NONCE}'",
     ],
     imgSrc: ["'self'", 'data:', 'https://trusted-cdn.com'],
     connectSrc: ["'self'", 'https://api.jobpilot.ai'],
     fontSrc: ["'self'", 'https://fonts.gstatic.com'],
     objectSrc: ["'none'"],
     mediaSrc: ["'self'"],
     frameSrc: ["'none'"],
     baseUri: ["'self'"],
     formAction: ["'self'"],
     frameAncestors: ["'none'"],
     upgradeInsecureRequests: [],
   };
   ```

### Error Handling

**Recommendations:**

1. **Secure Error Messages:**
   ```typescript
   @Catch()
   export class GlobalExceptionFilter implements ExceptionFilter {
     constructor(private readonly logger: Logger) {}

     catch(exception: any, host: ArgumentsHost) {
       const ctx = host.switchToHttp();
       const response = ctx.getResponse<Response>();
       const request = ctx.getRequest<Request>();

       const status =
         exception instanceof HttpException
           ? exception.getStatus()
           : HttpStatus.INTERNAL_SERVER_ERROR;

       // Log full error (including stack trace) for debugging
       this.logger.error('Exception occurred', {
         error: exception.message,
         stack: exception.stack,
         path: request.url,
         method: request.method,
         user: request.user?.id,
       });

       // Return sanitized error to client
       const errorResponse = {
         statusCode: status,
         timestamp: new Date().toISOString(),
         path: request.url,
         message:
           process.env.NODE_ENV === 'production'
             ? 'An error occurred' // Generic message in production
             : exception.message, // Detailed message in development
       };

       response.status(status).json(errorResponse);
     }
   }
   ```

2. **Error Types:**
   ```typescript
   export enum SecurityErrorCode {
     INVALID_TOKEN = 'SECURITY_001',
     CSRF_VIOLATION = 'SECURITY_002',
     RATE_LIMIT_EXCEEDED = 'SECURITY_003',
     UNAUTHORIZED_ACCESS = 'SECURITY_004',
     INVALID_CREDENTIALS = 'SECURITY_005',
     ACCOUNT_LOCKED = 'SECURITY_006',
     MFA_REQUIRED = 'SECURITY_007',
     SUSPICIOUS_ACTIVITY = 'SECURITY_008',
   }

   export class SecurityException extends HttpException {
     constructor(
       code: SecurityErrorCode,
       message: string,
       status: HttpStatus = HttpStatus.FORBIDDEN,
     ) {
       super({ code, message }, status);
     }
   }
   ```

---

## Infrastructure Security

### Container Security

**Recommendations:**

1. **Docker Security:**
   ```dockerfile
   # Use specific version tags (not 'latest')
   FROM node:18.17.1-alpine

   # Run as non-root user
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nestjs -u 1001

   # Set working directory
   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install dependencies (production only)
   RUN npm ci --only=production

   # Copy application code
   COPY --chown=nestjs:nodejs . .

   # Switch to non-root user
   USER nestjs

   # Expose port
   EXPOSE 3000

   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD node healthcheck.js

   # Start application
   CMD ["node", "dist/main.js"]
   ```

2. **Image Scanning:**
   ```yaml
   # .github/workflows/container-scan.yml
   name: Container Security Scan

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     scan:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Build image
           run: docker build -t jobpilot/auth-service:${{ github.sha }} .

         - name: Scan with Trivy
           uses: aquasecurity/trivy-action@master
           with:
             image-ref: jobpilot/auth-service:${{ github.sha }}
             format: 'sarif'
             output: 'trivy-results.sarif'
             severity: 'CRITICAL,HIGH'

         - name: Upload results to GitHub Security
           uses: github/codeql-action/upload-sarif@v2
           with:
             sarif_file: 'trivy-results.sarif'
   ```

### Kubernetes Security

**Recommendations:**

1. **Pod Security Policies:**
   ```yaml
   apiVersion: policy/v1beta1
   kind: PodSecurityPolicy
   metadata:
     name: restricted
   spec:
     privileged: false
     allowPrivilegeEscalation: false
     requiredDropCapabilities:
       - ALL
     volumes:
       - 'configMap'
       - 'emptyDir'
       - 'projected'
       - 'secret'
       - 'downwardAPI'
       - 'persistentVolumeClaim'
     runAsUser:
       rule: 'MustRunAsNonRoot'
     seLinux:
       rule: 'RunAsAny'
     fsGroup:
       rule: 'RunAsAny'
     readOnlyRootFilesystem: true
   ```

2. **Network Policies:**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: auth-service-network-policy
     namespace: jobpilot
   spec:
     podSelector:
       matchLabels:
         app: auth-service
     policyTypes:
       - Ingress
       - Egress
     ingress:
       - from:
           - namespaceSelector:
               matchLabels:
                 name: jobpilot
           ports:
             - protocol: TCP
               port: 3001
     egress:
       - to:
           - podSelector:
               matchLabels:
                 app: postgres
           ports:
             - protocol: TCP
               port: 5432
       - to:
           - podSelector:
               matchLabels:
                 app: redis
           ports:
             - protocol: TCP
               port: 6379
   ```

3. **Secrets Management:**
   ```yaml
   # Use Azure Key Vault integration
   apiVersion: v1
   kind: Secret
   metadata:
     name: auth-service-secrets
     namespace: jobpilot
   type: Opaque
   data:
     # Reference secrets from Azure Key Vault
     # Never commit actual secrets to Git
   ```

---

## Monitoring & Incident Response

### Security Monitoring

**Recommendations:**

1. **Log Everything Security-Related:**
   ```typescript
   export enum SecurityEvent {
     LOGIN_SUCCESS = 'auth.login.success',
     LOGIN_FAILURE = 'auth.login.failure',
     LOGOUT = 'auth.logout',
     PASSWORD_RESET_REQUEST = 'auth.password.reset.request',
     PASSWORD_RESET_SUCCESS = 'auth.password.reset.success',
     MFA_ENABLED = 'auth.mfa.enabled',
     MFA_DISABLED = 'auth.mfa.disabled',
     ACCOUNT_LOCKED = 'auth.account.locked',
     SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
     RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
     CSRF_VIOLATION = 'security.csrf.violation',
     UNAUTHORIZED_ACCESS = 'security.unauthorized.access',
     FILE_UPLOAD = 'data.file.upload',
     DATA_EXPORT = 'data.export',
     ADMIN_ACTION = 'admin.action',
   }

   @Injectable()
   export class SecurityAuditService {
     constructor(
       private readonly logger: Logger,
       @InjectRepository(AuditLog)
       private readonly auditLogRepository: Repository<AuditLog>,
     ) {}

     async log(event: SecurityEvent, metadata: {
       userId?: string;
       ip?: string;
       userAgent?: string;
       resource?: string;
       action?: string;
       result?: 'success' | 'failure';
       details?: any;
     }): Promise<void> {
       // Log to application logs
       this.logger.log(event, metadata);

       // Store in audit table
       await this.auditLogRepository.save({
         event,
         userId: metadata.userId,
         ip: metadata.ip,
         userAgent: metadata.userAgent,
         resource: metadata.resource,
         action: metadata.action,
         result: metadata.result,
         details: JSON.stringify(metadata.details),
         timestamp: new Date(),
       });

       // Send to Azure Application Insights
       // ... telemetry code
     }
   }
   ```

2. **Alerting Rules:**
   ```typescript
   export class SecurityAlertService {
     private readonly thresholds = {
       failedLogins: 5, // Alert after 5 failed logins in 5 minutes
       suspiciousIps: 3, // Alert if same IP fails from 3 different accounts
       rateLimitViolations: 10, // Alert after 10 rate limit violations
       accountLockouts: 3, // Alert after 3 account lockouts
     };

     async checkForSuspiciousActivity(): Promise<void> {
       // Check for brute force attacks
       const failedLogins = await this.getRecentFailedLogins(5);
       if (failedLogins.length >= this.thresholds.failedLogins) {
         await this.sendAlert('BRUTE_FORCE_DETECTED', failedLogins);
       }

       // Check for credential stuffing
       const suspiciousIps = await this.getSuspiciousIps();
       if (suspiciousIps.length >= this.thresholds.suspiciousIps) {
         await this.sendAlert('CREDENTIAL_STUFFING_DETECTED', suspiciousIps);
       }

       // Check for DoS attacks
       const rateLimitViolations = await this.getRecentRateLimitViolations();
       if (rateLimitViolations.length >= this.thresholds.rateLimitViolations) {
         await this.sendAlert('DOS_ATTACK_DETECTED', rateLimitViolations);
       }
     }

     private async sendAlert(type: string, data: any): Promise<void> {
       // Send to security team
       this.logger.error(`SECURITY ALERT: ${type}`, data);

       // Send email notification
       // Send Slack notification
       // Create incident in incident management system
     }
   }
   ```

### Incident Response Plan

**Process:**

1. **Preparation:**
   - Security team contact information
   - Incident classification levels
   - Response procedures
   - Communication templates

2. **Detection & Analysis:**
   - Monitor security alerts
   - Analyze logs and metrics
   - Determine incident severity
   - Document findings

3. **Containment:**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs
   - Preserve evidence

4. **Eradication:**
   - Remove malware/backdoors
   - Patch vulnerabilities
   - Update security controls
   - Verify system integrity

5. **Recovery:**
   - Restore from clean backups
   - Verify system functionality
   - Monitor for reoccurrence
   - Gradual service restoration

6. **Post-Incident:**
   - Document lessons learned
   - Update security procedures
   - Improve detection capabilities
   - Train team on findings

---

## Compliance & Governance

### GDPR Compliance

**Requirements:**

1. **Data Subject Rights:**
   - Right to access (export user data)
   - Right to rectification (update user data)
   - Right to erasure (delete user data)
   - Right to restriction (limit processing)
   - Right to data portability (export in standard format)
   - Right to object (opt-out of processing)

2. **Implementation:**
   ```typescript
   @Controller('gdpr')
   export class GdprController {
     @Get('data-export')
     @UseGuards(JwtAuthGuard)
     async exportUserData(@CurrentUser() user: User): Promise<any> {
       return {
         profile: await this.userService.getUserProfile(user.id),
         applications: await this.applicationService.getUserApplications(user.id),
         resumes: await this.resumeService.getUserResumes(user.id),
         activityLog: await this.activityService.getUserActivity(user.id),
       };
     }

     @Delete('delete-account')
     @UseGuards(JwtAuthGuard)
     async deleteAccount(@CurrentUser() user: User): Promise<void> {
       await this.gdprService.deleteUserData(user.id);
     }

     @Post('restrict-processing')
     @UseGuards(JwtAuthGuard)
     async restrictProcessing(@CurrentUser() user: User): Promise<void> {
       await this.userService.update(user.id, {
         processingRestricted: true,
       });
     }
   }
   ```

3. **Consent Management:**
   ```typescript
   enum ConsentType {
     MARKETING_EMAILS = 'marketing_emails',
     ANALYTICS = 'analytics',
     PERSONALIZATION = 'personalization',
     DATA_SHARING = 'data_sharing',
   }

   @Entity()
   export class UserConsent {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column()
     userId: string;

     @Column({ type: 'enum', enum: ConsentType })
     type: ConsentType;

     @Column()
     granted: boolean;

     @Column({ type: 'timestamp' })
     grantedAt: Date;

     @Column({ nullable: true, type: 'timestamp' })
     revokedAt?: Date;

     @Column({ type: 'text' })
     ipAddress: string;
   }
   ```

### SOC 2 Compliance

**Requirements:**

1. **Security Criteria:**
   - ✅ Access controls implemented
   - ✅ Encryption in transit and at rest
   - ✅ System monitoring and logging
   - ✅ Incident response procedures
   - 📝 Vendor management program
   - 📝 Risk assessment process

2. **Audit Trail:**
   ```typescript
   @Entity()
   export class AuditLog {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column()
     event: string;

     @Column({ nullable: true })
     userId?: string;

     @Column({ nullable: true })
     ip?: string;

     @Column({ nullable: true })
     userAgent?: string;

     @Column({ nullable: true })
     resource?: string;

     @Column({ nullable: true })
     action?: string;

     @Column({ nullable: true })
     result?: string;

     @Column({ type: 'jsonb', nullable: true })
     details?: any;

     @CreateDateColumn()
     timestamp: Date;

     @Index()
     @Column()
     severity: 'low' | 'medium' | 'high' | 'critical';
   }
   ```

---

## Security Training

### Developer Security Training

**Topics:**

1. **Secure Coding Practices**
   - OWASP Top 10
   - Input validation
   - Output encoding
   - Authentication & authorization
   - Cryptography
   - Error handling

2. **Security Tools**
   - ESLint security plugins
   - npm audit
   - Snyk
   - SonarQube
   - Git secrets scanning

3. **Code Review Checklist**
   - Authentication checks
   - Authorization checks
   - Input validation
   - SQL injection prevention
   - XSS prevention
   - CSRF protection
   - Sensitive data handling
   - Error message sanitization
   - Logging security events

### Security Awareness

**For All Team Members:**

1. **Phishing Awareness**
2. **Password Security**
3. **Social Engineering**
4. **Data Handling**
5. **Incident Reporting**

---

## Appendices

### A. Security Checklist

**Pre-Production:**
- [ ] All security fixes implemented
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Input validation comprehensive
- [ ] Error handling secure
- [ ] Logging implemented
- [ ] Monitoring configured
- [ ] Secrets in Key Vault
- [ ] Database encryption enabled
- [ ] Backups encrypted
- [ ] Incident response plan documented
- [ ] Security testing completed
- [ ] Penetration testing passed

**Monthly:**
- [ ] Review security alerts
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Review firewall rules

**Quarterly:**
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review incident response plan
- [ ] Update security documentation
- [ ] Security training

**Annually:**
- [ ] Full security assessment
- [ ] Compliance audit
- [ ] Disaster recovery test
- [ ] Review and update policies
- [ ] Third-party security assessment

### B. Contact Information

**Security Team:**
- Email: security@jobpilot.ai
- Phone: [Emergency Hotline]
- Slack: #security-incidents

**Emergency Contacts:**
- Security Lead: [Name, Contact]
- CTO: [Name, Contact]
- DevOps Lead: [Name, Contact]

### C. Useful Resources

**OWASP:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/

**NIST:**
- Cybersecurity Framework: https://www.nist.gov/cyberframework

**Azure Security:**
- Azure Security Best Practices: https://docs.microsoft.com/azure/security/

---

**Document Version:** 1.0
**Last Updated:** December 8, 2025
**Next Review:** March 8, 2026
**Owner:** Security Engineering Team
