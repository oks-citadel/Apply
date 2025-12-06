# Frontend Testing Guide

This document provides an overview of the testing setup and best practices for the Job Apply Platform web application.

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers

## Test Results

All tests passing: **128 tests across 5 test suites**

- Button Component: 26 tests
- Input Component: 47 tests
- Modal Component: 33 tests
- Card Component: 31 tests (including all sub-components)
- LoginForm Component: 13 tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Project Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── __tests__/          # UI component tests
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Input.test.tsx
│   │   │   │   ├── Modal.test.tsx
│   │   │   │   └── Card.test.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   └── forms/
│   │       ├── __tests__/          # Form component tests
│   │       │   ├── LoginForm.test.tsx
│   │       │   └── RegisterForm.test.tsx
│   │       ├── LoginForm.tsx
│   │       └── RegisterForm.tsx
│   ├── stores/
│   │   ├── __tests__/              # Store tests
│   │   │   └── authStore.test.ts
│   │   └── authStore.ts
│   └── __tests__/
│       ├── utils/
│       │   └── test-utils.tsx      # Custom render functions
│       └── mocks/
│           ├── handlers.ts         # MSW request handlers
│           └── server.ts           # MSW server setup
├── jest.config.js                  # Jest configuration
├── jest.setup.js                   # Global test setup
└── TESTING.md                      # This file
```

## Test Coverage

### UI Components

#### Button.test.tsx
- Rendering with text and custom classes
- All variants (default, destructive, outline, secondary, ghost, link)
- All sizes (default, sm, lg, icon)
- Loading state with spinner
- Disabled state
- Click handlers
- Type attributes
- Accessibility (focus styles, aria attributes)

#### Input.test.tsx
- Rendering with different types
- Label association and generation
- Error display and styling
- Helper text
- Disabled state
- User input handling
- Controlled/uncontrolled modes
- Accessibility (aria attributes, autocomplete)

#### Modal.test.tsx
- Open/close rendering
- Title and description
- Size variants (sm, md, lg, xl, full)
- Backdrop click handling
- Close button
- Escape key navigation
- Body scroll locking
- Accessibility (dialog role, aria attributes)
- ModalHeader and ModalFooter components

#### Card.test.tsx
- Basic card rendering
- CardHeader, CardTitle, CardDescription
- CardContent and CardFooter
- Custom classes and refs
- Complete card structures

### Form Components

#### LoginForm.test.tsx
- Form field rendering (email, password, remember me checkbox)
- Form structure and element types
- Link rendering (forgot password, sign up)
- Accessibility (labels, autocomplete, required fields, button names)
- Input types and attributes

**Note**: Advanced form validation and submission tests can be added using Jest mocks for axios or MSW for API mocking.

## Writing Tests

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### User Interaction Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyForm } from '../MyForm';

describe('MyForm', () => {
  it('handles form submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<MyForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
```

### API Mocking with Jest

```typescript
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock successful API response
mockedAxios.post.mockResolvedValueOnce({
  data: { success: true },
});

// Mock failed API response
mockedAxios.post.mockRejectedValueOnce({
  response: {
    data: { message: 'Error' },
    status: 400,
  },
});
```

### Testing with Custom Render

```typescript
import { render } from '@/__tests__/utils/test-utils';
import { MyComponent } from '../MyComponent';

// Uses custom render with providers (QueryClient, etc.)
render(<MyComponent />);
```

## Best Practices

1. **Test user behavior, not implementation details**
   - Query by accessible roles and labels
   - Avoid testing internal state

2. **Use proper queries**
   - Prefer `getByRole` and `getByLabelText`
   - Use `queryBy` for elements that shouldn't exist
   - Use `findBy` for async elements

3. **Clean up between tests**
   - Reset mocks and store state in `afterEach`
   - Clear MSW handlers

4. **Test accessibility**
   - Check for proper labels
   - Verify aria attributes
   - Test keyboard navigation

5. **Keep tests focused**
   - One assertion per test when possible
   - Use descriptive test names
   - Group related tests with `describe`

## Common Patterns

### Testing Forms with Validation

```typescript
it('shows validation error', async () => {
  const user = userEvent.setup();
  render(<MyForm />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('shows loading state', async () => {
  render(<MyComponent />);

  await user.click(screen.getByRole('button'));

  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('displays error message', async () => {
  server.use(
    http.post('/api/endpoint', () => {
      return HttpResponse.json(
        { message: 'Error occurred' },
        { status: 500 }
      );
    })
  );

  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/error occurred/i);
  });
});
```

## Troubleshooting

### Tests timing out
- Check for missing `await` on async operations
- Ensure MSW handlers are properly configured
- Verify component cleanup in `afterEach`

### "Not wrapped in act(...)" warnings
- Use `await waitFor()` for async state updates
- Ensure all promises are resolved
- Use `act()` for synchronous state updates

### Element not found
- Check if element is rendered conditionally
- Use `findBy` for async elements
- Verify query selectors match the DOM

## Resources

- [React Testing Library Documentation](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
