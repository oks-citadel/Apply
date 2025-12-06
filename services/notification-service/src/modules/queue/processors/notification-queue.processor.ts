import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

export interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Processor('notifications')
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  @Process('create-notification')
  async handleCreateNotification(job: Job<NotificationJob>) {
    this.logger.log(`Processing notification job ${job.id} for user ${job.data.userId}`);

    try {
      const { userId, type, title, message, data } = job.data;

      // This would typically create a notification in the database
      // For now, we'll just log it
      this.logger.log(`Notification created: ${title} for user ${userId}`);

      return { success: true, userId };
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('send-push-notification')
  async handleSendPushNotification(job: Job<NotificationJob>) {
    this.logger.log(`Processing push notification job ${job.id} for user ${job.data.userId}`);

    try {
      const { userId, title, message, data } = job.data;

      // TODO: Implement actual push notification sending
      // This would integrate with FCM or APNs
      this.logger.log(`Push notification would be sent: ${title} to user ${userId}`);

      return { success: true, userId };
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
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
