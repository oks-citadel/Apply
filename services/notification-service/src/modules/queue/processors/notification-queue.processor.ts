import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { PushService } from '../../push/push.service';
import {
  SendPushNotificationDto,
  PushNotificationCategory,
} from '../../push/dto';

export interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface PushNotificationJobData {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  category?: PushNotificationCategory;
  clickAction?: string;
  icon?: string;
  image?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  ttl?: number;
  silent?: boolean;
}

@Processor('notifications')
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(
    @Inject(forwardRef(() => PushService))
    private readonly pushService: PushService,
  ) {}

  @Process('create-notification')
  async handleCreateNotification(job: Job<NotificationJob>) {
    this.logger.log(
      `Processing notification job ${job.id} for user ${job.data.userId}`,
    );

    try {
      const { userId, type, title, message, data } = job.data;

      // This would typically create a notification in the database
      // For now, we'll just log it
      this.logger.log(`Notification created: ${title} for user ${userId}`);

      return { success: true, userId };
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-push-notification')
  async handleSendPushNotification(job: Job<PushNotificationJobData>) {
    this.logger.log(
      `Processing push notification job ${job.id} for user ${job.data.userId}`,
    );

    try {
      const {
        userId,
        title,
        message,
        data,
        category,
        clickAction,
        icon,
        image,
        badge,
        sound,
        priority,
        ttl,
        silent,
      } = job.data;

      // Prepare push notification DTO
      const pushDto: SendPushNotificationDto = {
        userIds: [userId],
        notification: {
          title,
          body: message,
          clickAction,
          icon,
          image,
          badge,
          sound: sound || 'default',
          data,
        },
        category,
        priority: priority || 'normal',
        ttl,
        silent,
      };

      // Send push notification via Push Service
      const results = await this.pushService.sendPushNotification(pushDto);

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        const errors = results
          .filter((r) => !r.success)
          .map((r) => `${r.platform}:${r.token} - ${r.error}`)
          .join(', ');

        this.logger.warn(
          `Push notification partially sent for user ${userId}: ${successCount} success, ${failedCount} failed. Errors: ${errors}`,
        );
      } else {
        this.logger.log(
          `Push notification successfully sent to ${successCount} device(s) for user ${userId}`,
        );
      }

      return {
        success: successCount > 0,
        userId,
        totalSent: successCount,
        totalFailed: failedCount,
        results,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('send-bulk-push-notification')
  async handleSendBulkPushNotification(
    job: Job<Omit<PushNotificationJobData, 'userId'> & { userIds: string[] }>,
  ) {
    this.logger.log(
      `Processing bulk push notification job ${job.id} for ${job.data.userIds.length} users`,
    );

    try {
      const {
        userIds,
        title,
        message,
        data,
        category,
        clickAction,
        icon,
        image,
        badge,
        sound,
        priority,
        ttl,
        silent,
      } = job.data;

      // Prepare push notification DTO
      const pushDto: SendPushNotificationDto = {
        userIds,
        notification: {
          title,
          body: message,
          clickAction,
          icon,
          image,
          badge,
          sound: sound || 'default',
          data,
        },
        category,
        priority: priority || 'normal',
        ttl,
        silent,
      };

      // Send push notification via Push Service
      const results = await this.pushService.sendPushNotification(pushDto);

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.length - successCount;

      this.logger.log(
        `Bulk push notification sent to ${successCount}/${results.length} devices for ${userIds.length} users`,
      );

      return {
        success: true,
        userIds,
        totalSent: successCount,
        totalFailed: failedCount,
        results: results.map((r) => ({
          success: r.success,
          platform: r.platform,
          error: r.error,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send bulk push notification: ${error.message}`,
        error.stack,
      );
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
