import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { JobReportsController } from './job-reports.controller';
import { ReportsService } from './reports.service';
import { JobReport } from './entities/report.entity';
import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobReport, Job])],
  controllers: [ReportsController, JobReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
