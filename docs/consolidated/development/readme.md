# Development Guide - JobPilot AI Platform

Comprehensive guide for developers working on the JobPilot AI Platform.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Database Development](#database-development)
8. [API Development](#api-development)
9. [Common Tasks](#common-tasks)

## Development Setup

### Prerequisites

Ensure you have completed the [Getting Started Guide](../getting-started.md) before proceeding.

### IDE Setup

#### VS Code (Recommended)

**Required Extensions**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "ms-playwright.playwright"
  ]
}
```

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  }
}
```

**Debugging Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Auth Service",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "auth-service", "start:debug"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Web App",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/web"
    }
  ]
}
```

### Development Tools

**Postman/Insomnia Collection**:
Import API collection from `docs/postman/JobPilot-API.postman_collection.json`

**Database Client**:
- pgAdmin 4 or DBeaver for PostgreSQL
- Redis Insight for Redis

**Git Hooks**:
```bash
# Install Husky for git hooks
pnpm install

# Husky hooks automatically:
# - Run linting on pre-commit
# - Run tests on pre-push
# - Validate commit messages
```

## Project Structure

```
Job-Apply-Platform/
├── apps/                      # Frontend applications
│   ├── web/                   # Next.js web app
│   │   ├── src/
│   │   │   ├── app/          # App router pages
│   │   │   ├── components/   # React components
│   │   │   ├── lib/          # Utilities
│   │   │   └── styles/       # Global styles
│   │   ├── public/           # Static assets
│   │   └── package.json
│   ├── mobile/               # React Native app
│   └── extension/            # Chrome extension
│
├── services/                 # Backend microservices
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules
│   │   │   ├── common/       # Shared code
│   │   │   ├── config/       # Configuration
│   │   │   └── main.ts       # Entry point
│   │   ├── test/             # Tests
│   │   └── package.json
│   └── [other-services]/
│
├── packages/                 # Shared libraries
│   ├── ui/                   # UI components
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilities
│   ├── config/               # Shared configs
│   ├── logging/              # Logging package
│   ├── security/             # Security utils
│   └── telemetry/            # Observability
│
├── infrastructure/           # IaC and configs
│   ├── terraform/
│   ├── kubernetes/
│   └── docker/
│
├── docs/                     # Documentation
├── e2e/                      # E2E tests
└── scripts/                  # Utility scripts
```

## Development Workflow

### 1. Create a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/user-profile-improvements

# 2. Make changes to code
# Edit files...

# 3. Run development server
pnpm dev

# 4. Test your changes
pnpm test

# 5. Lint and format
pnpm lint
pnpm format

# 6. Commit with conventional commits
git add .
git commit -m "feat(user): add profile picture upload"

# 7. Push and create PR
git push origin feature/user-profile-improvements
```

### 2. Working with Workspaces

```bash
# Install dependencies for specific workspace
pnpm --filter web install

# Run scripts in specific workspace
pnpm --filter auth-service dev
pnpm --filter user-service test
pnpm --filter ui build

# Add dependency to workspace
pnpm --filter auth-service add express
pnpm --filter web add -D @types/node

# Run command in all workspaces
pnpm -r build
pnpm -r test
```

### 3. Database Workflow

```bash
# Create new migration
pnpm --filter auth-service migration:create AddMFATable

# Generate migration from entity changes
pnpm --filter auth-service migration:generate UpdateUserTable

# Run migrations
pnpm db:migrate

# Rollback migration
pnpm --filter auth-service migration:revert

# Seed database
pnpm db:seed
```

## Code Standards

### TypeScript Guidelines

**Type Safety**:
```typescript
// Good: Use specific types
interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

// Bad: Use any
const user: any = {};

// Good: Use generics
function getData<T>(id: string): Promise<T> {
  // ...
}

// Good: Use type guards
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'email' in value;
}
```

**Naming Conventions**:
```typescript
// Files
user-profile.component.tsx     // Components
user.service.ts               // Services
auth.utils.ts                 // Utilities
user.types.ts                 // Types

// Variables and functions
const userName = 'John';      // camelCase
function calculateTotal() {}  // camelCase

// Constants
const MAX_RETRIES = 3;        // UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Classes and interfaces
class UserService {}          // PascalCase
interface UserProfile {}      // PascalCase
type UserId = string;         // PascalCase

// Enums
enum UserRole {               // PascalCase
  USER = 'USER',
  ADMIN = 'ADMIN',
}
```

### React/Next.js Guidelines

**Component Structure**:
```typescript
'use client';

import { FC } from 'react';
import { Button } from '@/components/ui/button';

interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

export const UserProfile: FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // Hooks at the top
  const [loading, setLoading] = useState(false);
  const user = useUser(userId);

  // Event handlers
  const handleUpdate = async () => {
    // ...
  };

  // Early returns
  if (!user) return <Skeleton />;

  // Main render
  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <Button onClick={handleUpdate}>Update</Button>
    </div>
  );
};
```

**Hooks Best Practices**:
```typescript
// Custom hooks
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
};

// Use memo for expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Use callback for function references
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### Backend/NestJS Guidelines

**Controller Structure**:
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserDto })
  async getUser(@Param('id') id: string): Promise<UserDto> {
    return this.userService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.userService.create(createUserDto);
  }
}
```

**Service Structure**:
```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {}

  async findById(id: string): Promise<User> {
    // Check cache first
    const cached = await this.cacheService.get(`user:${id}`);
    if (cached) return cached;

    // Fetch from database
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Cache result
    await this.cacheService.set(`user:${id}`, user, 3600);

    return user;
  }
}
```

**Error Handling**:
```typescript
// Use custom exceptions
export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}

// Use exception filters
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      success: false,
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Testing

### Unit Tests

**Test Structure**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John' };

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      const userId = 'non-existent';

      // Act & Assert
      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
```

**Running Tests**:
```bash
# Run all tests
pnpm test

# Run tests for specific workspace
pnpm --filter auth-service test

# Run tests in watch mode
pnpm --filter auth-service test:watch

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm --filter auth-service test src/modules/auth/auth.service.spec.ts
```

### Integration Tests

```typescript
describe('AuthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('token');
      });
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Profile', () => {
  test('should update user profile', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to profile
    await page.goto('/profile');

    // Update name
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.click('button:has-text("Save")');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

## Debugging

### Backend Debugging

**VS Code Debug Configuration**:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Auth Service",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["--filter", "auth-service", "start:debug"],
  "port": 9229,
  "skipFiles": ["<node_internals>/**"],
  "console": "integratedTerminal"
}
```

**Chrome DevTools**:
```bash
# Start service in debug mode
pnpm --filter auth-service start:debug

# Open chrome://inspect in Chrome
# Click "inspect" on the Node process
```

### Frontend Debugging

**React DevTools**:
Install React DevTools browser extension

**Next.js Debugging**:
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Next.js",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/apps/web",
  "sourceMapPathOverrides": {
    "webpack://_N_E/*": "${webRoot}/*"
  }
}
```

### Database Debugging

```bash
# Enable query logging
LOG_LEVEL=debug

# View queries in real-time
docker-compose logs -f postgres

# Connect to database
docker exec -it jobpilot-postgres psql -U postgres -d jobpilot
```

## Database Development

See detailed guide: [Database Migrations](./database-migrations.md)

## API Development

See detailed guide: [API Documentation](../api/README.md)

## Common Tasks

### Add New Microservice

```bash
# 1. Create service directory
mkdir -p services/new-service

# 2. Copy template
cp -r services/auth-service/package.json services/new-service/
cp -r services/auth-service/tsconfig.json services/new-service/
cp -r services/auth-service/nest-cli.json services/new-service/

# 3. Update package.json
# Edit services/new-service/package.json

# 4. Create source structure
mkdir -p services/new-service/src/{modules,common,config}

# 5. Install dependencies
pnpm --filter new-service install

# 6. Add to turbo.json
# Edit turbo.json to include new service
```

### Add New Shared Package

```bash
# 1. Create package directory
mkdir -p packages/new-package

# 2. Initialize package.json
cd packages/new-package
pnpm init

# 3. Create structure
mkdir -p src tests

# 4. Add to workspace
# Add to pnpm-workspace.yaml if needed

# 5. Reference in other packages
pnpm --filter auth-service add @jobpilot/new-package --workspace
```

## Related Documentation

- [Getting Started](../getting-started.md)
- [Code Style Guide](./code-style.md)
- [Testing Guide](./testing.md)
- [Database Migrations](./database-migrations.md)
- [API Development](../api/README.md)
- [Contributing Guide](../../CONTRIBUTING.md)

---

**Last Updated**: 2025-12-05
