# JobPilot Employer Portal

A modern, production-ready employer portal built with Next.js 14 for managing job postings, applications, and hiring workflows.

## Features

- **Dashboard**: Real-time hiring metrics and insights
- **Job Management**: Create, edit, and manage job postings
- **Application Tracking**: Review and manage candidate applications
- **Candidate Search**: Browse and connect with talented professionals
- **Analytics**: Track recruitment performance and metrics
- **Company Profile**: Manage company information and branding
- **Billing**: Subscription and payment management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL and other configs
```

### Development

```bash
# Run development server
pnpm dev

# The app will be available at http://localhost:3002
```

### Build

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

### Docker

```bash
# Build Docker image
docker build -t employer-portal .

# Run container
docker run -p 3002:3002 employer-portal
```

## Project Structure

```
apps/employer/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/            # Auth group routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── jobs/              # Job management
│   │   ├── candidates/        # Candidate search
│   │   ├── company/           # Company settings
│   │   ├── billing/           # Subscription & billing
│   │   ├── analytics/         # Hiring analytics
│   │   └── page.tsx           # Dashboard
│   ├── components/            # React components
│   │   ├── layout/            # Layout components
│   │   ├── jobs/              # Job-related components
│   │   ├── candidates/        # Candidate components
│   │   └── applications/      # Application components
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # API client
│   │   └── utils.ts          # Helper functions
│   ├── stores/               # Zustand stores
│   │   ├── auth.store.ts
│   │   └── jobs.store.ts
│   └── types/                # TypeScript types
├── public/                   # Static assets
├── Dockerfile               # Docker configuration
├── next.config.js          # Next.js config
├── tailwind.config.js      # Tailwind config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Stripe (for billing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Key Features

### Authentication
- Employer login and registration
- JWT token-based authentication
- Protected routes with authentication guards

### Job Management
- Create and publish job postings
- Edit job details and requirements
- Track applications and views
- Close or reopen positions

### Application Tracking
- Review candidate applications
- Filter by status (pending, reviewing, shortlisted, rejected)
- Bulk actions for managing applications
- Download resumes and view candidate profiles

### Candidate Search
- Search candidates by skills, location, experience
- View detailed candidate profiles
- Contact candidates directly

### Analytics
- Application trends over time
- Job performance metrics
- Application status distribution
- Hiring insights and recommendations

### Billing & Subscriptions
- Multiple subscription tiers
- Secure payment processing with Stripe
- Invoice history and downloads
- Payment method management

## API Integration

The portal integrates with the backend API for:
- Authentication and authorization
- Job CRUD operations
- Application management
- Candidate data
- Analytics and reporting
- Subscription management

See `src/lib/api.ts` for all available API endpoints.

## State Management

- **Zustand**: Global state for auth and jobs
- **React Query**: Server state and caching
- Local component state where appropriate

## Performance Optimizations

- Image optimization with Next.js Image
- Code splitting and lazy loading
- Bundle size optimization
- CSS optimization with Tailwind
- Caching with React Query

## Security

- HTTPS enforcement
- Security headers configured
- XSS protection
- CSRF protection
- Input validation and sanitization

## License

Proprietary - JobPilot Platform
