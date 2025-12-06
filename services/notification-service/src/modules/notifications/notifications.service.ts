import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  SendEmailDto,
  SendPushDto,
  UpdatePreferencesDto,
} from './dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreferences)
    private readonly preferencesRepository: Repository<NotificationPreferences>,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
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

  // Preference Management
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
      });
      await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<NotificationPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
        ...updatePreferencesDto,
      });
    } else {
      Object.assign(preferences, updatePreferencesDto);
    }

    return await this.preferencesRepository.save(preferences);
  }

  private async checkPreferences(
    userId: string,
    preferenceType: string,
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);
    return preferences[preferenceType] ?? true;
  }

  // Email sending with queue
  async sendEmail(sendEmailDto: SendEmailDto): Promise<Notification> {
    const { to, subject, body, template, templateData, userId, metadata } =
      sendEmailDto;

    try {
      // Check preferences if userId is provided
      if (userId) {
        const emailEnabled = await this.checkPreferences(userId, 'emailEnabled');
        if (!emailEnabled) {
          this.logger.warn(`Email notifications disabled for user ${userId}`);
          throw new BadRequestException('Email notifications are disabled for this user');
        }
      }

      // Create notification record
      const notification = await this.create({
        userId: userId || 'system',
        type: NotificationType.EMAIL,
        title: subject,
        message: body.substring(0, 500), // Store preview
        data: { to, template, templateData, metadata },
        category: 'email',
      });

      // Queue email for async processing
      await this.emailQueue.add('send-email', {
        to,
        subject,
        body,
        template,
        templateData,
        isHtml: true,
      });

      // Update notification status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      this.logger.log(`Email queued successfully to ${to}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to queue email to ${to}:`, error.message);
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    userId: string,
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);

    if (!preferences.emailEnabled || !preferences.emailWelcome) {
      this.logger.warn(`Welcome email disabled for user ${userId}`);
      return;
    }

    await this.emailQueue.add('send-welcome-email', {
      email,
      name,
      userId,
    });

    this.logger.log(`Welcome email queued for ${email}`);
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
    userId: string,
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);

    if (!preferences.emailEnabled || !preferences.emailVerification) {
      this.logger.warn(`Verification email disabled for user ${userId}`);
      return;
    }

    await this.emailQueue.add('send-verification-email', {
      email,
      name,
      verificationToken,
    });

    this.logger.log(`Verification email queued for ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
    userId: string,
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);

    if (!preferences.emailEnabled || !preferences.emailPasswordReset) {
      this.logger.warn(`Password reset email disabled for user ${userId}`);
      return;
    }

    await this.emailQueue.add('send-password-reset-email', {
      email,
      name,
      resetToken,
    });

    this.logger.log(`Password reset email queued for ${email}`);
  }

  async sendApplicationStatusEmail(
    email: string,
    name: string,
    jobTitle: string,
    companyName: string,
    status: string,
    userId: string,
    message?: string,
  ): Promise<void> {
    const preferences = await this.getPreferences(userId);

    if (!preferences.emailEnabled || !preferences.emailApplicationStatus) {
      this.logger.warn(`Application status email disabled for user ${userId}`);
      return;
    }

    await this.emailQueue.add('send-application-status-email', {
      email,
      name,
      jobTitle,
      companyName,
      status,
      message,
    });

    // Create in-app notification
    await this.create({
      userId,
      type: NotificationType.IN_APP,
      title: `Application Update: ${jobTitle}`,
      message: `Your application status for ${jobTitle} at ${companyName} has been updated to ${status}`,
      category: 'application',
      data: { jobTitle, companyName, status },
    });

    this.logger.log(`Application status email queued for ${email}`);
  }

  async sendPush(sendPushDto: SendPushDto): Promise<Notification> {
    const { userId, title, message, actionUrl, data, icon, image } = sendPushDto;

    try {
      // Check preferences
      const pushEnabled = await this.checkPreferences(userId, 'pushEnabled');
      if (!pushEnabled) {
        this.logger.warn(`Push notifications disabled for user ${userId}`);
        throw new BadRequestException('Push notifications are disabled for this user');
      }

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

      // Queue push notification
      await this.notificationQueue.add('send-push-notification', {
        userId,
        type: 'push',
        title,
        message,
        data: { ...data, actionUrl, icon, image },
      });

      this.logger.log(`Push notification queued for user ${userId}: ${title}`);

      // Mark as sent
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
