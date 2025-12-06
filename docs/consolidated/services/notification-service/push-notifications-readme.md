# Push Notifications Implementation

This document describes the push notification infrastructure implemented in the notification-service.

## Overview

The push notification system supports:
- **Firebase Cloud Messaging (FCM)** for Android and Web push notifications
- **Apple Push Notification Service (APNs)** for iOS push notifications
- Device registration and management
- Queue-based async notification processing
- Pre-built notification templates
- Automatic handling of invalid tokens

## Architecture

### Components

```
src/modules/push/
├── dto/                          # Data Transfer Objects
│   ├── register-device.dto.ts    # Device registration payload
│   ├── unregister-device.dto.ts  # Device unregistration payload
│   └── send-push-notification.dto.ts  # Push notification payload
├── entities/
│   └── device-token.entity.ts    # Device token database entity
├── processors/
│   └── push-queue.processor.ts   # Bull queue processor for async push
├── templates/
│   └── notification-templates.ts # Pre-built notification templates
├── push.controller.ts            # REST API endpoints
├── push.service.ts               # Core push notification logic
└── push.module.ts                # NestJS module definition
```

### Database Schema

**device_tokens** table:
- `id` (UUID): Primary key
- `user_id` (VARCHAR): User identifier
- `token` (TEXT): FCM/APNs device token
- `platform` (ENUM): ios | android | web
- `status` (ENUM): active | inactive | invalid
- `device_name`, `device_model`, `os_version`, `app_version`: Device metadata
- `language`, `timezone`: User preferences
- `metadata` (JSONB): Additional custom data
- `last_used_at`: Last notification sent timestamp
- `invalid_at`, `invalid_reason`: Token invalidation tracking
- `created_at`, `updated_at`: Timestamps

Indexes:
- `user_id`, `token`, `platform`, `status`
- Composite: `(user_id, platform)`, `(token, platform)` (unique)

## Setup

### 1. Install Dependencies

Dependencies are already installed:
```bash
npm install firebase-admin apns2
```

### 2. Configure Environment Variables

Copy the example configuration:
```bash
cp .env.push.example .env
```

Edit `.env` with your credentials:

#### FCM Configuration (Android/Web)
```bash
FCM_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

Get FCM credentials:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings > Service Accounts
3. Generate New Private Key
4. Copy JSON content to `FCM_SERVICE_ACCOUNT`

#### APNs Configuration (iOS)
```bash
APNS_KEY_ID=YOUR_KEY_ID
APNS_TEAM_ID=YOUR_TEAM_ID
APNS_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
APNS_PRODUCTION=false
```

Get APNs credentials:
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles
3. Create Key with APNs enabled
4. Download .p8 file and copy content to `APNS_KEY`

### 3. Run Database Migration

```bash
npm run typeorm migration:run
```

This creates the `device_tokens` table.

### 4. Start the Service

```bash
npm run start:dev
```

## API Endpoints

### Register Device
```http
POST /push/register
Content-Type: application/json

{
  "userId": "user-123",
  "token": "device-token-here",
  "platform": "android",
  "deviceName": "John's Phone",
  "deviceModel": "Pixel 7",
  "osVersion": "Android 14",
  "appVersion": "1.2.3",
  "language": "en",
  "timezone": "America/New_York"
}
```

### Unregister Device
```http
DELETE /push/unregister
Content-Type: application/json

{
  "userId": "user-123",
  "token": "device-token-here"
}
```

### Get User Devices
```http
GET /push/devices/:userId
```

### Send Push Notification
```http
POST /push/send
Content-Type: application/json

{
  "userIds": ["user-123", "user-456"],
  "notification": {
    "title": "New Job Match!",
    "body": "Software Engineer at Google",
    "clickAction": "/jobs/123",
    "icon": "/assets/icons/job-match.png",
    "data": {
      "jobId": "123"
    }
  },
  "category": "job_match",
  "priority": "high"
}
```

### Cleanup Inactive Devices
```http
POST /push/cleanup
```

## Queue Jobs

The push notification system uses Bull queues for async processing.

### Job Types

#### 1. Generic Push
```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

constructor(@InjectQueue('push-notifications') private pushQueue: Queue) {}

await this.pushQueue.add('send-push', {
  userIds: ['user-123'],
  notification: {
    title: 'Hello',
    body: 'World'
  },
  priority: 'high'
});
```

#### 2. Job Match Push
```typescript
await this.pushQueue.add('send-job-match-push', {
  userId: 'user-123',
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  location: 'New York, NY',
  jobId: 'job-456'
});
```

#### 3. Application Status Push
```typescript
await this.pushQueue.add('send-application-status-push', {
  userId: 'user-123',
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  status: 'interview',
  applicationId: 'app-789'
});
```

#### 4. Interview Reminder Push
```typescript
await this.pushQueue.add('send-interview-reminder-push', {
  userId: 'user-123',
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  interviewDate: '2024-01-15',
  interviewTime: '10:00 AM',
  interviewType: 'Phone Screen',
  applicationId: 'app-789'
});
```

#### 5. Message Push
```typescript
await this.pushQueue.add('send-message-push', {
  userId: 'user-123',
  senderName: 'Jane Smith',
  messagePreview: 'Hi, I wanted to follow up...',
  conversationId: 'conv-456'
});
```

#### 6. Bulk Push
```typescript
await this.pushQueue.add('send-bulk-push', {
  userIds: ['user-1', 'user-2', 'user-3'],
  title: 'System Maintenance',
  message: 'We will be performing maintenance tonight',
  actionUrl: '/announcements/123'
});
```

## Notification Templates

Pre-built templates are available in `src/modules/push/templates/notification-templates.ts`:

### Available Templates

1. **jobMatch** - New job matches user preferences
2. **multipleJobMatches** - Multiple jobs match
3. **applicationStatusUpdate** - Application status changed
4. **interviewReminder** - Upcoming interview reminder
5. **interviewScheduled** - Interview has been scheduled
6. **messageReceived** - New message received
7. **systemAnnouncement** - System-wide announcements
8. **accountAlert** - Account-related notifications
9. **profileView** - Profile viewed by company
10. **resumeUpdated** - Resume analysis complete
11. **autoApplyComplete** - Auto-apply batch finished

### Using Templates

```typescript
import { PushNotificationTemplates } from './templates';

const template = PushNotificationTemplates.jobMatch({
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  location: 'New York, NY',
  jobId: 'job-123'
});

const payload = PushNotificationTemplates.toPayload(template);
// Use payload in push notification
```

## Platform-Specific Features

### Android (FCM)
- Custom icons
- Custom sounds
- Action buttons
- Large images
- Notification grouping
- TTL (Time To Live)

### iOS (APNs)
- Badge numbers
- Custom sounds
- Action categories
- Silent notifications
- Critical alerts (requires entitlement)

### Web (FCM)
- Browser notifications
- Click actions
- Icons and images
- Notification actions

## Token Management

### Automatic Invalid Token Handling

The service automatically marks tokens as invalid when:
- FCM returns `not-found` or `invalid-registration-token`
- APNs returns `Unregistered` or `InvalidRegistration`

Invalid tokens are updated in the database:
```sql
UPDATE device_tokens
SET status = 'invalid',
    invalid_at = NOW()
WHERE token = '...'
```

### Cleanup Inactive Devices

Run periodic cleanup to remove old inactive devices:
```typescript
// Remove devices inactive for 90+ days
await pushService.cleanupInactiveDevices(90);
```

## Monitoring and Logging

All push notifications are logged with:
- User ID(s)
- Platform(s)
- Success/failure status
- Error messages
- Message IDs (from FCM/APNs)

Example logs:
```
[PushService] Device registered: android token for user user-123
[PushQueueProcessor] Processing push notification job 456 for 3 users
[PushService] FCM: Sent 2/3 notifications
[PushService] APNs: Sent 5/5 notifications
[PushService] Marked 1 tokens as invalid
```

## Error Handling

### Common Errors

1. **FCM not initialized**
   - Cause: Missing or invalid `FCM_SERVICE_ACCOUNT`
   - Fix: Verify environment variable contains valid JSON

2. **APNs not initialized**
   - Cause: Missing `APNS_KEY_ID`, `APNS_TEAM_ID`, or `APNS_KEY`
   - Fix: Set all required APNs environment variables

3. **Invalid token**
   - Cause: Token expired or app uninstalled
   - Handling: Automatically marked as invalid in database

4. **Rate limiting**
   - Cause: Too many requests to FCM/APNs
   - Handling: Use Bull queue with rate limiting

## Best Practices

1. **Token Updates**: Re-register device token on each app launch
2. **Error Handling**: Always handle push notification failures gracefully
3. **User Preferences**: Check notification preferences before sending
4. **Batch Processing**: Use queues for bulk notifications
5. **Testing**: Test on all platforms (iOS, Android, Web) before production
6. **Monitoring**: Monitor delivery rates and invalid token rates
7. **Cleanup**: Run periodic cleanup of inactive devices

## Security

- Store FCM/APNs credentials securely (Azure Key Vault, AWS Secrets Manager)
- Use HTTPS for all webhook endpoints
- Validate user permissions before sending notifications
- Implement rate limiting on registration endpoints
- Sanitize all notification content to prevent XSS

## Testing

### Local Testing

1. Use FCM/APNs sandbox/development mode
2. Register test device tokens
3. Send test notifications via API

### Integration Testing

```typescript
describe('PushService', () => {
  it('should register device successfully', async () => {
    const device = await pushService.registerDevice({
      userId: 'test-user',
      token: 'test-token',
      platform: DevicePlatform.ANDROID
    });
    expect(device.status).toBe(DeviceStatus.ACTIVE);
  });

  it('should send push notification', async () => {
    const results = await pushService.sendPushNotification({
      userIds: ['test-user'],
      notification: {
        title: 'Test',
        body: 'Test notification'
      }
    });
    expect(results[0].success).toBe(true);
  });
});
```

## Troubleshooting

### Notifications not received

1. Check device token is registered and active
2. Verify FCM/APNs credentials are correct
3. Check platform-specific settings (iOS: notifications enabled in Settings)
4. Review logs for error messages
5. Test with a different device

### High failure rates

1. Clean up invalid tokens regularly
2. Check for FCM/APNs service outages
3. Verify network connectivity
4. Review rate limiting settings

## Future Enhancements

Potential improvements:
- [ ] Rich notifications with images/videos
- [ ] Notification action buttons
- [ ] Notification channels (Android)
- [ ] Scheduled notifications
- [ ] Geofencing notifications
- [ ] A/B testing for notification content
- [ ] Analytics dashboard
- [ ] User-specific notification preferences
- [ ] Multi-language support
- [ ] Notification history

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
