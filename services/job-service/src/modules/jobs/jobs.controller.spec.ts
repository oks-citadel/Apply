import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { RemoteType, ExperienceLevel, EmploymentType, JobSource } from './entities/job.entity';

describe('JobsController', () => {
  let controller: JobsController;
  let service: jest.Mocked<JobsService>;

  const mockJob = {
    id: 'job-1',
    external_id: 'ext-123',
    source: JobSource.DIRECT,
    title: 'Senior Software Engineer',
    company_id: 'company-1',
    company_name: 'Tech Corp',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    remote_type: RemoteType.HYBRID,
    salary_min: 120000,
    salary_max: 180000,
    description: 'Join our team',
    skills: ['TypeScript', 'Node.js'],
    experience_level: ExperienceLevel.SENIOR,
    employment_type: EmploymentType.FULL_TIME,
    is_active: true,
    saved: false,
  };

  const mockPaginatedResponse = {
    data: [mockJob],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    },
  };

  const mockJobsService = {
    searchJobs: jest.fn(),
    getJobById: jest.fn(),
    getRecommendedJobs: jest.fn(),
    getSavedJobs: jest.fn(),
    saveJob: jest.fn(),
    unsaveJob: jest.fn(),
    updateSavedJob: jest.fn(),
    getMatchScore: jest.fn(),
    getSimilarJobs: jest.fn(),
    trackApplication: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    service = module.get(JobsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchJobs', () => {
    it('should search jobs without user', async () => {
      const searchDto = {
        keywords: 'software engineer',
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.searchJobs(searchDto);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should search jobs with authenticated user', async () => {
      const searchDto = {
        keywords: 'software engineer',
        page: 1,
        limit: 20,
      };
      const req = { user: { id: 'user-1' } };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.searchJobs(searchDto, req);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, 'user-1');
    });

    it('should search with filters', async () => {
      const searchDto = {
        keywords: 'engineer',
        location: 'San Francisco',
        remote_type: RemoteType.HYBRID,
        salary_min: 100000,
        experience_level: ExperienceLevel.SENIOR,
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });
  });

  describe('getRecommendedJobs', () => {
    it('should get recommended jobs for user', async () => {
      const req = { user: { id: 'user-1' } };

      mockJobsService.getRecommendedJobs.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getRecommendedJobs(req, 1, 20);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockJobsService.getRecommendedJobs).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should use default pagination parameters', async () => {
      const req = { user: { id: 'user-1' } };

      mockJobsService.getRecommendedJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.getRecommendedJobs(req);

      expect(mockJobsService.getRecommendedJobs).toHaveBeenCalledWith('user-1', 1, 20);
    });
  });

  describe('getSavedJobs', () => {
    it('should get saved jobs for user', async () => {
      const req = { user: { id: 'user-1' } };

      mockJobsService.getSavedJobs.mockResolvedValue({
        ...mockPaginatedResponse,
        data: [{ ...mockJob, saved: true }],
      });

      const result = await controller.getSavedJobs(req, 1, 20);

      expect(result.data[0].saved).toBe(true);
      expect(mockJobsService.getSavedJobs).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should use default pagination parameters', async () => {
      const req = { user: { id: 'user-1' } };

      mockJobsService.getSavedJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.getSavedJobs(req);

      expect(mockJobsService.getSavedJobs).toHaveBeenCalledWith('user-1', 1, 20);
    });
  });

  describe('getJobById', () => {
    it('should get job by ID without user', async () => {
      mockJobsService.getJobById.mockResolvedValue(mockJob);

      const result = await controller.getJobById('job-1');

      expect(result).toEqual(mockJob);
      expect(mockJobsService.getJobById).toHaveBeenCalledWith('job-1', undefined);
    });

    it('should get job by ID with authenticated user', async () => {
      const req = { user: { id: 'user-1' } };

      mockJobsService.getJobById.mockResolvedValue({ ...mockJob, saved: true });

      const result = await controller.getJobById('job-1', req);

      expect(result.saved).toBe(true);
      expect(mockJobsService.getJobById).toHaveBeenCalledWith('job-1', 'user-1');
    });
  });

  describe('getMatchScore', () => {
    it('should get match score for job and user', async () => {
      const req = { user: { id: 'user-1' } };
      const mockMatchScore = {
        match_score: 85.5,
        reasons: ['Strong match in required skills', 'Experience level aligns well'],
      };

      mockJobsService.getMatchScore.mockResolvedValue(mockMatchScore);

      const result = await controller.getMatchScore('job-1', req);

      expect(result).toEqual(mockMatchScore);
      expect(mockJobsService.getMatchScore).toHaveBeenCalledWith('job-1', 'user-1');
    });
  });

  describe('getSimilarJobs', () => {
    it('should get similar jobs', async () => {
      const similarJobs = [
        { ...mockJob, id: 'job-2' },
        { ...mockJob, id: 'job-3' },
      ];

      mockJobsService.getSimilarJobs.mockResolvedValue(similarJobs);

      const result = await controller.getSimilarJobs('job-1', 10);

      expect(result).toEqual(similarJobs);
      expect(mockJobsService.getSimilarJobs).toHaveBeenCalledWith('job-1', 10);
    });

    it('should use default limit', async () => {
      mockJobsService.getSimilarJobs.mockResolvedValue([]);

      await controller.getSimilarJobs('job-1');

      expect(mockJobsService.getSimilarJobs).toHaveBeenCalledWith('job-1', 10);
    });
  });

  describe('saveJob', () => {
    it('should save job for user', async () => {
      const req = { user: { id: 'user-1' } };
      const saveJobDto = {
        status: 'saved' as const,
        notes: 'Interesting position',
      };
      const mockSavedJob = {
        id: 'saved-1',
        user_id: 'user-1',
        job_id: 'job-1',
        ...saveJobDto,
      };

      mockJobsService.saveJob.mockResolvedValue(mockSavedJob as any);

      const result = await controller.saveJob('job-1', saveJobDto, req);

      expect(result).toEqual(mockSavedJob);
      expect(mockJobsService.saveJob).toHaveBeenCalledWith('user-1', 'job-1', saveJobDto);
    });
  });

  describe('unsaveJob', () => {
    it('should unsave job for user', async () => {
      const req = { user: { id: 'user-1' } };

      mockJobsService.unsaveJob.mockResolvedValue(undefined);

      const result = await controller.unsaveJob('job-1', req);

      expect(result).toBeUndefined();
      expect(mockJobsService.unsaveJob).toHaveBeenCalledWith('user-1', 'job-1');
    });
  });

  describe('updateSavedJob', () => {
    it('should update saved job', async () => {
      const req = { user: { id: 'user-1' } };
      const updateDto = {
        status: 'applied' as const,
        notes: 'Updated notes',
      };
      const mockUpdatedJob = {
        id: 'saved-1',
        user_id: 'user-1',
        job_id: 'job-1',
        ...updateDto,
      };

      mockJobsService.updateSavedJob.mockResolvedValue(mockUpdatedJob as any);

      const result = await controller.updateSavedJob('job-1', updateDto, req);

      expect(result).toEqual(mockUpdatedJob);
      expect(mockJobsService.updateSavedJob).toHaveBeenCalledWith('user-1', 'job-1', updateDto);
    });
  });

  describe('trackApplication', () => {
    it('should track job application', async () => {
      const req = { user: { id: 'user-1' } };

      mockJobsService.trackApplication.mockResolvedValue(undefined);

      const result = await controller.trackApplication('job-1', req);

      expect(result).toBeUndefined();
      expect(mockJobsService.trackApplication).toHaveBeenCalledWith('job-1', 'user-1');
    });
  });
});
