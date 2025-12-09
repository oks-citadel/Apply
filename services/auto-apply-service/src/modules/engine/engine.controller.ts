import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EngineService } from './engine.service';
import { ApplicationsService } from '../applications/applications.service';
import { QueueService } from '../queue/queue.service';
import {
  StartApplicationDto,
  BatchApplicationDto,
  RetryApplicationDto,
} from './dto/start-application.dto';
import {
  StartApplicationResponseDto,
  BatchApplicationResponseDto,
  ApplicationStatusResponseDto,
  RetryApplicationResponseDto,
  ApplicationStatusEnum,
  QueueStatusEnum,
} from './dto/application-status.dto';
import { JobData, UserProfile, Resume, CoverLetter } from './interfaces/engine.interface';
import { ApplicationStatus, ApplicationSource } from '../applications/entities/application.entity';

@Controller('engine')
export class EngineController {
  private readonly logger = new Logger(EngineController.name);

  constructor(
    private readonly engineService: EngineService,
    private readonly applicationsService: ApplicationsService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * POST /engine/apply - Start auto-apply for a single job
   */
  @Post('apply')
  @HttpCode(HttpStatus.ACCEPTED)
  async startApplication(
    @Body() dto: StartApplicationDto,
  ): Promise<StartApplicationResponseDto> {
    this.logger.log(`Starting application for user ${dto.userId}, job ${dto.jobId}`);

    try {
      // TODO: Fetch job data from job service
      // For now, using placeholder
      const job: JobData = await this.fetchJobData(dto.jobId);

      // TODO: Fetch user profile from user service
      const userProfile: UserProfile = await this.fetchUserProfile(dto.userId);

      // Validate eligibility
      const eligibility = await this.engineService.validateJobEligibility(job, userProfile);

      if (!eligibility.eligible) {
        throw new BadRequestException({
          message: 'User does not meet job requirements',
          reasons: eligibility.reasons,
          missingRequirements: eligibility.missingRequirements,
        });
      }

      this.logger.log(`Eligibility check passed with score: ${eligibility.score}`);

      // Get or select resume
      let resume: Resume;
      if (dto.resumeId) {
        resume = await this.fetchResume(dto.resumeId, dto.userId);
      } else if (dto.autoSelectResume) {
        const resumes = await this.fetchUserResumes(dto.userId);
        const selection = await this.engineService.selectBestResume(job, resumes);
        resume = selection.selectedResume;
        this.logger.log(`Auto-selected resume ${resume.id} with score ${selection.matchScore}`);
      } else {
        throw new BadRequestException('Either resumeId or autoSelectResume must be provided');
      }

      // Get cover letter if provided
      let coverLetter: CoverLetter | undefined;
      if (dto.coverLetterId) {
        coverLetter = await this.fetchCoverLetter(dto.coverLetterId, dto.userId);
      }

      // Create application record
      const application = await this.applicationsService.create({
        user_id: dto.userId,
        job_id: dto.jobId,
        resume_id: resume.id,
        cover_letter_id: coverLetter?.id,
        auto_applied: true,
        company_name: job.company,
        position_title: job.title,
        application_url: job.url,
        ats_platform: job.atsType,
        source: ApplicationSource.AUTO_APPLY,
      });

      this.logger.log(`Created application record: ${application.id}`);

      // Prepare application data
      const preparedApplication = await this.engineService.prepareApplication(
        job,
        resume,
        userProfile,
        coverLetter,
      );

      // Add to queue for async processing
      const queueJob = await this.queueService.addApplicationJob({
        applicationId: application.id,
        userId: dto.userId,
        jobId: dto.jobId,
        jobData: job,
        applicationData: preparedApplication,
        priority: dto.priority || 5,
        metadata: dto.metadata,
      });

      // Update application with queue status
      await this.applicationsService.update(application.id, {
        user_id: dto.userId,
        queue_status: 'waiting',
      });

      this.logger.log(`Application queued successfully: ${application.id}`);

      return {
        applicationId: application.id,
        jobId: dto.jobId,
        userId: dto.userId,
        status: ApplicationStatusEnum.QUEUED,
        queueStatus: QueueStatusEnum.WAITING,
        message: 'Application queued successfully',
        scheduledAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error starting application: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /engine/batch-apply - Batch apply to multiple jobs
   */
  @Post('batch-apply')
  @HttpCode(HttpStatus.ACCEPTED)
  async batchApply(
    @Body() dto: BatchApplicationDto,
  ): Promise<BatchApplicationResponseDto> {
    this.logger.log(`Starting batch application for user ${dto.userId}, ${dto.jobIds.length} jobs`);

    const queuedApplications: Array<{ jobId: string; queueItemId: string; scheduledAt: Date }> = [];
    const rejectedApplications: Array<{ jobId: string; reason: string }> = [];

    // Fetch user profile once
    const userProfile = await this.fetchUserProfile(dto.userId);

    // Get or select resume once
    let resume: Resume;
    if (dto.resumeId) {
      resume = await this.fetchResume(dto.resumeId, dto.userId);
    } else if (dto.autoSelectResume) {
      const resumes = await this.fetchUserResumes(dto.userId);
      if (resumes.length === 0) {
        throw new BadRequestException('No resumes found for user');
      }
      // Use the first resume or primary for batch applications
      resume = resumes.find(r => r.isPrimary) || resumes[0];
      this.logger.log(`Using resume ${resume.id} for batch application`);
    } else {
      throw new BadRequestException('Either resumeId or autoSelectResume must be provided');
    }

    // Get cover letter if provided
    let coverLetter: CoverLetter | undefined;
    if (dto.coverLetterId) {
      coverLetter = await this.fetchCoverLetter(dto.coverLetterId, dto.userId);
    }

    // Process each job
    const delayBetween = dto.schedule?.delayBetween || 60000; // Default 1 minute
    let currentDelay = 0;

    for (const jobId of dto.jobIds) {
      try {
        // Fetch job data
        const job = await this.fetchJobData(jobId);

        // Validate eligibility
        const eligibility = await this.engineService.validateJobEligibility(job, userProfile);

        if (!eligibility.eligible) {
          rejectedApplications.push({
            jobId,
            reason: `Eligibility check failed: ${eligibility.missingRequirements?.join(', ') || 'Requirements not met'}`,
          });
          continue;
        }

        // Create application record
        const application = await this.applicationsService.create({
          user_id: dto.userId,
          job_id: jobId,
          resume_id: resume.id,
          cover_letter_id: coverLetter?.id,
          auto_applied: true,
          company_name: job.company,
          position_title: job.title,
          application_url: job.url,
          ats_platform: job.atsType,
          source: ApplicationSource.AUTO_APPLY,
        });

        // Prepare application data
        const preparedApplication = await this.engineService.prepareApplication(
          job,
          resume,
          userProfile,
          coverLetter,
        );

        // Calculate scheduled time with delay
        const scheduledAt = new Date(Date.now() + currentDelay);

        // Add to queue
        const queueJob = await this.queueService.addApplicationJob({
          applicationId: application.id,
          userId: dto.userId,
          jobId,
          jobData: job,
          applicationData: preparedApplication,
          priority: dto.priority || 5,
          delay: currentDelay,
          metadata: dto.metadata,
        });

        // Update application with queue status
        await this.applicationsService.update(application.id, {
          user_id: dto.userId,
          queue_status: 'waiting',
        });

        queuedApplications.push({
          jobId,
          queueItemId: queueJob.id.toString(),
          scheduledAt,
        });

        // Increment delay for next job
        currentDelay += delayBetween;
      } catch (error) {
        this.logger.error(`Error processing job ${jobId}: ${error.message}`);
        rejectedApplications.push({
          jobId,
          reason: error.message,
        });
      }
    }

    this.logger.log(
      `Batch application completed: ${queuedApplications.length} queued, ${rejectedApplications.length} rejected`
    );

    return {
      totalJobs: dto.jobIds.length,
      queued: queuedApplications.length,
      rejected: rejectedApplications.length,
      queuedApplications,
      rejectedApplications,
    };
  }

  /**
   * GET /engine/status/:applicationId - Check application status
   */
  @Get('status/:applicationId')
  async getStatus(
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationStatusResponseDto> {
    this.logger.log(`Getting status for application ${applicationId}`);

    const statusInfo = await this.engineService.getApplicationStatus(applicationId);

    return {
      applicationId: statusInfo.applicationId,
      jobId: statusInfo.jobId,
      userId: statusInfo.userId,
      status: statusInfo.status,
      queueStatus: statusInfo.queueStatus,
      progress: statusInfo.progress,
      result: statusInfo.result,
      retryInfo: statusInfo.retryInfo,
      timestamps: statusInfo.timestamps,
      error: statusInfo.error,
    };
  }

  /**
   * POST /engine/retry/:applicationId - Retry failed application
   */
  @Post('retry/:applicationId')
  @HttpCode(HttpStatus.ACCEPTED)
  async retryApplication(
    @Param('applicationId') applicationId: string,
    @Body() dto: RetryApplicationDto,
  ): Promise<RetryApplicationResponseDto> {
    this.logger.log(`Retrying application ${applicationId}`);

    try {
      // Get application
      const application = await this.applicationsService.findOne(applicationId);

      if (!application) {
        throw new NotFoundException(`Application ${applicationId} not found`);
      }

      // Verify user owns this application
      if (application.user_id !== dto.userId) {
        throw new BadRequestException('Application does not belong to this user');
      }

      // Check if application is in a retryable state
      if (application.status === ApplicationStatus.APPLIED) {
        throw new BadRequestException('Application already completed successfully');
      }

      // Check retry count
      if (application.retry_count >= 3 && !dto.force) {
        throw new BadRequestException('Maximum retry attempts reached. Use force=true to override.');
      }

      // Fetch required data
      const job = await this.fetchJobData(application.job_id);
      const userProfile = await this.fetchUserProfile(application.user_id);
      const resume = await this.fetchResume(application.resume_id, application.user_id);

      let coverLetter: CoverLetter | undefined;
      if (application.cover_letter_id) {
        coverLetter = await this.fetchCoverLetter(application.cover_letter_id, application.user_id);
      }

      // Prepare application data
      const preparedApplication = await this.engineService.prepareApplication(
        job,
        resume,
        userProfile,
        coverLetter,
      );

      // Re-add to queue
      const queueJob = await this.queueService.addApplicationJob({
        applicationId: application.id,
        userId: application.user_id,
        jobId: application.job_id,
        jobData: job,
        applicationData: preparedApplication,
        priority: 8, // Higher priority for retries
        metadata: {
          ...dto.overrides,
          isRetry: true,
          retryCount: application.retry_count + 1,
        },
      });

      // Update application status
      await this.applicationsService.update(application.id, {
        user_id: dto.userId,
        queue_status: 'waiting',
      });

      this.logger.log(`Application ${applicationId} requeued for retry`);

      return {
        applicationId: application.id,
        success: true,
        message: 'Application queued for retry',
        newStatus: ApplicationStatusEnum.QUEUED,
        retryCount: application.retry_count + 1,
      };
    } catch (error) {
      this.logger.error(`Error retrying application: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods to fetch data (these would integrate with other services)
  private async fetchJobData(jobId: string): Promise<JobData> {
    // TODO: Integrate with job service
    // For now, return mock data
    this.logger.warn(`fetchJobData using mock data for job ${jobId}`);
    return {
      id: jobId,
      title: 'Software Engineer',
      company: 'Tech Company',
      url: 'https://example.com/jobs/123',
      description: 'Great opportunity for a software engineer',
      requirements: ['5+ years of experience', 'JavaScript', 'TypeScript'],
      location: 'Remote',
      atsType: 'workday',
    };
  }

  private async fetchUserProfile(userId: string): Promise<UserProfile> {
    // TODO: Integrate with user service
    this.logger.warn(`fetchUserProfile using mock data for user ${userId}`);
    return {
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      yearsOfExperience: 5,
      skills: ['JavaScript', 'TypeScript', 'Node.js', 'React'],
      preferences: {
        workAuthorization: true,
        requiresSponsorship: false,
        availability: '2 weeks notice',
      },
    };
  }

  private async fetchResume(resumeId: string, userId: string): Promise<Resume> {
    // TODO: Integrate with resume service
    this.logger.warn(`fetchResume using mock data for resume ${resumeId}`);
    return {
      id: resumeId,
      userId,
      fileName: 'resume.pdf',
      filePath: `/uploads/resumes/${resumeId}.pdf`,
      title: 'Software Engineer Resume',
      isPrimary: true,
      skills: ['JavaScript', 'TypeScript', 'Node.js'],
      experience: ['Software Engineer', 'Full Stack Developer'],
      education: ['BS Computer Science'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async fetchUserResumes(userId: string): Promise<Resume[]> {
    // TODO: Integrate with resume service
    this.logger.warn(`fetchUserResumes using mock data for user ${userId}`);
    return [
      {
        id: 'resume-1',
        userId,
        fileName: 'resume.pdf',
        filePath: `/uploads/resumes/resume-1.pdf`,
        title: 'Software Engineer Resume',
        isPrimary: true,
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
        experience: ['Software Engineer'],
        education: ['BS Computer Science'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private async fetchCoverLetter(coverLetterId: string, userId: string): Promise<CoverLetter> {
    // TODO: Integrate with cover letter service
    this.logger.warn(`fetchCoverLetter using mock data for cover letter ${coverLetterId}`);
    return {
      id: coverLetterId,
      userId,
      fileName: 'cover-letter.pdf',
      filePath: `/uploads/cover-letters/${coverLetterId}.pdf`,
      title: 'Generic Cover Letter',
      isTemplate: false,
      createdAt: new Date(),
    };
  }
}
