import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyReview } from './entities/company-review.entity';
import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, CompanyReview, Job])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
