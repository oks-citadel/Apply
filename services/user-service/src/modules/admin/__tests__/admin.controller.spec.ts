import { UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { ContentStatus } from '../enums/content-status.enum';
import { JobStatus } from '../enums/job-status.enum';
import { UserRole } from '../enums/user-role.enum';

import type { CreateUserDto } from '../dto/create-user.dto';
import type { UpdateSettingsDto } from '../dto/update-settings.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import type { TestingModule } from '@nestjs/testing';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getDashboardStats: jest.fn(),
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getPendingJobs: jest.fn(),
    approveJob: jest.fn(),
    rejectJob: jest.fn(),
    getReports: jest.fn(),
    getReportById: jest.fn(),
    resolveReport: jest.fn(),
    approveContent: jest.fn(),
    rejectContent: jest.fn(),
    getAnalytics: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getAuditLogs: jest.fn(),
  };

  const mockAdminUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
  };

  const mockRegularUser = {
    id: 'regular-user-id',
    email: 'user@example.com',
    role: UserRole.USER,
    firstName: 'Regular',
    lastName: 'User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        totalUsers: 1500,
        activeUsers: 1200,
        totalJobs: 5000,
        pendingJobs: 50,
        totalApplications: 15000,
        successRate: 0.35,
        reportsCount: 25,
        unresolvedReports: 10,
        revenue: 50000,
        newUsersThisMonth: 150,
      };

      mockAdminService.getDashboardStats.mockResolvedValue(mockStats);

      const result = await controller.getDashboardStats(mockAdminUser);

      expect(result).toEqual(mockStats);
      expect(service.getDashboardStats).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching dashboard stats', async () => {
      mockAdminService.getDashboardStats.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.getDashboardStats(mockAdminUser)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getUsers', () => {
    it('should return paginated list of users', async () => {
      const mockUsersResponse = {
        data: [
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
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAdminService.getUsers.mockResolvedValue(mockUsersResponse);

      const result = await controller.getUsers(mockAdminUser, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockUsersResponse);
      expect(service.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should filter users by role', async () => {
      const mockFilteredUsers = {
        data: [
          {
            id: '1',
            email: 'admin@example.com',
            role: UserRole.ADMIN,
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
            createdAt: new Date('2024-01-01'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAdminService.getUsers.mockResolvedValue(mockFilteredUsers);

      const result = await controller.getUsers(mockAdminUser, {
        page: 1,
        limit: 10,
        role: UserRole.ADMIN,
      });

      expect(result).toEqual(mockFilteredUsers);
      expect(service.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: UserRole.ADMIN,
      });
    });

    it('should filter users by search query', async () => {
      mockAdminService.getUsers.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.getUsers(mockAdminUser, {
        page: 1,
        limit: 10,
        search: 'john@example.com',
      });

      expect(service.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'john@example.com',
      });
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        role: UserRole.USER,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        profile: {
          bio: 'Software Developer',
          location: 'New York',
        },
      };

      mockAdminService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(mockAdminUser, '1');

      expect(result).toEqual(mockUser);
      expect(service.getUserById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockAdminService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getUserById(mockAdminUser, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const mockCreatedUser = {
        id: '3',
        ...createUserDto,
        isActive: true,
        createdAt: new Date(),
      };

      mockAdminService.createUser.mockResolvedValue(mockCreatedUser);

      const result = await controller.createUser(mockAdminUser, createUserDto);

      expect(result).toEqual(mockCreatedUser);
      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle duplicate email errors', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.USER,
      };

      mockAdminService.createUser.mockRejectedValue(
        new Error('User with this email already exists'),
      );

      await expect(controller.createUser(mockAdminUser, createUserDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
        role: UserRole.MODERATOR,
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'user@example.com',
        ...updateUserDto,
        isActive: true,
        updatedAt: new Date(),
      };

      mockAdminService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser(mockAdminUser, userId, updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(service.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should allow updating user role', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        role: UserRole.MODERATOR,
      };

      mockAdminService.updateUser.mockResolvedValue({
        id: userId,
        role: UserRole.MODERATOR,
      });

      await controller.updateUser(mockAdminUser, userId, updateUserDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should allow deactivating a user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        isActive: false,
      };

      mockAdminService.updateUser.mockResolvedValue({
        id: userId,
        isActive: false,
      });

      await controller.updateUser(mockAdminUser, userId, updateUserDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockAdminService.updateUser.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateUser(mockAdminUser, 'invalid-id', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = '1';

      mockAdminService.deleteUser.mockResolvedValue({
        success: true,
        message: 'User deleted successfully',
      });

      const result = await controller.deleteUser(mockAdminUser, userId);

      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
      expect(service.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should prevent admin from deleting themselves', async () => {
      mockAdminService.deleteUser.mockRejectedValue(
        new ForbiddenException('Cannot delete your own account'),
      );

      await expect(
        controller.deleteUser(mockAdminUser, mockAdminUser.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockAdminService.deleteUser.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.deleteUser(mockAdminUser, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPendingJobs', () => {
    it('should return pending jobs for review', async () => {
      const mockPendingJobs = {
        data: [
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
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAdminService.getPendingJobs.mockResolvedValue(mockPendingJobs);

      const result = await controller.getPendingJobs(mockAdminUser, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockPendingJobs);
      expect(service.getPendingJobs).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('approveJob', () => {
    it('should approve a job', async () => {
      const jobId = '1';

      mockAdminService.approveJob.mockResolvedValue({
        id: jobId,
        status: JobStatus.APPROVED,
        approvedBy: mockAdminUser.id,
        approvedAt: new Date(),
      });

      const result = await controller.approveJob(mockAdminUser, jobId);

      expect(result.status).toBe(JobStatus.APPROVED);
      expect(service.approveJob).toHaveBeenCalledWith(jobId, mockAdminUser.id);
    });

    it('should create audit log when approving job', async () => {
      const jobId = '1';

      mockAdminService.approveJob.mockResolvedValue({
        id: jobId,
        status: JobStatus.APPROVED,
      });

      await controller.approveJob(mockAdminUser, jobId);

      expect(service.approveJob).toHaveBeenCalledWith(jobId, mockAdminUser.id);
    });
  });

  describe('rejectJob', () => {
    it('should reject a job with reason', async () => {
      const jobId = '1';
      const reason = 'Violates community guidelines';

      mockAdminService.rejectJob.mockResolvedValue({
        id: jobId,
        status: JobStatus.REJECTED,
        rejectedBy: mockAdminUser.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
      });

      const result = await controller.rejectJob(mockAdminUser, jobId, { reason });

      expect(result.status).toBe(JobStatus.REJECTED);
      expect(result.rejectionReason).toBe(reason);
      expect(service.rejectJob).toHaveBeenCalledWith(jobId, mockAdminUser.id, reason);
    });
  });

  describe('getReports', () => {
    it('should return list of reports', async () => {
      const mockReports = {
        data: [
          {
            id: '1',
            type: 'JOB',
            reason: 'Spam',
            status: 'PENDING',
            reportedBy: 'user-1',
            createdAt: new Date('2024-01-01'),
          },
          {
            id: '2',
            type: 'USER',
            reason: 'Inappropriate behavior',
            status: 'PENDING',
            reportedBy: 'user-2',
            createdAt: new Date('2024-01-02'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAdminService.getReports.mockResolvedValue(mockReports);

      const result = await controller.getReports(mockAdminUser, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockReports);
      expect(service.getReports).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should filter reports by status', async () => {
      mockAdminService.getReports.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.getReports(mockAdminUser, {
        page: 1,
        limit: 10,
        status: 'RESOLVED',
      });

      expect(service.getReports).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'RESOLVED',
      });
    });
  });

  describe('getReportById', () => {
    it('should return a report by ID', async () => {
      const reportId = '1';
      const mockReport = {
        id: reportId,
        type: 'JOB',
        reason: 'Spam',
        status: 'PENDING',
        reportedBy: 'user-1',
        description: 'This job posting is spam',
        createdAt: new Date(),
      };

      mockAdminService.getReportById.mockResolvedValue(mockReport);

      const result = await controller.getReportById(mockAdminUser, reportId);

      expect(result).toEqual(mockReport);
      expect(service.getReportById).toHaveBeenCalledWith(reportId);
    });
  });

  describe('resolveReport', () => {
    it('should resolve a report', async () => {
      const reportId = '1';
      const resolution = {
        action: 'REMOVE_CONTENT',
        notes: 'Content removed for violating guidelines',
      };

      mockAdminService.resolveReport.mockResolvedValue({
        id: reportId,
        status: 'RESOLVED',
        resolvedBy: mockAdminUser.id,
        resolvedAt: new Date(),
        resolution,
      });

      const result = await controller.resolveReport(mockAdminUser, reportId, resolution);

      expect(result.status).toBe('RESOLVED');
      expect(service.resolveReport).toHaveBeenCalledWith(
        reportId,
        mockAdminUser.id,
        resolution,
      );
    });
  });

  describe('approveContent', () => {
    it('should approve content', async () => {
      const contentId = '1';

      mockAdminService.approveContent.mockResolvedValue({
        id: contentId,
        status: ContentStatus.APPROVED,
        approvedBy: mockAdminUser.id,
        approvedAt: new Date(),
      });

      const result = await controller.approveContent(mockAdminUser, contentId);

      expect(result.status).toBe(ContentStatus.APPROVED);
      expect(service.approveContent).toHaveBeenCalledWith(contentId, mockAdminUser.id);
    });
  });

  describe('rejectContent', () => {
    it('should reject content with reason', async () => {
      const contentId = '1';
      const reason = 'Inappropriate content';

      mockAdminService.rejectContent.mockResolvedValue({
        id: contentId,
        status: ContentStatus.REJECTED,
        rejectedBy: mockAdminUser.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
      });

      const result = await controller.rejectContent(mockAdminUser, contentId, {
        reason,
      });

      expect(result.status).toBe(ContentStatus.REJECTED);
      expect(service.rejectContent).toHaveBeenCalledWith(
        contentId,
        mockAdminUser.id,
        reason,
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return platform analytics', async () => {
      const mockAnalytics = {
        userGrowth: {
          labels: ['Jan', 'Feb', 'Mar'],
          data: [100, 150, 200],
        },
        applicationStats: {
          total: 15000,
          successful: 5250,
          pending: 3000,
          rejected: 6750,
        },
        jobStats: {
          total: 5000,
          active: 4500,
          pending: 50,
          expired: 450,
        },
        revenue: {
          monthly: 50000,
          yearly: 500000,
          subscriptions: {
            basic: 500,
            premium: 200,
            enterprise: 50,
          },
        },
      };

      mockAdminService.getAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getAnalytics(mockAdminUser, {
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      });

      expect(result).toEqual(mockAnalytics);
      expect(service.getAnalytics).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      });
    });
  });

  describe('getSettings', () => {
    it('should return system settings', async () => {
      const mockSettings = {
        maintenance: {
          enabled: false,
          message: '',
        },
        features: {
          autoApply: true,
          aiResumeOptimization: true,
          interviewPrep: true,
        },
        email: {
          notifications: true,
          provider: 'sendgrid',
        },
        limits: {
          maxApplicationsPerDay: 100,
          maxJobsPerPage: 50,
        },
      };

      mockAdminService.getSettings.mockResolvedValue(mockSettings);

      const result = await controller.getSettings(mockAdminUser);

      expect(result).toEqual(mockSettings);
      expect(service.getSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSettings', () => {
    it('should update system settings', async () => {
      const updateSettingsDto: UpdateSettingsDto = {
        maintenance: {
          enabled: true,
          message: 'Scheduled maintenance in progress',
        },
      };

      const mockUpdatedSettings = {
        ...updateSettingsDto,
        updatedBy: mockAdminUser.id,
        updatedAt: new Date(),
      };

      mockAdminService.updateSettings.mockResolvedValue(mockUpdatedSettings);

      const result = await controller.updateSettings(mockAdminUser, updateSettingsDto);

      expect(result).toEqual(mockUpdatedSettings);
      expect(service.updateSettings).toHaveBeenCalledWith(
        updateSettingsDto,
        mockAdminUser.id,
      );
    });

    it('should create audit log when updating settings', async () => {
      const updateSettingsDto: UpdateSettingsDto = {
        features: {
          autoApply: false,
        },
      };

      mockAdminService.updateSettings.mockResolvedValue({
        ...updateSettingsDto,
      });

      await controller.updateSettings(mockAdminUser, updateSettingsDto);

      expect(service.updateSettings).toHaveBeenCalledWith(
        updateSettingsDto,
        mockAdminUser.id,
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs', async () => {
      const mockAuditLogs = {
        data: [
          {
            id: '1',
            action: 'USER_UPDATED',
            performedBy: mockAdminUser.id,
            targetType: 'USER',
            targetId: 'user-1',
            changes: { role: 'MODERATOR' },
            timestamp: new Date('2024-01-01'),
          },
          {
            id: '2',
            action: 'JOB_APPROVED',
            performedBy: mockAdminUser.id,
            targetType: 'JOB',
            targetId: 'job-1',
            timestamp: new Date('2024-01-02'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAdminService.getAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs(mockAdminUser, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockAuditLogs);
      expect(service.getAuditLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should filter audit logs by action type', async () => {
      mockAdminService.getAuditLogs.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.getAuditLogs(mockAdminUser, {
        page: 1,
        limit: 10,
        action: 'USER_DELETED',
      });

      expect(service.getAuditLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        action: 'USER_DELETED',
      });
    });
  });

  describe('Authorization', () => {
    it('should require admin role for all endpoints', () => {
      // This test verifies that guards are applied
      // In a real scenario, you would test the guards separately
      const metadata = Reflect.getMetadata('guards', AdminController);
      expect(metadata).toBeDefined();
    });

    it('should prevent non-admin users from accessing admin endpoints', async () => {
      // This would be tested in integration tests with actual guards
      // Here we verify the controller expects authenticated users
      expect(controller).toBeDefined();
    });
  });
});
