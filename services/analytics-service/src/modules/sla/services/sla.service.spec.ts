import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SLAService } from './sla.service';
import { EligibilityCheckerService } from './eligibility-checker.service';
import { ViolationHandlerService } from './violation-handler.service';
import { SLAContract } from '../entities/sla-contract.entity';
import { SLAProgress } from '../entities/sla-progress.entity';
import { SLAViolation } from '../entities/sla-violation.entity';
import { SLARemedy } from '../entities/sla-remedy.entity';
import { SLATier, SLAStatus, EligibilityStatus, ProgressEventType } from '../enums/sla.enums';

describe('SLAService', () => {
  let service: SLAService;
  let contractRepository: Repository<SLAContract>;
  let progressRepository: Repository<SLAProgress>;
  let violationRepository: Repository<SLAViolation>;
  let remedyRepository: Repository<SLARemedy>;
  let eligibilityChecker: EligibilityCheckerService;
  let violationHandler: ViolationHandlerService;

  const mockContractRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockProgressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockViolationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockRemedyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockEligibilityChecker = {
    checkEligibility: jest.fn(),
  };

  const mockViolationHandler = {
    detectViolation: jest.fn(),
    getContractViolations: jest.fn(),
    getViolationRemedies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SLAService,
        {
          provide: getRepositoryToken(SLAContract),
          useValue: mockContractRepository,
        },
        {
          provide: getRepositoryToken(SLAProgress),
          useValue: mockProgressRepository,
        },
        {
          provide: getRepositoryToken(SLAViolation),
          useValue: mockViolationRepository,
        },
        {
          provide: getRepositoryToken(SLARemedy),
          useValue: mockRemedyRepository,
        },
        {
          provide: EligibilityCheckerService,
          useValue: mockEligibilityChecker,
        },
        {
          provide: ViolationHandlerService,
          useValue: mockViolationHandler,
        },
      ],
    }).compile();

    service = module.get<SLAService>(SLAService);
    contractRepository = module.get<Repository<SLAContract>>(
      getRepositoryToken(SLAContract),
    );
    progressRepository = module.get<Repository<SLAProgress>>(
      getRepositoryToken(SLAProgress),
    );
    violationRepository = module.get<Repository<SLAViolation>>(
      getRepositoryToken(SLAViolation),
    );
    remedyRepository = module.get<Repository<SLARemedy>>(
      getRepositoryToken(SLARemedy),
    );
    eligibilityChecker = module.get<EligibilityCheckerService>(
      EligibilityCheckerService,
    );
    violationHandler = module.get<ViolationHandlerService>(
      ViolationHandlerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createContract', () => {
    it('should create a new SLA contract for eligible user', async () => {
      const userId = 'user-123';
      const tier = SLATier.PROFESSIONAL;

      const dto = {
        userId,
        tier,
        stripePaymentIntentId: 'pi_123',
      };

      const eligibilityResult = {
        userId,
        tier,
        status: EligibilityStatus.ELIGIBLE,
        isEligible: true,
        checkResult: {
          passedFields: ['basic_info', 'contact_info', 'work_experience', 'resume'],
          failedFields: [],
          profileCompleteness: 100,
          resumeScore: 80,
          workExperienceMonths: 24,
          hasApprovedResume: true,
          meetsMinimumRequirements: true,
          details: {},
        },
        recommendations: [],
        checkedAt: new Date(),
      };

      const savedContract = {
        id: 'contract-123',
        userId,
        tier,
        status: SLAStatus.ACTIVE,
        guaranteedInterviews: 3,
        deadlineDays: 60,
        minConfidenceThreshold: 0.65,
        contractPrice: 89.99,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isPaid: true,
        isEligible: true,
        totalApplicationsSent: 0,
        totalInterviewsScheduled: 0,
        getDaysRemaining: () => 60,
        getProgressPercentage: () => 0,
        isGuaranteeMet: () => false,
        isActive: () => true,
        isExpired: () => false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEligibilityChecker.checkEligibility.mockResolvedValue(eligibilityResult);
      mockContractRepository.findOne.mockResolvedValue(null);
      mockContractRepository.create.mockReturnValue(savedContract);
      mockContractRepository.save.mockResolvedValue(savedContract);
      mockViolationRepository.find.mockResolvedValue([]);

      const result = await service.createContract(dto);

      expect(result.success).toBe(true);
      expect(result.contract.userId).toBe(userId);
      expect(result.contract.tier).toBe(tier);
      expect(mockEligibilityChecker.checkEligibility).toHaveBeenCalledWith(userId, tier);
      expect(mockContractRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not eligible', async () => {
      const userId = 'user-123';
      const tier = SLATier.PREMIUM;

      const dto = {
        userId,
        tier,
      };

      const eligibilityResult = {
        userId,
        tier,
        status: EligibilityStatus.INELIGIBLE,
        isEligible: false,
        checkResult: {
          passedFields: ['basic_info'],
          failedFields: ['work_experience', 'education'],
          profileCompleteness: 30,
          resumeScore: 50,
          workExperienceMonths: 0,
          hasApprovedResume: false,
          meetsMinimumRequirements: false,
          details: {},
        },
        recommendations: ['Complete your profile', 'Upload resume'],
        checkedAt: new Date(),
      };

      mockEligibilityChecker.checkEligibility.mockResolvedValue(eligibilityResult);

      await expect(service.createContract(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user has existing active contract', async () => {
      const userId = 'user-123';
      const tier = SLATier.PROFESSIONAL;

      const dto = {
        userId,
        tier,
      };

      const eligibilityResult = {
        userId,
        tier,
        status: EligibilityStatus.ELIGIBLE,
        isEligible: true,
        checkResult: {
          passedFields: [],
          failedFields: [],
          profileCompleteness: 100,
          resumeScore: 80,
          workExperienceMonths: 24,
          hasApprovedResume: true,
          meetsMinimumRequirements: true,
          details: {},
        },
        recommendations: [],
        checkedAt: new Date(),
      };

      const existingContract = {
        id: 'existing-contract',
        userId,
        status: SLAStatus.ACTIVE,
      };

      mockEligibilityChecker.checkEligibility.mockResolvedValue(eligibilityResult);
      mockContractRepository.findOne.mockResolvedValue(existingContract);

      await expect(service.createContract(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatus', () => {
    it('should return SLA status for user with active contract', async () => {
      const userId = 'user-123';

      const contract = {
        id: 'contract-123',
        userId,
        tier: SLATier.PROFESSIONAL,
        status: SLAStatus.ACTIVE,
        guaranteedInterviews: 3,
        deadlineDays: 60,
        minConfidenceThreshold: 0.65,
        contractPrice: 89.99,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        totalApplicationsSent: 10,
        totalEmployerResponses: 3,
        totalInterviewsScheduled: 1,
        totalInterviewsCompleted: 0,
        totalOffersReceived: 0,
        isEligible: true,
        getDaysRemaining: () => 45,
        getProgressPercentage: () => 33.33,
        isGuaranteeMet: () => false,
        isActive: () => true,
        isExpired: () => false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContractRepository.findOne.mockResolvedValue(contract);
      mockViolationRepository.find.mockResolvedValue([]);

      const result = await service.getStatus(userId);

      expect(result.userId).toBe(userId);
      expect(result.totalApplicationsSent).toBe(10);
      expect(result.totalInterviewsScheduled).toBe(1);
      expect(result.progressPercentage).toBe(33.33);
    });

    it('should throw NotFoundException if no active contract found', async () => {
      const userId = 'user-123';

      mockContractRepository.findOne.mockResolvedValue(null);

      await expect(service.getStatus(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('trackApplication', () => {
    it('should track application and update contract counters', async () => {
      const dto = {
        userId: 'user-123',
        applicationId: 'app-123',
        jobId: 'job-123',
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        confidenceScore: 0.85,
      };

      const contract = {
        id: 'contract-123',
        userId: dto.userId,
        status: SLAStatus.ACTIVE,
        minConfidenceThreshold: 0.65,
        totalApplicationsSent: 5,
        totalInterviewsScheduled: 1,
        getProgressPercentage: () => 33.33,
      };

      const savedProgress = {
        id: 'progress-123',
        contractId: contract.id,
        userId: dto.userId,
        eventType: ProgressEventType.APPLICATION_SENT,
        applicationId: dto.applicationId,
        jobTitle: dto.jobTitle,
        companyName: dto.companyName,
        confidenceScore: dto.confidenceScore,
        meetsConfidenceThreshold: true,
        isVerified: true,
        createdAt: new Date(),
      };

      mockContractRepository.findOne.mockResolvedValue(contract);
      mockProgressRepository.create.mockReturnValue(savedProgress);
      mockProgressRepository.save.mockResolvedValue(savedProgress);
      mockContractRepository.save.mockResolvedValue({
        ...contract,
        totalApplicationsSent: 6,
      });

      const result = await service.trackApplication(dto);

      expect(result.success).toBe(true);
      expect(result.progressEvent.eventType).toBe(ProgressEventType.APPLICATION_SENT);
      expect(result.newMetrics.totalApplications).toBe(6);
      expect(mockContractRepository.save).toHaveBeenCalled();
    });

    it('should flag applications below confidence threshold', async () => {
      const dto = {
        userId: 'user-123',
        applicationId: 'app-123',
        jobId: 'job-123',
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        confidenceScore: 0.5, // Below threshold
      };

      const contract = {
        id: 'contract-123',
        userId: dto.userId,
        status: SLAStatus.ACTIVE,
        minConfidenceThreshold: 0.65,
        totalApplicationsSent: 0,
        totalInterviewsScheduled: 0,
        getProgressPercentage: () => 0,
      };

      const savedProgress = {
        id: 'progress-123',
        eventType: ProgressEventType.APPLICATION_SENT,
        confidenceScore: dto.confidenceScore,
        meetsConfidenceThreshold: false,
        createdAt: new Date(),
      };

      mockContractRepository.findOne.mockResolvedValue(contract);
      mockProgressRepository.create.mockReturnValue(savedProgress);
      mockProgressRepository.save.mockResolvedValue(savedProgress);
      mockContractRepository.save.mockResolvedValue({
        ...contract,
        totalApplicationsSent: 1,
      });

      const result = await service.trackApplication(dto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('below confidence threshold');
    });
  });

  describe('trackInterview', () => {
    it('should track interview and increment counter if meets threshold', async () => {
      const dto = {
        userId: 'user-123',
        applicationId: 'app-123',
        interviewScheduledAt: new Date().toISOString(),
        interviewType: 'video',
      };

      const contract = {
        id: 'contract-123',
        userId: dto.userId,
        status: SLAStatus.ACTIVE,
        totalApplicationsSent: 10,
        totalInterviewsScheduled: 2,
        getProgressPercentage: () => 66.67,
      };

      const application = {
        applicationId: dto.applicationId,
        jobId: 'job-123',
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        confidenceScore: 0.85,
        meetsConfidenceThreshold: true,
      };

      const savedProgress = {
        id: 'progress-123',
        eventType: ProgressEventType.INTERVIEW_SCHEDULED,
        applicationId: dto.applicationId,
        interviewScheduledAt: new Date(dto.interviewScheduledAt),
        isVerified: true,
        createdAt: new Date(),
      };

      mockContractRepository.findOne.mockResolvedValue(contract);
      mockProgressRepository.findOne.mockResolvedValue(application);
      mockProgressRepository.create.mockReturnValue(savedProgress);
      mockProgressRepository.save.mockResolvedValue(savedProgress);
      mockContractRepository.save.mockResolvedValue({
        ...contract,
        totalInterviewsScheduled: 3,
      });

      const result = await service.trackInterview(dto);

      expect(result.success).toBe(true);
      expect(result.newMetrics.totalInterviews).toBe(3);
      expect(result.message).toContain('counts toward guarantee');
    });
  });

  describe('getDashboard', () => {
    it('should return comprehensive dashboard data', async () => {
      const userId = 'user-123';

      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const contract = {
        id: 'contract-123',
        userId,
        tier: SLATier.PROFESSIONAL,
        status: SLAStatus.ACTIVE,
        guaranteedInterviews: 3,
        deadlineDays: 60,
        contractPrice: 89.99,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate,
        extendedEndDate: null,
        totalApplicationsSent: 50,
        totalEmployerResponses: 15,
        totalInterviewsScheduled: 2,
        totalInterviewsCompleted: 1,
        totalOffersReceived: 0,
        isEligible: true,
        getDaysRemaining: () => 30,
        getProgressPercentage: () => 66.67,
        getEffectiveEndDate: function() {
          return this.extendedEndDate || this.endDate;
        },
        isGuaranteeMet: () => false,
        isActive: () => true,
        isExpired: () => false,
        minConfidenceThreshold: 0.65,
        extensionDays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const recentProgress = [
        {
          id: 'progress-1',
          eventType: ProgressEventType.INTERVIEW_SCHEDULED,
          jobTitle: 'Software Engineer',
          companyName: 'Tech Corp',
          createdAt: new Date(),
          isVerified: true,
        },
      ];

      mockContractRepository.findOne.mockResolvedValue(contract);
      mockViolationRepository.find.mockResolvedValue([]);
      mockProgressRepository.find.mockResolvedValue(recentProgress);

      const result = await service.getDashboard(userId);

      expect(result.contract.userId).toBe(userId);
      expect(result.recentProgress).toHaveLength(1);
      expect(result.analytics).toBeDefined();
      expect(result.milestones).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.analytics.daysActive).toBeGreaterThan(0);
      expect(result.analytics.applicationsPerDay).toBeGreaterThan(0);
    });
  });

  describe('extendContract', () => {
    it('should extend contract deadline', async () => {
      const userId = 'user-123';
      const extensionDays = 14;

      const dto = {
        extensionDays,
        reason: 'SLA violation remedy',
      };

      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const contract = {
        id: 'contract-123',
        userId,
        tier: SLATier.PROFESSIONAL,
        status: SLAStatus.ACTIVE,
        guaranteedInterviews: 3,
        deadlineDays: 60,
        contractPrice: 89.99,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate,
        extensionDays: 0,
        extendedEndDate: null,
        metadata: {},
        totalApplicationsSent: 10,
        totalEmployerResponses: 3,
        totalInterviewsScheduled: 1,
        totalInterviewsCompleted: 0,
        totalOffersReceived: 0,
        isEligible: true,
        minConfidenceThreshold: 0.65,
        getEffectiveEndDate: function() {
          return this.extendedEndDate || this.endDate;
        },
        getDaysRemaining: () => 30,
        getProgressPercentage: () => 33.33,
        isGuaranteeMet: () => false,
        isActive: () => true,
        isExpired: () => false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContractRepository.findOne.mockResolvedValue(contract);
      mockContractRepository.save.mockResolvedValue({
        ...contract,
        extensionDays,
        extendedEndDate: new Date(
          contract.endDate.getTime() + extensionDays * 24 * 60 * 60 * 1000,
        ),
      });
      mockViolationRepository.find.mockResolvedValue([]);

      const result = await service.extendContract(userId, dto);

      expect(mockContractRepository.save).toHaveBeenCalled();
      expect(result.userId).toBe(userId);
    });
  });
});
