import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * Remotive Provider - FREE API, no API key required
 * https://remotive.com/api/remote-jobs - Remote job listings
 */
@Injectable()
export class RemotiveProvider implements JobProvider {
  private readonly logger = new Logger(RemotiveProvider.name);
  private readonly apiUrl = 'https://remotive.com/api/remote-jobs';

  getName(): string {
    return 'Remotive';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      this.logger.log('Fetching jobs from Remotive (FREE API)...');

      const queryParams: Record<string, string> = {};
      if (params?.keywords) {
        queryParams.search = params.keywords;
      }

      const response = await axios.get(this.apiUrl, {
        params: queryParams,
        headers: {
          'User-Agent': 'ApplyForUs/1.0 (https://applyforus.com)',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      const jobs = response.data?.jobs || [];
      this.logger.log(`Remotive returned ${jobs.length} jobs`);

      // Apply pagination
      const limit = params?.limit || 50;
      const page = params?.page || 1;
      const start = (page - 1) * limit;
      const paginatedJobs = jobs.slice(start, start + limit);

      return paginatedJobs.map((job: any) => this.mapJob(job));
    } catch (error) {
      this.logger.error(`Remotive API error: ${error.message}`);
      return [];
    }
  }

  private mapJob(job: any): RawJobData {
    return {
      external_id: String(job.id) || `remotive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company_name || '',
      company_logo_url: job.company_logo || null,
      location: job.candidate_required_location || 'Worldwide',
      remote_type: 'remote',
      description: job.description || '',
      application_url: job.url || '',
      posted_at: job.publication_date ? new Date(job.publication_date) : new Date(),
      employment_type: this.mapEmploymentType(job.job_type),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary)?.min || null,
      salary_max: this.parseSalary(job.salary)?.max || null,
      salary_currency: 'USD',
      salary_period: 'yearly',
      skills: job.tags || [],
      metadata: {
        source_api: 'remotive',
        category: job.category,
        job_type: job.job_type,
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
      source: JobSource.REMOTIVE,
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
      ats_platform: 'Remotive',
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
      return response.status === 200 && response.data?.jobs;
    } catch {
      return false;
    }
  }

  private mapEmploymentType(jobType: string): string {
    const type = (jobType || '').toLowerCase();
    if (type.includes('part_time') || type.includes('part-time')) return 'part_time';
    if (type.includes('contract') || type.includes('freelance')) return 'contract';
    if (type.includes('internship') || type.includes('intern')) return 'internship';
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
    if (title.includes('intern')) return 'entry';
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

  private parseSalary(salaryStr: string): { min: number; max: number } | null {
    if (!salaryStr) return null;

    // Try to extract salary range like "$100k - $150k" or "100,000 - 150,000"
    const numbers = salaryStr.match(/[\d,]+/g);
    if (!numbers || numbers.length === 0) return null;

    const parseNum = (str: string): number => {
      const num = parseFloat(str.replace(/,/g, ''));
      // If it looks like "100k" style, multiply by 1000
      if (salaryStr.toLowerCase().includes('k') && num < 1000) {
        return num * 1000;
      }
      return num;
    };

    if (numbers.length >= 2) {
      return {
        min: parseNum(numbers[0]),
        max: parseNum(numbers[1]),
      };
    }

    const single = parseNum(numbers[0]);
    return { min: single, max: single };
  }
}
