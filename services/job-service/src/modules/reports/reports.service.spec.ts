import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { JobReport } from './entities/report.entity';
import { ReportType, ReportStatus } from './enums/report-type.enum';
import { ReportsService } from './reports.service';
import { Job } from '../jobs/entities/job.entity';

import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: Repository<JobReport>;
  let jobRepository: Repository<Job>;

  const mockJobReport = {
    id: 'report-123',
    job_id: 'job-123',
    user_id: 'user-123',
    report_type: ReportType.SPAM,
    reason: 'This is spam',
    description: 'Detailed spam description',
    status: ReportStatus.PENDING,
    resolved_by: null,
    resolved_at: null,
    resolution_notes: null,
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockJob = {
    id: 'job-123',
    title: 'Test Job',
    is_active: true,
  };

  const mockReportRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
  };

  const mockJobRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(JobReport),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get<Repository<JobReport>>(getRepositoryToken(JobReport));
    jobRepository = module.get<Repository<Job>>(getRepositoryToken(Job));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a new report successfully', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockReportRepository.findOne.mockResolvedValue(null);
      mockReportRepository.create.mockReturnValue(mockJobReport);
      mockReportRepository.save.mockResolvedValue(mockJobReport);

      const result = await service.createReport('job-123', 'user-123', {
        reportType: ReportType.SPAM,
        reason: 'This is spam',
        description: 'Detailed spam description',
      });

      expect(result).toBeDefined();
      expect(result.reportType).toBe(ReportType.SPAM);
      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-123' },
      });
      expect(mockReportRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if job does not exist', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createReport('job-123', 'user-123', {
          reportType: ReportType.SPAM,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already reported the job', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockReportRepository.findOne.mockResolvedValue(mockJobReport);

      await expect(
        service.createReport('job-123', 'user-123', {
          reportType: ReportType.SPAM,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getReports', () => {
    it('should return paginated reports', async () => {
      mockReportRepository.findAndCount.mockResolvedValue([[mockJobReport], 1]);

      const result = await service.getReports({
        page: 1,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('updateReport', () => {
    it('should update report status', async () => {
      const updatedReport = {
        ...mockJobReport,
        status: ReportStatus.RESOLVED,
        resolved_by: 'admin-123',
        resolved_at: new Date(),
      };

      mockReportRepository.findOne.mockResolvedValue(mockJobReport);
      mockReportRepository.save.mockResolvedValue(updatedReport);
      mockJobRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateReport('report-123', 'admin-123', {
        status: ReportStatus.RESOLVED,
        resolutionNotes: 'Spam removed',
      });

      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(mockReportRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if report does not exist', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateReport('report-123', 'admin-123', {
          status: ReportStatus.RESOLVED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReportStats', () => {
    it('should return report statistics', async () => {
      mockReportRepository.count.mockResolvedValue(10);

      const result = await service.getReportStats();

      expect(result).toBeDefined();
      expect(result.total).toBe(10);
      expect(result.byType).toBeDefined();
    });
  });

  describe('hasUserReportedJob', () => {
    it('should return true if user has reported job', async () => {
      mockReportRepository.findOne.mockResolvedValue(mockJobReport);

      const result = await service.hasUserReportedJob('user-123', 'job-123');

      expect(result).toBe(true);
    });

    it('should return false if user has not reported job', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);

      const result = await service.hasUserReportedJob('user-123', 'job-123');

      expect(result).toBe(false);
    });
  });
});
