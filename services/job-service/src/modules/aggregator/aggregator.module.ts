import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AggregatorController } from './aggregator.controller';
import { AggregatorService } from './aggregator.service';
import { JobCacheService } from './cache/job-cache.service';

// General Job Aggregators
import { AdzunaProvider } from './providers/adzuna.provider';

// FREE APIs - No API key required
import { ArbeitnowProvider } from './providers/arbeitnow.provider';
import { RemoteOKProvider } from './providers/remoteok.provider';
import { RemotiveProvider } from './providers/remotive.provider';
import { TheMuseProvider } from './providers/themuse.provider';
import { JobicyProvider } from './providers/jobicy.provider';
import { WeWorkRemotelyProvider } from './providers/weworkremotely.provider';

// Niche / Regional Aggregators
import { CareerJetProvider } from './providers/careerjet.provider';
import { ReedProvider } from './providers/reed.provider';

// Tech-Focused Aggregators
import { DiceProvider } from './providers/dice.provider';
import { FindWorkProvider } from './providers/findwork.provider';
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
    ReedProvider,
    // Tech-Focused Aggregators
    DiceProvider,
    FindWorkProvider,
    // FREE APIs - No API key required (prioritized)
    RemoteOKProvider,
    ArbeitnowProvider,
    RemotiveProvider,
    TheMuseProvider,
    JobicyProvider,
    WeWorkRemotelyProvider,
  ],
  exports: [AggregatorService, JobCacheService],
})
export class AggregatorModule {}
