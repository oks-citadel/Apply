import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationStatus, NotificationType } from './entities/notification.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';
import { EmailService } from '../email/email.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: Repository<Notification>;
  let emailService: EmailService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockPreferencesRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEmailQueue = {
    add: jest.fn(),
  };

  const mockNotificationQueue = {
    add: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    sendTemplatedEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendApplicationStatusEmail: jest.fn(),
    sendJobAlertEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(NotificationPreferences),
          useValue: mockPreferencesRepository,
        },
        {
          provide: getQueueToken('email'),
          useValue: mockEmailQueue,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockNotificationQueue,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createDto = {
        userId: 'user-123',
        type: NotificationType.IN_APP,
        title: 'Test Notification',
        message: 'Test message',
      };

      const notification = {
        id: 'notif-123',
        ...createDto,
        status: NotificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(notification);
      mockRepository.save.mockResolvedValue(notification);

      const result = await service.create(createDto);

      expect(result).toEqual(notification);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(notification);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const notifications = [
        {
          id: 'notif-1',
          userId: 'user-123',
          title: 'Test 1',
          message: 'Message 1',
        },
        {
          id: 'notif-2',
          userId: 'user-123',
          title: 'Test 2',
          message: 'Message 2',
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([notifications, 2]);

      const result = await service.findAll({ userId: 'user-123', page: 1, limit: 20 });

      expect(result.data).toEqual(notifications);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = {
        id: 'notif-123',
        userId: 'user-123',
        title: 'Test',
        message: 'Test message',
        isRead: false,
        status: NotificationStatus.SENT,
      };

      mockRepository.findOne.mockResolvedValue(notification);
      mockRepository.save.mockResolvedValue({
        ...notification,
        isRead: true,
        readAt: expect.any(Date),
        status: NotificationStatus.READ,
      });

      const result = await service.markAsRead('notif-123');

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
      expect(result.status).toBe(NotificationStatus.READ);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-123');

      expect(result.count).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRead: false,
        },
      });
    });
  });
});
