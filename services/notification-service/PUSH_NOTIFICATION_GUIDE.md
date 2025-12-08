# Push Notification Implementation Guide

## Overview

The notification service now includes a complete push notification implementation supporting:
- **Firebase Cloud Messaging (FCM)** for Android and Web push notifications
- **Apple Push Notification service (APNs)** for iOS push notifications
- Device token registration and management
- Queue-based notification delivery
- Retry mechanisms and error handling
- Different notification types (job alerts, application updates, interview reminders, etc.)

## Architecture

### Components

1. **PushService** (`src/modules/push/push.service.ts`)
   - Handles FCM and APNs initialization
   - Manages device token registration/unregistration
   - Sends push notifications to single or multiple devices
   - Handles batch sending and automatic retry logic
   - Marks invalid tokens automatically

2. **PushController** (`src/modules/push/push.controller.ts`)
   - REST API endpoints for device management and sending notifications
   - Swagger documentation included

3. **PushQueueProcessor** (`src/modules/push/processors/push-queue.processor.ts`)
   - Queue-based processing of push notifications
   - Handles different notification types with templates

4. **NotificationQueueProcessor** (`src/modules/queue/processors/notification-queue.processor.ts`)
   - Integrated with PushService to send push notifications
   - Processes notifications from the main notification queue

5. **PushNotificationTemplates** (`src/modules/push/templates/notification-templates.ts`)
   - Pre-built notification templates for common scenarios
   - Consistent formatting across notification types

## Setup

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Firebase Cloud Messaging (FCM)
FCM_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'

# Apple Push Notification Service (APNs)
APNS_KEY_ID=YOUR_KEY_ID
APNS_TEAM_ID=YOUR_TEAM_ID
APNS_KEY='-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----'
APNS_PRODUCTION=false
```

### 2. Firebase Setup (FCM)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Set the entire JSON content as the `FCM_SERVICE_ACCOUNT` environment variable

### 3. Apple Setup (APNs)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a new Key with APNs enabled
4. Download the `.p8` key file
5. Note the **Key ID** and **Team ID**
6. Set the environment variables:
   - `APNS_KEY_ID`: The Key ID (10 characters)
   - `APNS_TEAM_ID`: Your Team ID (10 characters)
   - `APNS_KEY`: Contents of the .p8 file (replace newlines with `\n`)
   - `APNS_PRODUCTION`: Set to `true` for production, `false` for development/sandbox

### 4. Database Migration

The device tokens are stored in the `device_tokens` table. Run the migration:

```bash
npm run migration:run
```

## Usage

### Registering a Device

When a user logs in on a device, register the device token:

```typescript
POST /push/register

{
  "userId": "user-uuid",
  "token": "device-token-from-fcm-or-apns",
  "platform": "ios" | "android" | "web",
  "deviceName": "John's iPhone",
  "deviceModel": "iPhone 14 Pro",
  "osVersion": "iOS 17.2",
  "appVersion": "1.2.3",
  "language": "en",
  "timezone": "America/New_York"
}
```

### Unregistering a Device

When a user logs out:

```typescript
DELETE /push/unregister

{
  "userId": "user-uuid",
  "token": "device-token"
}
```

### Sending Push Notifications

#### Option 1: Direct API Call

```typescript
POST /push/send

{
  "userIds": ["user-uuid-1", "user-uuid-2"],
  "notification": {
    "title": "New Job Match!",
    "body": "Software Engineer at Google in Mountain View",
    "clickAction": "/jobs/123",
    "icon": "/icons/job-match.png",
    "sound": "default",
    "badge": 1,
    "data": {
      "jobId": "123",
      "companyName": "Google"
    }
  },
  "category": "job_match",
  "priority": "high",
  "ttl": 86400
}
```

#### Option 2: Using Queue (Recommended)

```typescript
// In your service
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {}

  async sendJobMatchNotification(userId: string, job: Job) {
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

#### Option 3: Using Templates

```typescript
import { PushNotificationTemplates } from './templates/notification-templates';

// Create a template
const template = PushNotificationTemplates.jobMatch({
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  location: 'Mountain View, CA',
  jobId: 'job-123',
});

// Convert to payload and send
const dto: SendPushNotificationDto = {
  userIds: [userId],
  notification: PushNotificationTemplates.toPayload(template),
  category: template.category,
  priority: 'high',
};

await this.pushService.sendPushNotification(dto);
```

### Available Templates

1. **jobMatch** - New job matches user preferences
2. **multipleJobMatches** - Multiple jobs match
3. **applicationStatusUpdate** - Application status changes
4. **interviewReminder** - Interview reminder before scheduled time
5. **interviewScheduled** - Interview has been scheduled
6. **messageReceived** - User receives a message
7. **systemAnnouncement** - System-wide announcements
8. **accountAlert** - Account-related notifications
9. **profileView** - Profile view notifications
10. **resumeUpdated** - Resume analysis complete
11. **autoApplyComplete** - Auto-apply batch complete

### Queue Jobs

The push notification queue supports several job types:

1. **send-push** - Generic push notification
2. **send-job-match-push** - Job match notification
3. **send-application-status-push** - Application status update
4. **send-interview-reminder-push** - Interview reminder
5. **send-message-push** - Message notification
6. **send-bulk-push** - Bulk notifications to multiple users

Example:

```typescript
// Job match notification
await this.pushQueue.add('send-job-match-push', {
  userId: 'user-uuid',
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  location: 'Mountain View',
  jobId: 'job-123',
});

// Application status update
await this.pushQueue.add('send-application-status-push', {
  userId: 'user-uuid',
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  status: 'interview',
  applicationId: 'app-123',
});

// Interview reminder
await this.pushQueue.add('send-interview-reminder-push', {
  userId: 'user-uuid',
  jobTitle: 'Software Engineer',
  companyName: 'Google',
  interviewDate: '2024-01-15',
  interviewTime: '2:00 PM',
  interviewType: 'Phone Screen',
  applicationId: 'app-123',
});
```

## Notification Categories

- `job_match` - Job matching notifications
- `application_update` - Application status changes
- `interview_reminder` - Interview reminders
- `message` - Direct messages
- `system_announcement` - System announcements
- `account` - Account-related notifications

## Error Handling

The service automatically handles:

1. **Invalid Tokens**: Automatically marked as invalid in the database
2. **Failed Deliveries**: Logged with detailed error messages
3. **Platform-Specific Errors**: Handled separately for FCM and APNs
4. **Batch Failures**: Partial success reporting

### Monitoring Failed Notifications

Check the logs for:
- Failed device tokens
- Invalid credentials
- Network errors
- Platform-specific errors

### Cleanup

Remove inactive devices:

```typescript
POST /push/cleanup
```

This removes devices inactive for 90+ days.

## Best Practices

1. **Always use templates** for consistent messaging
2. **Use queues** for better performance and retry logic
3. **Set appropriate TTL** for time-sensitive notifications
4. **Use high priority** only for critical notifications
5. **Include deep links** in `clickAction` for better UX
6. **Test with sandbox** environments before production
7. **Monitor invalid tokens** and clean up regularly
8. **Respect user preferences** - check notification settings
9. **Localize notifications** based on user language
10. **Batch notifications** when sending to multiple users

## Testing

### Test Device Registration

```bash
curl -X POST http://localhost:8007/push/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "token": "test-token",
    "platform": "android",
    "deviceName": "Test Device"
  }'
```

### Test Sending Notification

```bash
curl -X POST http://localhost:8007/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["test-user"],
    "notification": {
      "title": "Test Notification",
      "body": "This is a test",
      "sound": "default"
    },
    "priority": "normal"
  }'
```

### Get User Devices

```bash
curl http://localhost:8007/push/devices/test-user
```

## Troubleshooting

### FCM Issues

1. **FCM not initialized**: Check `FCM_SERVICE_ACCOUNT` is set correctly
2. **Invalid credentials**: Verify the service account JSON
3. **Token errors**: Ensure client apps are using correct sender ID

### APNs Issues

1. **APNs not initialized**: Check all APNs environment variables
2. **Certificate errors**: Verify .p8 key is correct and not expired
3. **Production vs Sandbox**: Ensure `APNS_PRODUCTION` matches your build

### General Issues

1. **No devices found**: User hasn't registered any devices
2. **All sends failing**: Check credentials and network connectivity
3. **Partial failures**: Normal - some tokens may be invalid

## API Reference

### Endpoints

- `POST /push/register` - Register device token
- `DELETE /push/unregister` - Unregister device token
- `GET /push/devices/:userId` - Get user's devices
- `POST /push/send` - Send push notification
- `POST /push/cleanup` - Clean up inactive devices

### DTOs

- `RegisterDeviceDto` - Device registration data
- `UnregisterDeviceDto` - Device unregistration data
- `SendPushNotificationDto` - Push notification data
- `PushNotificationPayloadDto` - Notification payload

See Swagger docs at `http://localhost:8007/api` for detailed API documentation.

## Performance Considerations

1. **Batch Sending**: FCM supports up to 500 tokens per request
2. **Rate Limiting**: APNs has connection limits
3. **Queue Processing**: Adjust concurrency based on load
4. **Database Indexing**: Indexes on userId, platform, and token
5. **Cleanup Schedule**: Run cleanup job weekly

## Security

1. **Credential Storage**: Store FCM/APNs credentials securely
2. **Token Validation**: Validate device tokens before storage
3. **User Authorization**: Verify user owns device before registration
4. **Rate Limiting**: Implement rate limiting on registration endpoints
5. **Encryption**: Use HTTPS for all API calls

## Integration with Other Services

### Job Service

```typescript
// When new job matches user
await this.pushQueue.add('send-job-match-push', {
  userId,
  jobTitle,
  companyName,
  location,
  jobId,
});
```

### Application Service

```typescript
// When application status changes
await this.pushQueue.add('send-application-status-push', {
  userId,
  jobTitle,
  companyName,
  status,
  applicationId,
});
```

### Scheduler Service

```typescript
// Daily digest
await this.pushQueue.add('send-bulk-push', {
  userIds: activeUserIds,
  title: 'Daily Job Digest',
  message: `${jobCount} new jobs match your preferences`,
  actionUrl: '/jobs',
});
```

## Migration from Legacy System

If migrating from an existing push notification system:

1. Export existing device tokens
2. Map to new schema (userId, token, platform)
3. Import using bulk insert or API
4. Update client apps to use new registration endpoint
5. Gradually migrate notification sending logic

## Future Enhancements

Potential improvements:

1. Web Push VAPID keys support
2. Notification scheduling
3. A/B testing for notifications
4. Analytics and tracking
5. Rich notifications with images/actions
6. Notification grouping
7. Silent notifications
8. Badge management
9. User segmentation
10. Notification preferences per category

## Support

For issues or questions:
1. Check logs in the service
2. Review Swagger documentation
3. Consult FCM/APNs official documentation
4. Contact the platform team

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
- [NestJS Bull Queue Documentation](https://docs.nestjs.com/techniques/queues)
