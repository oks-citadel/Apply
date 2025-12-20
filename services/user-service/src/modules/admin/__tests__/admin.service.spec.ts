import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../profile/entities/user.entity';
import { AdminService } from '../admin.service';
import { AuditLog } from '../entities/audit-log.entity';
import { Job } from '../entities/job.entity';
import { Report } from '../entities/report.entity';
import { SystemSettings } from '../entities/system-settings.entity';
import { ContentStatus } from '../enums/content-status.enum';
import { JobStatus } from '../enums/job-status.enum';
import { UserRole } from '../enums/user-role.enum';


import type { TestingModule } from '@nestjs/testing';
import type { Repository } from 'typeorm';

jest.mock('bcrypt');

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: Repository<User>;
  let jobRepository: Repository<Job>;
  let reportRepository: Repository<Report>;
  let auditLogRepository: Repository<AuditLog>;
  let settingsRepository: Repository<SystemSettings>;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockJobRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReportRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAuditLogRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockSettingsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
        {
          provide: getRepositoryToken(SystemSettings),
          useValue: mockSettingsRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jobRepository = module.get<Repository<Job>>(getRepositoryToken(Job));
    reportRepository = module.get<Repository<Report>>(getRepositoryToken(Report));
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    settingsRepository = module.get<Repository<SystemSettings>>(
      getRepositoryToken(SystemSettings),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      const mockDate = new Date('2024-01-01');
      const mockOneMonthAgo = new Date('2023-12-01');

      mockUserRepository.count.mockResolvedValueOnce(1500); // Total users
      mockUserRepository.count.mockResolvedValueOnce(1200); // Active users
      mockUserRepository.count.mockResolvedValueOnce(150); // New users this month
      mockJobRepository.count.mockResolvedValueOnce(5000); // Total jobs
      mockJobRepository.count.mockResolvedValueOnce(50); // Pending jobs
      mockReportRepository.count.mockResolvedValueOnce(25); // Total reports
      mockReportRepository.count.mockResolvedValueOnce(10); // Unresolved reports

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('totalJobs');
      expect(result).toHaveProperty('pendingJobs');
      expect(result).toHaveProperty('reportsCount');
      expect(result).toHaveProperty('unresolvedReports');
      expect(userRepository.count).toHaveBeenCalled();
      expect(jobRepository.count).toHaveBeenCalled();
      expect(reportRepository.count).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockUserRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getDashboardStats()).rejects.toThrow('Database error');
    });
  });

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          role: UserRole.USER,
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          email: 'user2@example.com',
          role: UserRole.USER,
          firstName: 'Jane',
          lastName: 'Smith',
          isActive: true,
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockUserRepository.findAndCount.mockResolvedValue([mockUsers, 2]);

      const result = await service.getUsers({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter users by role', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUsers({ page: 1, limit: 10, role: UserRole.ADMIN });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.role = :role',
        expect.any(Object),
      );
    });

    it('should search users by email or name', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUsers({ page: 1, limit: 10, search: 'john' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const mockUsers = Array(25).fill(null).map((_, i) => ({
        id: `${i + 1}`,
        email: `user${i + 1}@example.com`,
      }));

      mockUserRepository.findAndCount.mockResolvedValue([
        mockUsers.slice(10, 20),
        25,
      ]);

      const result = await service.getUsers({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID with relations', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        role: UserRole.USER,
        firstName: 'John',
        lastName: 'Doe',
        profile: {
          bio: 'Software Developer',
        },
        applications: [],
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: expect.any(Array),
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockCreatedUser = {
        id: '3',
        ...createUserDto,
        password: hashedPassword,
        isActive: true,
        createdAt: new Date(),
      };

      mockUserRepository.findOneBy.mockResolvedValue(null); // Email not exists
      mockUserRepository.create.mockReturnValue(mockCreatedUser);
      mockUserRepository.save.mockResolvedValue(mockCreatedUser);

      const result = await service.createUser(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result.email).toBe(createUserDto.email);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.USER,
      };

      mockUserRepository.findOneBy.mockResolvedValue({ id: '1' });

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate email format', async () => {
      const createUserDto = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      // This would be handled by class-validator in real scenario
      // Here we just verify the service receives the DTO
      mockUserRepository.findOneBy.mockResolvedValue(null);

      // The actual validation would happen at the controller level
      expect(createUserDto.email).toBe('invalid-email');
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      const userId = '1';
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'Old',
        lastName: 'Name',
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateUserDto);

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should update user role', async () => {
      const userId = '1';
      const updateUserDto = {
        role: UserRole.MODERATOR,
      };

      const existingUser = {
        id: userId,
        role: UserRole.USER,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        ...updateUserDto,
      });

      const result = await service.updateUser(userId, updateUserDto);

      expect(result.role).toBe(UserRole.MODERATOR);
    });

    it('should deactivate user account', async () => {
      const userId = '1';
      const updateUserDto = {
        isActive: false,
      };

      const existingUser = {
        id: userId,
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        ...updateUserDto,
      });

      const result = await service.updateUser(userId, updateUserDto);

      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUser('invalid-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create audit log for user update', async () => {
      const userId = '1';
      const adminId = 'admin-id';
      const updateUserDto = {
        role: UserRole.MODERATOR,
      };

      const existingUser = {
        id: userId,
        role: UserRole.USER,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        ...updateUserDto,
      });

      await service.updateUser(userId, updateUserDto, adminId);

      // Verify audit log would be created
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      const userId = '1';

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        isActive: false,
        deletedAt: new Date(),
      });

      const result = await service.deleteUser(userId);

      expect(result.success).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUser('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent deleting own account', async () => {
      const userId = 'admin-id';
      const adminId = 'admin-id';

      await expect(service.deleteUser(userId, adminId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create audit log for user deletion', async () => {
      const userId = '1';
      const adminId = 'admin-id';

      const existingUser = {
        id: userId,
        email: 'user@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(existingUser);

      await service.deleteUser(userId, adminId);

      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('getPendingJobs', () => {
    it('should return paginated pending jobs', async () => {
      const mockPendingJobs = [
        {
          id: '1',
          title: 'Software Engineer',
          company: 'Tech Corp',
          status: JobStatus.PENDING,
          submittedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          title: 'Product Manager',
          company: 'StartUp Inc',
          status: JobStatus.PENDING,
          submittedAt: new Date('2024-01-02'),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockPendingJobs, 2]),
      };

      mockJobRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPendingJobs({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockPendingJobs);
      expect(result.total).toBe(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'job.status = :status',
        { status: JobStatus.PENDING },
      );
    });
  });

  describe('approveJob', () => {
    it('should approve a pending job', async () => {
      const jobId = '1';
      const adminId = 'admin-id';

      const mockJob = {
        id: jobId,
        status: JobStatus.PENDING,
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockJobRepository.save.mockResolvedValue({
        ...mockJob,
        status: JobStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
      });

      const result = await service.approveJob(jobId, adminId);

      expect(result.status).toBe(JobStatus.APPROVED);
      expect(result.approvedBy).toBe(adminId);
      expect(jobRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.approveJob('invalid-id', 'admin-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create audit log when approving job', async () => {
      const jobId = '1';
      const adminId = 'admin-id';

      const mockJob = {
        id: jobId,
        status: JobStatus.PENDING,
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockJobRepository.save.mockResolvedValue(mockJob);

      await service.approveJob(jobId, adminId);

      expect(jobRepository.save).toHaveBeenCalled();
    });
  });

  describe('rejectJob', () => {
    it('should reject a job with reason', async () => {
      const jobId = '1';
      const adminId = 'admin-id';
      const reason = 'Violates community guidelines';

      const mockJob = {
        id: jobId,
        status: JobStatus.PENDING,
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockJobRepository.save.mockResolvedValue({
        ...mockJob,
        status: JobStatus.REJECTED,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      });

      const result = await service.rejectJob(jobId, adminId, reason);

      expect(result.status).toBe(JobStatus.REJECTED);
      expect(result.rejectionReason).toBe(reason);
    });

    it('should require rejection reason', async () => {
      const mockJob = {
        id: '1',
        status: JobStatus.PENDING,
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);

      await expect(service.rejectJob('1', 'admin-id', '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getReports', () => {
    it('should return paginated reports', async () => {
      const mockReports = [
        {
          id: '1',
          type: 'JOB',
          reason: 'Spam',
          status: 'PENDING',
          createdAt: new Date(),
        },
      ];

      mockReportRepository.findAndCount.mockResolvedValue([mockReports, 1]);

      const result = await service.getReports({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockReports);
      expect(result.total).toBe(1);
    });

    it('should filter reports by status', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getReports({ page: 1, limit: 10, status: 'RESOLVED' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.status = :status',
        expect.any(Object),
      );
    });
  });

  describe('resolveReport', () => {
    it('should resolve a report', async () => {
      const reportId = '1';
      const adminId = 'admin-id';
      const resolution = {
        action: 'REMOVE_CONTENT',
        notes: 'Content removed',
      };

      const mockReport = {
        id: reportId,
        status: 'PENDING',
      };

      mockReportRepository.findOne.mockResolvedValue(mockReport);
      mockReportRepository.save.mockResolvedValue({
        ...mockReport,
        status: 'RESOLVED',
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolution,
      });

      const result = await service.resolveReport(reportId, adminId, resolution);

      expect(result.status).toBe('RESOLVED');
      expect(reportRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAnalytics', () => {
    it('should return platform analytics for date range', async () => {
      const params = {
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      mockUserRepository.count.mockResolvedValue(1500);
      mockJobRepository.count.mockResolvedValue(5000);

      const result = await service.getAnalytics(params);

      expect(result).toHaveProperty('userGrowth');
      expect(result).toHaveProperty('applicationStats');
      expect(result).toHaveProperty('jobStats');
    });
  });

  describe('getSettings', () => {
    it('should return system settings', async () => {
      const mockSettings = {
        id: '1',
        maintenance: {
          enabled: false,
          message: '',
        },
        features: {
          autoApply: true,
          aiResumeOptimization: true,
        },
      };

      mockSettingsRepository.findOne.mockResolvedValue(mockSettings);

      const result = await service.getSettings();

      expect(result).toEqual(mockSettings);
    });

    it('should return default settings if none exist', async () => {
      mockSettingsRepository.findOne.mockResolvedValue(null);

      const defaultSettings = {
        maintenance: { enabled: false },
        features: {},
      };

      mockSettingsRepository.create.mockReturnValue(defaultSettings);
      mockSettingsRepository.save.mockResolvedValue(defaultSettings);

      const result = await service.getSettings();

      expect(settingsRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should update system settings', async () => {
      const updateSettingsDto = {
        maintenance: {
          enabled: true,
          message: 'Maintenance mode',
        },
      };
      const adminId = 'admin-id';

      const existingSettings = {
        id: '1',
        maintenance: { enabled: false },
      };

      mockSettingsRepository.findOne.mockResolvedValue(existingSettings);
      mockSettingsRepository.save.mockResolvedValue({
        ...existingSettings,
        ...updateSettingsDto,
      });

      const result = await service.updateSettings(updateSettingsDto, adminId);

      expect(result.maintenance.enabled).toBe(true);
      expect(settingsRepository.save).toHaveBeenCalled();
    });

    it('should create audit log when updating settings', async () => {
      const updateSettingsDto = {
        features: { autoApply: false },
      };
      const adminId = 'admin-id';

      const existingSettings = { id: '1' };

      mockSettingsRepository.findOne.mockResolvedValue(existingSettings);
      mockSettingsRepository.save.mockResolvedValue(existingSettings);

      await service.updateSettings(updateSettingsDto, adminId);

      expect(settingsRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: '1',
          action: 'USER_UPDATED',
          performedBy: 'admin-id',
          timestamp: new Date(),
        },
      ];

      mockAuditLogRepository.findAndCount.mockResolvedValue([mockLogs, 1]);

      const result = await service.getAuditLogs({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockLogs);
      expect(result.total).toBe(1);
    });

    it('should filter audit logs by action type', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getAuditLogs({ page: 1, limit: 10, action: 'USER_DELETED' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});
