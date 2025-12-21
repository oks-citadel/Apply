import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * The Muse Provider - FREE API, no API key required
 * https://www.themuse.com/api/public/jobs - Career advice and job listings
 */
@Injectable()
export class TheMuseProvider implements JobProvider {
  private readonly logger = new Logger(TheMuseProvider.name);
  private readonly apiUrl = 'https://www.themuse.com/api/public/jobs';

  getName(): string {
    return 'TheMuse';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      this.logger.log('Fetching jobs from The Muse (FREE API)...');

      const queryParams: Record<string, any> = {
        page: params?.page || 1,
        // The Muse API uses 'page' for pagination, returns 20 jobs per page
      };

      if (params?.location) {
        queryParams.location = params.location;
      }

      const response = await axios.get(this.apiUrl, {
        params: queryParams,
        headers: {
          'User-Agent': 'ApplyForUs/1.0 (https://applyforus.com)',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      let jobs = response.data?.results || [];
      this.logger.log(`The Muse returned ${jobs.length} jobs`);

      // Filter by keywords if provided
      if (params?.keywords) {
        const keywords = params.keywords.toLowerCase().split(/\s+/);
        jobs = jobs.filter((job: any) => {
          const text = `${job.name} ${job.company?.name || ''} ${job.contents || ''} ${(job.categories || []).map((c: any) => c.name).join(' ')}`.toLowerCase();
          return keywords.some(kw => text.includes(kw));
        });
      }

      // Apply limit
      const limit = params?.limit || 50;
      const limitedJobs = jobs.slice(0, limit);

      return limitedJobs.map((job: any) => this.mapJob(job));
    } catch (error) {
      this.logger.error(`The Muse API error: ${error.message}`);
      return [];
    }
  }

  private mapJob(job: any): RawJobData {
    const location = job.locations?.[0]?.name || 'Remote';
    const isRemote = location.toLowerCase().includes('remote') ||
                     location.toLowerCase().includes('flexible');

    return {
      external_id: String(job.id) || `themuse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.name || '',
      company_name: job.company?.name || '',
      company_logo_url: null, // The Muse doesn't provide logos in the free API
      location: location,
      remote_type: isRemote ? 'remote' : 'onsite',
      description: job.contents || '',
      application_url: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.short_name}`,
      posted_at: job.publication_date ? new Date(job.publication_date) : new Date(),
      employment_type: this.mapEmploymentType(job.levels),
      experience_level: this.mapExperienceLevel(job.levels),
      salary_min: null,
      salary_max: null,
      salary_currency: 'USD',
      salary_period: 'yearly',
      skills: (job.categories || []).map((c: any) => c.name),
      metadata: {
        source_api: 'themuse',
        company_id: job.company?.id,
        short_name: job.short_name,
        levels: job.levels,
        categories: job.categories,
        original_data: job,
      },
    };
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      const response = await axios.get(`${this.apiUrl}/${externalId}`, {
        headers: { 'User-Agent': 'ApplyForUs/1.0' },
        timeout: 10000,
      });
      return this.mapJob(response.data);
    } catch {
      // Fallback to fetching all and filtering
      const jobs = await this.fetchJobs({ limit: 500 });
      const job = jobs.find(j => j.external_id === externalId);
      if (!job) {
        throw new Error(`Job ${externalId} not found`);
      }
      return job;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.THEMUSE,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: rawJob.remote_type === 'remote' ? RemoteType.REMOTE : RemoteType.ONSITE,
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
      ats_platform: 'TheMuse',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}?page=1`, {
        headers: { 'User-Agent': 'ApplyForUs/1.0' },
        timeout: 5000,
      });
      return response.status === 200 && response.data?.results;
    } catch {
      return false;
    }
  }

  private mapEmploymentType(levels: any[]): string {
    if (!levels || levels.length === 0) return 'full_time';

    const levelNames = levels.map((l: any) => (l.name || l.short_name || '').toLowerCase()).join(' ');

    if (levelNames.includes('intern')) return 'internship';
    if (levelNames.includes('contract') || levelNames.includes('freelance')) return 'contract';
    if (levelNames.includes('part-time') || levelNames.includes('part time')) return 'part_time';
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

  private mapExperienceLevel(levels: any[]): string {
    if (!levels || levels.length === 0) return 'mid';

    const levelNames = levels.map((l: any) => (l.name || l.short_name || '').toLowerCase()).join(' ');

    if (levelNames.includes('senior') || levelNames.includes('manager')) return 'senior';
    if (levelNames.includes('junior') || levelNames.includes('entry')) return 'junior';
    if (levelNames.includes('intern')) return 'entry';
    if (levelNames.includes('lead') || levelNames.includes('principal')) return 'lead';
    if (levelNames.includes('director') || levelNames.includes('executive') || levelNames.includes('vp')) return 'executive';
    if (levelNames.includes('mid')) return 'mid';
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
