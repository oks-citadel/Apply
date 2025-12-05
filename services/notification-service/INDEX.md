# Notification Service - Documentation Index

Welcome to the Notification Service! This is your starting point for understanding and using this microservice.

## Quick Links

- **New User?** Start with [QUICKSTART.md](QUICKSTART.md)
- **Setting Up?** Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Need Examples?** Check [API_EXAMPLES.md](API_EXAMPLES.md)
- **Full Documentation:** See [README.md](README.md)
- **Architecture:** Review [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

## What is This Service?

The Notification Service is a complete NestJS microservice that handles:
- Email notifications (with Nodemailer)
- Push notifications (placeholder for FCM/APNs)
- In-app notifications
- Notification history and tracking
- Template-based emails

**Port:** 8007
**Database:** PostgreSQL
**Framework:** NestJS + TypeORM

---

## Documentation Files

### 1. [README.md](README.md) - Main Documentation
Complete overview of the service including:
- Features and capabilities
- Tech stack
- Installation instructions
- API endpoints
- Email templates
- Database schema
- Production considerations

### 2. [QUICKSTART.md](QUICKSTART.md) - Get Started Fast
Step-by-step guide to get running in 5 minutes:
- Prerequisites
- Installation
- Configuration
- Testing endpoints
- Common issues

### 3. [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed Setup
Comprehensive setup instructions including:
- Prerequisites details
- Database setup (3 options)
- Email configuration (Gmail, SendGrid, etc.)
- Troubleshooting common issues
- Production deployment checklist

### 4. [API_EXAMPLES.md](API_EXAMPLES.md) - Usage Examples
Real-world API examples:
- cURL commands
- JavaScript/TypeScript code
- Python examples
- React hooks
- Integration examples

### 5. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Architecture
Complete project breakdown:
- Directory structure
- Module descriptions
- Database schema
- API endpoint reference
- Dependencies overview

---

## Quick Start Commands

### Installation
```bash
cd services/notification-service
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Run Development
```bash
npm run start:dev
```

### Run with Docker
```bash
docker-compose up -d
```

### Test API
```bash
# Health check
curl http://localhost:8007/health

# Send email
curl -X POST http://localhost:8007/notifications/email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Hello!"}'
```

---

## Key Features

### Email Service
- Send transactional emails
- Pre-built templates:
  - Email verification
  - Password reset
  - Application status updates
  - Job alerts
- Custom HTML emails
- Nodemailer integration

### Notifications
- Create and track notifications
- Multiple types (email, push, SMS, in-app)
- Priority levels
- Read/unread status
- Expiration dates
- User-specific queries

### API Endpoints

**Email:**
- `POST /notifications/email` - Send email

**Push:**
- `POST /notifications/push` - Send push notification

**Management:**
- `GET /notifications` - Get all (with filters)
- `GET /notifications/user/:userId` - Get user notifications
- `GET /notifications/:id` - Get single notification
- `PUT /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification

**Health:**
- `GET /health` - Health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

---

## Project Statistics

- **Total Files:** 30+
- **Source Files:** 16 TypeScript files
- **Lines of Code:**
  - Notifications Service: 264 lines
  - Email Service: 350 lines
  - Controller: 173 lines
- **API Endpoints:** 12+
- **Email Templates:** 4 pre-built

---

## File Structure Overview

```
notification-service/
├── Documentation
│   ├── INDEX.md (this file)
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── SETUP_GUIDE.md
│   ├── API_EXAMPLES.md
│   └── PROJECT_STRUCTURE.md
│
├── Configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   ├── .prettierrc
│   └── .eslintrc.js
│
├── Docker
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
│
└── Source Code (src/)
    ├── main.ts
    ├── app.module.ts
    ├── health/
    ├── modules/
    │   ├── notifications/
    │   │   ├── dto/
    │   │   ├── entities/
    │   │   ├── notifications.controller.ts
    │   │   ├── notifications.service.ts
    │   │   └── notifications.module.ts
    │   └── email/
    │       ├── email.service.ts
    │       └── email.module.ts
    └── config/
```

---

## Technology Stack

### Core
- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x
- **Runtime:** Node.js 18+

### Database
- **ORM:** TypeORM 0.3.x
- **Database:** PostgreSQL 14+
- **Driver:** pg

### Email
- **Library:** Nodemailer 6.x
- **Supported:** SMTP (Gmail, SendGrid, SES, etc.)

### API
- **Documentation:** Swagger/OpenAPI
- **Validation:** class-validator
- **Transformation:** class-transformer

### Development
- **Testing:** Jest
- **Linting:** ESLint
- **Formatting:** Prettier

---

## Common Workflows

### Send Verification Email
```typescript
POST /notifications/email
{
  "to": "user@example.com",
  "template": "verification",
  "templateData": {
    "name": "John",
    "verificationToken": "abc123"
  }
}
```

### Send Application Update
```typescript
POST /notifications/email
{
  "to": "applicant@example.com",
  "template": "application-status",
  "templateData": {
    "name": "Jane",
    "jobTitle": "Developer",
    "companyName": "TechCorp",
    "status": "interviewing"
  }
}
```

### Get User Notifications
```bash
GET /notifications/user/user-123?limit=50
```

### Mark All as Read
```bash
PUT /notifications/user/user-123/read-all
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 8007 |
| NODE_ENV | Environment | development |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USERNAME | DB username | postgres |
| DB_PASSWORD | DB password | password |
| DB_DATABASE | Database name | notification_service |
| SMTP_HOST | SMTP server | smtp.gmail.com |
| SMTP_PORT | SMTP port | 587 |
| SMTP_USER | SMTP username | email@gmail.com |
| SMTP_PASSWORD | SMTP password | app-password |
| EMAIL_FROM | From address | noreply@app.com |
| FRONTEND_URL | Frontend URL | http://localhost:3000 |

---

## Development Guide

### Run Tests
```bash
npm run test
npm run test:watch
npm run test:cov
```

### Build
```bash
npm run build
```

### Lint & Format
```bash
npm run lint
npm run format
```

### Start Development
```bash
npm run start:dev
```

---

## Swagger Documentation

Once running, visit:
```
http://localhost:8007/api/docs
```

Interactive API documentation with:
- All endpoints
- Request/response schemas
- Try it out functionality
- Model definitions

---

## Integration Examples

### React Integration
```typescript
import { useNotifications } from './hooks/useNotifications';

function NotificationBell({ userId }) {
  const { unreadCount, notifications, markAsRead } = useNotifications(userId);

  return (
    <div>
      <Badge count={unreadCount}>
        <Bell />
      </Badge>
      {notifications.map(notif => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onRead={() => markAsRead(notif.id)}
        />
      ))}
    </div>
  );
}
```

### Backend Integration
```typescript
import NotificationClient from './clients/notification.client';

// Send verification email
await NotificationClient.sendVerificationEmail(
  user.email,
  user.name,
  verificationToken
);

// Send application update
await NotificationClient.sendApplicationUpdate(
  user.email,
  user.name,
  job.title,
  company.name,
  'interviewing'
);
```

---

## Troubleshooting

### Service Won't Start
1. Check PostgreSQL is running
2. Verify .env configuration
3. Check port 8007 is available
4. Review logs for errors

### Emails Not Sending
1. Verify SMTP credentials
2. Use app password (not regular password) for Gmail
3. Check SMTP host and port
4. Test with simple email first

### Database Errors
1. Ensure database exists
2. Check credentials in .env
3. Verify PostgreSQL is accessible
4. Check firewall settings

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

---

## Next Steps

1. **For Development:**
   - Follow [QUICKSTART.md](QUICKSTART.md)
   - Review [API_EXAMPLES.md](API_EXAMPLES.md)
   - Start building!

2. **For Deployment:**
   - Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
   - Review production checklist
   - Configure monitoring

3. **For Integration:**
   - Check [API_EXAMPLES.md](API_EXAMPLES.md)
   - Review integration patterns
   - Test endpoints

---

## Support & Resources

- **Documentation:** All .md files in this directory
- **Swagger UI:** http://localhost:8007/api/docs
- **Health Check:** http://localhost:8007/health

---

## License

MIT

---

**Last Updated:** December 4, 2025
**Version:** 1.0.0
**Maintained by:** Job Apply Platform Team
