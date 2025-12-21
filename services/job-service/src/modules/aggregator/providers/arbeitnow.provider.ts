import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * Arbeitnow Provider - FREE API, no API key required
 * https://arbeitnow.com/api/job-board-api - European/International job board
 */
@Injectable()
export class ArbeitnowProvider implements JobProvider {
  private readonly logger = new Logger(ArbeitnowProvider.name);
  private readonly apiUrl = 'https://www.arbeitnow.com/api/job-board-api';

  getName(): string {
    return 'Arbeitnow';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      this.logger.log('Fetching jobs from Arbeitnow (FREE API)...');

      const response = await axios.get(this.apiUrl, {
        headers: {
          'User-Agent': 'ApplyForUs/1.0 (https://applyforus.com)',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      const jobs = response.data?.data || [];
      this.logger.log(`Arbeitnow returned ${jobs.length} jobs`);

      // Filter by keywords if provided
      let filteredJobs = jobs;
      if (params?.keywords) {
        const keywords = params.keywords.toLowerCase().split(/\s+/);
        filteredJobs = jobs.filter((job: any) => {
          const text = `${job.title} ${job.company_name} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
          return keywords.some((kw: string) => text.includes(kw));
        });
      }

      // Filter by location if provided
      if (params?.location) {
        const loc = params.location.toLowerCase();
        filteredJobs = filteredJobs.filter((job: any) => {
          const jobLoc = (job.location || '').toLowerCase();
          return jobLoc.includes(loc) || loc === 'remote' && job.remote;
        });
      }

      // Apply pagination
      const limit = params?.limit || 50;
      const page = params?.page || 1;
      const start = (page - 1) * limit;
      const paginatedJobs = filteredJobs.slice(start, start + limit);

      return paginatedJobs.map((job: any) => this.mapJob(job));
    } catch (error) {
      this.logger.error(`Arbeitnow API error: ${error.message}`);
      return [];
    }
  }

  private mapJob(job: any): RawJobData {
    return {
      external_id: job.slug || `arbeitnow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company_name || '',
      company_logo_url: job.company_logo || null,
      location: job.location || (job.remote ? 'Remote' : 'Unknown'),
      remote_type: job.remote ? 'remote' : 'onsite',
      description: job.description || '',
      application_url: job.url || `https://www.arbeitnow.com/view/${job.slug}`,
      posted_at: job.created_at ? new Date(job.created_at * 1000) : new Date(),
      employment_type: this.mapEmploymentType(job.job_types || []),
      experience_level: this.mapExperienceLevel(job),
      salary_min: null,
      salary_max: null,
      salary_currency: 'EUR',
      salary_period: 'yearly',
      skills: job.tags || [],
      metadata: {
        source_api: 'arbeitnow',
        slug: job.slug,
        tags: job.tags,
        job_types: job.job_types,
        remote: job.remote,
        original_data: job,
      },
    };
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    const jobs = await this.fetchJobs({ limit: 500 });
    const job = jobs.find(j => j.external_id === externalId);
    if (!job) {
      throw new Error(`Job ${externalId} not found`);
    }
    return job;
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.ARBEITNOW,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: rawJob.remote_type === 'remote' ? RemoteType.REMOTE : RemoteType.ONSITE,
      salary_min: rawJob.salary_min,
      salary_max: rawJob.salary_max,
      salary_currency: rawJob.salary_currency || 'EUR',
      salary_period: rawJob.salary_period || 'yearly',
      description: rawJob.description,
      requirements: rawJob.requirements || [],
      benefits: rawJob.benefits || [],
      skills: rawJob.skills || [],
      experience_level: this.parseExperienceLevel(rawJob.experience_level),
      employment_type: this.parseEmploymentType(rawJob.employment_type),
      posted_at: rawJob.posted_at,
      expires_at: rawJob.expires_at,
      application_url: rawJob.application_url,
      ats_platform: 'Arbeitnow',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(this.apiUrl, {
        headers: { 'User-Agent': 'ApplyForUs/1.0' },
        timeout: 5000,
      });
      return response.status === 200 && response.data?.data;
    } catch {
      return false;
    }
  }

  private mapEmploymentType(jobTypes: string[]): string {
    const types = (jobTypes || []).map(t => t.toLowerCase());
    if (types.includes('part time') || types.includes('part-time')) return 'part_time';
    if (types.includes('contract') || types.includes('freelance')) return 'contract';
    if (types.includes('internship') || types.includes('intern')) return 'internship';
    return 'full_time';
  }

  private parseEmploymentType(type: string): EmploymentType {
    switch (type?.toLowerCase()) {
      case 'full_time': return EmploymentType.FULL_TIME;
      case 'part_time': return EmploymentType.PART_TIME;
      case 'contract': return EmploymentType.CONTRACT;
      case 'temporary': return EmploymentType.TEMPORARY;
      case 'internship': return EmploymentType.INTERNSHIP;
      default: return EmploymentType.FULL_TIME;
    }
  }

  private mapExperienceLevel(job: any): string {
    const title = (job.title || '').toLowerCase();
    const tags = (job.tags || []).join(' ').toLowerCase();

    if (title.includes('senior') || title.includes('sr.') || tags.includes('senior')) return 'senior';
    if (title.includes('junior') || title.includes('jr.') || tags.includes('junior')) return 'junior';
    if (title.includes('lead') || title.includes('principal')) return 'lead';
    if (title.includes('director') || title.includes('head of')) return 'executive';
    if (title.includes('intern') || tags.includes('entry')) return 'entry';
    return 'mid';
  }

  private parseExperienceLevel(level: string): ExperienceLevel {
    switch (level?.toLowerCase()) {
      case 'entry': return ExperienceLevel.ENTRY;
      case 'junior': return ExperienceLevel.JUNIOR;
      case 'mid': return ExperienceLevel.MID;
      case 'senior': return ExperienceLevel.SENIOR;
      case 'lead': return ExperienceLevel.LEAD;
      case 'executive': return ExperienceLevel.EXECUTIVE;
      default: return ExperienceLevel.MID;
    }
  }
}
