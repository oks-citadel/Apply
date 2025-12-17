import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { JobSourcesSeeder } from './job-sources.seed';
import { Job } from '../modules/jobs/entities/job.entity';
import { Company } from '../modules/companies/entities/company.entity';
import { JobSource } from '../modules/ingestion/entities/job-source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Company, JobSource])],
  providers: [SeederService, JobSourcesSeeder],
  exports: [SeederService, JobSourcesSeeder],
})
export class SeederModule {}
