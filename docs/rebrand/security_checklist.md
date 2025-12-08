# ApplyforUs Rebrand Security Checklist

Version 1.0 | Last Updated: December 2025

## Overview

This security checklist ensures that the ApplyforUs rebrand maintains the highest security standards across all platform components.

## SSL/TLS Certificate Verification

### Domain Certificates

- [ ] **applyforus.com** - SSL certificate valid and properly configured
- [ ] **www.applyforus.com** - SSL certificate valid and properly configured
- [ ] **api.applyforus.com** - SSL certificate valid and properly configured
- [ ] **app.applyforus.com** - SSL certificate valid and properly configured
- [ ] **admin.applyforus.com** - SSL certificate valid and properly configured

### Certificate Requirements

```bash
# Verify SSL certificate
openssl s_client -connect applyforus.com:443 -servername applyforus.com

# Check expiration
openssl s_client -connect applyforus.com:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate chain
openssl s_client -connect applyforus.com:443 -showcerts
```

### SSL Configuration

```nginx
# nginx SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

- [ ] TLS 1.2+ enabled
- [ ] Strong cipher suites configured
- [ ] HSTS header present
- [ ] Certificate pinning implemented (mobile apps)

## CORS Configuration

### Web Application CORS

```typescript
// apps/web/next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://applyforus.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};
```

### API CORS

```typescript
// Backend services CORS configuration
app.enableCors({
  origin: [
    'https://applyforus.com',
    'https://www.applyforus.com',
    'https://app.applyforus.com',
    'https://admin.applyforus.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

**Verification:**

- [ ] CORS properly configured for all origins
- [ ] No wildcard (*) origins in production
- [ ] Credentials flag set correctly
- [ ] Preflight requests handled

## Authentication Flow

### JWT Token Verification

```typescript
// Verify JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET, // Must be changed for rebrand
  expiresIn: '15m',
  issuer: 'applyforus.com',
  audience: 'applyforus-api',
};

// Token validation
const verifyToken = (token: string) => {
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
};
```

**Checklist:**

- [ ] JWT secret rotated for rebrand
- [ ] Token expiration appropriate (15 minutes)
- [ ] Refresh token rotation enabled
- [ ] Token issuer updated to ApplyforUs
- [ ] Token audience updated
- [ ] Blacklist implemented for revoked tokens

### OAuth Integration

```typescript
// OAuth configuration
const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://applyforus.com/auth/google/callback',
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: 'https://applyforus.com/auth/linkedin/callback',
  },
};
```

**Verification:**

- [ ] OAuth callback URLs updated
- [ ] Client IDs registered with new domain
- [ ] Client secrets rotated
- [ ] Scopes reviewed and minimized
- [ ] State parameter implemented (CSRF protection)

## API Key Rotation

### Required Key Rotations

**Third-Party Services:**

- [ ] **OpenAI API Key** - Rotated and updated
- [ ] **SendGrid API Key** - Rotated and updated
- [ ] **Stripe API Key** - Rotated and updated
- [ ] **AWS Access Keys** - Rotated and updated
- [ ] **Azure Storage Keys** - Rotated and updated
- [ ] **Google Maps API Key** - Rotated and updated
- [ ] **LinkedIn API Key** - Rotated and updated
- [ ] **Indeed API Key** - Rotated and updated

**Rotation Procedure:**

```bash
# 1. Generate new key in service dashboard
# 2. Update Kubernetes secret
kubectl create secret generic api-keys \
  --from-literal=OPENAI_API_KEY=new-key \
  --from-literal=SENDGRID_API_KEY=new-key \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Rollout restart to pick up new secrets
kubectl rollout restart deployment/ai-service -n production

# 4. Verify new key works
curl -H "Authorization: Bearer new-key" https://api.openai.com/v1/models

# 5. Revoke old key
```

## Secret Management

### Environment Variables

**Development:**
```bash
# .env.example (updated)
APP_NAME=ApplyforUs
JWT_SECRET=<generate-new-secret>
DATABASE_URL=<updated-connection-string>
REDIS_URL=<updated-connection-string>
```

**Production (Kubernetes Secrets):**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
stringData:
  JWT_SECRET: <base64-encoded>
  DATABASE_PASSWORD: <base64-encoded>
  REDIS_PASSWORD: <base64-encoded>
  OPENAI_API_KEY: <base64-encoded>
```

**Checklist:**

- [ ] All secrets rotated
- [ ] No hardcoded secrets in code
- [ ] Secrets encrypted at rest
- [ ] Access to secrets limited by RBAC
- [ ] Secret rotation schedule established

### Azure Key Vault Integration

```typescript
// Use Azure Key Vault for secrets
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const vaultUrl = 'https://applyforus-vault.vault.azure.net';
const client = new SecretClient(vaultUrl, credential);

// Retrieve secrets
const jwtSecret = await client.getSecret('JWT-SECRET');
const dbPassword = await client.getSecret('DATABASE-PASSWORD');
```

**Verification:**

- [ ] Key Vault created for ApplyforUs
- [ ] Managed identity configured
- [ ] RBAC permissions set
- [ ] Audit logging enabled

## Vulnerability Scanning

### Dependency Scanning

```bash
# NPM audit
pnpm audit

# Fix vulnerabilities
pnpm audit fix

# Check for critical vulnerabilities
pnpm audit --audit-level=critical

# Generate audit report
pnpm audit --json > audit-report.json
```

**Checklist:**

- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities
- [ ] All dependencies up to date
- [ ] Automated scanning in CI/CD

### Container Scanning

```bash
# Scan Docker images
docker scan applyforus-web:1.0.0

# Trivy scan
trivy image applyforus-web:1.0.0

# Anchore scan
anchore-cli image add applyforus-web:1.0.0
anchore-cli image vuln applyforus-web:1.0.0 all
```

**Verification:**

- [ ] No critical vulnerabilities in base images
- [ ] No high vulnerabilities in dependencies
- [ ] Images signed and verified
- [ ] Regular scanning scheduled

### Code Scanning

```bash
# SonarQube scan
sonar-scanner \
  -Dsonar.projectKey=applyforus \
  -Dsonar.sources=. \
  -Dsonar.host.url=https://sonarqube.applyforus.com

# SAST scanning
# Use tools like Checkmarx, Fortify, or CodeQL
```

**Checklist:**

- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities
- [ ] No authentication bypasses
- [ ] No authorization issues

## Security Headers

### Required Headers

```typescript
// Security headers middleware
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.applyforus.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.applyforus.com; " +
    "frame-ancestors 'none';"
  );

  // Other security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
});
```

**Verification:**

- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] X-XSS-Protection enabled
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured
- [ ] HSTS header present

### Header Verification

```bash
# Test security headers
curl -I https://applyforus.com | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)"

# Use security header scanner
https://securityheaders.com/?q=applyforus.com
```

## Input Validation

### API Input Validation

```typescript
// Use Zod for schema validation
import { z } from 'zod';

const createResumeSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(50000),
  skills: z.array(z.string()).max(50),
  email: z.string().email(),
});

// Validate input
const validateInput = (data: unknown) => {
  return createResumeSchema.parse(data);
};
```

**Checklist:**

- [ ] All user input validated
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] File upload restrictions
- [ ] Rate limiting enabled

## Data Encryption

### At Rest

```typescript
// Encrypt sensitive data before storing
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

const encrypt = (text: string) => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  };
};
```

**Verification:**

- [ ] PII encrypted at rest
- [ ] Database encryption enabled
- [ ] File storage encryption enabled
- [ ] Backup encryption enabled

### In Transit

- [ ] TLS 1.2+ for all connections
- [ ] Certificate pinning (mobile apps)
- [ ] Secure WebSocket connections (WSS)
- [ ] VPN for inter-service communication

## Access Control

### RBAC Configuration

```typescript
// Role-based access control
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

const checkPermission = (userRole: Role, requiredRole: Role) => {
  const hierarchy = {
    guest: 0,
    user: 1,
    admin: 2,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
};
```

**Checklist:**

- [ ] Principle of least privilege applied
- [ ] Role hierarchy defined
- [ ] Permissions properly scoped
- [ ] Admin access logged and monitored

### API Rate Limiting

```typescript
// Rate limiting configuration
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

**Verification:**

- [ ] Rate limiting enabled for all endpoints
- [ ] Different limits for authenticated vs. unauthenticated
- [ ] Rate limit headers present
- [ ] IP-based rate limiting
- [ ] User-based rate limiting

## Logging & Monitoring

### Security Event Logging

```typescript
// Log security events
const logSecurityEvent = (event: string, details: any) => {
  logger.warn({
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });

  // Send to SIEM
  sendToSIEM({
    event,
    severity: 'WARNING',
    details,
  });
};

// Usage
logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
  ip: req.ip,
  email: req.body.email,
  userAgent: req.headers['user-agent'],
});
```

**Events to Log:**

- [ ] Failed login attempts
- [ ] Successful logins (especially admin)
- [ ] Password changes
- [ ] API key usage
- [ ] Permission changes
- [ ] Data access (PII)
- [ ] Suspicious activity

## Penetration Testing

### Pre-Deployment Testing

- [ ] OWASP Top 10 vulnerabilities tested
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] API security testing

### Automated Security Testing

```bash
# OWASP ZAP scanning
zap-cli quick-scan https://applyforus.com

# Burp Suite automated scan
# Configure and run Burp Suite Pro scanner

# Nikto web server scanner
nikto -h https://applyforus.com
```

## Compliance Checklist

### GDPR Compliance

- [ ] Privacy policy updated with new brand
- [ ] Cookie consent banner updated
- [ ] Data processing agreements updated
- [ ] Right to erasure implemented
- [ ] Data portability implemented
- [ ] Breach notification procedures updated

### SOC 2 Compliance

- [ ] Access controls documented
- [ ] Change management procedures followed
- [ ] Security monitoring in place
- [ ] Incident response plan updated
- [ ] Vendor management reviewed

## Security Contacts

**Security Team:** security@applyforus.com
**Bug Bounty:** bugbounty@applyforus.com
**Incident Response:** incident@applyforus.com

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Next Review:** March 2026
