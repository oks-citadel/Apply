
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AlertsService } from './alerts.service';
import { JobAlert, AlertFrequency } from './entities/job-alert.entity';
import { RemoteType, ExperienceLevel, EmploymentType } from '../jobs/entities/job.entity';
import { SearchService } from '../search/search.service';

import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';

describe('AlertsService', () => {
  let service: AlertsService;
  let alertRepository: jest.Mocked<Repository<JobAlert>>;
  let searchService: jest.Mocked<SearchService>;

  const mockAlert: Partial<JobAlert> = {
    id: 'alert-1',
    user_id: 'user-1',
    name: 'Software Engineer Jobs',
    keywords: 'software engineer',
    location: 'San Francisco',
    remote_type: RemoteType.HYBRID,
    salary_min: 100000,
    salary_max: 200000,
    experience_level: ExperienceLevel.SENIOR,
    employment_type: EmploymentType.FULL_TIME,
    skills: ['TypeScript', 'Node.js'],
    company_id: null,
    frequency: AlertFrequency.DAILY,
    is_active: true,
    last_checked_at: null,
    last_sent_at: null,
    jobs_sent_count: 0,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockAlertRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSearchService = {
    searchJobs: jest.fn(),
    findSimilarJobs: jest.fn(),
    indexJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(JobAlert),
          useValue: mockAlertRepository,
        },
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    alertRepository = module.get(getRepositoryToken(JobAlert));
    searchService = module.get(SearchService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAlert', () => {
    const createDto = {
      name: 'Software Engineer Jobs',
      keywords: 'software engineer',
      location: 'San Francisco',
      remote_type: RemoteType.HYBRID,
      salary_min: 100000,
      experience_level: ExperienceLevel.SENIOR,
      frequency: AlertFrequency.DAILY,
    };

    it('should create an alert successfully', async () => {
      mockAlertRepository.create.mockReturnValue(mockAlert as JobAlert);
      mockAlertRepository.save.mockResolvedValue(mockAlert as JobAlert);

      const result = await service.createAlert('user-1', createDto);

      expect(result).toEqual(mockAlert);
      expect(mockAlertRepository.create).toHaveBeenCalledWith({
        user_id: 'user-1',
        ...createDto,
        frequency: AlertFrequency.DAILY,
        is_active: true,
      });
      expect(mockAlertRepository.save).toHaveBeenCalled();
    });

    it('should use default frequency if not provided', async () => {
      const dtoWithoutFrequency = { ...createDto };
      delete dtoWithoutFrequency.frequency;

      mockAlertRepository.create.mockReturnValue(mockAlert as JobAlert);
      mockAlertRepository.save.mockResolvedValue(mockAlert as JobAlert);

      await service.createAlert('user-1', dtoWithoutFrequency);

      expect(mockAlertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: AlertFrequency.DAILY,
        }),
      );
    });

    it('should set is_active to true by default', async () => {
      mockAlertRepository.create.mockReturnValue(mockAlert as JobAlert);
      mockAlertRepository.save.mockResolvedValue(mockAlert as JobAlert);

      await service.createAlert('user-1', createDto);

      expect(mockAlertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
        }),
      );
    });

    it('should respect is_active value if provided', async () => {
      const dtoWithInactive = { ...createDto, is_active: false };

      mockAlertRepository.create.mockReturnValue({
        ...mockAlert,
        is_active: false,
      } as JobAlert);
      mockAlertRepository.save.mockResolvedValue({
        ...mockAlert,
        is_active: false,
      } as JobAlert);

      await service.createAlert('user-1', dtoWithInactive);

      expect(mockAlertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
        }),
      );
    });
  });

  describe('getUserAlerts', () => {
    it('should return all alerts for a user', async () => {
      const mockAlerts = [
        mockAlert,
        { ...mockAlert, id: 'alert-2', name: 'Backend Jobs' },
      ];

      mockAlertRepository.find.mockResolvedValue(mockAlerts as JobAlert[]);

      const result = await service.getUserAlerts('user-1');

      expect(result).toEqual(mockAlerts);
      expect(mockAlertRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array if user has no alerts', async () => {
      mockAlertRepository.find.mockResolvedValue([]);

      const result = await service.getUserAlerts('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAlertById', () => {
    it('should return alert by ID', async () => {
      mockAlertRepository.findOne.mockResolvedValue(mockAlert as JobAlert);

      const result = await service.getAlertById('alert-1', 'user-1');

      expect(result).toEqual(mockAlert);
      expect(mockAlertRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'alert-1', user_id: 'user-1' },
      });
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockAlertRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAlertById('nonexistent-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not return alerts from other users', async () => {
      mockAlertRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAlertById('alert-1', 'other-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAlert', () => {
    const updateDto = {
      name: 'Updated Alert Name',
      keywords: 'updated keywords',
      is_active: false,
    };

    it('should update alert successfully', async () => {
      const updatedAlert = { ...mockAlert, ...updateDto };

      mockAlertRepository.findOne.mockResolvedValue(mockAlert as JobAlert);
      mockAlertRepository.save.mockResolvedValue(updatedAlert as JobAlert);

      const result = await service.updateAlert('alert-1', 'user-1', updateDto);

      expect(result).toEqual(updatedAlert);
      expect(mockAlertRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockAlertRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAlert('nonexistent-id', 'user-1', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      const partialUpdate = { name: 'New Name' };
      mockAlertRepository.findOne.mockResolvedValue(mockAlert as JobAlert);
      mockAlertRepository.save.mockResolvedValue({
        ...mockAlert,
        name: 'New Name',
      } as JobAlert);

      const result = await service.updateAlert('alert-1', 'user-1', partialUpdate);

      expect(result.name).toBe('New Name');
      expect(result.keywords).toBe(mockAlert.keywords);
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert successfully', async () => {
      mockAlertRepository.findOne.mockResolvedValue(mockAlert as JobAlert);
      mockAlertRepository.remove.mockResolvedValue(mockAlert as JobAlert);

      await service.deleteAlert('alert-1', 'user-1');

      expect(mockAlertRepository.remove).toHaveBeenCalledWith(mockAlert);
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockAlertRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteAlert('nonexistent-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('testAlert', () => {
    it('should return matching jobs for alert', async () => {
      const mockSearchResults = {
        hits: [
          { id: 'job-1', title: 'Senior Software Engineer' },
          { id: 'job-2', title: 'Software Engineer' },
        ],
        total: 10,
      };

      mockAlertRepository.findOne.mockResolvedValue(mockAlert as JobAlert);
      mockSearchService.searchJobs.mockResolvedValue(mockSearchResults);

      const result = await service.testAlert('alert-1', 'user-1');

      expect(result).toEqual({
        alert_name: mockAlert.name,
        matching_jobs_count: 10,
        sample_jobs: mockSearchResults.hits.slice(0, 5),
      });
      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          keywords: mockAlert.keywords,
          location: mockAlert.location,
          remote_type: mockAlert.remote_type,
          salary_min: mockAlert.salary_min,
          salary_max: mockAlert.salary_max,
          experience_level: mockAlert.experience_level,
          employment_type: mockAlert.employment_type,
          skills: mockAlert.skills,
          company_id: mockAlert.company_id,
          page: 1,
          limit: 10,
          sort_by: 'posted_at',
          sort_order: 'desc',
        }),
      );
    });

    it('should throw NotFoundException when alert not found', async () => {
      mockAlertRepository.findOne.mockResolvedValue(null);

      await expect(service.testAlert('nonexistent-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should limit sample jobs to 5', async () => {
      const mockSearchResults = {
        hits: Array(20)
          .fill(null)
          .map((_, i) => ({ id: `job-${i}`, title: `Job ${i}` })),
        total: 20,
      };

      mockAlertRepository.findOne.mockResolvedValue(mockAlert as JobAlert);
      mockSearchService.searchJobs.mockResolvedValue(mockSearchResults);

      const result = await service.testAlert('alert-1', 'user-1');

      expect(result.sample_jobs).toHaveLength(5);
    });
  });

  describe('processAlerts', () => {
    it('should process active alerts that need checking', async () => {
      const activeAlerts = [
        { ...mockAlert, last_checked_at: null },
        {
          ...mockAlert,
          id: 'alert-2',
          last_checked_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        },
      ];

      mockAlertRepository.find.mockResolvedValue(activeAlerts as JobAlert[]);
      mockSearchService.searchJobs.mockResolvedValue({ hits: [], total: 0 });
      mockAlertRepository.save.mockResolvedValue(mockAlert as JobAlert);

      await service.processAlerts();

      expect(mockAlertRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
      });
      expect(mockAlertRepository.save).toHaveBeenCalled();
    });

    it('should update last_checked_at after processing', async () => {
      const alert = { ...mockAlert, last_checked_at: null };

      mockAlertRepository.find.mockResolvedValue([alert as JobAlert]);
      mockSearchService.searchJobs.mockResolvedValue({ hits: [], total: 0 });
      mockAlertRepository.save.mockImplementation((a) => Promise.resolve(a as JobAlert));

      await service.processAlerts();

      expect(mockAlertRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          last_checked_at: expect.any(Date),
        }),
      );
    });

    it('should update last_sent_at and jobs_sent_count when jobs found', async () => {
      const alert = { ...mockAlert, last_checked_at: null, jobs_sent_count: 5 };

      mockAlertRepository.find.mockResolvedValue([alert as JobAlert]);
      mockSearchService.searchJobs.mockResolvedValue({
        hits: [{ id: 'job-1' }, { id: 'job-2' }],
        total: 2,
      });
      mockAlertRepository.save.mockImplementation((a) => Promise.resolve(a as JobAlert));

      await service.processAlerts();

      expect(mockAlertRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          last_sent_at: expect.any(Date),
          jobs_sent_count: 7,
          last_checked_at: expect.any(Date),
        }),
      );
    });

    it('should continue processing other alerts if one fails', async () => {
      const alerts = [
        { ...mockAlert, id: 'alert-1' },
        { ...mockAlert, id: 'alert-2' },
      ];

      mockAlertRepository.find.mockResolvedValue(alerts as JobAlert[]);
      mockSearchService.searchJobs
        .mockRejectedValueOnce(new Error('Search failed'))
        .mockResolvedValueOnce({ hits: [], total: 0 });
      mockAlertRepository.save.mockResolvedValue(mockAlert as JobAlert);

      await service.processAlerts();

      // Should still attempt to process the second alert
      expect(mockSearchService.searchJobs).toHaveBeenCalledTimes(2);
    });

    it('should handle empty alerts array', async () => {
      mockAlertRepository.find.mockResolvedValue([]);

      await service.processAlerts();

      expect(mockSearchService.searchJobs).not.toHaveBeenCalled();
    });
  });

  describe('shouldProcessAlert', () => {
    it('should process alert with no last_checked_at', () => {
      const alert = { ...mockAlert, last_checked_at: null } as JobAlert;
      const shouldProcess = (service as any).shouldProcessAlert(alert, new Date());

      expect(shouldProcess).toBe(true);
    });

    it('should process INSTANT alert after 1 hour', () => {
      const alert = {
        ...mockAlert,
        frequency: AlertFrequency.INSTANT,
        last_checked_at: new Date(Date.now() - 61 * 60 * 1000), // 61 minutes ago
      } as JobAlert;
      const shouldProcess = (service as any).shouldProcessAlert(alert, new Date());

      expect(shouldProcess).toBe(true);
    });

    it('should not process INSTANT alert before 1 hour', () => {
      const alert = {
        ...mockAlert,
        frequency: AlertFrequency.INSTANT,
        last_checked_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      } as JobAlert;
      const shouldProcess = (service as any).shouldProcessAlert(alert, new Date());

      expect(shouldProcess).toBe(false);
    });

    it('should process DAILY alert after 24 hours', () => {
      const alert = {
        ...mockAlert,
        frequency: AlertFrequency.DAILY,
        last_checked_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      } as JobAlert;
      const shouldProcess = (service as any).shouldProcessAlert(alert, new Date());

      expect(shouldProcess).toBe(true);
    });

    it('should not process DAILY alert before 24 hours', () => {
      const alert = {
        ...mockAlert,
        frequency: AlertFrequency.DAILY,
        last_checked_at: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
      } as JobAlert;
      const shouldProcess = (service as any).shouldProcessAlert(alert, new Date());

      expect(shouldProcess).toBe(false);
    });

    it('should process WEEKLY alert after 7 days', () => {
      const alert = {
        ...mockAlert,
        frequency: AlertFrequency.WEEKLY,
        last_checked_at: new Date(Date.now() - 169 * 60 * 60 * 1000), // 169 hours ago (7+ days)
      } as JobAlert;
      const shouldProcess = (service as any).shouldProcessAlert(alert, new Date());

      expect(shouldProcess).toBe(true);
    });

    it('should not process WEEKLY alert before 7 days', () => {
      const alert = {
        ...mockAlert,
        frequency: AlertFrequency.WEEKLY,
        last_checked_at: new Date(Date.now() - 100 * 60 * 60 * 1000), // 100 hours ago (~4 days)
      } as JobAlert;
      const shouldProcess = (service as any).shouldProcessAlert(alert, new Date());

      expect(shouldProcess).toBe(false);
    });
  });

  describe('processAlert', () => {
    it('should search with posted_within_days filter when last_checked_at exists', async () => {
      const alert = {
        ...mockAlert,
        last_checked_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      } as JobAlert;

      mockSearchService.searchJobs.mockResolvedValue({ hits: [], total: 0 });
      mockAlertRepository.save.mockResolvedValue(alert);

      await (service as any).processAlert(alert);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          posted_within_days: 3,
        }),
      );
    });

    it('should not include posted_within_days filter when last_checked_at is null', async () => {
      const alert = { ...mockAlert, last_checked_at: null } as JobAlert;

      mockSearchService.searchJobs.mockResolvedValue({ hits: [], total: 0 });
      mockAlertRepository.save.mockResolvedValue(alert);

      await (service as any).processAlert(alert);

      expect(mockSearchService.searchJobs).toHaveBeenCalledWith(
        expect.not.objectContaining({
          posted_within_days: expect.anything(),
        }),
      );
    });

    it('should handle search errors gracefully', async () => {
      const alert = { ...mockAlert } as JobAlert;

      mockSearchService.searchJobs.mockRejectedValue(new Error('Search failed'));

      await expect((service as any).processAlert(alert)).rejects.toThrow('Search failed');
    });
  });
});
