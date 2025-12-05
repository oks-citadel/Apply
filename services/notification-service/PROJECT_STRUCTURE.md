# Notification Service - Project Structure

## Complete Directory Tree

```
notification-service/
├── src/
│   ├── main.ts                                    # Application entry point (port 8007)
│   ├── app.module.ts                              # Root module with TypeORM & config
│   │
│   ├── health/                                    # Health check endpoints
│   │   ├── health.controller.ts                   # /health, /health/ready, /health/live
│   │   └── health.module.ts
│   │
│   ├── modules/
│   │   ├── notifications/                         # Notifications module
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts        # REST API endpoints
│   │   │   ├── notifications.service.ts           # Business logic
│   │   │   ├── notifications.service.spec.ts      # Unit tests
│   │   │   │
│   │   │   ├── dto/                               # Data Transfer Objects
│   │   │   │   ├── index.ts
│   │   │   │   ├── send-email.dto.ts              # Email notification DTO
│   │   │   │   ├── send-push.dto.ts               # Push notification DTO
│   │   │   │   ├── create-notification.dto.ts     # Create notification DTO
│   │   │   │   └── query-notifications.dto.ts     # Query/filter DTO
│   │   │   │
│   │   │   └── entities/
│   │   │       └── notification.entity.ts         # TypeORM entity with full schema
│   │   │
│   │   └── email/                                 # Email service module
│   │       ├── email.module.ts
│   │       └── email.service.ts                   # Nodemailer integration + templates
│   │
│   └── config/                                    # Configuration (empty, can add custom config)
│
├── package.json                                    # Dependencies & scripts
├── tsconfig.json                                   # TypeScript configuration
├── nest-cli.json                                   # NestJS CLI configuration
│
├── .env.example                                    # Environment variables template
├── .gitignore                                      # Git ignore rules
├── .dockerignore                                   # Docker ignore rules
├── .prettierrc                                     # Code formatting rules
├── .eslintrc.js                                    # Linting configuration
│
├── Dockerfile                                      # Multi-stage Docker build
├── docker-compose.yml                              # Docker Compose with PostgreSQL
│
├── README.md                                       # Comprehensive documentation
├── QUICKSTART.md                                   # Quick setup guide
├── API_EXAMPLES.md                                 # API usage examples
└── PROJECT_STRUCTURE.md                            # This file
```

## Module Breakdown

### 1. Main Application (`src/main.ts`)
- Bootstraps NestJS application
- Configures CORS
- Sets up global validation pipes
- Initializes Swagger documentation
- Listens on port 8007

### 2. App Module (`src/app.module.ts`)
- Configures TypeORM with PostgreSQL
- Loads environment variables globally
- Imports all feature modules

### 3. Health Module (`src/health/`)
- Health check endpoint for monitoring
- Kubernetes-ready readiness/liveness probes

### 4. Notifications Module (`src/modules/notifications/`)

#### Controller (`notifications.controller.ts`)
REST API endpoints:
- `POST /notifications/email` - Send email notification
- `POST /notifications/push` - Send push notification
- `POST /notifications` - Create notification
- `GET /notifications` - Get all (paginated, filtered)
- `GET /notifications/user/:userId` - Get user notifications
- `GET /notifications/user/:userId/unread-count` - Get unread count
- `GET /notifications/:id` - Get single notification
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/user/:userId/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `DELETE /notifications/cleanup/old` - Delete old notifications

#### Service (`notifications.service.ts`)
Business logic methods:
- `create()` - Create new notification
- `findAll()` - Get notifications with filters
- `findOne()` - Get notification by ID
- `findByUserId()` - Get user's notifications
- `markAsRead()` - Mark single as read
- `markAllAsRead()` - Mark all user notifications as read
- `delete()` - Delete notification
- `deleteOld()` - Cleanup old notifications
- `sendEmail()` - Send email notification
- `sendPush()` - Send push notification (placeholder)
- `getUnreadCount()` - Get unread count
- `updateStatus()` - Update notification status

#### Entity (`entities/notification.entity.ts`)
Database schema:
- `id` (UUID) - Primary key
- `userId` - User identifier
- `type` - email | push | sms | in_app
- `status` - pending | sent | failed | read
- `priority` - low | medium | high | urgent
- `title` - Notification title
- `message` - Notification message
- `data` - JSON metadata
- `category` - Notification category
- `actionUrl` - Click action URL
- `isRead` - Read status boolean
- `readAt` - Read timestamp
- `sentAt` - Sent timestamp
- `failedReason` - Failure reason
- `retryCount` - Retry counter
- `expiresAt` - Expiration timestamp
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

#### DTOs (`dto/`)
Validation and data transfer:
- `SendEmailDto` - Email sending payload
- `SendPushDto` - Push notification payload
- `CreateNotificationDto` - Notification creation
- `QueryNotificationsDto` - Query parameters with pagination

### 5. Email Module (`src/modules/email/`)

#### Service (`email.service.ts`)
Email functionality:
- `sendEmail()` - Send generic email
- `sendTemplatedEmail()` - Send with custom template
- `sendVerificationEmail()` - Pre-built verification template
- `sendPasswordResetEmail()` - Pre-built reset template
- `sendApplicationStatusEmail()` - Pre-built status update template
- `sendJobAlertEmail()` - Pre-built job alert template
- `verifyConnection()` - Test SMTP connection
- `renderTemplate()` - Template rendering engine

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/email` | Send email notification |
| POST | `/notifications/push` | Send push notification |
| POST | `/notifications` | Create notification |
| GET | `/notifications` | Get all notifications (paginated) |
| GET | `/notifications/user/:userId` | Get user notifications |
| GET | `/notifications/user/:userId/unread-count` | Get unread count |
| GET | `/notifications/:id` | Get notification by ID |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/user/:userId/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |
| DELETE | `/notifications/cleanup/old` | Cleanup old notifications |
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    type VARCHAR CHECK (type IN ('email', 'push', 'sms', 'in_app')),
    status VARCHAR CHECK (status IN ('pending', 'sent', 'failed', 'read')),
    priority VARCHAR CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    category VARCHAR,
    action_url VARCHAR,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    failed_reason VARCHAR,
    retry_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at);
```

## Environment Variables

Required configuration in `.env`:

```bash
# Server
PORT=8007
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notification_service

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@jobapply.com
EMAIL_FROM_NAME=Job Apply Platform

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Dependencies

### Core Dependencies
- `@nestjs/common` - NestJS core
- `@nestjs/core` - NestJS core functionality
- `@nestjs/platform-express` - Express platform
- `@nestjs/config` - Configuration management
- `@nestjs/typeorm` - TypeORM integration
- `@nestjs/swagger` - API documentation
- `typeorm` - ORM for database
- `pg` - PostgreSQL driver
- `nodemailer` - Email sending
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

### Development Dependencies
- `@nestjs/cli` - NestJS CLI tools
- `@types/*` - TypeScript type definitions
- `typescript` - TypeScript compiler
- `jest` - Testing framework
- `eslint` - Code linting
- `prettier` - Code formatting

## Testing

Run tests:
```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
```

## Deployment

### Development
```bash
npm install
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Docker
```bash
docker-compose up -d
```

## Integration Points

This service is designed to integrate with:
1. **Auth Service** - User verification emails
2. **Job Service** - Job alert emails
3. **Application Service** - Application status updates
4. **User Service** - Profile notifications
5. **Frontend** - Real-time notification display

## Future Enhancements

- WebSocket support for real-time notifications
- Redis/Bull queue for async processing
- SMS notifications (Twilio)
- Push notifications (FCM/APNs)
- Email template builder UI
- Notification preferences management
- Analytics and tracking
- Rate limiting
- Batch sending
