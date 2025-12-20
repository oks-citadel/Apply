import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  id: string;
  userId: string;
  platform: string;
  operation: string;
  allowed: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  complianceScore?: number;
  warnings?: string[];
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly logs: Map<string, AuditLogEntry> = new Map();
  private readonly userLogs: Map<string, string[]> = new Map();

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = uuidv4();
    const timestamp = new Date();

    const logEntry: AuditLogEntry = {
      id,
      timestamp,
      ...entry,
    };

    this.logs.set(id, logEntry);

    // Index by user
    const userLogIds = this.userLogs.get(entry.userId) || [];
    userLogIds.push(id);
    this.userLogs.set(entry.userId, userLogIds);

    // Log for monitoring
    this.logger.log(
      `Audit: ${entry.userId} | ${entry.platform} | ${entry.operation} | ${entry.allowed ? 'ALLOWED' : 'DENIED'}`,
    );

    // Cleanup old logs (keep last 1000 per user)
    this.cleanupOldLogs(entry.userId);

    return id;
  }

  async getLog(id: string): Promise<AuditLogEntry | undefined> {
    return this.logs.get(id);
  }

  async getUserLogs(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      platform?: string;
      operation?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<AuditLogEntry[]> {
    const userLogIds = this.userLogs.get(userId) || [];
    let logs = userLogIds
      .map((id) => this.logs.get(id))
      .filter((log): log is AuditLogEntry => log !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply filters
    if (options?.platform) {
      logs = logs.filter((log) => log.platform === options.platform);
    }
    if (options?.operation) {
      logs = logs.filter((log) => log.operation === options.operation);
    }
    if (options?.startDate) {
      const startDate = options.startDate;
      logs = logs.filter((log) => log.timestamp >= startDate);
    }
    if (options?.endDate) {
      const endDate = options.endDate;
      logs = logs.filter((log) => log.timestamp <= endDate);
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;

    return logs.slice(offset, offset + limit);
  }

  async getComplianceReport(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalRequests: number;
    allowedRequests: number;
    deniedRequests: number;
    averageComplianceScore: number;
    byPlatform: Record<string, { total: number; allowed: number; denied: number }>;
    byOperation: Record<string, { total: number; allowed: number; denied: number }>;
    warnings: string[];
  }> {
    const logs = await this.getUserLogs(userId, { startDate, endDate });

    const report = {
      totalRequests: logs.length,
      allowedRequests: logs.filter((l) => l.allowed).length,
      deniedRequests: logs.filter((l) => !l.allowed).length,
      averageComplianceScore: 0,
      byPlatform: {} as Record<string, { total: number; allowed: number; denied: number }>,
      byOperation: {} as Record<string, { total: number; allowed: number; denied: number }>,
      warnings: [] as string[],
    };

    let totalScore = 0;
    let scoreCount = 0;

    for (const log of logs) {
      // By platform
      if (!report.byPlatform[log.platform]) {
        report.byPlatform[log.platform] = { total: 0, allowed: 0, denied: 0 };
      }
      report.byPlatform[log.platform].total++;
      if (log.allowed) {
        report.byPlatform[log.platform].allowed++;
      } else {
        report.byPlatform[log.platform].denied++;
      }

      // By operation
      if (!report.byOperation[log.operation]) {
        report.byOperation[log.operation] = { total: 0, allowed: 0, denied: 0 };
      }
      report.byOperation[log.operation].total++;
      if (log.allowed) {
        report.byOperation[log.operation].allowed++;
      } else {
        report.byOperation[log.operation].denied++;
      }

      // Compliance score
      if (log.complianceScore !== undefined) {
        totalScore += log.complianceScore;
        scoreCount++;
      }

      // Collect warnings
      if (log.warnings) {
        report.warnings.push(...log.warnings);
      }
    }

    report.averageComplianceScore = scoreCount > 0 ? totalScore / scoreCount : 100;
    report.warnings = [...new Set(report.warnings)]; // Deduplicate

    return report;
  }

  private cleanupOldLogs(userId: string): void {
    const userLogIds = this.userLogs.get(userId) || [];

    if (userLogIds.length > 1000) {
      const idsToRemove = userLogIds.slice(0, userLogIds.length - 1000);
      for (const id of idsToRemove) {
        this.logs.delete(id);
      }
      this.userLogs.set(userId, userLogIds.slice(-1000));
    }
  }

  async clearUserLogs(userId: string): Promise<void> {
    const userLogIds = this.userLogs.get(userId) || [];
    for (const id of userLogIds) {
      this.logs.delete(id);
    }
    this.userLogs.delete(userId);
  }
}
