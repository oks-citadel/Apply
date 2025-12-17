import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from '../applications.controller';
import { ApplicationsService } from '../applications.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationDto, UpdateStatusDto } from '../dto/update-application.dto';
import { QueryApplicationDto } from '../dto/query-application.dto';
import { Application, ApplicationStatus } from '../entities/application.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ApplicationsController - Comprehensive Test Suite', () => {
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
    updateApplicationScreenshot: jest.fn(),
    updateApplicationError: jest.fn(),
    updateApplicationSuccess: jest.fn(),
  };

  const mockApplication: Application = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    job_id: '123e4567-e89b-12d3-a456-426614174002',
    resume_id: '123e4567-e89b-12d3-a456-426614174003',
    cover_letter_id: '123e4567-e89b-12d3-a456-426614174004',
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

  // Note: Controller uses @User('id') decorator to extract userId from JWT token
  // The decorator extracts userId before the method is called, so we pass userId string directly
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';

  describe('Application Submission Flow', () => {
    describe('POST /applications/manual - Submit Manual Application', () => {
      it('should create a manual application successfully', async () => {
        const createDto: CreateApplicationDto = {
          user_id: mockUserId,
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

        const result = await controller.logManualApplication(createDto, mockUserId);

        expect(result).toEqual(manualApplication);
        expect(result.auto_applied).toBe(false);
        expect(createDto.user_id).toBe(mockUserId);
        expect(mockApplicationsService.logManualApplication).toHaveBeenCalledWith(createDto);
      });

      it('should create application with resume and cover letter', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const createDto: CreateApplicationDto = {
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          job_id: '123e4567-e89b-12d3-a456-426614174002',
          resume_id: '123e4567-e89b-12d3-a456-426614174003',
          cover_letter_id: '123e4567-e89b-12d3-a456-426614174004',
          company_name: 'Test Company',
          position_title: 'Software Engineer',
        };

        mockApplicationsService.logManualApplication.mockResolvedValue(mockApplication);

        const result = await controller.logManualApplication(createDto, mockUserId);

        expect(result.resume_id).toBe('123e4567-e89b-12d3-a456-426614174003');
        expect(result.cover_letter_id).toBe('123e4567-e89b-12d3-a456-426614174004');
      });

      it('should override user_id from headers for security', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const createDto: CreateApplicationDto = {
          user_id: 'malicious-user-id',
          job_id: '123e4567-e89b-12d3-a456-426614174002',
          company_name: 'Test Company',
        };

        mockApplicationsService.logManualApplication.mockResolvedValue(mockApplication);

        await controller.logManualApplication(createDto, mockUserId);

        expect(createDto.user_id).toBe('123e4567-e89b-12d3-a456-426614174001');
      });

      it('should handle duplicate application prevention', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const createDto: CreateApplicationDto = {
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          job_id: '123e4567-e89b-12d3-a456-426614174002',
          company_name: 'Test Company',
        };

        mockApplicationsService.logManualApplication.mockRejectedValue(
          new BadRequestException('Application already exists for this job'),
        );

        await expect(controller.logManualApplication(createDto, headers)).rejects.toThrow(
          'Application already exists for this job',
        );
      });
    });
  });

  describe('Application Status Tracking', () => {
    describe('GET /applications/:id - Get Application Status', () => {
      it('should return application with all status details', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';

        mockApplicationsService.findOne.mockResolvedValue(mockApplication);

        const result = await controller.findOne(id, mockUserId);

        expect(result).toEqual(mockApplication);
        expect(result.status).toBe(ApplicationStatus.APPLIED);
        expect(mockApplicationsService.findOne).toHaveBeenCalledWith(id, '123e4567-e89b-12d3-a456-426614174001');
      });

      it('should throw NotFoundException for non-existent application', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = 'non-existent-id';

        mockApplicationsService.findOne.mockRejectedValue(
          new NotFoundException(`Application with ID ${id} not found`),
        );

        await expect(controller.findOne(id, headers)).rejects.toThrow(NotFoundException);
      });

      it('should prevent accessing other users applications', async () => {
        const headers = { 'x-user-id': 'different-user-id' };
        const id = '123e4567-e89b-12d3-a456-426614174000';

        mockApplicationsService.findOne.mockRejectedValue(
          new NotFoundException(`Application with ID ${id} not found`),
        );

        await expect(controller.findOne(id, headers)).rejects.toThrow(NotFoundException);
      });
    });

    describe('PUT /applications/:id/status - Update Status', () => {
      it('should update status to VIEWED', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const updateStatusDto: UpdateStatusDto = {
          status: ApplicationStatus.VIEWED,
        };

        const updatedApplication = {
          ...mockApplication,
          status: ApplicationStatus.VIEWED,
          response_received_at: new Date(),
        };

        mockApplicationsService.updateStatus.mockResolvedValue(updatedApplication);

        const result = await controller.updateStatus(id, updateStatusDto, mockUserId);

        expect(result.status).toBe(ApplicationStatus.VIEWED);
        expect(result.response_received_at).toBeDefined();
      });

      it('should update status to INTERVIEWING with notes', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const updateStatusDto: UpdateStatusDto = {
          status: ApplicationStatus.INTERVIEWING,
          notes: 'Phone screen scheduled for next week',
        };

        mockApplicationsService.updateStatus.mockResolvedValue({
          ...mockApplication,
          status: ApplicationStatus.INTERVIEWING,
          notes: 'Phone screen scheduled for next week',
        });

        const result = await controller.updateStatus(id, updateStatusDto, mockUserId);

        expect(result.status).toBe(ApplicationStatus.INTERVIEWING);
        expect(result.notes).toBe('Phone screen scheduled for next week');
      });

      it('should update status to OFFERED', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const updateStatusDto: UpdateStatusDto = {
          status: ApplicationStatus.OFFERED,
          notes: 'Received offer with 120k salary',
        };

        mockApplicationsService.updateStatus.mockResolvedValue({
          ...mockApplication,
          status: ApplicationStatus.OFFERED,
          notes: 'Received offer with 120k salary',
        });

        const result = await controller.updateStatus(id, updateStatusDto, mockUserId);

        expect(result.status).toBe(ApplicationStatus.OFFERED);
      });

      it('should update status to REJECTED', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const updateStatusDto: UpdateStatusDto = {
          status: ApplicationStatus.REJECTED,
          notes: 'Position filled',
        };

        mockApplicationsService.updateStatus.mockResolvedValue({
          ...mockApplication,
          status: ApplicationStatus.REJECTED,
          notes: 'Position filled',
        });

        const result = await controller.updateStatus(id, updateStatusDto, mockUserId);

        expect(result.status).toBe(ApplicationStatus.REJECTED);
      });
    });
  });

  describe('Application Withdrawal', () => {
    describe('DELETE /applications/:id - Withdraw Application', () => {
      it('should withdraw application successfully', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';

        mockApplicationsService.remove.mockResolvedValue(undefined);

        const result = await controller.remove(id, mockUserId);

        expect(result).toEqual({ message: 'Application deleted successfully' });
        expect(mockApplicationsService.remove).toHaveBeenCalledWith(id, '123e4567-e89b-12d3-a456-426614174001');
      });

      it('should throw NotFoundException when withdrawing non-existent application', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = 'non-existent-id';

        mockApplicationsService.remove.mockRejectedValue(
          new NotFoundException(`Application with ID ${id} not found`),
        );

        await expect(controller.remove(id, headers)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Application List and Filtering', () => {
    describe('GET /applications - List Applications', () => {
      it('should return all applications with default filters', async () => {
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
        expect(result.data).toHaveLength(1);
      });

      it('should filter by status', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const query: QueryApplicationDto = {
          page: 1,
          limit: 20,
          status: ApplicationStatus.INTERVIEWING,
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
          expect.objectContaining({ status: ApplicationStatus.INTERVIEWING }),
        );
      });

      it('should filter by company name', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const query: QueryApplicationDto = {
          page: 1,
          limit: 20,
          company_name: 'Google',
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
          expect.objectContaining({ company_name: 'Google' }),
        );
      });

      it('should filter by ATS platform', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const query: QueryApplicationDto = {
          page: 1,
          limit: 20,
          ats_platform: 'lever',
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
          expect.objectContaining({ ats_platform: 'lever' }),
        );
      });

      it('should handle pagination correctly', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const query: QueryApplicationDto = {
          page: 2,
          limit: 10,
          sort_by: 'created_at',
          sort_order: 'DESC',
        };

        mockApplicationsService.findAll.mockResolvedValue({
          data: [],
          meta: { total: 50, page: 2, limit: 10, total_pages: 5 },
        });

        const result = await controller.findAll(headers, query);

        expect(result.meta.page).toBe(2);
        expect(result.meta.limit).toBe(10);
        expect(result.meta.total_pages).toBe(5);
      });

      it('should combine multiple filters', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const query: QueryApplicationDto = {
          page: 1,
          limit: 20,
          status: ApplicationStatus.INTERVIEWING,
          company_name: 'Google',
          ats_platform: 'lever',
          sort_by: 'applied_at',
          sort_order: 'ASC',
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
    });
  });

  describe('Application Analytics', () => {
    describe('GET /applications/analytics - Get Analytics', () => {
      it('should return comprehensive analytics', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const mockAnalytics = {
          total_applications: 50,
          status_breakdown: {
            [ApplicationStatus.APPLIED]: 20,
            [ApplicationStatus.VIEWED]: 15,
            [ApplicationStatus.INTERVIEWING]: 8,
            [ApplicationStatus.OFFERED]: 3,
            [ApplicationStatus.REJECTED]: 4,
          },
          auto_applied_count: 40,
          manual_applied_count: 10,
          average_match_score: 82.5,
          response_rate: 60,
          platform_breakdown: {
            greenhouse: 25,
            lever: 15,
            workday: 10,
          },
          applications_last_30_days: 25,
        };

        mockApplicationsService.getAnalytics.mockResolvedValue(mockAnalytics);

        const result = await controller.getAnalytics(headers);

        expect(result).toEqual(mockAnalytics);
        expect(result.total_applications).toBe(50);
        expect(result.response_rate).toBe(60);
      });

      it('should handle empty analytics', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const emptyAnalytics = {
          total_applications: 0,
          status_breakdown: {},
          auto_applied_count: 0,
          manual_applied_count: 0,
          average_match_score: 0,
          response_rate: 0,
          platform_breakdown: {},
          applications_last_30_days: 0,
        };

        mockApplicationsService.getAnalytics.mockResolvedValue(emptyAnalytics);

        const result = await controller.getAnalytics(headers);

        expect(result.total_applications).toBe(0);
      });
    });
  });

  describe('Application Update Operations', () => {
    describe('PUT /applications/:id - Update Application', () => {
      it('should update application notes', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const updateDto: UpdateApplicationDto = {
          notes: 'Updated notes with interview feedback',
        };

        const updatedApplication = { ...mockApplication, ...updateDto };
        mockApplicationsService.update.mockResolvedValue(updatedApplication);

        const result = await controller.update(id, updateDto, headers);

        expect(result.notes).toBe('Updated notes with interview feedback');
      });

      it('should update multiple fields', async () => {
        const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
        const id = '123e4567-e89b-12d3-a456-426614174000';
        const updateDto: UpdateApplicationDto = {
          notes: 'Interview completed',
          status: ApplicationStatus.INTERVIEWING,
        };

        mockApplicationsService.update.mockResolvedValue({
          ...mockApplication,
          ...updateDto,
        });

        const result = await controller.update(id, updateDto, headers);

        expect(result.notes).toBe('Interview completed');
        expect(result.status).toBe(ApplicationStatus.INTERVIEWING);
      });
    });
  });

  describe('Application Timeline', () => {
    it('should track application lifecycle timestamps', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';

      const applicationWithTimeline = {
        ...mockApplication,
        applied_at: new Date('2024-01-15T10:00:00Z'),
        response_received_at: new Date('2024-01-20T14:30:00Z'),
        created_at: new Date('2024-01-15T09:30:00Z'),
        updated_at: new Date('2024-01-20T14:30:00Z'),
      };

      mockApplicationsService.findOne.mockResolvedValue(applicationWithTimeline);

      const result = await controller.findOne(id, mockUserId);

      expect(result.applied_at).toBeDefined();
      expect(result.response_received_at).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
    });
  });

  describe('Document and Cover Letter Management', () => {
    it('should include resume and cover letter IDs', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';

      mockApplicationsService.findOne.mockResolvedValue(mockApplication);

      const result = await controller.findOne(id, mockUserId);

      expect(result.resume_id).toBe('123e4567-e89b-12d3-a456-426614174003');
      expect(result.cover_letter_id).toBe('123e4567-e89b-12d3-a456-426614174004');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';

      mockApplicationsService.findOne.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.findOne(id, headers)).rejects.toThrow('Database connection failed');
    });

    it('should validate UUID format in parameters', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const invalidId = 'invalid-uuid';

      mockApplicationsService.findOne.mockRejectedValue(
        new NotFoundException(`Application with ID ${invalidId} not found`),
      );

      await expect(controller.findOne(invalidId, headers)).rejects.toThrow(NotFoundException);
    });

    it('should handle concurrent status updates', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.INTERVIEWING,
      };

      mockApplicationsService.updateStatus.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.INTERVIEWING,
      });

      const result = await controller.updateStatus(id, updateStatusDto, mockUserId);

      expect(result.status).toBe(ApplicationStatus.INTERVIEWING);
    });

    it('should handle empty result sets', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        status: ApplicationStatus.OFFERED,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      mockApplicationsService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, total_pages: 0 },
      });

      const result = await controller.findAll(headers, query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('Auto-Apply Integration', () => {
    it('should distinguish between auto-applied and manual applications', async () => {
      const headers = { 'x-user-id': '123e4567-e89b-12d3-a456-426614174001' };
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      const autoApplication = { ...mockApplication, auto_applied: true };
      const manualApplication = { ...mockApplication, id: '2', auto_applied: false };

      mockApplicationsService.findAll.mockResolvedValue({
        data: [autoApplication, manualApplication],
        meta: { total: 2, page: 1, limit: 20, total_pages: 1 },
      });

      const result = await controller.findAll(headers, query);

      expect(result.data[0].auto_applied).toBe(true);
      expect(result.data[1].auto_applied).toBe(false);
    });
  });
});
