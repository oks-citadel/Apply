# Contributing to JobPilot AI Platform

Thank you for your interest in contributing to JobPilot AI Platform! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Be patient and understanding
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community

Unacceptable behavior includes harassment, trolling, insults, or other unprofessional conduct.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. Read the [Getting Started Guide](docs/getting-started.md)
2. Set up your development environment
3. Familiarized yourself with the [Architecture](docs/architecture.md)
4. Reviewed the [API Reference](docs/api-reference.md)

### Finding Issues to Work On

Good starting points:

1. **Good First Issues**: Issues labeled `good first issue` are suitable for newcomers
2. **Help Wanted**: Issues labeled `help wanted` need community assistance
3. **Bug Reports**: Issues labeled `bug` that are unassigned
4. **Feature Requests**: Issues labeled `enhancement` or `feature request`

Browse open issues: https://github.com/your-org/Job-Apply-Platform/issues

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Job-Apply-Platform.git
   cd Job-Apply-Platform
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-org/Job-Apply-Platform.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start services**:
   ```bash
   pnpm docker:up
   pnpm dev
   ```

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
# Update your local develop branch
git checkout develop
git pull upstream develop

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates
- `chore/description` - Build/tooling changes

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the coding standards (see below)
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

Run the full test suite:

```bash
# Run all tests
pnpm test

# Run tests for specific service
cd services/auth-service
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

Ensure all tests pass before submitting your PR.

### 4. Lint and Format

```bash
# Run linter
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check
```

### 5. Commit Your Changes

Follow the commit message guidelines (see below):

```bash
git add .
git commit -m "feat: add user profile avatar upload"
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template
5. Submit the PR

## Coding Standards

### TypeScript/JavaScript

#### General Principles

- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **SOLID Principles**: Follow object-oriented design principles
- **KISS (Keep It Simple, Stupid)**: Prefer simple solutions
- **YAGNI (You Aren't Gonna Need It)**: Don't add unnecessary features

#### Code Style

We use ESLint and Prettier for consistent code formatting.

**Key Rules**:
- Use TypeScript for all new code
- Use meaningful variable and function names
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Use async/await over promises chains
- Add JSDoc comments for public APIs

**Example**:

```typescript
/**
 * Fetch user profile by ID
 * @param userId - The unique identifier of the user
 * @returns User profile data
 * @throws {NotFoundException} If user not found
 */
async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await userRepository.findOne({ where: { id: userId } });

  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}
```

#### File Organization

```typescript
// 1. Imports (external first, then internal)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

// 2. Constants
const MAX_RETRY_ATTEMPTS = 3;

// 3. Interfaces/Types
interface UserResponse {
  id: string;
  email: string;
}

// 4. Main class/function
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Public methods first
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Private methods last
  private async validateUser(user: User): Promise<boolean> {
    // ...
  }
}

// 5. Exports
export { UserService };
```

#### Naming Conventions

- **Files**: kebab-case (`user-service.ts`, `create-user.dto.ts`)
- **Classes**: PascalCase (`UserService`, `CreateUserDto`)
- **Interfaces**: PascalCase with `I` prefix optional (`UserProfile` or `IUserProfile`)
- **Functions/Methods**: camelCase (`getUserById`, `createUser`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `API_VERSION`)
- **Variables**: camelCase (`userId`, `userProfile`)

#### TypeScript Best Practices

```typescript
// ✅ Good: Use explicit types
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad: Implicit any
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good: Use interfaces for object shapes
interface UserDto {
  email: string;
  firstName: string;
  lastName: string;
}

// ✅ Good: Use enums for constants
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PREMIUM = 'premium',
}

// ✅ Good: Use optional chaining
const userName = user?.profile?.name ?? 'Guest';

// ❌ Bad: Nested conditionals
const userName = user && user.profile && user.profile.name || 'Guest';
```

### Python (AI Service)

Follow PEP 8 style guide:

```python
# Good: Clear function names, type hints
def calculate_match_score(
    resume: Resume,
    job_description: str
) -> float:
    """
    Calculate match score between resume and job.

    Args:
        resume: Resume object
        job_description: Job description text

    Returns:
        Match score between 0 and 100
    """
    # Implementation
    pass

# Use type hints
from typing import List, Dict, Optional

def get_user_skills(user_id: str) -> List[str]:
    pass

# Use docstrings
def parse_resume(file_path: str) -> Dict:
    """Parse resume file and extract structured data."""
    pass
```

### Database

#### Migrations

- Always create migrations for schema changes
- Name migrations descriptively
- Never modify existing migrations in production
- Test migrations in both directions (up/down)

```typescript
// Good migration naming
1733500000000-CreateUsersTable.ts
1733500001000-AddEmailIndexToUsers.ts
1733500002000-AddRoleColumnToUsers.ts
```

#### Queries

- Use query builders or ORMs (TypeORM, Prisma)
- Always use parameterized queries
- Add indexes for frequently queried columns
- Use transactions for multi-step operations

```typescript
// ✅ Good: Using TypeORM query builder
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email })
  .getMany();

// ✅ Good: Transaction
await connection.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(profile);
});

// ❌ Bad: Raw SQL with string interpolation
const users = await connection.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, no code change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, tools, dependencies
- `ci`: CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(auth): add OAuth login support"

# Bug fix
git commit -m "fix(resume): resolve parsing error for PDF files"

# Documentation
git commit -m "docs: update API reference for job service"

# Refactoring
git commit -m "refactor(user): extract validation logic to separate service"

# Breaking change
git commit -m "feat(api): change authentication to use JWT

BREAKING CHANGE: API now requires JWT tokens instead of session cookies"
```

### Commit Message Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep first line under 72 characters
- Reference issues in footer (`Closes #123`, `Fixes #456`)
- Explain **what** and **why**, not **how**

## Pull Request Process

### Before Submitting

Ensure your PR meets these criteria:

- [ ] Code follows project coding standards
- [ ] All tests pass (`pnpm test`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with develop

### PR Title

Use the same format as commit messages:

```
feat(auth): add OAuth login support
fix(resume): resolve PDF parsing error
docs: update getting started guide
```

### PR Description

Use the PR template and include:

1. **Description**: What does this PR do?
2. **Motivation**: Why is this change needed?
3. **Changes**: List of changes made
4. **Testing**: How was this tested?
5. **Screenshots**: For UI changes
6. **Breaking Changes**: If any
7. **Related Issues**: Link to related issues

### Example PR Description

```markdown
## Description
Adds OAuth login support for Google and LinkedIn.

## Motivation
Users requested easier login without creating new accounts.

## Changes
- Added OAuth strategy for Google and LinkedIn
- Created OAuth callback endpoints
- Updated auth service to handle OAuth tokens
- Added OAuth provider UI buttons

## Testing
- [x] Manual testing with Google OAuth
- [x] Manual testing with LinkedIn OAuth
- [x] Unit tests for OAuth service
- [x] Integration tests for OAuth flow

## Screenshots
![OAuth Login](./screenshots/oauth-login.png)

## Breaking Changes
None

## Related Issues
Closes #234
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linters
2. **Code Review**: At least one maintainer reviews the code
3. **Requested Changes**: Address feedback and push updates
4. **Approval**: Once approved, PR can be merged
5. **Merge**: Squash and merge to develop branch

### After Merge

- Delete your feature branch
- Update your local repository
- Close related issues if not auto-closed

## Testing Requirements

### Test Coverage

We aim for:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

### Writing Tests

#### Unit Tests

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser as User);

      const result = await service.findById('123');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('123')).rejects.toThrow(NotFoundException);
    });
  });
});
```

#### Integration Tests

```typescript
// auth.controller.spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.email).toBe('test@example.com');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

#### E2E Tests

```typescript
// Playwright E2E test
test('user can login and view dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.fill('[data-testid="email-input"]', 'user@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex logic with inline comments
- Keep README files up-to-date
- Update API documentation when changing endpoints

### Documentation Files

When adding features, update:
- `README.md` - If adding major features
- `docs/api-reference.md` - For new API endpoints
- Service-specific `README.md` - For service changes
- `docs/architecture.md` - For architectural changes

### API Documentation

Use OpenAPI/Swagger annotations:

```typescript
@ApiOperation({ summary: 'Create a new user' })
@ApiResponse({ status: 201, description: 'User created successfully' })
@ApiResponse({ status: 400, description: 'Invalid input' })
@Post()
async create(@Body() createUserDto: CreateUserDto): Promise<User> {
  return this.userService.create(createUserDto);
}
```

## Issue Reporting

### Bug Reports

When reporting bugs, include:

1. **Title**: Clear, descriptive title
2. **Description**: What happened vs. what you expected
3. **Steps to Reproduce**: Detailed steps
4. **Environment**: OS, Node version, browser, etc.
5. **Error Messages**: Full error messages and stack traces
6. **Screenshots**: If applicable

### Feature Requests

When requesting features, include:

1. **Title**: Clear feature name
2. **Problem**: What problem does this solve?
3. **Solution**: Proposed solution
4. **Alternatives**: Other solutions considered
5. **Use Cases**: How would this be used?

## Questions?

If you have questions about contributing:

1. Check the [FAQ](docs/faq.md)
2. Read the [Documentation](docs/)
3. Ask in [Discussions](https://github.com/your-org/Job-Apply-Platform/discussions)
4. Join our [Discord](https://discord.gg/jobpilot)
5. Email: dev@jobpilot.ai

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to JobPilot AI Platform!
