import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { EmployerService } from '../employer.service';
import { Job, RemoteType, EmploymentType, ExperienceLevel } from '../../jobs/entities/job.entity';
import { Company } from '../../companies/entities/company.entity';
import { Application, ApplicationStatus } from '../../applications/entities/application.entity';
import { TeamMember } from '../entities/team-member.entity';
import { CreateJobDto, UpdateJobDto } from '../dto/job.dto';
import { UpdateApplicationStatusDto } from '../dto/application.dto';
import { SearchCandidatesDto } from '../dto/candidate.dto';
import { AddTeamMemberDto } from '../dto/team.dto';

describe('EmployerService', () => {
  let service: EmployerService;
  let jobRepository: Repository<Job>;
  let companyRepository: Repository<Company>;
  let applicationRepository: Repository<Application>;
  let teamMemberRepository: Repository<TeamMember>;
  let httpService: HttpService;

  const mockJobRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCompanyRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockApplicationRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTeamMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AI_SERVICE_URL: 'http://ai-service:8000',
        USER_SERVICE_URL: 'http://user-service:3001',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployerService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepository,
        },
        {
          provide: getRepositoryToken(TeamMember),
          useValue: mockTeamMemberRepository,
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

    service = module.get<EmployerService>(EmployerService);
    jobRepository = module.get<Repository<Job>>(getRepositoryToken(Job));
    companyRepository = module.get<Repository<Company>>(getRepositoryToken(Company));
    applicationRepository = module.get<Repository<Application>>(getRepositoryToken(Application));
    teamMemberRepository = module.get<Repository<TeamMember>>(getRepositoryToken(TeamMember));
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompany', () => {
    it('should return company with active jobs count', async () => {
      const companyId = 'company-123';
      const userId = 'user-123';

      const mockCompany = {
        id: companyId,
        name: 'Tech Corp',
        description: 'Leading tech company',
        industry: 'Technology',
        is_verified: true,
        jobs: [],
      };

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany);

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      };

      mockJobRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getCompany(companyId, userId);

      expect(result).toEqual({ ...mockCompany, active_jobs_count: 10 });
      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { id: companyId },
      });
    });

    it('should throw NotFoundException when company not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(service.getCompany('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      const companyId = 'company-123';
      const userId = 'user-123';
      const updateDto = {
        name: 'Tech Corp Updated',
        description: 'New description',
        website: 'https://newtechcorp.com',
      };

      const mockCompany = {
        id: companyId,
        name: 'Tech Corp',
        created_by: userId,
      };

      const mockTeamMember = {
        user_id: userId,
        company_id: companyId,
        role: 'admin',
      };

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany);
      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);
      mockCompanyRepository.save.mockResolvedValue({ ...mockCompany, ...updateDto });

      const result = await service.updateCompany(companyId, updateDto, userId);

      expect(result).toEqual({ ...mockCompany, ...updateDto });
      expect(companyRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user not authorized', async () => {
      const companyId = 'company-123';
      const userId = 'unauthorized-user';

      mockCompanyRepository.findOne.mockResolvedValue({ id: companyId });
      mockTeamMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCompany(companyId, {}, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createJob', () => {
    it('should create a job posting successfully', async () => {
      const companyId = 'company-123';
      const userId = 'user-123';
      const createJobDto: CreateJobDto = {
        title: 'Senior Software Engineer',
        description: 'We are looking for...',
        requirements: ['5+ years experience'],
        skills: ['React', 'TypeScript'],
        location: 'San Francisco, CA',
        remote_type: RemoteType.HYBRID,
        employment_type: EmploymentType.FULL_TIME,
        experience_level: ExperienceLevel.SENIOR,
        salary_min: 120000,
        salary_max: 180000,
        salary_currency: 'USD',
        salary_period: 'yearly',
        benefits: ['Health insurance'],
        application_url: 'https://apply.com',
      };

      const mockCompany = { id: companyId, name: 'Tech Corp' };
      const mockTeamMember = { user_id: userId, company_id: companyId, role: 'admin' };

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany);
      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);

      const mockJob = {
        id: 'job-123',
        ...createJobDto,
        company_id: companyId,
        external_id: expect.any(String),
        source: 'direct',
        is_active: true,
        posted_at: expect.any(Date),
      };

      mockJobRepository.create.mockReturnValue(mockJob);
      mockJobRepository.save.mockResolvedValue(mockJob);

      const result = await service.createJob(createJobDto, companyId, userId);

      expect(result).toEqual(mockJob);
      expect(jobRepository.create).toHaveBeenCalled();
      expect(jobRepository.save).toHaveBeenCalled();
    });

    it('should validate company exists before creating job', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createJob({} as CreateJobDto, 'invalid-company', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should check user permissions before creating job', async () => {
      const companyId = 'company-123';
      const userId = 'unauthorized-user';

      mockCompanyRepository.findOne.mockResolvedValue({ id: companyId });
      mockTeamMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createJob({} as CreateJobDto, companyId, userId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateJob', () => {
    it('should update job successfully', async () => {
      const jobId = 'job-123';
      const companyId = 'company-123';
      const userId = 'user-123';
      const updateDto: UpdateJobDto = {
        title: 'Senior Engineer - Updated',
        salary_max: 200000,
      };

      const mockJob = {
        id: jobId,
        company_id: companyId,
        title: 'Senior Engineer',
        salary_max: 180000,
      };

      const mockTeamMember = { user_id: userId, company_id: companyId, role: 'admin' };

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);
      mockJobRepository.save.mockResolvedValue({ ...mockJob, ...updateDto });

      const result = await service.updateJob(jobId, updateDto, companyId, userId);

      expect(result).toEqual({ ...mockJob, ...updateDto });
      expect(jobRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateJob('invalid-job', {}, 'company-123', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when job belongs to different company', async () => {
      const mockJob = {
        id: 'job-123',
        company_id: 'other-company',
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);

      await expect(
        service.updateJob('job-123', {}, 'company-123', 'user-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteJob', () => {
    it('should soft delete job by setting is_active to false', async () => {
      const jobId = 'job-123';
      const companyId = 'company-123';
      const userId = 'user-123';

      const mockJob = {
        id: jobId,
        company_id: companyId,
        is_active: true,
      };

      const mockTeamMember = { user_id: userId, company_id: companyId };

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);
      mockJobRepository.save.mockResolvedValue({ ...mockJob, is_active: false });

      const result = await service.deleteJob(jobId, companyId, userId);

      expect(result).toEqual({ message: 'Job deleted successfully' });
      expect(jobRepository.save).toHaveBeenCalledWith({
        ...mockJob,
        is_active: false,
      });
    });

    it('should not allow deleting job from different company', async () => {
      const mockJob = {
        id: 'job-123',
        company_id: 'other-company',
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);

      await expect(
        service.deleteJob('job-123', 'company-123', 'user-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getJobApplicants', () => {
    it('should get paginated applicants for a job', async () => {
      const jobId = 'job-123';
      const companyId = 'company-123';

      const mockJob = {
        id: jobId,
        company_id: companyId,
      };

      const mockApplications = [
        {
          id: 'app-1',
          job_id: jobId,
          user_id: 'user-1',
          status: ApplicationStatus.APPLIED,
          applied_at: new Date('2024-01-15'),
          match_score: 85,
        },
        {
          id: 'app-2',
          job_id: jobId,
          user_id: 'user-2',
          status: ApplicationStatus.INTERVIEWING,
          applied_at: new Date('2024-01-14'),
          match_score: 92,
        },
      ];

      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockApplicationRepository.findAndCount.mockResolvedValue([mockApplications, 2]);

      // Mock user service call
      mockHttpService.post.mockReturnValue(
        of({
          data: {
            users: [
              { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
              { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
            ],
          },
        })
      );

      const result = await service.getJobApplicants(jobId, companyId, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(applicationRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter applicants by status', async () => {
      const jobId = 'job-123';
      const companyId = 'company-123';
      const status = ApplicationStatus.INTERVIEWING;

      mockJobRepository.findOne.mockResolvedValue({ id: jobId, company_id: companyId });
      mockApplicationRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getJobApplicants(jobId, companyId, 1, 20, status);

      expect(applicationRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            job_id: jobId,
            status,
          }),
        })
      );
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status to interviewing', async () => {
      const applicationId = 'app-123';
      const companyId = 'company-123';
      const userId = 'user-123';
      const updateDto: UpdateApplicationStatusDto = {
        status: ApplicationStatus.INTERVIEWING,
        notes: 'Scheduled for interview',
      };

      const mockApplication = {
        id: applicationId,
        job_id: 'job-123',
        user_id: 'candidate-123',
        status: ApplicationStatus.APPLIED,
      };

      const mockJob = {
        id: 'job-123',
        company_id: companyId,
      };

      mockApplicationRepository.findOne.mockResolvedValue(mockApplication);
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockApplicationRepository.save.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.INTERVIEWING,
        notes: updateDto.notes,
      });

      const result = await service.updateApplicationStatus(
        applicationId,
        updateDto,
        companyId,
        userId
      );

      expect(result.status).toBe(ApplicationStatus.INTERVIEWING);
      expect(applicationRepository.save).toHaveBeenCalled();
    });

    it('should update application status to offered', async () => {
      const applicationId = 'app-123';
      const updateDto: UpdateApplicationStatusDto = {
        status: ApplicationStatus.OFFERED,
        notes: 'Offer extended - $150k',
      };

      const mockApplication = {
        id: applicationId,
        job_id: 'job-123',
        status: ApplicationStatus.INTERVIEWING,
      };

      const mockJob = {
        id: 'job-123',
        company_id: 'company-123',
      };

      mockApplicationRepository.findOne.mockResolvedValue(mockApplication);
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockApplicationRepository.save.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.OFFERED,
        notes: updateDto.notes,
      });

      const result = await service.updateApplicationStatus(
        applicationId,
        updateDto,
        'company-123',
        'user-123'
      );

      expect(result.status).toBe(ApplicationStatus.OFFERED);
    });

    it('should update application status to rejected', async () => {
      const applicationId = 'app-123';
      const updateDto: UpdateApplicationStatusDto = {
        status: ApplicationStatus.REJECTED,
        notes: 'Not a good fit',
      };

      mockApplicationRepository.findOne.mockResolvedValue({
        id: applicationId,
        job_id: 'job-123',
      });
      mockJobRepository.findOne.mockResolvedValue({
        id: 'job-123',
        company_id: 'company-123',
      });
      mockApplicationRepository.save.mockResolvedValue({
        id: applicationId,
        status: ApplicationStatus.REJECTED,
        notes: updateDto.notes,
      });

      const result = await service.updateApplicationStatus(
        applicationId,
        updateDto,
        'company-123',
        'user-123'
      );

      expect(result.status).toBe(ApplicationStatus.REJECTED);
    });

    it('should throw NotFoundException when application not found', async () => {
      mockApplicationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateApplicationStatus(
          'invalid-app',
          { status: ApplicationStatus.INTERVIEWING },
          'company-123',
          'user-123'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchCandidates', () => {
    it('should search candidates with skill filters', async () => {
      const searchDto: SearchCandidatesDto = {
        skills: ['React', 'TypeScript'],
        experience_years_min: 3,
        page: 1,
        limit: 20,
      };

      const mockCandidatesResponse = {
        data: {
          candidates: [
            {
              id: 'user-1',
              name: 'John Doe',
              title: 'Senior Developer',
              skills: ['React', 'TypeScript', 'Node.js'],
              experience_years: 5,
            },
          ],
          total: 1,
        },
      };

      mockHttpService.post.mockReturnValue(of(mockCandidatesResponse));

      const result = await service.searchCandidates(searchDto, 'company-123');

      expect(result.data).toHaveLength(1);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/candidates/search'),
        expect.objectContaining({
          skills: searchDto.skills,
          experience_years_min: searchDto.experience_years_min,
        }),
        expect.any(Object)
      );
    });

    it('should handle empty search results', async () => {
      const searchDto: SearchCandidatesDto = {
        skills: ['Python'],
        page: 1,
        limit: 20,
      };

      mockHttpService.post.mockReturnValue(
        of({
          data: {
            candidates: [],
            total: 0,
          },
        })
      );

      const result = await service.searchCandidates(searchDto, 'company-123');

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard metrics', async () => {
      const companyId = 'company-123';

      // Mock active jobs count
      const jobQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(15),
      };
      mockJobRepository.createQueryBuilder.mockReturnValue(jobQueryBuilder);

      // Mock applications count
      mockApplicationRepository.count.mockResolvedValue(234);

      // Mock applications by status
      const appQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'applied', count: '150' },
          { status: 'interviewing', count: '50' },
          { status: 'offered', count: '20' },
        ]),
      };
      mockApplicationRepository.createQueryBuilder.mockReturnValue(appQueryBuilder);

      // Mock recent applications
      mockApplicationRepository.find.mockResolvedValue([
        {
          id: 'app-1',
          user_id: 'user-1',
          applied_at: new Date(),
          status: ApplicationStatus.APPLIED,
        },
      ]);

      const result = await service.getDashboardMetrics(companyId);

      expect(result).toHaveProperty('activeJobs');
      expect(result).toHaveProperty('totalApplications');
      expect(result).toHaveProperty('applicationsByStatus');
      expect(result.activeJobs).toBe(15);
      expect(result.totalApplications).toBe(234);
    });
  });

  describe('addTeamMember', () => {
    it('should add a team member successfully', async () => {
      const companyId = 'company-123';
      const userId = 'user-123';
      const addMemberDto: AddTeamMemberDto = {
        email: 'newrecruiter@company.com',
        role: 'recruiter',
        permissions: ['view_applicants', 'update_status'],
      };

      const mockTeamMember = {
        id: 'team-1',
        company_id: companyId,
        email: addMemberDto.email,
        role: addMemberDto.role,
        permissions: addMemberDto.permissions,
        invited_by: userId,
        status: 'pending',
      };

      mockTeamMemberRepository.create.mockReturnValue(mockTeamMember);
      mockTeamMemberRepository.save.mockResolvedValue(mockTeamMember);

      const result = await service.addTeamMember(addMemberDto, companyId, userId);

      expect(result).toEqual(mockTeamMember);
      expect(teamMemberRepository.save).toHaveBeenCalled();
    });

    it('should not allow duplicate team members', async () => {
      const addMemberDto: AddTeamMemberDto = {
        email: 'existing@company.com',
        role: 'recruiter',
        permissions: [],
      };

      mockTeamMemberRepository.findOne.mockResolvedValue({ email: addMemberDto.email });

      await expect(
        service.addTeamMember(addMemberDto, 'company-123', 'user-123')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a team member successfully', async () => {
      const teamMemberId = 'team-1';
      const companyId = 'company-123';
      const userId = 'user-123';

      const mockTeamMember = {
        id: teamMemberId,
        company_id: companyId,
        user_id: 'other-user',
      };

      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);
      mockTeamMemberRepository.remove.mockResolvedValue(mockTeamMember);

      const result = await service.removeTeamMember(teamMemberId, companyId, userId);

      expect(result).toEqual({ message: 'Team member removed successfully' });
      expect(teamMemberRepository.remove).toHaveBeenCalledWith(mockTeamMember);
    });

    it('should not allow removing yourself', async () => {
      const teamMemberId = 'team-1';
      const userId = 'user-123';

      const mockTeamMember = {
        id: teamMemberId,
        user_id: userId,
        company_id: 'company-123',
      };

      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);

      await expect(
        service.removeTeamMember(teamMemberId, 'company-123', userId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEmployerJobs', () => {
    it('should get paginated employer jobs', async () => {
      const companyId = 'company-123';
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Senior Engineer',
          is_active: true,
          application_count: 25,
          view_count: 150,
        },
        {
          id: 'job-2',
          title: 'Product Manager',
          is_active: true,
          application_count: 18,
          view_count: 95,
        },
      ];

      mockJobRepository.findAndCount.mockResolvedValue([mockJobs, 2]);

      const result = await service.getEmployerJobs(companyId, 1, 20, true);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(jobRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            company_id: companyId,
            is_active: true,
          }),
        })
      );
    });

    it('should get inactive jobs when requested', async () => {
      mockJobRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getEmployerJobs('company-123', 1, 20, false);

      expect(jobRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            is_active: false,
          }),
        })
      );
    });
  });
});
