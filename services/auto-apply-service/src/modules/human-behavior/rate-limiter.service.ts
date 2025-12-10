import { Injectable, Logger } from '@nestjs/common';

interface PlatformLimits {
  dailyLimit: number;
  hourlyLimit: number;
  minDelayBetweenApps: number; // milliseconds
  maxAppsPerSession: number;
  cooldownAfterSession: number; // milliseconds
}

interface ApplicationRecord {
  timestamp: Date;
  platform: string;
  jobId: string;
  userId: string;
}

interface UserSession {
  userId: string;
  startTime: Date;
  applicationsCount: number;
  lastApplicationTime: Date | null;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  // Platform-specific rate limits (conservative to avoid detection)
  private readonly platformLimits: Map<string, PlatformLimits> = new Map([
    [
      'linkedin',
      {
        dailyLimit: 25,
        hourlyLimit: 5,
        minDelayBetweenApps: 180000, // 3 minutes
        maxAppsPerSession: 10,
        cooldownAfterSession: 3600000, // 1 hour
      },
    ],
    [
      'indeed',
      {
        dailyLimit: 50,
        hourlyLimit: 10,
        minDelayBetweenApps: 120000, // 2 minutes
        maxAppsPerSession: 15,
        cooldownAfterSession: 1800000, // 30 minutes
      },
    ],
    [
      'glassdoor',
      {
        dailyLimit: 30,
        hourlyLimit: 6,
        minDelayBetweenApps: 150000, // 2.5 minutes
        maxAppsPerSession: 10,
        cooldownAfterSession: 2700000, // 45 minutes
      },
    ],
    [
      'ziprecruiter',
      {
        dailyLimit: 40,
        hourlyLimit: 8,
        minDelayBetweenApps: 120000, // 2 minutes
        maxAppsPerSession: 12,
        cooldownAfterSession: 2400000, // 40 minutes
      },
    ],
    [
      'monster',
      {
        dailyLimit: 35,
        hourlyLimit: 7,
        minDelayBetweenApps: 150000, // 2.5 minutes
        maxAppsPerSession: 10,
        cooldownAfterSession: 3000000, // 50 minutes
      },
    ],
    [
      'greenhouse',
      {
        dailyLimit: 20,
        hourlyLimit: 4,
        minDelayBetweenApps: 240000, // 4 minutes
        maxAppsPerSession: 8,
        cooldownAfterSession: 3600000, // 1 hour
      },
    ],
    [
      'lever',
      {
        dailyLimit: 20,
        hourlyLimit: 4,
        minDelayBetweenApps: 240000, // 4 minutes
        maxAppsPerSession: 8,
        cooldownAfterSession: 3600000, // 1 hour
      },
    ],
    [
      'workday',
      {
        dailyLimit: 15,
        hourlyLimit: 3,
        minDelayBetweenApps: 300000, // 5 minutes
        maxAppsPerSession: 6,
        cooldownAfterSession: 4200000, // 70 minutes
      },
    ],
    [
      'default',
      {
        dailyLimit: 30,
        hourlyLimit: 6,
        minDelayBetweenApps: 180000, // 3 minutes
        maxAppsPerSession: 10,
        cooldownAfterSession: 3600000, // 1 hour
      },
    ],
  ]);

  // In-memory storage (in production, use Redis)
  private applicationRecords: ApplicationRecord[] = [];
  private userSessions: Map<string, UserSession> = new Map();
  private cooldowns: Map<string, Date> = new Map(); // userId:platform -> cooldown end time

  /**
   * Check if user can apply to a job on a platform
   */
  async canApply(userId: string, platform: string): Promise<{ allowed: boolean; reason?: string; waitTime?: number }> {
    const normalizedPlatform = platform.toLowerCase();
    const limits = this.platformLimits.get(normalizedPlatform) || this.platformLimits.get('default')!;

    // Check cooldown
    const cooldownKey = `${userId}:${normalizedPlatform}`;
    const cooldownEnd = this.cooldowns.get(cooldownKey);
    if (cooldownEnd && cooldownEnd > new Date()) {
      const waitTime = cooldownEnd.getTime() - Date.now();
      return {
        allowed: false,
        reason: `Session cooldown active for ${normalizedPlatform}`,
        waitTime,
      };
    }

    // Check daily limit
    const dailyCount = this.getDailyCount(userId, normalizedPlatform);
    if (dailyCount >= limits.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit reached for ${normalizedPlatform} (${dailyCount}/${limits.dailyLimit})`,
        waitTime: this.getTimeUntilNextDay(),
      };
    }

    // Check hourly limit
    const hourlyCount = this.getHourlyCount(userId, normalizedPlatform);
    if (hourlyCount >= limits.hourlyLimit) {
      return {
        allowed: false,
        reason: `Hourly limit reached for ${normalizedPlatform} (${hourlyCount}/${limits.hourlyLimit})`,
        waitTime: this.getTimeUntilNextHour(),
      };
    }

    // Check session limit
    const session = this.userSessions.get(userId);
    if (session && session.applicationsCount >= limits.maxAppsPerSession) {
      // Set cooldown
      const cooldownEnd = new Date(Date.now() + limits.cooldownAfterSession);
      this.cooldowns.set(cooldownKey, cooldownEnd);
      this.userSessions.delete(userId);

      return {
        allowed: false,
        reason: `Session limit reached, cooldown initiated`,
        waitTime: limits.cooldownAfterSession,
      };
    }

    // Check minimum delay between applications
    const lastApp = this.getLastApplication(userId, normalizedPlatform);
    if (lastApp) {
      const timeSinceLastApp = Date.now() - lastApp.timestamp.getTime();
      if (timeSinceLastApp < limits.minDelayBetweenApps) {
        const waitTime = limits.minDelayBetweenApps - timeSinceLastApp;
        return {
          allowed: false,
          reason: `Minimum delay between applications not met`,
          waitTime,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Record an application
   */
  async recordApplication(userId: string, platform: string, jobId: string): Promise<void> {
    const normalizedPlatform = platform.toLowerCase();
    const now = new Date();

    // Add to records
    this.applicationRecords.push({
      timestamp: now,
      platform: normalizedPlatform,
      jobId,
      userId,
    });

    // Update or create session
    let session = this.userSessions.get(userId);
    if (!session) {
      session = {
        userId,
        startTime: now,
        applicationsCount: 0,
        lastApplicationTime: null,
      };
      this.userSessions.set(userId, session);
    }

    session.applicationsCount++;
    session.lastApplicationTime = now;

    this.logger.log(
      `Recorded application for user ${userId} on ${normalizedPlatform}. ` +
        `Session count: ${session.applicationsCount}, Daily count: ${this.getDailyCount(userId, normalizedPlatform)}`,
    );

    // Cleanup old records (keep last 7 days)
    this.cleanupOldRecords();
  }

  /**
   * Get recommended wait time before next application
   */
  getRecommendedWaitTime(userId: string, platform: string): number {
    const normalizedPlatform = platform.toLowerCase();
    const limits = this.platformLimits.get(normalizedPlatform) || this.platformLimits.get('default')!;

    // Add randomization to avoid pattern detection
    const baseWait = limits.minDelayBetweenApps;
    const variance = baseWait * 0.3; // ±30%
    const randomWait = baseWait + (Math.random() * variance * 2 - variance);

    // Add extra time during peak hours (business hours)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      return randomWait * 1.2; // 20% longer during business hours
    }

    return Math.round(randomWait);
  }

  /**
   * Get remaining applications for today
   */
  getRemainingDailyApplications(userId: string, platform: string): number {
    const normalizedPlatform = platform.toLowerCase();
    const limits = this.platformLimits.get(normalizedPlatform) || this.platformLimits.get('default')!;
    const dailyCount = this.getDailyCount(userId, normalizedPlatform);
    return Math.max(0, limits.dailyLimit - dailyCount);
  }

  /**
   * Get current session stats
   */
  getSessionStats(userId: string): { applicationsCount: number; sessionDuration: number } | null {
    const session = this.userSessions.get(userId);
    if (!session) {
      return null;
    }

    return {
      applicationsCount: session.applicationsCount,
      sessionDuration: Date.now() - session.startTime.getTime(),
    };
  }

  /**
   * Get platform limits configuration
   */
  getPlatformLimits(platform: string): PlatformLimits {
    const normalizedPlatform = platform.toLowerCase();
    return this.platformLimits.get(normalizedPlatform) || this.platformLimits.get('default')!;
  }

  /**
   * Reset session for a user
   */
  resetSession(userId: string): void {
    this.userSessions.delete(userId);
    this.logger.log(`Session reset for user ${userId}`);
  }

  // Private helper methods

  private getDailyCount(userId: string, platform: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.applicationRecords.filter(
      (record) =>
        record.userId === userId && record.platform === platform && record.timestamp >= today,
    ).length;
  }

  private getHourlyCount(userId: string, platform: string): number {
    const oneHourAgo = new Date(Date.now() - 3600000);

    return this.applicationRecords.filter(
      (record) =>
        record.userId === userId && record.platform === platform && record.timestamp >= oneHourAgo,
    ).length;
  }

  private getLastApplication(userId: string, platform: string): ApplicationRecord | undefined {
    const userRecords = this.applicationRecords
      .filter((record) => record.userId === userId && record.platform === platform)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return userRecords[0];
  }

  private getTimeUntilNextDay(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }

  private getTimeUntilNextHour(): number {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour.getTime() - now.getTime();
  }

  private cleanupOldRecords(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.applicationRecords = this.applicationRecords.filter(
      (record) => record.timestamp >= sevenDaysAgo,
    );
  }
}
