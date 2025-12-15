import { Processor, Process, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Job as BullJob } from 'bull';
import { Logger } from '@nestjs/common';
import { NormalizationService } from '../services/normalization.service';

interface NormalizationJobData {
  jobId: string;
  force?: boolean;
}

@Processor('normalization')
export class NormalizationProcessor {
  private readonly logger = new Logger(NormalizationProcessor.name);

  constructor(private readonly normalizationService: NormalizationService) {}

  @Process('normalize-job')
  async handleNormalizeJob(job: BullJob<NormalizationJobData>): Promise<any> {
    this.logger.log(`Processing normalization for job ${job.data.jobId}`);

    try {
      const result = await this.normalizationService.normalizeJob(
        job.data.jobId,
        job.data.force || false,
      );

      this.logger.log(`Successfully normalized job ${job.data.jobId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error normalizing job ${job.data.jobId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Process('normalize-batch')
  async handleNormalizeBatch(
    job: BullJob<{ jobIds: string[]; force?: boolean }>,
  ): Promise<any> {
    this.logger.log(`Processing batch normalization for ${job.data.jobIds.length} jobs`);

    try {
      const results = await this.normalizationService.normalizeJobsBatch(
        job.data.jobIds,
        job.data.force || false,
      );

      const successCount = results.filter((r) => r.success).length;
      this.logger.log(
        `Batch normalization completed: ${successCount}/${results.length} successful`,
      );

      return results;
    } catch (error) {
      this.logger.error(`Error in batch normalization: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('auto-normalize')
  async handleAutoNormalize(job: BullJob<{ jobId: string }>): Promise<any> {
    this.logger.log(`Auto-normalizing newly ingested job ${job.data.jobId}`);

    try {
      const result = await this.normalizationService.normalizeJob(job.data.jobId, false);
      this.logger.log(`Auto-normalization completed for job ${job.data.jobId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in auto-normalization for job ${job.data.jobId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @OnQueueError()
  onError(error: Error): void {
    this.logger.error(`Queue error: ${error.message}`, error.stack);
  }

  @OnQueueFailed()
  onFailed(job: BullJob, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
