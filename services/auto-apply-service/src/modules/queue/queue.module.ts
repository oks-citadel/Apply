import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { ApplicationProcessor } from './processors/application.processor';
import { ApplicationsModule } from '../applications/applications.module';
import { AdaptersModule } from '../adapters/adapters.module';
import { applicationQueueConfig } from '../../config/queue.config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: applicationQueueConfig.name,
      defaultJobOptions: applicationQueueConfig.defaultJobOptions,
    }),
    forwardRef(() => ApplicationsModule),
    AdaptersModule,
  ],
  providers: [QueueService, ApplicationProcessor],
  exports: [QueueService],
})
export class QueueModule {}
