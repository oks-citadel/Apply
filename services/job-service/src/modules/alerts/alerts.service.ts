import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobAlert, AlertFrequency } from './entities/job-alert.entity';
import { CreateAlertDto, UpdateAlertDto } from './dto/create-alert.dto';
import { SearchService } from '../search/search.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(JobAlert)
    private readonly alertRepository: Repository<JobAlert>,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Create job alert
   */
  async createAlert(userId: string, createDto: CreateAlertDto): Promise<JobAlert> {
    const alert = this.alertRepository.create({
      user_id: userId,
      ...createDto,
      frequency: createDto.frequency || AlertFrequency.DAILY,
      is_active: createDto.is_active !== undefined ? createDto.is_active : true,
    });

    return this.alertRepository.save(alert);
  }

  /**
   * Get user's alerts
   */
  async getUserAlerts(userId: string): Promise<JobAlert[]> {
    return this.alertRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string, userId: string): Promise<JobAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId, user_id: userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return alert;
  }

  /**
   * Update alert
   */
  async updateAlert(
    alertId: string,
    userId: string,
    updateDto: UpdateAlertDto,
  ): Promise<JobAlert> {
    const alert = await this.getAlertById(alertId, userId);

    Object.assign(alert, updateDto);

    return this.alertRepository.save(alert);
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string, userId: string): Promise<void> {
    const alert = await this.getAlertById(alertId, userId);
    await this.alertRepository.remove(alert);
  }

  /**
   * Check alerts and send notifications
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processAlerts(): Promise<void> {
    this.logger.log('Processing job alerts...');

    try {
      const now = new Date();

      // Get active alerts that need to be checked
      const alerts = await this.alertRepository.find({
        where: { is_active: true },
      });

      this.logger.log(`Found ${alerts.length} active alerts to process`);

      for (const alert of alerts) {
        try {
          const shouldProcess = this.shouldProcessAlert(alert, now);

          if (shouldProcess) {
            await this.processAlert(alert);
          }
        } catch (error) {
          this.logger.error(
            `Error processing alert ${alert.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Finished processing job alerts');
    } catch (error) {
      this.logger.error(`Error in processAlerts: ${error.message}`, error.stack);
    }
  }

  /**
   * Determine if alert should be processed based on frequency
   */
  private shouldProcessAlert(alert: JobAlert, now: Date): boolean {
    if (!alert.last_checked_at) {
      return true;
    }

    const hoursSinceLastCheck =
      (now.getTime() - alert.last_checked_at.getTime()) / (1000 * 60 * 60);

    switch (alert.frequency) {
      case AlertFrequency.INSTANT:
        return hoursSinceLastCheck >= 1; // Check every hour
      case AlertFrequency.DAILY:
        return hoursSinceLastCheck >= 24;
      case AlertFrequency.WEEKLY:
        return hoursSinceLastCheck >= 168; // 7 days
      default:
        return false;
    }
  }

  /**
   * Process individual alert
   */
  private async processAlert(alert: JobAlert): Promise<void> {
    this.logger.log(`Processing alert ${alert.id} for user ${alert.user_id}`);

    try {
      // Build search criteria from alert
      const searchCriteria: any = {
        keywords: alert.keywords,
        location: alert.location,
        remote_type: alert.remote_type,
        salary_min: alert.salary_min,
        salary_max: alert.salary_max,
        experience_level: alert.experience_level,
        employment_type: alert.employment_type,
        skills: alert.skills,
        company_id: alert.company_id,
        page: 1,
        limit: 50,
        sort_by: 'posted_at',
        sort_order: 'desc',
      };

      // Only get jobs posted since last check
      if (alert.last_checked_at) {
        const daysSinceLastCheck = Math.ceil(
          (Date.now() - alert.last_checked_at.getTime()) / (1000 * 60 * 60 * 24),
        );
        searchCriteria.posted_within_days = daysSinceLastCheck;
      }

      // Search for matching jobs
      const results = await this.searchService.searchJobs(searchCriteria);

      if (results.total > 0) {
        this.logger.log(
          `Found ${results.total} matching jobs for alert ${alert.id}`,
        );

        // Here you would send notification via notification service
        // For now, just log it
        this.logger.log(
          `Would send ${results.total} jobs to user ${alert.user_id}`,
        );

        // Update alert stats
        alert.last_sent_at = new Date();
        alert.jobs_sent_count += results.total;
      }

      // Update last checked timestamp
      alert.last_checked_at = new Date();
      await this.alertRepository.save(alert);

      this.logger.log(`Successfully processed alert ${alert.id}`);
    } catch (error) {
      this.logger.error(
        `Error processing alert ${alert.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Test alert and return matching jobs without sending notification
   */
  async testAlert(alertId: string, userId: string): Promise<any> {
    const alert = await this.getAlertById(alertId, userId);

    const searchCriteria: any = {
      keywords: alert.keywords,
      location: alert.location,
      remote_type: alert.remote_type,
      salary_min: alert.salary_min,
      salary_max: alert.salary_max,
      experience_level: alert.experience_level,
      employment_type: alert.employment_type,
      skills: alert.skills,
      company_id: alert.company_id,
      page: 1,
      limit: 10,
      sort_by: 'posted_at',
      sort_order: 'desc',
    };

    const results = await this.searchService.searchJobs(searchCriteria);

    return {
      alert_name: alert.name,
      matching_jobs_count: results.total,
      sample_jobs: results.hits.slice(0, 5),
    };
  }
}
