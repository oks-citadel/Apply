import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ApplicationStatus } from '../../applications/entities/application.entity';
import { RemoteType, EmploymentType, ExperienceLevel } from '../../jobs/entities/job.entity';
import { EmployerController } from '../employer.controller';
import { EmployerService } from '../employer.service';

import type { UpdateApplicationStatusDto } from '../dto/application.dto';
import type { SearchCandidatesDto } from '../dto/candidate.dto';
import type { UpdateCompanyDto } from '../dto/company.dto';
import type { CreateJobDto, UpdateJobDto } from '../dto/job.dto';
import type { AddTeamMemberDto } from '../dto/team.dto';
import type { TestingModule } from '@nestjs/testing';

describe('EmployerController', () => {
  let controller: EmployerController;
  let service: EmployerService;

  const mockEmployerService = {
    getCompany: jest.fn(),
    updateCompany: jest.fn(),
    createJob: jest.fn(),
    updateJob: jest.fn(),
    deleteJob: jest.fn(),
    getJobApplicants: jest.fn(),
    updateApplicationStatus: jest.fn(),
    searchCandidates: jest.fn(),
    getDashboardMetrics: jest.fn(),
    addTeamMember: jest.fn(),
    removeTeamMember: jest.fn(),
    getTeamMembers: jest.fn(),
    getEmployerJobs: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'employer@company.com',
      role: 'employer',
      companyId: 'company-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployerController],
      providers: [
        {
          provide: EmployerService,
          useValue: mockEmployerService,
        },
      ],
    }).compile();

    controller = module.get<EmployerController>(EmployerController);
    service = module.get<EmployerService>(EmployerService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/companies/:id', () => {
    it('should get company profile', async () => {
      const companyId = 'company-123';
      const mockCompany = {
        id: companyId,
        name: 'Tech Corp',
        description: 'Leading tech company',
        industry: 'Technology',
        size: 'medium',
        website: 'https://techcorp.com',
        headquarters: 'San Francisco, CA',
        logo_url: 'https://techcorp.com/logo.png',
        is_verified: true,
        active_jobs_count: 15,
      };

      mockEmployerService.getCompany.mockResolvedValue(mockCompany);

      const result = await controller.getCompany(companyId, mockRequest);

      expect(result).toEqual(mockCompany);
      expect(service.getCompany).toHaveBeenCalledWith(companyId, mockRequest.user.id);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockEmployerService.getCompany.mockRejectedValue(
        new NotFoundException('Company not found')
      );

      await expect(
        controller.getCompany('invalid-id', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PUT /api/v1/companies/:id', () => {
    it('should update company profile', async () => {
      const companyId = 'company-123';
      const updateDto: UpdateCompanyDto = {
        name: 'Tech Corp Updated',
        description: 'Updated description',
        website: 'https://newtechcorp.com',
        industry: 'Software',
      };

      const mockUpdatedCompany = {
        id: companyId,
        ...updateDto,
        updated_at: new Date(),
      };

      mockEmployerService.updateCompany.mockResolvedValue(mockUpdatedCompany);

      const result = await controller.updateCompany(companyId, updateDto, mockRequest);

      expect(result).toEqual(mockUpdatedCompany);
      expect(service.updateCompany).toHaveBeenCalledWith(
        companyId,
        updateDto,
        mockRequest.user.id
      );
    });

    it('should throw ForbiddenException when user not authorized', async () => {
      mockEmployerService.updateCompany.mockRejectedValue(
        new ForbiddenException('Not authorized to update this company')
      );

      const updateDto: UpdateCompanyDto = { name: 'New Name' };

      await expect(
        controller.updateCompany('company-123', updateDto, mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('POST /api/v1/employer/jobs', () => {
    it('should create a new job posting', async () => {
      const createJobDto: CreateJobDto = {
        title: 'Senior Software Engineer',
        description: 'We are looking for a senior engineer...',
        requirements: ['5+ years experience', 'React expertise'],
        skills: ['React', 'TypeScript', 'Node.js'],
        location: 'San Francisco, CA',
        remote_type: RemoteType.HYBRID,
        employment_type: EmploymentType.FULL_TIME,
        experience_level: ExperienceLevel.SENIOR,
        salary_min: 120000,
        salary_max: 180000,
        salary_currency: 'USD',
        salary_period: 'yearly',
        benefits: ['Health insurance', '401k', 'Equity'],
        application_url: 'https://techcorp.com/careers/apply',
      };

      const mockCreatedJob = {
        id: 'job-123',
        ...createJobDto,
        company_id: mockRequest.user.companyId,
        posted_at: new Date(),
        is_active: true,
        view_count: 0,
        application_count: 0,
      };

      mockEmployerService.createJob.mockResolvedValue(mockCreatedJob);

      const result = await controller.createJob(createJobDto, mockRequest);

      expect(result).toEqual(mockCreatedJob);
      expect(service.createJob).toHaveBeenCalledWith(
        createJobDto,
        mockRequest.user.companyId,
        mockRequest.user.id
      );
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        title: 'Senior Engineer',
        // Missing required fields
      } as CreateJobDto;

      mockEmployerService.createJob.mockRejectedValue(
        new BadRequestException('Description is required')
      );

      await expect(
        controller.createJob(invalidDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('PUT /api/v1/employer/jobs/:id', () => {
    it('should update an existing job', async () => {
      const jobId = 'job-123';
      const updateDto: UpdateJobDto = {
        title: 'Senior Software Engineer - Updated',
        salary_max: 200000,
        is_active: true,
      };

      const mockUpdatedJob = {
        id: jobId,
        title: updateDto.title,
        salary_max: updateDto.salary_max,
        is_active: updateDto.is_active,
        updated_at: new Date(),
      };

      mockEmployerService.updateJob.mockResolvedValue(mockUpdatedJob);

      const result = await controller.updateJob(jobId, updateDto, mockRequest);

      expect(result).toEqual(mockUpdatedJob);
      expect(service.updateJob).toHaveBeenCalledWith(
        jobId,
        updateDto,
        mockRequest.user.companyId,
        mockRequest.user.id
      );
    });

    it('should throw NotFoundException for non-existent job', async () => {
      mockEmployerService.updateJob.mockRejectedValue(
        new NotFoundException('Job not found')
      );

      await expect(
        controller.updateJob('invalid-job', {}, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /api/v1/employer/jobs/:id', () => {
    it('should soft delete a job', async () => {
      const jobId = 'job-123';

      mockEmployerService.deleteJob.mockResolvedValue({
        message: 'Job deleted successfully',
      });

      const result = await controller.deleteJob(jobId, mockRequest);

      expect(result).toEqual({ message: 'Job deleted successfully' });
      expect(service.deleteJob).toHaveBeenCalledWith(
        jobId,
        mockRequest.user.companyId,
        mockRequest.user.id
      );
    });

    it('should throw ForbiddenException when not authorized', async () => {
      mockEmployerService.deleteJob.mockRejectedValue(
        new ForbiddenException('Not authorized to delete this job')
      );

      await expect(
        controller.deleteJob('job-123', mockRequest)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /api/v1/employer/jobs/:id/applicants', () => {
    it('should get applicants for a job', async () => {
      const jobId = 'job-123';
      const mockApplicants = {
        data: [
          {
            id: 'app-1',
            user_id: 'user-1',
            job_id: jobId,
            status: ApplicationStatus.APPLIED,
            applied_at: new Date('2024-01-15'),
            candidate: {
              name: 'John Doe',
              email: 'john@example.com',
              resume_url: 'https://resumes.com/john.pdf',
            },
            match_score: 85,
          },
          {
            id: 'app-2',
            user_id: 'user-2',
            job_id: jobId,
            status: ApplicationStatus.INTERVIEWING,
            applied_at: new Date('2024-01-14'),
            candidate: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              resume_url: 'https://resumes.com/jane.pdf',
            },
            match_score: 92,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1,
        },
      };

      mockEmployerService.getJobApplicants.mockResolvedValue(mockApplicants);

      const result = await controller.getJobApplicants(
        jobId,
        1,
        20,
        ApplicationStatus.APPLIED,
        mockRequest
      );

      expect(result).toEqual(mockApplicants);
      expect(service.getJobApplicants).toHaveBeenCalledWith(
        jobId,
        mockRequest.user.companyId,
        1,
        20,
        ApplicationStatus.APPLIED
      );
    });

    it('should filter applicants by status', async () => {
      const jobId = 'job-123';
      const status = ApplicationStatus.INTERVIEWING;

      mockEmployerService.getJobApplicants.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
      });

      await controller.getJobApplicants(jobId, 1, 20, status, mockRequest);

      expect(service.getJobApplicants).toHaveBeenCalledWith(
        jobId,
        mockRequest.user.companyId,
        1,
        20,
        status
      );
    });
  });

  describe('PUT /api/v1/employer/applications/:id/status', () => {
    it('should update application status to interviewing', async () => {
      const applicationId = 'app-123';
      const updateDto: UpdateApplicationStatusDto = {
        status: ApplicationStatus.INTERVIEWING,
        notes: 'Scheduled for technical interview',
      };

      const mockUpdatedApplication = {
        id: applicationId,
        status: ApplicationStatus.INTERVIEWING,
        notes: updateDto.notes,
        updated_at: new Date(),
      };

      mockEmployerService.updateApplicationStatus.mockResolvedValue(
        mockUpdatedApplication
      );

      const result = await controller.updateApplicationStatus(
        applicationId,
        updateDto,
        mockRequest
      );

      expect(result).toEqual(mockUpdatedApplication);
      expect(service.updateApplicationStatus).toHaveBeenCalledWith(
        applicationId,
        updateDto,
        mockRequest.user.companyId,
        mockRequest.user.id
      );
    });

    it('should update application status to offered', async () => {
      const applicationId = 'app-123';
      const updateDto: UpdateApplicationStatusDto = {
        status: ApplicationStatus.OFFERED,
        notes: 'Offer sent - $150k base',
      };

      mockEmployerService.updateApplicationStatus.mockResolvedValue({
        id: applicationId,
        status: ApplicationStatus.OFFERED,
        notes: updateDto.notes,
      });

      const result = await controller.updateApplicationStatus(
        applicationId,
        updateDto,
        mockRequest
      );

      expect(result.status).toBe(ApplicationStatus.OFFERED);
    });

    it('should update application status to rejected', async () => {
      const applicationId = 'app-123';
      const updateDto: UpdateApplicationStatusDto = {
        status: ApplicationStatus.REJECTED,
        notes: 'Not a good fit for the role',
      };

      mockEmployerService.updateApplicationStatus.mockResolvedValue({
        id: applicationId,
        status: ApplicationStatus.REJECTED,
        notes: updateDto.notes,
      });

      const result = await controller.updateApplicationStatus(
        applicationId,
        updateDto,
        mockRequest
      );

      expect(result.status).toBe(ApplicationStatus.REJECTED);
    });
  });

  describe('GET /api/v1/employer/candidates/search', () => {
    it('should search candidates with filters', async () => {
      const searchDto: SearchCandidatesDto = {
        skills: ['React', 'TypeScript'],
        experience_years_min: 3,
        location: 'San Francisco',
        page: 1,
        limit: 20,
      };

      const mockCandidates = {
        data: [
          {
            id: 'user-1',
            name: 'John Doe',
            title: 'Senior Frontend Developer',
            skills: ['React', 'TypeScript', 'JavaScript'],
            experience_years: 5,
            location: 'San Francisco, CA',
            match_score: 88,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
        },
      };

      mockEmployerService.searchCandidates.mockResolvedValue(mockCandidates);

      const result = await controller.searchCandidates(searchDto, mockRequest);

      expect(result).toEqual(mockCandidates);
      expect(service.searchCandidates).toHaveBeenCalledWith(
        searchDto,
        mockRequest.user.companyId
      );
    });

    it('should search candidates by skills only', async () => {
      const searchDto: SearchCandidatesDto = {
        skills: ['Python', 'Django'],
        page: 1,
        limit: 10,
      };

      mockEmployerService.searchCandidates.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
      });

      await controller.searchCandidates(searchDto, mockRequest);

      expect(service.searchCandidates).toHaveBeenCalledWith(
        searchDto,
        mockRequest.user.companyId
      );
    });
  });

  describe('GET /api/v1/employer/dashboard', () => {
    it('should get employer dashboard metrics', async () => {
      const mockDashboard = {
        activeJobs: 15,
        totalApplications: 234,
        newApplications: 12,
        interviewsScheduled: 8,
        offersExtended: 3,
        hiresMade: 2,
        averageTimeToHire: 21, // days
        topPerformingJobs: [
          {
            id: 'job-1',
            title: 'Senior Engineer',
            applications: 45,
            views: 230,
          },
        ],
        recentApplications: [
          {
            id: 'app-1',
            candidate: 'John Doe',
            job_title: 'Senior Engineer',
            applied_at: new Date('2024-01-15'),
            status: ApplicationStatus.APPLIED,
          },
        ],
        applicationsByStatus: {
          applied: 150,
          interviewing: 50,
          offered: 20,
          rejected: 10,
          hired: 4,
        },
      };

      mockEmployerService.getDashboardMetrics.mockResolvedValue(mockDashboard);

      const result = await controller.getDashboard(mockRequest);

      expect(result).toEqual(mockDashboard);
      expect(service.getDashboardMetrics).toHaveBeenCalledWith(
        mockRequest.user.companyId
      );
    });
  });

  describe('POST /api/v1/employer/team', () => {
    it('should add a team member', async () => {
      const addMemberDto: AddTeamMemberDto = {
        email: 'newrecruiter@company.com',
        role: 'recruiter',
        permissions: ['view_applicants', 'update_status'],
      };

      const mockTeamMember = {
        id: 'team-1',
        email: addMemberDto.email,
        role: addMemberDto.role,
        permissions: addMemberDto.permissions,
        invited_by: mockRequest.user.id,
        invited_at: new Date(),
        status: 'pending',
      };

      mockEmployerService.addTeamMember.mockResolvedValue(mockTeamMember);

      const result = await controller.addTeamMember(addMemberDto, mockRequest);

      expect(result).toEqual(mockTeamMember);
      expect(service.addTeamMember).toHaveBeenCalledWith(
        addMemberDto,
        mockRequest.user.companyId,
        mockRequest.user.id
      );
    });

    it('should validate email format', async () => {
      const invalidDto: AddTeamMemberDto = {
        email: 'invalid-email',
        role: 'recruiter',
        permissions: [],
      };

      mockEmployerService.addTeamMember.mockRejectedValue(
        new BadRequestException('Invalid email format')
      );

      await expect(
        controller.addTeamMember(invalidDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DELETE /api/v1/employer/team/:id', () => {
    it('should remove a team member', async () => {
      const teamMemberId = 'team-1';

      mockEmployerService.removeTeamMember.mockResolvedValue({
        message: 'Team member removed successfully',
      });

      const result = await controller.removeTeamMember(
        teamMemberId,
        mockRequest
      );

      expect(result).toEqual({ message: 'Team member removed successfully' });
      expect(service.removeTeamMember).toHaveBeenCalledWith(
        teamMemberId,
        mockRequest.user.companyId,
        mockRequest.user.id
      );
    });

    it('should not allow removing yourself', async () => {
      mockEmployerService.removeTeamMember.mockRejectedValue(
        new BadRequestException('Cannot remove yourself from the team')
      );

      await expect(
        controller.removeTeamMember('team-self', mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /api/v1/employer/jobs', () => {
    it('should get all employer jobs', async () => {
      const mockJobs = {
        data: [
          {
            id: 'job-1',
            title: 'Senior Engineer',
            status: 'active',
            applications_count: 25,
            views: 150,
            posted_at: new Date('2024-01-10'),
          },
          {
            id: 'job-2',
            title: 'Product Manager',
            status: 'active',
            applications_count: 18,
            views: 95,
            posted_at: new Date('2024-01-12'),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          total_pages: 1,
        },
      };

      mockEmployerService.getEmployerJobs.mockResolvedValue(mockJobs);

      const result = await controller.getEmployerJobs(1, 20, true, mockRequest);

      expect(result).toEqual(mockJobs);
      expect(service.getEmployerJobs).toHaveBeenCalledWith(
        mockRequest.user.companyId,
        1,
        20,
        true
      );
    });

    it('should get inactive jobs when requested', async () => {
      mockEmployerService.getEmployerJobs.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
      });

      await controller.getEmployerJobs(1, 20, false, mockRequest);

      expect(service.getEmployerJobs).toHaveBeenCalledWith(
        mockRequest.user.companyId,
        1,
        20,
        false
      );
    });
  });
});
