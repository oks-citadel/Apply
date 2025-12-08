# Security Fixes Implementation Guide
## Job-Apply-Platform - OWASP Top 10 Remediation

**Date:** December 8, 2025
**Version:** 1.0

This document provides step-by-step implementation guides for all security fixes identified in the OWASP Security Audit.

---

## Table of Contents

1. [Enable CSRF Protection Globally](#1-enable-csrf-protection-globally)
2. [Add Helmet to All Services](#2-add-helmet-to-all-services)
3. [Enforce Database SSL/TLS](#3-enforce-database-ssltls)
4. [Enhance File Upload Security](#4-enhance-file-upload-security)
5. [Implement Automated Security Scanning](#5-implement-automated-security-scanning)
6. [Set Up Azure Key Vault](#6-set-up-azure-key-vault)
7. [Add Content Security Verification](#7-add-content-security-verification)

---

## 1. Enable CSRF Protection Globally

### Priority: HIGH
### Effort: LOW
### Risk Mitigation: Medium

### Implementation Steps

#### Step 1: Enable CSRF Guard in Auth Service

**File:** `services/auth-service/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { CsrfGuard } from '@jobpilot/security';

@Module({
  // ... existing imports
  providers: [
    // Add CSRF Guard globally
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    // ... other providers
  ],
})
export class AppModule {}
```

#### Step 2: Generate CSRF Token on Login

**File:** `services/auth-service/src/modules/auth/auth.service.ts`

Add after successful login:

```typescript
import { generateCsrfToken } from '@jobpilot/security';

async login(loginDto: LoginDto, ip?: string): Promise<TokenResponseDto> {
  // ... existing login logic

  // Generate CSRF token
  const csrfToken = generateCsrfToken();

  // Store CSRF token with user session
  await this.usersService.updateCsrfToken(user.id, csrfToken);

  // ... generate JWT tokens

  return new TokenResponseDto(
    tokens.accessToken,
    tokens.refreshToken,
    user,
    this.parseExpiresIn(this.accessTokenExpiresIn),
    csrfToken, // Add CSRF token to response
  );
}
```

#### Step 3: Update User Entity

**File:** `services/auth-service/src/modules/users/entities/user.entity.ts`

```typescript
@Entity('users')
export class User extends BaseEntity {
  // ... existing fields

  @Column({ nullable: true })
  csrfToken?: string;

  @Column({ nullable: true, type: 'timestamp' })
  csrfTokenExpiry?: Date;
}
```

#### Step 4: Create Migration

```bash
cd services/auth-service
npm run migration:generate -- src/migrations/AddCsrfToken
npm run migration:run
```

#### Step 5: Update JWT Payload

**File:** `services/auth-service/src/modules/auth/strategies/jwt.strategy.ts`

```typescript
async validate(payload: JwtPayload): Promise<User> {
  const user = await this.usersService.findById(payload.sub);

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  // Attach CSRF token to request
  (user as any).csrfToken = user.csrfToken;

  return user;
}
```

#### Step 6: Skip CSRF for Public Endpoints

```typescript
import { SkipCsrf } from '@jobpilot/security';

@Controller('auth')
export class AuthController {
  @Post('login')
  @SkipCsrf() // Skip CSRF for login endpoint
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    // ... login logic
  }

  @Post('register')
  @SkipCsrf() // Skip CSRF for registration
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    // ... registration logic
  }
}
```

#### Step 7: Frontend Integration

**Example (React):**

```typescript
// Store CSRF token from login response
const loginResponse = await api.post('/auth/login', credentials);
const { csrfToken } = loginResponse.data;

// Store in memory (not localStorage)
sessionStorage.setItem('csrf-token', csrfToken);

// Add to all state-changing requests
axios.interceptors.request.use((config) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
    const csrfToken = sessionStorage.getItem('csrf-token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});
```

---

## 2. Add Helmet to All Services

### Priority: HIGH
### Effort: LOW
### Risk Mitigation: Medium

### Services Requiring Helmet

1. resume-service
2. user-service
3. job-service
4. analytics-service
5. auto-apply-service
6. notification-service

### Implementation Template

For each service, follow these steps:

#### Step 1: Install Helmet

```bash
cd services/{service-name}
npm install helmet @types/helmet --save
```

#### Step 2: Update main.ts

**File:** `services/{service-name}/src/main.ts`

```typescript
import helmet from 'helmet';
import { configureNestSecurity } from '@jobpilot/security';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Option 1: Use shared security configuration
  configureNestSecurity(app, {
    helmetEnabled: true,
    hstsEnabled: true,
    hstsMaxAge: 31536000,
    corsOrigins: configService.get('CORS_ORIGINS', '*'),
    corsCredentials: true,
    cspEnabled: true,
  });

  // Option 2: Custom Helmet configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // ... rest of bootstrap
}
```

#### Step 3: Update package.json

Add to package.json for each service:

```json
{
  "dependencies": {
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "@types/helmet": "^4.0.0"
  }
}
```

#### Step 4: Test Security Headers

```bash
# Start service
npm run start:dev

# Test headers
curl -I http://localhost:PORT/health

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# X-XSS-Protection: 0
# Content-Security-Policy: default-src 'self'...
```

---

## 3. Enforce Database SSL/TLS

### Priority: HIGH
### Effort: LOW
### Risk Mitigation: High

### Implementation Steps

#### Step 1: Update TypeORM Configuration

**File:** `services/auth-service/src/config/typeorm.config.ts`

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const sslEnabled = configService.get('DB_SSL_ENABLED', 'false') === 'true';

  return {
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),

    // SSL/TLS Configuration
    ssl: sslEnabled ? {
      rejectUnauthorized: configService.get('DB_SSL_REJECT_UNAUTHORIZED', 'true') === 'true',
      ca: configService.get('DB_SSL_CA_CERT')
        ? fs.readFileSync(configService.get('DB_SSL_CA_CERT')).toString()
        : undefined,
      cert: configService.get('DB_SSL_CLIENT_CERT')
        ? fs.readFileSync(configService.get('DB_SSL_CLIENT_CERT')).toString()
        : undefined,
      key: configService.get('DB_SSL_CLIENT_KEY')
        ? fs.readFileSync(configService.get('DB_SSL_CLIENT_KEY')).toString()
        : undefined,
    } : false,

    // Force SSL in production
    extra: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    } : {},

    // ... other TypeORM options
  };
};
```

#### Step 2: Update Environment Variables

**File:** `.env.example`

```bash
# Database Security
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA_CERT=/path/to/ca-certificate.crt
DB_SSL_CLIENT_CERT=/path/to/client-certificate.crt
DB_SSL_CLIENT_KEY=/path/to/client-key.key

# Azure PostgreSQL Example
# DB_SSL_CA_CERT=/etc/ssl/certs/BaltimoreCyberTrustRoot.crt.pem
```

#### Step 3: Azure PostgreSQL Configuration

For Azure PostgreSQL:

```bash
# Download Azure PostgreSQL CA certificate
curl -o /etc/ssl/certs/BaltimoreCyberTrustRoot.crt.pem \
  https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem

# Update .env
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA_CERT=/etc/ssl/certs/BaltimoreCyberTrustRoot.crt.pem
```

#### Step 4: Connection String Format

For DATABASE_URL:

```bash
# PostgreSQL with SSL
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require&sslrootcert=/path/to/ca.crt

# Azure PostgreSQL
DATABASE_URL=postgresql://user@server:password@server.postgres.database.azure.com:5432/database?sslmode=require
```

#### Step 5: Verify SSL Connection

```typescript
// Add to health check
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async checkDatabaseSSL(): Promise<{ ssl: boolean; details: any }> {
    const result = await this.dataSource.query(
      "SELECT ssl, version FROM pg_stat_ssl WHERE pid = pg_backend_pid()"
    );

    return {
      ssl: result[0]?.ssl || false,
      details: result[0],
    };
  }
}
```

---

## 4. Enhance File Upload Security

### Priority: MEDIUM
### Effort: MEDIUM
### Risk Mitigation: Medium

### Implementation Steps

#### Step 1: Create File Validation Utility

**File:** `packages/security/src/file-validator.ts`

```typescript
import { BadRequestException } from '@nestjs/common';
import * as fileType from 'file-type';
import { createHash } from 'crypto';

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  scanForMalware?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  metadata: {
    mimeType: string;
    extension: string;
    size: number;
    hash: string;
  };
}

export class FileValidator {
  /**
   * Validate file using magic numbers (file signature)
   */
  static async validateFileContent(
    buffer: Buffer,
    options: FileValidationOptions = {},
  ): Promise<FileValidationResult> {
    const errors: string[] = [];

    // Get actual file type from magic numbers
    const detectedType = await fileType.fromBuffer(buffer);

    if (!detectedType) {
      errors.push('Unable to determine file type');
      return {
        isValid: false,
        errors,
        metadata: null,
      };
    }

    // Validate MIME type
    if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
      if (!options.allowedMimeTypes.includes(detectedType.mime)) {
        errors.push(
          `Invalid file type. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
        );
      }
    }

    // Validate file extension
    if (options.allowedExtensions && options.allowedExtensions.length > 0) {
      if (!options.allowedExtensions.includes(detectedType.ext)) {
        errors.push(
          `Invalid file extension. Allowed extensions: ${options.allowedExtensions.join(', ')}`,
        );
      }
    }

    // Validate file size
    if (options.maxSize && buffer.length > options.maxSize) {
      errors.push(
        `File size (${buffer.length} bytes) exceeds maximum allowed (${options.maxSize} bytes)`,
      );
    }

    // Generate file hash for integrity checking
    const hash = createHash('sha256').update(buffer).digest('hex');

    return {
      isValid: errors.length === 0,
      errors,
      metadata: {
        mimeType: detectedType.mime,
        extension: detectedType.ext,
        size: buffer.length,
        hash,
      },
    };
  }

  /**
   * Validate image file
   */
  static async validateImage(
    buffer: Buffer,
    options: { maxSize?: number; maxWidth?: number; maxHeight?: number } = {},
  ): Promise<FileValidationResult> {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    const result = await this.validateFileContent(buffer, {
      ...options,
      allowedMimeTypes,
    });

    // Additional image-specific validation using sharp
    try {
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();

      if (options.maxWidth && metadata.width > options.maxWidth) {
        result.errors.push(`Image width exceeds maximum (${options.maxWidth}px)`);
        result.isValid = false;
      }

      if (options.maxHeight && metadata.height > options.maxHeight) {
        result.errors.push(`Image height exceeds maximum (${options.maxHeight}px)`);
        result.isValid = false;
      }
    } catch (error) {
      result.errors.push('Invalid image file');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate document file (PDF, DOC, DOCX)
   */
  static async validateDocument(
    buffer: Buffer,
    options: { maxSize?: number } = {},
  ): Promise<FileValidationResult> {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return this.validateFileContent(buffer, {
      ...options,
      allowedMimeTypes,
    });
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255); // Limit length
  }

  /**
   * Check for executable file extensions
   */
  static isExecutable(filename: string): boolean {
    const executableExtensions = [
      'exe', 'bat', 'cmd', 'sh', 'ps1', 'app', 'deb', 'rpm',
      'dmg', 'pkg', 'run', 'bin', 'msi', 'jar', 'vbs', 'js',
      'scr', 'com', 'pif', 'application', 'gadget', 'msp',
    ];

    const ext = filename.split('.').pop()?.toLowerCase();
    return executableExtensions.includes(ext || '');
  }
}
```

#### Step 2: Update Storage Service

**File:** `services/user-service/src/modules/storage/storage.service.ts`

```typescript
import { FileValidator } from '@jobpilot/security';

async uploadProfilePicture(
  userId: string,
  file: Buffer,
  mimeType: string,
): Promise<string> {
  // Validate file using magic numbers
  const validation = await FileValidator.validateImage(file, {
    maxSize: this.maxFileSize,
    maxWidth: 2000,
    maxHeight: 2000,
  });

  if (!validation.isValid) {
    throw new BadRequestException(validation.errors.join(', '));
  }

  // Use detected MIME type instead of user-provided
  const actualMimeType = validation.metadata.mimeType;

  // Log file hash for audit trail
  this.logger.log(`Uploading profile picture: hash=${validation.metadata.hash}`);

  // ... rest of upload logic
}

async uploadResume(
  userId: string,
  file: Buffer,
  mimeType: string,
  fileName: string,
): Promise<UploadResult> {
  // Sanitize filename
  const sanitizedFilename = FileValidator.sanitizeFilename(fileName);

  // Check for executable files
  if (FileValidator.isExecutable(sanitizedFilename)) {
    throw new BadRequestException('Executable files are not allowed');
  }

  // Validate document
  const validation = await FileValidator.validateDocument(file, {
    maxSize: this.maxFileSize,
  });

  if (!validation.isValid) {
    throw new BadRequestException(validation.errors.join(', '));
  }

  // ... rest of upload logic
}
```

#### Step 3: Add file-type Package

```bash
cd packages/security
npm install file-type --save
```

---

## 5. Implement Automated Security Scanning

### Priority: HIGH
### Effort: MEDIUM
### Risk Mitigation: High

### Implementation Steps

#### Step 1: Add npm audit to CI/CD

**File:** `.github/workflows/security-scan.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  npm-audit:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - auth-service
          - user-service
          - job-service
          - resume-service
          - ai-service
          - auto-apply-service
          - notification-service
          - analytics-service

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./services/${{ matrix.service }}
        run: npm ci

      - name: Run npm audit
        working-directory: ./services/${{ matrix.service }}
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Run npm audit fix
        working-directory: ./services/${{ matrix.service }}
        run: npm audit fix
        if: github.event_name == 'push'

  snyk-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: test
          args: --severity-threshold=high

  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  codeql-analysis:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    steps:
      - uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript, python

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

#### Step 2: Add Dependabot

**File:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    directory: "/services/auth-service"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
      - "security"

  - package-ecosystem: "npm"
    directory: "/services/user-service"
    schedule:
      interval: "weekly"

  - package-ecosystem: "npm"
    directory: "/services/job-service"
    schedule:
      interval: "weekly"

  # Add for all other services...

  # Python dependencies
  - package-ecosystem: "pip"
    directory: "/services/ai-service"
    schedule:
      interval: "weekly"

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

#### Step 3: Add Pre-commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running security checks..."

# Run npm audit
npm audit --audit-level=moderate

# Run ESLint security rules
npm run lint:security

# Check for secrets
npx detect-secrets-launcher scan
```

#### Step 4: Add Security Linting Rules

**File:** `.eslintrc.js`

```javascript
module.exports = {
  extends: [
    // ... existing extends
    'plugin:security/recommended',
  ],
  plugins: [
    // ... existing plugins
    'security',
  ],
  rules: {
    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
  },
};
```

---

## 6. Set Up Azure Key Vault

### Priority: MEDIUM
### Effort: MEDIUM
### Risk Mitigation: High

### Implementation Steps

#### Step 1: Create Azure Key Vault Integration

**File:** `packages/security/src/key-vault.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

@Injectable()
export class KeyVaultService {
  private readonly logger = new Logger(KeyVaultService.name);
  private client: SecretClient;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  private readonly cacheTTL = 300000; // 5 minutes

  constructor() {
    const vaultName = process.env.AZURE_KEYVAULT_NAME;
    if (!vaultName) {
      this.logger.warn('Azure Key Vault not configured');
      return;
    }

    const vaultUrl = `https://${vaultName}.vault.azure.net`;
    const credential = new DefaultAzureCredential();

    this.client = new SecretClient(vaultUrl, credential);
    this.logger.log(`Connected to Azure Key Vault: ${vaultName}`);
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      const secret = await this.client.getSecret(secretName);
      const value = secret.value;

      // Cache the secret
      this.cache.set(secretName, {
        value,
        expiry: Date.now() + this.cacheTTL,
      });

      return value;
    } catch (error) {
      this.logger.error(`Failed to retrieve secret: ${secretName}`, error);

      // Fallback to environment variable
      const envValue = process.env[secretName];
      if (envValue) {
        this.logger.warn(`Using environment variable fallback for: ${secretName}`);
        return envValue;
      }

      throw error;
    }
  }

  async setSecret(secretName: string, value: string): Promise<void> {
    try {
      await this.client.setSecret(secretName, value);
      this.logger.log(`Secret set successfully: ${secretName}`);

      // Clear cache
      this.cache.delete(secretName);
    } catch (error) {
      this.logger.error(`Failed to set secret: ${secretName}`, error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.log('Key Vault cache cleared');
  }
}
```

#### Step 2: Update Configuration Service

**File:** `services/auth-service/src/config/configuration.ts`

```typescript
import { KeyVaultService } from '@jobpilot/security';

const keyVaultService = new KeyVaultService();

export default async () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: await keyVaultService.getSecret('JWT-SECRET'),
    refreshSecret: await keyVaultService.getSecret('JWT-REFRESH-SECRET'),
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'jobpilot-auth-service',
    audience: process.env.JWT_AUDIENCE || 'jobpilot-platform',
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: await keyVaultService.getSecret('DB-USERNAME'),
    password: await keyVaultService.getSecret('DB-PASSWORD'),
    database: process.env.DB_DATABASE || 'auth_service_db',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION, 10) || 900,
    csrfSecret: await keyVaultService.getSecret('CSRF-SECRET'),
    sessionSecret: await keyVaultService.getSecret('SESSION-SECRET'),
  },
});
```

#### Step 3: Install Dependencies

```bash
cd packages/security
npm install @azure/keyvault-secrets @azure/identity --save
```

---

## 7. Add Content Security Verification

### Priority: MEDIUM
### Effort: LOW
### Risk Mitigation: Medium

### Implementation Steps

#### Step 1: Create Content Sanitization Middleware

**File:** `packages/security/src/content-sanitization.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { sanitizeUserInput } from './sanitizer';

@Injectable()
export class ContentSanitizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeUserInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
```

#### Step 2: Apply Middleware

**File:** `services/auth-service/src/app.module.ts`

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ContentSanitizationMiddleware } from '@jobpilot/security';

@Module({
  // ... module configuration
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContentSanitizationMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
```

---

## Testing Security Fixes

### Security Test Suite

Create comprehensive security tests:

**File:** `services/auth-service/src/security/security.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { AuthService } from '../modules/auth/auth.service';
import { CsrfGuard, CsrfService } from '@jobpilot/security';

describe('Security Tests', () => {
  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token', async () => {
      // Test implementation
    });

    it('should accept requests with valid CSRF token', async () => {
      // Test implementation
    });

    it('should use constant-time comparison', async () => {
      // Test implementation
    });
  });

  describe('SQL Injection Protection', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      // Test that input is properly escaped
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize XSS attempts', async () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      // Test that script tags are removed
    });
  });

  describe('File Upload Security', () => {
    it('should reject executable files', async () => {
      // Test implementation
    });

    it('should validate file magic numbers', async () => {
      // Test implementation
    });
  });
});
```

---

## Deployment Checklist

Before deploying to production:

- [ ] CSRF protection enabled globally
- [ ] Helmet added to all services
- [ ] Database SSL/TLS configured
- [ ] File upload validation enhanced
- [ ] Security scanning automated
- [ ] Azure Key Vault configured
- [ ] Content sanitization enabled
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Logging and monitoring configured
- [ ] Security tests passing
- [ ] Penetration testing completed
- [ ] Security documentation updated

---

## Monitoring and Maintenance

### Security Monitoring

1. Set up Azure Security Center alerts
2. Configure log aggregation
3. Create security dashboard
4. Set up incident response procedures

### Regular Maintenance

1. Weekly: Review security alerts
2. Monthly: Update dependencies
3. Quarterly: Security audit
4. Annually: Penetration testing

---

**Document Version:** 1.0
**Last Updated:** December 8, 2025
**Next Review:** March 8, 2026
