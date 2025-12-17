# Notification System - Complete Implementation Guide

## Overview

The notification system is now fully functional with real-time WebSocket delivery, email notifications via Nodemailer, and push notifications via Firebase Cloud Messaging (FCM).

## Features Implemented

### 1. Real-Time WebSocket Notifications
- **WebSocket Gateway**: Located at `/notifications` namespace
- **Auto-reconnection**: Configured with exponential backoff
- **Real-time events**:
  - `new-notification`: Fired when a new notification is created
  - `notification-updated`: Fired when notification is marked as read
  - `unread-count`: Updates the unread notification count
  - `initial-notifications`: Sent on connection with recent notifications
  - `notifications-refreshed`: Sent after bulk operations

### 2. Email Notifications
- **Provider**: Nodemailer with SMTP support
- **Templates**: Handlebars templates for:
  - Welcome emails
  - Email verification
  - Password reset
  - Application status updates
  - Weekly digest
  - Job alerts
- **Queue-based**: Uses Bull queues for async processing
- **Template location**: `services/notification-service/src/templates/emails/`

### 3. Push Notifications
- **Platforms**: iOS (APNs), Android (FCM), Web (FCM)
- **Device Management**: Token registration and cleanup
- **Queue-based**: Async processing with retry logic
- **Features**:
  - Multi-platform support
  - Badge count management
  - Custom sounds and icons
  - Click actions and deep linking
  - Invalid token cleanup

### 4. Notification Preferences
- **Per-user settings**: Email, push, and SMS preferences
- **Granular control**: Separate toggles for different notification types
- **Default preferences**: Auto-created on first access

## Architecture

```
┌─────────────────┐
│   Frontend      │
│ (React/Next.js) │
└────────┬────────┘
         │
         │ WebSocket + HTTP
         │
┌────────▼────────────────────────┐
│   Notification Service          │
│                                 │
│  ┌──────────────────────────┐  │
│  │ NotificationsGateway     │  │
│  │ (WebSocket)              │  │
│  └───────────┬──────────────┘  │
│              │                  │
│  ┌───────────▼──────────────┐  │
│  │ NotificationsService     │  │
│  └───────┬──────────────────┘  │
│          │                      │
│  ┌───────┴──────────┬──────────┤
│  │                  │          │
│  ▼                  ▼          │
│ EmailService    PushService    │
│  (Nodemailer)   (FCM/APNs)     │
└─────────────────────────────────┘
         │              │
         │              │
    ┌────▼────┐    ┌───▼────┐
    │  SMTP   │    │  FCM   │
    │ Server  │    │ Server │
    └─────────┘    └────────┘
```

## API Endpoints

### Notifications

#### Create Notification
```http
POST /notifications
Content-Type: application/json

{
  "userId": "user-123",
  "type": "IN_APP",
  "title": "New Message",
  "message": "You have a new message",
  "category": "message",
  "data": { "messageId": "msg-456" }
}
```

#### Get Notifications
```http
GET /notifications?userId=user-123&page=1&limit=20&isRead=false
```

#### Get User Notifications
```http
GET /notifications/user/:userId?limit=50
```

#### Get Unread Count
```http
GET /notifications/user/:userId/unread-count
```

#### Mark as Read
```http
PATCH /notifications/:id/read
```

#### Mark All as Read
```http
PATCH /notifications/user/:userId/read-all
```

#### Delete Notification
```http
DELETE /notifications/:id
```

### Email Notifications

#### Send Email
```http
POST /notifications/email
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Welcome!",
  "body": "<h1>Welcome to our platform</h1>",
  "userId": "user-123"
}
```

### Push Notifications

#### Register Device
```http
POST /push/register
Content-Type: application/json

{
  "userId": "user-123",
  "token": "fcm-token-xyz",
  "platform": "web",
  "deviceName": "Chrome Browser",
  "appVersion": "1.0.0"
}
```

#### Send Push Notification
```http
POST /notifications/push
Content-Type: application/json

{
  "userId": "user-123",
  "title": "New Job Match",
  "message": "5 new jobs match your profile",
  "icon": "/logo.png",
  "data": { "action": "view_jobs" }
}
```

#### Get User Devices
```http
GET /push/devices/:userId
```

#### Unregister Device
```http
DELETE /push/unregister
Content-Type: application/json

{
  "userId": "user-123",
  "token": "fcm-token-xyz"
}
```

### Preferences

#### Get Preferences
```http
GET /notifications/preferences/:userId
```

#### Update Preferences
```http
PUT /notifications/preferences/:userId
Content-Type: application/json

{
  "emailEnabled": true,
  "pushEnabled": true,
  "emailApplicationStatus": true,
  "emailJobAlerts": false
}
```

## WebSocket Connection

### Frontend Integration

```typescript
import {
  initNotificationSocket,
  disconnectNotificationSocket,
} from '@/lib/api/notificationSocket';

// Initialize connection
const socket = initNotificationSocket(userId, authToken, {
  onNewNotification: (notification) => {
    console.log('New notification:', notification);
    // Update UI
  },
  onUnreadCount: (data) => {
    console.log('Unread count:', data.count);
    // Update badge
  },
  onConnect: () => {
    console.log('Connected to notification service');
  },
});

// Clean up on unmount
disconnectNotificationSocket();
```

### WebSocket Events

#### Client → Server
- `mark-as-read`: Mark notification as read
- `mark-all-as-read`: Mark all notifications as read
- `fetch-notifications`: Fetch notifications with pagination

#### Server → Client
- `new-notification`: New notification created
- `notification-updated`: Notification was updated
- `unread-count`: Unread count changed
- `initial-notifications`: Initial notifications on connect
- `notifications-refreshed`: Notifications list refreshed

## Environment Variables

### Required
```env
# Database
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notification_service

# Redis (for Bull queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000

# Email Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@jobapply.com
EMAIL_FROM_NAME=Job Apply Platform
```

### Optional
```env
# Firebase Cloud Messaging
FCM_SERVICE_ACCOUNT={"type":"service_account",...}

# Apple Push Notification Service
APNS_KEY_ID=your-key-id
APNS_TEAM_ID=your-team-id
APNS_KEY=-----BEGIN PRIVATE KEY-----...
APNS_PRODUCTION=false

# Azure Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
```

## Email Templates

Templates are located in `services/notification-service/src/templates/emails/`

### Available Templates
1. **welcome.hbs** - Welcome email for new users
2. **verification.hbs** - Email address verification
3. **password-reset.hbs** - Password reset email
4. **application-status.hbs** - Job application status update
5. **weekly-digest.hbs** - Weekly summary of activities

### Creating Custom Templates

```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Your styles here */
  </style>
</head>
<body>
  <h1>Hello {{name}}!</h1>
  <p>{{message}}</p>

  {{#if showButton}}
    <a href="{{actionUrl}}" class="button">{{buttonText}}</a>
  {{/if}}

  <p>&copy; {{year}} Job Apply Platform</p>
</body>
</html>
```

## Testing

### Run API Tests
```bash
# Using the test script
cd services/notification-service
./test-notifications.sh http://localhost:8007

# Or use the HTTP file with VS Code REST Client extension
# Open test-notifications.http and run individual requests
```

### Manual Testing with curl

```bash
# Create notification
curl -X POST http://localhost:8007/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "IN_APP",
    "title": "Test",
    "message": "Test notification"
  }'

# Get notifications
curl http://localhost:8007/notifications/user/test-user

# Get unread count
curl http://localhost:8007/notifications/user/test-user/unread-count
```

## Frontend Components

### NotificationCenter Component
Located at: `apps/web/src/components/features/notifications/NotificationCenter.tsx`

Features:
- Real-time notifications via WebSocket
- Unread count badge
- Mark as read/delete actions
- Fallback to HTTP polling if WebSocket fails
- Connection status indicator
- Browser notifications (with permission)

### Usage
```tsx
import { NotificationCenter } from '@/components/features/notifications/NotificationCenter';

function Header() {
  return (
    <header>
      <NotificationCenter />
    </header>
  );
}
```

## Database Migrations

### Run Migrations
```bash
cd services/notification-service
pnpm migration:run
```

### Create New Migration
```bash
pnpm migration:generate src/migrations/MigrationName
```

## Common Issues & Solutions

### Issue: WebSocket not connecting
**Solution**: Check CORS settings in main.ts and ensure frontend URL is whitelisted

### Issue: Emails not sending
**Solution**:
1. Check SMTP configuration
2. Verify email templates exist
3. Check Bull queue is running
4. Look at email service logs

### Issue: Push notifications not received
**Solution**:
1. Verify FCM credentials are configured
2. Check device token is registered
3. Ensure user preferences allow push notifications
4. Check Firebase Console for delivery status

### Issue: Duplicate notifications
**Solution**: Check that gateway is only initialized once in the service

## Performance Considerations

1. **WebSocket Connections**: Limited by server resources
   - Monitor open connections
   - Implement connection limits if needed

2. **Email Queue**: Process in batches
   - Current: Single processor
   - Scale: Add more workers if needed

3. **Database Queries**: Indexed fields
   - userId, createdAt, isRead are indexed
   - Monitor query performance

## Security

1. **WebSocket Authentication**: Uses token-based auth
2. **Rate Limiting**: Should be added at gateway level
3. **Input Validation**: Class-validator on all DTOs
4. **SQL Injection**: Protected by TypeORM parameterized queries
5. **XSS Protection**: Email templates should escape user input

## Monitoring

### Key Metrics to Track
- WebSocket connections (active/total)
- Notification delivery rate
- Email send success/failure rate
- Push notification delivery rate
- Queue processing time
- Database query performance

### Logging
- All critical operations are logged
- Errors include stack traces
- WebSocket events are logged
- Queue jobs are tracked

## Next Steps

1. **Rate Limiting**: Add rate limits to prevent abuse
2. **SMS Notifications**: Implement Twilio integration
3. **Analytics**: Track notification engagement
4. **A/B Testing**: Test different notification formats
5. **Batch Operations**: Optimize bulk notification sending
6. **Notification Groups**: Group similar notifications
7. **Rich Notifications**: Support images, videos, buttons
8. **Scheduled Notifications**: Schedule future delivery

## Support

For issues or questions:
1. Check logs: `services/notification-service/logs/`
2. Review Swagger docs: `http://localhost:8007/api/docs`
3. Test endpoints: Use `test-notifications.http` or `test-notifications.sh`
