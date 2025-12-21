import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * Jobicy Provider - FREE API, no API key required
 * https://jobicy.com/api/v2/remote-jobs - Remote job listings
 */
@Injectable()
export class JobicyProvider implements JobProvider {
  private readonly logger = new Logger(JobicyProvider.name);
  private readonly apiUrl = 'https://jobicy.com/api/v2/remote-jobs';

  getName(): string {
    return 'Jobicy';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      this.logger.log('Fetching jobs from Jobicy (FREE API)...');

      const queryParams: Record<string, any> = {
        count: params?.limit || 50,
      };

      // Jobicy supports industry/tag filtering
      if (params?.keywords) {
        queryParams.tag = params.keywords;
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
      this.logger.log(`Jobicy returned ${jobs.length} jobs`);

      return jobs.map((job: any) => this.mapJob(job));
    } catch (error) {
      this.logger.error(`Jobicy API error: ${error.message}`);
      return [];
    }
  }

  private mapJob(job: any): RawJobData {
    return {
      external_id: String(job.id) || `jobicy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.jobTitle || '',
      company_name: job.companyName || '',
      company_logo_url: job.companyLogo || null,
      location: job.jobGeo || 'Worldwide',
      remote_type: 'remote', // Jobicy is exclusively remote jobs
      description: job.jobDescription || '',
      application_url: job.url || '',
      posted_at: job.pubDate ? new Date(job.pubDate) : new Date(),
      employment_type: this.mapEmploymentType(job.jobType),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.annualSalaryMin),
      salary_max: this.parseSalary(job.annualSalaryMax),
      salary_currency: job.salaryCurrency || 'USD',
      salary_period: 'yearly',
      skills: job.jobIndustry ? [job.jobIndustry] : [],
      metadata: {
        source_api: 'jobicy',
        job_type: job.jobType,
        job_industry: job.jobIndustry,
        job_level: job.jobLevel,
        original_data: job,
      },
    };
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    const jobs = await this.fetchJobs({ limit: 100 });
    const job = jobs.find(j => j.external_id === externalId);
    if (!job) {
      throw new Error(`Job ${externalId} not found`);
    }
    return job;
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.JOBICY,
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
      ats_platform: 'Jobicy',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}?count=1`, {
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
    if (type.includes('part-time') || type.includes('part time')) return 'part_time';
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
    const level = (job.jobLevel || '').toLowerCase();
    const title = (job.jobTitle || '').toLowerCase();

    if (level.includes('senior') || title.includes('senior') || title.includes('sr.')) return 'senior';
    if (level.includes('junior') || title.includes('junior') || title.includes('jr.')) return 'junior';
    if (level.includes('lead') || title.includes('lead') || title.includes('principal')) return 'lead';
    if (level.includes('executive') || title.includes('director') || title.includes('head of')) return 'executive';
    if (level.includes('entry') || title.includes('intern')) return 'entry';
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
    const num = parseFloat(String(value).replace(/[$,]/g, ''));
    return isNaN(num) ? null : num;
  }
}
