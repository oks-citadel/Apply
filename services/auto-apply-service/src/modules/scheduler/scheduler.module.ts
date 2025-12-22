import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ConfigModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
