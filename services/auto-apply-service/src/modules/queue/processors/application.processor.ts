import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ApplicationsService } from '../../applications/applications.service';
import { WorkdayAdapter } from '../../adapters/workday.adapter';
import { GreenhouseAdapter } from '../../adapters/greenhouse.adapter';
import { LeverAdapter } from '../../adapters/lever.adapter';
import { IcimsAdapter } from '../../adapters/icims.adapter';
import { TaleoAdapter } from '../../adapters/taleo.adapter';
import { SmartRecruitersAdapter } from '../../adapters/smartrecruiters.adapter';
import { ApplicationData } from '../../adapters/base.adapter';

@Processor('application-queue')
export class ApplicationProcessor {
  private readonly logger = new Logger(ApplicationProcessor.name);

  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly workdayAdapter: WorkdayAdapter,
    private readonly greenhouseAdapter: GreenhouseAdapter,
    private readonly leverAdapter: LeverAdapter,
    private readonly icimsAdapter: IcimsAdapter,
    private readonly taleoAdapter: TaleoAdapter,
    private readonly smartRecruitersAdapter: SmartRecruitersAdapter,
  ) {}

  @Process('submit-application')
  async handleApplicationSubmission(job: Job<ApplicationData>) {
    this.logger.log(`Processing application job ${job.id} for job: ${job.data.jobUrl}`);

    let applicationId: string | undefined;

    try {
      // Create application record first
      const application = await this.applicationsService.create({
        user_id: job.data.userId,
        job_id: job.data.jobUrl, // In production, this should be a proper job_id
        resume_id: job.data.resumePath, // In production, this should be a proper resume_id
        cover_letter_id: job.data.coverLetterPath,
        status: 'applied' as any,
        auto_applied: true,
        application_url: job.data.jobUrl,
        queue_status: 'processing',
        source: 'auto_apply' as any,
      } as any);

      applicationId = application.id;
      this.logger.log(`Created application record ${applicationId} for job ${job.id}`);

      // Detect platform and select appropriate adapter
      const adapter = this.selectAdapter(job.data.jobUrl);

      if (!adapter) {
        throw new Error('No suitable adapter found for URL');
      }

      this.logger.log(`Using ${adapter.constructor.name} for application`);

      // Execute the application
      const result = await adapter.apply(job.data);

      if (result.success) {
        // Update application record as successful
        await this.applicationsService.updateApplicationSuccess(
          applicationId,
          result.applicationId || 'unknown',
          result.screenshotPath || '',
        );

        this.logger.log(`Application job ${job.id} completed successfully`);
        return result;
      } else {
        // Handle failure
        if (result.captchaDetected || result.requiresManualIntervention) {
          this.logger.warn(`Application job ${job.id} requires manual intervention`);

          await this.applicationsService.updateApplicationError(
            applicationId,
            {
              error: result.error,
              captcha_detected: result.captchaDetected,
              requires_manual: result.requiresManualIntervention,
              screenshot: result.screenshotPath,
            },
            job.attemptsMade,
          );

          // Don't retry if manual intervention required
          throw new Error(`Manual intervention required: ${result.error}`);
        }

        // Retry-able error
        throw new Error(result.error || 'Application failed');
      }
    } catch (error) {
      this.logger.error(`Application job ${job.id} failed: ${error.message}`);

      // Update application record with error if we created one
      if (applicationId) {
        await this.applicationsService.updateApplicationError(
          applicationId,
          {
            error: error.message,
            stack: error.stack,
            attempt: job.attemptsMade,
          },
          job.attemptsMade,
        );
      }

      throw error;
    }
  }

  private selectAdapter(url: string) {
    const adapters = [
      this.workdayAdapter,
      this.greenhouseAdapter,
      this.leverAdapter,
      this.icimsAdapter,
      this.taleoAdapter,
      this.smartRecruitersAdapter,
    ];

    for (const adapter of adapters) {
      if (adapter.detectPlatform(url)) {
        return adapter;
      }
    }

    this.logger.warn(`No adapter found for URL: ${url}`);
    return null;
  }
}
