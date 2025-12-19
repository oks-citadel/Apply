import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Job } from '../jobs/entities/job.entity';
import { AggregatorService } from './aggregator.service';
import { AggregatorController } from './aggregator.controller';
import { JobCacheService } from './cache/job-cache.service';

// General Job Aggregators
import { IndeedProvider } from './providers/indeed.provider';
import { LinkedInProvider } from './providers/linkedin.provider';
import { GlassdoorProvider } from './providers/glassdoor.provider';
import { ZipRecruiterProvider } from './providers/ziprecruiter.provider';
import { SimplyHiredProvider } from './providers/simplyhired.provider';
import { JoobleProvider } from './providers/jooble.provider';
import { AdzunaProvider } from './providers/adzuna.provider';

// Niche / Regional Aggregators
import { CareerJetProvider } from './providers/careerjet.provider';
import { TalentProvider } from './providers/talent.provider';

// Tech-Focused Aggregators
import { DiceProvider } from './providers/dice.provider';

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
