# ApplyforUs API Documentation Updates

Version 1.0 | Last Updated: December 2025

## Overview

This document outlines all API documentation changes required for the ApplyforUs rebrand. **Important:** No API contracts, endpoints, or response formats have changed. Only documentation and metadata updates are required.

## Table of Contents

1. [Base URL Updates](#base-url-updates)
2. [API Documentation Headers](#api-documentation-headers)
3. [Swagger/OpenAPI Updates](#swaggeropenapi-updates)
4. [Response Headers](#response-headers)
5. [Error Messages](#error-messages)
6. [Postman Collection](#postman-collection)
7. [SDK Updates](#sdk-updates)
8. [Deprecation Notices](#deprecation-notices)

---

## Base URL Updates

### Current URLs (No Changes)

All API base URLs remain unchanged:

```
Development:  https://api-dev.applyforus.com
Staging:      https://api-staging.applyforus.com
Production:   https://api.applyforus.com
```

**Note:** If migrating from jobpilot.com domain to applyforus.com:

### Migration Path

1. **Maintain old URLs** (jobpilot.com) for 6 months minimum
2. **Add redirects** from old to new URLs
3. **Update documentation** to reference new URLs
4. **Deprecation notice** on old domain

### Redirect Configuration (nginx)

```nginx
# Redirect old API domain to new domain
server {
    listen 443 ssl;
    server_name api.jobpilot.com;

    ssl_certificate /etc/ssl/certs/jobpilot.crt;
    ssl_certificate_key /etc/ssl/private/jobpilot.key;

    location / {
        return 301 https://api.applyforus.com$request_uri;
    }
}
```

---

## API Documentation Headers

### Updated Metadata

All API services should return updated headers:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-API-Name: ApplyforUs API
X-API-Version: 1.0.0
X-Powered-By: ApplyforUs Platform
X-Brand: ApplyforUs
```

### Implementation (NestJS)

```typescript
// src/common/middleware/branding.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BrandingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-API-Name', 'ApplyforUs API');
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Powered-By', 'ApplyforUs Platform');
    res.setHeader('X-Brand', 'ApplyforUs');
    next();
  }
}
```

---

## Swagger/OpenAPI Updates

### Document Configuration

Update Swagger configuration in all microservices:

#### Auth Service

```typescript
// services/auth-service/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('ApplyforUs Authentication API')
  .setDescription('Authentication and authorization service for ApplyforUs platform')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com/support',
    'api-support@applyforus.com'
  )
  .setLicense('Proprietary', 'https://applyforus.com/terms')
  .addBearerAuth()
  .addTag('Authentication', 'User authentication endpoints')
  .addTag('Authorization', 'User authorization endpoints')
  .addTag('OAuth', 'OAuth2 integration endpoints')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document, {
  customSiteTitle: 'ApplyforUs Auth API',
  customfavIcon: 'https://applyforus.com/favicon.ico',
  customCss: `
    .swagger-ui .topbar { background-color: #3B82F6; }
    .swagger-ui .topbar-wrapper img { content: url('https://applyforus.com/logo-white.svg'); }
  `,
});
```

#### User Service

```typescript
// services/user-service/src/main.ts
const config = new DocumentBuilder()
  .setTitle('ApplyforUs User API')
  .setDescription('User management and profile service for ApplyforUs platform')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com/support',
    'api-support@applyforus.com'
  )
  .addBearerAuth()
  .addTag('Users', 'User management endpoints')
  .addTag('Profiles', 'User profile endpoints')
  .build();
```

#### Resume Service

```typescript
// services/resume-service/src/main.ts
const config = new DocumentBuilder()
  .setTitle('ApplyforUs Resume API')
  .setDescription('Resume management and AI parsing service for ApplyforUs platform')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com/support',
    'api-support@applyforus.com'
  )
  .addBearerAuth()
  .addTag('Resumes', 'Resume CRUD operations')
  .addTag('Parsing', 'AI resume parsing endpoints')
  .addTag('Templates', 'Resume template endpoints')
  .build();
```

#### Job Service

```typescript
// services/job-service/src/main.ts
const config = new DocumentBuilder()
  .setTitle('ApplyforUs Job API')
  .setDescription('Job listings and matching service for ApplyforUs platform')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com/support',
    'api-support@applyforus.com'
  )
  .addBearerAuth()
  .addTag('Jobs', 'Job listing endpoints')
  .addTag('Search', 'Job search and filtering')
  .addTag('Matching', 'AI job matching endpoints')
  .build();
```

#### Auto-Apply Service

```typescript
// services/auto-apply-service/src/main.ts
const config = new DocumentBuilder()
  .setTitle('ApplyforUs Auto-Apply API')
  .setDescription('Automated job application service for ApplyforUs platform')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com/support',
    'api-support@applyforus.com'
  )
  .addBearerAuth()
  .addTag('Applications', 'Job application endpoints')
  .addTag('Automation', 'Automation configuration')
  .addTag('Tracking', 'Application tracking')
  .build();
```

#### Analytics Service

```typescript
// services/analytics-service/src/main.ts
const config = new DocumentBuilder()
  .setTitle('ApplyforUs Analytics API')
  .setDescription('Analytics and reporting service for ApplyforUs platform')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com/support',
    'api-support@applyforus.com'
  )
  .addBearerAuth()
  .addTag('Analytics', 'Analytics endpoints')
  .addTag('Reports', 'Report generation')
  .addTag('Metrics', 'Platform metrics')
  .build();
```

#### Notification Service

```typescript
// services/notification-service/src/main.ts
const config = new DocumentBuilder()
  .setTitle('ApplyforUs Notification API')
  .setDescription('Email and push notification service for ApplyforUs platform')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com/support',
    'api-support@applyforus.com'
  )
  .addBearerAuth()
  .addTag('Notifications', 'Notification endpoints')
  .addTag('Email', 'Email notification endpoints')
  .addTag('Push', 'Push notification endpoints')
  .build();
```

#### AI Service

```python
# services/ai-service/src/main.py
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="ApplyforUs AI API",
    description="AI and machine learning service for ApplyforUs platform",
    version="1.0.0",
    contact={
        "name": "ApplyforUs Support",
        "url": "https://applyforus.com/support",
        "email": "api-support@applyforus.com",
    },
    license_info={
        "name": "Proprietary",
        "url": "https://applyforus.com/terms",
    },
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="ApplyforUs AI API",
        version="1.0.0",
        description="AI and machine learning service for ApplyforUs platform",
        routes=app.routes,
    )

    openapi_schema["info"]["x-logo"] = {
        "url": "https://applyforus.com/logo.svg"
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

---

## Response Headers

### Standard Response Headers

All API responses should include:

```typescript
// Example response headers
{
  'Content-Type': 'application/json',
  'X-API-Name': 'ApplyforUs API',
  'X-API-Version': '1.0.0',
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': '1640000000',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}
```

---

## Error Messages

### Updated Error Response Format

Error responses should include updated branding:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-12-08T12:00:00.000Z",
  "path": "/api/resumes",
  "service": "ApplyforUs Resume Service",
  "support": "https://applyforus.com/support",
  "documentation": "https://api.applyforus.com/docs"
}
```

### Implementation

```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      service: 'ApplyforUs Platform',
      support: 'https://applyforus.com/support',
      documentation: 'https://api.applyforus.com/docs',
      ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
    };

    response.status(status).json(errorResponse);
  }
}
```

---

## Postman Collection

### Updated Collection

**File:** `docs/api/ApplyforUs-API.postman_collection.json`

Key updates:

```json
{
  "info": {
    "name": "ApplyforUs API",
    "description": "Complete API collection for ApplyforUs platform",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "_postman_id": "unique-id-here"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://api.applyforus.com",
      "type": "string"
    },
    {
      "key": "api_version",
      "value": "v1",
      "type": "string"
    },
    {
      "key": "brand_name",
      "value": "ApplyforUs",
      "type": "string"
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  }
}
```

### Environment Variables

**Development Environment:**
```json
{
  "name": "ApplyforUs Development",
  "values": [
    { "key": "base_url", "value": "https://api-dev.applyforus.com", "enabled": true },
    { "key": "auth_url", "value": "https://auth-dev.applyforus.com", "enabled": true }
  ]
}
```

**Staging Environment:**
```json
{
  "name": "ApplyforUs Staging",
  "values": [
    { "key": "base_url", "value": "https://api-staging.applyforus.com", "enabled": true },
    { "key": "auth_url", "value": "https://auth-staging.applyforus.com", "enabled": true }
  ]
}
```

**Production Environment:**
```json
{
  "name": "ApplyforUs Production",
  "values": [
    { "key": "base_url", "value": "https://api.applyforus.com", "enabled": true },
    { "key": "auth_url", "value": "https://auth.applyforus.com", "enabled": true }
  ]
}
```

---

## SDK Updates

### JavaScript/TypeScript SDK

**Package name update:**

```json
{
  "name": "@applyforus/api-client",
  "version": "1.0.0",
  "description": "Official JavaScript/TypeScript SDK for ApplyforUs API",
  "repository": "https://github.com/applyforus/api-client-js"
}
```

**Client initialization:**

```typescript
import { ApplyforUsClient } from '@applyforus/api-client';

const client = new ApplyforUsClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.applyforus.com',
  version: 'v1',
});

// Usage remains the same
const resumes = await client.resumes.list();
```

### Python SDK

**Package name update:**

```python
# setup.py
setup(
    name='applyforus-api',
    version='1.0.0',
    description='Official Python SDK for ApplyforUs API',
    url='https://github.com/applyforus/api-client-python',
)
```

**Client initialization:**

```python
from applyforus import ApplyforUsClient

client = ApplyforUsClient(
    api_key='your-api-key',
    base_url='https://api.applyforus.com',
    version='v1'
)

# Usage remains the same
resumes = client.resumes.list()
```

---

## Deprecation Notices

### Old Domain Deprecation (if applicable)

If migrating from jobpilot.com to applyforus.com:

**Add deprecation headers:**

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Wed, 11 Jun 2026 23:59:59 GMT
Link: <https://api.applyforus.com/docs/migration>; rel="deprecation"
Warning: 299 - "This API endpoint is deprecated. Please migrate to api.applyforus.com"
```

**Implementation:**

```typescript
@Injectable()
export class DeprecationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.hostname === 'api.jobpilot.com') {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', 'Wed, 11 Jun 2026 23:59:59 GMT');
      res.setHeader('Link', '<https://api.applyforus.com/docs/migration>; rel="deprecation"');
      res.setHeader('Warning', '299 - "This API endpoint is deprecated. Please migrate to api.applyforus.com"');
    }
    next();
  }
}
```

### Migration Guide

**Endpoint:** `https://api.applyforus.com/docs/migration`

Content should include:
- Timeline for deprecation
- Steps to migrate
- Breaking changes (none for rebrand)
- Support contact information

---

## Documentation Pages

### API Reference Homepage

**URL:** `https://api.applyforus.com/docs`

**Updated content:**

```markdown
# ApplyforUs API Documentation

Welcome to the ApplyforUs API documentation. Our API enables you to integrate job application automation into your applications.

## Base URL

```
https://api.applyforus.com/v1
```

## Authentication

All API requests require authentication using Bearer tokens.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.applyforus.com/v1/resumes
```

## Support

- **Documentation:** https://api.applyforus.com/docs
- **Support Email:** api-support@applyforus.com
- **Status Page:** https://status.applyforus.com
- **Community:** https://community.applyforus.com
```

### Getting Started Guide

**URL:** `https://api.applyforus.com/docs/getting-started`

Update all references from JobPilot to ApplyforUs:

```markdown
# Getting Started with ApplyforUs API

This guide will help you get started with the ApplyforUs API.

## 1. Create an Account

Sign up at [https://applyforus.com/signup](https://applyforus.com/signup)

## 2. Generate API Key

Navigate to Settings > API Keys and generate a new key.

## 3. Make Your First Request

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.applyforus.com/v1/me
```
```

---

## Health Check Updates

### Health Check Response

```json
{
  "status": "healthy",
  "service": "ApplyforUs Auth Service",
  "version": "1.0.0",
  "timestamp": "2025-12-08T12:00:00.000Z",
  "uptime": 86400,
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "queue": "healthy"
  }
}
```

### Implementation

```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'healthy',
    service: 'ApplyforUs Auth Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: await this.checkDependencies(),
  };
}
```

---

## API Documentation Checklist

### Pre-Deployment

- [ ] Update all Swagger configurations
- [ ] Update API response headers
- [ ] Update error message branding
- [ ] Update health check responses
- [ ] Create new Postman collection
- [ ] Update SDK package names
- [ ] Add deprecation notices (if applicable)
- [ ] Update documentation homepage
- [ ] Update getting started guide
- [ ] Update all code examples

### Post-Deployment

- [ ] Verify Swagger UI displays correctly
- [ ] Test all documentation links
- [ ] Verify Postman collection works
- [ ] Update SDK repositories
- [ ] Publish updated SDKs to package registries
- [ ] Send migration notice to API consumers
- [ ] Monitor for issues

---

## Communication Plan

### API Consumers Notification

**Email Template:**

```
Subject: ApplyforUs API - Brand Update

Dear ApplyforUs API Consumer,

We're excited to announce that JobPilot is now ApplyforUs!

WHAT'S CHANGING:
- Brand name: JobPilot → ApplyforUs
- Documentation URLs updated
- API response headers updated
- Swagger UI updated

WHAT'S NOT CHANGING:
- ✓ No changes to API endpoints
- ✓ No changes to request/response formats
- ✓ No changes to authentication
- ✓ No action required from you

DOCUMENTATION:
Updated documentation is available at:
https://api.applyforus.com/docs

SUPPORT:
If you have questions, contact us at:
api-support@applyforus.com

Thank you for using ApplyforUs!

The ApplyforUs Team
```

---

## Version Control

**Document Version:** 1.0
**Last Updated:** December 2025
**Next Review:** June 2026

**Contact:**
- **Email:** api-support@applyforus.com
- **Slack:** #api-team
- **Documentation:** https://api.applyforus.com/docs
