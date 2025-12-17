import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '../entities/notification.entity';
import { NotificationPreferences } from '../entities/notification-preferences.entity';
import { EmailService } from '../../email/email.service';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  SendEmailDto,
  SendPushDto,
  UpdatePreferencesDto,
} from '../dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let preferencesRepository: Repository<NotificationPreferences>;
  let emailQueue: Queue;
  let notificationQueue: Queue;
  let emailService: EmailService;

  const mockNotification: Notification = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    type: NotificationType.IN_APP,
    status: NotificationStatus.SENT,
    priority: NotificationPriority.MEDIUM,
    title: 'Test Notification',
    message: 'This is a test notification',
    data: { test: 'data' },
    category: 'test',
    actionUrl: '/test',
    isRead: false,
    readAt: null,
    sentAt: new Date(),
    failedReason: null,
    retryCount: 0,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPreferences: NotificationPreferences = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: 'user-123',
    emailEnabled: true,
    emailWelcome: true,
    emailVerification: true,
    emailPasswordReset: true,
    emailApplicationStatus: true,
    emailJobAlerts: true,
    emailWeeklyDigest: true,
    emailMarketing: false,
    pushEnabled: true,
    pushApplicationStatus: true,
    pushJobAlerts: true,
    pushMessages: true,
    smsEnabled: false,
    smsApplicationStatus: false,
    digestFrequency: 'immediate',
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPreferencesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    sendTemplatedEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(NotificationPreferences),
          useValue: mockPreferencesRepository,
        },
        {
          provide: getQueueToken('email'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    preferencesRepository = module.get<Repository<NotificationPreferences>>(
      getRepositoryToken(NotificationPreferences),
    );
    emailQueue = module.get<Queue>(getQueueToken('email'));
    notificationQueue = module.get<Queue>(getQueueToken('notifications'));
    emailService = module.get<EmailService>(EmailService);

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      const createDto: CreateNotificationDto = {
        userId: 'user-123',
        type: NotificationType.IN_APP,
        title: 'Test Notification',
        message: 'Test message',
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.create).toHaveBeenCalledWith(createDto);
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should create notification with priority and expiration', async () => {
      const createDto: CreateNotificationDto = {
        userId: 'user-123',
        type: NotificationType.IN_APP,
        title: 'Urgent',
        message: 'Urgent message',
        priority: NotificationPriority.URGENT,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const query: QueryNotificationsDto = {
        page: 1,
        limit: 20,
      };

      mockNotificationRepository.findAndCount.mockResolvedValue([
        [mockNotification],
        1,
      ]);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(notificationRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by userId', async () => {
      const query: QueryNotificationsDto = {
        userId: 'user-123',
        page: 1,
        limit: 20,
      };

      mockNotificationRepository.findAndCount.mockResolvedValue([
        [mockNotification],
        1,
      ]);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-123' }),
        }),
      );
    });

    it('should filter by type and status', async () => {
      const query: QueryNotificationsDto = {
        type: NotificationType.EMAIL,
        status: NotificationStatus.SENT,
        page: 1,
        limit: 20,
      };

      mockNotificationRepository.findAndCount.mockResolvedValue([
        [mockNotification],
        1,
      ]);

      await service.findAll(query);

      expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: NotificationType.EMAIL,
            status: NotificationStatus.SENT,
          }),
        }),
      );
    });

    it('should filter by read status', async () => {
      const query: QueryNotificationsDto = {
        isRead: false,
        page: 1,
        limit: 20,
      };

      mockNotificationRepository.findAndCount.mockResolvedValue([
        [mockNotification],
        1,
      ]);

      await service.findAll(query);

      expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isRead: false }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const query: QueryNotificationsDto = {
        page: 2,
        limit: 10,
      };

      mockNotificationRepository.findAndCount.mockResolvedValue([
        [mockNotification],
        15,
      ]);

      const result = await service.findAll(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(notificationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should find a notification by ID', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' },
      });
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should find notifications by userId', async () => {
      mockNotificationRepository.find.mockResolvedValue([mockNotification]);

      const result = await service.findByUserId('user-123');

      expect(result).toEqual([mockNotification]);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should respect custom limit', async () => {
      mockNotificationRepository.find.mockResolvedValue([mockNotification]);

      await service.findByUserId('user-123', 10);

      expect(notificationRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const unreadNotification = { ...mockNotification, isRead: false };
      mockNotificationRepository.findOne.mockResolvedValue(unreadNotification);
      mockNotificationRepository.save.mockResolvedValue({
        ...unreadNotification,
        isRead: true,
        status: NotificationStatus.READ,
      });

      const result = await service.markAsRead('123e4567-e89b-12d3-a456-426614174000');

      expect(result.isRead).toBe(true);
      expect(result.status).toBe(NotificationStatus.READ);
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockNotificationRepository.update.mockResolvedValue({ affected: 3 });

      const result = await service.markAllAsRead('user-123');

      expect(result).toEqual({ updated: 3 });
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123', isRead: false },
        expect.objectContaining({ isRead: true }),
      );
    });

    it('should return zero when no notifications updated', async () => {
      mockNotificationRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.markAllAsRead('user-123');

      expect(result).toEqual({ updated: 0 });
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.remove.mockResolvedValue(mockNotification);

      await service.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(notificationRepository.remove).toHaveBeenCalledWith(
        mockNotification,
      );
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteOld', () => {
    it('should delete old read notifications', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 10 }),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.deleteOld(30);

      expect(result).toEqual({ deleted: 10 });
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should use default 30 days when not specified', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.deleteOld();

      expect(result).toEqual({ deleted: 5 });
    });
  });

  describe('getPreferences', () => {
    it('should get existing preferences', async () => {
      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);

      const result = await service.getPreferences('user-123');

      expect(result).toEqual(mockPreferences);
      expect(preferencesRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should create default preferences if none exist', async () => {
      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.create.mockReturnValue(mockPreferences);
      mockPreferencesRepository.save.mockResolvedValue(mockPreferences);

      const result = await service.getPreferences('new-user-123');

      expect(result).toEqual(mockPreferences);
      expect(preferencesRepository.create).toHaveBeenCalledWith({
        userId: 'new-user-123',
      });
      expect(preferencesRepository.save).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      const updateDto: UpdatePreferencesDto = {
        emailEnabled: false,
        pushEnabled: true,
      };

      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockPreferencesRepository.save.mockResolvedValue({
        ...mockPreferences,
        ...updateDto,
      });

      const result = await service.updatePreferences('user-123', updateDto);

      expect(result.emailEnabled).toBe(false);
      expect(result.pushEnabled).toBe(true);
      expect(preferencesRepository.save).toHaveBeenCalled();
    });

    it('should create new preferences if none exist', async () => {
      const updateDto: UpdatePreferencesDto = {
        emailJobAlerts: false,
      };

      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.create.mockReturnValue({
        ...mockPreferences,
        ...updateDto,
      });
      mockPreferencesRepository.save.mockResolvedValue({
        ...mockPreferences,
        ...updateDto,
      });

      const result = await service.updatePreferences('new-user-123', updateDto);

      expect(preferencesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-user-123',
          ...updateDto,
        }),
      );
      expect(preferencesRepository.save).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const sendEmailDto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Test email body',
        userId: 'user-123',
      };

      // Mock checkPreferences to return true (email enabled)
      jest.spyOn(service as any, 'checkPreferences').mockResolvedValue(true);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockQueue.add.mockResolvedValue({});

      const result = await service.sendEmail(sendEmailDto);

      expect(result.status).toBe(NotificationStatus.SENT);
      expect(emailQueue.add).toHaveBeenCalledWith('send-email', expect.any(Object));
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email disabled', async () => {
      const sendEmailDto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Test email body',
        userId: 'user-123',
      };

      const disabledPreferences = { ...mockPreferences, emailEnabled: false };
      mockPreferencesRepository.findOne.mockResolvedValue(disabledPreferences);

      await expect(service.sendEmail(sendEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should send email without userId', async () => {
      const sendEmailDto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Test email body',
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockQueue.add.mockResolvedValue({});

      const result = await service.sendEmail(sendEmailDto);

      expect(result).toBeDefined();
      expect(emailQueue.add).toHaveBeenCalled();
    });
  });

  describe('sendPush', () => {
    it('should send push notification successfully', async () => {
      const sendPushDto: SendPushDto = {
        userId: 'user-123',
        title: 'Test Push',
        message: 'Test push notification',
      };

      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockQueue.add.mockResolvedValue({});

      const result = await service.sendPush(sendPushDto);

      expect(result.status).toBe(NotificationStatus.SENT);
      expect(notificationQueue.add).toHaveBeenCalledWith(
        'send-push-notification',
        expect.any(Object),
      );
    });

    it('should throw BadRequestException if push disabled', async () => {
      const sendPushDto: SendPushDto = {
        userId: 'user-123',
        title: 'Test Push',
        message: 'Test push notification',
      };

      const disabledPreferences = { ...mockPreferences, pushEnabled: false };
      mockPreferencesRepository.findOne.mockResolvedValue(disabledPreferences);

      await expect(service.sendPush(sendPushDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should send push with action URL and data', async () => {
      const sendPushDto: SendPushDto = {
        userId: 'user-123',
        title: 'Application Update',
        message: 'Your application status changed',
        actionUrl: '/applications/123',
        data: { applicationId: '123', status: 'reviewed' },
      };

      mockPreferencesRepository.findOne.mockResolvedValue(mockPreferences);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockQueue.add.mockResolvedValue({});

      const result = await service.sendPush(sendPushDto);

      expect(result).toBeDefined();
      expect(notificationQueue.add).toHaveBeenCalledWith(
        'send-push-notification',
        expect.objectContaining({
          data: expect.objectContaining({
            actionUrl: '/applications/123',
          }),
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-123');

      expect(result).toEqual({ count: 5 });
      expect(notificationRepository.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
      });
    });

    it('should return zero when no unread notifications', async () => {
      mockNotificationRepository.count.mockResolvedValue(0);

      const result = await service.getUnreadCount('user-123');

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('updateStatus', () => {
    it('should update notification status to SENT', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.SENT,
        sentAt: expect.any(Date),
      });

      const result = await service.updateStatus(
        '123e4567-e89b-12d3-a456-426614174000',
        NotificationStatus.SENT,
      );

      expect(result.status).toBe(NotificationStatus.SENT);
      expect(result.sentAt).toBeDefined();
    });

    it('should update notification status to FAILED with reason', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.FAILED,
        failedReason: 'Connection timeout',
        retryCount: 1,
      });

      const result = await service.updateStatus(
        '123e4567-e89b-12d3-a456-426614174000',
        NotificationStatus.FAILED,
        'Connection timeout',
      );

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect(result.failedReason).toBe('Connection timeout');
      expect(result.retryCount).toBeGreaterThan(0);
    });
  });
});
