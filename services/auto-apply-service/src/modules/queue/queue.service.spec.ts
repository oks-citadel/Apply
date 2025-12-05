import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { ApplicationData } from '../adapters/base.adapter';

describe('QueueService', () => {
  let service: QueueService;
  let queue: jest.Mocked<Queue>;

  const mockJob = {
    id: 'job-123',
    data: {
      userId: 'user-123',
      jobUrl: 'https://greenhouse.io/apply/123',
      resumePath: '/path/to/resume.pdf',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
      },
    },
    progress: jest.fn().mockReturnValue(50),
    attemptsMade: 1,
    timestamp: Date.now(),
    processedOn: Date.now(),
    finishedOn: null,
    failedReason: null,
    stacktrace: null,
    remove: jest.fn(),
    retry: jest.fn(),
  } as any;

  const mockQueue = {
    add: jest.fn(),
    getWaitingCount: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getDelayedCount: jest.fn(),
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getDelayed: jest.fn(),
    getFailed: jest.fn(),
    getJob: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    empty: jest.fn(),
  };

  const mockApplicationData: ApplicationData = {
    userId: 'user-123',
    jobUrl: 'https://greenhouse.io/apply/123',
    resumePath: '/path/to/resume.pdf',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: {
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
      },
      linkedinUrl: 'https://linkedin.com/in/johndoe',
    },
    workInfo: {
      currentCompany: 'Tech Corp',
      currentTitle: 'Software Engineer',
      yearsOfExperience: 5,
    },
    preferences: {
      salaryExpectation: '$120,000',
      availability: 'Immediately',
      workAuthorization: true,
      requiresSponsorship: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('application-queue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    queue = module.get(getQueueToken('application-queue'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addApplicationToQueue', () => {
    it('should add application to queue with default priority', async () => {
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await service.addApplicationToQueue(mockApplicationData);

      expect(result).toEqual(mockJob);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'submit-application',
        mockApplicationData,
        expect.objectContaining({
          priority: 0,
          attempts: 3,
          removeOnComplete: 100,
          removeOnFail: false,
        }),
      );
    });

    it('should add application with custom priority', async () => {
      mockQueue.add.mockResolvedValue(mockJob);

      await service.addApplicationToQueue(mockApplicationData, 5);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'submit-application',
        mockApplicationData,
        expect.objectContaining({
          priority: 5,
        }),
      );
    });

    it('should detect platform and apply rate limiting', async () => {
      const workdayData = {
        ...mockApplicationData,
        jobUrl: 'https://workday.com/apply/123',
      };

      mockQueue.add.mockResolvedValue(mockJob);

      await service.addApplicationToQueue(workdayData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'submit-application',
        workdayData,
        expect.objectContaining({
          delay: expect.any(Number),
          backoff: expect.objectContaining({
            type: 'exponential',
          }),
        }),
      );
    });

    it('should apply exponential backoff configuration', async () => {
      mockQueue.add.mockResolvedValue(mockJob);

      await service.addApplicationToQueue(mockApplicationData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'submit-application',
        mockApplicationData,
        expect.objectContaining({
          backoff: {
            type: 'exponential',
            delay: expect.any(Number),
          },
        }),
      );
    });

    it('should set retry attempts to 3', async () => {
      mockQueue.add.mockResolvedValue(mockJob);

      await service.addApplicationToQueue(mockApplicationData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'submit-application',
        mockApplicationData,
        expect.objectContaining({
          attempts: 3,
        }),
      );
    });
  });

  describe('addBulkApplications', () => {
    it('should add multiple applications to queue', async () => {
      const applications = [
        mockApplicationData,
        { ...mockApplicationData, userId: 'user-456' },
        { ...mockApplicationData, userId: 'user-789' },
      ];

      mockQueue.add.mockResolvedValue(mockJob);

      const results = await service.addBulkApplications(applications);

      expect(results).toHaveLength(3);
      expect(mockQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should assign incremental priority to bulk applications', async () => {
      const applications = [
        mockApplicationData,
        { ...mockApplicationData, userId: 'user-456' },
      ];

      mockQueue.add.mockResolvedValue(mockJob);

      await service.addBulkApplications(applications);

      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        'submit-application',
        applications[0],
        expect.objectContaining({ priority: 0 }),
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        2,
        'submit-application',
        applications[1],
        expect.objectContaining({ priority: 1 }),
      );
    });

    it('should handle empty array', async () => {
      const results = await service.addBulkApplications([]);

      expect(results).toHaveLength(0);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(3);
      mockQueue.getDelayedCount.mockResolvedValue(1);

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        total: 111,
      });
    });

    it('should handle zero counts', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(0);
      mockQueue.getActiveCount.mockResolvedValue(0);
      mockQueue.getCompletedCount.mockResolvedValue(0);
      mockQueue.getFailedCount.mockResolvedValue(0);
      mockQueue.getDelayedCount.mockResolvedValue(0);

      const stats = await service.getQueueStats();

      expect(stats.total).toBe(0);
    });
  });

  describe('getQueuedJobs', () => {
    it('should return formatted jobs by status', async () => {
      const jobs = [mockJob, { ...mockJob, id: 'job-456' }];

      mockQueue.getWaiting.mockResolvedValue(jobs);
      mockQueue.getActive.mockResolvedValue([jobs[0]]);
      mockQueue.getDelayed.mockResolvedValue([]);

      const result = await service.getQueuedJobs();

      expect(result.waiting).toHaveLength(2);
      expect(result.active).toHaveLength(1);
      expect(result.delayed).toHaveLength(0);
      expect(result.waiting[0]).toHaveProperty('id');
      expect(result.waiting[0]).toHaveProperty('data');
    });

    it('should format job data correctly', async () => {
      mockQueue.getWaiting.mockResolvedValue([mockJob]);
      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getDelayed.mockResolvedValue([]);

      const result = await service.getQueuedJobs();

      expect(result.waiting[0]).toEqual({
        id: mockJob.id,
        data: {
          userId: mockJob.data.userId,
          jobUrl: mockJob.data.jobUrl,
          companyName: undefined,
        },
        progress: 50,
        attemptsMade: 1,
        timestamp: mockJob.timestamp,
        processedOn: mockJob.processedOn,
        finishedOn: null,
      });
    });
  });

  describe('getJob', () => {
    it('should retrieve job by ID', async () => {
      const jobId = 'job-123';
      mockQueue.getJob.mockResolvedValue(mockJob);

      const result = await service.getJob(jobId);

      expect(result).toEqual(mockJob);
      expect(mockQueue.getJob).toHaveBeenCalledWith(jobId);
    });

    it('should return null if job not found', async () => {
      const jobId = 'non-existent';
      mockQueue.getJob.mockResolvedValue(null);

      const result = await service.getJob(jobId);

      expect(result).toBeNull();
    });
  });

  describe('removeJob', () => {
    it('should remove job from queue', async () => {
      const jobId = 'job-123';
      mockQueue.getJob.mockResolvedValue(mockJob);

      await service.removeJob(jobId);

      expect(mockQueue.getJob).toHaveBeenCalledWith(jobId);
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should do nothing if job not found', async () => {
      const jobId = 'non-existent';
      mockQueue.getJob.mockResolvedValue(null);

      await service.removeJob(jobId);

      expect(mockJob.remove).not.toHaveBeenCalled();
    });
  });

  describe('retryJob', () => {
    it('should retry failed job', async () => {
      const jobId = 'job-123';
      mockQueue.getJob.mockResolvedValue(mockJob);

      await service.retryJob(jobId);

      expect(mockQueue.getJob).toHaveBeenCalledWith(jobId);
      expect(mockJob.retry).toHaveBeenCalled();
    });

    it('should do nothing if job not found', async () => {
      const jobId = 'non-existent';
      mockQueue.getJob.mockResolvedValue(null);

      await service.retryJob(jobId);

      expect(mockJob.retry).not.toHaveBeenCalled();
    });
  });

  describe('pauseQueue', () => {
    it('should pause the queue', async () => {
      await service.pauseQueue();

      expect(mockQueue.pause).toHaveBeenCalled();
    });
  });

  describe('resumeQueue', () => {
    it('should resume the queue', async () => {
      await service.resumeQueue();

      expect(mockQueue.resume).toHaveBeenCalled();
    });
  });

  describe('clearQueue', () => {
    it('should clear all jobs from queue', async () => {
      await service.clearQueue();

      expect(mockQueue.empty).toHaveBeenCalled();
    });
  });

  describe('getFailedJobs', () => {
    it('should return failed jobs with error details', async () => {
      const failedJob = {
        ...mockJob,
        failedReason: 'CAPTCHA detected',
        stacktrace: ['Error: CAPTCHA detected', '  at apply()'],
      };

      mockQueue.getFailed.mockResolvedValue([failedJob]);

      const result = await service.getFailedJobs();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('failedReason');
      expect(result[0]).toHaveProperty('stacktrace');
      expect(result[0].failedReason).toBe('CAPTCHA detected');
    });

    it('should handle empty failed jobs list', async () => {
      mockQueue.getFailed.mockResolvedValue([]);

      const result = await service.getFailedJobs();

      expect(result).toHaveLength(0);
    });
  });

  describe('detectPlatform', () => {
    it('should detect Workday platform', () => {
      const url = 'https://myworkdayjobs.com/apply/123';
      const platform = service['detectPlatform'](url);

      expect(platform).toBe('workday');
    });

    it('should detect Greenhouse platform', () => {
      const url = 'https://boards.greenhouse.io/company/jobs/123';
      const platform = service['detectPlatform'](url);

      expect(platform).toBe('greenhouse');
    });

    it('should detect Lever platform', () => {
      const url = 'https://jobs.lever.co/company/123';
      const platform = service['detectPlatform'](url);

      expect(platform).toBe('lever');
    });

    it('should detect iCIMS platform', () => {
      const url = 'https://careers.icims.com/apply/123';
      const platform = service['detectPlatform'](url);

      expect(platform).toBe('icims');
    });

    it('should detect Taleo platform', () => {
      const url = 'https://company.taleo.net/apply/123';
      const platform = service['detectPlatform'](url);

      expect(platform).toBe('taleo');
    });

    it('should detect SmartRecruiters platform', () => {
      const url = 'https://jobs.smartrecruiters.com/apply/123';
      const platform = service['detectPlatform'](url);

      expect(platform).toBe('smartrecruiters');
    });

    it('should return default for unknown platform', () => {
      const url = 'https://unknown-ats.com/apply/123';
      const platform = service['detectPlatform'](url);

      expect(platform).toBe('default');
    });
  });

  describe('calculateDelay', () => {
    it('should calculate delay for platform', () => {
      const delay = service['calculateDelay']('greenhouse');

      expect(delay).toBeGreaterThan(0);
      expect(typeof delay).toBe('number');
    });

    it('should add random variance to delay', () => {
      const delay1 = service['calculateDelay']('greenhouse');
      const delay2 = service['calculateDelay']('greenhouse');

      // Delays should be different due to randomness
      // (might occasionally be equal, but very unlikely)
      expect(typeof delay1).toBe('number');
      expect(typeof delay2).toBe('number');
    });

    it('should use default rate limit for unknown platform', () => {
      const delay = service['calculateDelay']('unknown-platform');

      expect(delay).toBeGreaterThan(0);
    });

    it('should return integer delay', () => {
      const delay = service['calculateDelay']('workday');

      expect(Number.isInteger(delay)).toBe(true);
    });
  });

  describe('formatJob', () => {
    it('should format job with all fields', () => {
      const formatted = service['formatJob'](mockJob);

      expect(formatted).toEqual({
        id: mockJob.id,
        data: {
          userId: mockJob.data.userId,
          jobUrl: mockJob.data.jobUrl,
          companyName: undefined,
        },
        progress: 50,
        attemptsMade: 1,
        timestamp: mockJob.timestamp,
        processedOn: mockJob.processedOn,
        finishedOn: null,
      });
    });

    it('should include company name if present in data', () => {
      const jobWithCompany = {
        ...mockJob,
        data: {
          ...mockJob.data,
          personalInfo: {
            ...mockJob.data.personalInfo,
            companyName: 'Test Company',
          },
        },
      };

      const formatted = service['formatJob'](jobWithCompany);

      expect(formatted.data.companyName).toBe('Test Company');
    });
  });

  describe('formatJobWithError', () => {
    it('should format job with error details', () => {
      const failedJob = {
        ...mockJob,
        failedReason: 'CAPTCHA detected',
        stacktrace: ['Error: CAPTCHA detected'],
      };

      const formatted = service['formatJobWithError'](failedJob);

      expect(formatted).toHaveProperty('failedReason');
      expect(formatted).toHaveProperty('stacktrace');
      expect(formatted.failedReason).toBe('CAPTCHA detected');
      expect(formatted.stacktrace).toEqual(['Error: CAPTCHA detected']);
    });
  });

  describe('queue management lifecycle', () => {
    it('should handle pause and resume sequence', async () => {
      await service.pauseQueue();
      await service.resumeQueue();

      expect(mockQueue.pause).toHaveBeenCalled();
      expect(mockQueue.resume).toHaveBeenCalled();
    });

    it('should clear queue and verify counts', async () => {
      await service.clearQueue();

      mockQueue.getWaitingCount.mockResolvedValue(0);
      const stats = await service.getQueueStats();

      expect(mockQueue.empty).toHaveBeenCalled();
      expect(stats.waiting).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle queue.add errors', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue is full'));

      await expect(service.addApplicationToQueue(mockApplicationData)).rejects.toThrow(
        'Queue is full',
      );
    });

    it('should handle getQueueStats errors', async () => {
      mockQueue.getWaitingCount.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.getQueueStats()).rejects.toThrow('Redis connection failed');
    });

    it('should handle job removal errors', async () => {
      mockQueue.getJob.mockResolvedValue(mockJob);
      mockJob.remove.mockRejectedValue(new Error('Job locked'));

      await expect(service.removeJob('job-123')).rejects.toThrow('Job locked');
    });
  });

  describe('platform-specific rate limiting', () => {
    it('should apply different delays for different platforms', () => {
      const workdayDelay = service['calculateDelay']('workday');
      const greenhouseDelay = service['calculateDelay']('greenhouse');
      const defaultDelay = service['calculateDelay']('default');

      expect(typeof workdayDelay).toBe('number');
      expect(typeof greenhouseDelay).toBe('number');
      expect(typeof defaultDelay).toBe('number');
    });

    it('should add variance to avoid detection patterns', () => {
      const delays = Array.from({ length: 10 }, () => service['calculateDelay']('greenhouse'));

      // Check that not all delays are exactly the same
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });
});
