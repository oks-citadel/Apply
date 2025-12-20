import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobSourcesSeeder } from './job-sources.seed';
import { SeederService } from './seeder.service';
import { Company } from '../modules/companies/entities/company.entity';
import { JobSource } from '../modules/ingestion/entities/job-source.entity';
import { Job } from '../modules/jobs/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Company, JobSource])],
  providers: [SeederService, JobSourcesSeeder],
  exports: [SeederService, JobSourcesSeeder],
})
export class SeederModule {}
