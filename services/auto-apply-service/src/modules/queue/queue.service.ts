import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { ApplicationData } from '../adapters/base.adapter';
import { platformRateLimits } from '../../config/queue.config';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('application-queue')
    private readonly applicationQueue: Queue,
  ) {}

  async addApplicationToQueue(
    applicationData: ApplicationData,
    priority: number = 0,
  ): Promise<Job> {
    this.logger.log(`Adding application to queue for job: ${applicationData.jobUrl}`);

    // Determine platform for rate limiting
    const platform = this.detectPlatform(applicationData.jobUrl);
    const rateLimit = platformRateLimits[platform] || platformRateLimits.default;

    const job = await this.applicationQueue.add(
      'submit-application',
      applicationData,
      {
        priority,
        delay: this.calculateDelay(platform),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: rateLimit.delayBetweenApplications,
        },
        removeOnComplete: 100,
        removeOnFail: false,
      },
    );

    this.logger.log(`Job ${job.id} added to queue with priority ${priority}`);
    return job;
  }
  
  // Alias for backward compatibility
  async addApplicationJob(
    applicationData: ApplicationData,
    priority: number = 0,
  ): Promise<Job> {
    return this.addApplicationToQueue(applicationData, priority);
  }

  async addBulkApplications(applications: ApplicationData[]): Promise<Job[]> {
    this.logger.log(`Adding ${applications.length} applications to queue`);

    const jobs = await Promise.all(
      applications.map((app, index) => this.addApplicationToQueue(app, index)),
    );

    return jobs;
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.applicationQueue.getWaitingCount(),
      this.applicationQueue.getActiveCount(),
      this.applicationQueue.getCompletedCount(),
      this.applicationQueue.getFailedCount(),
      this.applicationQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async getQueuedJobs() {
    const [waiting, active, delayed] = await Promise.all([
      this.applicationQueue.getWaiting(),
      this.applicationQueue.getActive(),
      this.applicationQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.map(job => this.formatJob(job)),
      active: active.map(job => this.formatJob(job)),
      delayed: delayed.map(job => this.formatJob(job)),
    };
  }

  async getJob(jobId: string): Promise<Job | null> {
    return await this.applicationQueue.getJob(jobId);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from queue`);
    }
  }

  async retryJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Job ${jobId} queued for retry`);
    }
  }

  async pauseQueue(): Promise<void> {
    await this.applicationQueue.pause();
    this.logger.log('Queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.applicationQueue.resume();
    this.logger.log('Queue resumed');
  }

  async clearQueue(): Promise<void> {
    await this.applicationQueue.empty();
    this.logger.log('Queue cleared');
  }

  async getFailedJobs() {
    const failed = await this.applicationQueue.getFailed();
    return failed.map(job => this.formatJobWithError(job));
  }

  private detectPlatform(url: string): string {
    if (url.includes('workday')) return 'workday';
    if (url.includes('greenhouse')) return 'greenhouse';
    if (url.includes('lever')) return 'lever';
    if (url.includes('icims')) return 'icims';
    if (url.includes('taleo')) return 'taleo';
    if (url.includes('smartrecruiters')) return 'smartrecruiters';
    return 'default';
  }

  private calculateDelay(platform: string): number {
    const rateLimit = platformRateLimits[platform] || platformRateLimits.default;

    // Add some randomness to avoid detection patterns
    const baseDelay = rateLimit.delayBetweenApplications;
    const variance = baseDelay * 0.2; // 20% variance
    const randomDelay = baseDelay + (Math.random() * variance - variance / 2);

    return Math.floor(randomDelay);
  }

  private formatJob(job: Job) {
    return {
      id: job.id,
      data: {
        userId: job.data.userId,
        jobUrl: job.data.jobUrl,
        companyName: job.data.personalInfo?.companyName,
      },
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  private formatJobWithError(job: Job) {
    return {
      ...this.formatJob(job),
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
    };
  }
}
