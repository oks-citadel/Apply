import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AggregatorController } from './aggregator.controller';
import { AggregatorService } from './aggregator.service';
import { JobCacheService } from './cache/job-cache.service';

// General Job Aggregators
import { AdzunaProvider } from './providers/adzuna.provider';

// Niche / Regional Aggregators
import { CareerJetProvider } from './providers/careerjet.provider';

// Tech-Focused Aggregators
import { DiceProvider } from './providers/dice.provider';
import { GlassdoorProvider } from './providers/glassdoor.provider';
import { IndeedProvider } from './providers/indeed.provider';
import { JoobleProvider } from './providers/jooble.provider';
import { LinkedInProvider } from './providers/linkedin.provider';
import { SimplyHiredProvider } from './providers/simplyhired.provider';
import { TalentProvider } from './providers/talent.provider';
import { ZipRecruiterProvider } from './providers/ziprecruiter.provider';
import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AggregatorController],
  providers: [
    // Core Services
    AggregatorService,
    JobCacheService,
    // General Job Aggregators
    IndeedProvider,
    LinkedInProvider,
    GlassdoorProvider,
    ZipRecruiterProvider,
    SimplyHiredProvider,
    JoobleProvider,
    AdzunaProvider,
    // Niche / Regional Aggregators
    CareerJetProvider,
    TalentProvider,
    // Tech-Focused Aggregators
    DiceProvider,
  ],
  exports: [AggregatorService, JobCacheService],
})
export class AggregatorModule {}
