import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationsService } from '../applications/applications.service';
import { QueueService } from '../queue/queue.service';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { CaptchaService } from '../captcha/captcha.service';
import { AnswerLibraryService } from '../answer-library/answer-library.service';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { WorkdayAdapter } from '../adapters/workday.adapter';
import { GreenhouseAdapter } from '../adapters/greenhouse.adapter';
import { LeverAdapter } from '../adapters/lever.adapter';
import { IcimsAdapter } from '../adapters/icims.adapter';
import { TaleoAdapter } from '../adapters/taleo.adapter';
import { SmartRecruitersAdapter } from '../adapters/smartrecruiters.adapter';
import { LinkedInAdapter } from '../adapters/linkedin.adapter';
import { IndeedAdapter } from '../adapters/indeed.adapter';
import { BaseATSAdapter, ApplicationData, ApplicationResult } from '../adapters/base.adapter';
import {
  JobData,
  UserProfile,
  Resume,
  CoverLetter,
  EligibilityResult,
  ResumeSelectionResult,
  PreparedApplication,
  SubmissionResult,
  VerificationResult,
  ApplicationStatusInfo,
} from './interfaces/engine.interface';
import { ApplicationStatusEnum, QueueStatusEnum } from './dto/application-status.dto';

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);
  private readonly atsAdapters: Map<string, BaseATSAdapter> = new Map();

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly applicationsService: ApplicationsService,
    private readonly queueService: QueueService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly captchaService: CaptchaService,
    private readonly answerLibraryService: AnswerLibraryService,
    private readonly workdayAdapter: WorkdayAdapter,
    private readonly greenhouseAdapter: GreenhouseAdapter,
    private readonly leverAdapter: LeverAdapter,
    private readonly icimsAdapter: IcimsAdapter,
    private readonly taleoAdapter: TaleoAdapter,
    private readonly smartRecruitersAdapter: SmartRecruitersAdapter,
    private readonly linkedInAdapter: LinkedInAdapter,
    private readonly indeedAdapter: IndeedAdapter,
  ) {
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    this.atsAdapters.set('workday', this.workdayAdapter);
    this.atsAdapters.set('greenhouse', this.greenhouseAdapter);
    this.atsAdapters.set('lever', this.leverAdapter);
    this.atsAdapters.set('icims', this.icimsAdapter);
    this.atsAdapters.set('taleo', this.taleoAdapter);
    this.atsAdapters.set('smartrecruiters', this.smartRecruitersAdapter);
    this.atsAdapters.set('linkedin', this.linkedInAdapter);
    this.atsAdapters.set('indeed', this.indeedAdapter);

    this.logger.log(`Initialized ${this.atsAdapters.size} ATS adapters`);
  }

  /**
   * Validate if user qualifies for a job based on requirements
   */
  async validateJobEligibility(job: JobData, userProfile: UserProfile): Promise<EligibilityResult> {
    this.logger.log(`Validating eligibility for job: ${job.id} (${job.title})`);

    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    const matchedSkills: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check work authorization
    if (job.requirements?.some(req => req.toLowerCase().includes('work authorization'))) {
      if (userProfile.preferences?.workAuthorization === false) {
        missingRequirements.push('Work authorization required');
        score -= 30;
      } else {
        reasons.push('Work authorization satisfied');
        score += 10;
      }
    }

    // Check experience requirements
    const experienceMatch = job.requirements?.find(req =>
      req.match(/(\d+)\+?\s*years?\s*(?:of\s*)?experience/i)
    );

    if (experienceMatch) {
      const requiredYears = parseInt(experienceMatch.match(/(\d+)/)?.[1] || '0');
      const userYears = userProfile.yearsOfExperience || 0;

      if (userYears >= requiredYears) {
        reasons.push(`Experience requirement met (${userYears} years)`);
        score += 20;
      } else if (userYears >= requiredYears * 0.7) {
        reasons.push(`Close to experience requirement (${userYears}/${requiredYears} years)`);
        score += 10;
        recommendations.push('Consider highlighting relevant project experience');
      } else {
        missingRequirements.push(`Insufficient experience (${userYears}/${requiredYears} years)`);
        score -= 20;
      }
    }

    // Check skill match
    if (userProfile.skills && userProfile.skills.length > 0) {
      const jobText = `${job.title} ${job.description || ''} ${job.requirements?.join(' ') || ''}`.toLowerCase();

      for (const skill of userProfile.skills) {
        if (jobText.includes(skill.toLowerCase())) {
          matchedSkills.push(skill);
          score += 5;
        }
      }

      if (matchedSkills.length > 0) {
        reasons.push(`${matchedSkills.length} relevant skills matched`);
      } else {
        recommendations.push('Consider tailoring your resume to highlight transferable skills');
      }
    }

    // Location/Remote check
    if (job.location) {
      if (job.location.toLowerCase().includes('remote') ||
          job.location.toLowerCase().includes('anywhere')) {
        reasons.push('Remote position available');
        score += 5;
      } else if (userProfile.preferences?.willingToRelocate) {
        reasons.push('Open to relocation');
        score += 3;
      }
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score + 50));

    const eligible = score >= 40 && missingRequirements.length === 0;

    this.logger.log(
      `Eligibility check for job ${job.id}: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (score: ${score})`
    );

    return {
      eligible,
      score,
      reasons,
      missingRequirements: missingRequirements.length > 0 ? missingRequirements : undefined,
      matchedSkills: matchedSkills.length > 0 ? matchedSkills : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Select the best resume for a job using AI-powered matching
   */
  async selectBestResume(job: JobData, resumes: Resume[]): Promise<ResumeSelectionResult> {
    this.logger.log(`Selecting best resume from ${resumes.length} options for job: ${job.id}`);

    if (resumes.length === 0) {
      throw new BadRequestException('No resumes available for selection');
    }

    // If only one resume, return it
    if (resumes.length === 1) {
      return {
        selectedResume: resumes[0],
        matchScore: resumes[0].matchScore || 75,
        matchReasons: ['Only available resume'],
      };
    }

    // Find primary resume
    const primaryResume = resumes.find(r => r.isPrimary);
    if (primaryResume) {
      this.logger.log(`Using primary resume: ${primaryResume.id}`);
      return {
        selectedResume: primaryResume,
        matchScore: primaryResume.matchScore || 80,
        matchReasons: ['Designated as primary resume'],
        alternativeResumes: resumes
          .filter(r => r.id !== primaryResume.id)
          .map(r => ({
            resume: r,
            score: r.matchScore || 60,
            reason: 'Alternative option',
          })),
      };
    }

    // Score each resume based on job requirements
    const scoredResumes = resumes.map(resume => {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Skill matching
      if (resume.skills && job.requirements) {
        const jobText = job.requirements.join(' ').toLowerCase();
        const matchedSkills = resume.skills.filter(skill =>
          jobText.includes(skill.toLowerCase())
        );

        if (matchedSkills.length > 0) {
          score += matchedSkills.length * 5;
          reasons.push(`${matchedSkills.length} matching skills`);
        }
      }

      // Experience matching
      if (resume.experience && job.description) {
        const jobDesc = job.description.toLowerCase();
        const matchedExp = resume.experience.filter(exp =>
          jobDesc.includes(exp.toLowerCase())
        );

        if (matchedExp.length > 0) {
          score += matchedExp.length * 3;
          reasons.push(`${matchedExp.length} relevant experiences`);
        }
      }

      // Title matching
      if (resume.title && job.title) {
        const titleWords = new Set(
          job.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );
        const resumeTitleWords = resume.title.toLowerCase().split(/\s+/);
        const matches = resumeTitleWords.filter(w => titleWords.has(w));

        if (matches.length > 0) {
          score += matches.length * 4;
          reasons.push('Title alignment');
        }
      }

      // Recency bonus
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(resume.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceUpdate < 30) {
        score += 5;
        reasons.push('Recently updated');
      }

      // Use existing match score if available
      if (resume.matchScore) {
        score = (score + resume.matchScore) / 2;
      }

      return {
        resume,
        score: Math.min(100, score),
        reasons,
      };
    });

    // Sort by score
    scoredResumes.sort((a, b) => b.score - a.score);

    const best = scoredResumes[0];
    const alternatives = scoredResumes.slice(1, 4); // Top 3 alternatives

    this.logger.log(
      `Selected resume ${best.resume.id} with score ${best.score} for job ${job.id}`
    );

    return {
      selectedResume: best.resume,
      matchScore: best.score,
      matchReasons: best.reasons,
      alternativeResumes: alternatives.map(alt => ({
        resume: alt.resume,
        score: alt.score,
        reason: alt.reasons.join(', '),
      })),
    };
  }

  /**
   * Prepare application data for submission
   */
  async prepareApplication(
    job: JobData,
    resume: Resume,
    userProfile: UserProfile,
    coverLetter?: CoverLetter,
  ): Promise<PreparedApplication> {
    this.logger.log(`Preparing application for job ${job.id} with resume ${resume.id}`);

    const preparedApplication: PreparedApplication = {
      jobId: job.id,
      userId: userProfile.id,
      resumeId: resume.id,
      resumePath: resume.filePath,
      personalInfo: {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        phone: userProfile.phone,
        address: userProfile.address,
        linkedinUrl: userProfile.linkedinUrl,
        portfolioUrl: userProfile.portfolioUrl,
      },
      workInfo: {
        currentCompany: userProfile.currentCompany,
        currentTitle: userProfile.currentTitle,
        yearsOfExperience: userProfile.yearsOfExperience,
      },
      preferences: {
        salaryExpectation: userProfile.preferences?.salaryExpectation,
        availability: userProfile.preferences?.availability,
        workAuthorization: userProfile.preferences?.workAuthorization,
        requiresSponsorship: userProfile.preferences?.requiresSponsorship,
      },
      additionalData: {
        jobTitle: job.title,
        company: job.company,
        jobUrl: job.url,
        atsType: job.atsType,
      },
    };

    // Add cover letter if provided
    if (coverLetter) {
      preparedApplication.coverLetterId = coverLetter.id;
      preparedApplication.coverLetterPath = coverLetter.filePath;
    }

    this.logger.log(`Application prepared successfully for job ${job.id}`);
    return preparedApplication;
  }

  /**
   * Submit application using appropriate ATS adapter
   */
  async submitApplication(
    job: JobData,
    applicationData: PreparedApplication,
  ): Promise<SubmissionResult> {
    this.logger.log(`Submitting application for job ${job.id} via ${job.atsType || 'generic'}`);

    try {
      // Check rate limiting
      const rateLimitKey = `user:${applicationData.userId}:applications`;
      const canProceed = await this.rateLimiterService.checkLimit(rateLimitKey, 10, 3600);

      if (!canProceed) {
        this.logger.warn(`Rate limit exceeded for user ${applicationData.userId}`);
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          errorType: 'rate_limit',
          retryable: true,
          requiresManualIntervention: false,
        };
      }

      // Detect ATS platform from URL or use provided type
      let atsAdapter: BaseATSAdapter | undefined;

      if (job.atsType) {
        atsAdapter = this.atsAdapters.get(job.atsType.toLowerCase());
      }

      if (!atsAdapter) {
        // Auto-detect from URL
        for (const [name, adapter] of this.atsAdapters) {
          if (adapter.detectPlatform(job.url)) {
            atsAdapter = adapter;
            this.logger.log(`Auto-detected ATS platform: ${name}`);
            break;
          }
        }
      }

      if (!atsAdapter) {
        this.logger.warn(`No ATS adapter found for job ${job.id}`);
        return {
          success: false,
          error: 'Unsupported ATS platform',
          errorType: 'unknown',
          retryable: false,
          requiresManualIntervention: true,
        };
      }

      // Prepare ApplicationData for adapter
      const adapterData: ApplicationData = {
        userId: applicationData.userId,
        jobUrl: job.url,
        resumePath: applicationData.resumePath,
        coverLetterPath: applicationData.coverLetterPath,
        personalInfo: applicationData.personalInfo,
        workInfo: applicationData.workInfo,
        preferences: applicationData.preferences,
      };

      // Submit via adapter
      const result: ApplicationResult = await atsAdapter.apply(adapterData);

      // Map adapter result to submission result
      const submissionResult: SubmissionResult = {
        success: result.success,
        applicationId: result.applicationId,
        screenshotPath: result.screenshotPath,
        submittedAt: result.success ? new Date() : undefined,
        error: result.error,
        errorType: result.captchaDetected ? 'captcha' : 'unknown',
        requiresManualIntervention: result.requiresManualIntervention || false,
        retryable: !result.requiresManualIntervention,
        metadata: {
          atsType: job.atsType,
          jobTitle: job.title,
          company: job.company,
        },
      };

      // Increment rate limiter on successful submission
      if (result.success) {
        await this.rateLimiterService.increment(rateLimitKey);
      }

      this.logger.log(
        `Application submission ${result.success ? 'successful' : 'failed'} for job ${job.id}`
      );

      return submissionResult;
    } catch (error) {
      this.logger.error(`Error submitting application for job ${job.id}: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
        errorType: this.categorizeError(error),
        retryable: this.isRetryableError(error),
        requiresManualIntervention: !this.isRetryableError(error),
      };
    }
  }

  /**
   * Verify submission was successful
   */
  async verifySubmission(applicationId: string): Promise<VerificationResult> {
    this.logger.log(`Verifying submission for application ${applicationId}`);

    try {
      const application = await this.applicationRepository.findOne({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException(`Application ${applicationId} not found`);
      }

      // Check if we have a reference ID
      const hasReferenceId = !!application.application_reference_id;

      // Check if we have a screenshot
      const hasScreenshot = !!application.screenshot_url;

      // Check application status
      const isApplied = application.status === ApplicationStatus.APPLIED;

      const verified = hasReferenceId && isApplied;

      return {
        verified,
        status: verified ? 'confirmed' : (hasScreenshot ? 'pending' : 'failed'),
        confirmationDetails: {
          applicationId: application.id,
          referenceNumber: application.application_reference_id || undefined,
          confirmationPage: hasScreenshot,
        },
      };
    } catch (error) {
      this.logger.error(`Error verifying submission: ${error.message}`);
      return {
        verified: false,
        status: 'unknown',
        error: error.message,
      };
    }
  }

  /**
   * Handle submission failure with retry logic
   */
  async handleSubmissionFailure(
    applicationId: string,
    error: string,
    maxRetries: number = 3,
  ): Promise<{ shouldRetry: boolean; retryDelay: number }> {
    this.logger.log(`Handling submission failure for application ${applicationId}`);

    try {
      const application = await this.applicationRepository.findOne({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException(`Application ${applicationId} not found`);
      }

      const currentRetryCount = application.retry_count || 0;

      // Check if we should retry
      const shouldRetry = currentRetryCount < maxRetries && this.isRetryableErrorMessage(error);

      // Calculate exponential backoff delay (in milliseconds)
      const baseDelay = 60000; // 1 minute
      const retryDelay = baseDelay * Math.pow(2, currentRetryCount);

      if (shouldRetry) {
        // Update retry count
        application.retry_count = currentRetryCount + 1;
        application.error_log = {
          ...(application.error_log || {}),
          lastError: error,
          lastRetryAt: new Date(),
          retryCount: currentRetryCount + 1,
        };

        await this.applicationRepository.save(application);

        this.logger.log(
          `Will retry application ${applicationId} (attempt ${currentRetryCount + 1}/${maxRetries}) after ${retryDelay}ms`
        );
      } else {
        // Mark as failed
        application.status = ApplicationStatus.REJECTED;
        application.error_log = {
          ...(application.error_log || {}),
          finalError: error,
          failedAt: new Date(),
          retryCount: currentRetryCount,
        };

        await this.applicationRepository.save(application);

        this.logger.log(`Application ${applicationId} marked as failed after ${currentRetryCount} retries`);
      }

      return {
        shouldRetry,
        retryDelay,
      };
    } catch (err) {
      this.logger.error(`Error handling submission failure: ${err.message}`);
      return {
        shouldRetry: false,
        retryDelay: 0,
      };
    }
  }

  /**
   * Get application status with detailed information
   */
  async getApplicationStatus(applicationId: string): Promise<ApplicationStatusInfo> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    // Get queue status if applicable
    let queueStatus: QueueStatusEnum | undefined;
    if (application.queue_status) {
      queueStatus = application.queue_status as QueueStatusEnum;
    }

    const statusInfo: ApplicationStatusInfo = {
      applicationId: application.id,
      jobId: application.job_id,
      userId: application.user_id,
      status: this.mapApplicationStatus(application.status),
      queueStatus,
      timestamps: {
        createdAt: application.created_at,
        startedAt: application.applied_at || undefined,
        completedAt: application.status === ApplicationStatus.APPLIED ? application.applied_at || undefined : undefined,
      },
    };

    // Add retry info if applicable
    if (application.retry_count > 0) {
      statusInfo.retryInfo = {
        retryCount: application.retry_count,
        maxRetries: 3,
      };
    }

    // Add error info if applicable
    if (application.error_log && Object.keys(application.error_log).length > 0) {
      statusInfo.error = {
        message: application.error_log.lastError || application.error_log.finalError || 'Unknown error',
        type: 'unknown',
        requiresManualIntervention: application.status === ApplicationStatus.REJECTED,
      };
    }

    return statusInfo;
  }

  private mapApplicationStatus(status: ApplicationStatus): ApplicationStatusEnum {
    const statusMap: Record<ApplicationStatus, ApplicationStatusEnum> = {
      [ApplicationStatus.APPLIED]: ApplicationStatusEnum.SUBMITTED,
      [ApplicationStatus.VIEWED]: ApplicationStatusEnum.SUBMITTED,
      [ApplicationStatus.INTERVIEWING]: ApplicationStatusEnum.SUBMITTED,
      [ApplicationStatus.OFFERED]: ApplicationStatusEnum.SUBMITTED,
      [ApplicationStatus.REJECTED]: ApplicationStatusEnum.FAILED,
      [ApplicationStatus.WITHDRAWN]: ApplicationStatusEnum.CANCELLED,
    };

    return statusMap[status] || ApplicationStatusEnum.PENDING;
  }

  private categorizeError(error: any): SubmissionResult['errorType'] {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('captcha')) return 'captcha';
    if (message.includes('rate limit')) return 'rate_limit';
    if (message.includes('form') || message.includes('field')) return 'invalid_form';
    if (message.includes('network') || message.includes('timeout')) return 'network';
    if (message.includes('auth') || message.includes('login')) return 'authentication';

    return 'unknown';
  }

  private isRetryableError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';

    const retryableKeywords = ['network', 'timeout', 'temporary', 'rate limit'];
    const nonRetryableKeywords = ['captcha', 'authentication', 'invalid credentials'];

    if (nonRetryableKeywords.some(keyword => message.includes(keyword))) {
      return false;
    }

    return retryableKeywords.some(keyword => message.includes(keyword));
  }

  private isRetryableErrorMessage(errorMessage: string): boolean {
    const message = errorMessage.toLowerCase();

    const retryableKeywords = ['network', 'timeout', 'temporary', 'rate limit'];
    const nonRetryableKeywords = ['captcha', 'authentication', 'invalid'];

    if (nonRetryableKeywords.some(keyword => message.includes(keyword))) {
      return false;
    }

    return retryableKeywords.some(keyword => message.includes(keyword));
  }
}
