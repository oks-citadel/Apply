# Changelog

All notable changes to the Payment Service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### Added
- Initial release of Payment Service
- Stripe SDK integration for payment processing
- Subscription management with four tiers (FREE, BASIC, PRO, ENTERPRISE)
- Stripe webhook handlers for:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.paid
  - invoice.payment_failed
  - invoice.created
- Invoice management system
- RabbitMQ integration for event publishing
- PostgreSQL database with TypeORM
- Swagger/OpenAPI documentation
- Health check endpoints (readiness, liveness)
- Winston-based structured logging
- API key authentication for inter-service communication
- Docker support with multi-stage builds
- Docker Compose for local development
- Comprehensive README documentation
- TypeScript support with strict typing
- ESLint and Prettier configuration
- Unit test examples

### Features
- Create and manage subscriptions
- Handle subscription lifecycle (create, update, cancel, reactivate, upgrade)
- Stripe checkout session creation
- Stripe billing portal session creation
- Usage limit checking
- Feature access validation
- Invoice tracking and management
- Event-driven architecture with RabbitMQ
- Automatic webhook processing
- Subscription tier limits enforcement

### Security
- API key authentication
- Stripe webhook signature verification
- Input validation with class-validator
- SQL injection protection with TypeORM
- Environment variable validation

### Development
- Hot reload support
- Debug configuration
- Migration system with TypeORM
- Docker Compose for dependencies
- PgAdmin for database management
- RabbitMQ Management UI
