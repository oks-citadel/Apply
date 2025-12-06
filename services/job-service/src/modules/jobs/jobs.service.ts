import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Job } from './entities/job.entity';
import { SavedJob } from './entities/saved-job.entity';
import { SearchService } from '../search/search.service';
import { SearchJobsDto, PaginatedJobsResponseDto, JobResponseDto } from './dto/search-jobs.dto';
import { SaveJobDto, UpdateSavedJobDto } from './dto/save-job.dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly aiServiceUrl: string;

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(SavedJob)
    private readonly savedJobRepository: Repository<SavedJob>,
    private readonly searchService: SearchService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL');
  }

  /**
   * Search jobs with Elasticsearch
   */
  async searchJobs(
    searchDto: SearchJobsDto,
    userId?: string,
  ): Promise<PaginatedJobsResponseDto> {
    try {
      this.logger.log(`Searching jobs with filters: ${JSON.stringify(searchDto)}`);

      // Use Elasticsearch for search
      const searchResults = await this.searchService.searchJobs(searchDto);

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
      const jobs = searchResults.hits.map(hit => ({
        ...hit,
        saved: savedJobIds.includes(hit.id),
      }));

      return {
        data: jobs,
        pagination: {
          page: searchDto.page,
          limit: searchDto.limit,
          total: searchResults.total,
          total_pages: Math.ceil(searchResults.total / searchDto.limit),
          has_next: searchDto.page * searchDto.limit < searchResults.total,
          has_prev: searchDto.page > 1,
        },
        facets: searchResults.facets,
      };
    } catch (error) {
      this.logger.error(`Error searching jobs: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to search jobs');
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string, userId?: string): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, is_active: true },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Increment view count asynchronously
    this.jobRepository.update(jobId, {
      view_count: () => 'view_count + 1',
    });

    // Check if saved
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
   * Get recommended jobs for user based on profile
   */
  async getRecommendedJobs(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobsResponseDto> {
    try {
      this.logger.log(`Getting recommended jobs for user: ${userId}`);

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

      return {
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
   * Save job to favorites
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

    return savedJob;
  }

  /**
   * Remove job from favorites
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
  }

  /**
   * Get user's saved jobs
   */
  async getSavedJobs(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedJobsResponseDto> {
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

    return {
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
  }

  /**
   * Update saved job
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

    return this.savedJobRepository.save(savedJob);
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
   * Get similar jobs
   */
  async getSimilarJobs(
    jobId: string,
    limit: number = 10,
  ): Promise<JobResponseDto[]> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, is_active: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Search for similar jobs using Elasticsearch
    const searchResults = await this.searchService.findSimilarJobs(job, limit);

    return searchResults.filter(j => j.id !== jobId);
  }

  /**
   * Track job application
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
   * Report a job posting
   */
  async reportJob(jobId: string, reportJobDto: any, userId: string): Promise<any> {
    try {
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // Log the report (in production, this would go to a reports table)
      this.logger.warn(
        `Job ${jobId} reported by user ${userId}. Reason: ${reportJobDto.reason}. Details: ${reportJobDto.details}`,
      );

      // TODO: Store in database reports table
      // await this.reportRepository.save({
      //   job_id: jobId,
      //   user_id: userId,
      //   reason: reportJobDto.reason,
      //   details: reportJobDto.details,
      // });

      return {
        message: 'Job reported successfully. Our team will review it shortly.',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error reporting job: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to report job');
    }
  }
}
