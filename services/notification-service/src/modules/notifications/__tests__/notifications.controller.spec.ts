import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  SendEmailDto,
  SendPushDto,
  UpdatePreferencesDto,
} from '../dto';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '../entities/notification.entity';
import { NotificationPreferences } from '../entities/notification-preferences.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

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

  const mockNotificationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    delete: jest.fn(),
    deleteOld: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    sendEmail: jest.fn(),
    sendPush: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Definition', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /notifications/email', () => {
    it('should send email notification successfully', async () => {
      const sendEmailDto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Test email body',
        userId: 'user-123',
      };

      mockNotificationsService.sendEmail.mockResolvedValue(mockNotification);

      const result = await controller.sendEmail(sendEmailDto);

      expect(result).toEqual(mockNotification);
      expect(service.sendEmail).toHaveBeenCalledWith(sendEmailDto);
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should send templated email', async () => {
      const sendEmailDto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Welcome',
        body: 'Welcome email',
        template: 'welcome',
        templateData: { name: 'John Doe' },
        userId: 'user-123',
      };

      mockNotificationsService.sendEmail.mockResolvedValue(mockNotification);

      const result = await controller.sendEmail(sendEmailDto);

      expect(result).toEqual(mockNotification);
      expect(service.sendEmail).toHaveBeenCalledWith(sendEmailDto);
    });
  });

  describe('POST /notifications/push', () => {
    it('should send push notification successfully', async () => {
      const sendPushDto: SendPushDto = {
        userId: 'user-123',
        title: 'Test Push',
        message: 'Test push notification',
      };

      mockNotificationsService.sendPush.mockResolvedValue(mockNotification);

      const result = await controller.sendPush(sendPushDto);

      expect(result).toEqual(mockNotification);
      expect(service.sendPush).toHaveBeenCalledWith(sendPushDto);
      expect(service.sendPush).toHaveBeenCalledTimes(1);
    });

    it('should send push notification with action URL', async () => {
      const sendPushDto: SendPushDto = {
        userId: 'user-123',
        title: 'Application Update',
        message: 'Your application has been reviewed',
        actionUrl: '/applications/123',
      };

      mockNotificationsService.sendPush.mockResolvedValue(mockNotification);

      const result = await controller.sendPush(sendPushDto);

      expect(result).toEqual(mockNotification);
      expect(service.sendPush).toHaveBeenCalledWith(sendPushDto);
    });
  });

  describe('POST /notifications', () => {
    it('should create notification successfully', async () => {
      const createDto: CreateNotificationDto = {
        userId: 'user-123',
        type: NotificationType.IN_APP,
        title: 'Test Notification',
        message: 'Test message',
      };

      mockNotificationsService.create.mockResolvedValue(mockNotification);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should create notification with priority and category', async () => {
      const createDto: CreateNotificationDto = {
        userId: 'user-123',
        type: NotificationType.IN_APP,
        title: 'Urgent: Interview Scheduled',
        message: 'You have an interview scheduled',
        priority: NotificationPriority.URGENT,
        category: 'interview',
        actionUrl: '/interviews/123',
      };

      mockNotificationsService.create.mockResolvedValue(mockNotification);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('GET /notifications', () => {
    it('should return paginated notifications', async () => {
      const query: QueryNotificationsDto = {
        page: 1,
        limit: 20,
      };

      const paginatedResult = {
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockNotificationsService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter notifications by user and status', async () => {
      const query: QueryNotificationsDto = {
        userId: 'user-123',
        status: NotificationStatus.SENT,
        page: 1,
        limit: 20,
      };

      const paginatedResult = {
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockNotificationsService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter unread notifications', async () => {
      const query: QueryNotificationsDto = {
        userId: 'user-123',
        isRead: false,
        page: 1,
        limit: 20,
      };

      mockNotificationsService.findAll.mockResolvedValue({
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.findAll(query);

      expect(result.data).toBeDefined();
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /notifications/preferences/:userId', () => {
    it('should get user notification preferences', async () => {
      mockNotificationsService.getPreferences.mockResolvedValue(mockPreferences);

      const result = await controller.getPreferences('user-123');

      expect(result).toEqual(mockPreferences);
      expect(service.getPreferences).toHaveBeenCalledWith('user-123');
    });

    it('should create default preferences if none exist', async () => {
      mockNotificationsService.getPreferences.mockResolvedValue(mockPreferences);

      const result = await controller.getPreferences('new-user-123');

      expect(result).toEqual(mockPreferences);
      expect(service.getPreferences).toHaveBeenCalledWith('new-user-123');
    });
  });

  describe('PUT /notifications/preferences/:userId', () => {
    it('should update notification preferences', async () => {
      const updateDto: UpdatePreferencesDto = {
        emailEnabled: false,
        pushEnabled: true,
        emailJobAlerts: false,
      };

      const updatedPreferences = {
        ...mockPreferences,
        ...updateDto,
      };

      mockNotificationsService.updatePreferences.mockResolvedValue(
        updatedPreferences,
      );

      const result = await controller.updatePreferences('user-123', updateDto);

      expect(result).toEqual(updatedPreferences);
      expect(service.updatePreferences).toHaveBeenCalledWith(
        'user-123',
        updateDto,
      );
    });

    it('should update quiet hours', async () => {
      const updateDto: UpdatePreferencesDto = {
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'America/New_York',
      };

      mockNotificationsService.updatePreferences.mockResolvedValue({
        ...mockPreferences,
        ...updateDto,
      });

      const result = await controller.updatePreferences('user-123', updateDto);

      expect(result.quietHoursStart).toEqual('22:00');
      expect(result.quietHoursEnd).toEqual('08:00');
      expect(service.updatePreferences).toHaveBeenCalledWith(
        'user-123',
        updateDto,
      );
    });
  });

  describe('GET /notifications/user/:userId', () => {
    it('should get notifications for specific user', async () => {
      mockNotificationsService.findByUserId.mockResolvedValue([
        mockNotification,
      ]);

      const result = await controller.findByUserId('user-123');

      expect(result).toEqual([mockNotification]);
      expect(service.findByUserId).toHaveBeenCalledWith('user-123', undefined);
    });

    it('should get limited notifications for user', async () => {
      mockNotificationsService.findByUserId.mockResolvedValue([
        mockNotification,
      ]);

      const result = await controller.findByUserId('user-123', 10);

      expect(result).toEqual([mockNotification]);
      expect(service.findByUserId).toHaveBeenCalledWith('user-123', 10);
    });
  });

  describe('GET /notifications/user/:userId/unread-count', () => {
    it('should get unread notification count', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue({ count: 5 });

      const result = await controller.getUnreadCount('user-123');

      expect(result).toEqual({ count: 5 });
      expect(service.getUnreadCount).toHaveBeenCalledWith('user-123');
    });

    it('should return zero count when no unread notifications', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue({ count: 0 });

      const result = await controller.getUnreadCount('user-123');

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('GET /notifications/:id', () => {
    it('should get notification by ID', async () => {
      mockNotificationsService.findOne.mockResolvedValue(mockNotification);

      const result = await controller.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockNotification);
      expect(service.findOne).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const readNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
        status: NotificationStatus.READ,
      };

      mockNotificationsService.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
      expect(service.markAsRead).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('PATCH /notifications/user/:userId/read-all', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue({ updated: 3 });

      const result = await controller.markAllAsRead('user-123');

      expect(result).toEqual({ updated: 3 });
      expect(service.markAllAsRead).toHaveBeenCalledWith('user-123');
    });

    it('should return zero when no unread notifications', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue({ updated: 0 });

      const result = await controller.markAllAsRead('user-123');

      expect(result).toEqual({ updated: 0 });
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification', async () => {
      mockNotificationsService.delete.mockResolvedValue(undefined);

      await controller.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(service.delete).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('DELETE /notifications/cleanup/old', () => {
    it('should delete old notifications with default days', async () => {
      mockNotificationsService.deleteOld.mockResolvedValue({ deleted: 10 });

      const result = await controller.deleteOld();

      expect(result).toEqual({ deleted: 10 });
      expect(service.deleteOld).toHaveBeenCalledWith(undefined);
    });

    it('should delete old notifications with custom days', async () => {
      mockNotificationsService.deleteOld.mockResolvedValue({ deleted: 5 });

      const result = await controller.deleteOld(60);

      expect(result).toEqual({ deleted: 5 });
      expect(service.deleteOld).toHaveBeenCalledWith(60);
    });
  });
});
