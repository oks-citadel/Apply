import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsEvent, EventType, EventCategory } from '../entities/analytics-event.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { QueryAnalyticsDto, ExportAnalyticsDto } from '../dto/query-analytics.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: Repository<AnalyticsEvent>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repository = module.get<Repository<AnalyticsEvent>>(
      getRepositoryToken(AnalyticsEvent),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should successfully track an event', async () => {
      const createEventDto: CreateEventDto = {
        eventType: EventType.APPLICATION_SUBMITTED,
        category: EventCategory.APPLICATION,
        userId: 'user-123',
        applicationId: 'app-123',
        metadata: { source: 'web' },
      };

      const mockEvent = {
        id: 'event-123',
        ...createEventDto,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        eventDate: new Date('2024-01-15'),
        isSuccessful: true,
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.trackEvent(
        createEventDto,
        'Mozilla/5.0',
        '192.168.1.1',
      );

      expect(repository.create).toHaveBeenCalledWith({
        ...createEventDto,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        eventDate: expect.any(Date),
        isSuccessful: true,
      });
      expect(repository.save).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual({
        id: 'event-123',
        eventType: EventType.APPLICATION_SUBMITTED,
        category: EventCategory.APPLICATION,
        timestamp: '2024-01-15T10:30:00.000Z',
        success: true,
      });
    });

    it('should track event with minimal data', async () => {
      const createEventDto: CreateEventDto = {
        eventType: EventType.PAGE_VIEW,
        category: EventCategory.SYSTEM,
        path: '/dashboard',
      };

      const mockEvent = {
        id: 'event-124',
        ...createEventDto,
        timestamp: new Date('2024-01-15T10:31:00Z'),
        eventDate: new Date('2024-01-15'),
        isSuccessful: true,
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.trackEvent(createEventDto);

      expect(result.success).toBe(true);
    });

    it('should handle failed events', async () => {
      const createEventDto: CreateEventDto = {
        eventType: EventType.ERROR_OCCURRED,
        category: EventCategory.SYSTEM,
        isSuccessful: false,
        errorMessage: 'Failed to submit application',
      };

      const mockEvent = {
        id: 'event-125',
        ...createEventDto,
        timestamp: new Date('2024-01-15T10:32:00Z'),
        eventDate: new Date('2024-01-15'),
        isSuccessful: false,
      };

      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.trackEvent(createEventDto);

      expect(result.success).toBe(true);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isSuccessful: false,
          errorMessage: 'Failed to submit application',
        }),
      );
    });

    it('should throw error when save fails', async () => {
      const createEventDto: CreateEventDto = {
        eventType: EventType.APPLICATION_SUBMITTED,
        category: EventCategory.APPLICATION,
      };

      mockRepository.create.mockReturnValue(createEventDto);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.trackEvent(createEventDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics with aggregated data', async () => {
      const query: QueryAnalyticsDto = {};

      const mockQueryBuilder = mockRepository.createQueryBuilder();

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ count: '1500' })
        .mockResolvedValueOnce({ count: '45' })
        .mockResolvedValueOnce({ avg: '150000' });

      mockRepository.count
        .mockResolvedValueOnce(450)
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(3500);

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { date: '2024-01-14', count: '50' },
          { date: '2024-01-15', count: '65' },
        ])
        .mockResolvedValueOnce([
          { status: EventType.APPLICATION_ACCEPTED, count: '45' },
          { status: EventType.APPLICATION_REJECTED, count: '30' },
          { status: EventType.APPLICATION_SUBMITTED, count: '25' },
        ]);

      const result = await service.getDashboardMetrics(query);

      expect(result).toMatchObject({
        totalUsers: 1500,
        totalApplications: 450,
        todayApplications: 25,
        activeUsersToday: 45,
        totalPageViews: 3500,
      });
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.avgSessionDuration).toBeGreaterThanOrEqual(0);
      expect(result.applicationTrend).toHaveLength(2);
      expect(result.statusDistribution).toHaveProperty('accepted');
      expect(result.statusDistribution).toHaveProperty('rejected');
      expect(result.statusDistribution).toHaveProperty('pending');
    });

    it('should handle empty data gracefully', async () => {
      const query: QueryAnalyticsDto = {};

      const mockQueryBuilder = mockRepository.createQueryBuilder();

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ count: '0' })
        .mockResolvedValueOnce({ count: '0' })
        .mockResolvedValueOnce({ avg: null });

      mockRepository.count.mockResolvedValue(0);

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboardMetrics(query);

      expect(result.totalUsers).toBe(0);
      expect(result.totalApplications).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.avgSessionDuration).toBe(0);
    });

    it('should filter by user ID', async () => {
      const query: QueryAnalyticsDto = {
        userId: 'user-123',
      };

      const mockQueryBuilder = mockRepository.createQueryBuilder();

      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '1' });
      mockRepository.count.mockResolvedValue(15);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics(query);

      expect(result.totalUsers).toBe(1);
    });

    it('should calculate success rate correctly', async () => {
      const query: QueryAnalyticsDto = {};

      const mockQueryBuilder = mockRepository.createQueryBuilder();

      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '100' });
      mockRepository.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(500);

      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics(query);

      expect(result.successRate).toBe(50);
    });
  });

  describe('getApplicationFunnel', () => {
    it('should return funnel metrics with correct calculations', async () => {
      const query: QueryAnalyticsDto = {};

      mockRepository.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(350)
        .mockResolvedValueOnce(100);

      const result = await service.getApplicationFunnel(query);

      expect(result).toMatchObject({
        jobViews: 1000,
        jobSaves: 500,
        applicationsSubmitted: 350,
        applicationsAccepted: 100,
      });
      expect(result.conversionRate).toBe(35);
      expect(result.successRate).toBeCloseTo(28.57, 1);
      expect(result.funnelStages).toHaveLength(4);
      expect(result.funnelStages[0]).toMatchObject({
        stage: 'viewed',
        count: 1000,
        percentage: 100,
      });
    });

    it('should handle zero views gracefully', async () => {
      const query: QueryAnalyticsDto = {};

      mockRepository.count.mockResolvedValue(0);

      const result = await service.getApplicationFunnel(query);

      expect(result.conversionRate).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.funnelStages[0].percentage).toBe(100);
    });

    it('should calculate funnel percentages correctly', async () => {
      const query: QueryAnalyticsDto = {};

      mockRepository.count
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(250)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(50);

      const result = await service.getApplicationFunnel(query);

      expect(result.funnelStages[1].percentage).toBe(50);
      expect(result.funnelStages[2].percentage).toBe(30);
      expect(result.funnelStages[3].percentage).toBe(10);
    });

    it('should filter by date range', async () => {
      const query: QueryAnalyticsDto = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      mockRepository.count.mockResolvedValue(100);

      const result = await service.getApplicationFunnel(query);

      expect(result.jobViews).toBe(100);
    });
  });

  describe('getRecentActivity', () => {
    it('should return paginated activity list', async () => {
      const query: QueryAnalyticsDto = {
        page: 1,
        limit: 20,
      };

      const mockEvents = [
        {
          id: 'event-1',
          eventType: EventType.APPLICATION_SUBMITTED,
          category: EventCategory.APPLICATION,
          userId: 'user-123',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          metadata: { company: 'Tech Corp' },
        },
        {
          id: 'event-2',
          eventType: EventType.JOB_VIEWED,
          category: EventCategory.JOB,
          userId: 'user-123',
          timestamp: new Date('2024-01-15T10:25:00Z'),
          metadata: {},
        },
      ];

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEvents, 100]);

      const result = await service.getRecentActivity(query);

      expect(result).toMatchObject({
        total: 100,
        page: 1,
        limit: 20,
        totalPages: 5,
      });
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toHaveProperty('description');
    });

    it('should filter by event type', async () => {
      const query: QueryAnalyticsDto = {
        eventType: EventType.APPLICATION_SUBMITTED,
        page: 1,
        limit: 10,
      };

      const mockEvents = [
        {
          id: 'event-1',
          eventType: EventType.APPLICATION_SUBMITTED,
          category: EventCategory.APPLICATION,
          userId: 'user-123',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          metadata: {},
        },
      ];

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEvents, 50]);

      const result = await service.getRecentActivity(query);

      expect(result.total).toBe(50);
      expect(result.items[0].eventType).toBe(EventType.APPLICATION_SUBMITTED);
    });

    it('should filter by category', async () => {
      const query: QueryAnalyticsDto = {
        category: EventCategory.AI,
        page: 1,
        limit: 20,
      };

      const mockEvents = [
        {
          id: 'event-2',
          eventType: EventType.AI_SUGGESTION_USED,
          category: EventCategory.AI,
          userId: 'user-123',
          timestamp: new Date('2024-01-15T10:31:00Z'),
          metadata: {},
        },
      ];

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEvents, 30]);

      const result = await service.getRecentActivity(query);

      expect(result.items[0].category).toBe(EventCategory.AI);
    });

    it('should handle pagination correctly', async () => {
      const query: QueryAnalyticsDto = {
        page: 3,
        limit: 20,
      };

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 100]);

      const result = await service.getRecentActivity(query);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
    });

    it('should generate event descriptions', async () => {
      const query: QueryAnalyticsDto = {};

      const mockEvents = [
        {
          id: 'event-1',
          eventType: EventType.PAGE_VIEW,
          category: EventCategory.SYSTEM,
          userId: 'user-123',
          path: '/dashboard',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          metadata: {},
        },
        {
          id: 'event-2',
          eventType: EventType.ERROR_OCCURRED,
          category: EventCategory.SYSTEM,
          userId: 'user-123',
          errorMessage: 'Network timeout',
          timestamp: new Date('2024-01-15T10:25:00Z'),
          metadata: {},
        },
      ];

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEvents, 2]);

      const result = await service.getRecentActivity(query);

      expect(result.items[0].description).toContain('/dashboard');
      expect(result.items[1].description).toContain('Network timeout');
    });
  });

  describe('exportAnalytics', () => {
    it('should export data as CSV', async () => {
      const query: ExportAnalyticsDto = {
        format: 'csv',
      };

      const mockEvents = [
        {
          id: 'event-1',
          eventType: EventType.APPLICATION_SUBMITTED,
          category: EventCategory.APPLICATION,
          userId: 'user-123',
          sessionId: 'session-1',
          applicationId: 'app-1',
          jobId: 'job-1',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          path: '/apply',
          isSuccessful: true,
          duration: 1500,
          metadata: { source: 'web' },
        },
      ];

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockEvents);

      const result = await service.exportAnalytics(query);

      expect(typeof result).toBe('string');
      expect(result).toContain('ID,Event Type,Category');
      expect(result).toContain('event-1');
      expect(result).toContain('application_submitted');
    });

    it('should export data as JSON', async () => {
      const query: ExportAnalyticsDto = {
        format: 'json',
      };

      const mockEvents = [
        {
          id: 'event-1',
          eventType: EventType.APPLICATION_SUBMITTED,
          category: EventCategory.APPLICATION,
          userId: 'user-123',
          timestamp: new Date('2024-01-15T10:30:00Z'),
        },
      ];

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockEvents);

      const result = await service.exportAnalytics(query);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockEvents);
    });

    it('should apply filters when exporting', async () => {
      const query: ExportAnalyticsDto = {
        format: 'csv',
        eventType: EventType.APPLICATION_SUBMITTED,
        userId: 'user-123',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.exportAnalytics(query);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should handle empty export data', async () => {
      const query: ExportAnalyticsDto = {
        format: 'csv',
      };

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.exportAnalytics(query);

      expect(result).toBe('');
    });

    it('should respect export limit', async () => {
      const query: ExportAnalyticsDto = {
        format: 'json',
      };

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.exportAnalytics(query);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50000);
    });
  });

  describe('date range handling', () => {
    it('should use default date range when not specified', async () => {
      const query: QueryAnalyticsDto = {};

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '0' });
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getDashboardMetrics(query);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should use custom date range when specified', async () => {
      const query: QueryAnalyticsDto = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '0' });
      mockRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getDashboardMetrics(query);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });
});
