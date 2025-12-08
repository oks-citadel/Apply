# Configuration File Updates for ApplyforUs Rebranding

This document details all configuration file updates required for the rebranding from JobPilot to ApplyforUs.

---

## 1. Environment Files

### 1.1 Root Environment File

#### File: `.env.example`
**Updates:**
```bash
# OLD
APP_NAME=JobPilot
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobpilot
REDIS_URL=redis://localhost:6379

# NEW
APP_NAME=ApplyforUs
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applyforus
REDIS_URL=redis://localhost:6379
```

---

### 1.2 Service Environment Files

Update all service .env.example files:
- `services/auth-service/.env.example`
- `services/user-service/.env.example`
- `services/job-service/.env.example`
- `services/resume-service/.env.example`
- `services/auto-apply-service/.env.example`
- `services/analytics-service/.env.example`
- `services/notification-service/.env.example`
- `services/orchestrator-service/.env.example`
- `services/ai-service/.env.example`

**Pattern:**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applyforus
POSTGRES_DB=applyforus

# Service Name
SERVICE_NAME=applyforus-auth-service

# URLs
API_URL=https://api.applyforus.com
WEB_URL=https://applyforus.com
```

---

### 1.3 Application Environment Files

#### apps/web/.env.local
```bash
NEXT_PUBLIC_APP_NAME=ApplyforUs
NEXT_PUBLIC_API_URL=https://api.applyforus.com
NEXT_PUBLIC_WEB_URL=https://applyforus.com
```

#### apps/admin/.env.example
```bash
NEXT_PUBLIC_APP_NAME=ApplyforUs Admin
NEXT_PUBLIC_API_URL=https://api.applyforus.com
```

#### apps/mobile/.env.example
```bash
APP_NAME=ApplyforUs
API_URL=https://api.applyforus.com
```

---

## 2. TypeScript Configuration

### 2.1 Root TypeScript Config

#### File: `tsconfig.base.json`
**Updates:**
```json
{
  "compilerOptions": {
    "paths": {
      "@applyforus/*": ["packages/*/src"],
      "@applyforus/telemetry": ["packages/telemetry/src"],
      "@applyforus/logging": ["packages/logging/src"],
      "@applyforus/security": ["packages/security/src"]
    }
  }
}
```

---

### 2.2 Service TypeScript Configs

Update all service `tsconfig.json` files if they reference `@jobpilot/*`:
- `services/auth-service/tsconfig.json`
- `services/user-service/tsconfig.json`
- etc.

---

## 3. Next.js Configuration

### 3.1 Web Application

#### File: `apps/web/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Update any hardcoded references
  env: {
    APP_NAME: 'ApplyforUs',
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.applyforus.com',
  },
  // Update image domains if needed
  images: {
    domains: ['applyforus.com', 'cdn.applyforus.com'],
  },
}

module.exports = nextConfig
```

---

### 3.2 Admin Application

#### File: `apps/admin/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_NAME: 'ApplyforUs Admin',
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.applyforus.com',
  },
}

module.exports = nextConfig
```

---

## 4. Tailwind Configuration

### 4.1 Web Application

#### File: `apps/web/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Update brand colors if needed
      colors: {
        'applyforus-primary': '#...',
        'applyforus-secondary': '#...',
      },
    },
  },
  plugins: [],
}
export default config
```

---

### 4.2 Admin Application

#### File: `apps/admin/tailwind.config.js`
(Similar updates for brand colors and references)

---

### 4.3 Extension

#### File: `apps/extension/tailwind.config.js`
(Similar updates)

---

## 5. Webpack/Vite Configuration

### Extension Vite Config

#### File: `apps/extension/vite.config.ts`
```typescript
export default defineConfig({
  define: {
    'process.env.APP_NAME': JSON.stringify('ApplyforUs'),
  },
})
```

---

## 6. Babel Configuration

### Mobile App Babel Config

#### File: `apps/mobile/babel.config.js`
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // No brand-specific changes typically needed
  ],
}
```

---

## 7. ESLint Configuration

### Root ESLint Config

#### File: `.eslintrc.json`
```json
{
  "extends": ["next", "prettier"],
  "rules": {
    // No brand-specific rules typically
  }
}
```

---

## 8. Prettier Configuration

#### File: `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100
}
```

---

## 9. Jest Configuration

### Web Application

#### File: `apps/web/jest.config.js`
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@applyforus/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  testEnvironment: 'jest-environment-jsdom',
  displayName: 'ApplyforUs Web',
}

module.exports = createJestConfig(customJestConfig)
```

---

## 10. Vitest Configuration

#### File: `apps/web/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
})
```

---

## 11. Playwright Configuration

#### File: `apps/web/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  projects: [
    {
      name: 'ApplyforUs Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

---

## 12. NestJS Configuration Files

### All Services

Update `src/main.ts` in each service:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('ApplyforUs Auth Service API')
    .setDescription('Authentication and authorization service for ApplyforUs platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(4001)
  console.log('ApplyforUs Auth Service is running on port 4001')
}
```

---

## 13. Python Configuration

### AI Service

#### File: `services/ai-service/src/main.py`
```python
from fastapi import FastAPI

app = FastAPI(
    title="ApplyforUs AI Service",
    description="AI/ML operations service for ApplyforUs platform",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"service": "ApplyforUs AI Service", "status": "healthy"}
```

---

## 14. Monitoring Configuration

### Prometheus

#### File: `infrastructure/monitoring/prometheus/prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'applyforus-prod'
    environment: 'production'

scrape_configs:
  - job_name: 'applyforus-services'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - applyforus
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace]
        action: keep
        regex: applyforus
```

---

### Grafana

#### File: `infrastructure/monitoring/grafana/provisioning/dashboards/dashboard-provider.yml`
```yaml
apiVersion: 1

providers:
  - name: 'ApplyforUs Dashboards'
    orgId: 1
    folder: 'ApplyforUs'
    type: file
    options:
      path: /etc/grafana/dashboards
```

---

## 15. Terraform Configuration

### Variables

#### File: `infrastructure/terraform/variables.tf`
```hcl
variable "project_name" {
  description = "Project name"
  type        = string
  default     = "applyforus"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "applyforus-${var.environment}-rg"
}
```

---

### Main Configuration

#### File: `infrastructure/terraform/main.tf`
```hcl
resource "azurerm_resource_group" "main" {
  name     = "applyforus-${var.environment}-rg"
  location = var.location

  tags = {
    Project     = "ApplyforUs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = "applyforus-${var.environment}-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "applyforus-${var.environment}"

  tags = {
    Project     = "ApplyforUs"
    Environment = var.environment
  }
}
```

---

## 16. GitHub Actions Workflows

### CI Workflow

#### File: `.github/workflows/ci.yml`
```yaml
name: ApplyforUs CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  REGISTRY: applyforusacr.azurecr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test ApplyforUs Services
    runs-on: ubuntu-latest
    # ...
```

---

### Deploy Workflow

#### File: `.github/workflows/deploy.yml`
```yaml
name: Deploy ApplyforUs

on:
  push:
    branches: [ main ]

env:
  ACR_NAME: applyforusacr
  AKS_CLUSTER: applyforus-prod-aks
  NAMESPACE: applyforus

jobs:
  deploy:
    # ...
```

---

## 17. Azure Pipelines

### Main Pipeline

#### File: `azure-pipelines.yml`
```yaml
name: ApplyforUs CI/CD Pipeline

trigger:
  branches:
    include:
      - main
      - develop

variables:
  - name: projectName
    value: 'applyforus'
  - name: acrName
    value: 'applyforusacr'
  - name: aksCluster
    value: 'applyforus-prod-aks'
```

---

## 18. Makefile

#### File: `Makefile`
```makefile
.PHONY: help

APP_NAME = applyforus
ENV ?= dev

help:
	@echo "ApplyforUs Platform - Make Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build all services"
	@echo "  make test         - Run tests"
	@echo "  make deploy-dev   - Deploy to dev environment"

install:
	@echo "Installing dependencies for ApplyforUs..."
	pnpm install

dev:
	@echo "Starting ApplyforUs development servers..."
	pnpm dev

build:
	@echo "Building ApplyforUs platform..."
	pnpm build

test:
	@echo "Running ApplyforUs tests..."
	pnpm test

deploy-dev:
	@echo "Deploying ApplyforUs to dev environment..."
	kubectl apply -f infrastructure/kubernetes/ -n applyforus
```

---

## 19. Git Configuration

### .gitattributes
(No brand-specific changes needed)

### .gitignore
(No brand-specific changes needed, but review for any hardcoded paths)

---

## 20. Editor Configuration

### VS Code Settings

#### File: `.vscode/settings.json`
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 21. API Documentation

### Swagger/OpenAPI Configuration

Update in all service `main.ts` files:

```typescript
const config = new DocumentBuilder()
  .setTitle('ApplyforUs API')
  .setDescription('ApplyforUs Platform API Documentation')
  .setVersion('1.0')
  .setContact(
    'ApplyforUs Support',
    'https://applyforus.com',
    'support@applyforus.com'
  )
  .setLicense('Proprietary', 'https://applyforus.com/license')
  .addServer('https://api.applyforus.com', 'Production')
  .addServer('https://api.staging.applyforus.com', 'Staging')
  .addServer('http://localhost:4001', 'Local Development')
  .addBearerAuth()
  .build()
```

---

## 22. Database Migration Configuration

### TypeORM Data Source

#### File: `services/*/src/config/data-source.ts`
```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'applyforus',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
})
```

---

## 23. Update Checklist

- [ ] Update all .env.example files
- [ ] Update all .env files (local copies)
- [ ] Update tsconfig.base.json
- [ ] Update all service tsconfig.json files
- [ ] Update Next.js configs
- [ ] Update Tailwind configs
- [ ] Update Jest configs
- [ ] Update all NestJS main.ts files
- [ ] Update Python AI service config
- [ ] Update Prometheus config
- [ ] Update Grafana config
- [ ] Update Terraform configs
- [ ] Update GitHub Actions workflows
- [ ] Update Azure Pipelines
- [ ] Update Makefile
- [ ] Update Swagger configurations
- [ ] Update database configurations
- [ ] Test all builds
- [ ] Test all services start
- [ ] Verify configuration loading

---

## 24. Verification

```bash
# Check environment variables are loaded
pnpm --filter @applyforus/web dev
# Should see: Starting ApplyforUs Web...

# Check database connection
psql postgresql://postgres:postgres@localhost:5432/applyforus
# Should connect to applyforus database

# Check TypeScript paths resolve
pnpm type-check
# Should find @applyforus/* imports

# Check Next.js build
cd apps/web && pnpm build
# Should build without errors
```

---

**Generated:** 2025-12-08
**Status:** Ready for execution
**Priority:** HIGH - Must be done in coordination with package updates
