# ApplyforUs Developer Handoff Guide

Version 1.0 | Last Updated: December 2025

## Table of Contents

1. [Overview](#overview)
2. [Design Tokens & Variables](#design-tokens--variables)
3. [Tailwind Configuration](#tailwind-configuration)
4. [Component Implementation](#component-implementation)
5. [File Structure Standards](#file-structure-standards)
6. [Naming Conventions](#naming-conventions)
7. [Git Workflow](#git-workflow)
8. [Code Review Standards](#code-review-standards)
9. [Testing Requirements](#testing-requirements)
10. [Accessibility Guidelines](#accessibility-guidelines)

---

## Overview

This document provides technical implementation guidelines for the ApplyforUs rebrand. It covers design system implementation, coding standards, and development workflows.

### Key Changes from JobPilot

- **Brand Name:** JobPilot → ApplyforUs
- **Primary Color:** Blue remains primary, updated shades
- **Typography:** Standardized on Inter font family
- **Component Library:** Aligned with shadcn/ui patterns
- **Design System:** Centralized CSS variables and Tailwind config

### Technology Stack

- **Frontend:** Next.js 14+, React 18+, TypeScript 5+
- **Styling:** Tailwind CSS 3.4+, CSS Custom Properties
- **Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide Icons
- **State Management:** React Context, Zustand (where needed)
- **Forms:** React Hook Form + Zod validation

---

## Design Tokens & Variables

### CSS Custom Properties (globals.css)

All color and spacing values should reference CSS custom properties for theme consistency and dark mode support.

#### Light Mode Variables

```css
:root {
  /* Base Colors */
  --background: 0 0% 100%;                    /* #FFFFFF */
  --foreground: 222.2 84% 4.9%;               /* #111827 */

  /* Brand Colors */
  --primary: 221.2 83.2% 53.3%;               /* #3B82F6 */
  --primary-foreground: 210 40% 98%;          /* #F1F5F9 */

  /* UI Colors */
  --secondary: 210 40% 96.1%;                 /* #F9FAFB */
  --secondary-foreground: 222.2 47.4% 11.2%;  /* #1F2937 */

  --muted: 210 40% 96.1%;                     /* #F9FAFB */
  --muted-foreground: 215.4 16.3% 46.9%;      /* #6B7280 */

  --accent: 210 40% 96.1%;                    /* #F9FAFB */
  --accent-foreground: 222.2 47.4% 11.2%;     /* #1F2937 */

  /* Semantic Colors */
  --destructive: 0 84.2% 60.2%;               /* #EF4444 */
  --destructive-foreground: 210 40% 98%;      /* #F1F5F9 */

  /* Component Colors */
  --card: 0 0% 100%;                          /* #FFFFFF */
  --card-foreground: 222.2 84% 4.9%;          /* #111827 */

  --popover: 0 0% 100%;                       /* #FFFFFF */
  --popover-foreground: 222.2 84% 4.9%;       /* #111827 */

  --border: 214.3 31.8% 91.4%;                /* #E5E7EB */
  --input: 214.3 31.8% 91.4%;                 /* #E5E7EB */
  --ring: 221.2 83.2% 53.3%;                  /* #3B82F6 */

  /* Border Radius */
  --radius: 0.5rem;                           /* 8px */
}
```

#### Dark Mode Variables

```css
.dark {
  --background: 222.2 84% 4.9%;               /* #0F172A */
  --foreground: 210 40% 98%;                  /* #F1F5F9 */

  --primary: 217.2 91.2% 59.8%;               /* #60A5FA */
  --primary-foreground: 222.2 47.4% 11.2%;    /* #1F2937 */

  --secondary: 217.2 32.6% 17.5%;             /* #1E293B */
  --secondary-foreground: 210 40% 98%;        /* #F1F5F9 */

  --muted: 217.2 32.6% 17.5%;                 /* #1E293B */
  --muted-foreground: 215 20.2% 65.1%;        /* #94A3B8 */

  --accent: 217.2 32.6% 17.5%;                /* #1E293B */
  --accent-foreground: 210 40% 98%;           /* #F1F5F9 */

  --destructive: 0 62.8% 30.6%;               /* #991B1B */
  --destructive-foreground: 210 40% 98%;      /* #F1F5F9 */

  --card: 222.2 84% 4.9%;                     /* #0F172A */
  --card-foreground: 210 40% 98%;             /* #F1F5F9 */

  --popover: 222.2 84% 4.9%;                  /* #0F172A */
  --popover-foreground: 210 40% 98%;          /* #F1F5F9 */

  --border: 217.2 32.6% 17.5%;                /* #1E293B */
  --input: 217.2 32.6% 17.5%;                 /* #1E293B */
  --ring: 224.3 76.3% 48%;                    /* #3B82F6 */
}
```

### Usage in Components

```tsx
// ✓ CORRECT - Use CSS variables
<div className="bg-background text-foreground">
  <h1 className="text-primary">ApplyforUs</h1>
  <Button className="bg-primary text-primary-foreground">
    Get Started
  </Button>
</div>

// ✗ INCORRECT - Don't hardcode colors
<div className="bg-white text-black">
  <h1 className="text-blue-500">ApplyforUs</h1>
  <Button className="bg-[#3B82F6] text-white">
    Get Started
  </Button>
</div>
```

---

## Tailwind Configuration

### Complete Configuration (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        info: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'h1': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h5': ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### Typography Utilities

Use semantic fontSize classes instead of arbitrary values:

```tsx
// ✓ CORRECT
<h1 className="text-h1">Page Title</h1>
<h2 className="text-h2">Section Title</h2>
<p className="text-body">Body text</p>
<span className="text-caption">Caption text</span>

// ✗ INCORRECT
<h1 className="text-4xl font-bold">Page Title</h1>
<h2 className="text-3xl font-semibold">Section Title</h2>
```

---

## Component Implementation

### Button Component

```tsx
// src/components/ui/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Card Component

```tsx
// src/components/ui/Card.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-h4 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### Badge Component

```tsx
// src/components/ui/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-transparent',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        success: 'bg-success text-success-foreground border-transparent',
        warning: 'bg-warning text-warning-foreground border-transparent',
        destructive: 'bg-destructive text-destructive-foreground border-transparent',
        outline: 'text-foreground border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

---

## File Structure Standards

### Directory Organization

```
src/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Route groups
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── resumes/
│   │   ├── jobs/
│   │   └── applications/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── features/                 # Feature-specific components
│   │   ├── resume/
│   │   ├── jobs/
│   │   └── applications/
│   └── layouts/                  # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── lib/                          # Utility functions
│   ├── utils.ts                  # General utilities
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Auth utilities
│   └── validators.ts             # Zod schemas
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useToast.ts
│   └── useDebounce.ts
├── types/                        # TypeScript types
│   ├── index.ts
│   ├── api.ts
│   └── models.ts
├── config/                       # Configuration files
│   ├── site.ts                   # Site metadata
│   └── api.ts                    # API endpoints
└── styles/                       # Additional styles
    └── custom.css
```

### Component File Structure

```tsx
// ComponentName.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 1. Type definitions
interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  // Props
}

// 2. Variants (if using CVA)
const componentVariants = cva(/* ... */);

// 3. Component
const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(/* ... */, className)} {...props} />
    );
  }
);

// 4. Display name
Component.displayName = 'Component';

// 5. Exports
export { Component };
export type { ComponentProps };
```

---

## Naming Conventions

### File Naming

- **Components:** PascalCase - `Button.tsx`, `UserProfile.tsx`
- **Utilities:** camelCase - `utils.ts`, `formatDate.ts`
- **Hooks:** camelCase with 'use' prefix - `useAuth.ts`, `useDebounce.ts`
- **Types:** camelCase - `types.ts`, `api.types.ts`
- **Constants:** camelCase or UPPER_CASE - `config.ts`, `API_ENDPOINTS.ts`
- **Pages:** lowercase with hyphens - `login/page.tsx`, `user-profile/page.tsx`

### Variable Naming

```typescript
// ✓ CORRECT
const userName = 'John';
const isLoading = true;
const fetchUserData = async () => {};
const UserProfile = () => {};

// ✗ INCORRECT
const user_name = 'John';
const loading = true;
const getUserData = async () => {};
const userProfile = () => {};
```

### CSS Class Naming

Use Tailwind utility classes. For custom classes, use kebab-case:

```css
/* ✓ CORRECT */
.custom-scrollbar {}
.hero-gradient {}

/* ✗ INCORRECT */
.customScrollbar {}
.hero_gradient {}
```

### Component Props

```typescript
// ✓ CORRECT - Descriptive, specific names
interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  onClick?: () => void;
}

// ✗ INCORRECT - Generic, unclear names
interface ButtonProps {
  type?: string;
  s?: string;
  loading?: boolean;
  click?: () => void;
}
```

### API Endpoints

```typescript
// ✓ CORRECT - RESTful, consistent
const API_ENDPOINTS = {
  users: '/api/users',
  userById: (id: string) => `/api/users/${id}`,
  resumes: '/api/resumes',
  resumeById: (id: string) => `/api/resumes/${id}`,
};

// ✗ INCORRECT - Inconsistent, unclear
const endpoints = {
  getUsers: '/users',
  user: (id: string) => `/get-user/${id}`,
  resumes_list: '/resumes',
};
```

---

## Git Workflow

### Branch Naming

```bash
# Feature branches
feature/add-resume-builder
feature/implement-job-matching

# Bug fixes
fix/login-redirect-issue
fix/resume-upload-validation

# Hotfixes
hotfix/critical-security-patch
hotfix/payment-processing-error

# Refactoring
refactor/update-auth-flow
refactor/optimize-api-calls

# Documentation
docs/update-api-documentation
docs/add-setup-guide

# Rebrand-specific
rebrand/update-logo-assets
rebrand/implement-new-color-system
```

### Commit Message Format

Follow Conventional Commits specification:

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `rebrand`: Rebrand-specific changes

**Examples:**

```bash
# Good commit messages
feat(auth): add OAuth2 login support
fix(resume): resolve PDF parsing error for special characters
docs(api): update authentication endpoint documentation
rebrand(ui): update primary color palette to ApplyforUs brand

# Bad commit messages
update stuff
fixed bug
changes
WIP
```

### Commit Message Examples

```bash
feat(dashboard): add job application analytics chart

- Implement Chart.js for data visualization
- Add weekly/monthly/yearly view toggles
- Include success rate metrics

Closes #123

---

fix(resume): prevent duplicate skill tags

Previously, users could add duplicate skills to their resume,
causing validation errors during submission. This change adds
client-side deduplication before saving.

Fixes #456

---

rebrand(typography): migrate to Inter font family

Replace all font references from Poppins to Inter across
the application. Update font weights and letter spacing
according to new brand guidelines.

Related to rebrand initiative
```

### Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Provide a brief description of the changes -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Rebrand update

## Related Issues
<!-- Link to related issues -->
Closes #
Related to #

## Changes Made
<!-- List the specific changes -->
-
-
-

## Screenshots
<!-- If applicable, add screenshots to demonstrate the changes -->

## Testing
<!-- Describe the tests you ran -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes
<!-- Any additional information -->
```

---

## Code Review Standards

### Review Checklist

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No console errors or warnings

**Code Quality:**
- [ ] Follows TypeScript best practices
- [ ] Consistent with existing codebase
- [ ] No code duplication
- [ ] Proper TypeScript types (no `any`)
- [ ] Comments explain why, not what

**Performance:**
- [ ] No unnecessary re-renders
- [ ] Proper use of useMemo/useCallback
- [ ] Images are optimized
- [ ] No memory leaks

**Accessibility:**
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible

**Testing:**
- [ ] Unit tests included
- [ ] Tests are meaningful
- [ ] Test coverage is adequate
- [ ] Tests pass in CI/CD

**Security:**
- [ ] No sensitive data exposed
- [ ] Input validation present
- [ ] XSS prevention in place
- [ ] CSRF protection where needed

**Brand Compliance:**
- [ ] Uses design tokens/CSS variables
- [ ] Follows typography guidelines
- [ ] Maintains color accessibility
- [ ] Uses approved component patterns

### Review Response Time

- **P0 (Critical):** 2 hours
- **P1 (High):** Same day
- **P2 (Medium):** 1-2 days
- **P3 (Low):** 3-5 days

### Approval Requirements

- **Minor changes:** 1 approval
- **Feature additions:** 2 approvals
- **Breaking changes:** 2 approvals + tech lead
- **Security changes:** 2 approvals + security review

---

## Testing Requirements

### Unit Tests

Use Vitest for unit testing:

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByText('Outline');
    expect(button).toHaveClass('border');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

### Integration Tests

```typescript
// Login.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits form with valid credentials', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

### Test Coverage Requirements

- **Unit Tests:** Minimum 80% coverage
- **Integration Tests:** All critical user flows
- **E2E Tests:** All primary user journeys

---

## Accessibility Guidelines

### WCAG 2.1 Level AA Compliance

All components must meet WCAG 2.1 Level AA standards.

### Semantic HTML

```tsx
// ✓ CORRECT
<nav>
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/resumes">Resumes</a></li>
  </ul>
</nav>

// ✗ INCORRECT
<div className="nav">
  <div className="nav-item">
    <div onClick={() => router.push('/dashboard')}>Dashboard</div>
  </div>
</div>
```

### ARIA Labels

```tsx
// ✓ CORRECT
<button aria-label="Close dialog">
  <XIcon />
</button>

<input
  type="search"
  placeholder="Search jobs"
  aria-label="Search jobs"
/>

// ✗ INCORRECT
<button>
  <XIcon />
</button>

<input type="search" placeholder="Search" />
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
// ✓ CORRECT
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>

// ✗ INCORRECT
<div onClick={handleClick}>
  Click me
</div>
```

### Color Contrast

Ensure minimum contrast ratios:
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

Use tools like WebAIM Contrast Checker to verify.

### Focus Indicators

```css
/* ✓ CORRECT */
.button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* ✗ INCORRECT */
.button:focus {
  outline: none;
}
```

### Screen Reader Support

```tsx
// ✓ CORRECT
<div role="status" aria-live="polite">
  {successMessage}
</div>

<nav aria-label="Main navigation">
  {/* navigation items */}
</nav>

// ✗ INCORRECT
<div className="success-message">
  {successMessage}
</div>

<div className="navigation">
  {/* navigation items */}
</div>
```

---

## Additional Resources

### Documentation Links

- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Radix UI:** https://www.radix-ui.com
- **Lucide Icons:** https://lucide.dev
- **React Hook Form:** https://react-hook-form.com
- **Zod:** https://zod.dev

### Internal Resources

- **Design System:** design.applyforus.com
- **Component Library:** storybook.applyforus.com
- **API Documentation:** api.applyforus.com/docs
- **Brand Guidelines:** brand.applyforus.com

### Support

- **Slack:** #frontend-team
- **Email:** dev-team@applyforus.com
- **Office Hours:** Tuesdays 2-3 PM EST

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Maintained By:** Engineering Team
