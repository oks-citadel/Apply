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
  UseGuards,
} from '@nestjs/common';
import { EngineService } from './engine.service';
import { ServiceClientService } from './service-client.service';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('engine')
@UseGuards(JwtAuthGuard)
export class EngineController {
  private readonly logger = new Logger(EngineController.name);

  constructor(
    private readonly engineService: EngineService,
    private readonly serviceClient: ServiceClientService,
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
    @User('id') userId: string,
  ): Promise<StartApplicationResponseDto> {
    // Override DTO userId with authenticated user ID to prevent impersonation
    dto.userId = userId;
    this.logger.log(`Starting application for user ${userId}, job ${dto.jobId}`);

    try {
      // Fetch job data from job service
      const job: JobData = await this.fetchJobData(dto.jobId);

      // Fetch user profile from user service
      const userProfile: UserProfile = await this.fetchUserProfile(userId);

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
        resume = await this.fetchResume(dto.resumeId, userId);
      } else if (dto.autoSelectResume) {
        const resumes = await this.fetchUserResumes(userId);
        const selection = await this.engineService.selectBestResume(job, resumes);
        resume = selection.selectedResume;
        this.logger.log(`Auto-selected resume ${resume.id} with score ${selection.matchScore}`);
      } else {
        throw new BadRequestException('Either resumeId or autoSelectResume must be provided');
      }

      // Get cover letter if provided
      let coverLetter: CoverLetter | undefined;
      if (dto.coverLetterId) {
        coverLetter = await this.fetchCoverLetter(dto.coverLetterId, userId);
      }

      // Create application record
      const application = await this.applicationsService.create({
        user_id: userId,
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
        userId: userId,
        jobId: dto.jobId,
        jobData: job,
        applicationData: preparedApplication,
        priority: dto.priority || 5,
        metadata: dto.metadata,
      });

      // Update application with queue status
      await this.applicationsService.update(application.id, {
        user_id: userId,
        queue_status: 'waiting',
      });

      this.logger.log(`Application queued successfully: ${application.id}`);

      return {
        applicationId: application.id,
        jobId: dto.jobId,
        userId: userId,
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
    @User('id') userId: string,
  ): Promise<BatchApplicationResponseDto> {
    // Override DTO userId with authenticated user ID to prevent impersonation
    dto.userId = userId;
    this.logger.log(`Starting batch application for user ${userId}, ${dto.jobIds.length} jobs`);

    const queuedApplications: Array<{ jobId: string; queueItemId: string; scheduledAt: Date }> = [];
    const rejectedApplications: Array<{ jobId: string; reason: string }> = [];

    // Fetch user profile once
    const userProfile = await this.fetchUserProfile(userId);

    // Get or select resume once
    let resume: Resume;
    if (dto.resumeId) {
      resume = await this.fetchResume(dto.resumeId, userId);
    } else if (dto.autoSelectResume) {
      const resumes = await this.fetchUserResumes(userId);
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
      coverLetter = await this.fetchCoverLetter(dto.coverLetterId, userId);
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
          user_id: userId,
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
          userId: userId,
          jobId,
          jobData: job,
          applicationData: preparedApplication,
          priority: dto.priority || 5,
          delay: currentDelay,
          metadata: dto.metadata,
        });

        // Update application with queue status
        await this.applicationsService.update(application.id, {
          user_id: userId,
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
    @User('id') userId: string,
  ): Promise<RetryApplicationResponseDto> {
    // Override DTO userId with authenticated user ID to prevent impersonation
    dto.userId = userId;
    this.logger.log(`Retrying application ${applicationId} for user ${userId}`);

    try {
      // Get application
      const application = await this.applicationsService.findOne(applicationId);

      if (!application) {
        throw new NotFoundException(`Application ${applicationId} not found`);
      }

      // Verify user owns this application
      if (application.user_id !== userId) {
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
        user_id: userId,
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

  // Helper methods to fetch data from external services
  private async fetchJobData(jobId: string): Promise<JobData> {
    try {
      this.logger.log(`Fetching job data for job ${jobId} from job-service`);
      const jobResponse = await this.serviceClient.getJob(jobId);

      // Map job-service response to JobData interface
      return {
        id: jobResponse.id,
        title: jobResponse.title,
        company: jobResponse.company?.name || jobResponse.company || 'Unknown Company',
        url: jobResponse.url || jobResponse.jobUrl || jobResponse.externalUrl,
        description: jobResponse.description,
        requirements: jobResponse.requirements || this.extractRequirements(jobResponse.description),
        location: jobResponse.location || 'Not specified',
        atsType: jobResponse.atsType || jobResponse.ats_type || 'generic',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch job data for ${jobId}: ${error.message}`);
      throw new NotFoundException(`Job ${jobId} not found or unavailable`);
    }
  }

  /**
   * Extract requirements from job description if not explicitly provided
   */
  private extractRequirements(description: string): string[] {
    if (!description) return [];

    // Simple extraction logic - can be enhanced
    const requirements: string[] = [];
    const lines = description.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for bullet points or requirement patterns
      if (trimmed.match(/^[-•*]\s+(.+)/) || trimmed.match(/^(Required|Must have):/i)) {
        requirements.push(trimmed.replace(/^[-•*]\s+/, ''));
      }
    }

    return requirements.length > 0 ? requirements : ['See job description'];
  }

  private async fetchUserProfile(userId: string): Promise<UserProfile> {
    try {
      this.logger.log(`Fetching user profile for user ${userId} from user-service`);
      const profileResponse = await this.serviceClient.getUserProfile(userId);

      // Map user-service response to UserProfile interface
      return {
        id: profileResponse.id || profileResponse.user_id || userId,
        firstName: profileResponse.firstName || profileResponse.first_name || '',
        lastName: profileResponse.lastName || profileResponse.last_name || '',
        email: profileResponse.email || '',
        phone: profileResponse.phone || profileResponse.phoneNumber || '',
        yearsOfExperience: profileResponse.yearsOfExperience ||
                           profileResponse.years_of_experience ||
                           this.calculateYearsOfExperience(profileResponse.workExperience),
        skills: this.extractSkills(profileResponse),
        preferences: {
          workAuthorization: profileResponse.preferences?.workAuthorization ??
                            profileResponse.work_authorization ?? true,
          requiresSponsorship: profileResponse.preferences?.requiresSponsorship ??
                              profileResponse.requires_sponsorship ?? false,
          availability: profileResponse.preferences?.availability ||
                       profileResponse.availability ||
                       'Immediate',
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch user profile for ${userId}: ${error.message}`);
      throw new NotFoundException(`User profile for ${userId} not found or unavailable`);
    }
  }

  /**
   * Extract skills from profile response
   */
  private extractSkills(profileResponse: any): string[] {
    if (Array.isArray(profileResponse.skills)) {
      return profileResponse.skills.map((skill: any) =>
        typeof skill === 'string' ? skill : skill.name || skill.skill_name
      );
    }
    return [];
  }

  /**
   * Calculate years of experience from work experience array
   */
  private calculateYearsOfExperience(workExperience: any[]): number {
    if (!Array.isArray(workExperience) || workExperience.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    for (const exp of workExperience) {
      const startDate = exp.startDate || exp.start_date;
      const endDate = exp.endDate || exp.end_date || new Date();

      if (startDate) {
        const start = new Date(startDate);
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalMonths += months;
      }
    }

    return Math.round(totalMonths / 12);
  }

  private async fetchResume(resumeId: string, userId: string): Promise<Resume> {
    try {
      this.logger.log(`Fetching resume ${resumeId} for user ${userId} from resume-service`);
      const resumeResponse = await this.serviceClient.getResume(resumeId, userId);

      // Map resume-service response to Resume interface
      return {
        id: resumeResponse.id,
        userId: resumeResponse.userId || resumeResponse.user_id || userId,
        fileName: resumeResponse.fileName || resumeResponse.file_name || 'resume.pdf',
        filePath: resumeResponse.filePath || resumeResponse.file_path || '',
        title: resumeResponse.title || 'Resume',
        isPrimary: resumeResponse.isPrimary ?? resumeResponse.is_primary ?? false,
        skills: this.extractResumeSkills(resumeResponse),
        experience: this.extractExperience(resumeResponse),
        education: this.extractEducation(resumeResponse),
        createdAt: resumeResponse.createdAt ? new Date(resumeResponse.createdAt) : new Date(),
        updatedAt: resumeResponse.updatedAt ? new Date(resumeResponse.updatedAt) : new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch resume ${resumeId}: ${error.message}`);
      throw new NotFoundException(`Resume ${resumeId} not found or unavailable`);
    }
  }

  /**
   * Extract skills from resume response
   */
  private extractResumeSkills(resumeResponse: any): string[] {
    if (Array.isArray(resumeResponse.skills)) {
      return resumeResponse.skills.map((skill: any) =>
        typeof skill === 'string' ? skill : skill.name || skill.skill_name
      );
    }

    // Check in sections
    if (resumeResponse.sections) {
      const skillsSection = resumeResponse.sections.find(
        (s: any) => s.type === 'skills' || s.section_type === 'skills'
      );
      if (skillsSection?.items) {
        return skillsSection.items.map((item: any) => item.name || item.skill);
      }
    }

    return [];
  }

  /**
   * Extract experience from resume response
   */
  private extractExperience(resumeResponse: any): string[] {
    if (Array.isArray(resumeResponse.experience)) {
      return resumeResponse.experience.map((exp: any) =>
        exp.title || exp.position || exp.job_title
      );
    }

    // Check in sections
    if (resumeResponse.sections) {
      const experienceSection = resumeResponse.sections.find(
        (s: any) => s.type === 'experience' || s.section_type === 'work_experience'
      );
      if (experienceSection?.items) {
        return experienceSection.items.map((item: any) =>
          item.title || item.position || item.job_title
        );
      }
    }

    return [];
  }

  /**
   * Extract education from resume response
   */
  private extractEducation(resumeResponse: any): string[] {
    if (Array.isArray(resumeResponse.education)) {
      return resumeResponse.education.map((edu: any) =>
        `${edu.degree || edu.degree_type || ''} ${edu.fieldOfStudy || edu.field_of_study || ''}`.trim()
      );
    }

    // Check in sections
    if (resumeResponse.sections) {
      const educationSection = resumeResponse.sections.find(
        (s: any) => s.type === 'education' || s.section_type === 'education'
      );
      if (educationSection?.items) {
        return educationSection.items.map((item: any) =>
          `${item.degree || item.degree_type || ''} ${item.field || item.field_of_study || ''}`.trim()
        );
      }
    }

    return [];
  }

  private async fetchUserResumes(userId: string): Promise<Resume[]> {
    try {
      this.logger.log(`Fetching all resumes for user ${userId} from resume-service`);
      const resumesResponse = await this.serviceClient.getUserResumes(userId);

      // Map each resume to Resume interface
      return resumesResponse.map((resumeResponse: any) => ({
        id: resumeResponse.id,
        userId: resumeResponse.userId || resumeResponse.user_id || userId,
        fileName: resumeResponse.fileName || resumeResponse.file_name || 'resume.pdf',
        filePath: resumeResponse.filePath || resumeResponse.file_path || '',
        title: resumeResponse.title || 'Resume',
        isPrimary: resumeResponse.isPrimary ?? resumeResponse.is_primary ?? false,
        skills: this.extractResumeSkills(resumeResponse),
        experience: this.extractExperience(resumeResponse),
        education: this.extractEducation(resumeResponse),
        createdAt: resumeResponse.createdAt ? new Date(resumeResponse.createdAt) : new Date(),
        updatedAt: resumeResponse.updatedAt ? new Date(resumeResponse.updatedAt) : new Date(),
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch resumes for user ${userId}: ${error.message}`);
      // Return empty array instead of throwing to allow graceful handling
      return [];
    }
  }

  private async fetchCoverLetter(coverLetterId: string, userId: string): Promise<CoverLetter> {
    try {
      this.logger.log(`Fetching cover letter ${coverLetterId} for user ${userId}`);
      const coverLetterResponse = await this.serviceClient.getCoverLetter(coverLetterId, userId);

      // Map cover letter response to CoverLetter interface
      return {
        id: coverLetterResponse.id,
        userId: coverLetterResponse.userId || coverLetterResponse.user_id || userId,
        fileName: coverLetterResponse.fileName || coverLetterResponse.file_name || 'cover-letter.pdf',
        filePath: coverLetterResponse.filePath || coverLetterResponse.file_path || '',
        title: coverLetterResponse.title || 'Cover Letter',
        isTemplate: coverLetterResponse.isTemplate ?? coverLetterResponse.is_template ?? false,
        createdAt: coverLetterResponse.createdAt ? new Date(coverLetterResponse.createdAt) : new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch cover letter ${coverLetterId}: ${error.message}`);
      // Log warning but don't throw - cover letter is optional
      this.logger.warn(`Cover letter ${coverLetterId} not found, proceeding without it`);
      return undefined;
    }
  }
}
