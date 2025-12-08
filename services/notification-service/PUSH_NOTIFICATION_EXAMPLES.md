# Push Notification Examples

This document provides practical examples for implementing push notifications in the Job-Apply-Platform.

## Table of Contents

1. [Device Registration](#device-registration)
2. [Sending Notifications](#sending-notifications)
3. [Using Templates](#using-templates)
4. [Queue Integration](#queue-integration)
5. [Service Integration Examples](#service-integration-examples)

## Device Registration

### Example 1: Register iOS Device

```typescript
import { PushService } from './modules/push/push.service';
import { DevicePlatform } from './modules/push/entities/device-token.entity';

// In your authentication service or controller
async registerUserDevice(userId: string, fcmToken: string, deviceInfo: any) {
  await this.pushService.registerDevice({
    userId,
    token: fcmToken,
    platform: DevicePlatform.IOS,
    deviceName: deviceInfo.name || 'iPhone',
    deviceModel: deviceInfo.model || 'iPhone 14',
    osVersion: deviceInfo.osVersion || 'iOS 17.2',
    appVersion: deviceInfo.appVersion || '1.0.0',
    language: deviceInfo.language || 'en',
    timezone: deviceInfo.timezone || 'America/New_York',
  });
}
```

### Example 2: Register Android Device

```typescript
async registerAndroidDevice(userId: string, fcmToken: string) {
  await this.pushService.registerDevice({
    userId,
    token: fcmToken,
    platform: DevicePlatform.ANDROID,
    deviceName: 'Samsung Galaxy S23',
    deviceModel: 'SM-S911U',
    osVersion: 'Android 14',
    appVersion: '1.0.0',
    language: 'en',
    timezone: 'America/Los_Angeles',
  });
}
```

### Example 3: Register Web Device

```typescript
async registerWebDevice(userId: string, fcmToken: string) {
  await this.pushService.registerDevice({
    userId,
    token: fcmToken,
    platform: DevicePlatform.WEB,
    deviceName: 'Chrome Browser',
    deviceModel: 'Desktop',
    osVersion: 'Windows 11',
    appVersion: '1.0.0',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}
```

### Example 4: Handle Device Unregistration on Logout

```typescript
async handleUserLogout(userId: string, deviceToken: string) {
  await this.pushService.unregisterDevice({
    userId,
    token: deviceToken,
  });
}
```

## Sending Notifications

### Example 5: Send Simple Notification

```typescript
import { SendPushNotificationDto } from './modules/push/dto';

async sendSimpleNotification(userId: string) {
  const dto: SendPushNotificationDto = {
    userIds: [userId],
    notification: {
      title: 'Welcome!',
      body: 'Thanks for joining JobPilot',
      sound: 'default',
      badge: 1,
    },
    priority: 'normal',
  };

  const results = await this.pushService.sendPushNotification(dto);
  console.log('Notification sent:', results);
}
```

### Example 6: Send Notification with Deep Link

```typescript
async sendNotificationWithDeepLink(userId: string, jobId: string) {
  const dto: SendPushNotificationDto = {
    userIds: [userId],
    notification: {
      title: 'New Job Match!',
      body: 'Software Engineer at Google',
      clickAction: `/jobs/${jobId}`,
      icon: '/icons/job-match.png',
      sound: 'default',
      badge: 1,
      data: {
        jobId,
        type: 'job_match',
      },
    },
    category: PushNotificationCategory.JOB_MATCH,
    priority: 'high',
    ttl: 86400, // 24 hours
  };

  await this.pushService.sendPushNotification(dto);
}
```

### Example 7: Send Bulk Notification

```typescript
async sendBulkNotification(userIds: string[], announcement: string) {
  const dto: SendPushNotificationDto = {
    userIds,
    notification: {
      title: 'Platform Update',
      body: announcement,
      icon: '/icons/announcement.png',
      sound: 'default',
    },
    category: PushNotificationCategory.SYSTEM_ANNOUNCEMENT,
    priority: 'normal',
  };

  const results = await this.pushService.sendPushNotification(dto);

  const successCount = results.filter(r => r.success).length;
  console.log(`Sent to ${successCount}/${userIds.length} users`);

  return results;
}
```

### Example 8: Send Silent Notification

```typescript
async sendSilentDataSync(userId: string, data: any) {
  const dto: SendPushNotificationDto = {
    userIds: [userId],
    notification: {
      title: '',
      body: '',
      data,
    },
    silent: true,
    priority: 'normal',
  };

  await this.pushService.sendPushNotification(dto);
}
```

## Using Templates

### Example 9: Job Match Notification

```typescript
import { PushNotificationTemplates } from './modules/push/templates';

async notifyJobMatch(userId: string, job: any) {
  const template = PushNotificationTemplates.jobMatch({
    jobTitle: job.title,
    companyName: job.company,
    location: job.location,
    jobId: job.id,
  });

  const dto: SendPushNotificationDto = {
    userIds: [userId],
    notification: PushNotificationTemplates.toPayload(template),
    category: template.category,
    priority: 'high',
  };

  await this.pushService.sendPushNotification(dto);
}
```

### Example 10: Application Status Update

```typescript
async notifyApplicationUpdate(userId: string, application: any) {
  const template = PushNotificationTemplates.applicationStatusUpdate({
    jobTitle: application.jobTitle,
    companyName: application.companyName,
    status: application.status,
    applicationId: application.id,
  });

  const dto: SendPushNotificationDto = {
    userIds: [userId],
    notification: PushNotificationTemplates.toPayload(template),
    category: template.category,
    priority: 'high',
  };

  await this.pushService.sendPushNotification(dto);
}
```

### Example 11: Interview Reminder

```typescript
async sendInterviewReminder(userId: string, interview: any) {
  const template = PushNotificationTemplates.interviewReminder({
    jobTitle: interview.jobTitle,
    companyName: interview.companyName,
    interviewDate: interview.date,
    interviewTime: interview.time,
    interviewType: interview.type,
    applicationId: interview.applicationId,
  });

  const dto: SendPushNotificationDto = {
    userIds: [userId],
    notification: PushNotificationTemplates.toPayload(template),
    category: template.category,
    priority: 'high',
    ttl: 3600, // 1 hour
  };

  await this.pushService.sendPushNotification(dto);
}
```

### Example 12: Resume Updated Notification

```typescript
async notifyResumeAnalyzed(userId: string, resume: any) {
  const template = PushNotificationTemplates.resumeUpdated({
    resumeName: resume.name,
    score: resume.score,
  });

  const dto: SendPushNotificationDto = {
    userIds: [userId],
    notification: PushNotificationTemplates.toPayload(template),
    category: template.category,
    priority: 'normal',
  };

  await this.pushService.sendPushNotification(dto);
}
```

## Queue Integration

### Example 13: Queue Job Match Notification

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class JobMatchingService {
  constructor(
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {}

  async processJobMatch(userId: string, job: any) {
    // Add to queue for async processing
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

### Example 14: Queue Application Status Update

```typescript
async updateApplicationStatus(applicationId: string, newStatus: string) {
  const application = await this.getApplication(applicationId);

  // Update database
  await this.applicationsRepository.update(applicationId, { status: newStatus });

  // Queue push notification
  await this.pushQueue.add('send-application-status-push', {
    userId: application.userId,
    jobTitle: application.jobTitle,
    companyName: application.companyName,
    status: newStatus,
    applicationId,
  });
}
```

### Example 15: Queue Interview Reminder

```typescript
async scheduleInterviewReminder(interview: any) {
  // Calculate when to send reminder (e.g., 1 hour before)
  const reminderTime = new Date(interview.scheduledAt);
  reminderTime.setHours(reminderTime.getHours() - 1);

  const delay = reminderTime.getTime() - Date.now();

  if (delay > 0) {
    await this.pushQueue.add(
      'send-interview-reminder-push',
      {
        userId: interview.userId,
        jobTitle: interview.jobTitle,
        companyName: interview.companyName,
        interviewDate: interview.date,
        interviewTime: interview.time,
        interviewType: interview.type,
        applicationId: interview.applicationId,
      },
      {
        delay, // Delay in milliseconds
      }
    );
  }
}
```

### Example 16: Queue Bulk Notifications

```typescript
async sendDailyDigest() {
  const users = await this.getActiveUsers();

  for (const user of users) {
    const jobMatches = await this.getJobMatchesForUser(user.id);

    if (jobMatches.length > 0) {
      await this.pushQueue.add('send-bulk-push', {
        userIds: [user.id],
        title: 'Daily Job Digest',
        message: `${jobMatches.length} new jobs match your preferences`,
        actionUrl: '/jobs',
      });
    }
  }
}
```

## Service Integration Examples

### Example 17: Job Service Integration

```typescript
// job-service/src/modules/jobs/jobs.service.ts

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {}

  async createJob(jobData: CreateJobDto) {
    const job = await this.jobsRepository.save(jobData);

    // Find matching users
    const matchingUsers = await this.findMatchingUsers(job);

    // Send notifications to matching users
    for (const user of matchingUsers) {
      await this.pushQueue.add('send-job-match-push', {
        userId: user.id,
        jobTitle: job.title,
        companyName: job.company,
        location: job.location,
        jobId: job.id,
      });
    }

    return job;
  }
}
```

### Example 18: Application Service Integration

```typescript
// auto-apply-service/src/modules/applications/applications.service.ts

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {}

  async submitApplication(applicationData: CreateApplicationDto) {
    const application = await this.applicationsRepository.save(applicationData);

    // Notify user of successful submission
    await this.pushQueue.add('send-application-status-push', {
      userId: application.userId,
      jobTitle: application.jobTitle,
      companyName: application.companyName,
      status: 'submitted',
      applicationId: application.id,
    });

    return application;
  }

  async updateApplicationStatus(id: string, status: string) {
    const application = await this.applicationsRepository.findOne({ where: { id } });

    application.status = status;
    await this.applicationsRepository.save(application);

    // Notify user of status change
    await this.pushQueue.add('send-application-status-push', {
      userId: application.userId,
      jobTitle: application.jobTitle,
      companyName: application.companyName,
      status,
      applicationId: id,
    });
  }
}
```

### Example 19: Resume Service Integration

```typescript
// resume-service/src/modules/resumes/resumes.service.ts

@Injectable()
export class ResumesService {
  constructor(
    @InjectQueue('push-notifications') private pushQueue: Queue,
    private readonly aiService: AiService,
  ) {}

  async analyzeResume(resumeId: string, userId: string) {
    const resume = await this.resumesRepository.findOne({ where: { id: resumeId } });

    // Analyze resume with AI
    const analysis = await this.aiService.analyzeResume(resume.content);

    // Update resume with score
    resume.score = analysis.score;
    await this.resumesRepository.save(resume);

    // Notify user
    await this.pushQueue.add('send-push', {
      userIds: [userId],
      notification: {
        title: 'Resume Analysis Complete',
        body: `Your resume "${resume.name}" scored ${analysis.score}/100`,
        clickAction: '/resumes',
        icon: '/icons/resume.png',
        sound: 'default',
        badge: 1,
        data: {
          resumeId,
          score: analysis.score,
        },
      },
      category: 'account',
      priority: 'normal',
    });
  }
}
```

### Example 20: Scheduled Notifications with Cron

```typescript
// notification-service/src/modules/scheduler/scheduler.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectQueue('push-notifications') private pushQueue: Queue,
    private readonly usersService: UsersService,
    private readonly jobsService: JobsService,
  ) {}

  // Send daily digest at 9 AM
  @Cron('0 9 * * *')
  async sendDailyDigest() {
    const users = await this.usersService.getActiveUsers();

    for (const user of users) {
      const newJobs = await this.jobsService.getNewJobsForUser(user.id, 24); // Last 24 hours

      if (newJobs.length > 0) {
        const topJob = newJobs[0];

        await this.pushQueue.add('send-push', {
          userIds: [user.id],
          notification: {
            title: 'Daily Job Digest',
            body: `${newJobs.length} new jobs including ${topJob.title} at ${topJob.company}`,
            clickAction: '/jobs',
            icon: '/icons/job-match.png',
            sound: 'default',
            badge: newJobs.length,
            data: {
              jobCount: newJobs.length,
            },
          },
          category: 'job_match',
          priority: 'normal',
        });
      }
    }
  }

  // Send interview reminders every hour
  @Cron(CronExpression.EVERY_HOUR)
  async sendInterviewReminders() {
    const upcomingInterviews = await this.getInterviewsInNextHour();

    for (const interview of upcomingInterviews) {
      await this.pushQueue.add('send-interview-reminder-push', {
        userId: interview.userId,
        jobTitle: interview.jobTitle,
        companyName: interview.companyName,
        interviewDate: interview.date,
        interviewTime: interview.time,
        interviewType: interview.type,
        applicationId: interview.applicationId,
      });
    }
  }

  // Clean up inactive devices weekly
  @Cron('0 2 * * 0') // 2 AM every Sunday
  async cleanupInactiveDevices() {
    const count = await this.pushService.cleanupInactiveDevices(90);
    console.log(`Cleaned up ${count} inactive devices`);
  }
}
```

### Example 21: Error Handling

```typescript
async sendNotificationWithErrorHandling(userId: string, notification: any) {
  try {
    const results = await this.pushService.sendPushNotification({
      userIds: [userId],
      notification,
      priority: 'normal',
    });

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    if (failedCount > 0) {
      // Log failed notifications
      const errors = results
        .filter(r => !r.success)
        .map(r => ({
          platform: r.platform,
          token: r.token,
          error: r.error,
        }));

      this.logger.warn('Some notifications failed:', errors);

      // Could implement retry logic here
      if (errors.some(e => !e.error?.includes('invalid'))) {
        // Retry for non-invalid token errors
        await this.retryFailedNotifications(userId, notification, errors);
      }
    }

    return { successCount, failedCount };
  } catch (error) {
    this.logger.error('Failed to send notification:', error);
    throw error;
  }
}

private async retryFailedNotifications(userId: string, notification: any, errors: any[]) {
  // Implement retry logic with exponential backoff
  await this.pushQueue.add(
    'send-push',
    {
      userIds: [userId],
      notification,
      priority: 'normal',
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
}
```

### Example 22: User Preferences

```typescript
async sendNotificationIfEnabled(userId: string, category: string, notification: any) {
  // Check user preferences
  const preferences = await this.notificationsService.getPreferences(userId);

  // Check if push notifications are enabled for this category
  const categoryKey = `push${category.charAt(0).toUpperCase() + category.slice(1)}`;

  if (!preferences.pushEnabled || !preferences[categoryKey]) {
    this.logger.log(`Push notifications disabled for user ${userId}, category ${category}`);
    return;
  }

  // Send notification
  await this.pushService.sendPushNotification({
    userIds: [userId],
    notification,
    category,
    priority: 'normal',
  });
}
```

### Example 23: A/B Testing

```typescript
async sendVariantNotification(userId: string, job: any) {
  // Determine which variant to send (simplified A/B test)
  const variant = Math.random() < 0.5 ? 'A' : 'B';

  const notifications = {
    A: {
      title: 'New Job Match!',
      body: `${job.title} at ${job.company}`,
    },
    B: {
      title: 'Perfect Match Found!',
      body: `Check out ${job.title} at ${job.company}`,
    },
  };

  const notification = notifications[variant];

  await this.pushService.sendPushNotification({
    userIds: [userId],
    notification: {
      ...notification,
      clickAction: `/jobs/${job.id}`,
      icon: '/icons/job-match.png',
      sound: 'default',
      badge: 1,
      data: {
        jobId: job.id,
        variant, // Track which variant was sent
      },
    },
    category: 'job_match',
    priority: 'high',
  });

  // Log for analytics
  await this.analyticsService.trackNotificationVariant(userId, job.id, variant);
}
```

### Example 24: Localized Notifications

```typescript
async sendLocalizedNotification(userId: string, job: any) {
  const user = await this.usersService.findOne(userId);
  const locale = user.language || 'en';

  const translations = {
    en: {
      title: 'New Job Match!',
      body: `${job.title} at ${job.company}`,
    },
    es: {
      title: 'Nueva Coincidencia de Trabajo!',
      body: `${job.title} en ${job.company}`,
    },
    fr: {
      title: 'Nouvelle Correspondance d\'Emploi!',
      body: `${job.title} chez ${job.company}`,
    },
  };

  const notification = translations[locale] || translations['en'];

  await this.pushService.sendPushNotification({
    userIds: [userId],
    notification: {
      ...notification,
      clickAction: `/jobs/${job.id}`,
      icon: '/icons/job-match.png',
      sound: 'default',
      badge: 1,
      data: {
        jobId: job.id,
        locale,
      },
    },
    category: 'job_match',
    priority: 'high',
  });
}
```

### Example 25: Analytics and Tracking

```typescript
async sendNotificationWithTracking(userId: string, notification: any, context: any) {
  // Generate tracking ID
  const trackingId = this.generateTrackingId();

  // Send notification with tracking data
  const results = await this.pushService.sendPushNotification({
    userIds: [userId],
    notification: {
      ...notification,
      data: {
        ...notification.data,
        trackingId,
        sentAt: new Date().toISOString(),
      },
    },
    priority: 'normal',
  });

  // Track notification sent event
  await this.analyticsService.trackNotificationSent({
    trackingId,
    userId,
    category: context.category,
    platform: results.map(r => r.platform),
    success: results.every(r => r.success),
    sentAt: new Date(),
    context,
  });

  return trackingId;
}

// Track notification interaction (called from client)
async trackNotificationClick(trackingId: string, userId: string) {
  await this.analyticsService.trackNotificationClick({
    trackingId,
    userId,
    clickedAt: new Date(),
  });
}
```

## Best Practices Summary

1. Always use queues for sending notifications
2. Implement proper error handling and retry logic
3. Check user preferences before sending
4. Use templates for consistent messaging
5. Include deep links for better UX
6. Track notifications for analytics
7. Localize notifications based on user language
8. Set appropriate TTL for time-sensitive notifications
9. Use high priority sparingly
10. Clean up inactive devices regularly

## Testing

Test your notifications using the provided endpoints or create unit tests:

```typescript
describe('PushNotificationService', () => {
  it('should send job match notification', async () => {
    const result = await service.sendJobMatchNotification(
      'user-123',
      mockJob
    );

    expect(result.successCount).toBeGreaterThan(0);
  });

  it('should handle invalid tokens gracefully', async () => {
    // Mock invalid token scenario
    const result = await service.sendPushNotification({
      userIds: ['user-with-invalid-token'],
      notification: mockNotification,
      priority: 'normal',
    });

    expect(result.some(r => !r.success)).toBe(true);
  });
});
```
