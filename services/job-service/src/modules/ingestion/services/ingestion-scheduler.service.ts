import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { JobSource, SourceStatus } from '../entities/job-source.entity';
import { IngestionService } from './ingestion.service';
import { IngestionTrigger } from '../entities/ingestion-job.entity';
import { DeduplicationService } from './deduplication.service';

@Injectable()
export class IngestionSchedulerService {
  private readonly logger = new Logger(IngestionSchedulerService.name);

  constructor(
    @InjectRepository(JobSource)
    private readonly jobSourceRepository: Repository<JobSource>,
    private readonly ingestionService: IngestionService,
    private readonly deduplicationService: DeduplicationService,
  ) {}

  /**
   * Run every 5 minutes to check for sources that need syncing
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkScheduledSources() {
    this.logger.debug('Checking for sources due for sync...');

    const now = new Date();
    const sourcesDue = await this.jobSourceRepository.find({
      where: {
        status: SourceStatus.ACTIVE,
        is_enabled: true,
        next_sync_at: LessThanOrEqual(now),
      },
    });

    if (sourcesDue.length === 0) {
      this.logger.debug('No sources due for sync');
      return;
    }

    this.logger.log(`Found ${sourcesDue.length} sources due for sync`);

    for (const source of sourcesDue) {
      try {
        await this.ingestionService.runIngestion(
          source.id,
          IngestionTrigger.SCHEDULED,
        );

        this.logger.log(`Scheduled ingestion for: ${source.name}`);
      } catch (error) {
        this.logger.error(
          `Failed to schedule ingestion for ${source.name}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Archive old raw listings daily at 2 AM
   */
  @Cron('0 2 * * *')
  async archiveOldListings() {
    this.logger.log('Starting archive of old raw job listings...');

    try {
      const archived = await this.deduplicationService.archiveOldListings(90); // 90 days
      this.logger.log(`Archived ${archived} old raw job listings`);
    } catch (error) {
      this.logger.error(`Failed to archive old listings: ${error.message}`);
    }
  }

  /**
   * Update source health status hourly
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateSourceHealth() {
    this.logger.debug('Updating source health metrics...');

    const sources = await this.jobSourceRepository.find({
      where: { is_enabled: true },
    });

    for (const source of sources) {
      try {
        // Check consecutive failures
        if (source.consecutive_failures >= 5 && source.status !== SourceStatus.ERROR) {
          source.status = SourceStatus.ERROR;
          await this.jobSourceRepository.save(source);

          this.logger.warn(
            `Marked source ${source.name} as ERROR due to consecutive failures`,
          );
        }

        // Auto-enable sources that have recovered
        if (
          source.status === SourceStatus.ERROR &&
          source.consecutive_failures < 3 &&
          source.last_success_at &&
          new Date().getTime() - source.last_success_at.getTime() < 86400000 // 24 hours
        ) {
          source.status = SourceStatus.ACTIVE;
          source.consecutive_failures = 0;
          await this.jobSourceRepository.save(source);

          this.logger.log(`Auto-recovered source: ${source.name}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to update health for ${source.name}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Reset rate limit counters every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async resetMinuteCounters() {
    await this.jobSourceRepository.update(
      { is_enabled: true },
      { requests_this_minute: 0 },
    );
  }

  /**
   * Reset hourly rate limit counters every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async resetHourlyCounters() {
    await this.jobSourceRepository.update(
      { is_enabled: true },
      { requests_this_hour: 0 },
    );
  }

  /**
   * Reset daily rate limit counters at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyCounters() {
    await this.jobSourceRepository.update(
      { is_enabled: true },
      { requests_today: 0 },
    );

    this.logger.log('Reset daily rate limit counters');
  }

  /**
   * Generate daily ingestion report at 9 AM
   */
  @Cron('0 9 * * *')
  async generateDailyReport() {
    this.logger.log('Generating daily ingestion report...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const stats = await this.ingestionService.getIngestionStats();
      const deduplicationStats = await this.deduplicationService.getDeduplicationStats();

      const report = {
        date: yesterday.toISOString().split('T')[0],
        ingestion: stats,
        deduplication: deduplicationStats,
        timestamp: new Date(),
      };

      this.logger.log(
        `Daily Report: ${stats.totalNew} new jobs, ${stats.totalUpdated} updated, ${stats.totalDuplicates} duplicates`,
      );

      // You can send this report via email, store in database, or publish to a monitoring service
      return report;
    } catch (error) {
      this.logger.error(`Failed to generate daily report: ${error.message}`);
    }
  }

  /**
   * High-frequency check for high-priority sources (every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkHighPrioritySources() {
    const highPrioritySources = await this.jobSourceRepository.find({
      where: {
        status: SourceStatus.ACTIVE,
        is_enabled: true,
      },
    });

    // Filter for sources with sync interval <= 5 minutes
    const urgent = highPrioritySources.filter(
      (source) =>
        source.sync_interval_minutes <= 5 &&
        source.next_sync_at &&
        source.next_sync_at <= new Date(),
    );

    if (urgent.length > 0) {
      this.logger.debug(`Processing ${urgent.length} high-priority sources`);

      for (const source of urgent) {
        try {
          await this.ingestionService.runIngestion(
            source.id,
            IngestionTrigger.SCHEDULED,
          );
        } catch (error) {
          this.logger.error(
            `Failed to run high-priority ingestion for ${source.name}: ${error.message}`,
          );
        }
      }
    }
  }
}
