# Development Workflow

This guide describes the development workflow for contributing to JobPilot AI Platform.

## Table of Contents

- [Development Environment](#development-environment)
- [Branch Strategy](#branch-strategy)
- [Feature Development](#feature-development)
- [Code Review Process](#code-review-process)
- [Testing Workflow](#testing-workflow)
- [Documentation Updates](#documentation-updates)
- [Release Process](#release-process)

## Development Environment

### IDE Setup

**Recommended**: Visual Studio Code with extensions:
- ESLint
- Prettier - Code formatter
- TypeScript and JavaScript Language Features
- Docker
- Kubernetes
- GitLens
- REST Client
- Database Client

### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
```

### Local Development

```bash
# Start all services
pnpm dev

# Start specific service
cd services/auth-service
pnpm dev

# Run with debugging
cd services/auth-service
pnpm dev:debug
```

### Hot Reload

All services support hot reload during development:
- TypeScript services: `ts-node-dev` with `--respawn`
- Next.js: Built-in Fast Refresh
- Python: `uvicorn` with `--reload`

## Branch Strategy

We follow **Git Flow** branching model:

### Main Branches

- `main` - Production-ready code
- `develop` - Integration branch for features

### Supporting Branches

- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

### Branch Naming

```
feature/user-authentication
feature/job-search-filters
fix/resume-parsing-error
fix/memory-leak-auth-service
hotfix/critical-security-patch
release/v1.2.0
```

## Feature Development

### 1. Start New Feature

```bash
# Ensure develop is up-to-date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/job-recommendation-engine

# Verify you're on the right branch
git branch
```

### 2. Development Cycle

```bash
# Make changes
code .

# Check status
git status

# Add changes
git add .

# Commit with conventional commit message
git commit -m "feat(jobs): add ML-based recommendation engine"

# Push to remote
git push origin feature/job-recommendation-engine
```

### 3. Keep Branch Updated

```bash
# Regularly sync with develop
git checkout develop
git pull origin develop
git checkout feature/job-recommendation-engine
git rebase develop

# Or merge if preferred
git merge develop

# Resolve conflicts if any
# Then continue
git rebase --continue  # if rebasing
```

### 4. Pre-PR Checklist

Before creating a pull request:

- [ ] All tests pass locally
- [ ] Code is linted and formatted
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with develop

```bash
# Run all checks
pnpm lint
pnpm format
pnpm type-check
pnpm test

# Or use the pre-commit hook
git commit
```

### 5. Create Pull Request

1. Push final changes
2. Go to GitHub repository
3. Click "New Pull Request"
4. Select `develop` as base branch
5. Fill in PR template
6. Request reviews
7. Link related issues

## Code Review Process

### For Authors

1. **Self-Review**: Review your own code first
2. **Add Context**: Explain non-obvious changes in comments
3. **Small PRs**: Keep PRs focused and manageable (< 400 lines)
4. **Responsive**: Respond to feedback promptly
5. **Be Open**: Accept constructive criticism

### For Reviewers

1. **Timely**: Review within 24 hours
2. **Constructive**: Provide helpful feedback
3. **Specific**: Reference line numbers and files
4. **Test**: Pull and test the changes locally
5. **Approve**: Approve when ready

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are adequate
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate
- [ ] Documentation is updated
- [ ] No hardcoded values or secrets
- [ ] Database migrations are correct

### Review Comments

Use conventional prefixes:

- `nit:` - Minor suggestion
- `question:` - Need clarification
- `suggestion:` - Improvement idea
- `issue:` - Must be fixed
- `blocker:` - Critical issue blocking approval

**Example**:
```
nit: Consider using a more descriptive variable name

suggestion: This could be extracted into a separate function

issue: This will cause a memory leak - needs to be fixed
```

## Testing Workflow

### Test-Driven Development (TDD)

For complex features, use TDD:

1. **Write failing test**
```typescript
describe('JobRecommendationService', () => {
  it('should return jobs matching user skills', async () => {
    const recommendations = await service.getRecommendations(userId);
    expect(recommendations).toHaveLength(10);
  });
});
```

2. **Write minimal code to pass**
```typescript
async getRecommendations(userId: string) {
  // Minimal implementation
  return [];
}
```

3. **Refactor and improve**
```typescript
async getRecommendations(userId: string) {
  const user = await this.userService.findById(userId);
  const skills = user.skills;
  return this.jobService.findMatchingJobs(skills);
}
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific service
cd services/auth-service
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test user.service.spec.ts

# Run with coverage
pnpm test:cov

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### Writing Tests

#### Unit Tests

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repository: MockRepository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: MockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('123');

      expect(result).toEqual(mockUser);
    });

    it('should throw when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

#### Integration Tests

```typescript
// auth.controller.e2e-spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.accessToken).toBeDefined();
      });
  });
});
```

### Test Coverage

Maintain test coverage above 80%:

```bash
# Generate coverage report
pnpm test:cov

# View HTML report
open coverage/lcov-report/index.html
```

## Documentation Updates

### When to Update Docs

Update documentation when:
- Adding new API endpoints
- Changing API contracts
- Adding new environment variables
- Modifying architecture
- Adding new features
- Fixing bugs that affect usage

### What to Update

- **API Reference**: For endpoint changes
- **README**: For major features
- **Architecture Docs**: For structural changes
- **Environment Docs**: For new variables
- **Troubleshooting**: For common issues

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep examples up-to-date
- Use consistent formatting

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Workflow

#### 1. Create Release Branch

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0
```

#### 2. Update Version Numbers

```bash
# Update package.json in all services
npm version 1.2.0 --workspaces

# Commit version bump
git add .
git commit -m "chore: bump version to 1.2.0"
```

#### 3. Update Changelog

Update `CHANGELOG.md`:

```markdown
## [1.2.0] - 2024-01-15

### Added
- Job recommendation engine with ML
- Resume optimization suggestions
- Email notifications for job matches

### Changed
- Improved API response times by 30%
- Updated UI for better mobile experience

### Fixed
- Resume parsing error for PDF files
- Memory leak in auth service
```

#### 4. Run Final Tests

```bash
# Run full test suite
pnpm test

# Run E2E tests
pnpm test:e2e

# Security scan
pnpm audit
```

#### 5. Merge to Main

```bash
# Create PR to main
git push origin release/v1.2.0

# After approval, merge to main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags
```

#### 6. Merge Back to Develop

```bash
git checkout develop
git merge release/v1.2.0
git push origin develop
```

#### 7. Deploy to Production

```bash
# Trigger deployment (GitHub Actions)
git push origin v1.2.0

# Or manually deploy
kubectl set image deployment/auth-service auth-service=jobpilotacr.azurecr.io/auth-service:v1.2.0
```

#### 8. Create GitHub Release

1. Go to GitHub Releases
2. Click "Draft a new release"
3. Select tag `v1.2.0`
4. Add release notes from CHANGELOG
5. Upload any binaries
6. Publish release

### Hotfix Process

For critical production bugs:

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-auth-bug

# Fix the bug
# ... make changes ...

# Test thoroughly
pnpm test

# Bump patch version
npm version patch

# Merge to main
git checkout main
git merge hotfix/critical-auth-bug
git tag v1.2.1
git push origin main --tags

# Merge to develop
git checkout develop
git merge hotfix/critical-auth-bug
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-auth-bug
```

## Daily Development Workflow

### Morning Routine

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Check what you're working on
git branch

# Start Docker services
pnpm docker:up

# Start development servers
pnpm dev
```

### During Development

```bash
# Make changes
# Run tests frequently
pnpm test:watch

# Commit frequently
git add .
git commit -m "feat: partial implementation of feature"

# Push to backup your work
git push origin feature/my-feature
```

### End of Day

```bash
# Ensure all changes are committed
git status

# Push final changes
git push origin feature/my-feature

# Stop Docker services (optional)
pnpm docker:down
```

## Best Practices

1. **Commit Often**: Small, focused commits
2. **Test First**: Write tests before or with code
3. **Code Review**: Always get code reviewed
4. **Documentation**: Document as you code
5. **Communication**: Update team on progress
6. **Clean Code**: Follow coding standards
7. **Refactor**: Improve code continuously
8. **Security**: Think security first

## Tools & Scripts

### Useful Git Commands

```bash
# View commit history
git log --oneline --graph --decorate

# Stash changes
git stash
git stash pop

# Amend last commit
git commit --amend

# Interactive rebase
git rebase -i HEAD~3

# Cherry-pick commit
git cherry-pick abc123
```

### Useful pnpm Commands

```bash
# Add dependency to specific workspace
pnpm add express --filter auth-service

# Remove dependency
pnpm remove express --filter auth-service

# Update dependencies
pnpm update

# Clean and reinstall
pnpm clean
pnpm install
```

## Getting Help

- **Documentation**: Check docs first
- **Team Chat**: Ask in Slack/Discord
- **Code Review**: Request review from teammates
- **Stack Overflow**: Search for similar issues
- **GitHub Issues**: Check existing issues

## Additional Resources

- [Coding Standards](coding-standards.md)
- [Testing Guide](testing.md)
- [Git Best Practices](git-best-practices.md)
- [CI/CD Pipeline](../deployment/cicd.md)

---

Happy coding!
