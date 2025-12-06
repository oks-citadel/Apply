import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../analytics.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { QueryAnalyticsDto, ExportAnalyticsDto } from '../dto/query-analytics.dto';
import { EventType, EventCategory } from '../entities/analytics-event.entity';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    trackEvent: jest.fn(),
    getDashboardMetrics: jest.fn(),
    getApplicationFunnel: jest.fn(),
    getRecentActivity: jest.fn(),
    exportAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track an analytics event successfully', async () => {
      const createEventDto: CreateEventDto = {
        eventType: EventType.APPLICATION_SUBMITTED,
        category: EventCategory.APPLICATION,
        userId: 'user-123',
        applicationId: 'app-123',
        metadata: { source: 'web' },
      };

      const expectedResponse = {
        id: 'event-123',
        eventType: EventType.APPLICATION_SUBMITTED,
        category: EventCategory.APPLICATION,
        timestamp: '2024-01-15T10:30:00Z',
        success: true,
      };

      mockAnalyticsService.trackEvent.mockResolvedValue(expectedResponse);

      const result = await controller.trackEvent(
        createEventDto,
        'Mozilla/5.0',
        '192.168.1.1',
      );

      expect(service.trackEvent).toHaveBeenCalledWith(
        createEventDto,
        'Mozilla/5.0',
        '192.168.1.1',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should track event with minimal data', async () => {
      const createEventDto: CreateEventDto = {
        eventType: EventType.PAGE_VIEW,
        category: EventCategory.SYSTEM,
        path: '/dashboard',
      };

      const expectedResponse = {
        id: 'event-124',
        eventType: EventType.PAGE_VIEW,
        category: EventCategory.SYSTEM,
        timestamp: '2024-01-15T10:31:00Z',
        success: true,
      };

      mockAnalyticsService.trackEvent.mockResolvedValue(expectedResponse);

      const result = await controller.trackEvent(createEventDto, undefined, undefined);

      expect(service.trackEvent).toHaveBeenCalledWith(
        createEventDto,
        undefined,
        undefined,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should track error events', async () => {
      const createEventDto: CreateEventDto = {
        eventType: EventType.ERROR_OCCURRED,
        category: EventCategory.SYSTEM,
        isSuccessful: false,
        errorMessage: 'Failed to submit application',
        metadata: { errorCode: 500 },
      };

      const expectedResponse = {
        id: 'event-125',
        eventType: EventType.ERROR_OCCURRED,
        category: EventCategory.SYSTEM,
        timestamp: '2024-01-15T10:32:00Z',
        success: true,
      };

      mockAnalyticsService.trackEvent.mockResolvedValue(expectedResponse);

      const result = await controller.trackEvent(createEventDto, 'Mozilla/5.0', '192.168.1.1');

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics for default date range', async () => {
      const query: QueryAnalyticsDto = {};

      const expectedMetrics = {
        totalUsers: 1500,
        totalApplications: 450,
        todayApplications: 25,
        activeUsersToday: 45,
        successRate: 75.5,
        totalPageViews: 3500,
        avgSessionDuration: 2.5,
        applicationTrend: [
          { date: '2024-01-01', count: 50 },
          { date: '2024-01-02', count: 65 },
        ],
        statusDistribution: {
          accepted: 45,
          rejected: 30,
          pending: 25,
        },
      };

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getDashboardMetrics(query);

      expect(service.getDashboardMetrics).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedMetrics);
      expect(result.totalUsers).toBe(1500);
      expect(result.successRate).toBe(75.5);
    });

    it('should return dashboard metrics for custom date range', async () => {
      const query: QueryAnalyticsDto = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      const expectedMetrics = {
        totalUsers: 500,
        totalApplications: 150,
        todayApplications: 10,
        activeUsersToday: 20,
        successRate: 80.0,
        totalPageViews: 1200,
        avgSessionDuration: 3.0,
        applicationTrend: [
          { date: '2024-01-01', count: 10 },
        ],
        statusDistribution: {
          accepted: 50,
          rejected: 20,
          pending: 30,
        },
      };

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getDashboardMetrics(query);

      expect(service.getDashboardMetrics).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedMetrics);
    });

    it('should filter dashboard metrics by user', async () => {
      const query: QueryAnalyticsDto = {
        userId: 'user-123',
      };

      const expectedMetrics = {
        totalUsers: 1,
        totalApplications: 15,
        todayApplications: 2,
        activeUsersToday: 1,
        successRate: 66.7,
        totalPageViews: 120,
        avgSessionDuration: 4.5,
        applicationTrend: [
          { date: '2024-01-15', count: 2 },
        ],
        statusDistribution: {
          accepted: 10,
          rejected: 5,
          pending: 0,
        },
      };

      mockAnalyticsService.getDashboardMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getDashboardMetrics(query);

      expect(service.getDashboardMetrics).toHaveBeenCalledWith(query);
      expect(result.totalUsers).toBe(1);
    });
  });

  describe('getApplicationFunnel', () => {
    it('should return application funnel metrics', async () => {
      const query: QueryAnalyticsDto = {};

      const expectedFunnel = {
        jobViews: 1000,
        jobSaves: 500,
        applicationsStarted: 450,
        applicationsSubmitted: 350,
        applicationsAccepted: 100,
        conversionRate: 35.0,
        successRate: 28.5,
        funnelStages: [
          { stage: 'viewed', count: 1000, percentage: 100 },
          { stage: 'saved', count: 500, percentage: 50 },
          { stage: 'applied', count: 350, percentage: 35 },
          { stage: 'accepted', count: 100, percentage: 10 },
        ],
      };

      mockAnalyticsService.getApplicationFunnel.mockResolvedValue(expectedFunnel);

      const result = await controller.getApplicationFunnel(query);

      expect(service.getApplicationFunnel).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedFunnel);
      expect(result.funnelStages).toHaveLength(4);
      expect(result.conversionRate).toBe(35.0);
    });

    it('should calculate funnel stages correctly', async () => {
      const query: QueryAnalyticsDto = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      const expectedFunnel = {
        jobViews: 500,
        jobSaves: 250,
        applicationsStarted: 200,
        applicationsSubmitted: 150,
        applicationsAccepted: 50,
        conversionRate: 30.0,
        successRate: 33.3,
        funnelStages: [
          { stage: 'viewed', count: 500, percentage: 100 },
          { stage: 'saved', count: 250, percentage: 50 },
          { stage: 'applied', count: 150, percentage: 30 },
          { stage: 'accepted', count: 50, percentage: 10 },
        ],
      };

      mockAnalyticsService.getApplicationFunnel.mockResolvedValue(expectedFunnel);

      const result = await controller.getApplicationFunnel(query);

      expect(result.successRate).toBe(33.3);
      expect(result.funnelStages[0].percentage).toBe(100);
      expect(result.funnelStages[3].percentage).toBe(10);
    });

    it('should handle empty funnel data', async () => {
      const query: QueryAnalyticsDto = {};

      const expectedFunnel = {
        jobViews: 0,
        jobSaves: 0,
        applicationsStarted: 0,
        applicationsSubmitted: 0,
        applicationsAccepted: 0,
        conversionRate: 0,
        successRate: 0,
        funnelStages: [
          { stage: 'viewed', count: 0, percentage: 100 },
          { stage: 'saved', count: 0, percentage: 0 },
          { stage: 'applied', count: 0, percentage: 0 },
          { stage: 'accepted', count: 0, percentage: 0 },
        ],
      };

      mockAnalyticsService.getApplicationFunnel.mockResolvedValue(expectedFunnel);

      const result = await controller.getApplicationFunnel(query);

      expect(result.conversionRate).toBe(0);
      expect(result.successRate).toBe(0);
    });
  });

  describe('getRecentActivity', () => {
    it('should return paginated activity list', async () => {
      const query: QueryAnalyticsDto = {
        page: 1,
        limit: 20,
      };

      const expectedActivity = {
        items: [
          {
            id: 'event-1',
            eventType: EventType.APPLICATION_SUBMITTED,
            category: EventCategory.APPLICATION,
            userId: 'user-123',
            description: 'Application submitted',
            timestamp: '2024-01-15T10:30:00Z',
            metadata: { company: 'Tech Corp' },
          },
        ],
        total: 100,
        page: 1,
        limit: 20,
        totalPages: 5,
      };

      mockAnalyticsService.getRecentActivity.mockResolvedValue(expectedActivity);

      const result = await controller.getRecentActivity(query);

      expect(service.getRecentActivity).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedActivity);
      expect(result.items).toHaveLength(1);
      expect(result.totalPages).toBe(5);
    });

    it('should filter activity by event type', async () => {
      const query: QueryAnalyticsDto = {
        eventType: EventType.APPLICATION_SUBMITTED,
        page: 1,
        limit: 10,
      };

      const expectedActivity = {
        items: [
          {
            id: 'event-1',
            eventType: EventType.APPLICATION_SUBMITTED,
            category: EventCategory.APPLICATION,
            userId: 'user-123',
            description: 'Application submitted',
            timestamp: '2024-01-15T10:30:00Z',
            metadata: {},
          },
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
      };

      mockAnalyticsService.getRecentActivity.mockResolvedValue(expectedActivity);

      const result = await controller.getRecentActivity(query);

      expect(service.getRecentActivity).toHaveBeenCalledWith(query);
      expect(result.items[0].eventType).toBe(EventType.APPLICATION_SUBMITTED);
    });

    it('should filter activity by category', async () => {
      const query: QueryAnalyticsDto = {
        category: EventCategory.AI,
        page: 1,
        limit: 20,
      };

      const expectedActivity = {
        items: [
          {
            id: 'event-2',
            eventType: EventType.AI_SUGGESTION_USED,
            category: EventCategory.AI,
            userId: 'user-123',
            description: 'AI suggestion used',
            timestamp: '2024-01-15T10:31:00Z',
            metadata: {},
          },
        ],
        total: 30,
        page: 1,
        limit: 20,
        totalPages: 2,
      };

      mockAnalyticsService.getRecentActivity.mockResolvedValue(expectedActivity);

      const result = await controller.getRecentActivity(query);

      expect(result.items[0].category).toBe(EventCategory.AI);
    });

    it('should handle pagination correctly', async () => {
      const query: QueryAnalyticsDto = {
        page: 3,
        limit: 20,
      };

      const expectedActivity = {
        items: [],
        total: 100,
        page: 3,
        limit: 20,
        totalPages: 5,
      };

      mockAnalyticsService.getRecentActivity.mockResolvedValue(expectedActivity);

      const result = await controller.getRecentActivity(query);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics data as CSV', async () => {
      const query: ExportAnalyticsDto = {
        format: 'csv',
      };

      const expectedCsv = 'ID,Event Type,Category,User ID\nevent-1,application_submitted,application,user-123';

      mockAnalyticsService.exportAnalytics.mockResolvedValue(expectedCsv);

      const result = await controller.exportAnalytics(query);

      expect(service.exportAnalytics).toHaveBeenCalledWith(query);
      expect(result).toBe(expectedCsv);
      expect(typeof result).toBe('string');
    });

    it('should export analytics data as JSON', async () => {
      const query: ExportAnalyticsDto = {
        format: 'json',
      };

      const expectedJson = [
        {
          id: 'event-1',
          eventType: EventType.APPLICATION_SUBMITTED,
          category: EventCategory.APPLICATION,
          userId: 'user-123',
          timestamp: '2024-01-15T10:30:00Z',
        },
      ];

      mockAnalyticsService.exportAnalytics.mockResolvedValue(expectedJson);

      const result = await controller.exportAnalytics(query);

      expect(service.exportAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedJson);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should export with date range filter', async () => {
      const query: ExportAnalyticsDto = {
        format: 'csv',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      const expectedCsv = 'ID,Event Type,Category,User ID\nevent-1,application_submitted,application,user-123';

      mockAnalyticsService.exportAnalytics.mockResolvedValue(expectedCsv);

      const result = await controller.exportAnalytics(query);

      expect(service.exportAnalytics).toHaveBeenCalledWith(query);
    });

    it('should export with event type filter', async () => {
      const query: ExportAnalyticsDto = {
        format: 'json',
        eventType: EventType.APPLICATION_SUBMITTED,
      };

      const expectedJson = [
        {
          id: 'event-1',
          eventType: EventType.APPLICATION_SUBMITTED,
          category: EventCategory.APPLICATION,
          userId: 'user-123',
        },
      ];

      mockAnalyticsService.exportAnalytics.mockResolvedValue(expectedJson);

      const result = await controller.exportAnalytics(query);

      expect(result).toEqual(expectedJson);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await controller.healthCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'analytics-service');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return current timestamp', async () => {
      const beforeTime = new Date().toISOString();
      const result = await controller.healthCheck();
      const afterTime = new Date().toISOString();

      expect(result.timestamp >= beforeTime).toBe(true);
      expect(result.timestamp <= afterTime).toBe(true);
    });
  });
});
