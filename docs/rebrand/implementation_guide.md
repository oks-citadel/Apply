# ApplyforUs Rebrand Implementation Guide

Version 1.0 | Last Updated: December 2025

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Environment Setup](#phase-1-environment-setup)
4. [Phase 2: Dependency Updates](#phase-2-dependency-updates)
5. [Phase 3: Configuration Changes](#phase-3-configuration-changes)
6. [Phase 4: Component Updates](#phase-4-component-updates)
7. [Phase 5: Testing Procedures](#phase-5-testing-procedures)
8. [Phase 6: Deployment Steps](#phase-6-deployment-steps)
9. [Phase 7: Verification Checklist](#phase-7-verification-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides step-by-step instructions for implementing the ApplyforUs rebrand across all platform components. Follow these instructions sequentially to ensure a smooth transition.

### Implementation Timeline

| Phase | Duration | Effort Level |
|-------|----------|--------------|
| Environment Setup | 1 hour | Low |
| Dependency Updates | 2 hours | Low |
| Configuration Changes | 3 hours | Medium |
| Component Updates | 8-16 hours | High |
| Testing | 8 hours | Medium |
| Deployment | 4 hours | Medium |
| Verification | 2 hours | Low |
| **Total** | **28-36 hours** | **Medium-High** |

### Team Requirements

- **Frontend Developer:** Required
- **Backend Developer:** Optional (minimal backend changes)
- **DevOps Engineer:** Required for deployment
- **QA Engineer:** Required for testing
- **Designer:** Optional (for design verification)

---

## Prerequisites

### Required Tools

```bash
# Node.js and Package Manager
node --version    # v20.0.0 or higher
pnpm --version    # v8.0.0 or higher

# Git
git --version     # v2.30.0 or higher

# Docker (for local development)
docker --version  # v20.10.0 or higher

# Kubernetes CLI (for deployment)
kubectl version   # v1.28.0 or higher
```

### Access Requirements

- [ ] GitHub repository access (write permissions)
- [ ] Development environment credentials
- [ ] Staging environment credentials
- [ ] Production environment credentials (for final deployment)
- [ ] Docker registry access
- [ ] Kubernetes cluster access
- [ ] DNS management access (if changing domains)

### Knowledge Requirements

- Understanding of Next.js and React
- Familiarity with Tailwind CSS
- Basic TypeScript knowledge
- Understanding of CSS custom properties
- Basic Kubernetes knowledge (for deployment)

### Backup Strategy

**Before starting, create backups:**

```bash
# 1. Create a backup branch
git checkout -b backup/pre-rebrand-$(date +%Y%m%d)
git push origin backup/pre-rebrand-$(date +%Y%m%d)

# 2. Tag current production state
git tag -a v1.0.0-pre-rebrand -m "Pre-rebrand production state"
git push origin v1.0.0-pre-rebrand

# 3. Export database (if applicable)
# Run appropriate backup commands for your database

# 4. Document current environment variables
kubectl get configmap -n production -o yaml > backup/configmaps.yaml
kubectl get secret -n production -o yaml > backup/secrets.yaml
```

---

## Phase 1: Environment Setup

### Step 1.1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd Job-Apply-Platform

# Or update existing clone
git fetch origin
git checkout develop
git pull origin develop
```

### Step 1.2: Create Feature Branch

```bash
# Create rebrand branch from develop
git checkout -b rebrand/applyforus-implementation

# Verify you're on the correct branch
git branch --show-current
# Should output: rebrand/applyforus-implementation
```

### Step 1.3: Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### Step 1.4: Environment Variables

```bash
# Copy environment example files
cp .env.example .env

# Update .env with new values
# Edit .env and update:
```

**.env Changes Required:**

```bash
# Old Values
NEXT_PUBLIC_APP_NAME=JobPilot
NEXT_PUBLIC_APP_DESCRIPTION=AI-powered job application automation platform

# New Values
NEXT_PUBLIC_APP_NAME=ApplyforUs
NEXT_PUBLIC_APP_DESCRIPTION=Apply smarter, not harder
NEXT_PUBLIC_APP_TAGLINE=Intelligent job application automation
```

### Step 1.5: Start Development Environment

```bash
# Start infrastructure services
pnpm docker:up

# Wait for services to be ready (30-60 seconds)
docker-compose ps

# Start development servers
pnpm dev
```

**Verify Services Running:**

```bash
# Check all services are healthy
curl http://localhost:3000/api/health        # Web app
curl http://localhost:8001/health            # Auth service
curl http://localhost:8002/health            # User service
# ... check other services
```

---

## Phase 2: Dependency Updates

### Step 2.1: Update Package Dependencies

**No new dependencies required** for the rebrand, but ensure all packages are up to date:

```bash
# Check for outdated packages
pnpm outdated

# Update dependencies (optional, but recommended)
pnpm update --latest

# Rebuild after updates
pnpm build
```

### Step 2.2: Add Font Dependencies

Update `apps/web/src/app/layout.tsx` to include Inter font:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Step 2.3: Verify Dependencies

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Fix any auto-fixable issues
pnpm lint --fix
```

---

## Phase 3: Configuration Changes

### Step 3.1: Update Tailwind Configuration

**File:** `apps/web/tailwind.config.ts`

Replace the entire configuration with:

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
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

**Repeat for:**
- `apps/admin/tailwind.config.js`
- `apps/extension/tailwind.config.js`

### Step 3.2: Update Global CSS

**File:** `apps/web/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### Step 3.3: Update Metadata

**File:** `apps/web/src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'ApplyforUs - Apply Smarter, Not Harder',
    template: '%s | ApplyforUs',
  },
  description: 'Intelligent job application automation that saves time and improves quality. Let AI handle the busywork while you focus on finding the right opportunity.',
  keywords: [
    'job application',
    'automation',
    'AI',
    'resume',
    'career',
    'job search',
    'apply',
  ],
  authors: [{ name: 'ApplyforUs' }],
  creator: 'ApplyforUs',
  publisher: 'ApplyforUs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://applyforus.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://applyforus.com',
    title: 'ApplyforUs - Apply Smarter, Not Harder',
    description: 'Intelligent job application automation',
    siteName: 'ApplyforUs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApplyforUs - Apply Smarter, Not Harder',
    description: 'Intelligent job application automation',
    creator: '@applyforus',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

### Step 3.4: Update Package.json

**File:** `package.json` (root)

```json
{
  "name": "applyforus-platform",
  "version": "1.0.0",
  "description": "ApplyforUs - Intelligent job application automation platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  // ... rest of configuration
}
```

**Repeat for:**
- `apps/web/package.json`
- `apps/admin/package.json`
- `apps/extension/package.json`

---

## Phase 4: Component Updates

### Step 4.1: Update Logo Assets

**Create brand directory structure:**

```bash
mkdir -p public/brand/logo
mkdir -p public/brand/icons
```

**Add logo files to:**
- `public/brand/logo/applyforus-logo-horizontal.svg`
- `public/brand/logo/applyforus-logo-vertical.svg`
- `public/brand/logo/applyforus-icon.svg`
- `public/brand/logo/applyforus-logo-white.svg`
- `public/brand/logo/applyforus-logo-black.svg`

**Update favicon:**
```bash
# Replace files in public/
cp brand/icons/favicon.ico public/favicon.ico
cp brand/icons/icon-*.png public/
```

### Step 4.2: Create Logo Component

**File:** `apps/web/src/components/ui/Logo.tsx`

```typescript
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';
  theme?: 'light' | 'dark';
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({
  variant = 'horizontal',
  theme = 'light',
  width,
  height,
  className = '',
}: LogoProps) {
  const getLogoSrc = () => {
    if (variant === 'icon') {
      return '/brand/logo/applyforus-icon.svg';
    }
    if (theme === 'dark') {
      return '/brand/logo/applyforus-logo-white.svg';
    }
    return `/brand/logo/applyforus-logo-${variant}.svg`;
  };

  const defaultWidth = variant === 'icon' ? 40 : 160;
  const defaultHeight = variant === 'icon' ? 40 : 40;

  return (
    <Link href="/" className={className}>
      <Image
        src={getLogoSrc()}
        alt="ApplyforUs"
        width={width || defaultWidth}
        height={height || defaultHeight}
        priority
      />
    </Link>
  );
}
```

### Step 4.3: Update Header Component

**File:** `apps/web/src/components/layouts/Header.tsx`

```typescript
import { Logo } from '@/components/ui/Logo';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo variant="horizontal" />
        {/* Rest of header content */}
      </div>
    </header>
  );
}
```

### Step 4.4: Update Footer Component

**File:** `apps/web/src/components/layouts/Footer.tsx`

```typescript
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1">
            <Logo variant="vertical" />
            <p className="mt-4 text-body-sm text-muted-foreground">
              Apply smarter, not harder.
            </p>
          </div>
          {/* Rest of footer content */}
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-body-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ApplyforUs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

### Step 4.5: Update UI Components

**Search and replace in all component files:**

```bash
# Find hardcoded color values
grep -r "bg-blue-500" apps/web/src/components/
grep -r "#2563EB" apps/web/src/components/

# Replace with CSS variables
# Old: className="bg-blue-500"
# New: className="bg-primary"

# Old: style={{ color: '#2563EB' }}
# New: className="text-primary"
```

**Update Button component** to use new variants:

**File:** `apps/web/src/components/ui/Button.tsx`

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
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
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

### Step 4.6: Update Typography

**Search for hardcoded heading classes and replace with semantic classes:**

```typescript
// Old
<h1 className="text-4xl font-bold">Title</h1>

// New
<h1 className="text-h1">Title</h1>
```

**Common replacements:**
- `text-4xl font-bold` → `text-h1`
- `text-3xl font-bold` → `text-h2`
- `text-2xl font-semibold` → `text-h3`
- `text-xl font-semibold` → `text-h4`
- `text-lg font-semibold` → `text-h5`
- `text-base` → `text-body`
- `text-sm` → `text-body-sm`
- `text-xs` → `text-caption`

---

## Phase 5: Testing Procedures

### Step 5.1: Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run with coverage
pnpm test:unit --coverage

# Fix failing tests related to branding
# Update snapshots if needed
pnpm test:unit -u
```

### Step 5.2: Component Testing

```bash
# Start Storybook (if configured)
pnpm storybook

# Visual regression testing
# Compare components against design specs
```

**Manual verification checklist:**

- [ ] Logo renders correctly in all variants
- [ ] Colors match brand guidelines
- [ ] Typography is consistent
- [ ] Buttons have correct styles
- [ ] Cards render properly
- [ ] Forms are styled correctly
- [ ] Dark mode works

### Step 5.3: Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Test critical user flows:
# - Login/Registration
# - Resume upload
# - Job application
# - Profile management
```

### Step 5.4: End-to-End Tests

```bash
# Run E2E tests
pnpm test:e2e

# Or with UI
pnpm test:e2e:ui

# Test complete user journeys
```

### Step 5.5: Accessibility Testing

```bash
# Install axe-core (if not already installed)
pnpm add -D @axe-core/playwright

# Run accessibility tests
pnpm test:a11y
```

**Manual accessibility checks:**

```bash
# Check color contrast
# Use: https://webaim.org/resources/contrastchecker/

# Keyboard navigation
# Tab through all interactive elements

# Screen reader testing
# Test with NVDA (Windows) or VoiceOver (Mac)
```

### Step 5.6: Cross-Browser Testing

**Test in:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test on devices:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Step 5.7: Performance Testing

```bash
# Build for production
pnpm build

# Analyze bundle
pnpm analyze

# Check bundle size
# Ensure no significant increases
```

**Lighthouse audit:**

```bash
# Run Lighthouse
pnpm lighthouse

# Target scores:
# - Performance: 90+
# - Accessibility: 100
# - Best Practices: 100
# - SEO: 100
```

---

## Phase 6: Deployment Steps

### Step 6.1: Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables updated
- [ ] Database migrations prepared (if any)
- [ ] Rollback plan documented
- [ ] Stakeholders notified

### Step 6.2: Build for Production

```bash
# Clean build
pnpm clean
pnpm build

# Verify build succeeded
ls -la apps/web/.next
ls -la apps/admin/.next
```

### Step 6.3: Docker Build

```bash
# Build Docker images
docker build -t applyforus-web:latest -f apps/web/Dockerfile .
docker build -t applyforus-admin:latest -f apps/admin/Dockerfile .

# Tag for registry
docker tag applyforus-web:latest your-registry/applyforus-web:1.0.0
docker tag applyforus-admin:latest your-registry/applyforus-admin:1.0.0

# Push to registry
docker push your-registry/applyforus-web:1.0.0
docker push your-registry/applyforus-admin:1.0.0
```

### Step 6.4: Deploy to Development

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/ -n development

# Wait for rollout
kubectl rollout status deployment/applyforus-web -n development

# Verify pods are running
kubectl get pods -n development

# Check logs
kubectl logs -f deployment/applyforus-web -n development
```

### Step 6.5: Deploy to Staging

```bash
# Update staging environment
kubectl apply -f infrastructure/kubernetes/ -n staging

# Wait for rollout
kubectl rollout status deployment/applyforus-web -n staging

# Run smoke tests
pnpm test:smoke --env=staging
```

### Step 6.6: Deploy to Production

**Production deployment requires approval.**

```bash
# Create deployment tag
git tag -a v1.0.0-rebrand -m "ApplyforUs rebrand production release"
git push origin v1.0.0-rebrand

# Deploy to production
kubectl apply -f infrastructure/kubernetes/ -n production

# Monitor rollout
kubectl rollout status deployment/applyforus-web -n production

# If issues occur, rollback:
kubectl rollout undo deployment/applyforus-web -n production
```

### Step 6.7: DNS Updates (if applicable)

**If changing domain from jobpilot.com to applyforus.com:**

```bash
# 1. Add new DNS records
# 2. Verify DNS propagation
dig applyforus.com

# 3. Update SSL certificates
# 4. Configure redirects from old domain
```

---

## Phase 7: Verification Checklist

### Step 7.1: Visual Verification

**Homepage:**
- [ ] Logo displays correctly
- [ ] Colors match brand guidelines
- [ ] Typography is correct
- [ ] Hero section renders properly
- [ ] CTAs are visible and styled correctly

**Dashboard:**
- [ ] Header shows correct branding
- [ ] Sidebar navigation styled correctly
- [ ] Cards use new color palette
- [ ] Charts/graphs use brand colors

**Forms:**
- [ ] Input fields styled correctly
- [ ] Buttons use correct variants
- [ ] Validation messages visible
- [ ] Success states use success color

### Step 7.2: Functional Verification

- [ ] User registration works
- [ ] Login/logout works
- [ ] Resume upload works
- [ ] Job search works
- [ ] Application submission works
- [ ] Profile editing works
- [ ] Settings save correctly

### Step 7.3: Email Verification

**Send test emails:**

```bash
# Trigger welcome email
# Trigger application confirmation
# Trigger password reset
# Trigger weekly digest
```

**Verify:**
- [ ] Logo in emails is correct
- [ ] Colors match brand
- [ ] Links work correctly
- [ ] Unsubscribe works

### Step 7.4: Mobile Verification

**Test on mobile devices:**
- [ ] Logo is legible
- [ ] Navigation works
- [ ] Forms are usable
- [ ] Touch targets are adequate
- [ ] Performance is acceptable

### Step 7.5: Performance Verification

```bash
# Run Lighthouse audit
pnpm lighthouse

# Check Core Web Vitals
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
```

### Step 7.6: Analytics Verification

- [ ] Google Analytics tracking works
- [ ] Events fire correctly
- [ ] Conversion tracking works
- [ ] Custom dimensions updated

### Step 7.7: SEO Verification

- [ ] Meta tags updated
- [ ] Open Graph tags correct
- [ ] Twitter Cards work
- [ ] Structured data valid
- [ ] Sitemap updated
- [ ] robots.txt correct

---

## Troubleshooting

### Common Issues

#### Issue: Styles Not Applying

**Symptoms:** Components show old colors or styles

**Solutions:**

```bash
# 1. Clear Next.js cache
rm -rf apps/web/.next
pnpm build

# 2. Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# 3. Check CSS variable definitions
# Verify globals.css has correct values

# 4. Rebuild Tailwind
npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css
```

#### Issue: Logo Not Displaying

**Symptoms:** Broken image icon or 404 error

**Solutions:**

```bash
# 1. Verify file exists
ls -la public/brand/logo/

# 2. Check file path in component
# Ensure path starts with /brand/

# 3. Restart dev server
pnpm dev

# 4. Check Next.js image configuration
# Verify next.config.js images settings
```

#### Issue: Fonts Not Loading

**Symptoms:** System fonts display instead of Inter

**Solutions:**

```typescript
// 1. Verify font import in layout.tsx
import { Inter } from 'next/font/google';

// 2. Check font is applied to body
<body className={inter.className}>

// 3. Verify Tailwind config
fontFamily: {
  sans: ['var(--font-inter)', 'system-ui'],
}

// 4. Clear font cache
rm -rf .next/cache
```

#### Issue: Dark Mode Not Working

**Symptoms:** Dark mode colors don't apply

**Solutions:**

```css
/* 1. Verify .dark class in globals.css */
.dark {
  --background: 222.2 84% 4.9%;
  /* ... other dark mode variables */
}

/* 2. Check darkMode config in tailwind.config.ts */
darkMode: ['class'],

/* 3. Verify theme toggle logic */
// Ensure it adds/removes 'dark' class to <html>
```

#### Issue: Build Fails

**Symptoms:** TypeScript errors or build errors

**Solutions:**

```bash
# 1. Check for type errors
pnpm type-check

# 2. Ensure all imports are correct
# Update any renamed/moved files

# 3. Clear build cache
rm -rf .next
rm -rf node_modules/.cache

# 4. Reinstall dependencies
rm -rf node_modules
pnpm install

# 5. Check for missing dependencies
pnpm install missing-package
```

#### Issue: Deployment Fails

**Symptoms:** Kubernetes pods crash or fail to start

**Solutions:**

```bash
# 1. Check pod logs
kubectl logs <pod-name> -n production

# 2. Verify environment variables
kubectl get configmap -n production
kubectl get secret -n production

# 3. Check resource limits
kubectl describe pod <pod-name> -n production

# 4. Verify image was pushed
docker pull your-registry/applyforus-web:1.0.0

# 5. Rollback if needed
kubectl rollout undo deployment/applyforus-web -n production
```

### Getting Help

**Documentation:**
- Brand Guidelines: `docs/rebrand/full_brand_guidelines.md`
- Developer Handoff: `docs/rebrand/developer_handoff.md`
- Changelog: `docs/rebrand/rebrand_changelog.md`

**Support Channels:**
- **Slack:** #rebrand-2025
- **Email:** dev-team@applyforus.com
- **GitHub Issues:** Use `rebrand` label

**Emergency Contacts:**
- **Tech Lead:** [Name] - [Email] - [Phone]
- **DevOps Lead:** [Name] - [Email] - [Phone]
- **On-Call:** [PagerDuty/On-Call System]

---

## Post-Implementation

### Step 8.1: Monitoring

**Set up alerts for:**
- Error rate increases
- Performance degradation
- Failed deployments
- User feedback

**Monitor for 7 days:**
- Application metrics
- User analytics
- Error logs
- Performance metrics

### Step 8.2: User Communication

**Announce rebrand:**
- [ ] Blog post
- [ ] Email to users
- [ ] Social media posts
- [ ] In-app notification

### Step 8.3: Documentation Updates

- [ ] Update README
- [ ] Update wiki
- [ ] Update API docs
- [ ] Update Storybook

### Step 8.4: Retrospective

**Schedule team retrospective:**
- What went well?
- What could be improved?
- Lessons learned
- Process improvements

---

## Success Criteria

### Technical Metrics

- [ ] Zero downtime during deployment
- [ ] No performance regression (< 5% slower)
- [ ] All tests passing (100%)
- [ ] Lighthouse scores maintained (90+)
- [ ] No critical bugs reported (0)

### Brand Metrics

- [ ] All components use new branding
- [ ] Color palette implemented correctly
- [ ] Typography consistent across platform
- [ ] Logo displays in all contexts
- [ ] Accessibility maintained (WCAG AA)

### User Metrics

- [ ] User satisfaction maintained or improved
- [ ] No increase in support tickets
- [ ] Positive brand perception
- [ ] Increased engagement (target: +10%)

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Maintained By:** Engineering Team

**Next Steps:**
After completing implementation, proceed to:
1. Deployment Guide (`deployment_guide.md`)
2. Security Checklist (`security_checklist.md`)
3. Monitoring Setup (`monitoring_setup.md`)
