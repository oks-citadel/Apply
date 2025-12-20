import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { ILike } from 'typeorm';

import { Job } from './entities/job.entity';
import { SavedJob } from './entities/saved-job.entity';


import type { SaveJobDto, UpdateSavedJobDto } from './dto/save-job.dto';
import type { SearchJobsDto, PaginatedJobsResponseDto, JobResponseDto } from './dto/search-jobs.dto';
import type { RedisCacheService } from '../../common/cache';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import type { Repository} from 'typeorm';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(SavedJob)
    private readonly savedJobRepository: Repository<SavedJob>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Optional() private readonly cacheService: RedisCacheService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL');
    this.logger.log('JobsService initialized with Redis caching enabled');
  }

  /**
   * Search jobs with database (ES disabled) - with Redis caching
   */
  async searchJobs(
    searchDto: SearchJobsDto,
    userId?: string,
  ): Promise<PaginatedJobsResponseDto> {
    try {
      this.logger.log(`Searching jobs with filters: ${JSON.stringify(searchDto)}`);

      const page = searchDto.page || 1;
      const limit = searchDto.limit || 20;

      // Try to get from cache first (only for non-user-specific searches)
      // We don't cache user-specific results since they include saved status
      if (this.cacheService && !userId) {
        const cached = await this.cacheService.getSearchResults<PaginatedJobsResponseDto>(searchDto);
        if (cached) {
          this.logger.debug('Returning cached search results');
          return cached;
        }
      }

      // Build database query (fallback from Elasticsearch)
      const queryBuilder = this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.company', 'company')
        .where('job.is_active = :isActive', { isActive: true });

      // Apply search keywords if provided
      if (searchDto.keywords) {
        queryBuilder.andWhere(
          '(LOWER(job.title) LIKE LOWER(:keywords) OR LOWER(job.description) LIKE LOWER(:keywords) OR LOWER(job.company_name) LIKE LOWER(:keywords))',
          { keywords: `%${searchDto.keywords}%` },
        );
      }

      // Apply location filter
      if (searchDto.location) {
        queryBuilder.andWhere('LOWER(job.location) LIKE LOWER(:location)', {
          location: `%${searchDto.location}%`,
        });
      }

      // Apply employment type filter
      if (searchDto.employment_type) {
        queryBuilder.andWhere('job.employment_type = :employmentType', { employmentType: searchDto.employment_type });
      }

      // Apply experience level filter
      if (searchDto.experience_level) {
        queryBuilder.andWhere('job.experience_level = :expLevel', { expLevel: searchDto.experience_level });
      }

      // Apply remote type filter
      if (searchDto.remote_type) {
        queryBuilder.andWhere('job.remote_type = :remoteType', { remoteType: searchDto.remote_type });
      }

      // Apply salary filter
      if (searchDto.salary_min) {
        queryBuilder.andWhere('job.salary_max >= :salaryMin', { salaryMin: searchDto.salary_min });
      }
      if (searchDto.salary_max) {
        queryBuilder.andWhere('job.salary_min <= :salaryMax', { salaryMax: searchDto.salary_max });
      }

      // Sorting
      const sortBy = searchDto.sort_by || 'posted_at';
      const sortOrder = searchDto.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      queryBuilder.orderBy(`job.${sortBy}`, sortOrder);

      // Pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [jobs, total] = await queryBuilder.getManyAndCount();

      // Get saved job IDs for this user
      let savedJobIds: string[] = [];
      if (userId) {
        const savedJobs = await this.savedJobRepository.find({
          where: { user_id: userId },
          select: ['job_id'],
        });
        savedJobIds = savedJobs.map(sj => sj.job_id);
      }

      // Map results and add saved flag
      const jobsWithSaved = jobs.map(job => ({
        ...job,
        saved: savedJobIds.includes(job.id),
      })) as JobResponseDto[];

      const result: PaginatedJobsResponseDto = {
        data: jobsWithSaved,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1,
        },
      };

      // Cache the results only for non-user-specific searches
      if (this.cacheService && !userId) {
        await this.cacheService.setSearchResults(searchDto, result);
        this.logger.debug('Cached search results');
      }

      return result;
    } catch (error) {
      this.logger.error(`Error searching jobs: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to search jobs');
    }
  }

  /**
   * Get job by ID - with Redis caching
   */
  async getJobById(jobId: string, userId?: string): Promise<JobResponseDto> {
    // Try to get from cache first (only base job data, not user-specific saved status)
    let job: Job | null = null;

    if (this.cacheService) {
      const cached = await this.cacheService.getJobDetail<Job>(jobId);
      if (cached) {
        this.logger.debug(`Cache hit for job ${jobId}`);
        job = cached;
      }
    }

    if (!job) {
      job = await this.jobRepository.findOne({
        where: { id: jobId, is_active: true },
        relations: ['company'],
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Cache the job for future requests
      if (this.cacheService) {
        await this.cacheService.setJobDetail(jobId, job);
        this.logger.debug(`Cached job ${jobId}`);
      }
    }

    // Increment view count asynchronously (don't await)
    this.jobRepository.update(jobId, {
      view_count: () => 'view_count + 1',
    }).catch(err => this.logger.error(`Error incrementing view count: ${err.message}`));

    // Check if saved (user-specific, not cached)
    let saved = false;
    if (userId) {
      const savedJob = await this.savedJobRepository.findOne({
        where: { user_id: userId, job_id: jobId },
      });
      saved = !!savedJob;
    }

    return {
      ...job,
      saved,
    } as JobResponseDto;
  }

  /**
   * Get recommended jobs for user based on profile - with Redis caching
   */
  async getRecommendedJobs(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobsResponseDto> {
    try {
      this.logger.log(`Getting recommended jobs for user: ${userId}`);

      // Try to get from cache first
      if (this.cacheService) {
        const cached = await this.cacheService.getRecommendedJobs<PaginatedJobsResponseDto>(userId, page, limit);
        if (cached) {
          this.logger.debug('Returning cached recommended jobs');
          return cached;
        }
      }

      // Call AI service to get personalized recommendations
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/recommendations/jobs`,
          {
            user_id: userId,
            limit: limit * 2, // Get more to filter
          },
          {
            timeout: 10000,
          },
        ),
      );

      const recommendedJobIds = response.data.job_ids || [];

      if (recommendedJobIds.length === 0) {
        // Fallback to recent popular jobs
        return this.searchJobs({
          page,
          limit,
          sort_by: 'posted_at',
          sort_order: 'desc',
        }, userId);
      }

      // Fetch jobs by IDs
      const jobs = await this.jobRepository
        .createQueryBuilder('job')
        .where('job.id IN (:...ids)', { ids: recommendedJobIds })
        .andWhere('job.is_active = :isActive', { isActive: true })
        .leftJoinAndSelect('job.company', 'company')
        .take(limit)
        .skip((page - 1) * limit)
        .getMany();

      // Get saved job IDs
      const savedJobs = await this.savedJobRepository.find({
        where: { user_id: userId },
        select: ['job_id'],
      });
      const savedJobIds = savedJobs.map(sj => sj.job_id);

      const jobsWithSaved = jobs.map(job => ({
        ...job,
        saved: savedJobIds.includes(job.id),
      })) as JobResponseDto[];

      const result: PaginatedJobsResponseDto = {
        data: jobsWithSaved,
        pagination: {
          page,
          limit,
          total: recommendedJobIds.length,
          total_pages: Math.ceil(recommendedJobIds.length / limit),
          has_next: page * limit < recommendedJobIds.length,
          has_prev: page > 1,
        },
      };

      // Cache the results with short TTL (2 minutes for personalized content)
      if (this.cacheService) {
        await this.cacheService.setRecommendedJobs(userId, page, limit, result);
        this.logger.debug('Cached recommended jobs');
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting recommended jobs: ${error.message}`, error.stack);
      // Fallback to recent jobs
      return this.searchJobs({
        page,
        limit,
        sort_by: 'posted_at',
        sort_order: 'desc',
      }, userId);
    }
  }

  /**
   * Save job to favorites - invalidates user cache
   */
  async saveJob(userId: string, jobId: string, saveJobDto: SaveJobDto): Promise<SavedJob> {
    // Check if job exists
    const job = await this.jobRepository.findOne({
      where: { id: jobId, is_active: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if already saved
    const existingSave = await this.savedJobRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (existingSave) {
      throw new BadRequestException('Job already saved');
    }

    // Create saved job
    const savedJob = this.savedJobRepository.create({
      user_id: userId,
      job_id: jobId,
      ...saveJobDto,
    });

    await this.savedJobRepository.save(savedJob);

    // Increment save count
    await this.jobRepository.update(jobId, {
      save_count: () => 'save_count + 1',
    });

    // Invalidate user's saved jobs cache
    if (this.cacheService) {
      await this.cacheService.invalidateUserCache(userId);
      this.logger.debug(`Invalidated cache for user ${userId} after saving job`);
    }

    return savedJob;
  }

  /**
   * Remove job from favorites - invalidates user cache
   */
  async unsaveJob(userId: string, jobId: string): Promise<void> {
    const savedJob = await this.savedJobRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (!savedJob) {
      throw new NotFoundException('Saved job not found');
    }

    await this.savedJobRepository.remove(savedJob);

    // Decrement save count
    await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({ save_count: () => 'GREATEST(save_count - 1, 0)' })
      .where('id = :jobId', { jobId })
      .execute();

    // Invalidate user's saved jobs cache
    if (this.cacheService) {
      await this.cacheService.invalidateUserCache(userId);
      this.logger.debug(`Invalidated cache for user ${userId} after unsaving job`);
    }
  }

  /**
   * Get user's saved jobs - with Redis caching
   */
  async getSavedJobs(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobsResponseDto> {
    // Try to get from cache first
    if (this.cacheService) {
      const cached = await this.cacheService.getSavedJobs<PaginatedJobsResponseDto>(userId, page, limit);
      if (cached) {
        this.logger.debug('Returning cached saved jobs');
        return cached;
      }
    }

    const [savedJobs, total] = await this.savedJobRepository.findAndCount({
      where: { user_id: userId },
      relations: ['job', 'job.company'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const jobs = savedJobs
      .filter(sj => sj.job && sj.job.is_active)
      .map(sj => ({
        ...sj.job,
        saved: true,
      })) as JobResponseDto[];

    const result: PaginatedJobsResponseDto = {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };

    // Cache the results
    if (this.cacheService) {
      await this.cacheService.setSavedJobs(userId, page, limit, result);
      this.logger.debug('Cached saved jobs');
    }

    return result;
  }

  /**
   * Update saved job - invalidates user cache
   */
  async updateSavedJob(
    userId: string,
    jobId: string,
    updateDto: UpdateSavedJobDto,
  ): Promise<SavedJob> {
    const savedJob = await this.savedJobRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (!savedJob) {
      throw new NotFoundException('Saved job not found');
    }

    Object.assign(savedJob, updateDto);

    // Update applied_at if status changed to applied
    if (updateDto.status === 'applied' && !savedJob.applied_at) {
      savedJob.applied_at = new Date();
    }

    const result = await this.savedJobRepository.save(savedJob);

    // Invalidate user's saved jobs cache
    if (this.cacheService) {
      await this.cacheService.invalidateUserCache(userId);
      this.logger.debug(`Invalidated cache for user ${userId} after updating saved job`);
    }

    return result;
  }

  /**
   * Get match score between job and user's resume
   */
  async getMatchScore(jobId: string, userId: string): Promise<{ match_score: number; reasons: string[] }> {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId, is_active: true },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Call AI service to calculate match score
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/matching/job-match`,
          {
            job_id: jobId,
            user_id: userId,
            job_requirements: job.requirements,
            job_skills: job.skills,
            job_description: job.description,
          },
          {
            timeout: 10000,
          },
        ),
      );

      return {
        match_score: response.data.match_score || 0,
        reasons: response.data.reasons || [],
      };
    } catch (error) {
      this.logger.error(`Error calculating match score: ${error.message}`, error.stack);
      return {
        match_score: 0,
        reasons: ['Unable to calculate match score at this time'],
      };
    }
  }

  /**
   * Get similar jobs (using database since ES disabled) - with Redis caching
   */
  async getSimilarJobs(
    jobId: string,
    limit: number = 10,
  ): Promise<JobResponseDto[]> {
    // Try to get from cache first
    if (this.cacheService) {
      const cached = await this.cacheService.getSimilarJobs<JobResponseDto[]>(jobId, limit);
      if (cached) {
        this.logger.debug('Returning cached similar jobs');
        return cached;
      }
    }

    const job = await this.jobRepository.findOne({
      where: { id: jobId, is_active: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Database-based similar job search (ES disabled)
    // Find jobs with similar employment_type, experience_level, or location
    const similarJobs = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .where('job.id != :jobId', { jobId })
      .andWhere('job.is_active = :isActive', { isActive: true })
      .andWhere(
        '(job.employment_type = :employmentType OR job.experience_level = :expLevel OR LOWER(job.location) LIKE LOWER(:location))',
        {
          employmentType: job.employment_type,
          expLevel: job.experience_level,
          location: `%${job.location?.split(',')[0] || ''}%`,
        },
      )
      .orderBy('job.posted_at', 'DESC')
      .take(limit)
      .getMany();

    const result = similarJobs as JobResponseDto[];

    // Cache the results
    if (this.cacheService) {
      await this.cacheService.setSimilarJobs(jobId, limit, result);
      this.logger.debug('Cached similar jobs');
    }

    return result;
  }

  /**
   * Track job application - invalidates caches
   */
  async trackApplication(jobId: string, userId: string): Promise<void> {
    // Update saved job if exists
    const savedJob = await this.savedJobRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (savedJob && savedJob.status !== 'applied') {
      savedJob.status = 'applied';
      savedJob.applied_at = new Date();
      await this.savedJobRepository.save(savedJob);
    }

    // Increment application count
    await this.jobRepository.update(jobId, {
      application_count: () => 'application_count + 1',
    });

    // Invalidate user cache
    if (this.cacheService) {
      await this.cacheService.invalidateUserCache(userId);
    }

    this.logger.log(`Tracked application for job ${jobId} by user ${userId}`);
  }

  /**
   * Calculate match score between job and resume
   */
  async calculateMatchScore(
    jobId: string,
    resumeId: string,
    userId: string,
  ): Promise<any> {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId, is_active: true },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Call AI service for match calculation
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/matching/resume-job`,
          {
            job_id: jobId,
            resume_id: resumeId,
            user_id: userId,
            job_requirements: job.requirements,
            job_skills: job.skills,
            job_description: job.description,
            job_experience_level: job.experience_level,
          },
          { timeout: 10000 },
        ),
      );

      return {
        jobId,
        resumeId,
        overallScore: response.data.overall_score || 0,
        breakdown: response.data.breakdown || {
          skillsMatch: 0,
          experienceMatch: 0,
          educationMatch: 0,
          locationMatch: 0,
        },
        matchedSkills: response.data.matched_skills || [],
        missingSkills: response.data.missing_skills || [],
        recommendations: response.data.recommendations || [],
      };
    } catch (error) {
      this.logger.error(`Error calculating match score: ${error.message}`, error.stack);
      // Return default scores on error
      return {
        jobId,
        resumeId,
        overallScore: 0,
        breakdown: {
          skillsMatch: 0,
          experienceMatch: 0,
          educationMatch: 0,
          locationMatch: 0,
        },
        matchedSkills: [],
        missingSkills: [],
        recommendations: ['Unable to calculate match score. Please try again later.'],
      };
    }
  }

  /**
   * Get interview questions for a job
   */
  async getInterviewQuestions(jobId: string): Promise<any> {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId, is_active: true },
        relations: ['company'],
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Call AI service for interview questions
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/interview-prep/questions`,
          {
            job_title: job.title,
            job_description: job.description,
            required_skills: job.skills,
            experience_level: job.experience_level,
            company_name: job.company_name,
          },
          { timeout: 15000 },
        ),
      );

      return {
        technical: response.data.technical || [],
        behavioral: response.data.behavioral || [],
        companySpecific: response.data.company_specific || [],
      };
    } catch (error) {
      this.logger.error(`Error getting interview questions: ${error.message}`, error.stack);
      // Return default questions on error
      return {
        technical: [
          'Tell me about your experience with the technologies mentioned in the job description.',
          'Can you walk me through a challenging project you worked on?',
        ],
        behavioral: [
          'Tell me about a time when you had to work under pressure.',
          'Describe a situation where you had to learn a new technology quickly.',
        ],
        companySpecific: [
          'Why do you want to work for our company?',
          'What do you know about our products/services?',
        ],
      };
    }
  }

  /**
   * Predict salary based on job details
   */
  async predictSalary(salaryPredictionDto: any): Promise<any> {
    try {
      // Call AI service for salary prediction
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/salary/predict`,
          salaryPredictionDto,
          { timeout: 10000 },
        ),
      );

      return {
        predictedSalary: response.data.predicted_salary || {
          min: 0,
          max: 0,
          currency: 'USD',
          period: 'yearly',
        },
        confidence: response.data.confidence || 0,
        factors: response.data.factors || [],
        marketData: response.data.market_data || {
          averageSalary: 0,
          percentile25: 0,
          percentile50: 0,
          percentile75: 0,
          percentile90: 0,
        },
      };
    } catch (error) {
      this.logger.error(`Error predicting salary: ${error.message}`, error.stack);

      // Return estimate based on experience
      const baseMin = 50000;
      const baseMax = 70000;
      const experienceMultiplier = 1 + (salaryPredictionDto.experienceYears * 0.05);

      const min = Math.round(baseMin * experienceMultiplier);
      const max = Math.round(baseMax * experienceMultiplier);
      const avg = Math.round((min + max) / 2);

      return {
        predictedSalary: {
          min,
          max,
          currency: 'USD',
          period: 'yearly',
        },
        confidence: 50,
        factors: [
          {
            factor: 'Experience',
            impact: 'positive',
            description: `${salaryPredictionDto.experienceYears} years of experience`,
          },
          {
            factor: 'Location',
            impact: 'neutral',
            description: `Based on ${salaryPredictionDto.location}`,
          },
        ],
        marketData: {
          averageSalary: avg,
          percentile25: Math.round(avg * 0.85),
          percentile50: avg,
          percentile75: Math.round(avg * 1.15),
          percentile90: Math.round(avg * 1.3),
        },
      };
    }
  }

  /**
   * Report a job posting (ReportsService disabled - using stub)
   */
  async reportJob(jobId: string, reportJobDto: any, userId: string): Promise<any> {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // ReportsService disabled - log report for now
      this.logger.log(
        `Job ${jobId} reported by user ${userId}. Reason: ${reportJobDto.reason}, Details: ${reportJobDto.details}`,
      );

      // Generate a temporary report ID
      const tempReportId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        message: 'Job reported successfully. Our team will review it shortly.',
        reportId: tempReportId,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error reporting job: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to report job');
    }
  }

  /**
   * Get reports for a specific job (ReportsService disabled)
   */
  async getJobReports(jobId: string, page: number = 1, limit: number = 20): Promise<any> {
    // ReportsService disabled - return empty result
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }

  /**
   * Check if user has already reported a job (ReportsService disabled)
   */
  async hasUserReportedJob(userId: string, jobId: string): Promise<boolean> {
    // ReportsService disabled - always return false
    return false;
  }

  /**
   * Get report count for a job (ReportsService disabled)
   */
  async getJobReportCount(jobId: string): Promise<number> {
    // ReportsService disabled - return 0
    return 0;
  }

  // ==================== Cache Management Methods ====================

  /**
   * Create a new job - invalidates search cache
   */
  async createJob(createJobDto: Partial<Job>): Promise<Job> {
    const job = this.jobRepository.create(createJobDto);
    const savedJob = await this.jobRepository.save(job);

    // Invalidate search cache since new job was added
    if (this.cacheService) {
      await this.cacheService.invalidateSearchCache();
      this.logger.debug('Invalidated search cache after creating job');
    }

    return savedJob;
  }

  /**
   * Update a job - invalidates job and search cache
   */
  async updateJob(jobId: string, updateJobDto: Partial<Job>): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    Object.assign(job, updateJobDto);
    const updatedJob = await this.jobRepository.save(job);

    // Invalidate caches
    if (this.cacheService) {
      await this.cacheService.invalidateJobCache(jobId);
      this.logger.debug(`Invalidated cache for job ${jobId} after update`);
    }

    return updatedJob;
  }

  /**
   * Delete/deactivate a job - invalidates job and search cache
   */
  async deleteJob(jobId: string): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Soft delete by setting is_active to false
    job.is_active = false;
    await this.jobRepository.save(job);

    // Invalidate caches
    if (this.cacheService) {
      await this.cacheService.invalidateJobCache(jobId);
      this.logger.debug(`Invalidated cache for job ${jobId} after deletion`);
    }
  }

  /**
   * Get cache health status
   */
  async getCacheHealth(): Promise<{ healthy: boolean; stats: any }> {
    if (!this.cacheService) {
      return { healthy: false, stats: null };
    }

    const healthy = await this.cacheService.isHealthy();
    const stats = await this.cacheService.getStats();

    return { healthy, stats };
  }

  /**
   * Manually invalidate all job caches (admin operation)
   */
  async invalidateAllCaches(): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.invalidateAllJobCaches();
      this.logger.log('All job caches invalidated');
    }
  }
}
