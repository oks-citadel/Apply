import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';



// General Job Aggregators

// Niche / Regional Aggregators

// Tech-Focused Aggregators



import { Job, JobSource } from '../jobs/entities/job.entity';

import type { JobCacheService } from './cache/job-cache.service';
import type { JobProvider, RawJobData } from './interfaces/job-provider.interface';
import type { AdzunaProvider } from './providers/adzuna.provider';
import type { CareerJetProvider } from './providers/careerjet.provider';
import type { DiceProvider } from './providers/dice.provider';
import type { GlassdoorProvider } from './providers/glassdoor.provider';
import type { IndeedProvider } from './providers/indeed.provider';
import type { JoobleProvider } from './providers/jooble.provider';
import type { LinkedInProvider } from './providers/linkedin.provider';
import type { SimplyHiredProvider } from './providers/simplyhired.provider';
import type { TalentProvider } from './providers/talent.provider';
import type { ZipRecruiterProvider } from './providers/ziprecruiter.provider';
import type { OnModuleInit } from '@nestjs/common';
import type { Repository } from 'typeorm';

export interface AggregationResult {
  provider: string;
  jobsFound: number;
  jobsInserted: number;
  jobsUpdated: number;
  errors: string[];
}

export interface AggregationSummary {
  startTime: Date;
  endTime: Date;
  duration: number;
  results: AggregationResult[];
  totalJobsProcessed: number;
  totalJobsInserted: number;
  totalJobsUpdated: number;
}

@Injectable()
export class AggregatorService implements OnModuleInit {
  private readonly logger = new Logger(AggregatorService.name);
  private providers: Map<string, JobProvider> = new Map();
  private isRunning = false;

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly cacheService: JobCacheService,
    // General Job Aggregators
    private readonly indeedProvider: IndeedProvider,
    private readonly linkedInProvider: LinkedInProvider,
    private readonly glassdoorProvider: GlassdoorProvider,
    private readonly zipRecruiterProvider: ZipRecruiterProvider,
    private readonly simplyHiredProvider: SimplyHiredProvider,
    private readonly joobleProvider: JoobleProvider,
    private readonly adzunaProvider: AdzunaProvider,
    // Niche / Regional Aggregators
    private readonly careerJetProvider: CareerJetProvider,
    private readonly talentProvider: TalentProvider,
    // Tech-Focused Aggregators
    private readonly diceProvider: DiceProvider,
  ) {}

  async onModuleInit() {
    // Register all providers - General Job Aggregators
    this.registerProvider(this.indeedProvider);
    this.registerProvider(this.linkedInProvider);
    this.registerProvider(this.glassdoorProvider);
    this.registerProvider(this.zipRecruiterProvider);
    this.registerProvider(this.simplyHiredProvider);
    this.registerProvider(this.joobleProvider);
    this.registerProvider(this.adzunaProvider);

    // Niche / Regional Aggregators
    this.registerProvider(this.careerJetProvider);
    this.registerProvider(this.talentProvider);

    // Tech-Focused Aggregators
    this.registerProvider(this.diceProvider);

    this.logger.log(`Registered ${this.providers.size} job providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  registerProvider(provider: JobProvider): void {
    this.providers.set(provider.getName(), provider);
  }

  getProvider(name: string): JobProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): JobProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Run aggregation for all providers
   */
  async aggregateAll(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
  }): Promise<AggregationSummary> {
    if (this.isRunning) {
      throw new Error('Aggregation already in progress');
    }

    this.isRunning = true;
    const startTime = new Date();
    const results: AggregationResult[] = [];

    try {
      for (const provider of this.providers.values()) {
        try {
          const result = await this.aggregateFromProvider(provider, params);
          results.push(result);
        } catch (error) {
          this.logger.error(`Error aggregating from ${provider.getName()}: ${error.message}`);
          results.push({
            provider: provider.getName(),
            jobsFound: 0,
            jobsInserted: 0,
            jobsUpdated: 0,
            errors: [error.message],
          });
        }
      }
    } finally {
      this.isRunning = false;
    }

    const endTime = new Date();

    return {
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      results,
      totalJobsProcessed: results.reduce((sum, r) => sum + r.jobsFound, 0),
      totalJobsInserted: results.reduce((sum, r) => sum + r.jobsInserted, 0),
      totalJobsUpdated: results.reduce((sum, r) => sum + r.jobsUpdated, 0),
    };
  }

  /**
   * Aggregate jobs from a specific provider
   */
  async aggregateFromProvider(
    provider: JobProvider,
    params?: {
      keywords?: string;
      location?: string;
      limit?: number;
      page?: number;
    },
  ): Promise<AggregationResult> {
    const providerName = provider.getName();
    this.logger.log(`Starting aggregation from ${providerName}`);

    const result: AggregationResult = {
      provider: providerName,
      jobsFound: 0,
      jobsInserted: 0,
      jobsUpdated: 0,
      errors: [],
    };

    try {
      // Fetch jobs from provider
      const rawJobs = await provider.fetchJobs(params);
      result.jobsFound = rawJobs.length;

      this.logger.log(`Found ${rawJobs.length} jobs from ${providerName}`);

      // Process each job
      for (const rawJob of rawJobs) {
        try {
          const { inserted, updated } = await this.upsertJob(provider, rawJob);
          if (inserted) {result.jobsInserted++;}
          if (updated) {result.jobsUpdated++;}
        } catch (error) {
          this.logger.warn(`Error processing job ${rawJob.external_id}: ${error.message}`);
          result.errors.push(`Job ${rawJob.external_id}: ${error.message}`);
        }
      }

      this.logger.log(
        `${providerName} aggregation complete: ${result.jobsInserted} inserted, ${result.jobsUpdated} updated`,
      );
    } catch (error) {
      this.logger.error(`Provider ${providerName} failed: ${error.message}`);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Upsert a job from raw data
   */
  private async upsertJob(
    provider: JobProvider,
    rawJob: RawJobData,
  ): Promise<{ inserted: boolean; updated: boolean }> {
    // Normalize the job data
    const jobData = provider.normalizeJob(rawJob);

    // Check if job already exists
    const existingJob = await this.jobRepository.findOne({
      where: {
        source: jobData.source,
        external_id: jobData.external_id,
      },
    });

    if (existingJob) {
      // Update existing job
      Object.assign(existingJob, {
        ...jobData,
        updated_at: new Date(),
      });
      await this.jobRepository.save(existingJob);
      return { inserted: false, updated: true };
    }

    // Insert new job
    const newJob = this.jobRepository.create(jobData);
    await this.jobRepository.save(newJob);
    return { inserted: true, updated: false };
  }

  /**
   * Search jobs across all providers in real-time (with caching)
   */
  async searchAllProviders(params: {
    keywords: string;
    location?: string;
    limit?: number;
    skipCache?: boolean;
  }): Promise<RawJobData[]> {
    const results: RawJobData[] = [];
    const limitPerProvider = Math.ceil((params.limit || 30) / this.providers.size);

    const promises = Array.from(this.providers.values()).map(async (provider) => {
      const providerName = provider.getName();

      try {
        // Check cache first (unless skipCache is true)
        if (!params.skipCache) {
          const cached = await this.cacheService.getSearchResults(providerName, {
            keywords: params.keywords,
            location: params.location,
            page: 1,
          });

          if (cached) {
            this.logger.debug(`Using cached results for ${providerName}`);
            return cached.slice(0, limitPerProvider);
          }
        }

        // Fetch from provider
        const jobs = await provider.fetchJobs({
          ...params,
          limit: limitPerProvider,
        });

        // Cache the results
        if (jobs.length > 0) {
          await this.cacheService.setSearchResults(providerName, {
            keywords: params.keywords,
            location: params.location,
            page: 1,
          }, jobs);
        }

        return jobs;
      } catch (error) {
        this.logger.warn(`Search failed for ${providerName}: ${error.message}`);
        return [];
      }
    });

    const allResults = await Promise.all(promises);
    allResults.forEach(jobs => results.push(...jobs));

    // Sort by posted date (newest first) and limit
    return results
      .sort((a, b) => {
        const dateA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const dateB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, params.limit || 30);
  }

  /**
   * Check health of all providers (with caching)
   */
  async checkProvidersHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      try {
        // Check cached health status first
        const cachedHealth = await this.cacheService.getProviderHealth(name);
        if (cachedHealth !== null) {
          health[name] = cachedHealth;
          continue;
        }

        // Perform actual health check
        const isHealthy = await provider.healthCheck();
        health[name] = isHealthy;

        // Cache the result
        await this.cacheService.setProviderHealth(name, isHealthy);
      } catch {
        health[name] = false;
        await this.cacheService.setProviderHealth(name, false);
      }
    }

    return health;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    isConnected: boolean;
    keyCount: number;
    memoryUsage: string;
  }> {
    return this.cacheService.getStats();
  }

  /**
   * Clear all aggregator cache
   */
  async clearCache(): Promise<void> {
    await this.cacheService.clearAllCache();
    this.logger.log('Aggregator cache cleared');
  }

  /**
   * Scheduled job aggregation - runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledAggregation() {
    this.logger.log('Starting scheduled job aggregation');

    const searchTerms = [
      'software engineer',
      'frontend developer',
      'backend developer',
      'full stack developer',
      'data scientist',
      'devops engineer',
      'product manager',
      'ux designer',
    ];

    const locations = [
      'United States',
      'Remote',
      'New York',
      'San Francisco',
      'Seattle',
      'Austin',
    ];

    for (const keywords of searchTerms) {
      for (const location of locations.slice(0, 3)) {
        try {
          await this.aggregateAll({
            keywords,
            location,
            limit: 50,
          });

          // Rate limiting between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          this.logger.error(`Scheduled aggregation failed for "${keywords}" in "${location}": ${error.message}`);
        }
      }
    }

    this.logger.log('Scheduled job aggregation completed');
  }

  /**
   * Cleanup expired jobs - runs daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredJobs() {
    this.logger.log('Starting expired jobs cleanup');

    const result = await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({ is_active: false })
      .where('expires_at IS NOT NULL AND expires_at < :now', { now: new Date() })
      .andWhere('is_active = :active', { active: true })
      .execute();

    this.logger.log(`Deactivated ${result.affected} expired jobs`);

    // Also deactivate very old jobs without expiry date (> 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const oldJobsResult = await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({ is_active: false })
      .where('posted_at < :cutoff', { cutoff: sixtyDaysAgo })
      .andWhere('expires_at IS NULL')
      .andWhere('is_active = :active', { active: true })
      .execute();

    this.logger.log(`Deactivated ${oldJobsResult.affected} old jobs without expiry`);
  }

  /**
   * Get aggregation statistics
   */
  async getStatistics(): Promise<{
    totalJobs: number;
    activeJobs: number;
    jobsBySource: Record<string, number>;
    jobsByRemoteType: Record<string, number>;
    recentJobs24h: number;
    recentJobs7d: number;
  }> {
    const totalJobs = await this.jobRepository.count();
    const activeJobs = await this.jobRepository.count({ where: { is_active: true } });

    const jobsBySource = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.source')
      .getRawMany();

    const jobsByRemoteType = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.remote_type', 'remote_type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.remote_type')
      .getRawMany();

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentJobs24h = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.created_at > :cutoff', { cutoff: oneDayAgo })
      .getCount();

    const recentJobs7d = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.created_at > :cutoff', { cutoff: sevenDaysAgo })
      .getCount();

    return {
      totalJobs,
      activeJobs,
      jobsBySource: Object.fromEntries(jobsBySource.map(j => [j.source, parseInt(j.count)])),
      jobsByRemoteType: Object.fromEntries(jobsByRemoteType.map(j => [j.remote_type, parseInt(j.count)])),
      recentJobs24h,
      recentJobs7d,
    };
  }
}
