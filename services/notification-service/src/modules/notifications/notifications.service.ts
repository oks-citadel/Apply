import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  SendEmailDto,
  SendPushDto,
} from './dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    return await this.notificationRepository.save(notification);
  }

  async findAll(
    query: QueryNotificationsDto,
  ): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
    const { userId, type, status, category, isRead, page = 1, limit = 20 } = query;

    const where: FindOptionsWhere<Notification> = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (category) where.category = category;
    if (isRead !== undefined) where.isRead = isRead;

    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async findByUserId(userId: string, limit = 50): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);

    notification.isRead = true;
    notification.readAt = new Date();

    if (notification.status === NotificationStatus.SENT) {
      notification.status = NotificationStatus.READ;
    }

    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return { updated: result.affected || 0 };
  }

  async delete(id: string): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }

  async deleteOld(daysOld: number = 30): Promise<{ deleted: number }> {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :date', { date })
      .andWhere('is_read = :isRead', { isRead: true })
      .execute();

    return { deleted: result.affected || 0 };
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<Notification> {
    const { to, subject, body, template, templateData, userId, metadata } =
      sendEmailDto;

    try {
      // Create notification record
      const notification = await this.create({
        userId: userId || 'system',
        type: NotificationType.EMAIL,
        title: subject,
        message: body.substring(0, 500), // Store preview
        data: { to, template, templateData, metadata },
        category: 'email',
      });

      // Send email
      let result;
      if (template && templateData) {
        // Use template-based email
        result = await this.emailService.sendTemplatedEmail(
          to,
          subject,
          template,
          templateData,
        );
      } else {
        // Send plain email
        result = await this.emailService.sendEmail(to, subject, body);
      }

      // Update notification status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      this.logger.log(`Email sent successfully to ${to}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error.message);

      // Update notification with failure
      const notification = await this.notificationRepository.findOne({
        where: {
          userId: userId || 'system',
          data: { to } as any,
        },
        order: { createdAt: 'DESC' },
      });

      if (notification) {
        notification.status = NotificationStatus.FAILED;
        notification.failedReason = error.message;
        await this.notificationRepository.save(notification);
      }

      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }

  async sendPush(sendPushDto: SendPushDto): Promise<Notification> {
    const { userId, title, message, actionUrl, data, icon, image } = sendPushDto;

    try {
      // Create notification record
      const notification = await this.create({
        userId,
        type: NotificationType.PUSH,
        title,
        message,
        actionUrl,
        data: { ...data, icon, image },
        category: 'push',
      });

      // TODO: Implement actual push notification sending
      // This is a placeholder for future implementation
      // You would integrate with services like Firebase Cloud Messaging (FCM)
      // or Apple Push Notification service (APNs)

      this.logger.log(`Push notification placeholder for user ${userId}: ${title}`);

      // Mark as sent (for now, since it's a placeholder)
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      return notification;
    } catch (error) {
      this.logger.error(`Failed to send push notification:`, error.message);
      throw new BadRequestException(
        `Failed to send push notification: ${error.message}`,
      );
    }
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    failedReason?: string,
  ): Promise<Notification> {
    const notification = await this.findOne(id);

    notification.status = status;

    if (status === NotificationStatus.SENT) {
      notification.sentAt = new Date();
    }

    if (status === NotificationStatus.FAILED && failedReason) {
      notification.failedReason = failedReason;
      notification.retryCount += 1;
    }

    return await this.notificationRepository.save(notification);
  }
}
