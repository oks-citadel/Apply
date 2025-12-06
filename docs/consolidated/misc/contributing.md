# Contributing to JobPilot AI Platform

Thank you for your interest in contributing to JobPilot AI! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- Git
- Python >= 3.11 (for AI service development)

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/your-username/jobpilot-platform.git
cd jobpilot-platform
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. **Start infrastructure services**

```bash
make docker-up
# or
docker-compose up -d
```

5. **Run database migrations**

```bash
make db-migrate
```

6. **Start development servers**

```bash
make dev
# or
pnpm dev
```

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency fixes

### Creating a Branch

```bash
# Feature branch
git checkout -b feature/your-feature-name

# Bug fix branch
git checkout -b bugfix/issue-description

# Hotfix branch
git checkout -b hotfix/critical-fix
```

### Making Changes

1. **Write clean, maintainable code**
   - Follow existing code style
   - Use TypeScript for type safety
   - Write self-documenting code
   - Add comments for complex logic

2. **Follow naming conventions**
   - Files: `kebab-case.ts`
   - Components: `PascalCase.tsx`
   - Functions/variables: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`
   - Types/Interfaces: `PascalCase`

3. **Write tests**
   - Unit tests for utilities and functions
   - Integration tests for API endpoints
   - E2E tests for critical user flows

4. **Update documentation**
   - Update README if needed
   - Add JSDoc comments for functions
   - Update API documentation

### Code Quality

Before committing, ensure your code passes all checks:

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check

# Run tests
pnpm test
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**

```bash
feat(auth): add OAuth2 Google login

fix(resume): resolve PDF parsing error for multi-page documents

docs(api): update authentication endpoints documentation

test(user): add unit tests for user service
```

### Pull Request Process

1. **Update your branch**

```bash
git checkout develop
git pull origin develop
git checkout your-branch
git rebase develop
```

2. **Push your changes**

```bash
git push origin your-branch
```

3. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots/videos if applicable
   - Request reviews from maintainers

4. **Address review feedback**
   - Make requested changes
   - Push additional commits
   - Re-request review

5. **Merge**
   - Wait for approval from maintainers
   - Ensure CI/CD passes
   - Squash and merge when approved

## Coding Standards

### TypeScript

- Enable strict mode
- Avoid `any` types
- Use type inference when possible
- Define interfaces for complex objects
- Use enums for fixed sets of values

### React/Next.js

- Use functional components
- Implement proper error boundaries
- Follow React hooks rules
- Optimize re-renders with memo/useMemo
- Use Next.js built-in features (Image, Link, etc.)

### Node.js/Backend

- Use async/await over callbacks
- Implement proper error handling
- Validate all inputs
- Use environment variables for config
- Log appropriately (debug, info, warn, error)

### Database

- Use transactions for related operations
- Index frequently queried columns
- Avoid N+1 queries
- Use parameterized queries (prevent SQL injection)
- Document schema changes

### Testing

- Write descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error scenarios
- Aim for >80% code coverage

## Project-Specific Guidelines

### Adding a New Microservice

1. Create service directory in `services/`
2. Add `package.json` with service dependencies
3. Create `src/` directory structure
4. Add service to `turbo.json` pipeline
5. Update `docker-compose.yml` if needed
6. Document API endpoints
7. Add integration tests

### Adding a New Package

1. Create package directory in `packages/`
2. Add `package.json` with dependencies
3. Create `src/` and export types/functions
4. Add to path aliases in `tsconfig.base.json`
5. Write unit tests
6. Document exports

### Updating Dependencies

```bash
# Check for outdated dependencies
pnpm outdated

# Update specific package
pnpm update package-name

# Update all dependencies (careful!)
pnpm update --latest
```

### Database Migrations

```bash
# Create new migration
pnpm --filter [service-name] migration:create migration-name

# Run migrations
pnpm db:migrate

# Rollback migration
pnpm --filter [service-name] migration:rollback
```

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Specific workspace
pnpm --filter [package-name] test

# Watch mode
pnpm --filter [package-name] test:watch

# Coverage
pnpm --filter [package-name] test:coverage
```

### Writing Tests

**Unit Test Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from './utils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('January 1, 2024');
  });

  it('should handle invalid dates', () => {
    expect(() => formatDate(null)).toThrow();
  });
});
```

**Integration Test Example:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './app';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## Documentation

### Code Documentation

Use JSDoc for functions and complex types:

```typescript
/**
 * Generates a JWT token for the given user
 * @param userId - The unique identifier of the user
 * @param expiresIn - Token expiration time (default: 7d)
 * @returns A signed JWT token string
 * @throws {TokenGenerationError} If token generation fails
 */
export function generateToken(userId: string, expiresIn = '7d'): string {
  // Implementation
}
```

### API Documentation

Document all API endpoints:

```typescript
/**
 * @api {post} /api/auth/login Login User
 * @apiName LoginUser
 * @apiGroup Authentication
 *
 * @apiParam {String} email User's email
 * @apiParam {String} password User's password
 *
 * @apiSuccess {String} token JWT authentication token
 * @apiSuccess {Object} user User object
 *
 * @apiError {400} ValidationError Invalid credentials
 * @apiError {500} ServerError Internal server error
 */
```

## Getting Help

- Check existing documentation in `docs/`
- Search existing issues on GitHub
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to JobPilot AI Platform!
