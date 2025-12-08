# Testing Guide - Next.js Web App

Quick reference guide for running and maintaining tests in the Job-Apply-Platform web application.

## Quick Start

```bash
# Navigate to web app directory
cd apps/web

# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (reruns on file changes) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ci` | Run tests in CI mode (2 workers, coverage) |
| `npm run test:hooks` | Run only hook tests |
| `npm run test:components` | Run only component tests |
| `npm run test:integration` | Run only integration tests |

## Running Specific Tests

```bash
# Run tests for a specific file
npm test -- useApplications.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="useJobs"

# Run tests in a specific directory
npm test -- src/hooks/__tests__

# Run a single test file in watch mode
npm test -- --watch useUser.test.ts
```

## Viewing Coverage Reports

After running `npm run test:coverage`:

1. **Terminal Output**: Coverage summary appears in the terminal
2. **HTML Report**: Open `coverage/index.html` in your browser
3. **LCOV Report**: `coverage/lcov.info` (for CI/CD tools)

### Coverage Thresholds

All categories must maintain 80% coverage:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Test File Locations

```
apps/web/src/
├── hooks/__tests__/           # Hook tests
│   ├── useApplications.test.ts
│   ├── useJobs.test.ts
│   ├── useUser.test.ts
│   ├── useAuth.test.ts
│   ├── useResumes.test.ts
│   ├── useAI.test.ts
│   ├── useAnalytics.test.ts
│   └── useDebounce.test.ts
│
├── components/ui/__tests__/   # UI component tests
│   ├── Badge.test.tsx
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   ├── Input.test.tsx
│   ├── Modal.test.tsx
│   ├── Select.test.tsx
│   ├── Table.test.tsx
│   ├── Skeleton.test.tsx
│   ├── ErrorState.test.tsx
│   └── EmptyState.test.tsx
│
├── app/(dashboard)/**/__tests__/  # Integration tests
│   └── dashboard/page.test.tsx
│
└── test/                      # Test utilities
    ├── setup.tsx
    ├── test-utils.tsx
    └── mocks/
        ├── handlers.ts
        └── server.ts
```

## Writing New Tests

### 1. Hook Test Template

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useYourHook } from '../useYourHook';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useYourHook', () => {
  it('should work correctly', async () => {
    const { result } = renderHook(() => useYourHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### 2. Component Test Template

```typescript
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { YourComponent } from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<YourComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Integration Test Template

```typescript
import { render, screen, waitFor } from '@/test/test-utils';
import YourPage from '../page';
import { useYourHook } from '@/hooks/useYourHook';

jest.mock('@/hooks/useYourHook');

describe('YourPage', () => {
  it('displays data correctly', async () => {
    (useYourHook as jest.Mock).mockReturnValue({
      data: { /* mock data */ },
      isLoading: false,
    });

    render(<YourPage />);

    await waitFor(() => {
      expect(screen.getByText('Expected Content')).toBeInTheDocument();
    });
  });
});
```

## Common Testing Patterns

### Testing Async Operations

```typescript
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

### Testing User Events

```typescript
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');
await user.selectOptions(select, 'value');
```

### Testing Error States

```typescript
it('handles errors', async () => {
  (apiCall as jest.Mock).mockRejectedValue(new Error('Error'));

  const { result } = renderHook(() => useHook());

  await waitFor(() => {
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });
});
```

### Mocking API Calls

```typescript
// In mocks/handlers.ts
http.get('/api/endpoint', () => {
  return HttpResponse.json({ data: 'mock' });
})
```

## Debugging Tests

### 1. Use `screen.debug()`

```typescript
render(<Component />);
screen.debug(); // Prints DOM to console
```

### 2. Use `logTestingPlaygroundURL()`

```typescript
import { logTestingPlaygroundURL } from '@testing-library/react';

render(<Component />);
logTestingPlaygroundURL(); // Opens Testing Playground
```

### 3. Run Single Test

```bash
npm test -- --testNamePattern="specific test name"
```

### 4. Enable Verbose Output

```bash
npm test -- --verbose
```

## Common Issues and Solutions

### Issue: Test Times Out

**Solution**: Increase timeout or check for async operations

```typescript
it('test', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### Issue: Can't Find Element

**Solution**: Use `screen.logTestingPlaygroundURL()` or check timing

```typescript
// Wait for element
await waitFor(() => {
  expect(screen.getByText('Text')).toBeInTheDocument();
});
```

### Issue: Mock Not Working

**Solution**: Ensure mock is before import

```typescript
jest.mock('@/hooks/useHook'); // Before component import
import Component from './Component';
```

### Issue: State Not Updating

**Solution**: Wrap in `act()` or use `waitFor()`

```typescript
await waitFor(() => {
  expect(result.current.state).toBe(expectedValue);
});
```

## CI/CD Integration

Tests run automatically in CI with:
```bash
npm run test:ci
```

This command:
- Runs all tests once
- Generates coverage report
- Uses 2 workers for stability
- Fails if coverage < 80%

## Best Practices

1. ✅ **Test user behavior**, not implementation
2. ✅ **Use semantic queries** (`getByRole`, `getByLabelText`)
3. ✅ **Mock external dependencies** (APIs, hooks)
4. ✅ **Test error states** and edge cases
5. ✅ **Keep tests isolated** (no shared state)
6. ✅ **Use descriptive test names**
7. ✅ **Group related tests** with `describe()`
8. ✅ **Clean up after tests** (`afterEach`, `cleanup`)

## Accessibility Testing

Always test for accessibility:

```typescript
// Check ARIA attributes
expect(element).toHaveAttribute('aria-label', 'Label');
expect(element).toHaveAttribute('aria-invalid', 'true');

// Check roles
expect(screen.getByRole('button')).toBeInTheDocument();

// Check keyboard navigation
element.focus();
expect(element).toHaveFocus();
```

## Performance Tips

1. Use `waitFor()` instead of `wait()`
2. Avoid unnecessary `async/await`
3. Mock heavy computations
4. Use `placeholderData` in queries
5. Limit test file size (< 500 lines)

## Getting Help

- **React Testing Library Docs**: https://testing-library.com/react
- **Jest Docs**: https://jestjs.io/
- **Testing Playground**: https://testing-playground.com/

## Maintenance Checklist

- [ ] Run tests before committing
- [ ] Update tests when changing features
- [ ] Maintain 80%+ coverage
- [ ] Fix flaky tests immediately
- [ ] Review coverage reports weekly
- [ ] Update mocks when API changes

---

**Last Updated**: 2025-12-06
**Maintained By**: Development Team
