import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { Application, ApplicationStatus } from './entities/application.entity';
import { BadRequestException } from '@nestjs/common';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let service: jest.Mocked<ApplicationsService>;

  const mockApplicationsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    getAnalytics: jest.fn(),
    logManualApplication: jest.fn(),
  };

  const mockApplication: Application = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    job_id: '123e4567-e89b-12d3-a456-426614174002',
    resume_id: '123e4567-e89b-12d3-a456-426614174003',
    cover_letter_id: null,
    status: ApplicationStatus.APPLIED,
    applied_at: new Date('2024-01-15'),
    response_received_at: null,
    match_score: 85.5,
    auto_applied: true,
    notes: 'Test application',
    company_name: 'Test Company',
    position_title: 'Software Engineer',
    application_url: 'https://test.com/apply',
    ats_platform: 'greenhouse',
    application_reference_id: 'APP-12345',
    screenshot_url: 'https://screenshots.com/test.png',
    form_responses: { question1: 'answer1' },
    error_log: null,
    retry_count: 0,
    queue_status: 'completed',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: mockApplicationsService,
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
    service = module.get(ApplicationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('extractUserId', () => {
    it('should extract user ID from headers', () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const userId = controller['extractUserId'](headers);

      expect(userId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should throw BadRequestException if user ID is missing', () => {
      const headers = {};

      expect(() => controller['extractUserId'](headers)).toThrow(BadRequestException);
      expect(() => controller['extractUserId'](headers)).toThrow(
        'User ID is required in headers',
      );
    });

    it('should throw BadRequestException if user ID is undefined', () => {
      const headers = { 'x-user-id': undefined };

      expect(() => controller['extractUserId'](headers)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user ID is null', () => {
      const headers = { 'x-user-id': null };

      expect(() => controller['extractUserId'](headers)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user ID is empty string', () => {
      const headers = { 'x-user-id': '' };

      expect(() => controller['extractUserId'](headers)).toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all applications for a user', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };
      const mockResponse = {
        data: [mockApplication],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          total_pages: 1,
        },
      };

      mockApplicationsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(headers, query);

      expect(result).toEqual(mockResponse);
      expect(mockApplicationsService.findAll).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174001',
        query,
      );
    });

    it('should throw BadRequestException if user ID is missing', async () => {
      const headers = {};
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      await expect(controller.findAll(headers, query)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass filters to service', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const query: QueryApplicationDto = {
        page: 2,
        limit: 10,
        status: ApplicationStatus.INTERVIEWING,
        company_name: 'Google',
        ats_platform: 'lever',
        sort_by: 'company_name',
        sort_order: 'ASC',
      };
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 2, limit: 10, total_pages: 0 },
      };

      mockApplicationsService.findAll.mockResolvedValue(mockResponse);

      await controller.findAll(headers, query);

      expect(mockApplicationsService.findAll).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174001',
        query,
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for a user', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const mockAnalytics = {
        total_applications: 10,
        status_breakdown: {
          [ApplicationStatus.APPLIED]: 5,
          [ApplicationStatus.INTERVIEWING]: 3,
          [ApplicationStatus.REJECTED]: 2,
        },
        auto_applied_count: 8,
        manual_applied_count: 2,
        average_match_score: 82.5,
        response_rate: 60,
        platform_breakdown: {
          greenhouse: 5,
          lever: 3,
          workday: 2,
        },
        applications_last_30_days: 7,
      };

      mockApplicationsService.getAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getAnalytics(headers);

      expect(result).toEqual(mockAnalytics);
      expect(mockApplicationsService.getAnalytics).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174001',
      );
    });

    it('should throw BadRequestException if user ID is missing', async () => {
      const headers = {};

      await expect(controller.getAnalytics(headers)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single application', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';

      mockApplicationsService.findOne.mockResolvedValue(mockApplication);

      const result = await controller.findOne(id, headers);

      expect(result).toEqual(mockApplication);
      expect(mockApplicationsService.findOne).toHaveBeenCalledWith(
        id,
        '123e4567-e89b-12d3-a456-426614174001',
      );
    });

    it('should throw BadRequestException if user ID is missing', async () => {
      const headers = {};
      const id = '123e4567-e89b-12d3-a456-426614174000';

      await expect(controller.findOne(id, headers)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logManualApplication', () => {
    it('should create a manual application', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const createDto: CreateApplicationDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        job_id: '123e4567-e89b-12d3-a456-426614174002',
        company_name: 'Test Company',
        position_title: 'Software Engineer',
      };

      const manualApplication = {
        ...mockApplication,
        auto_applied: false,
        queue_status: 'completed',
      };

      mockApplicationsService.logManualApplication.mockResolvedValue(manualApplication);

      const result = await controller.logManualApplication(createDto, headers);

      expect(result).toEqual(manualApplication);
      expect(createDto.user_id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(mockApplicationsService.logManualApplication).toHaveBeenCalledWith(createDto);
    });

    it('should override user_id from headers', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const createDto: CreateApplicationDto = {
        user_id: 'different-user-id',
        job_id: '123e4567-e89b-12d3-a456-426614174002',
        company_name: 'Test Company',
      };

      mockApplicationsService.logManualApplication.mockResolvedValue(mockApplication);

      await controller.logManualApplication(createDto, headers);

      expect(createDto.user_id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(mockApplicationsService.logManualApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: '123e4567-e89b-12d3-a456-426614174001',
        }),
      );
    });

    it('should throw BadRequestException if user ID is missing', async () => {
      const headers = {};
      const createDto: CreateApplicationDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        job_id: '123e4567-e89b-12d3-a456-426614174002',
      };

      await expect(controller.logManualApplication(createDto, headers)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update an application', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto: UpdateApplicationDto = {
        notes: 'Updated notes',
        status: ApplicationStatus.INTERVIEWING,
      };

      const updatedApplication = { ...mockApplication, ...updateDto };

      mockApplicationsService.update.mockResolvedValue(updatedApplication);

      const result = await controller.update(id, updateDto, headers);

      expect(result).toEqual(updatedApplication);
      expect(mockApplicationsService.update).toHaveBeenCalledWith(
        id,
        '123e4567-e89b-12d3-a456-426614174001',
        updateDto,
      );
    });

    it('should throw BadRequestException if user ID is missing', async () => {
      const headers = {};
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto: UpdateApplicationDto = { notes: 'Test' };

      await expect(controller.update(id, updateDto, headers)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update application status', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.INTERVIEWING,
      };

      const updatedApplication = {
        ...mockApplication,
        status: ApplicationStatus.INTERVIEWING,
      };

      mockApplicationsService.updateStatus.mockResolvedValue(updatedApplication);

      const result = await controller.updateStatus(id, updateStatusDto, headers);

      expect(result).toEqual(updatedApplication);
      expect(mockApplicationsService.updateStatus).toHaveBeenCalledWith(
        id,
        '123e4567-e89b-12d3-a456-426614174001',
        updateStatusDto,
      );
    });

    it('should update status with notes', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.REJECTED,
        notes: 'Position filled',
      };

      mockApplicationsService.updateStatus.mockResolvedValue({
        ...mockApplication,
        ...updateStatusDto,
      });

      await controller.updateStatus(id, updateStatusDto, headers);

      expect(mockApplicationsService.updateStatus).toHaveBeenCalledWith(
        id,
        '123e4567-e89b-12d3-a456-426614174001',
        updateStatusDto,
      );
    });

    it('should throw BadRequestException if user ID is missing', async () => {
      const headers = {};
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.INTERVIEWING,
      };

      await expect(controller.updateStatus(id, updateStatusDto, headers)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an application', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';

      mockApplicationsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id, headers);

      expect(result).toEqual({ message: 'Application deleted successfully' });
      expect(mockApplicationsService.remove).toHaveBeenCalledWith(
        id,
        '123e4567-e89b-12d3-a456-426614174001',
      );
    });

    it('should throw BadRequestException if user ID is missing', async () => {
      const headers = {};
      const id = '123e4567-e89b-12d3-a456-426614174000';

      await expect(controller.remove(id, headers)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('header validation edge cases', () => {
    it('should handle headers with different casing', () => {
      const headers = { 'X-User-Id': '123e4567-e89b-12d3-a456-426614174001' };

      // Note: Express typically lowercases headers, but test the actual behavior
      expect(() => controller['extractUserId'](headers)).toThrow(BadRequestException);
    });

    it('should handle headers as object with multiple properties', () => {
      const headers = {
        'x-user-id': '123e4567-e89b-12d3-a456-426614174001',
        'content-type': 'application/json',
        'authorization': 'Bearer token',
      };

      const userId = controller['extractUserId'](headers);
      expect(userId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('integration with query parameters', () => {
    it('should handle empty query parameters', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      mockApplicationsService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, total_pages: 0 },
      });

      await controller.findAll(headers, query);

      expect(mockApplicationsService.findAll).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174001',
        query,
      );
    });

    it('should handle all optional query parameters', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const query: QueryApplicationDto = {
        page: 1,
        limit: 50,
        status: ApplicationStatus.OFFERED,
        company_name: 'Microsoft',
        ats_platform: 'workday',
        sort_by: 'applied_at',
        sort_order: 'ASC',
      };

      mockApplicationsService.findAll.mockResolvedValue({
        data: [mockApplication],
        meta: { total: 1, page: 1, limit: 50, total_pages: 1 },
      });

      await controller.findAll(headers, query);

      expect(mockApplicationsService.findAll).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174001',
        query,
      );
    });
  });
});
