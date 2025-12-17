import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { SLAModule } from '../sla/sla.module';
import { SLAContract } from '../sla/entities/sla-contract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEvent, SLAContract]),
    SLAModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
