import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Job } from '../modules/jobs/entities/job.entity';
import { Company } from '../modules/companies/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Company])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
