import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { jobsSeedData } from './jobs.seed';
import { Company } from '../modules/companies/entities/company.entity';
import { Job } from '../modules/jobs/entities/job.entity';

import type { Repository } from 'typeorm';


@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async seedJobs(): Promise<void> {
    try {
      this.logger.log('Starting job seeding...');

      // Check if jobs already exist
      const existingCount = await this.jobRepository.count();
      if (existingCount > 0) {
        this.logger.log(`Database already has ${existingCount} jobs. Skipping seed.`);
        return;
      }

      // Seed jobs
      const jobs = this.jobRepository.create(jobsSeedData);
      await this.jobRepository.save(jobs);

      this.logger.log(`Successfully seeded ${jobs.length} jobs`);
    } catch (error) {
      this.logger.error('Error seeding jobs:', error);
      throw error;
    }
  }

  async clearJobs(): Promise<void> {
    try {
      this.logger.log('Clearing all jobs...');
      await this.jobRepository.delete({});
      this.logger.log('All jobs cleared');
    } catch (error) {
      this.logger.error('Error clearing jobs:', error);
      throw error;
    }
  }

  async reseedJobs(): Promise<void> {
    await this.clearJobs();
    await this.seedJobs();
  }
}
