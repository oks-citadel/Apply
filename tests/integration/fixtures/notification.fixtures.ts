/**
 * Notification test fixtures
 * Provides test data for notification-related tests
 */

export interface NotificationFixture {
  userId: string;
  type: string;
  channel: 'email' | 'push' | 'sms' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export const notificationTypes = {
  JOB_MATCH: 'job_match',
  APPLICATION_STATUS: 'application_status',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  RESUME_FEEDBACK: 'resume_feedback',
  SYSTEM_ALERT: 'system_alert',
  ACCOUNT_UPDATE: 'account_update',
};

export const testNotifications: Partial<NotificationFixture>[] = [
  {
    type: notificationTypes.JOB_MATCH,
    channel: 'email',
    title: 'New Job Match Found!',
    message: 'We found a job that matches your profile: Senior Software Engineer at Tech Corp',
    priority: 'normal',
    data: {
      jobId: 'job-123',
      matchScore: 0.85,
    },
  },
  {
    type: notificationTypes.APPLICATION_STATUS,
    channel: 'push',
    title: 'Application Status Update',
    message: 'Your application for Frontend Developer has been reviewed',
    priority: 'high',
    data: {
      applicationId: 'app-456',
      status: 'under_review',
    },
  },
  {
    type: notificationTypes.INTERVIEW_SCHEDULED,
    channel: 'email',
    title: 'Interview Scheduled',
    message: 'Your interview for DevOps Engineer is scheduled for tomorrow at 2:00 PM',
    priority: 'urgent',
    data: {
      applicationId: 'app-789',
      interviewDate: '2025-01-15T14:00:00Z',
      interviewType: 'video',
    },
  },
  {
    type: notificationTypes.RESUME_FEEDBACK,
    channel: 'in-app',
    title: 'Resume Optimization Complete',
    message: 'Your resume has been optimized with AI suggestions',
    priority: 'normal',
    data: {
      resumeId: 'resume-321',
      improvementScore: 0.75,
    },
  },
];

export const getTestNotification = (index: number = 0): Partial<NotificationFixture> => {
  return testNotifications[index] || testNotifications[0];
};

export const createNotificationPayload = (
  userId: string,
  overrides?: Partial<NotificationFixture>
): Partial<NotificationFixture> => {
  const baseNotification: Partial<NotificationFixture> = {
    userId,
    type: notificationTypes.SYSTEM_ALERT,
    channel: 'in-app',
    title: 'Test Notification',
    message: 'This is a test notification message.',
    priority: 'normal',
  };

  return { ...baseNotification, ...overrides };
};
