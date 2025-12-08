# Push Notification Implementation

## Overview

This README provides a quick reference for the push notification functionality implemented in the Job-Apply-Platform notification service.

## What Was Implemented

The push notification system includes:

1. **Firebase Cloud Messaging (FCM)** - For Android and Web push notifications
2. **Apple Push Notification service (APNs)** - For iOS push notifications
3. **Device Management** - Registration, unregistration, and token management
4. **Notification Sending** - Single and batch notification support
5. **Queue Processing** - Asynchronous notification delivery with retry logic
6. **Error Handling** - Automatic invalid token detection and cleanup
7. **Templates** - Pre-built notification templates for common scenarios
8. **Database** - Device token storage with PostgreSQL

## Key Files

### Implementation Files

- `src/modules/push/push.service.ts` - Core push notification service
- `src/modules/push/push.controller.ts` - REST API endpoints
- `src/modules/push/push.module.ts` - Module configuration
- `src/modules/push/processors/push-queue.processor.ts` - Queue job processing
- `src/modules/push/templates/notification-templates.ts` - Notification templates
- `src/modules/push/entities/device-token.entity.ts` - Device token entity
- `src/modules/queue/processors/notification-queue.processor.ts` - Integrated with push service
- `src/migrations/1733500000000-AddDeviceTokens.ts` - Database migration

### Documentation Files

- `PUSH_NOTIFICATION_GUIDE.md` - Complete implementation guide
- `PUSH_NOTIFICATION_EXAMPLES.md` - 25+ code examples
- `PUSH_IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `PUSH_NOTIFICATION_README.md` - This file

## Quick Start

### 1. Configure Credentials

Add to your `.env` file:

```bash
# FCM (Firebase Cloud Messaging)
FCM_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project",...}'

# APNs (Apple Push Notifications)
APNS_KEY_ID=YOUR_KEY_ID
APNS_TEAM_ID=YOUR_TEAM_ID
APNS_KEY='-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----'
APNS_PRODUCTION=false
```

See `.env.push.example` for detailed credential setup instructions.

### 2. Run Database Migration

```bash
npm run migration:run
```

### 3. Start the Service

```bash
npm run start:dev
```

## Usage

### Register a Device

```typescript
POST /push/register
{
  "userId": "user-123",
  "token": "fcm-or-apns-token",
  "platform": "ios" | "android" | "web",
  "deviceName": "John's iPhone"
}
```

### Send a Notification

```typescript
POST /push/send
{
  "userIds": ["user-123"],
  "notification": {
    "title": "New Job Match!",
    "body": "Software Engineer at Google",
    "clickAction": "/jobs/123",
    "sound": "default"
  },
  "category": "job_match",
  "priority": "high"
}
```

### Using Queue (Recommended)

```typescript
// In your service
await this.pushQueue.add('send-job-match-push', {
  userId: 'user-123',
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  location: 'Mountain View',
  jobId: 'job-123',
});
```

## API Endpoints

- `POST /push/register` - Register device token
- `DELETE /push/unregister` - Unregister device token
- `GET /push/devices/:userId` - Get user's devices
- `POST /push/send` - Send push notification
- `POST /push/cleanup` - Clean up inactive devices

Full API documentation: `http://localhost:8007/api`

## Notification Templates

Use pre-built templates for consistency:

```typescript
import { PushNotificationTemplates } from './modules/push/templates';

const template = PushNotificationTemplates.jobMatch({
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  location: 'Mountain View',
  jobId: 'job-123',
});

await this.pushService.sendPushNotification({
  userIds: [userId],
  notification: PushNotificationTemplates.toPayload(template),
  category: template.category,
  priority: 'high',
});
```

Available templates:
- jobMatch
- applicationStatusUpdate
- interviewReminder
- messageReceived
- systemAnnouncement
- resumeUpdated
- autoApplyComplete
- And more...

## Queue Jobs

### Push Notifications Queue

- `send-push` - Generic push notification
- `send-job-match-push` - Job match notification
- `send-application-status-push` - Application update
- `send-interview-reminder-push` - Interview reminder
- `send-message-push` - Message notification
- `send-bulk-push` - Bulk notifications

### Integration Example

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {}

  async notifyJobMatch(userId: string, job: any) {
    await this.pushQueue.add('send-job-match-push', {
      userId,
      jobTitle: job.title,
      companyName: job.company,
      location: job.location,
      jobId: job.id,
    });
  }
}
```

## Error Handling

The service automatically:
- Marks invalid tokens as inactive
- Retries failed sends via queue
- Logs detailed error messages
- Reports partial failures

## Platform Support

- **iOS**: Via APNs with .p8 key authentication
- **Android**: Via FCM
- **Web**: Via FCM (web push)

## Database

Device tokens are stored in the `device_tokens` table:

```sql
SELECT * FROM device_tokens WHERE user_id = 'user-123';
```

Fields:
- id, user_id, token, platform
- status (active/inactive/invalid)
- device_name, device_model, os_version
- last_used_at, created_at, updated_at

## Monitoring

Check these metrics:
- Notification success rate
- Invalid token count
- Queue processing time
- Platform distribution

## Troubleshooting

### FCM Issues
- Verify `FCM_SERVICE_ACCOUNT` is valid JSON
- Check Firebase project is active
- Ensure sender ID matches client app

### APNs Issues
- Verify .p8 key is correct
- Check `APNS_PRODUCTION` matches environment
- Ensure bundle ID matches

### No Devices Found
- User needs to register device via `/push/register`
- Check device status is 'active'

### All Sends Failing
- Check credentials are correct
- Verify network connectivity
- Review service logs

## Documentation

1. **PUSH_NOTIFICATION_GUIDE.md** - Complete guide with setup, API reference, troubleshooting
2. **PUSH_NOTIFICATION_EXAMPLES.md** - 25+ practical code examples
3. **PUSH_IMPLEMENTATION_COMPLETE.md** - Implementation summary and checklist
4. **Swagger Docs** - `http://localhost:8007/api`

## Security

- Store credentials in environment variables
- Use HTTPS for all API calls
- Validate device tokens before storage
- Implement rate limiting on registration
- Regular cleanup of inactive devices

## Best Practices

1. Always use queue for sending notifications
2. Use templates for consistency
3. Include deep links in notifications
4. Set appropriate TTL for time-sensitive notifications
5. Check user preferences before sending
6. Localize notifications based on user language
7. Clean up inactive devices regularly
8. Monitor and log all failures
9. Use high priority sparingly
10. Test in sandbox before production

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Manual test
curl -X POST http://localhost:8007/push/send \
  -H "Content-Type: application/json" \
  -d '{"userIds":["test"],"notification":{"title":"Test","body":"Test"}}'
```

## Getting Credentials

### Firebase (FCM)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings > Service Accounts
3. Generate New Private Key
4. Download JSON and set as `FCM_SERVICE_ACCOUNT`

### Apple (APNs)
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles
3. Create new Key with APNs enabled
4. Download .p8 file
5. Set `APNS_KEY_ID`, `APNS_TEAM_ID`, and `APNS_KEY`

## Support

For questions or issues:
1. Check documentation files
2. Review Swagger API docs
3. Check service logs
4. Contact platform team

## Version

Current version: 1.0.0
Last updated: December 6, 2024
Status: Production Ready

## TODO Completion

The TODO at line 42 in `notification-queue.processor.ts` has been completed. The processor now:
- Integrates with PushService
- Sends notifications via FCM and APNs
- Handles errors and retries
- Supports bulk notifications
- Logs detailed results

## What's Next

Consider implementing:
- Notification scheduling
- Analytics and tracking
- A/B testing
- Rich notifications
- User segmentation
- Web push VAPID keys
- Admin dashboard

---

For detailed information, see:
- Setup: `PUSH_NOTIFICATION_GUIDE.md`
- Examples: `PUSH_NOTIFICATION_EXAMPLES.md`
- Status: `PUSH_IMPLEMENTATION_COMPLETE.md`
