# Payment Service - Quick Start Guide

Get the payment service up and running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose installed
- Stripe account (for payment processing)

## Step 1: Environment Setup

```bash
# Navigate to the service directory
cd services/payment-service

# Copy environment variables
cp .env.example .env
```

## Step 2: Configure Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers > API keys
3. Update `.env` with your keys:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Step 3: Start Dependencies

```bash
# Start PostgreSQL and RabbitMQ
docker-compose up -d postgres rabbitmq

# Wait for services to be healthy (about 30 seconds)
docker-compose ps
```

## Step 4: Install Dependencies

```bash
# Install with pnpm (recommended)
pnpm install

# Or with npm
npm install
```

## Step 5: Run Database Migrations

```bash
# Run migrations to create database schema
pnpm run migration:run
```

## Step 6: Start the Service

```bash
# Development mode with hot reload
pnpm run start:dev
```

## Step 7: Verify Installation

Open your browser and navigate to:

- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health
- **Database Admin**: http://localhost:5050 (PgAdmin)
- **RabbitMQ Management**: http://localhost:15672

## Quick API Test

### Create a Checkout Session

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/checkout-session \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{
    "userId": "user-123",
    "userEmail": "user@example.com",
    "tier": "BASIC",
    "billingPeriod": "monthly",
    "successUrl": "http://localhost:3001/success",
    "cancelUrl": "http://localhost:3001/cancel"
  }'
```

### Check User Subscription

```bash
curl -X GET http://localhost:3000/api/v1/subscriptions/user/user-123 \
  -H "X-API-Key: your-secret-api-key-here"
```

### Get Subscription Limits

```bash
curl -X GET http://localhost:3000/api/v1/subscriptions/user/user-123/limits \
  -H "X-API-Key: your-secret-api-key-here"
```

## Configure Stripe Webhooks

For local development with Stripe webhooks:

### Option 1: Stripe CLI (Recommended)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local service
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook

# Copy the webhook signing secret to .env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Option 2: ngrok (Alternative)

```bash
# Install ngrok
# https://ngrok.com/

# Create tunnel
ngrok http 3000

# Add webhook endpoint in Stripe Dashboard
# https://dashboard.stripe.com/webhooks
# URL: https://your-ngrok-url.ngrok.io/api/v1/stripe/webhook

# Copy webhook signing secret to .env
```

## Subscription Tiers Reference

| Tier | Price | Job Applications | AI Cover Letters | Resume Templates |
|------|-------|-----------------|------------------|------------------|
| FREE | $0 | 10/month | 3 | 2 |
| BASIC | $9.99/month | 50/month | 20 | 10 |
| PRO | $29.99/month | 200/month | 100 | Unlimited |
| ENTERPRISE | $99.99/month | Unlimited | Unlimited | Unlimited |

## Common Commands

```bash
# Development
pnpm run start:dev          # Start with hot reload
pnpm run start:debug        # Start with debugger

# Building
pnpm run build              # Build for production

# Testing
pnpm run test               # Run unit tests
pnpm run test:e2e           # Run e2e tests
pnpm run test:cov           # Test coverage

# Database
pnpm run migration:generate -- src/migrations/MigrationName
pnpm run migration:run      # Run migrations
pnpm run migration:revert   # Revert last migration

# Code Quality
pnpm run lint               # Lint code
pnpm run format             # Format code

# Docker
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process or change PORT in .env
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres
```

### RabbitMQ Connection Issues
```bash
# Check if RabbitMQ is running
docker-compose ps rabbitmq

# View logs
docker-compose logs rabbitmq
```

### Stripe Webhook Issues
- Ensure webhook secret is correct in `.env`
- Check Stripe CLI is running: `stripe listen`
- Verify webhook endpoint in Stripe Dashboard

## Next Steps

1. **Integration**: Integrate with other microservices
2. **Authentication**: Add JWT authentication middleware
3. **Monitoring**: Set up logging aggregation
4. **Testing**: Write comprehensive tests
5. **Deployment**: Deploy to Kubernetes

## Support

- **Documentation**: See README.md for detailed documentation
- **API Docs**: http://localhost:3000/api/docs
- **Stripe Docs**: https://stripe.com/docs

Happy coding!
