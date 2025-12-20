import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PlaybookApplication, ApplicationStatus } from './entities/playbook-application.entity';
import { Playbook, Region } from './entities/playbook.entity';
import { PlaybooksService } from './playbooks.service';
import { Job, RemoteType } from '../jobs/entities/job.entity';

import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';

describe('PlaybooksService', () => {
  let service: PlaybooksService;
  let playbookRepository: Repository<Playbook>;
  let applicationRepository: Repository<PlaybookApplication>;
  let jobRepository: Repository<Job>;

  const mockPlaybook: Partial<Playbook> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    region: Region.UNITED_STATES,
    name: 'United States Professional',
    country: 'United States',
    is_active: true,
    usage_count: 100,
    success_rate: 75.5,
    common_ats_systems: ['Workday', 'Greenhouse'],
    salary_norms: {
      currency: 'USD',
      typical_range_min: 50000,
      typical_range_max: 150000,
      negotiation_culture: 'moderate',
      salary_discussion_timing: 'mid_process',
      benefits_importance: 'high',
    },
    hiring_timeline: {
      typical_response_days: 14,
      typical_interview_rounds: 3,
      typical_total_process_days: 45,
      follow_up_acceptable: true,
      follow_up_days: 7,
    },
  };

  const mockJob: Partial<Job> = {
    id: 'job-123',
    title: 'Software Engineer',
    country: 'United States',
    location: 'New York, NY',
    remote_type: RemoteType.ONSITE,
    ats_platform: 'Workday',
  };

  const mockPlaybookRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
  };

  const mockApplicationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockJobRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaybooksService,
        {
          provide: getRepositoryToken(Playbook),
          useValue: mockPlaybookRepository,
        },
        {
          provide: getRepositoryToken(PlaybookApplication),
          useValue: mockApplicationRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<PlaybooksService>(PlaybooksService);
    playbookRepository = module.get<Repository<Playbook>>(
      getRepositoryToken(Playbook),
    );
    applicationRepository = module.get<Repository<PlaybookApplication>>(
      getRepositoryToken(PlaybookApplication),
    );
    jobRepository = module.get<Repository<Job>>(getRepositoryToken(Job));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active playbooks', async () => {
      const playbooks = [mockPlaybook];
      mockPlaybookRepository.find.mockResolvedValue(playbooks);

      const result = await service.findAll();

      expect(result).toEqual(playbooks);
      expect(mockPlaybookRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { usage_count: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a playbook by ID', async () => {
      mockPlaybookRepository.findOne.mockResolvedValue(mockPlaybook);

      const result = await service.findOne(mockPlaybook.id);

      expect(result).toEqual(mockPlaybook);
      expect(mockPlaybookRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPlaybook.id },
      });
    });

    it('should throw NotFoundException if playbook not found', async () => {
      mockPlaybookRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByRegion', () => {
    it('should return a playbook by region', async () => {
      mockPlaybookRepository.findOne.mockResolvedValue(mockPlaybook);

      const result = await service.findByRegion(Region.UNITED_STATES);

      expect(result).toEqual(mockPlaybook);
      expect(mockPlaybookRepository.findOne).toHaveBeenCalledWith({
        where: { region: Region.UNITED_STATES, is_active: true },
      });
    });

    it('should throw NotFoundException if playbook not found for region', async () => {
      mockPlaybookRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByRegion(Region.UNITED_STATES),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recommendPlaybook', () => {
    it('should recommend a playbook based on job location', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockPlaybookRepository.findOne.mockResolvedValue(mockPlaybook);
      mockPlaybookRepository.find.mockResolvedValue([
        mockPlaybook,
        { ...mockPlaybook, region: Region.CANADA },
      ]);

      const result = await service.recommendPlaybook('job-123');

      expect(result).toHaveProperty('recommended_playbook');
      expect(result).toHaveProperty('match_score');
      expect(result).toHaveProperty('match_reasons');
      expect(result).toHaveProperty('alternative_playbooks');
      expect(result.match_score).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.recommendPlaybook('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should recommend GLOBAL_REMOTE for remote jobs', async () => {
      const remoteJob = { ...mockJob, remote_type: RemoteType.REMOTE };
      const remotePlaybook = {
        ...mockPlaybook,
        region: Region.GLOBAL_REMOTE,
      };

      mockJobRepository.findOne.mockResolvedValue(remoteJob);
      mockPlaybookRepository.findOne.mockResolvedValue(remotePlaybook);
      mockPlaybookRepository.find.mockResolvedValue([remotePlaybook]);

      const result = await service.recommendPlaybook('job-123');

      expect(result.recommended_playbook.region).toBe(Region.GLOBAL_REMOTE);
    });
  });

  describe('applyPlaybook', () => {
    const applyDto = {
      job_id: 'job-123',
      playbook_id: mockPlaybook.id,
      user_id: 'user-123',
      auto_format_resume: true,
      auto_generate_cover_letter: true,
      optimize_for_ats: true,
    };

    it('should create a playbook application', async () => {
      const mockApplication = {
        id: 'app-123',
        ...applyDto,
        status: ApplicationStatus.PENDING,
        created_at: new Date(),
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockPlaybookRepository.findOne.mockResolvedValue(mockPlaybook);
      mockApplicationRepository.findOne.mockResolvedValue(null);
      mockApplicationRepository.create.mockReturnValue(mockApplication);
      mockApplicationRepository.save.mockResolvedValue(mockApplication);

      const result = await service.applyPlaybook(applyDto);

      expect(result).toHaveProperty('application_id');
      expect(result).toHaveProperty('playbook_id');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('next_steps');
      expect(mockPlaybookRepository.increment).toHaveBeenCalledWith(
        { id: mockPlaybook.id },
        'usage_count',
        1,
      );
    });

    it('should throw NotFoundException if job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.applyPlaybook(applyDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if application already exists', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockPlaybookRepository.findOne.mockResolvedValue(mockPlaybook);
      mockApplicationRepository.findOne.mockResolvedValue({
        id: 'existing-app',
      });

      await expect(service.applyPlaybook(applyDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateApplicationStatus', () => {
    const updateDto = {
      status: ApplicationStatus.APPLIED,
      user_rating: 5,
      user_feedback: 'Great playbook!',
    };

    it('should update application status', async () => {
      const mockApplication = {
        id: 'app-123',
        status: ApplicationStatus.PENDING,
        playbook: mockPlaybook,
      };

      mockApplicationRepository.findOne.mockResolvedValue(mockApplication);
      mockApplicationRepository.save.mockResolvedValue({
        ...mockApplication,
        ...updateDto,
        applied_at: new Date(),
      });

      const result = await service.updateApplicationStatus('app-123', updateDto);

      expect(result.status).toBe(ApplicationStatus.APPLIED);
      expect(result.user_rating).toBe(5);
    });

    it('should throw NotFoundException if application not found', async () => {
      mockApplicationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateApplicationStatus('nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set got_interview flag when status is INTERVIEW', async () => {
      const mockApplication = {
        id: 'app-123',
        status: ApplicationStatus.APPLIED,
        playbook: mockPlaybook,
        applied_at: new Date(),
      };

      mockApplicationRepository.findOne.mockResolvedValue(mockApplication);
      mockApplicationRepository.save.mockImplementation(app => app);

      const result = await service.updateApplicationStatus('app-123', {
        status: ApplicationStatus.INTERVIEW,
      });

      expect(mockApplicationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          got_interview: true,
        }),
      );
    });
  });

  describe('getUserApplicationStats', () => {
    it('should return user application statistics', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          user_id: 'user-123',
          status: ApplicationStatus.APPLIED,
          got_interview: true,
          got_offer: false,
          response_time_hours: 48,
          user_rating: 4,
          playbook: mockPlaybook,
        },
        {
          id: 'app-2',
          user_id: 'user-123',
          status: ApplicationStatus.INTERVIEW,
          got_interview: true,
          got_offer: true,
          response_time_hours: 72,
          user_rating: 5,
          playbook: mockPlaybook,
        },
      ];

      mockApplicationRepository.find.mockResolvedValue(mockApplications);

      const result = await service.getUserApplicationStats('user-123');

      expect(result).toHaveProperty('total_applications', 2);
      expect(result).toHaveProperty('applications_by_status');
      expect(result).toHaveProperty('applications_by_region');
      expect(result).toHaveProperty('average_response_time_hours');
      expect(result).toHaveProperty('interview_rate');
      expect(result).toHaveProperty('offer_rate');
      expect(result).toHaveProperty('success_rate_by_playbook');
      expect(result).toHaveProperty('most_successful_playbook');
      expect(result.interview_rate).toBe(100);
      expect(result.offer_rate).toBe(50);
    });

    it('should handle empty application list', async () => {
      mockApplicationRepository.find.mockResolvedValue([]);

      const result = await service.getUserApplicationStats('user-123');

      expect(result.total_applications).toBe(0);
      expect(result.interview_rate).toBe(0);
      expect(result.offer_rate).toBe(0);
    });
  });

  describe('getApplication', () => {
    it('should return an application by ID', async () => {
      const mockApplication = {
        id: 'app-123',
        playbook: mockPlaybook,
      };

      mockApplicationRepository.findOne.mockResolvedValue(mockApplication);

      const result = await service.getApplication('app-123');

      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException if application not found', async () => {
      mockApplicationRepository.findOne.mockResolvedValue(null);

      await expect(service.getApplication('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserApplications', () => {
    it('should return all applications for a user', async () => {
      const mockApplications = [
        { id: 'app-1', user_id: 'user-123', playbook: mockPlaybook },
        { id: 'app-2', user_id: 'user-123', playbook: mockPlaybook },
      ];

      mockApplicationRepository.find.mockResolvedValue(mockApplications);

      const result = await service.getUserApplications('user-123');

      expect(result).toEqual(mockApplications);
      expect(mockApplicationRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        relations: ['playbook'],
        order: { created_at: 'DESC' },
      });
    });
  });
});
