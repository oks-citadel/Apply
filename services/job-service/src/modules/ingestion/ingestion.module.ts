import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';

// Entities
import { JobSource } from './entities/job-source.entity';
import { IngestionJob } from './entities/ingestion-job.entity';
import { RawJobListing } from './entities/raw-job-listing.entity';
import { Job } from '../jobs/entities/job.entity';
import { Company } from '../companies/entities/company.entity';

// Services
import { IngestionService } from './services/ingestion.service';
import { DeduplicationService } from './services/deduplication.service';
import { IngestionSchedulerService } from './services/ingestion-scheduler.service';

// Adapters
import { JobAdapterFactory } from './adapters/adapter.factory';

// Processors
import { IngestionProcessor } from './processors/ingestion.processor';

// Controller
import { IngestionController } from './ingestion.controller';

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
