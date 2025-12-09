import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Job } from '../jobs/entities/job.entity';
import { AggregatorService } from './aggregator.service';
import { AggregatorController } from './aggregator.controller';
import { LinkedInProvider } from './providers/linkedin.provider';
import { IndeedProvider } from './providers/indeed.provider';
import { GlassdoorProvider } from './providers/glassdoor.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AggregatorController],
  providers: [
    AggregatorService,
    LinkedInProvider,
    IndeedProvider,
    GlassdoorProvider,
  ],
  exports: [AggregatorService],
})
export class AggregatorModule {}
