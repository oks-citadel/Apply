import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Job, RemoteType, ExperienceLevel, EmploymentType, JobSource } from './entities/job.entity';
import { SavedJob } from './entities/saved-job.entity';
import { SearchService } from '../search/search.service';

describe('JobsService', () => {
  let service: JobsService;
  let jobRepository: jest.Mocked<Repository<Job>>;
  let savedJobRepository: jest.Mocked<Repository<SavedJob>>;
  let searchService: jest.Mocked<SearchService>;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockJob: Partial<Job> = {
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
    is_active: true,
    is_featured: false,
    is_verified: true,
    view_count: 100,
    application_count: 10,
    save_count: 5,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockSavedJob: Partial<SavedJob> = {
    id: 'saved-1',
    user_id: 'user-1',
    job_id: 'job-1',
    status: 'saved',
    notes: 'Interesting position',
    created_at: new Date('2024-01-01'),
  };

  const mockJobRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockSavedJobRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSearchService = {
    searchJobs: jest.fn(),
    findSimilarJobs: jest.fn(),
    indexJob: jest.fn(),
    bulkIndexJobs: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'AI_SERVICE_URL') return 'http://ai-service:3000';
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
          useValue: mockSavedJobRepository,
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
    jobRepository = module.get(getRepositoryToken(Job));
    savedJobRepository = module.get(getRepositoryToken(SavedJob));
    searchService = module.get(SearchService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchJobs', () => {
    const searchDto = {
      keywords: 'software engineer',
      location: 'San Francisco',
      page: 1,
      limit: 20,
    };

    it('should search jobs successfully without user', async () => {
      const mockSearchResults = {
        hits: [{ ...mockJob, id: 'job-1' }, { ...mockJob, id: 'job-2' }],
        total: 2,
        facets: {
          remote_types: [{ key: 'hybrid', doc_count: 2 }],
          experience_levels: [{ key: 'senior', doc_count: 2 }],
        },
      };

      mockSearchService.searchJobs.mockResolvedValue(mockSearchResults);

      const result = await service.searchJobs(searchDto);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].saved).toBe(false);
      expect(result.pagination.total).toBe(2);
      expect(result.facets).toEqual(mockSearchResults.facets);
      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(searchDto);
    });

    it('should search jobs with saved flags for authenticated user', async () => {
      const mockSearchResults = {
        hits: [{ ...mockJob, id: 'job-1' }, { ...mockJob, id: 'job-2' }],
        total: 2,
        facets: {},
      };

      mockSearchService.searchJobs.mockResolvedValue(mockSearchResults);
      mockSavedJobRepository.find.mockResolvedValue([
        { job_id: 'job-1' } as SavedJob,
      ]);

      const result = await service.searchJobs(searchDto, 'user-1');

      expect(result.data[0].saved).toBe(true);
      expect(result.data[1].saved).toBe(false);
      expect(mockSavedJobRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        select: ['job_id'],
      });
    });

    it('should handle pagination correctly', async () => {
      const mockSearchResults = {
        hits: Array(20).fill(mockJob),
        total: 50,
        facets: {},
      };

      mockSearchService.searchJobs.mockResolvedValue(mockSearchResults);

      const result = await service.searchJobs({ ...searchDto, page: 2, limit: 20 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        total_pages: 3,
        has_next: true,
        has_prev: true,
      });
    });

    it('should throw BadRequestException on search error', async () => {
      mockSearchService.searchJobs.mockRejectedValue(new Error('Search failed'));

      await expect(service.searchJobs(searchDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getJobById', () => {
    it('should return job by ID without user', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockJobRepository.update.mockResolvedValue(undefined);

      const result = await service.getJobById('job-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('job-1');
      expect(result.saved).toBe(false);
      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'job-1', is_active: true },
        relations: ['company'],
      });
      expect(mockJobRepository.update).toHaveBeenCalledWith('job-1', {
        view_count: expect.any(Function),
      });
    });

    it('should return job with saved flag for authenticated user', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockJobRepository.update.mockResolvedValue(undefined);
      mockSavedJobRepository.findOne.mockResolvedValue(mockSavedJob as SavedJob);

      const result = await service.getJobById('job-1', 'user-1');

      expect(result.saved).toBe(true);
      expect(mockSavedJobRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 'user-1', job_id: 'job-1' },
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getJobById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return inactive jobs', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getJobById('inactive-job-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'inactive-job-id', is_active: true },
        relations: ['company'],
      });
    });
  });

  describe('getRecommendedJobs', () => {
    it('should return recommended jobs from AI service', async () => {
      const mockResponse = {
        data: {
          job_ids: ['job-1', 'job-2', 'job-3'],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue([mockJob, mockJob]);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      mockSavedJobRepository.find.mockResolvedValue([]);

      const result = await service.getRecommendedJobs('user-1', 1, 20);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://ai-service:3000/recommendations/jobs',
        {
          user_id: 'user-1',
          limit: 40,
        },
        { timeout: 10000 },
      );
    });

    it('should fallback to recent jobs when AI service returns empty', async () => {
      const mockResponse = {
        data: {
          job_ids: [],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const mockSearchResults = {
        hits: [mockJob, mockJob],
        total: 2,
        facets: {},
      };
      mockSearchService.searchJobs.mockResolvedValue(mockSearchResults);

      const result = await service.getRecommendedJobs('user-1', 1, 20);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 20,
          sort_by: 'posted_at',
          sort_order: 'desc',
        },
        'user-1',
      );
    });

    it('should fallback to recent jobs on AI service error', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('AI service unavailable')),
      );

      const mockSearchResults = {
        hits: [mockJob],
        total: 1,
        facets: {},
      };
      mockSearchService.searchJobs.mockResolvedValue(mockSearchResults);

      const result = await service.getRecommendedJobs('user-1', 1, 20);

      expect(result).toBeDefined();
      expect(mockSearchService.searchJobs).toHaveBeenCalled();
    });

    it('should include saved flags in recommended jobs', async () => {
      const mockResponse = {
        data: {
          job_ids: ['job-1', 'job-2'],
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue([
        { ...mockJob, id: 'job-1' },
        { ...mockJob, id: 'job-2' },
      ]);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
      mockSavedJobRepository.find.mockResolvedValue([
        { job_id: 'job-1' } as SavedJob,
      ]);

      const result = await service.getRecommendedJobs('user-1', 1, 20);

      expect(result.data[0].saved).toBe(true);
      expect(result.data[1].saved).toBe(false);
    });
  });

  describe('saveJob', () => {
    const saveJobDto = {
      status: 'saved' as const,
      notes: 'Interesting position',
    };

    it('should save job successfully', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockSavedJobRepository.findOne.mockResolvedValue(null);
      mockSavedJobRepository.create.mockReturnValue(mockSavedJob as SavedJob);
      mockSavedJobRepository.save.mockResolvedValue(mockSavedJob as SavedJob);
      mockJobRepository.update.mockResolvedValue(undefined);

      const result = await service.saveJob('user-1', 'job-1', saveJobDto);

      expect(result).toEqual(mockSavedJob);
      expect(mockSavedJobRepository.create).toHaveBeenCalledWith({
        user_id: 'user-1',
        job_id: 'job-1',
        ...saveJobDto,
      });
      expect(mockJobRepository.update).toHaveBeenCalledWith('job-1', {
        save_count: expect.any(Function),
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.saveJob('user-1', 'nonexistent-id', saveJobDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when job already saved', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockSavedJobRepository.findOne.mockResolvedValue(mockSavedJob as SavedJob);

      await expect(
        service.saveJob('user-1', 'job-1', saveJobDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not save inactive jobs', async () => {
      const inactiveJob = { ...mockJob, is_active: false };
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.saveJob('user-1', 'job-1', saveJobDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unsaveJob', () => {
    it('should unsave job successfully', async () => {
      mockSavedJobRepository.findOne.mockResolvedValue(mockSavedJob as SavedJob);
      mockSavedJobRepository.remove.mockResolvedValue(mockSavedJob as SavedJob);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.execute = jest.fn().mockResolvedValue(undefined);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.unsaveJob('user-1', 'job-1');

      expect(mockSavedJobRepository.remove).toHaveBeenCalledWith(mockSavedJob);
      expect(mockJobRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should throw NotFoundException when saved job not found', async () => {
      mockSavedJobRepository.findOne.mockResolvedValue(null);

      await expect(service.unsaveJob('user-1', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSavedJobs', () => {
    it('should return user saved jobs', async () => {
      const savedJobs = [
        {
          ...mockSavedJob,
          job: { ...mockJob, is_active: true },
        },
        {
          ...mockSavedJob,
          id: 'saved-2',
          job: { ...mockJob, id: 'job-2', is_active: true },
        },
      ];

      mockSavedJobRepository.findAndCount.mockResolvedValue([
        savedJobs as any,
        2,
      ]);

      const result = await service.getSavedJobs('user-1', 1, 20);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].saved).toBe(true);
      expect(result.pagination.total).toBe(2);
      expect(mockSavedJobRepository.findAndCount).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        relations: ['job', 'job.company'],
        order: { created_at: 'DESC' },
        take: 20,
        skip: 0,
      });
    });

    it('should filter out inactive jobs', async () => {
      const savedJobs = [
        {
          ...mockSavedJob,
          job: { ...mockJob, is_active: true },
        },
        {
          ...mockSavedJob,
          id: 'saved-2',
          job: { ...mockJob, id: 'job-2', is_active: false },
        },
      ];

      mockSavedJobRepository.findAndCount.mockResolvedValue([
        savedJobs as any,
        2,
      ]);

      const result = await service.getSavedJobs('user-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('job-1');
    });

    it('should handle pagination correctly', async () => {
      mockSavedJobRepository.findAndCount.mockResolvedValue([[], 50]);

      const result = await service.getSavedJobs('user-1', 2, 20);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        total_pages: 3,
        has_next: true,
        has_prev: true,
      });
    });
  });

  describe('getMatchScore', () => {
    it('should return match score from AI service', async () => {
      const mockResponse = {
        data: {
          match_score: 85.5,
          reasons: ['Strong match in required skills', 'Experience level aligns well'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result).toEqual({
        match_score: 85.5,
        reasons: ['Strong match in required skills', 'Experience level aligns well'],
      });
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://ai-service:3000/matching/job-match',
        {
          job_id: 'job-1',
          user_id: 'user-1',
          job_requirements: mockJob.requirements,
          job_skills: mockJob.skills,
          job_description: mockJob.description,
        },
        { timeout: 10000 },
      );
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getMatchScore('nonexistent-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return default score on AI service error', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('AI service unavailable')),
      );

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result).toEqual({
        match_score: 0,
        reasons: ['Unable to calculate match score at this time'],
      });
    });

    it('should handle missing AI service response data', async () => {
      const mockResponse = {
        data: {},
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result).toEqual({
        match_score: 0,
        reasons: [],
      });
    });
  });

  describe('getSimilarJobs', () => {
    it('should return similar jobs excluding the original', async () => {
      const similarJobs = [
        { ...mockJob, id: 'job-2' },
        { ...mockJob, id: 'job-3' },
        { ...mockJob, id: 'job-1' }, // Should be filtered out
      ];

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockSearchService.findSimilarJobs.mockResolvedValue(similarJobs);

      const result = await service.getSimilarJobs('job-1', 10);

      expect(result).toHaveLength(2);
      expect(result.find(j => j.id === 'job-1')).toBeUndefined();
      expect(mockSearchService.findSimilarJobs).toHaveBeenCalledWith(mockJob, 10);
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getSimilarJobs('nonexistent-id', 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('trackApplication', () => {
    it('should track application and update saved job status', async () => {
      const savedJob = { ...mockSavedJob, status: 'saved' };
      mockSavedJobRepository.findOne.mockResolvedValue(savedJob as SavedJob);
      mockSavedJobRepository.save.mockResolvedValue({
        ...savedJob,
        status: 'applied',
        applied_at: expect.any(Date),
      } as SavedJob);
      mockJobRepository.update.mockResolvedValue(undefined);

      await service.trackApplication('job-1', 'user-1');

      expect(mockSavedJobRepository.save).toHaveBeenCalledWith({
        ...savedJob,
        status: 'applied',
        applied_at: expect.any(Date),
      });
      expect(mockJobRepository.update).toHaveBeenCalledWith('job-1', {
        application_count: expect.any(Function),
      });
    });

    it('should not update status if already applied', async () => {
      const savedJob = { ...mockSavedJob, status: 'applied', applied_at: new Date() };
      mockSavedJobRepository.findOne.mockResolvedValue(savedJob as SavedJob);
      mockJobRepository.update.mockResolvedValue(undefined);

      await service.trackApplication('job-1', 'user-1');

      expect(mockSavedJobRepository.save).not.toHaveBeenCalled();
      expect(mockJobRepository.update).toHaveBeenCalledWith('job-1', {
        application_count: expect.any(Function),
      });
    });

    it('should track application even if job not saved', async () => {
      mockSavedJobRepository.findOne.mockResolvedValue(null);
      mockJobRepository.update.mockResolvedValue(undefined);

      await service.trackApplication('job-1', 'user-1');

      expect(mockJobRepository.update).toHaveBeenCalledWith('job-1', {
        application_count: expect.any(Function),
      });
    });
  });
});
