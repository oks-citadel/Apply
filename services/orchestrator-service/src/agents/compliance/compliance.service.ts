import { Injectable, Logger } from '@nestjs/common';

import {
  ComplianceAction,
  Platform,
  WarningSeverity,
  ComplianceCheckRequestDto,
  ComplianceCheckResponseDto,
  ComplianceWarningDto
} from './dto/compliance.dto';

import { AuditLogService } from './services/audit-log.service';
import { RateLimiterService } from './services/rate-limiter.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  // Platform-specific ToS considerations
  private readonly platformRestrictions: Record<
    Platform,
    { maxApplicationsPerDay: number; cooldownMinutes: number; warnings: string[] }
  > = {
    [Platform.LINKEDIN]: {
      maxApplicationsPerDay: 25,
      cooldownMinutes: 2,
      warnings: [
        'LinkedIn monitors automated activity',
        'Excessive applications may trigger account review',
      ],
    },
    [Platform.INDEED]: {
      maxApplicationsPerDay: 50,
      cooldownMinutes: 1,
      warnings: [],
    },
    [Platform.GLASSDOOR]: {
      maxApplicationsPerDay: 20,
      cooldownMinutes: 3,
      warnings: ['Glassdoor requires logged-in sessions'],
    },
    [Platform.GREENHOUSE]: {
      maxApplicationsPerDay: 100,
      cooldownMinutes: 0,
      warnings: [],
    },
    [Platform.LEVER]: {
      maxApplicationsPerDay: 100,
      cooldownMinutes: 0,
      warnings: [],
    },
    [Platform.WORKDAY]: {
      maxApplicationsPerDay: 15,
      cooldownMinutes: 5,
      warnings: [
        'Workday applications are tracked per employer',
        'Multiple applications to same company may be flagged',
      ],
    },
    [Platform.ICIMS]: {
      maxApplicationsPerDay: 30,
      cooldownMinutes: 2,
      warnings: [],
    },
    [Platform.TALEO]: {
      maxApplicationsPerDay: 25,
      cooldownMinutes: 3,
      warnings: ['Taleo sessions may timeout frequently'],
    },
    [Platform.SMARTRECRUITERS]: {
      maxApplicationsPerDay: 75,
      cooldownMinutes: 1,
      warnings: [],
    },
    [Platform.JOBVITE]: {
      maxApplicationsPerDay: 50,
      cooldownMinutes: 1,
      warnings: [],
    },
    [Platform.GENERIC]: {
      maxApplicationsPerDay: 50,
      cooldownMinutes: 1,
      warnings: [],
    },
  };

  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly auditLog: AuditLogService,
  ) {}

  async checkCompliance(
    request: ComplianceCheckRequestDto,
  ): Promise<ComplianceCheckResponseDto> {
    const { action, context, limits } = request;

    switch (action) {
      case ComplianceAction.CHECK:
        return this.performComplianceCheck(context, limits);
      case ComplianceAction.LOG:
        return this.logAction(context);
      case ComplianceAction.REPORT:
        return this.generateReport(context);
      case ComplianceAction.CONFIGURE:
        return this.configureCompliance(context, limits);
      default:
        throw new Error(`Unknown compliance action: ${action}`);
    }
  }

  private async performComplianceCheck(
    context: { platform: Platform; operation: string; user_id: string },
    customLimits?: {
      requests_per_minute?: number;
      requests_per_hour?: number;
      requests_per_day?: number;
      applications_per_day?: number;
    },
  ): Promise<ComplianceCheckResponseDto> {
    const warnings: ComplianceWarningDto[] = [];

    // Check rate limits
    const rateLimitResult = await this.rateLimiter.checkRateLimit(
      context.user_id,
      context.platform,
      context.operation,
      customLimits
        ? {
            requestsPerMinute: customLimits.requests_per_minute,
            requestsPerHour: customLimits.requests_per_hour,
            requestsPerDay: customLimits.requests_per_day,
            applicationsPerDay: customLimits.applications_per_day,
          }
        : undefined,
    );

    // Check application limits if this is an application operation
    let applicationLimitResult = rateLimitResult;
    if (context.operation === 'application' || context.operation === 'apply') {
      applicationLimitResult = await this.rateLimiter.checkApplicationLimit(
        context.user_id,
        context.platform,
        customLimits?.applications_per_day,
      );

      if (!applicationLimitResult.allowed) {
        warnings.push({
          type: 'application_limit',
          message: `Daily application limit reached for ${context.platform}`,
          severity: WarningSeverity.CRITICAL,
        });
      }
    }

    // Add platform-specific warnings
    const platformRestrictions = this.platformRestrictions[context.platform];
    for (const warning of platformRestrictions.warnings) {
      warnings.push({
        type: 'platform_restriction',
        message: warning,
        severity: WarningSeverity.INFO,
      });
    }

    // Check utilization and add warnings
    const utilizationRatio = rateLimitResult.currentUsage / rateLimitResult.limit;
    if (utilizationRatio > 0.9) {
      warnings.push({
        type: 'rate_limit_warning',
        message: `Approaching rate limit for ${context.platform} (${Math.round(utilizationRatio * 100)}% used)`,
        severity: WarningSeverity.WARNING,
      });
    }

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(
      rateLimitResult.allowed && applicationLimitResult.allowed,
      utilizationRatio,
      warnings,
    );

    // Log the compliance check
    const auditLogId = await this.auditLog.log({
      userId: context.user_id,
      platform: context.platform,
      operation: context.operation,
      allowed: rateLimitResult.allowed && applicationLimitResult.allowed,
      complianceScore,
      warnings: warnings.map((w) => w.message),
      metadata: {
        currentUsage: rateLimitResult.currentUsage,
        limit: rateLimitResult.limit,
        utilizationRatio,
      },
    });

    return {
      allowed: rateLimitResult.allowed && applicationLimitResult.allowed,
      rate_limit_status: {
        current_usage: rateLimitResult.currentUsage,
        limit: rateLimitResult.limit,
        reset_at: rateLimitResult.resetAt,
        recommended_delay_ms: Math.max(
          rateLimitResult.recommendedDelayMs,
          platformRestrictions.cooldownMinutes * 60 * 1000,
        ),
      },
      compliance_score: complianceScore,
      warnings,
      audit_log_id: auditLogId,
    };
  }

  private async logAction(
    context: { platform: Platform; operation: string; user_id: string },
  ): Promise<ComplianceCheckResponseDto> {
    const auditLogId = await this.auditLog.log({
      userId: context.user_id,
      platform: context.platform,
      operation: context.operation,
      allowed: true,
      metadata: { action: 'log_only' },
    });

    return {
      allowed: true,
      rate_limit_status: {
        current_usage: 0,
        limit: 0,
        reset_at: new Date(),
        recommended_delay_ms: 0,
      },
      compliance_score: 100,
      warnings: [],
      audit_log_id: auditLogId,
    };
  }

  private async generateReport(
    context: { platform: Platform; operation: string; user_id: string },
  ): Promise<ComplianceCheckResponseDto> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const report = await this.auditLog.getComplianceReport(
      context.user_id,
      startDate,
      endDate,
    );

    const auditLogId = await this.auditLog.log({
      userId: context.user_id,
      platform: context.platform,
      operation: 'generate_report',
      allowed: true,
      metadata: { report },
    });

    return {
      allowed: true,
      rate_limit_status: {
        current_usage: report.totalRequests,
        limit: 0,
        reset_at: new Date(),
        recommended_delay_ms: 0,
      },
      compliance_score: report.averageComplianceScore,
      warnings: report.warnings.map((w) => ({
        type: 'historical',
        message: w,
        severity: WarningSeverity.INFO,
      })),
      audit_log_id: auditLogId,
    };
  }

  private async configureCompliance(
    context: { platform: Platform; operation: string; user_id: string },
    limits?: {
      requests_per_minute?: number;
      requests_per_hour?: number;
      requests_per_day?: number;
      applications_per_day?: number;
    },
  ): Promise<ComplianceCheckResponseDto> {
    // This would typically save custom limits to a database
    // For now, we just log the configuration attempt
    const auditLogId = await this.auditLog.log({
      userId: context.user_id,
      platform: context.platform,
      operation: 'configure',
      allowed: true,
      metadata: { customLimits: limits },
    });

    return {
      allowed: true,
      rate_limit_status: {
        current_usage: 0,
        limit: limits?.requests_per_day || 0,
        reset_at: new Date(),
        recommended_delay_ms: 0,
      },
      compliance_score: 100,
      warnings: [
        {
          type: 'configuration',
          message: 'Compliance settings updated',
          severity: WarningSeverity.INFO,
        },
      ],
      audit_log_id: auditLogId,
    };
  }

  private calculateComplianceScore(
    allowed: boolean,
    utilizationRatio: number,
    warnings: ComplianceWarningDto[],
  ): number {
    let score = 100;

    // Deduct for not being allowed
    if (!allowed) {
      score -= 30;
    }

    // Deduct based on utilization
    if (utilizationRatio > 0.9) {
      score -= 20;
    } else if (utilizationRatio > 0.75) {
      score -= 10;
    } else if (utilizationRatio > 0.5) {
      score -= 5;
    }

    // Deduct for warnings
    for (const warning of warnings) {
      switch (warning.severity) {
        case WarningSeverity.CRITICAL:
          score -= 15;
          break;
        case WarningSeverity.WARNING:
          score -= 5;
          break;
        case WarningSeverity.INFO:
          score -= 1;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  async resetUserLimits(userId: string, platform: Platform): Promise<void> {
    await this.rateLimiter.resetLimits(userId, platform);
    await this.auditLog.log({
      userId,
      platform,
      operation: 'reset_limits',
      allowed: true,
      metadata: { action: 'admin_reset' },
    });
  }

  async getUserComplianceHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      platform?: string;
    },
  ) {
    return this.auditLog.getUserLogs(userId, options);
  }
}
