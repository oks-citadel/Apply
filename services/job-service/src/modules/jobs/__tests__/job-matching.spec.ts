import { HttpService } from '@nestjs/axios';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';


import { Job, RemoteType, ExperienceLevel, EmploymentType, JobSource } from '../entities/job.entity';
import { SavedJob } from '../entities/saved-job.entity';
import { JobsService } from '../jobs.service';

import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';

/**
 * Job Matching Algorithm Unit Tests
 *
 * This test suite focuses on the job matching functionality including:
 * - Match score calculation
 * - Skills matching
 * - Experience level matching
 * - Location matching
 * - Similar jobs algorithm
 * - Edge cases and error handling
 */
describe('Job Matching Algorithm', () => {
  let service: JobsService;
  let jobRepository: jest.Mocked<Repository<Job>>;
  let savedJobRepository: jest.Mocked<Repository<SavedJob>>;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  // Mock job data with various skill sets and experience levels
  const createMockJob = (overrides: Partial<Job> = {}): Partial<Job> => ({
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
    description: 'Join our team as a Senior Software Engineer working on cutting-edge technology.',
    requirements: ['5+ years experience', 'TypeScript', 'Node.js', 'React'],
    benefits: ['Health insurance', '401k', 'Remote work'],
    skills: ['TypeScript', 'Node.js', 'React', 'AWS', 'PostgreSQL'],
    experience_level: ExperienceLevel.SENIOR,
    experience_years_min: 5,
    experience_years_max: 10,
    employment_type: EmploymentType.FULL_TIME,
    posted_at: new Date('2024-01-01'),
    expires_at: new Date('2024-02-01'),
    application_url: 'https://example.com/apply',
    ats_platform: 'Greenhouse',
    tags: ['high-priority', 'remote-friendly'],
    is_active: true,
    is_featured: false,
    is_verified: true,
    view_count: 100,
    application_count: 10,
    save_count: 5,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
  });

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
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
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

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'AI_SERVICE_URL') {return 'http://ai-service:3000';}
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
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('getMatchScore', () => {
    it('should return high match score when skills align perfectly', async () => {
      const mockJob = createMockJob();
      const mockResponse = {
        data: {
          match_score: 95,
          reasons: [
            'All required skills matched',
            'Experience level matches',
            'Location preference matches',
          ],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result.match_score).toBe(95);
      expect(result.reasons).toHaveLength(3);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://ai-service:3000/matching/job-match',
        expect.objectContaining({
          job_id: 'job-1',
          user_id: 'user-1',
          job_skills: mockJob.skills,
        }),
        expect.any(Object),
      );
    });

    it('should return low match score when skills do not align', async () => {
      const mockJob = createMockJob({
        skills: ['Java', 'Spring Boot', 'Oracle'],
      });
      const mockResponse = {
        data: {
          match_score: 25,
          reasons: [
            'Only 1 out of 3 required skills matched',
            'Experience level is higher than required',
          ],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result.match_score).toBe(25);
      expect(result.reasons).toContain('Only 1 out of 3 required skills matched');
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getMatchScore('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return default score on AI service error', async () => {
      const mockJob = createMockJob();
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('AI service unavailable')),
      );

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result.match_score).toBe(0);
      expect(result.reasons).toContain('Unable to calculate match score at this time');
    });

    it('should handle empty skills array gracefully', async () => {
      const mockJob = createMockJob({ skills: [] });
      const mockResponse = {
        data: {
          match_score: 50,
          reasons: ['No specific skills required'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result.match_score).toBe(50);
    });

    it('should handle null skills gracefully', async () => {
      const mockJob = createMockJob({ skills: null as any });
      const mockResponse = {
        data: {
          match_score: 50,
          reasons: ['No specific skills required'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result).toBeDefined();
    });
  });

  describe('calculateMatchScore (Resume-Job Match)', () => {
    it('should calculate detailed match score breakdown', async () => {
      const mockJob = createMockJob();
      const mockResponse = {
        data: {
          overall_score: 85,
          breakdown: {
            skillsMatch: 90,
            experienceMatch: 80,
            educationMatch: 85,
            locationMatch: 85,
          },
          matched_skills: ['TypeScript', 'Node.js', 'React'],
          missing_skills: ['AWS', 'PostgreSQL'],
          recommendations: [
            'Consider adding AWS experience',
            'Highlight any database experience',
          ],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.calculateMatchScore('job-1', 'resume-1', 'user-1');

      expect(result.overallScore).toBe(85);
      expect(result.breakdown.skillsMatch).toBe(90);
      expect(result.breakdown.experienceMatch).toBe(80);
      expect(result.matchedSkills).toContain('TypeScript');
      expect(result.missingSkills).toContain('AWS');
      expect(result.recommendations).toHaveLength(2);
    });

    it('should handle perfect skill match (100% score)', async () => {
      const mockJob = createMockJob();
      const mockResponse = {
        data: {
          overall_score: 100,
          breakdown: {
            skillsMatch: 100,
            experienceMatch: 100,
            educationMatch: 100,
            locationMatch: 100,
          },
          matched_skills: ['TypeScript', 'Node.js', 'React', 'AWS', 'PostgreSQL'],
          missing_skills: [],
          recommendations: [],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.calculateMatchScore('job-1', 'resume-1', 'user-1');

      expect(result.overallScore).toBe(100);
      expect(result.missingSkills).toHaveLength(0);
    });

    it('should handle no skill match (0% score)', async () => {
      const mockJob = createMockJob();
      const mockResponse = {
        data: {
          overall_score: 0,
          breakdown: {
            skillsMatch: 0,
            experienceMatch: 0,
            educationMatch: 0,
            locationMatch: 0,
          },
          matched_skills: [],
          missing_skills: ['TypeScript', 'Node.js', 'React', 'AWS', 'PostgreSQL'],
          recommendations: ['Consider gaining experience in required technologies'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.calculateMatchScore('job-1', 'resume-1', 'user-1');

      expect(result.overallScore).toBe(0);
      expect(result.matchedSkills).toHaveLength(0);
      expect(result.missingSkills).toHaveLength(5);
    });

    it('should throw NotFoundException for inactive job', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.calculateMatchScore('inactive-job', 'resume-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return default values on AI service timeout', async () => {
      const mockJob = createMockJob();
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Request timeout')),
      );

      const result = await service.calculateMatchScore('job-1', 'resume-1', 'user-1');

      expect(result.overallScore).toBe(0);
      expect(result.recommendations).toContain(
        'Unable to calculate match score. Please try again later.',
      );
    });

    it('should include job experience level in match calculation', async () => {
      const mockJob = createMockJob({ experience_level: ExperienceLevel.MID });
      const mockResponse = {
        data: {
          overall_score: 75,
          breakdown: {
            skillsMatch: 80,
            experienceMatch: 70,
            educationMatch: 75,
            locationMatch: 75,
          },
          matched_skills: ['TypeScript', 'Node.js'],
          missing_skills: ['React'],
          recommendations: [],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      await service.calculateMatchScore('job-1', 'resume-1', 'user-1');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          job_experience_level: ExperienceLevel.MID,
        }),
        expect.any(Object),
      );
    });
  });

  describe('getSimilarJobs', () => {
    it('should find similar jobs based on employment type', async () => {
      const mockJob = createMockJob();
      const similarJobs = [
        createMockJob({ id: 'job-2', title: 'Software Developer' }),
        createMockJob({ id: 'job-3', title: 'Full Stack Engineer' }),
      ];

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue(similarJobs);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSimilarJobs('job-1', 10);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('job-2');
    });

    it('should find similar jobs based on experience level', async () => {
      const mockJob = createMockJob({ experience_level: ExperienceLevel.SENIOR });
      const similarJobs = [
        createMockJob({
          id: 'job-2',
          title: 'Senior Backend Developer',
          experience_level: ExperienceLevel.SENIOR,
        }),
      ];

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue(similarJobs);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSimilarJobs('job-1', 10);

      expect(result).toHaveLength(1);
      expect(result[0].experience_level).toBe(ExperienceLevel.SENIOR);
    });

    it('should find similar jobs based on location', async () => {
      const mockJob = createMockJob({ location: 'San Francisco, CA' });
      const similarJobs = [
        createMockJob({
          id: 'job-2',
          title: 'DevOps Engineer',
          location: 'San Francisco, CA',
        }),
      ];

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue(similarJobs);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSimilarJobs('job-1', 10);

      expect(result).toHaveLength(1);
    });

    it('should exclude the original job from similar jobs', async () => {
      const mockJob = createMockJob();

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue([]);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.getSimilarJobs('job-1', 10);

      // Verify the query excludes the original job
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'job.id != :jobId',
        { jobId: 'job-1' },
      );
    });

    it('should respect the limit parameter', async () => {
      const mockJob = createMockJob();
      const manySimilarJobs = Array(20)
        .fill(null)
        .map((_, i) =>
          createMockJob({ id: `job-${i + 2}`, title: `Job ${i + 2}` }),
        );

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue(manySimilarJobs.slice(0, 5));
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSimilarJobs('job-1', 5);

      expect(result).toHaveLength(5);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getSimilarJobs('nonexistent', 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle jobs with no location gracefully', async () => {
      const mockJob = createMockJob({ location: null as any });

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue([]);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSimilarJobs('job-1', 10);

      expect(result).toBeDefined();
    });

    it('should return empty array when no similar jobs found', async () => {
      const mockJob = createMockJob();

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue([]);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSimilarJobs('job-1', 10);

      expect(result).toEqual([]);
    });

    it('should order similar jobs by posted date (newest first)', async () => {
      const mockJob = createMockJob();

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue([]);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      await service.getSimilarJobs('job-1', 10);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('job.posted_at', 'DESC');
    });
  });

  describe('Experience Level Matching', () => {
    const experienceLevels = [
      ExperienceLevel.ENTRY,
      ExperienceLevel.MID,
      ExperienceLevel.SENIOR,
      ExperienceLevel.LEAD,
      ExperienceLevel.EXECUTIVE,
    ];

    experienceLevels.forEach((level) => {
      it(`should correctly match ${level} level jobs`, async () => {
        const mockJob = createMockJob({ experience_level: level });
        const mockResponse = {
          data: {
            match_score: 85,
            reasons: [`Experience level ${level} matches`],
          },
        };

        mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
        mockHttpService.post.mockReturnValue(of(mockResponse as any));

        const result = await service.getMatchScore('job-1', 'user-1');

        expect(result).toBeDefined();
        expect(mockHttpService.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            job_id: 'job-1',
          }),
          expect.any(Object),
        );
      });
    });
  });

  describe('Remote Type Matching', () => {
    const remoteTypes = [RemoteType.REMOTE, RemoteType.HYBRID, RemoteType.ON_SITE];

    remoteTypes.forEach((type) => {
      it(`should handle ${type} remote type in similar jobs`, async () => {
        const mockJob = createMockJob({ remote_type: type });

        mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

        const queryBuilder = mockJobRepository.createQueryBuilder();
        queryBuilder.getMany = jest.fn().mockResolvedValue([]);
        mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        const result = await service.getSimilarJobs('job-1', 10);

        expect(result).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long skill lists', async () => {
      const manySkills = Array(50)
        .fill(null)
        .map((_, i) => `Skill${i}`);
      const mockJob = createMockJob({ skills: manySkills });
      const mockResponse = {
        data: {
          match_score: 45,
          reasons: ['Partial skill match'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result).toBeDefined();
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          job_skills: manySkills,
        }),
        expect.any(Object),
      );
    });

    it('should handle special characters in job description', async () => {
      const mockJob = createMockJob({
        description: 'Looking for C++ developer with 5+ years experience & SQL/NoSQL knowledge.',
      });
      const mockResponse = {
        data: {
          match_score: 70,
          reasons: ['Good match'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result).toBeDefined();
    });

    it('should handle unicode characters in skills', async () => {
      const mockJob = createMockJob({
        skills: ['TypeScript', 'React', 'Python3', 'C#', 'Rust'],
      });
      const mockResponse = {
        data: {
          match_score: 60,
          reasons: ['Mixed skill match'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result).toBeDefined();
    });

    it('should handle extremely high salary ranges', async () => {
      const mockJob = createMockJob({
        salary_min: 500000,
        salary_max: 1000000,
      });

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);

      const queryBuilder = mockJobRepository.createQueryBuilder();
      queryBuilder.getMany = jest.fn().mockResolvedValue([]);
      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getSimilarJobs('job-1', 10);

      expect(result).toBeDefined();
    });

    it('should handle jobs with no requirements', async () => {
      const mockJob = createMockJob({ requirements: [] });
      const mockResponse = {
        data: {
          match_score: 80,
          reasons: ['No specific requirements'],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getMatchScore('job-1', 'user-1');

      expect(result.match_score).toBe(80);
    });
  });

  describe('Interview Questions Generation', () => {
    it('should generate interview questions for a job', async () => {
      const mockJob = createMockJob();
      const mockResponse = {
        data: {
          technical: [
            'Explain the difference between TypeScript and JavaScript',
            'How would you optimize a slow React application?',
          ],
          behavioral: [
            'Tell me about a challenging project you worked on',
            'How do you handle disagreements with team members?',
          ],
          company_specific: [
            'Why do you want to work at Tech Corp?',
            'What do you know about our products?',
          ],
        },
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.getInterviewQuestions('job-1');

      expect(result.technical).toHaveLength(2);
      expect(result.behavioral).toHaveLength(2);
      expect(result.companySpecific).toHaveLength(2);
    });

    it('should return default questions on AI service error', async () => {
      const mockJob = createMockJob();
      mockJobRepository.findOne.mockResolvedValue(mockJob as Job);
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      const result = await service.getInterviewQuestions('job-1');

      expect(result.technical).toBeDefined();
      expect(result.behavioral).toBeDefined();
      expect(result.companySpecific).toBeDefined();
      expect(result.technical.length).toBeGreaterThan(0);
    });
  });

  describe('Salary Prediction', () => {
    it('should predict salary based on job details', async () => {
      const mockResponse = {
        data: {
          predicted_salary: {
            min: 140000,
            max: 190000,
            currency: 'USD',
            period: 'yearly',
          },
          confidence: 85,
          factors: [
            { factor: 'Experience', impact: 'positive', description: '7 years' },
            { factor: 'Location', impact: 'positive', description: 'San Francisco' },
          ],
          market_data: {
            averageSalary: 165000,
            percentile25: 140000,
            percentile50: 165000,
            percentile75: 185000,
            percentile90: 200000,
          },
        },
      };

      mockHttpService.post.mockReturnValue(of(mockResponse as any));

      const result = await service.predictSalary({
        jobTitle: 'Senior Software Engineer',
        location: 'San Francisco',
        experienceYears: 7,
        skills: ['TypeScript', 'React'],
      });

      expect(result.predictedSalary.min).toBe(140000);
      expect(result.predictedSalary.max).toBe(190000);
      expect(result.confidence).toBe(85);
      expect(result.factors).toHaveLength(2);
    });

    it('should return fallback prediction on error', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      const result = await service.predictSalary({
        jobTitle: 'Software Engineer',
        location: 'New York',
        experienceYears: 5,
        skills: ['JavaScript'],
      });

      expect(result.predictedSalary.min).toBeGreaterThan(0);
      expect(result.predictedSalary.max).toBeGreaterThan(result.predictedSalary.min);
      expect(result.confidence).toBe(50);
    });

    it('should scale salary prediction based on experience years', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      const juniorResult = await service.predictSalary({
        jobTitle: 'Software Engineer',
        location: 'Remote',
        experienceYears: 1,
        skills: ['JavaScript'],
      });

      const seniorResult = await service.predictSalary({
        jobTitle: 'Software Engineer',
        location: 'Remote',
        experienceYears: 10,
        skills: ['JavaScript'],
      });

      expect(seniorResult.predictedSalary.min).toBeGreaterThan(
        juniorResult.predictedSalary.min,
      );
    });
  });
});
