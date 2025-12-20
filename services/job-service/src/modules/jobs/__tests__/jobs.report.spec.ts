import { HttpService } from '@nestjs/axios';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ReportType } from '../../reports/enums/report-type.enum';
import { ReportsService } from '../../reports/reports.service';
import { SearchService } from '../../search/search.service';
import { Job } from '../entities/job.entity';
import { SavedJob } from '../entities/saved-job.entity';
import { JobsService } from '../jobs.service';

import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';

describe('JobsService - Report Functionality', () => {
  let service: JobsService;
  let reportsService: ReportsService;
  let jobRepository: Repository<Job>;

  const mockJob = {
    id: 'job-123',
    title: 'Software Engineer',
    description: 'Great opportunity',
    is_active: true,
  };

  const mockReport = {
    id: 'report-123',
    jobId: 'job-123',
    userId: 'user-123',
    reportType: ReportType.SPAM,
    reason: 'spam',
    description: 'This looks like a scam',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJobRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReportsService = {
    createReport: jest.fn(),
    getReportsByJobId: jest.fn(),
    hasUserReportedJob: jest.fn(),
    getJobReportCount: jest.fn(),
  };

  const mockSearchService = {
    searchJobs: jest.fn(),
    findSimilarJobs: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'AI_SERVICE_URL') {return 'http://ai-service:8000';}
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: getRepositoryToken(SavedJob),
          useValue: {},
        },
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    reportsService = module.get<ReportsService>(ReportsService);
    jobRepository = module.get<Repository<Job>>(getRepositoryToken(Job));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('reportJob', () => {
    it('should successfully create a job report', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockReportsService.createReport.mockResolvedValue(mockReport);

      const reportDto = {
        reason: 'spam',
        details: 'This looks like a scam',
      };

      const result = await service.reportJob('job-123', reportDto, 'user-123');

      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-123' },
      });

      expect(mockReportsService.createReport).toHaveBeenCalledWith(
        'job-123',
        'user-123',
        {
          reportType: 'spam',
          reason: 'spam',
          description: 'This looks like a scam',
        },
      );

      expect(result).toEqual({
        message: 'Job reported successfully. Our team will review it shortly.',
        reportId: 'report-123',
      });
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      const reportDto = {
        reason: 'spam',
        details: 'This looks like a scam',
      };

      await expect(
        service.reportJob('invalid-job-id', reportDto, 'user-123'),
      ).rejects.toThrow(NotFoundException);

      expect(mockReportsService.createReport).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockReportsService.createReport.mockRejectedValue(
        new Error('Database error'),
      );

      const reportDto = {
        reason: 'spam',
        details: 'This looks like a scam',
      };

      await expect(
        service.reportJob('job-123', reportDto, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getJobReports', () => {
    it('should return reports for a job', async () => {
      const mockReportsResponse = {
        data: [mockReport],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      };

      mockReportsService.getReportsByJobId.mockResolvedValue(
        mockReportsResponse,
      );

      const result = await service.getJobReports('job-123', 1, 20);

      expect(mockReportsService.getReportsByJobId).toHaveBeenCalledWith(
        'job-123',
        1,
        20,
      );
      expect(result).toEqual(mockReportsResponse);
    });
  });

  describe('hasUserReportedJob', () => {
    it('should return true if user has reported the job', async () => {
      mockReportsService.hasUserReportedJob.mockResolvedValue(true);

      const result = await service.hasUserReportedJob('user-123', 'job-123');

      expect(mockReportsService.hasUserReportedJob).toHaveBeenCalledWith(
        'user-123',
        'job-123',
      );
      expect(result).toBe(true);
    });

    it('should return false if user has not reported the job', async () => {
      mockReportsService.hasUserReportedJob.mockResolvedValue(false);

      const result = await service.hasUserReportedJob('user-123', 'job-123');

      expect(mockReportsService.hasUserReportedJob).toHaveBeenCalledWith(
        'user-123',
        'job-123',
      );
      expect(result).toBe(false);
    });
  });

  describe('getJobReportCount', () => {
    it('should return the count of reports for a job', async () => {
      mockReportsService.getJobReportCount.mockResolvedValue(5);

      const result = await service.getJobReportCount('job-123');

      expect(mockReportsService.getJobReportCount).toHaveBeenCalledWith(
        'job-123',
      );
      expect(result).toBe(5);
    });

    it('should return 0 if no reports exist', async () => {
      mockReportsService.getJobReportCount.mockResolvedValue(0);

      const result = await service.getJobReportCount('job-123');

      expect(result).toBe(0);
    });
  });
});
