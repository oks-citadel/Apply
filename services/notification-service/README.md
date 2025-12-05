# Notification Service

A comprehensive notification microservice built with NestJS for the Job Apply Platform. Handles email notifications, push notifications, and in-app notifications.

## Features

- Email notifications with Nodemailer
- Push notifications (placeholder for future implementation)
- In-app notifications
- Notification history tracking
- TypeORM with PostgreSQL
- Swagger API documentation
- Template-based emails
- Notification status tracking (pending, sent, failed, read)

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL
- Nodemailer
- Swagger/OpenAPI

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- SMTP server credentials (Gmail, SendGrid, etc.)

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=8007
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notification_service

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@jobapply.com
EMAIL_FROM_NAME=Job Apply Platform

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Gmail Configuration

To use Gmail as your SMTP provider:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
3. Use the generated password as `SMTP_PASSWORD`

## Database Setup

```bash
# Create database
createdb notification_service

# Run the application (TypeORM will auto-create tables in development)
npm run start:dev
```

## Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The service will be available at:
- API: http://localhost:8007
- Swagger Docs: http://localhost:8007/api/docs

## API Endpoints

### Email Notifications

```bash
# Send email notification
POST /notifications/email
Body: {
  "to": "user@example.com",
  "subject": "Test Email",
  "body": "<h1>Hello</h1>",
  "userId": "user-id-123"
}

# Send verification email
POST /notifications/email
Body: {
  "to": "user@example.com",
  "subject": "Verify Email",
  "template": "verification",
  "templateData": {
    "name": "John",
    "verificationToken": "abc123"
  }
}
```

### Push Notifications

```bash
# Send push notification
POST /notifications/push
Body: {
  "userId": "user-id-123",
  "title": "New Message",
  "message": "You have a new message",
  "actionUrl": "/messages/123"
}
```

### Notification Management

```bash
# Get all notifications
GET /notifications?userId=user-id-123&status=sent&page=1&limit=20

# Get user notifications
GET /notifications/user/:userId?limit=50

# Get unread count
GET /notifications/user/:userId/unread-count

# Get notification by ID
GET /notifications/:id

# Mark as read
PUT /notifications/:id/read

# Mark all as read
PUT /notifications/user/:userId/read-all

# Delete notification
DELETE /notifications/:id

# Delete old notifications
DELETE /notifications/cleanup/old?days=30
```

## Email Templates

The service includes pre-built email templates:

### 1. Verification Email
```typescript
await emailService.sendVerificationEmail(
  'user@example.com',
  'John Doe',
  'verification-token-123'
);
```

### 2. Password Reset Email
```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'reset-token-123'
);
```

### 3. Application Status Email
```typescript
await emailService.sendApplicationStatusEmail(
  'user@example.com',
  'John Doe',
  'Senior Developer',
  'Tech Corp',
  'interviewing',
  'Your interview is scheduled for next week.'
);
```

### 4. Job Alert Email
```typescript
await emailService.sendJobAlertEmail(
  'user@example.com',
  'John Doe',
  [
    {
      title: 'Senior Developer',
      company: 'Tech Corp',
      location: 'Remote',
      salary: '$120k - $150k',
      url: 'http://localhost:3000/jobs/123'
    }
  ]
);
```

## Notification Entity Schema

```typescript
{
  id: string (UUID)
  userId: string
  type: 'email' | 'push' | 'sms' | 'in_app'
  status: 'pending' | 'sent' | 'failed' | 'read'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  data: object
  category: string
  actionUrl: string
  isRead: boolean
  readAt: Date
  sentAt: Date
  failedReason: string
  retryCount: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker Support

```bash
# Build Docker image
docker build -t notification-service .

# Run with Docker Compose
docker-compose up -d
```

## Project Structure

```
src/
├── main.ts                           # Application entry point
├── app.module.ts                     # Root module
├── modules/
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── dto/
│   │   │   ├── send-email.dto.ts
│   │   │   ├── send-push.dto.ts
│   │   │   ├── create-notification.dto.ts
│   │   │   └── query-notifications.dto.ts
│   │   └── entities/
│   │       └── notification.entity.ts
│   └── email/
│       ├── email.module.ts
│       └── email.service.ts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 8007 |
| NODE_ENV | Environment | development |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USERNAME | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_DATABASE | Database name | notification_service |
| SMTP_HOST | SMTP server host | smtp.gmail.com |
| SMTP_PORT | SMTP server port | 587 |
| SMTP_SECURE | Use SSL/TLS | false |
| SMTP_USER | SMTP username | - |
| SMTP_PASSWORD | SMTP password | - |
| EMAIL_FROM | From email address | noreply@jobapply.com |
| EMAIL_FROM_NAME | From name | Job Apply Platform |
| FRONTEND_URL | Frontend URL | http://localhost:3000 |

## Production Considerations

1. **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
2. **Email**: Use dedicated email service (SendGrid, AWS SES, Mailgun)
3. **Push Notifications**: Integrate Firebase Cloud Messaging or Apple Push Notifications
4. **Monitoring**: Add logging and monitoring (Winston, Sentry)
5. **Rate Limiting**: Implement rate limiting for email sending
6. **Queue System**: Add Redis/Bull for processing notifications asynchronously
7. **Scaling**: Run multiple instances behind a load balancer

## Future Enhancements

- [ ] SMS notifications (Twilio integration)
- [ ] Push notifications (FCM/APNs integration)
- [ ] WebSocket support for real-time notifications
- [ ] Queue system for async processing
- [ ] Rate limiting and throttling
- [ ] Email template builder
- [ ] Notification preferences management
- [ ] A/B testing for notifications
- [ ] Analytics and tracking

## License

MIT
