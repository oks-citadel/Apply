import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';

import { ApplicationProcessor } from './processors/application.processor';
import { QueueService } from './queue.service';
import { applicationQueueConfig } from '../../config/queue.config';
import { AdaptersModule } from '../adapters/adapters.module';
import { ApplicationsModule } from '../applications/applications.module';

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
