import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { NotFoundException } from '@nestjs/common';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let repository: jest.Mocked<Repository<Application>>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    repository = module.get(getRepositoryToken(Application));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new application', async () => {
      const createDto: CreateApplicationDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        job_id: '123e4567-e89b-12d3-a456-426614174002',
        resume_id: '123e4567-e89b-12d3-a456-426614174003',
        company_name: 'Test Company',
        position_title: 'Software Engineer',
        match_score: 85.5,
      };

      mockRepository.create.mockReturnValue(mockApplication);
      mockRepository.save.mockResolvedValue(mockApplication);

      const result = await service.create(createDto);

      expect(result).toEqual(mockApplication);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        applied_at: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockApplication);
    });

    it('should create application with optional fields', async () => {
      const createDto: CreateApplicationDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        job_id: '123e4567-e89b-12d3-a456-426614174002',
        cover_letter_id: '123e4567-e89b-12d3-a456-426614174004',
        notes: 'Custom notes',
        form_responses: { question1: 'answer1' },
      };

      mockRepository.create.mockReturnValue(mockApplication);
      mockRepository.save.mockResolvedValue(mockApplication);

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        applied_at: expect.any(Date),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated applications with default query params', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      const applications = [mockApplication];
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(applications);

      const result = await service.findAll(userId, query);

      expect(result.data).toEqual(applications);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      });
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('application');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('application.user_id = :userId', { userId });
    });

    it('should filter by status', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        status: ApplicationStatus.APPLIED,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockApplication]);

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'application.status = :status',
        { status: ApplicationStatus.APPLIED },
      );
    });

    it('should filter by company name with ILIKE', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        company_name: 'Test',
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockApplication]);

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'application.company_name ILIKE :company_name',
        { company_name: '%Test%' },
      );
    });

    it('should filter by ats_platform', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        ats_platform: 'greenhouse',
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockApplication]);

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'application.ats_platform = :ats_platform',
        { ats_platform: 'greenhouse' },
      );
    });

    it('should apply pagination correctly', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const query: QueryApplicationDto = {
        page: 3,
        limit: 10,
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(50);
      mockQueryBuilder.getMany.mockResolvedValue([mockApplication]);

      const result = await service.findAll(userId, query);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20); // (page - 1) * limit = (3 - 1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.meta.total_pages).toBe(5); // Math.ceil(50 / 10)
    });

    it('should apply custom sorting', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        sort_by: 'company_name',
        sort_order: 'ASC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockApplication]);

      await service.findAll(userId, query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('application.company_name', 'ASC');
    });

    it('should combine multiple filters', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const query: QueryApplicationDto = {
        page: 1,
        limit: 20,
        status: ApplicationStatus.INTERVIEWING,
        company_name: 'Google',
        ats_platform: 'lever',
        sort_by: 'created_at',
        sort_order: 'DESC',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockApplication]);

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'application.status = :status',
        { status: ApplicationStatus.INTERVIEWING },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'application.company_name ILIKE :company_name',
        { company_name: '%Google%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'application.ats_platform = :ats_platform',
        { ats_platform: 'lever' },
      );
    });
  });

  describe('findOne', () => {
    it('should return an application by id and userId', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';

      mockRepository.findOne.mockResolvedValue(mockApplication);

      const result = await service.findOne(id, userId);

      expect(result).toEqual(mockApplication);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, user_id: userId },
      });
    });

    it('should throw NotFoundException if application not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id, userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id, userId)).rejects.toThrow(
        `Application with ID ${id} not found`,
      );
    });

    it('should not return application for different user', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const differentUserId = '123e4567-e89b-12d3-a456-426614174099';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id, differentUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an application', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const updateDto: UpdateApplicationDto = {
        notes: 'Updated notes',
        status: ApplicationStatus.INTERVIEWING,
      };

      const updatedApplication = { ...mockApplication, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockApplication);
      mockRepository.save.mockResolvedValue(updatedApplication);

      const result = await service.update(id, userId, updateDto);

      expect(result).toEqual(updatedApplication);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });

    it('should throw NotFoundException if application not found for update', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const updateDto: UpdateApplicationDto = { notes: 'Test' };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(id, userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update application status', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.INTERVIEWING,
      };

      const updatedApplication = {
        ...mockApplication,
        status: ApplicationStatus.INTERVIEWING,
      };

      mockRepository.findOne.mockResolvedValue(mockApplication);
      mockRepository.save.mockResolvedValue(updatedApplication);

      const result = await service.updateStatus(id, userId, updateStatusDto);

      expect(result.status).toBe(ApplicationStatus.INTERVIEWING);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update status with notes', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.REJECTED,
        notes: 'Position filled',
      };

      mockRepository.findOne.mockResolvedValue(mockApplication);
      mockRepository.save.mockResolvedValue({
        ...mockApplication,
        ...updateStatusDto,
      });

      const result = await service.updateStatus(id, userId, updateStatusDto);

      expect(result.status).toBe(ApplicationStatus.REJECTED);
      expect(result.notes).toBe('Position filled');
    });

    it('should set response_received_at when status changes from APPLIED', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.VIEWED,
      };

      const applicationWithoutResponse = {
        ...mockApplication,
        response_received_at: null,
      };

      mockRepository.findOne.mockResolvedValue(applicationWithoutResponse);
      mockRepository.save.mockResolvedValue({
        ...applicationWithoutResponse,
        status: ApplicationStatus.VIEWED,
        response_received_at: new Date(),
      });

      await service.updateStatus(id, userId, updateStatusDto);

      const savedApplication = mockRepository.save.mock.calls[0][0];
      expect(savedApplication.response_received_at).toBeInstanceOf(Date);
    });

    it('should not update response_received_at if already set', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const existingDate = new Date('2024-01-10');
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.INTERVIEWING,
      };

      const applicationWithResponse = {
        ...mockApplication,
        response_received_at: existingDate,
      };

      mockRepository.findOne.mockResolvedValue(applicationWithResponse);
      mockRepository.save.mockResolvedValue(applicationWithResponse);

      await service.updateStatus(id, userId, updateStatusDto);

      const savedApplication = mockRepository.save.mock.calls[0][0];
      expect(savedApplication.response_received_at).toEqual(existingDate);
    });

    it('should not set response_received_at if status is APPLIED', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const updateStatusDto: UpdateStatusDto = {
        status: ApplicationStatus.APPLIED,
      };

      mockRepository.findOne.mockResolvedValue(mockApplication);
      mockRepository.save.mockResolvedValue(mockApplication);

      await service.updateStatus(id, userId, updateStatusDto);

      const savedApplication = mockRepository.save.mock.calls[0][0];
      expect(savedApplication.status).toBe(ApplicationStatus.APPLIED);
    });
  });

  describe('remove', () => {
    it('should delete an application', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';

      mockRepository.findOne.mockResolvedValue(mockApplication);
      mockRepository.remove.mockResolvedValue(mockApplication);

      await service.remove(id, userId);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockApplication);
    });

    it('should throw NotFoundException if application not found for deletion', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for user applications', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const applications: Application[] = [
        { ...mockApplication, status: ApplicationStatus.APPLIED, auto_applied: true, match_score: 85, response_received_at: null },
        { ...mockApplication, id: '2', status: ApplicationStatus.VIEWED, auto_applied: true, match_score: 90, response_received_at: new Date() },
        { ...mockApplication, id: '3', status: ApplicationStatus.INTERVIEWING, auto_applied: false, match_score: 95, response_received_at: new Date() },
        { ...mockApplication, id: '4', status: ApplicationStatus.REJECTED, auto_applied: true, match_score: 70, response_received_at: new Date(), ats_platform: 'lever' },
      ];

      mockRepository.find.mockResolvedValue(applications);

      const result = await service.getAnalytics(userId);

      expect(result.total_applications).toBe(4);
      expect(result.auto_applied_count).toBe(3);
      expect(result.manual_applied_count).toBe(1);
      expect(result.average_match_score).toBe(85); // (85 + 90 + 95 + 70) / 4 = 85
      expect(result.response_rate).toBe(75); // 3 out of 4 have response_received_at
      expect(result.status_breakdown).toEqual({
        [ApplicationStatus.APPLIED]: 1,
        [ApplicationStatus.VIEWED]: 1,
        [ApplicationStatus.INTERVIEWING]: 1,
        [ApplicationStatus.REJECTED]: 1,
      });
      expect(result.platform_breakdown).toEqual({
        greenhouse: 3,
        lever: 1,
      });
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
    });

    it('should handle zero applications', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';

      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAnalytics(userId);

      expect(result.total_applications).toBe(0);
      expect(result.auto_applied_count).toBe(0);
      expect(result.manual_applied_count).toBe(0);
      expect(result.average_match_score).toBe(0);
      expect(result.response_rate).toBe(0);
      expect(result.status_breakdown).toEqual({});
    });

    it('should calculate applications in last 30 days', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const now = new Date();
      const old = new Date();
      old.setDate(old.getDate() - 31);

      const applications: Application[] = [
        { ...mockApplication, created_at: now },
        { ...mockApplication, id: '2', created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) }, // 10 days ago
        { ...mockApplication, id: '3', created_at: old }, // 31 days ago
      ];

      mockRepository.find.mockResolvedValue(applications);

      const result = await service.getAnalytics(userId);

      expect(result.applications_last_30_days).toBe(2);
    });

    it('should handle applications without match_score', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const applications: Application[] = [
        { ...mockApplication, match_score: null },
        { ...mockApplication, id: '2', match_score: 80 },
      ];

      mockRepository.find.mockResolvedValue(applications);

      const result = await service.getAnalytics(userId);

      expect(result.average_match_score).toBe(40); // (0 + 80) / 2
    });

    it('should handle applications without ats_platform', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const applications: Application[] = [
        { ...mockApplication, ats_platform: null },
        { ...mockApplication, id: '2', ats_platform: 'greenhouse' },
      ];

      mockRepository.find.mockResolvedValue(applications);

      const result = await service.getAnalytics(userId);

      expect(result.platform_breakdown).toEqual({
        greenhouse: 1,
      });
    });
  });

  describe('logManualApplication', () => {
    it('should create a manual application', async () => {
      const createDto: CreateApplicationDto = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        job_id: '123e4567-e89b-12d3-a456-426614174002',
        company_name: 'Manual Company',
        position_title: 'Manual Position',
      };

      const manualApplication = {
        ...mockApplication,
        auto_applied: false,
        queue_status: 'completed',
      };

      mockRepository.create.mockReturnValue(manualApplication);
      mockRepository.save.mockResolvedValue(manualApplication);

      const result = await service.logManualApplication(createDto);

      expect(result.auto_applied).toBe(false);
      expect(result.queue_status).toBe('completed');
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        auto_applied: false,
        applied_at: expect.any(Date),
        queue_status: 'completed',
      });
    });
  });

  describe('updateApplicationScreenshot', () => {
    it('should update screenshot URL', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const screenshotUrl = 'https://screenshots.com/new.png';

      mockRepository.update.mockResolvedValue(undefined);

      await service.updateApplicationScreenshot(id, screenshotUrl);

      expect(mockRepository.update).toHaveBeenCalledWith(id, { screenshot_url: screenshotUrl });
    });
  });

  describe('updateApplicationError', () => {
    it('should update application with error log', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const error = { message: 'CAPTCHA detected', code: 'CAPTCHA_ERROR' };
      const retryCount = 2;

      mockRepository.update.mockResolvedValue(undefined);

      await service.updateApplicationError(id, error, retryCount);

      expect(mockRepository.update).toHaveBeenCalledWith(id, {
        error_log: error,
        retry_count: retryCount,
        queue_status: 'failed',
      });
    });
  });

  describe('updateApplicationSuccess', () => {
    it('should update application on successful submission', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const applicationReferenceId = 'APP-54321';
      const screenshotUrl = 'https://screenshots.com/success.png';

      mockRepository.update.mockResolvedValue(undefined);

      await service.updateApplicationSuccess(id, applicationReferenceId, screenshotUrl);

      expect(mockRepository.update).toHaveBeenCalledWith(id, {
        application_reference_id: applicationReferenceId,
        screenshot_url: screenshotUrl,
        queue_status: 'completed',
        applied_at: expect.any(Date),
      });
    });
  });
});
