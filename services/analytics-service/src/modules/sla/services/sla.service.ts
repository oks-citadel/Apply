import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SLAContract } from '../entities/sla-contract.entity';
import { SLAProgress } from '../entities/sla-progress.entity';
import { SLAViolation } from '../entities/sla-violation.entity';
import { SLARemedy } from '../entities/sla-remedy.entity';
import {
  SLATier,
  SLAStatus,
  ProgressEventType,
  SLA_TIER_CONFIGS,
} from '../enums/sla.enums';
import {
  CreateSLAContractDto,
  UpdateSLAContractDto,
  ExtendSLAContractDto,
  TrackApplicationDto,
  TrackResponseDto,
  TrackInterviewDto,
  VerifyProgressDto,
  BulkTrackProgressDto,
  SLAStatusResponseDto,
  SLADashboardResponseDto,
  TrackProgressResponseDto,
  BulkTrackResponseDto,
  CreateSLAResponseDto,
  ProgressEventSummaryDto,
  SLAAnalyticsDto,
  MilestoneDto,
} from '../dto';
import { EligibilityCheckerService } from './eligibility-checker.service';
import { ViolationHandlerService } from './violation-handler.service';

/**
 * SLA Service
 * Main service for managing SLA contracts and tracking progress
 */
@Injectable()
export class SLAService {
  private readonly logger = new Logger(SLAService.name);

  constructor(
    @InjectRepository(SLAContract)
    private readonly contractRepository: Repository<SLAContract>,
    @InjectRepository(SLAProgress)
    private readonly progressRepository: Repository<SLAProgress>,
    @InjectRepository(SLAViolation)
    private readonly violationRepository: Repository<SLAViolation>,
    @InjectRepository(SLARemedy)
    private readonly remedyRepository: Repository<SLARemedy>,
    private readonly eligibilityChecker: EligibilityCheckerService,
    private readonly violationHandler: ViolationHandlerService,
  ) {}

  /**
   * Create new SLA contract
   */
  async createContract(
    dto: CreateSLAContractDto,
  ): Promise<CreateSLAResponseDto> {
    this.logger.log(`Creating SLA contract for user ${dto.userId} tier ${dto.tier}`);

    try {
      // Check eligibility
      const eligibilityResult = await this.eligibilityChecker.checkEligibility(
        dto.userId,
        dto.tier,
      );

      if (!eligibilityResult.isEligible) {
        throw new BadRequestException({
          message: 'User does not meet eligibility requirements',
          recommendations: eligibilityResult.recommendations,
          checkResult: eligibilityResult.checkResult,
        });
      }

      // Check for existing active contract
      const existingContract = await this.contractRepository.findOne({
        where: {
          userId: dto.userId,
          status: SLAStatus.ACTIVE,
        },
      });

      if (existingContract) {
        throw new BadRequestException(
          'User already has an active SLA contract',
        );
      }

      // Get tier configuration
      const tierConfig = SLA_TIER_CONFIGS[dto.tier];

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + tierConfig.deadlineDays * 24 * 60 * 60 * 1000,
      );

      // Create contract
      const contract = this.contractRepository.create({
        userId: dto.userId,
        tier: dto.tier,
        status: SLAStatus.ACTIVE,
        guaranteedInterviews: tierConfig.guaranteedInterviews,
        deadlineDays: tierConfig.deadlineDays,
        minConfidenceThreshold: tierConfig.minConfidenceThreshold,
        contractPrice: tierConfig.price,
        startDate,
        endDate,
        stripePaymentIntentId: dto.stripePaymentIntentId,
        stripeSubscriptionId: dto.stripeSubscriptionId,
        isPaid: !!dto.stripePaymentIntentId,
        paidAt: dto.stripePaymentIntentId ? new Date() : null,
        isEligible: true,
        eligibilityCheckResult: eligibilityResult.checkResult as any,
        metadata: dto.metadata as any,
      });

      const savedContract = await this.contractRepository.save(contract);
      this.logger.log(`Created contract ${savedContract.id}`);

      const statusDto = await this.mapToStatusDto(savedContract);

      return {
        success: true,
        contract: statusDto,
        message: `SLA contract created successfully for ${tierConfig.name} tier`,
      };
    } catch (error) {
      this.logger.error(`Error creating contract:`, error.stack);
      throw error;
    }
  }

  /**
   * Get SLA status for user
   */
  async getStatus(userId: string): Promise<SLAStatusResponseDto> {
    const contract = await this.contractRepository.findOne({
      where: {
        userId,
        status: SLAStatus.ACTIVE,
      },
    });

    if (!contract) {
      throw new NotFoundException('No active SLA contract found for user');
    }

    return await this.mapToStatusDto(contract);
  }

  /**
   * Track application sent
   */
  async trackApplication(
    dto: TrackApplicationDto,
  ): Promise<TrackProgressResponseDto> {
    this.logger.log(`Tracking application ${dto.applicationId} for user ${dto.userId}`);

    const contract = await this.getActiveContract(dto.userId);

    // Check confidence threshold
    const meetsThreshold = dto.confidenceScore >= contract.minConfidenceThreshold;

    const progress = this.progressRepository.create({
      contractId: contract.id,
      userId: dto.userId,
      eventType: ProgressEventType.APPLICATION_SENT,
      applicationId: dto.applicationId,
      jobId: dto.jobId,
      jobTitle: dto.jobTitle,
      companyName: dto.companyName,
      confidenceScore: dto.confidenceScore,
      meetsConfidenceThreshold: meetsThreshold,
      source: dto.source || 'auto',
      isVerified: true, // Auto-verified for applications
      verifiedAt: new Date(),
      metadata: dto.metadata as any,
    });

    const savedProgress = await this.progressRepository.save(progress);

    // Update contract counters
    contract.totalApplicationsSent += 1;
    await this.contractRepository.save(contract);

    const progressSummary = this.mapToProgressSummary(savedProgress);
    const newMetrics = {
      totalApplications: contract.totalApplicationsSent,
      totalInterviews: contract.totalInterviewsScheduled,
      progressPercentage: contract.getProgressPercentage(),
    };

    return {
      success: true,
      progressEvent: progressSummary,
      contractUpdated: true,
      newMetrics,
      message: `Application tracked successfully ${meetsThreshold ? '' : '(below confidence threshold)'}`,
    };
  }

  /**
   * Track employer response
   */
  async trackResponse(
    dto: TrackResponseDto,
  ): Promise<TrackProgressResponseDto> {
    this.logger.log(`Tracking response for application ${dto.applicationId}`);

    const contract = await this.getActiveContract(dto.userId);

    const progress = this.progressRepository.create({
      contractId: contract.id,
      userId: dto.userId,
      eventType: ProgressEventType.EMPLOYER_RESPONSE,
      applicationId: dto.applicationId,
      responseType: dto.responseType,
      responseContent: dto.responseContent,
      source: dto.source || 'auto',
      sourceReference: dto.sourceReference,
      isVerified: true,
      verifiedAt: new Date(),
      metadata: dto.metadata as any,
    });

    const savedProgress = await this.progressRepository.save(progress);

    // Update contract counters
    contract.totalEmployerResponses += 1;
    await this.contractRepository.save(contract);

    const progressSummary = this.mapToProgressSummary(savedProgress);
    const newMetrics = {
      totalApplications: contract.totalApplicationsSent,
      totalInterviews: contract.totalInterviewsScheduled,
      progressPercentage: contract.getProgressPercentage(),
    };

    return {
      success: true,
      progressEvent: progressSummary,
      contractUpdated: true,
      newMetrics,
      message: 'Employer response tracked successfully',
    };
  }

  /**
   * Track interview invitation
   */
  async trackInterview(
    dto: TrackInterviewDto,
  ): Promise<TrackProgressResponseDto> {
    this.logger.log(`Tracking interview for application ${dto.applicationId}`);

    const contract = await this.getActiveContract(dto.userId);

    // Get application details
    const application = await this.progressRepository.findOne({
      where: {
        applicationId: dto.applicationId,
        eventType: ProgressEventType.APPLICATION_SENT,
      },
    });

    const meetsThreshold = application
      ? application.meetsConfidenceThreshold
      : true;

    const progress = this.progressRepository.create({
      contractId: contract.id,
      userId: dto.userId,
      eventType: ProgressEventType.INTERVIEW_SCHEDULED,
      applicationId: dto.applicationId,
      jobId: application?.jobId,
      jobTitle: application?.jobTitle,
      companyName: application?.companyName,
      confidenceScore: application?.confidenceScore,
      meetsConfidenceThreshold: meetsThreshold,
      interviewScheduledAt: new Date(dto.interviewScheduledAt),
      interviewType: dto.interviewType,
      interviewLocation: dto.interviewLocation,
      source: dto.source || 'auto',
      sourceReference: dto.sourceReference,
      isVerified: true,
      verifiedAt: new Date(),
      metadata: dto.metadata as any,
    });

    const savedProgress = await this.progressRepository.save(progress);

    // Update contract counters (only if meets threshold)
    if (meetsThreshold) {
      contract.totalInterviewsScheduled += 1;
    }
    await this.contractRepository.save(contract);

    const progressSummary = this.mapToProgressSummary(savedProgress);
    const newMetrics = {
      totalApplications: contract.totalApplicationsSent,
      totalInterviews: contract.totalInterviewsScheduled,
      progressPercentage: contract.getProgressPercentage(),
    };

    return {
      success: true,
      progressEvent: progressSummary,
      contractUpdated: true,
      newMetrics,
      message: `Interview tracked successfully ${meetsThreshold ? '(counts toward guarantee)' : '(below confidence threshold)'}`,
    };
  }

  /**
   * Verify progress event
   */
  async verifyProgress(dto: VerifyProgressDto): Promise<ProgressEventSummaryDto> {
    const progress = await this.progressRepository.findOne({
      where: { id: dto.progressId },
    });

    if (!progress) {
      throw new NotFoundException('Progress event not found');
    }

    progress.isVerified = dto.isVerified;
    progress.verifiedAt = new Date();
    progress.verifiedBy = dto.verifiedBy;

    if (dto.notes && progress.metadata) {
      progress.metadata.notes = dto.notes;
    }

    const savedProgress = await this.progressRepository.save(progress);

    // Update contract counters if verification changed for interview
    if (progress.isInterviewEvent()) {
      const contract = await this.contractRepository.findOne({
        where: { id: progress.contractId },
      });

      if (contract) {
        const count = await this.progressRepository.count({
          where: {
            contractId: contract.id,
            eventType: ProgressEventType.INTERVIEW_SCHEDULED,
            isVerified: true,
            meetsConfidenceThreshold: true,
          },
        });

        contract.totalInterviewsScheduled = count;
        await this.contractRepository.save(contract);
      }
    }

    return this.mapToProgressSummary(savedProgress);
  }

  /**
   * Bulk track progress events
   */
  async bulkTrackProgress(
    dto: BulkTrackProgressDto,
  ): Promise<BulkTrackResponseDto> {
    const results = {
      applications: [],
      responses: [],
      interviews: [],
    };
    const errors = [];
    let processed = 0;
    let failed = 0;

    // Track applications
    if (dto.applications) {
      for (const app of dto.applications) {
        try {
          const result = await this.trackApplication(app);
          results.applications.push(result);
          processed++;
        } catch (error) {
          errors.push({ type: 'application', data: app, error: error.message });
          failed++;
        }
      }
    }

    // Track responses
    if (dto.responses) {
      for (const response of dto.responses) {
        try {
          const result = await this.trackResponse(response);
          results.responses.push(result);
          processed++;
        } catch (error) {
          errors.push({ type: 'response', data: response, error: error.message });
          failed++;
        }
      }
    }

    // Track interviews
    if (dto.interviews) {
      for (const interview of dto.interviews) {
        try {
          const result = await this.trackInterview(interview);
          results.interviews.push(result);
          processed++;
        } catch (error) {
          errors.push({ type: 'interview', data: interview, error: error.message });
          failed++;
        }
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      results,
      errors,
    };
  }

  /**
   * Get SLA dashboard data
   */
  async getDashboard(userId: string): Promise<SLADashboardResponseDto> {
    const contract = await this.getActiveContract(userId);
    const statusDto = await this.mapToStatusDto(contract);

    // Get recent progress
    const recentProgress = await this.progressRepository.find({
      where: { contractId: contract.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const recentProgressDto = recentProgress.map((p) =>
      this.mapToProgressSummary(p),
    );

    // Calculate analytics
    const analytics = await this.calculateAnalytics(contract);

    // Generate milestones
    const milestones = this.generateMilestones(contract);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(contract, analytics);

    return {
      contract: statusDto,
      recentProgress: recentProgressDto,
      analytics,
      milestones,
      recommendations,
    };
  }

  /**
   * Extend SLA contract
   */
  async extendContract(
    userId: string,
    dto: ExtendSLAContractDto,
  ): Promise<SLAStatusResponseDto> {
    const contract = await this.getActiveContract(userId);

    const currentEndDate = contract.getEffectiveEndDate();
    const newEndDate = new Date(
      currentEndDate.getTime() + dto.extensionDays * 24 * 60 * 60 * 1000,
    );

    contract.extensionDays += dto.extensionDays;
    contract.extendedEndDate = newEndDate;

    if (dto.reason && contract.metadata) {
      if (!contract.metadata.notes) {
        contract.metadata.notes = '';
      }
      contract.metadata.notes += `\nExtended ${dto.extensionDays} days: ${dto.reason}`;
    }

    const savedContract = await this.contractRepository.save(contract);
    return await this.mapToStatusDto(savedContract);
  }

  /**
   * Cron job to check for SLA violations daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkViolations() {
    this.logger.log('Running daily SLA violation check');

    const expiredContracts = await this.contractRepository.find({
      where: {
        status: SLAStatus.ACTIVE,
        endDate: LessThan(new Date()),
      },
    });

    for (const contract of expiredContracts) {
      if (contract.shouldCheckForViolation()) {
        try {
          await this.violationHandler.detectViolation(contract);
        } catch (error) {
          this.logger.error(
            `Error checking violation for contract ${contract.id}:`,
            error.stack,
          );
        }
      }
    }

    this.logger.log(`Checked ${expiredContracts.length} contracts for violations`);
  }

  /**
   * Helper: Get active contract for user
   */
  private async getActiveContract(userId: string): Promise<SLAContract> {
    const contract = await this.contractRepository.findOne({
      where: {
        userId,
        status: SLAStatus.ACTIVE,
      },
    });

    if (!contract) {
      throw new NotFoundException('No active SLA contract found for user');
    }

    return contract;
  }

  /**
   * Helper: Map contract to status DTO
   */
  private async mapToStatusDto(
    contract: SLAContract,
  ): Promise<SLAStatusResponseDto> {
    const violations = await this.violationRepository.find({
      where: { contractId: contract.id },
      order: { detectedAt: 'DESC' },
    });

    const activeViolation = violations.find((v) => !v.isResolved);

    const responseRate =
      contract.totalApplicationsSent > 0
        ? (contract.totalEmployerResponses / contract.totalApplicationsSent) * 100
        : 0;

    const interviewRate =
      contract.totalApplicationsSent > 0
        ? (contract.totalInterviewsScheduled / contract.totalApplicationsSent) * 100
        : 0;

    return {
      id: contract.id,
      userId: contract.userId,
      tier: contract.tier,
      status: contract.status,
      guaranteedInterviews: contract.guaranteedInterviews,
      deadlineDays: contract.deadlineDays,
      minConfidenceThreshold: contract.minConfidenceThreshold,
      contractPrice: contract.contractPrice,
      startDate: contract.startDate,
      endDate: contract.endDate,
      extendedEndDate: contract.extendedEndDate,
      daysRemaining: contract.getDaysRemaining(),
      totalApplicationsSent: contract.totalApplicationsSent,
      totalEmployerResponses: contract.totalEmployerResponses,
      totalInterviewsScheduled: contract.totalInterviewsScheduled,
      totalInterviewsCompleted: contract.totalInterviewsCompleted,
      totalOffersReceived: contract.totalOffersReceived,
      progressPercentage: contract.getProgressPercentage(),
      responseRate,
      interviewRate,
      isGuaranteeMet: contract.isGuaranteeMet(),
      isActive: contract.isActive(),
      isExpired: contract.isExpired(),
      isEligible: contract.isEligible,
      eligibilityDetails: contract.eligibilityCheckResult as any,
      hasViolations: violations.length > 0,
      violationCount: violations.length,
      activeViolation: activeViolation
        ? {
            id: activeViolation.id,
            violationType: activeViolation.violationType,
            detectedAt: activeViolation.detectedAt,
            guaranteedInterviews: activeViolation.guaranteedInterviews,
            actualInterviews: activeViolation.actualInterviews,
            interviewsShortfall: activeViolation.interviewsShortfall,
            daysOverDeadline: activeViolation.daysOverDeadline,
            severity: activeViolation.getSeverity(),
            isResolved: activeViolation.isResolved,
            remediesIssued: 0, // Would need to query remedies
          }
        : undefined,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    };
  }

  /**
   * Helper: Map progress to summary DTO
   */
  private mapToProgressSummary(
    progress: SLAProgress,
  ): ProgressEventSummaryDto {
    return {
      id: progress.id,
      eventType: progress.eventType,
      jobTitle: progress.jobTitle,
      companyName: progress.companyName,
      confidenceScore: progress.confidenceScore,
      interviewScheduledAt: progress.interviewScheduledAt,
      createdAt: progress.createdAt,
      isVerified: progress.isVerified,
    };
  }

  /**
   * Helper: Calculate analytics
   */
  private async calculateAnalytics(
    contract: SLAContract,
  ): Promise<SLAAnalyticsDto> {
    const now = new Date();
    const daysActive = Math.ceil(
      (now.getTime() - contract.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysRemaining = contract.getDaysRemaining();
    const totalDays = contract.deadlineDays + contract.extensionDays;
    const timeUtilization = ((totalDays - daysRemaining) / totalDays) * 100;

    const applicationsPerDay =
      daysActive > 0 ? contract.totalApplicationsSent / daysActive : 0;

    const responseRate =
      contract.totalApplicationsSent > 0
        ? (contract.totalEmployerResponses / contract.totalApplicationsSent) * 100
        : 0;

    const interviewRate =
      contract.totalApplicationsSent > 0
        ? (contract.totalInterviewsScheduled / contract.totalApplicationsSent) * 100
        : 0;

    const interviewsRemaining = Math.max(
      0,
      contract.guaranteedInterviews - contract.totalInterviewsScheduled,
    );

    const projectedInterviews =
      daysActive > 0
        ? Math.round(
            (contract.totalInterviewsScheduled / daysActive) * totalDays,
          )
        : 0;

    const onTrackToMeetGuarantee =
      projectedInterviews >= contract.guaranteedInterviews ||
      contract.isGuaranteeMet();

    // For trends, we'd query weekly aggregates
    // For now, return empty arrays
    const weeklyApplicationTrend: number[] = [];
    const weeklyResponseTrend: number[] = [];
    const weeklyInterviewTrend: number[] = [];

    return {
      daysActive,
      daysRemaining,
      timeUtilization,
      applicationsPerDay,
      totalApplications: contract.totalApplicationsSent,
      qualifyingApplications: contract.totalApplicationsSent,
      responseRate,
      avgResponseTime: 0, // Would need to calculate from progress events
      positiveResponses: contract.totalInterviewsScheduled,
      negativeResponses: contract.totalEmployerResponses - contract.totalInterviewsScheduled,
      interviewRate,
      interviewsRemaining,
      projectedInterviews,
      onTrackToMeetGuarantee,
      weeklyApplicationTrend,
      weeklyResponseTrend,
      weeklyInterviewTrend,
    };
  }

  /**
   * Helper: Generate milestones
   */
  private generateMilestones(contract: SLAContract): MilestoneDto[] {
    const milestones: MilestoneDto[] = [];

    // Application milestones
    const targetApplications = contract.deadlineDays * 2;
    milestones.push({
      id: 'applications',
      title: 'Applications Sent',
      description: `Send at least ${targetApplications} applications`,
      target: targetApplications,
      current: contract.totalApplicationsSent,
      isCompleted: contract.totalApplicationsSent >= targetApplications,
      completedAt:
        contract.totalApplicationsSent >= targetApplications
          ? new Date()
          : undefined,
    });

    // Interview milestone (the main guarantee)
    milestones.push({
      id: 'interviews',
      title: 'Interview Guarantee',
      description: `Secure ${contract.guaranteedInterviews} interviews`,
      target: contract.guaranteedInterviews,
      current: contract.totalInterviewsScheduled,
      isCompleted: contract.isGuaranteeMet(),
      completedAt: contract.isGuaranteeMet() ? new Date() : undefined,
      dueDate: contract.getEffectiveEndDate(),
    });

    return milestones;
  }

  /**
   * Helper: Generate recommendations
   */
  private async generateRecommendations(
    contract: SLAContract,
    analytics: SLAAnalyticsDto,
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Application volume
    if (analytics.applicationsPerDay < 2) {
      recommendations.push(
        'Increase application volume to at least 2 applications per day',
      );
    }

    // Response rate
    if (analytics.responseRate < 10 && contract.totalApplicationsSent > 10) {
      recommendations.push(
        'Low response rate detected. Consider optimizing your resume and application materials',
      );
    }

    // On track check
    if (!analytics.onTrackToMeetGuarantee && analytics.daysRemaining > 7) {
      recommendations.push(
        'You are not on track to meet your interview guarantee. Increase application volume',
      );
    }

    // Time urgency
    if (
      analytics.daysRemaining < 14 &&
      !contract.isGuaranteeMet()
    ) {
      const needed = contract.guaranteedInterviews - contract.totalInterviewsScheduled;
      recommendations.push(
        `Only ${analytics.daysRemaining} days remaining. You need ${needed} more interviews`,
      );
    }

    // Success message
    if (contract.isGuaranteeMet()) {
      recommendations.push(
        'Congratulations! You have met your interview guarantee',
      );
    }

    return recommendations;
  }
}
