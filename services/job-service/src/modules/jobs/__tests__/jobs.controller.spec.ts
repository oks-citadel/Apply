import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from '../jobs.controller';
import { JobsService } from '../jobs.service';
import { RemoteType, ExperienceLevel, EmploymentType, JobSource } from '../entities/job.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SavedJobStatus } from '../dto/save-job.dto';
import { ReportReason } from '../dto/report-job.dto';

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
    company_logo_url: 'https://example.com/logo.png',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    remote_type: RemoteType.HYBRID,
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: 'USD',
    salary_period: 'yearly',
    description: 'Join our team as a Senior Software Engineer',
    requirements: ['5+ years experience', 'TypeScript', 'Node.js'],
    benefits: ['Health insurance', '401k', 'Remote work'],
    skills: ['TypeScript', 'Node.js', 'React', 'AWS'],
    experience_level: ExperienceLevel.SENIOR,
    experience_years_min: 5,
    experience_years_max: 10,
    employment_type: EmploymentType.FULL_TIME,
    posted_at: new Date('2024-01-01'),
    expires_at: new Date('2024-02-01'),
    application_url: 'https://example.com/apply',
    ats_platform: 'Greenhouse',
    tags: ['high-priority', 'remote-friendly'],
    view_count: 100,
    application_count: 10,
    save_count: 5,
    is_active: true,
    is_featured: false,
    is_verified: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
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
    calculateMatchScore: jest.fn(),
    getSimilarJobs: jest.fn(),
    trackApplication: jest.fn(),
    getInterviewQuestions: jest.fn(),
    predictSalary: jest.fn(),
    reportJob: jest.fn(),
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

  describe('searchJobs - GET /jobs/search', () => {
    it('should search jobs without user authentication', async () => {
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
      const req = { user: { sub: 'user-1' } };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.searchJobs(searchDto, req);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, 'user-1');
    });

    it('should search with location filter', async () => {
      const searchDto = {
        keywords: 'engineer',
        location: 'San Francisco',
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should search with salary range filter', async () => {
      const searchDto = {
        keywords: 'engineer',
        salary_min: 100000,
        salary_max: 200000,
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should search with remote type filter', async () => {
      const searchDto = {
        keywords: 'engineer',
        remote_type: RemoteType.REMOTE,
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should search with experience level filter', async () => {
      const searchDto = {
        keywords: 'engineer',
        experience_level: ExperienceLevel.SENIOR,
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should search with employment type filter', async () => {
      const searchDto = {
        keywords: 'engineer',
        employment_type: EmploymentType.FULL_TIME,
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should search with skills filter', async () => {
      const searchDto = {
        keywords: 'engineer',
        skills: ['TypeScript', 'React'],
        page: 1,
        limit: 20,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should search with multiple complex filters', async () => {
      const searchDto = {
        keywords: 'senior software engineer',
        location: 'San Francisco',
        remote_type: RemoteType.HYBRID,
        salary_min: 120000,
        salary_max: 180000,
        experience_level: ExperienceLevel.SENIOR,
        employment_type: EmploymentType.FULL_TIME,
        skills: ['TypeScript', 'Node.js'],
        is_featured: true,
        is_verified: true,
        posted_within_days: 7,
        page: 1,
        limit: 20,
        sort_by: 'salary_max',
        sort_order: 'desc' as const,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should handle pagination correctly', async () => {
      const searchDto = {
        keywords: 'engineer',
        page: 2,
        limit: 50,
      };

      const paginatedResponse = {
        data: Array(50).fill(mockJob),
        pagination: {
          page: 2,
          limit: 50,
          total: 150,
          total_pages: 3,
          has_next: true,
          has_prev: true,
        },
      };

      mockJobsService.searchJobs.mockResolvedValue(paginatedResponse);

      const result = await controller.searchJobs(searchDto);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.has_next).toBe(true);
      expect(result.pagination.has_prev).toBe(true);
    });

    it('should handle sorting by posted date', async () => {
      const searchDto = {
        keywords: 'engineer',
        page: 1,
        limit: 20,
        sort_by: 'posted_at',
        sort_order: 'desc' as const,
      };

      mockJobsService.searchJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.searchJobs(searchDto);

      expect(mockJobsService.searchJobs).toHaveBeenCalledWith(searchDto, undefined);
    });

    it('should return facets for filtering', async () => {
      const searchDto = {
        keywords: 'engineer',
        page: 1,
        limit: 20,
      };

      const responseWithFacets = {
        ...mockPaginatedResponse,
        facets: {
          remote_types: [
            { key: 'remote', count: 50 },
            { key: 'hybrid', count: 30 },
            { key: 'onsite', count: 20 },
          ],
          experience_levels: [
            { key: 'senior', count: 40 },
            { key: 'mid', count: 35 },
            { key: 'junior', count: 25 },
          ],
          employment_types: [
            { key: 'full_time', count: 70 },
            { key: 'contract', count: 20 },
            { key: 'part_time', count: 10 },
          ],
          top_skills: [
            { key: 'JavaScript', count: 60 },
            { key: 'TypeScript', count: 45 },
            { key: 'React', count: 40 },
          ],
          top_locations: [
            { key: 'San Francisco', count: 40 },
            { key: 'New York', count: 35 },
            { key: 'Remote', count: 25 },
          ],
        },
      };

      mockJobsService.searchJobs.mockResolvedValue(responseWithFacets);

      const result = await controller.searchJobs(searchDto);

      expect(result.facets).toBeDefined();
      expect(result.facets.remote_types).toHaveLength(3);
      expect(result.facets.top_skills).toHaveLength(3);
    });
  });

  describe('getJobById - GET /jobs/:id', () => {
    it('should get job by ID without authentication', async () => {
      mockJobsService.getJobById.mockResolvedValue(mockJob);

      const result = await controller.getJobById('job-1');

      expect(result).toEqual(mockJob);
      expect(mockJobsService.getJobById).toHaveBeenCalledWith('job-1', undefined);
    });

    it('should get job by ID with authentication', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.getJobById.mockResolvedValue({ ...mockJob, saved: true });

      const result = await controller.getJobById('job-1', req);

      expect(result.saved).toBe(true);
      expect(mockJobsService.getJobById).toHaveBeenCalledWith('job-1', 'user-1');
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobsService.getJobById.mockRejectedValue(new NotFoundException('Job not found'));

      await expect(controller.getJobById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRecommendedJobs - GET /jobs/recommended', () => {
    it('should get recommended jobs for authenticated user', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.getRecommendedJobs.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getRecommendedJobs(req);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockJobsService.getRecommendedJobs).toHaveBeenCalledWith('user-1', undefined, undefined);
    });

    it('should get recommended jobs with custom limit', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.getRecommendedJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.getRecommendedJobs(req, 10);

      expect(mockJobsService.getRecommendedJobs).toHaveBeenCalledWith('user-1', 10, undefined);
    });

    it('should get recommended jobs with custom page and limit', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.getRecommendedJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.getRecommendedJobs(req, 2, 10);

      expect(mockJobsService.getRecommendedJobs).toHaveBeenCalledWith('user-1', 2, 10);
    });
  });

  describe('getSavedJobs - GET /jobs/saved', () => {
    it('should get saved jobs for authenticated user', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.getSavedJobs.mockResolvedValue({
        ...mockPaginatedResponse,
        data: [{ ...mockJob, saved: true }],
      });

      const result = await controller.getSavedJobs(req);

      expect(result.data[0].saved).toBe(true);
      expect(mockJobsService.getSavedJobs).toHaveBeenCalledWith('user-1', undefined, undefined);
    });

    it('should get saved jobs with pagination', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.getSavedJobs.mockResolvedValue(mockPaginatedResponse);

      await controller.getSavedJobs(req, 2, 10);

      expect(mockJobsService.getSavedJobs).toHaveBeenCalledWith('user-1', 2, 10);
    });
  });

  describe('saveJob - POST /jobs/saved', () => {
    it('should save job for authenticated user', async () => {
      const req = { user: { sub: 'user-1' } };
      const body = {
        jobId: 'job-1',
        notes: 'Interesting position',
        tags: ['favorite'],
      };
      const mockSavedJob = {
        id: 'saved-1',
        user_id: 'user-1',
        job_id: 'job-1',
        notes: 'Interesting position',
        tags: ['favorite'],
        status: 'saved',
        created_at: new Date(),
      };

      mockJobsService.saveJob.mockResolvedValue(mockSavedJob as any);

      const result = await controller.saveJob(body, req);

      expect(result).toEqual(mockSavedJob);
      expect(mockJobsService.saveJob).toHaveBeenCalledWith('user-1', 'job-1', {
        notes: 'Interesting position',
        tags: ['favorite'],
      });
    });

    it('should save job without notes or tags', async () => {
      const req = { user: { sub: 'user-1' } };
      const body = {
        jobId: 'job-1',
      };

      mockJobsService.saveJob.mockResolvedValue({
        id: 'saved-1',
        user_id: 'user-1',
        job_id: 'job-1',
      } as any);

      await controller.saveJob(body, req);

      expect(mockJobsService.saveJob).toHaveBeenCalledWith('user-1', 'job-1', {});
    });

    it('should throw BadRequestException when job already saved', async () => {
      const req = { user: { sub: 'user-1' } };
      const body = { jobId: 'job-1' };

      mockJobsService.saveJob.mockRejectedValue(new BadRequestException('Job already saved'));

      await expect(controller.saveJob(body, req)).rejects.toThrow(BadRequestException);
    });
  });

  describe('unsaveJob - DELETE /jobs/saved/:id', () => {
    it('should unsave job for authenticated user', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.unsaveJob.mockResolvedValue(undefined);

      const result = await controller.unsaveJob('job-1', req);

      expect(result).toEqual({ message: 'Job removed from saved jobs' });
      expect(mockJobsService.unsaveJob).toHaveBeenCalledWith('user-1', 'job-1');
    });

    it('should throw NotFoundException when saved job not found', async () => {
      const req = { user: { sub: 'user-1' } };

      mockJobsService.unsaveJob.mockRejectedValue(new NotFoundException('Saved job not found'));

      await expect(controller.unsaveJob('job-1', req)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSavedJob - PATCH /jobs/saved/:id', () => {
    it('should update saved job status', async () => {
      const req = { user: { sub: 'user-1' } };
      const updateDto = {
        status: SavedJobStatus.APPLIED,
      };

      mockJobsService.updateSavedJob.mockResolvedValue({
        id: 'saved-1',
        user_id: 'user-1',
        job_id: 'job-1',
        status: 'applied',
        applied_at: new Date(),
      } as any);

      const result = await controller.updateSavedJob('job-1', updateDto, req);

      expect(result.status).toBe('applied');
      expect(mockJobsService.updateSavedJob).toHaveBeenCalledWith('user-1', 'job-1', updateDto);
    });

    it('should update saved job notes', async () => {
      const req = { user: { sub: 'user-1' } };
      const updateDto = {
        notes: 'Updated notes after interview',
      };

      mockJobsService.updateSavedJob.mockResolvedValue({
        id: 'saved-1',
        user_id: 'user-1',
        job_id: 'job-1',
        notes: 'Updated notes after interview',
      } as any);

      await controller.updateSavedJob('job-1', updateDto, req);

      expect(mockJobsService.updateSavedJob).toHaveBeenCalledWith('user-1', 'job-1', updateDto);
    });

    it('should update saved job tags', async () => {
      const req = { user: { sub: 'user-1' } };
      const updateDto = {
        tags: ['favorite', 'high-priority'],
      };

      mockJobsService.updateSavedJob.mockResolvedValue({
        id: 'saved-1',
        user_id: 'user-1',
        job_id: 'job-1',
        tags: ['favorite', 'high-priority'],
      } as any);

      await controller.updateSavedJob('job-1', updateDto, req);

      expect(mockJobsService.updateSavedJob).toHaveBeenCalledWith('user-1', 'job-1', updateDto);
    });
  });

  describe('getMatchScore - POST /jobs/match-score', () => {
    it('should calculate match score for job and resume', async () => {
      const req = { user: { sub: 'user-1' } };
      const matchScoreDto = {
        jobId: 'job-1',
        resumeId: 'resume-1',
      };

      const mockMatchScore = {
        jobId: 'job-1',
        resumeId: 'resume-1',
        overallScore: 85.5,
        breakdown: {
          skillsMatch: 90,
          experienceMatch: 85,
          educationMatch: 80,
          locationMatch: 87,
        },
        matchedSkills: ['TypeScript', 'Node.js', 'React'],
        missingSkills: ['AWS', 'Kubernetes'],
        recommendations: ['Consider highlighting your cloud experience', 'Add more details about Node.js projects'],
      };

      mockJobsService.calculateMatchScore.mockResolvedValue(mockMatchScore);

      const result = await controller.getMatchScore(matchScoreDto, req);

      expect(result).toEqual(mockMatchScore);
      expect(mockJobsService.calculateMatchScore).toHaveBeenCalledWith('job-1', 'resume-1', 'user-1');
    });
  });

  describe('getSalaryPrediction - POST /jobs/salary-prediction', () => {
    it('should predict salary based on job details', async () => {
      const salaryPredictionDto = {
        jobTitle: 'Senior Software Engineer',
        location: 'San Francisco',
        experienceYears: 7,
        skills: ['TypeScript', 'React', 'Node.js'],
        educationLevel: 'Bachelor',
      };

      const mockPrediction = {
        predictedSalary: {
          min: 140000,
          max: 190000,
          currency: 'USD',
          period: 'yearly',
        },
        confidence: 85,
        factors: [
          { factor: 'Experience', impact: 'positive', description: '7 years of experience' },
          { factor: 'Location', impact: 'positive', description: 'San Francisco has high salaries' },
          { factor: 'Skills', impact: 'positive', description: 'In-demand tech stack' },
        ],
        marketData: {
          averageSalary: 165000,
          percentile25: 140000,
          percentile50: 165000,
          percentile75: 185000,
          percentile90: 200000,
        },
      };

      mockJobsService.predictSalary.mockResolvedValue(mockPrediction);

      const result = await controller.getSalaryPrediction(salaryPredictionDto);

      expect(result).toEqual(mockPrediction);
      expect(mockJobsService.predictSalary).toHaveBeenCalledWith(salaryPredictionDto);
    });
  });

  describe('getSimilarJobs - GET /jobs/:id/similar', () => {
    it('should get similar jobs', async () => {
      const similarJobs = [
        { ...mockJob, id: 'job-2', title: 'Senior Backend Engineer' },
        { ...mockJob, id: 'job-3', title: 'Lead Software Engineer' },
      ];

      mockJobsService.getSimilarJobs.mockResolvedValue(similarJobs);

      const result = await controller.getSimilarJobs('job-1', 10);

      expect(result).toEqual(similarJobs);
      expect(mockJobsService.getSimilarJobs).toHaveBeenCalledWith('job-1', 10);
    });

    it('should use default limit when not provided', async () => {
      mockJobsService.getSimilarJobs.mockResolvedValue([]);

      await controller.getSimilarJobs('job-1');

      expect(mockJobsService.getSimilarJobs).toHaveBeenCalledWith('job-1', 10);
    });
  });

  describe('getInterviewQuestions - GET /jobs/:id/interview-questions', () => {
    it('should get interview questions for job', async () => {
      const mockQuestions = {
        technical: [
          'Explain your experience with TypeScript generics',
          'How would you optimize a slow database query?',
          'Describe your approach to unit testing',
        ],
        behavioral: [
          'Tell me about a time you disagreed with a team member',
          'Describe a challenging project you worked on',
        ],
        companySpecific: [
          'Why do you want to work for Tech Corp?',
          'What do you know about our products?',
        ],
      };

      mockJobsService.getInterviewQuestions.mockResolvedValue(mockQuestions);

      const result = await controller.getInterviewQuestions('job-1');

      expect(result).toEqual(mockQuestions);
      expect(mockJobsService.getInterviewQuestions).toHaveBeenCalledWith('job-1');
    });
  });

  describe('reportJob - POST /jobs/:id/report', () => {
    it('should report a job posting', async () => {
      const req = { user: { sub: 'user-1' } };
      const reportJobDto = {
        reason: ReportReason.SPAM,
        details: 'This job posting appears to be fraudulent',
      };

      mockJobsService.reportJob.mockResolvedValue({
        message: 'Job reported successfully. Our team will review it shortly.',
      });

      const result = await controller.reportJob('job-1', reportJobDto, req);

      expect(result.message).toBeDefined();
      expect(mockJobsService.reportJob).toHaveBeenCalledWith('job-1', reportJobDto, 'user-1');
    });

    it('should handle different report reasons', async () => {
      const req = { user: { sub: 'user-1' } };
      const reportJobDto = {
        reason: ReportReason.MISLEADING,
        details: 'Salary information is inaccurate',
      };

      mockJobsService.reportJob.mockResolvedValue({
        message: 'Job reported successfully. Our team will review it shortly.',
      });

      await controller.reportJob('job-1', reportJobDto, req);

      expect(mockJobsService.reportJob).toHaveBeenCalledWith('job-1', reportJobDto, 'user-1');
    });
  });
});
