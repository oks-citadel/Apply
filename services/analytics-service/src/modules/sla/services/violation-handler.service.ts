import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SLAViolationType,
  RemedyType,
  RemedyStatus,
  SLA_TIER_CONFIGS,
} from '../enums/sla.enums';
import { SLAContract } from '../entities/sla-contract.entity';
import { SLAViolation } from '../entities/sla-violation.entity';
import { SLARemedy } from '../entities/sla-remedy.entity';

/**
 * Violation Handler Service
 * Handles SLA violations and remedies
 */
@Injectable()
export class ViolationHandlerService {
  private readonly logger = new Logger(ViolationHandlerService.name);

  constructor(
    @InjectRepository(SLAViolation)
    private readonly violationRepository: Repository<SLAViolation>,
    @InjectRepository(SLARemedy)
    private readonly remedyRepository: Repository<SLARemedy>,
  ) {}

  /**
   * Detect and create violation if contract terms not met
   */
  async detectViolation(contract: SLAContract): Promise<SLAViolation | null> {
    this.logger.log(`Checking for violations on contract ${contract.id}`);

    if (!contract.shouldCheckForViolation()) {
      return null;
    }

    // Check if violation already exists
    const existingViolation = await this.violationRepository.findOne({
      where: {
        contractId: contract.id,
        isResolved: false,
      },
    });

    if (existingViolation) {
      this.logger.log(
        `Violation already exists for contract ${contract.id}`,
      );
      return existingViolation;
    }

    // Create new violation
    const violation = await this.createViolation(contract);
    return violation;
  }

  /**
   * Create violation record
   */
  private async createViolation(
    contract: SLAContract,
  ): Promise<SLAViolation> {
    const now = new Date();
    const effectiveEndDate = contract.getEffectiveEndDate();
    const daysOverDeadline = Math.ceil(
      (now.getTime() - effectiveEndDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const interviewsShortfall =
      contract.guaranteedInterviews - contract.totalInterviewsScheduled;

    const responseRate =
      contract.totalApplicationsSent > 0
        ? (contract.totalEmployerResponses / contract.totalApplicationsSent) * 100
        : 0;

    const interviewRate =
      contract.totalApplicationsSent > 0
        ? (contract.totalInterviewsScheduled / contract.totalApplicationsSent) * 100
        : 0;

    const rootCauseFactors = this.analyzeRootCause(contract);

    const violation = this.violationRepository.create({
      contractId: contract.id,
      userId: contract.userId,
      violationType: SLAViolationType.INTERVIEW_GUARANTEE_NOT_MET,
      detectedAt: now,
      guaranteedInterviews: contract.guaranteedInterviews,
      actualInterviews: contract.totalInterviewsScheduled,
      interviewsShortfall,
      daysOverDeadline: Math.max(0, daysOverDeadline),
      totalApplicationsSent: contract.totalApplicationsSent,
      totalEmployerResponses: contract.totalEmployerResponses,
      responseRate,
      interviewRate,
      rootCauseFactors,
      analysisNotes: this.generateAnalysisNotes(contract, rootCauseFactors),
    });

    const savedViolation = await this.violationRepository.save(violation);
    this.logger.log(`Created violation ${savedViolation.id} for contract ${contract.id}`);

    // Automatically issue remedies
    await this.issueRemedies(savedViolation, contract);

    return savedViolation;
  }

  /**
   * Analyze root cause of violation
   */
  private analyzeRootCause(contract: SLAContract): any {
    const factors: any = {};

    // Low application volume
    const expectedApplications = contract.deadlineDays * 2; // Expected ~2 apps per day
    if (contract.totalApplicationsSent < expectedApplications * 0.5) {
      factors.lowApplicationVolume = true;
    }

    // Low response rate
    const responseRate =
      contract.totalApplicationsSent > 0
        ? (contract.totalEmployerResponses / contract.totalApplicationsSent) * 100
        : 0;
    if (responseRate < 10) {
      factors.lowResponseRate = true;
    }

    // Profile issues
    if (!contract.isEligible) {
      factors.profileIssues = contract.eligibilityCheckResult?.failedFields || [];
    }

    // User inactivity
    const daysSinceStart = Math.ceil(
      (new Date().getTime() - contract.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const applicationsPerDay =
      daysSinceStart > 0 ? contract.totalApplicationsSent / daysSinceStart : 0;
    if (applicationsPerDay < 1) {
      factors.userInactivity = true;
    }

    return factors;
  }

  /**
   * Generate analysis notes
   */
  private generateAnalysisNotes(contract: SLAContract, rootCause: any): string {
    const notes: string[] = [];

    notes.push(
      `Contract ${contract.id} violated: ${contract.totalInterviewsScheduled}/${contract.guaranteedInterviews} interviews`,
    );

    if (rootCause.lowApplicationVolume) {
      notes.push(
        `Low application volume: ${contract.totalApplicationsSent} applications sent`,
      );
    }

    if (rootCause.lowResponseRate) {
      const rate =
        contract.totalApplicationsSent > 0
          ? (contract.totalEmployerResponses / contract.totalApplicationsSent) * 100
          : 0;
      notes.push(`Low response rate: ${rate.toFixed(2)}%`);
    }

    if (rootCause.profileIssues?.length > 0) {
      notes.push(`Profile issues: ${rootCause.profileIssues.join(', ')}`);
    }

    if (rootCause.userInactivity) {
      notes.push('User inactivity detected');
    }

    return notes.join(' | ');
  }

  /**
   * Issue remedies for violation
   */
  async issueRemedies(
    violation: SLAViolation,
    contract: SLAContract,
  ): Promise<SLARemedy[]> {
    const recommendedRemedies = violation.getRecommendedRemedies();
    const remedies: SLARemedy[] = [];

    for (const remedyType of recommendedRemedies) {
      try {
        const remedy = await this.createRemedy(
          violation,
          contract,
          remedyType as RemedyType,
        );
        remedies.push(remedy);
      } catch (error) {
        this.logger.error(
          `Failed to create remedy ${remedyType} for violation ${violation.id}:`,
          error.stack,
        );
      }
    }

    return remedies;
  }

  /**
   * Create individual remedy
   */
  private async createRemedy(
    violation: SLAViolation,
    contract: SLAContract,
    remedyType: RemedyType,
  ): Promise<SLARemedy> {
    const tierConfig = SLA_TIER_CONFIGS[contract.tier];
    const remedyDetails = this.calculateRemedyDetails(
      remedyType,
      violation,
      contract,
      tierConfig,
    );

    const remedy = this.remedyRepository.create({
      violationId: violation.id,
      userId: contract.userId,
      contractId: contract.id,
      remedyType,
      status: RemedyStatus.PENDING,
      description: this.getRemedyDescription(remedyType, remedyDetails),
      remedyDetails,
      issuedAt: new Date(),
      issuedBy: 'system',
      requiresApproval: this.requiresApproval(remedyType, remedyDetails),
      financialImpact: remedyDetails.financialImpact || 0,
    });

    const savedRemedy = await this.remedyRepository.save(remedy);
    this.logger.log(
      `Created remedy ${savedRemedy.id} type ${remedyType} for violation ${violation.id}`,
    );

    // Auto-execute if no approval required
    if (!savedRemedy.requiresApproval) {
      await this.executeRemedy(savedRemedy, contract);
    }

    return savedRemedy;
  }

  /**
   * Calculate remedy details based on type
   */
  private calculateRemedyDetails(
    remedyType: RemedyType,
    violation: SLAViolation,
    contract: SLAContract,
    tierConfig: any,
  ): any {
    const details: any = {};

    switch (remedyType) {
      case RemedyType.SERVICE_EXTENSION:
        // Extend by 50% of original deadline or 30 days max
        const extensionDays = Math.min(
          Math.ceil(contract.deadlineDays * 0.5),
          30,
        );
        details.extensionDays = extensionDays;
        details.newEndDate = new Date(
          contract.getEffectiveEndDate().getTime() +
            extensionDays * 24 * 60 * 60 * 1000,
        );
        details.financialImpact = 0;
        break;

      case RemedyType.HUMAN_RECRUITER_ESCALATION:
        details.escalationLevel = violation.getSeverity();
        details.ticketId = `TICKET-${Date.now()}`;
        details.meetingScheduled = false;
        details.financialImpact = 0;
        break;

      case RemedyType.SERVICE_CREDIT:
        // 25% of contract price as credit
        const creditAmount = contract.contractPrice * 0.25;
        details.creditAmount = creditAmount;
        details.creditCurrency = 'USD';
        details.creditCode = `CREDIT-${Date.now()}`;
        details.creditExpiryDate = new Date(
          Date.now() + 90 * 24 * 60 * 60 * 1000,
        ); // 90 days
        details.financialImpact = creditAmount;
        break;

      case RemedyType.PARTIAL_REFUND:
        // Refund based on shortfall percentage
        const refundPercentage = Math.min(
          (violation.interviewsShortfall / violation.guaranteedInterviews) * 100,
          50,
        ); // Max 50%
        const refundAmount = (contract.contractPrice * refundPercentage) / 100;
        details.refundAmount = refundAmount;
        details.refundCurrency = 'USD';
        details.refundPercentage = refundPercentage;
        details.financialImpact = refundAmount;
        break;

      case RemedyType.FULL_REFUND:
        details.refundAmount = contract.contractPrice;
        details.refundCurrency = 'USD';
        details.refundPercentage = 100;
        details.financialImpact = contract.contractPrice;
        break;
    }

    return details;
  }

  /**
   * Get remedy description
   */
  private getRemedyDescription(remedyType: RemedyType, details: any): string {
    switch (remedyType) {
      case RemedyType.SERVICE_EXTENSION:
        return `Service extended by ${details.extensionDays} days until ${details.newEndDate.toISOString().split('T')[0]}`;

      case RemedyType.HUMAN_RECRUITER_ESCALATION:
        return `Case escalated to human recruiter with ${details.escalationLevel} priority`;

      case RemedyType.SERVICE_CREDIT:
        return `Service credit of $${details.creditAmount.toFixed(2)} issued (expires ${details.creditExpiryDate.toISOString().split('T')[0]})`;

      case RemedyType.PARTIAL_REFUND:
        return `Partial refund of ${details.refundPercentage.toFixed(0)}% ($${details.refundAmount.toFixed(2)})`;

      case RemedyType.FULL_REFUND:
        return `Full refund of $${details.refundAmount.toFixed(2)}`;

      default:
        return `Remedy type: ${remedyType}`;
    }
  }

  /**
   * Check if remedy requires approval
   */
  private requiresApproval(remedyType: RemedyType, details: any): boolean {
    // Refunds require approval
    if (
      remedyType === RemedyType.PARTIAL_REFUND ||
      remedyType === RemedyType.FULL_REFUND
    ) {
      return true;
    }

    // High-value credits require approval
    if (
      remedyType === RemedyType.SERVICE_CREDIT &&
      details.creditAmount > 50
    ) {
      return true;
    }

    return false;
  }

  /**
   * Execute remedy
   */
  async executeRemedy(
    remedy: SLARemedy,
    contract: SLAContract,
  ): Promise<boolean> {
    if (!remedy.canExecute()) {
      this.logger.warn(
        `Remedy ${remedy.id} cannot be executed. Status: ${remedy.status}, Requires approval: ${remedy.requiresApproval}`,
      );
      return false;
    }

    this.logger.log(`Executing remedy ${remedy.id} type ${remedy.remedyType}`);

    try {
      remedy.status = RemedyStatus.IN_PROGRESS;
      remedy.executedAt = new Date();
      remedy.executedBy = 'system';
      await this.remedyRepository.save(remedy);

      let success = false;

      switch (remedy.remedyType) {
        case RemedyType.SERVICE_EXTENSION:
          success = await this.executeServiceExtension(remedy, contract);
          break;

        case RemedyType.HUMAN_RECRUITER_ESCALATION:
          success = await this.executeEscalation(remedy, contract);
          break;

        case RemedyType.SERVICE_CREDIT:
          success = await this.executeServiceCredit(remedy, contract);
          break;

        case RemedyType.PARTIAL_REFUND:
        case RemedyType.FULL_REFUND:
          success = await this.executeRefund(remedy, contract);
          break;
      }

      if (success) {
        remedy.status = RemedyStatus.COMPLETED;
        remedy.completedAt = new Date();
        remedy.addExecutionLogEntry('execute', 'success', {
          completedAt: remedy.completedAt,
        });
      } else {
        remedy.status = RemedyStatus.FAILED;
        remedy.failedAt = new Date();
        remedy.failureReason = 'Execution failed';
        remedy.addExecutionLogEntry('execute', 'failed', {
          reason: remedy.failureReason,
        });
      }

      await this.remedyRepository.save(remedy);
      return success;
    } catch (error) {
      this.logger.error(
        `Error executing remedy ${remedy.id}:`,
        error.stack,
      );

      remedy.status = RemedyStatus.FAILED;
      remedy.failedAt = new Date();
      remedy.failureReason = error.message;
      remedy.addExecutionLogEntry('execute', 'error', {
        error: error.message,
      });
      await this.remedyRepository.save(remedy);

      return false;
    }
  }

  /**
   * Execute service extension
   */
  private async executeServiceExtension(
    remedy: SLARemedy,
    contract: SLAContract,
  ): Promise<boolean> {
    const { extensionDays, newEndDate } = remedy.remedyDetails;

    // This would update the contract in the database
    // For now, we'll just log it
    this.logger.log(
      `Extended contract ${contract.id} by ${extensionDays} days to ${newEndDate}`,
    );

    remedy.addExecutionLogEntry('extend_service', 'success', {
      extensionDays,
      newEndDate,
    });

    return true;
  }

  /**
   * Execute human recruiter escalation
   */
  private async executeEscalation(
    remedy: SLARemedy,
    contract: SLAContract,
  ): Promise<boolean> {
    const { escalationLevel, ticketId } = remedy.remedyDetails;

    // This would create a ticket in the support system
    // For now, we'll just log it
    this.logger.log(
      `Created escalation ticket ${ticketId} for contract ${contract.id} with ${escalationLevel} priority`,
    );

    remedy.addExecutionLogEntry('create_escalation', 'success', {
      ticketId,
      escalationLevel,
    });

    return true;
  }

  /**
   * Execute service credit
   */
  private async executeServiceCredit(
    remedy: SLARemedy,
    contract: SLAContract,
  ): Promise<boolean> {
    const { creditAmount, creditCode } = remedy.remedyDetails;

    // This would create a credit in the payment system
    // For now, we'll just log it
    this.logger.log(
      `Issued service credit ${creditCode} of $${creditAmount} for user ${contract.userId}`,
    );

    remedy.addExecutionLogEntry('issue_credit', 'success', {
      creditCode,
      creditAmount,
    });

    return true;
  }

  /**
   * Execute refund
   */
  private async executeRefund(
    remedy: SLARemedy,
    contract: SLAContract,
  ): Promise<boolean> {
    const { refundAmount, refundPercentage } = remedy.remedyDetails;

    // This would process refund via Stripe
    // For now, we'll just log it
    this.logger.log(
      `Processed ${refundPercentage}% refund of $${refundAmount} for contract ${contract.id}`,
    );

    remedy.addExecutionLogEntry('process_refund', 'success', {
      refundAmount,
      refundPercentage,
    });

    return true;
  }

  /**
   * Approve remedy
   */
  async approveRemedy(
    remedyId: string,
    approvedBy: string,
    notes?: string,
  ): Promise<SLARemedy> {
    const remedy = await this.remedyRepository.findOne({
      where: { id: remedyId },
    });

    if (!remedy) {
      throw new Error(`Remedy ${remedyId} not found`);
    }

    remedy.isApproved = true;
    remedy.approvedAt = new Date();
    remedy.approvedBy = approvedBy;
    if (notes) {
      remedy.approvalNotes = notes;
    }
    remedy.addExecutionLogEntry('approve', 'success', {
      approvedBy,
      notes,
    });

    return await this.remedyRepository.save(remedy);
  }

  /**
   * Get violations for contract
   */
  async getContractViolations(contractId: string): Promise<SLAViolation[]> {
    return await this.violationRepository.find({
      where: { contractId },
      order: { detectedAt: 'DESC' },
    });
  }

  /**
   * Get remedies for violation
   */
  async getViolationRemedies(violationId: string): Promise<SLARemedy[]> {
    return await this.remedyRepository.find({
      where: { violationId },
      order: { createdAt: 'DESC' },
    });
  }
}
