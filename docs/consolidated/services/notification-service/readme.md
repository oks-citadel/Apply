# Notification Service

The Notification Service is a NestJS-based microservice responsible for managing email notifications, push notifications, and user notification preferences for the Job Apply Platform.

## Features

- **Email Notifications**
  - Welcome emails
  - Email verification
  - Password reset
  - Application status updates
  - Weekly digest
  - Job alerts

- **Push Notifications** (Framework ready, integration pending)
  - Application updates
  - Job alerts
  - Messages

- **Notification Preferences**
  - Granular control over notification types
  - Email/Push/SMS preferences
  - Digest frequency settings
  - Quiet hours configuration
  - Timezone support

- **Queue Processing**
  - Bull queues with Redis for async email sending
  - Retry mechanism for failed emails
  - Job scheduling for digest emails

- **Email Templates**
  - Handlebars-based templating
  - Responsive HTML emails
  - Branded templates for all notification types

## Prerequisites

- Node.js 18+
- PostgreSQL (running on port 5434)
- Redis (for Bull queues)
- MailHog (for development email testing)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notification_service

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP (MailHog for dev)
SMTP_HOST=localhost
SMTP_PORT=1025
```

## Database Setup

Run migrations:

```bash
npm run migration:run
```

## Running the Service

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Notifications

- `GET /notifications` - List all notifications with filters
- `GET /notifications/:id` - Get notification by ID
- `GET /notifications/user/:userId` - Get user notifications
- `GET /notifications/user/:userId/unread-count` - Get unread count
- `POST /notifications` - Create notification
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/user/:userId/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `DELETE /notifications/cleanup/old` - Delete old notifications

### Email Notifications

- `POST /notifications/email` - Send email notification

### Push Notifications

- `POST /notifications/push` - Send push notification

### Preferences

- `GET /notifications/preferences/:userId` - Get user preferences
- `PUT /notifications/preferences/:userId` - Update preferences

## Email Templates

Templates are located in `src/templates/emails/`:

- `welcome.hbs` - Welcome email
- `verification.hbs` - Email verification
- `password-reset.hbs` - Password reset
- `application-status.hbs` - Application status update
- `weekly-digest.hbs` - Weekly summary

## Queue Processing

The service uses Bull queues for async processing:

### Email Queue
- `send-email` - Generic email sending
- `send-welcome-email` - Welcome email
- `send-verification-email` - Verification email
- `send-password-reset-email` - Password reset
- `send-application-status-email` - Application update
- `send-weekly-digest-email` - Weekly digest

### Notification Queue
- `create-notification` - Create in-app notification
- `send-push-notification` - Send push notification

## Testing with MailHog

MailHog catches all emails in development. Access at:
- Web UI: http://localhost:8025
- SMTP: localhost:1025

## Swagger Documentation

API documentation available at: http://localhost:8007/api/docs

## Health Check

Health endpoint: http://localhost:8007/health

## License

MIT
