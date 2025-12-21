import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { SelfHealingService } from './self-healing.service';
import { SelfHealingController } from './self-healing.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [SelfHealingService],
  controllers: [SelfHealingController],
  exports: [SelfHealingService],
})
export class SelfHealingModule {}
