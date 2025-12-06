import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PushService, PushResult } from '../push.service';
import { SendPushNotificationDto } from '../dto';
import { PushNotificationTemplates } from '../templates';

export interface PushNotificationJob {
  userIds: string[];
  notification: {
    title: string;
    body: string;
    clickAction?: string;
    icon?: string;
    image?: string;
    badge?: number;
    sound?: string;
    data?: Record<string, any>;
  };
  category?: string;
  ttl?: number;
  priority?: 'high' | 'normal';
  silent?: boolean;
}

export interface JobMatchPushJob {
  userId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobId: string;
}

export interface ApplicationStatusPushJob {
  userId: string;
  jobTitle: string;
  companyName: string;
  status: string;
  applicationId: string;
}

export interface InterviewReminderPushJob {
  userId: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
  applicationId: string;
}

export interface MessagePushJob {
  userId: string;
  senderName: string;
  messagePreview: string;
  conversationId: string;
}

export interface BulkPushJob {
  userIds: string[];
  title: string;
  message: string;
  actionUrl?: string;
}

@Processor('push-notifications')
export class PushQueueProcessor {
  private readonly logger = new Logger(PushQueueProcessor.name);

  constructor(private readonly pushService: PushService) {}

  @Process('send-push')
  async handleSendPush(job: Job<PushNotificationJob>) {
    this.logger.log(`Processing push notification job ${job.id} for ${job.data.userIds.length} users`);

    try {
      const dto: SendPushNotificationDto = {
        userIds: job.data.userIds,
        notification: job.data.notification,
        category: job.data.category as any,
        ttl: job.data.ttl,
        priority: job.data.priority,
        silent: job.data.silent,
      };

      const results = await this.pushService.sendPushNotification(dto);
      const successCount = results.filter((r) => r.success).length;

      this.logger.log(
        `Push notification sent: ${successCount}/${results.length} successful`,
      );

      return {
        success: true,
        totalSent: successCount,
        totalFailed: results.length - successCount,
        results,
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('send-job-match-push')
  async handleJobMatchPush(job: Job<JobMatchPushJob>) {
    this.logger.log(`Processing job match push job ${job.id} for user ${job.data.userId}`);

    try {
      const template = PushNotificationTemplates.jobMatch({
        jobTitle: job.data.jobTitle,
        companyName: job.data.companyName,
        location: job.data.location,
        jobId: job.data.jobId,
      });

      const dto: SendPushNotificationDto = {
        userIds: [job.data.userId],
        notification: PushNotificationTemplates.toPayload(template),
        category: template.category,
        priority: 'high',
      };

      const results = await this.pushService.sendPushNotification(dto);
      this.logger.log(`Job match push sent to user ${job.data.userId}`);

      return { success: true, results };
    } catch (error) {
      this.logger.error(`Failed to send job match push: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('send-application-status-push')
  async handleApplicationStatusPush(job: Job<ApplicationStatusPushJob>) {
    this.logger.log(
      `Processing application status push job ${job.id} for user ${job.data.userId}`,
    );

    try {
      const template = PushNotificationTemplates.applicationStatusUpdate({
        jobTitle: job.data.jobTitle,
        companyName: job.data.companyName,
        status: job.data.status,
        applicationId: job.data.applicationId,
      });

      const dto: SendPushNotificationDto = {
        userIds: [job.data.userId],
        notification: PushNotificationTemplates.toPayload(template),
        category: template.category,
        priority: 'high',
      };

      const results = await this.pushService.sendPushNotification(dto);
      this.logger.log(`Application status push sent to user ${job.data.userId}`);

      return { success: true, results };
    } catch (error) {
      this.logger.error(
        `Failed to send application status push: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-interview-reminder-push')
  async handleInterviewReminderPush(job: Job<InterviewReminderPushJob>) {
    this.logger.log(
      `Processing interview reminder push job ${job.id} for user ${job.data.userId}`,
    );

    try {
      const template = PushNotificationTemplates.interviewReminder({
        jobTitle: job.data.jobTitle,
        companyName: job.data.companyName,
        interviewDate: job.data.interviewDate,
        interviewTime: job.data.interviewTime,
        interviewType: job.data.interviewType,
        applicationId: job.data.applicationId,
      });

      const dto: SendPushNotificationDto = {
        userIds: [job.data.userId],
        notification: PushNotificationTemplates.toPayload(template),
        category: template.category,
        priority: 'high',
      };

      const results = await this.pushService.sendPushNotification(dto);
      this.logger.log(`Interview reminder push sent to user ${job.data.userId}`);

      return { success: true, results };
    } catch (error) {
      this.logger.error(
        `Failed to send interview reminder push: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-message-push')
  async handleMessagePush(job: Job<MessagePushJob>) {
    this.logger.log(`Processing message push job ${job.id} for user ${job.data.userId}`);

    try {
      const template = PushNotificationTemplates.messageReceived({
        senderName: job.data.senderName,
        messagePreview: job.data.messagePreview,
        conversationId: job.data.conversationId,
      });

      const dto: SendPushNotificationDto = {
        userIds: [job.data.userId],
        notification: PushNotificationTemplates.toPayload(template),
        category: template.category,
        priority: 'high',
      };

      const results = await this.pushService.sendPushNotification(dto);
      this.logger.log(`Message push sent to user ${job.data.userId}`);

      return { success: true, results };
    } catch (error) {
      this.logger.error(`Failed to send message push: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('send-bulk-push')
  async handleBulkPush(job: Job<BulkPushJob>) {
    this.logger.log(
      `Processing bulk push job ${job.id} for ${job.data.userIds.length} users`,
    );

    try {
      const template = PushNotificationTemplates.systemAnnouncement({
        title: job.data.title,
        message: job.data.message,
        actionUrl: job.data.actionUrl,
      });

      const dto: SendPushNotificationDto = {
        userIds: job.data.userIds,
        notification: PushNotificationTemplates.toPayload(template),
        category: template.category,
        priority: 'normal',
      };

      const results = await this.pushService.sendPushNotification(dto);
      const successCount = results.filter((r) => r.success).length;

      this.logger.log(
        `Bulk push sent: ${successCount}/${results.length} successful`,
      );

      return {
        success: true,
        totalSent: successCount,
        totalFailed: results.length - successCount,
      };
    } catch (error) {
      this.logger.error(`Failed to send bulk push: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Queue error: ${error.message}`, error.stack);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed with error: ${error.message}`,
      error.stack,
    );
  }
}
