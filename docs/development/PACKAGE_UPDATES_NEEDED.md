# Package Updates Needed for Security Implementation

This document lists all package installations needed to complete the security implementation.

## Quick Install All

```bash
# Run from project root
cd services/auth-service && npm install helmet@^7.1.0 @types/helmet@^4.0.0 && \
cd ../resume-service && npm install @nestjs/throttler@^5.1.1 helmet@^7.1.0 compression@^1.7.4 @types/helmet@^4.0.0 @types/compression@^1.7.5 && \
cd ../user-service && npm install @nestjs/throttler@^5.1.1 && \
cd ../../packages/security && npm install @nestjs/common@^10.3.0 helmet@^7.1.0 @types/helmet@^4.0.0
```

## Individual Service Updates

### 1. Auth Service
Already has @nestjs/throttler. Need to add:

```bash
cd services/auth-service
npm install helmet@^7.1.0 @types/helmet@^4.0.0
```

**package.json additions:**
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

### 2. Resume Service
Need to add:

```bash
cd services/resume-service
npm install @nestjs/throttler@^5.1.1 helmet@^7.1.0 compression@^1.7.4
npm install -D @types/helmet@^4.0.0 @types/compression@^1.7.5
```

**package.json additions:**
```json
{
  "dependencies": {
    "@nestjs/throttler": "^5.1.1",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "@types/helmet": "^4.0.0",
    "@types/compression": "^1.7.5"
  }
}
```

### 3. User Service
Need to add:

```bash
cd services/user-service
npm install @nestjs/throttler@^5.1.1
```

**package.json additions:**
```json
{
  "dependencies": {
    "@nestjs/throttler": "^5.1.1"
  }
}
```

Already has helmet and compression.

### 4. Job Service
✅ Already has all required packages (helmet, compression)

### 5. Notification Service
Check if needs rate limiting:

```bash
cd services/notification-service
npm install @nestjs/throttler@^5.1.1  # If not already installed
```

### 6. Auto-Apply Service
Check if needs rate limiting:

```bash
cd services/auto-apply-service
npm install @nestjs/throttler@^5.1.1  # If not already installed
```

### 7. Analytics Service
Check if needs rate limiting:

```bash
cd services/analytics-service
npm install @nestjs/throttler@^5.1.1  # If not already installed
```

### 8. Security Package
Need to add NestJS dependencies:

```bash
cd packages/security
npm install @nestjs/common@^10.3.0 helmet@^7.1.0
npm install -D @types/helmet@^4.0.0
```

**package.json additions:**
```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "@types/helmet": "^4.0.0"
  }
}
```

### 9. AI Service (Python)
✅ No additional packages needed - uses FastAPI middleware

## Verification Commands

After installation, verify packages:

```bash
# Check auth-service
cd services/auth-service
npm list helmet @nestjs/throttler

# Check resume-service
cd services/resume-service
npm list helmet compression @nestjs/throttler

# Check user-service
cd services/user-service
npm list helmet compression @nestjs/throttler

# Check security package
cd packages/security
npm list helmet @nestjs/common
```

## Expected Output

Each service should show:
```
├── helmet@7.1.0
├── @nestjs/throttler@5.1.1
└── compression@1.7.4 (where applicable)
```

## Build and Test

After installing packages:

```bash
# Build all services
npm run build  # or nx build

# Run tests
npm test

# Start services
npm run start:dev
```

## Common Issues

### Issue: Peer Dependency Warnings

If you see peer dependency warnings, it's usually safe to ignore them if the major versions match. Example:

```
npm WARN @nestjs/throttler@5.1.1 requires a peer of @nestjs/common@^9.0.0 || ^10.0.0
```

Solution: This is fine as long as you have @nestjs/common@^10.x.x

### Issue: Type Conflicts

If you get TypeScript errors after installing:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build Failures

If builds fail after adding packages:

1. Check TypeScript version compatibility
2. Clear build cache: `rm -rf dist`
3. Rebuild: `npm run build`

## Workspace Dependencies

If using npm workspaces or lerna/nx:

```bash
# Install from root
npm install --workspace=services/auth-service helmet@^7.1.0
npm install --workspace=services/resume-service @nestjs/throttler@^5.1.1 helmet@^7.1.0 compression@^1.7.4
# etc.
```

## Docker Considerations

If using Docker, packages will be installed during build. Update Dockerfile if needed:

```dockerfile
# Already handled by COPY package*.json and npm install
# No changes needed
```

## CI/CD Pipeline

Ensure your CI/CD pipeline runs `npm install` before building:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci  # or npm install

- name: Build
  run: npm run build

- name: Test
  run: npm test
```

## Summary

**Total packages to install:**
- Auth Service: 2 packages (helmet + types)
- Resume Service: 5 packages (throttler, helmet, compression + types)
- User Service: 1 package (throttler)
- Security Package: 3 packages (nestjs/common, helmet + types)

**Estimated install time:** 2-3 minutes
**Estimated total size:** ~50MB

---

Last Updated: December 6, 2025
