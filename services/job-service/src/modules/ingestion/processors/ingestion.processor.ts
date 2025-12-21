import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

import { IngestionService } from '../services/ingestion.service';
import type { Job } from 'bull';


@Processor('job-ingestion')
export class IngestionProcessor {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly ingestionService: IngestionService) {}

  @Process('process-ingestion')
  async handleIngestion(job: Job) {
    const { ingestionJobId, sourceId, options } = job.data;

    this.logger.log(
      `Processing ingestion job ${ingestionJobId} for source ${sourceId}`,
    );

    try {
      await this.ingestionService.processIngestion(
        ingestionJobId,
        sourceId,
        options,
      );

      this.logger.log(`Completed ingestion job ${ingestionJobId}`);

      return { success: true, ingestionJobId };
    } catch (error) {
      this.logger.error(
        `Ingestion job ${ingestionJobId} failed: ${error.message}`,
        error.stack,
      );

      throw error; // Let Bull handle retries
    }
  }
}
