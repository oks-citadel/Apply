# Payment Service

A comprehensive payment and subscription management microservice built with NestJS and Stripe integration.

## Features

- **Stripe Integration**: Full Stripe SDK integration for payment processing
- **Subscription Management**: Support for FREE, BASIC, PRO, and ENTERPRISE tiers
- **Webhook Handlers**: Automated handling of Stripe webhook events
- **Invoice Management**: Complete invoice lifecycle management
- **Event-Driven Architecture**: RabbitMQ integration for event publishing
- **Database**: PostgreSQL with TypeORM
- **API Documentation**: Swagger/OpenAPI documentation
- **Health Checks**: Kubernetes-ready health endpoints
- **Logging**: Winston-based structured logging

## Subscription Tiers

### FREE
- 10 job applications per month
- 3 AI-generated cover letters
- 2 resume templates
- 20 saved jobs

### BASIC ($9.99/month or $99.99/year)
- 50 job applications per month
- 20 AI-generated cover letters
- 10 resume templates
- 100 saved jobs
- Email alerts

### PRO ($29.99/month or $299.99/year)
- 200 job applications per month
- 100 AI-generated cover letters
- Unlimited resume templates
- 500 saved jobs
- Email alerts
- Priority support
- Advanced analytics

### ENTERPRISE ($99.99/month or $999.99/year)
- Unlimited job applications
- Unlimited AI-generated cover letters
- Unlimited resume templates
- Unlimited saved jobs
- Email alerts
- Priority support
- Advanced analytics
- Custom branding

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- RabbitMQ 3.12+
- Stripe Account

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
SERVICE_NAME=payment-service

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=payment_service

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# API Key
API_KEY_SECRET=your-secret-api-key-here
```

## Running the Service

### Development
```bash
pnpm run start:dev
```

### Production
```bash
# Build
pnpm run build

# Start
pnpm run start:prod
```

### Docker
```bash
# Build image
docker build -t payment-service .

# Run container
docker run -p 3000:3000 --env-file .env payment-service
```

## API Documentation

Once the service is running, access the Swagger documentation at:
```
http://localhost:3000/api/docs
```

## API Endpoints

### Subscriptions
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions` - List all subscriptions
- `GET /api/v1/subscriptions/:id` - Get subscription by ID
- `GET /api/v1/subscriptions/user/:userId` - Get user subscription
- `PATCH /api/v1/subscriptions/:id` - Update subscription
- `POST /api/v1/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/v1/subscriptions/:id/reactivate` - Reactivate subscription
- `POST /api/v1/subscriptions/:id/upgrade` - Upgrade subscription
- `POST /api/v1/subscriptions/checkout-session` - Create checkout session
- `POST /api/v1/subscriptions/:id/billing-portal` - Create billing portal session

### Invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices` - List all invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID
- `GET /api/v1/invoices/subscription/:subscriptionId` - Get subscription invoices
- `GET /api/v1/invoices/customer/:customerId` - Get customer invoices
- `PATCH /api/v1/invoices/:id` - Update invoice
- `POST /api/v1/invoices/:id/mark-paid` - Mark invoice as paid
- `POST /api/v1/invoices/:id/mark-void` - Mark invoice as void

### Stripe Webhooks
- `POST /api/v1/stripe/webhook` - Handle Stripe webhook events

### Health
- `GET /api/v1/health` - Comprehensive health check
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

## Stripe Webhook Events

The service handles the following Stripe webhook events:

- `checkout.session.completed` - When a checkout session is successfully completed
- `customer.subscription.created` - When a new subscription is created
- `customer.subscription.updated` - When a subscription is updated
- `customer.subscription.deleted` - When a subscription is canceled
- `invoice.paid` - When an invoice is paid
- `invoice.payment_failed` - When an invoice payment fails
- `invoice.created` - When a new invoice is created

## Database Migrations

```bash
# Generate migration
pnpm run migration:generate -- src/migrations/MigrationName

# Run migrations
pnpm run migration:run

# Revert migration
pnpm run migration:revert
```

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Event Publishing

The service publishes events to RabbitMQ for inter-service communication:

### Subscription Events
- `subscription.created`
- `subscription.tier.changed`
- `subscription.status.changed`
- `subscription.canceled`
- `subscription.reactivated`
- `subscription.downgraded`

### Invoice Events
- `invoice.created`
- `invoice.status.changed`
- `invoice.paid`
- `invoice.voided`

## Architecture

```
payment-service/
├── src/
│   ├── common/
│   │   ├── config/          # Configuration files
│   │   ├── enums/           # Enums (tiers, statuses)
│   │   ├── guards/          # API key guard
│   │   ├── interceptors/    # Logging interceptor
│   │   └── logging/         # Logging service
│   ├── modules/
│   │   ├── stripe/          # Stripe integration
│   │   ├── subscriptions/   # Subscription management
│   │   └── invoices/        # Invoice management
│   ├── health/              # Health check module
│   ├── app.module.ts        # Root module
│   └── main.ts              # Bootstrap
├── Dockerfile               # Multi-stage Docker build
├── package.json
└── tsconfig.json
```

## Security

- API Key authentication for inter-service communication
- Stripe webhook signature verification
- Input validation with class-validator
- SQL injection protection with TypeORM
- Environment variable validation

## Monitoring

- Structured logging with Winston
- Health check endpoints for Kubernetes
- Request/response logging
- Event tracking

## License

MIT
