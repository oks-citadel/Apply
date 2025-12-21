import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * RemoteOK Provider - FREE API, no API key required
 * https://remoteok.com/api - Returns JSON of remote tech jobs
 */
@Injectable()
export class RemoteOKProvider implements JobProvider {
  private readonly logger = new Logger(RemoteOKProvider.name);
  private readonly apiUrl = 'https://remoteok.com/api';

  getName(): string {
    return 'RemoteOK';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      this.logger.log('Fetching jobs from RemoteOK (FREE API)...');

      const response = await axios.get(this.apiUrl, {
        headers: {
          'User-Agent': 'ApplyForUs/1.0 (https://applyforus.com)',
        },
        timeout: 30000,
      });

      // First element is metadata, rest are jobs
      const jobs = Array.isArray(response.data) ? response.data.slice(1) : [];
      this.logger.log(`RemoteOK returned ${jobs.length} jobs`);

      // Filter by keywords if provided
      let filteredJobs = jobs;
      if (params?.keywords) {
        const keywords = params.keywords.toLowerCase().split(/\s+/);
        filteredJobs = jobs.filter((job: any) => {
          const text = `${job.position} ${job.company} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
          return keywords.some(kw => text.includes(kw));
        });
      }

      // Apply pagination
      const limit = params?.limit || 50;
      const page = params?.page || 1;
      const start = (page - 1) * limit;
      const paginatedJobs = filteredJobs.slice(start, start + limit);

      return paginatedJobs.map((job: any) => this.mapJob(job));
    } catch (error) {
      this.logger.error(`RemoteOK API error: ${error.message}`);
      return [];
    }
  }

  private mapJob(job: any): RawJobData {
    return {
      external_id: job.id || job.slug || `remoteok-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.position || '',
      company_name: job.company || '',
      company_logo_url: job.company_logo || job.logo || null,
      location: job.location || 'Remote',
      remote_type: 'remote', // All RemoteOK jobs are remote
      description: job.description || '',
      application_url: job.url || job.apply_url || `https://remoteok.com/remote-jobs/${job.slug}`,
      posted_at: job.date ? new Date(job.date) : new Date(),
      employment_type: this.mapEmploymentType(job),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary_min),
      salary_max: this.parseSalary(job.salary_max),
      salary_currency: 'USD',
      salary_period: 'yearly',
      skills: job.tags || [],
      metadata: {
        source_api: 'remoteok',
        slug: job.slug,
        tags: job.tags,
        original_data: job,
      },
    };
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    // RemoteOK doesn't have individual job endpoint, fetch all and filter
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
      source: JobSource.REMOTEOK,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: RemoteType.REMOTE,
      salary_min: rawJob.salary_min,
      salary_max: rawJob.salary_max,
      salary_currency: rawJob.salary_currency || 'USD',
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
      ats_platform: 'RemoteOK',
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
      return response.status === 200 && Array.isArray(response.data);
    } catch {
      return false;
    }
  }

  private mapEmploymentType(job: any): string {
    const tags = (job.tags || []).join(' ').toLowerCase();
    const position = (job.position || '').toLowerCase();

    if (tags.includes('contract') || position.includes('contract')) return 'contract';
    if (tags.includes('part-time') || position.includes('part time')) return 'part_time';
    if (tags.includes('intern') || position.includes('intern')) return 'internship';
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
    const position = (job.position || '').toLowerCase();
    const tags = (job.tags || []).join(' ').toLowerCase();

    if (position.includes('senior') || position.includes('sr.') || tags.includes('senior')) return 'senior';
    if (position.includes('junior') || position.includes('jr.') || tags.includes('junior')) return 'junior';
    if (position.includes('lead') || position.includes('principal')) return 'lead';
    if (position.includes('director') || position.includes('executive')) return 'executive';
    if (position.includes('intern')) return 'entry';
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

  private parseSalary(value: any): number | null {
    if (!value) return null;
    if (typeof value === 'number') return value;

    const str = String(value).replace(/[$,]/g, '');
    if (str.toLowerCase().includes('k')) {
      return parseFloat(str) * 1000;
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
}
