import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';


import { Job } from '../../jobs/entities/job.entity';
import {
  IngestionJob,
  IngestionStatus,
  IngestionTrigger,
} from '../entities/ingestion-job.entity';
import {
  JobSource,
  SourceStatus,
} from '../entities/job-source.entity';
import {
  RawJobListing,
  ProcessingStatus,
} from '../entities/raw-job-listing.entity';

import { DeduplicationService } from './deduplication.service';
import { JobAdapterFactory } from '../adapters/adapter.factory';
import type { FetchOptions, NormalizedJob } from '../interfaces/job-adapter.interface';
import type { Queue } from 'bull';
import type { Repository} from 'typeorm';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectRepository(JobSource)
    private readonly jobSourceRepository: Repository<JobSource>,
    @InjectRepository(IngestionJob)
    private readonly ingestionJobRepository: Repository<IngestionJob>,
    @InjectRepository(RawJobListing)
    private readonly rawJobRepository: Repository<RawJobListing>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectQueue('job-ingestion')
    private readonly ingestionQueue: Queue,
    private readonly adapterFactory: JobAdapterFactory,
    private readonly deduplicationService: DeduplicationService,
  ) {}

  /**
   * Run ingestion for a specific source
   */
  async runIngestion(
    sourceId: string,
    trigger: IngestionTrigger = IngestionTrigger.MANUAL,
    userId?: string,
    options?: FetchOptions,
  ): Promise<IngestionJob> {
    const source = await this.jobSourceRepository.findOne({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Job source not found: ${sourceId}`);
    }

    if (source.status !== SourceStatus.ACTIVE) {
      throw new Error(`Job source is not active: ${source.name}`);
    }

    // Create ingestion job record
    const ingestionJob = this.ingestionJobRepository.create({
      job_source_id: sourceId,
      status: IngestionStatus.PENDING,
      trigger,
      triggered_by_user_id: userId,
      config_snapshot: {
        sync_interval_minutes: source.sync_interval_minutes,
        rate_limits: source.config,
      },
    });

    await this.ingestionJobRepository.save(ingestionJob);

    // Queue the ingestion job
    await this.ingestionQueue.add('process-ingestion', {
      ingestionJobId: ingestionJob.id,
      sourceId,
      options,
    });

    this.logger.log(
      `Queued ingestion job ${ingestionJob.id} for source: ${source.name}`,
    );

    return ingestionJob;
  }

  /**
   * Process an ingestion job (called by queue worker)
   */
  async processIngestion(
    ingestionJobId: string,
    sourceId: string,
    options?: FetchOptions,
  ): Promise<void> {
    const startTime = Date.now();
    const ingestionJob = await this.ingestionJobRepository.findOne({
      where: { id: ingestionJobId },
      relations: ['job_source'],
    });

    if (!ingestionJob) {
      throw new Error(`Ingestion job not found: ${ingestionJobId}`);
    }

    const source = ingestionJob.job_source;

    try {
      // Update status to in progress
      ingestionJob.status = IngestionStatus.IN_PROGRESS;
      ingestionJob.started_at = new Date();
      await this.ingestionJobRepository.save(ingestionJob);

      this.logger.log(
        `Starting ingestion for ${source.name} (Job: ${ingestionJobId})`,
      );

      // Create adapter
      const adapter = this.adapterFactory.createAdapter(source);
      await adapter.initialize(source);

      // Fetch jobs from source
      const fetchResult = await adapter.fetchJobs(options);

      ingestionJob.total_fetched = fetchResult.jobs.length;
      ingestionJob.pages_processed = fetchResult.pagination.currentPage;
      ingestionJob.total_pages = fetchResult.pagination.totalPages;

      // Process each job
      for (const normalizedJob of fetchResult.jobs) {
        try {
          await this.processNormalizedJob(normalizedJob, source, ingestionJob);
          ingestionJob.total_processed++;
        } catch (error) {
          this.logger.error(
            `Error processing job ${normalizedJob.externalId}: ${error.message}`,
          );
          ingestionJob.total_errors++;
          ingestionJob.errors.push(
            `Job ${normalizedJob.externalId}: ${error.message}`,
          );
        }
      }

      // Update source statistics
      await this.updateSourceStats(source, ingestionJob, true);

      // Complete ingestion
      ingestionJob.status = IngestionStatus.COMPLETED;
      ingestionJob.completed_at = new Date();
      ingestionJob.duration_seconds = Math.floor((Date.now() - startTime) / 1000);
      ingestionJob.progress_percent = 100;

      await this.ingestionJobRepository.save(ingestionJob);

      this.logger.log(
        `Completed ingestion for ${source.name}: ${ingestionJob.total_new} new, ${ingestionJob.total_updated} updated, ${ingestionJob.total_duplicates} duplicates`,
      );
    } catch (error) {
      this.logger.error(
        `Ingestion failed for ${source.name}: ${error.message}`,
        error.stack,
      );

      ingestionJob.status = IngestionStatus.FAILED;
      ingestionJob.error_message = error.message;
      ingestionJob.error_stack = error.stack;
      ingestionJob.completed_at = new Date();
      ingestionJob.duration_seconds = Math.floor((Date.now() - startTime) / 1000);

      await this.ingestionJobRepository.save(ingestionJob);
      await this.updateSourceStats(source, ingestionJob, false);
    }
  }

  /**
   * Process a normalized job
   */
  private async processNormalizedJob(
    normalizedJob: NormalizedJob,
    source: JobSource,
    ingestionJob: IngestionJob,
  ): Promise<void> {
    // Check for duplicates
    const deduplicationResult = await this.deduplicationService.checkDuplicate(
      normalizedJob,
      source.id,
    );

    // Create raw job listing
    const rawJob = this.rawJobRepository.create({
      job_source_id: source.id,
      ingestion_job_id: ingestionJob.id,
      external_id: normalizedJob.externalId,
      fingerprint: deduplicationResult.fingerprint,
      raw_data: normalizedJob,
      title: normalizedJob.title,
      company_name: normalizedJob.companyName,
      location: normalizedJob.location,
      description: normalizedJob.description,
      url: normalizedJob.applicationUrl,
      posted_date: normalizedJob.postedAt,
      expires_date: normalizedJob.expiresAt,
      processing_status: deduplicationResult.isDuplicate
        ? ProcessingStatus.DUPLICATE
        : ProcessingStatus.PENDING,
      duplicate_of_id: deduplicationResult.duplicateOf,
      similarity_score: deduplicationResult.confidence,
      is_latest: true,
    });

    await this.rawJobRepository.save(rawJob);

    if (deduplicationResult.isDuplicate) {
      ingestionJob.total_duplicates++;
      await this.deduplicationService.markOldVersions(
        deduplicationResult.fingerprint,
        rawJob.id,
      );
      return;
    }

    // Check if job already exists in normalized jobs table
    const existingJob = await this.jobRepository.findOne({
      where: {
        source: source.provider as any,
        external_id: normalizedJob.externalId,
      },
    });

    if (existingJob) {
      // Update existing job
      await this.updateExistingJob(existingJob, normalizedJob);
      rawJob.processed_job_id = existingJob.id;
      rawJob.processing_status = ProcessingStatus.PROCESSED;
      ingestionJob.total_updated++;
    } else {
      // Create new job
      const newJob = await this.createNewJob(normalizedJob, source);
      rawJob.processed_job_id = newJob.id;
      rawJob.processing_status = ProcessingStatus.PROCESSED;
      ingestionJob.total_new++;
    }

    rawJob.processed_at = new Date();
    await this.rawJobRepository.save(rawJob);
  }

  /**
   * Create a new job in the jobs table
   */
  private async createNewJob(
    normalizedJob: NormalizedJob,
    source: JobSource,
  ): Promise<Job> {
    const job = this.jobRepository.create({
      external_id: normalizedJob.externalId,
      source: source.provider as any,
      title: normalizedJob.title,
      company_name: normalizedJob.companyName,
      location: normalizedJob.location,
      city: normalizedJob.city,
      state: normalizedJob.state,
      country: normalizedJob.country,
      remote_type: normalizedJob.remoteType as any,
      description: normalizedJob.description,
      requirements: normalizedJob.requirements || [],
      benefits: normalizedJob.benefits || [],
      skills: normalizedJob.skills || [],
      experience_level: normalizedJob.experienceLevel as any,
      experience_years_min: normalizedJob.experienceYearsMin,
      experience_years_max: normalizedJob.experienceYearsMax,
      employment_type: normalizedJob.employmentType as any,
      salary_min: normalizedJob.salaryMin,
      salary_max: normalizedJob.salaryMax,
      salary_currency: normalizedJob.salaryCurrency || 'USD',
      salary_period: normalizedJob.salaryPeriod,
      posted_at: normalizedJob.postedAt,
      expires_at: normalizedJob.expiresAt,
      application_url: normalizedJob.applicationUrl,
      ats_platform: normalizedJob.atsPlatform,
      ats_metadata: normalizedJob.atsMetadata,
      tags: normalizedJob.tags || [],
      is_active: true,
      metadata: normalizedJob.metadata,
    });

    return await this.jobRepository.save(job);
  }

  /**
   * Update an existing job
   */
  private async updateExistingJob(
    existingJob: Job,
    normalizedJob: NormalizedJob,
  ): Promise<void> {
    existingJob.title = normalizedJob.title;
    existingJob.description = normalizedJob.description;
    existingJob.requirements = normalizedJob.requirements || [];
    existingJob.benefits = normalizedJob.benefits || [];
    existingJob.skills = normalizedJob.skills || [];
    existingJob.salary_min = normalizedJob.salaryMin;
    existingJob.salary_max = normalizedJob.salaryMax;
    existingJob.expires_at = normalizedJob.expiresAt;
    existingJob.is_active = true; // Reactivate if it was inactive

    await this.jobRepository.save(existingJob);
  }

  /**
   * Update source statistics after ingestion
   */
  private async updateSourceStats(
    source: JobSource,
    ingestionJob: IngestionJob,
    success: boolean,
  ): Promise<void> {
    source.total_runs++;
    source.last_sync_at = new Date();

    if (success) {
      source.successful_runs++;
      source.last_success_at = new Date();
      source.consecutive_failures = 0;
      source.total_jobs_ingested += ingestionJob.total_new;

      // Calculate average run duration
      const totalDuration =
        source.average_run_duration_seconds * (source.total_runs - 1) +
        ingestionJob.duration_seconds;
      source.average_run_duration_seconds = totalDuration / source.total_runs;

      // Schedule next sync
      const nextSync = new Date();
      nextSync.setMinutes(nextSync.getMinutes() + source.sync_interval_minutes);
      source.next_sync_at = nextSync;
    } else {
      source.failed_runs++;
      source.consecutive_failures++;
      source.last_failure_at = new Date();
      source.last_error = ingestionJob.error_message;

      // Disable source if too many consecutive failures
      if (source.consecutive_failures >= 5) {
        source.status = SourceStatus.ERROR;
        this.logger.warn(
          `Source ${source.name} disabled due to ${source.consecutive_failures} consecutive failures`,
        );
      }
    }

    await this.jobSourceRepository.save(source);
  }

  /**
   * Get ingestion status
   */
  async getIngestionStatus(sourceId?: string): Promise<any> {
    const whereClause = sourceId ? { job_source_id: sourceId } : {};

    const [total, pending, inProgress, completed, failed] = await Promise.all([
      this.ingestionJobRepository.count({ where: whereClause }),
      this.ingestionJobRepository.count({
        where: { ...whereClause, status: IngestionStatus.PENDING },
      }),
      this.ingestionJobRepository.count({
        where: { ...whereClause, status: IngestionStatus.IN_PROGRESS },
      }),
      this.ingestionJobRepository.count({
        where: { ...whereClause, status: IngestionStatus.COMPLETED },
      }),
      this.ingestionJobRepository.count({
        where: { ...whereClause, status: IngestionStatus.FAILED },
      }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      failed,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(sourceId?: string): Promise<any> {
    const whereClause = sourceId ? { job_source_id: sourceId } : {};

    const jobs = await this.ingestionJobRepository.find({
      where: { ...whereClause, status: IngestionStatus.COMPLETED },
      order: { completed_at: 'DESC' },
      take: 100,
    });

    const stats = {
      totalJobs: jobs.reduce((sum, job) => sum + job.total_fetched, 0),
      totalNew: jobs.reduce((sum, job) => sum + job.total_new, 0),
      totalUpdated: jobs.reduce((sum, job) => sum + job.total_updated, 0),
      totalDuplicates: jobs.reduce((sum, job) => sum + job.total_duplicates, 0),
      totalErrors: jobs.reduce((sum, job) => sum + job.total_errors, 0),
      averageDuration:
        jobs.reduce((sum, job) => sum + job.duration_seconds, 0) / jobs.length || 0,
      deduplicationRate: 0,
    };

    if (stats.totalJobs > 0) {
      stats.deduplicationRate = (stats.totalDuplicates / stats.totalJobs) * 100;
    }

    return stats;
  }
}
