import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ScheduledJob {
  id: string;
  userId: string;
  jobId: string;
  scheduledAt: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  executedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ScheduleConfig {
  windowStart: number; // Hour (0-23) in user's timezone
  windowEnd: number; // Hour (0-23) in user's timezone
  timezone: string;
  maxDailyApplications: number;
  minDelayBetweenMs: number;
  maxDelayBetweenMs: number;
  preferredDays: number[]; // 0=Sunday, 1=Monday, etc.
  avoidWeekends: boolean;
}

export interface DailySchedule {
  date: string;
  slots: Date[];
  usedSlots: number;
  maxSlots: number;
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private userSchedules: Map<string, DailySchedule[]> = new Map();
  private jobQueue: ScheduledJob[] = [];

  private readonly defaultConfig: ScheduleConfig = {
    windowStart: 9, // 9 AM
    windowEnd: 17, // 5 PM
    timezone: 'America/New_York',
    maxDailyApplications: 50,
    minDelayBetweenMs: 60000, // 1 minute
    maxDelayBetweenMs: 300000, // 5 minutes
    preferredDays: [1, 2, 3, 4, 5], // Monday-Friday
    avoidWeekends: true,
  };

  constructor(private readonly configService: ConfigService) {}

  /**
   * Schedule a job application for optimal timing
   */
  scheduleApplication(
    userId: string,
    jobId: string,
    priority: ScheduledJob['priority'] = 'normal',
    config: Partial<ScheduleConfig> = {},
    metadata?: Record<string, any>,
  ): ScheduledJob {
    const finalConfig = { ...this.defaultConfig, ...config };
    const scheduledTime = this.calculateOptimalTime(userId, finalConfig);

    const job: ScheduledJob = {
      id: this.generateJobId(),
      userId,
      jobId,
      scheduledAt: scheduledTime,
      priority,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      metadata,
    };

    this.scheduledJobs.set(job.id, job);
    this.insertIntoQueue(job);

    this.logger.log(
      `Scheduled job ${job.id} for ${scheduledTime.toISOString()} (priority: ${priority})`,
    );

    return job;
  }

  /**
   * Calculate optimal time for application
   */
  private calculateOptimalTime(userId: string, config: ScheduleConfig): Date {
    const now = new Date();
    let targetDate = new Date(now);

    // Check if we're within today's application window
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // If outside business hours or weekend (if avoided), move to next valid day
    if (
      currentHour >= config.windowEnd ||
      (config.avoidWeekends && (currentDay === 0 || currentDay === 6))
    ) {
      targetDate = this.getNextValidDay(targetDate, config);
    }

    // Get or create daily schedule for user
    const dailySchedule = this.getOrCreateDailySchedule(userId, targetDate, config);

    // Check if we have available slots
    if (dailySchedule.usedSlots >= dailySchedule.maxSlots) {
      // Move to next day
      targetDate.setDate(targetDate.getDate() + 1);
      return this.calculateOptimalTime(userId, config);
    }

    // Calculate specific time within window
    const slotIndex = dailySchedule.usedSlots;
    const windowDurationMs =
      (config.windowEnd - config.windowStart) * 60 * 60 * 1000;
    const slotDurationMs = windowDurationMs / config.maxDailyApplications;

    const baseTime = new Date(targetDate);
    baseTime.setHours(config.windowStart, 0, 0, 0);

    const scheduledTime = new Date(
      baseTime.getTime() + slotIndex * slotDurationMs,
    );

    // Add random jitter within the slot
    const jitterMs =
      config.minDelayBetweenMs +
      Math.random() * (config.maxDelayBetweenMs - config.minDelayBetweenMs);
    scheduledTime.setTime(scheduledTime.getTime() + jitterMs);

    // Mark slot as used
    dailySchedule.usedSlots++;

    return scheduledTime;
  }

  /**
   * Get next valid day for scheduling
   */
  private getNextValidDay(fromDate: Date, config: ScheduleConfig): Date {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(config.windowStart, 0, 0, 0);

    const day = nextDate.getDay();
    if (config.avoidWeekends && (day === 0 || day === 6)) {
      return this.getNextValidDay(nextDate, config);
    }

    if (config.preferredDays.length > 0 && !config.preferredDays.includes(day)) {
      return this.getNextValidDay(nextDate, config);
    }

    return nextDate;
  }

  /**
   * Get or create daily schedule for user
   */
  private getOrCreateDailySchedule(
    userId: string,
    date: Date,
    config: ScheduleConfig,
  ): DailySchedule {
    const dateStr = date.toISOString().split('T')[0];
    let userSchedules = this.userSchedules.get(userId);

    if (!userSchedules) {
      userSchedules = [];
      this.userSchedules.set(userId, userSchedules);
    }

    let schedule = userSchedules.find(s => s.date === dateStr);
    if (!schedule) {
      schedule = {
        date: dateStr,
        slots: [],
        usedSlots: 0,
        maxSlots: config.maxDailyApplications,
      };
      userSchedules.push(schedule);
    }

    return schedule;
  }

  /**
   * Insert job into priority queue
   */
  private insertIntoQueue(job: ScheduledJob): void {
    // Insert in sorted order by scheduledAt and priority
    const priorityWeight = { urgent: 0, high: 1, normal: 2, low: 3 };
    const index = this.jobQueue.findIndex(
      existing =>
        existing.scheduledAt > job.scheduledAt ||
        (existing.scheduledAt.getTime() === job.scheduledAt.getTime() &&
          priorityWeight[existing.priority] > priorityWeight[job.priority]),
    );

    if (index === -1) {
      this.jobQueue.push(job);
    } else {
      this.jobQueue.splice(index, 0, job);
    }
  }

  /**
   * Get next job to execute
   */
  getNextDueJob(): ScheduledJob | null {
    const now = new Date();
    const dueJob = this.jobQueue.find(
      job => job.status === 'pending' && job.scheduledAt <= now,
    );

    if (dueJob) {
      dueJob.status = 'processing';
      dueJob.executedAt = now;
      return dueJob;
    }

    return null;
  }

  /**
   * Mark job as completed
   */
  markCompleted(jobId: string): void {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.status = 'completed';
      this.removeFromQueue(jobId);
      this.logger.log(`Job ${jobId} completed`);
    }
  }

  /**
   * Mark job as failed
   */
  markFailed(jobId: string, error: string): void {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.error = error;

      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';
        // Reschedule with exponential backoff
        const backoffMs = Math.pow(2, job.retryCount) * 60000; // 2^n minutes
        job.scheduledAt = new Date(Date.now() + backoffMs);
        this.insertIntoQueue(job);
        this.logger.warn(
          `Job ${jobId} failed, retry ${job.retryCount}/${job.maxRetries} in ${backoffMs / 1000}s`,
        );
      } else {
        job.status = 'failed';
        this.removeFromQueue(jobId);
        this.logger.error(`Job ${jobId} failed permanently: ${error}`);
      }
    }
  }

  /**
   * Cancel a scheduled job
   */
  cancelJob(jobId: string): boolean {
    const job = this.scheduledJobs.get(jobId);
    if (job && job.status === 'pending') {
      job.status = 'cancelled';
      this.removeFromQueue(jobId);
      this.logger.log(`Job ${jobId} cancelled`);
      return true;
    }
    return false;
  }

  /**
   * Remove job from queue
   */
  private removeFromQueue(jobId: string): void {
    const index = this.jobQueue.findIndex(j => j.id === jobId);
    if (index !== -1) {
      this.jobQueue.splice(index, 1);
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): ScheduledJob | null {
    return this.scheduledJobs.get(jobId) || null;
  }

  /**
   * Get all jobs for user
   */
  getUserJobs(userId: string): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values()).filter(
      job => job.userId === userId,
    );
  }

  /**
   * Get pending jobs count
   */
  getPendingCount(): number {
    return this.jobQueue.filter(j => j.status === 'pending').length;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    nextDueJob: ScheduledJob | null;
  } {
    const jobs = Array.from(this.scheduledJobs.values());

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      processingJobs: jobs.filter(j => j.status === 'processing').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      nextDueJob: this.jobQueue[0] || null,
    };
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old completed/failed jobs
   */
  cleanup(maxAgeHours: number = 24): number {
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
    let removedCount = 0;

    for (const [jobId, job] of this.scheduledJobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.createdAt.getTime() < cutoffTime
      ) {
        this.scheduledJobs.delete(jobId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} old jobs`);
    }

    return removedCount;
  }
}
