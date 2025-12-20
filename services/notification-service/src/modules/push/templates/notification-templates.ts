import { PushNotificationPayloadDto, PushNotificationCategory } from '../dto';

export interface NotificationTemplate {
  category: PushNotificationCategory;
  title: string;
  body: string;
  icon?: string;
  sound?: string;
  clickAction?: string;
  data?: Record<string, any>;
}

export class PushNotificationTemplates {
  /**
   * Job Match Notification
   * Sent when a new job matches user's preferences
   */
  static jobMatch(data: {
    jobTitle: string;
    companyName: string;
    location: string;
    jobId: string;
  }): NotificationTemplate {
    return {
      category: PushNotificationCategory.JOB_MATCH,
      title: 'New Job Match!',
      body: `${data.jobTitle} at ${data.companyName} in ${data.location}`,
      icon: '/assets/icons/job-match.png',
      sound: 'default',
      clickAction: `/jobs/${data.jobId}`,
      data: {
        jobId: data.jobId,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
      },
    };
  }

  /**
   * Multiple Job Matches Notification
   * Sent when multiple jobs match user's preferences
   */
  static multipleJobMatches(data: { count: number }): NotificationTemplate {
    return {
      category: PushNotificationCategory.JOB_MATCH,
      title: 'New Job Matches!',
      body: `${data.count} new jobs match your preferences`,
      icon: '/assets/icons/job-match.png',
      sound: 'default',
      clickAction: '/jobs',
      data: {
        matchCount: data.count,
      },
    };
  }

  /**
   * Application Status Update
   * Sent when application status changes
   */
  static applicationStatusUpdate(data: {
    jobTitle: string;
    companyName: string;
    status: string;
    applicationId: string;
  }): NotificationTemplate {
    const statusMessages: Record<string, string> = {
      screening: 'is being reviewed',
      interview: 'has moved to the interview stage',
      offer: 'resulted in an offer!',
      rejected: 'has been closed',
      accepted: 'offer has been accepted',
    };

    const message =
      statusMessages[data.status] ||
      `status has been updated to ${data.status}`;

    return {
      category: PushNotificationCategory.APPLICATION_UPDATE,
      title: 'Application Update',
      body: `Your application for ${data.jobTitle} at ${data.companyName} ${message}`,
      icon: '/assets/icons/application-update.png',
      sound: 'default',
      clickAction: `/applications/${data.applicationId}`,
      data: {
        applicationId: data.applicationId,
        status: data.status,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
      },
    };
  }

  /**
   * Interview Reminder
   * Sent before an interview
   */
  static interviewReminder(data: {
    jobTitle: string;
    companyName: string;
    interviewDate: string;
    interviewTime: string;
    interviewType: string;
    applicationId: string;
  }): NotificationTemplate {
    return {
      category: PushNotificationCategory.INTERVIEW_REMINDER,
      title: 'Interview Reminder',
      body: `${data.interviewType} interview for ${data.jobTitle} at ${data.companyName} on ${data.interviewDate} at ${data.interviewTime}`,
      icon: '/assets/icons/interview.png',
      sound: 'default',
      clickAction: `/applications/${data.applicationId}`,
      data: {
        applicationId: data.applicationId,
        interviewDate: data.interviewDate,
        interviewTime: data.interviewTime,
        interviewType: data.interviewType,
      },
    };
  }

  /**
   * Interview Scheduled
   * Sent when an interview is scheduled
   */
  static interviewScheduled(data: {
    jobTitle: string;
    companyName: string;
    interviewDate: string;
    applicationId: string;
  }): NotificationTemplate {
    return {
      category: PushNotificationCategory.APPLICATION_UPDATE,
      title: 'Interview Scheduled',
      body: `Interview scheduled for ${data.jobTitle} at ${data.companyName} on ${data.interviewDate}`,
      icon: '/assets/icons/interview.png',
      sound: 'default',
      clickAction: `/applications/${data.applicationId}`,
      data: {
        applicationId: data.applicationId,
        interviewDate: data.interviewDate,
      },
    };
  }

  /**
   * Message Received
   * Sent when user receives a message
   */
  static messageReceived(data: {
    senderName: string;
    messagePreview: string;
    conversationId: string;
  }): NotificationTemplate {
    return {
      category: PushNotificationCategory.MESSAGE,
      title: `Message from ${data.senderName}`,
      body: data.messagePreview,
      icon: '/assets/icons/message.png',
      sound: 'default',
      clickAction: `/messages/${data.conversationId}`,
      data: {
        conversationId: data.conversationId,
        senderName: data.senderName,
      },
    };
  }

  /**
   * System Announcement
   * Sent for system-wide announcements
   */
  static systemAnnouncement(data: {
    title: string;
    message: string;
    actionUrl?: string;
  }): NotificationTemplate {
    return {
      category: PushNotificationCategory.SYSTEM_ANNOUNCEMENT,
      title: data.title,
      body: data.message,
      icon: '/assets/icons/announcement.png',
      sound: 'default',
      clickAction: data.actionUrl,
      data: {
        announcementType: 'system',
      },
    };
  }

  /**
   * Account Alert
   * Sent for account-related notifications
   */
  static accountAlert(data: {
    title: string;
    message: string;
    actionUrl?: string;
  }): NotificationTemplate {
    return {
      category: PushNotificationCategory.ACCOUNT,
      title: data.title,
      body: data.message,
      icon: '/assets/icons/account.png',
      sound: 'default',
      clickAction: data.actionUrl,
      data: {
        alertType: 'account',
      },
    };
  }

  /**
   * Profile View Notification
   * Sent when someone views user's profile
   */
  static profileView(data: {
    viewerCompany?: string;
    viewCount: number;
  }): NotificationTemplate {
    const message = data.viewerCompany
      ? `${data.viewerCompany} viewed your profile`
      : `Your profile has been viewed ${data.viewCount} times this week`;

    return {
      category: PushNotificationCategory.ACCOUNT,
      title: 'Profile View',
      body: message,
      icon: '/assets/icons/profile.png',
      sound: 'default',
      clickAction: '/profile',
      data: {
        viewCount: data.viewCount,
        viewerCompany: data.viewerCompany,
      },
    };
  }

  /**
   * Resume Updated
   * Sent when resume analysis is complete
   */
  static resumeUpdated(data: {
    resumeName: string;
    score?: number;
  }): NotificationTemplate {
    const message = data.score
      ? `Your resume "${data.resumeName}" has been analyzed (Score: ${data.score}/100)`
      : `Your resume "${data.resumeName}" has been updated`;

    return {
      category: PushNotificationCategory.ACCOUNT,
      title: 'Resume Updated',
      body: message,
      icon: '/assets/icons/resume.png',
      sound: 'default',
      clickAction: '/resumes',
      data: {
        resumeName: data.resumeName,
        score: data.score,
      },
    };
  }

  /**
   * Auto-Apply Complete
   * Sent when auto-apply batch is complete
   */
  static autoApplyComplete(data: {
    successCount: number;
    totalCount: number;
  }): NotificationTemplate {
    return {
      category: PushNotificationCategory.APPLICATION_UPDATE,
      title: 'Auto-Apply Complete',
      body: `Successfully applied to ${data.successCount} out of ${data.totalCount} jobs`,
      icon: '/assets/icons/auto-apply.png',
      sound: 'default',
      clickAction: '/applications',
      data: {
        successCount: data.successCount,
        totalCount: data.totalCount,
      },
    };
  }

  /**
   * Convert template to PushNotificationPayloadDto
   */
  static toPayload(template: NotificationTemplate): PushNotificationPayloadDto {
    return {
      title: template.title,
      body: template.body,
      clickAction: template.clickAction,
      icon: template.icon,
      sound: template.sound,
      data: template.data,
    };
  }
}
