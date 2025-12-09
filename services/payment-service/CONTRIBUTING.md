# Contributing to Payment Service

Thank you for your interest in contributing to the Payment Service! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Write or update tests as needed
6. Ensure all tests pass
7. Submit a pull request

## Development Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start dependencies with Docker Compose
docker-compose up -d postgres rabbitmq

# Run migrations
pnpm run migration:run

# Start development server
pnpm run start:dev
```

## Coding Standards

### TypeScript
- Use TypeScript for all code
- Enable strict mode
- Properly type all functions and variables
- Avoid using `any` type when possible

### Code Style
- Follow the existing code style
- Use Prettier for formatting
- Use ESLint for linting
- Run `pnpm run lint` before committing

### Naming Conventions
- Use PascalCase for classes and interfaces
- Use camelCase for variables, functions, and methods
- Use UPPER_CASE for constants
- Use kebab-case for file names

### Comments
- Write clear, concise comments
- Document complex logic
- Use JSDoc for public APIs

## Testing

### Unit Tests
```bash
pnpm run test
```

### E2E Tests
```bash
pnpm run test:e2e
```

### Test Coverage
```bash
pnpm run test:cov
```

### Testing Guidelines
- Write tests for all new features
- Maintain test coverage above 80%
- Test edge cases and error conditions
- Use descriptive test names

## Commit Messages

Follow the Conventional Commits specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build process or auxiliary tool changes

Example:
```
feat: add subscription upgrade endpoint

- Implement upgrade functionality
- Add validation for tier upgrades
- Update Stripe subscription
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md with your changes
3. Ensure all tests pass
4. Update documentation as needed
5. Request review from maintainers
6. Address any review comments

## Database Migrations

When making database schema changes:

```bash
# Generate migration
pnpm run migration:generate -- src/migrations/DescriptiveName

# Review the generated migration
# Edit if necessary

# Run migration
pnpm run migration:run
```

## API Documentation

- Update Swagger decorators for any API changes
- Include examples in DTOs
- Document all parameters and responses

## Questions?

If you have questions, please open an issue for discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
