import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { JobAdapterFactory } from './adapters/adapter.factory';
import { IngestionJob } from './entities/ingestion-job.entity';
import { JobSource } from './entities/job-source.entity';
import { RawJobListing } from './entities/raw-job-listing.entity';
import { IngestionController } from './ingestion.controller';
import { IngestionProcessor } from './processors/ingestion.processor';
import { DeduplicationService } from './services/deduplication.service';
import { IngestionSchedulerService } from './services/ingestion-scheduler.service';
import { IngestionService } from './services/ingestion.service';
import { Company } from '../companies/entities/company.entity';
import { Job } from '../jobs/entities/job.entity';

// Services

// Adapters

// Processors

// Controller

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobSource,
      IngestionJob,
      RawJobListing,
      Job,
      Company,
    ]),
    BullModule.registerQueue({
      name: 'job-ingestion',
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    DeduplicationService,
    IngestionSchedulerService,
    JobAdapterFactory,
    IngestionProcessor,
  ],
  exports: [
    IngestionService,
    DeduplicationService,
    JobAdapterFactory,
  ],
})
export class IngestionModule {}
