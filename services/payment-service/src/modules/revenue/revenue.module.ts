import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueMetricsService } from './revenue-metrics.service';
import { RevenueController } from './revenue.controller';
import { Subscription } from '../subscriptions/entities/subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  providers: [RevenueMetricsService],
  controllers: [RevenueController],
  exports: [RevenueMetricsService],
})
export class RevenueModule {}
