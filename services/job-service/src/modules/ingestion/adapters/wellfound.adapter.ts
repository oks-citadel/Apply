
import { BaseJobAdapter } from './base.adapter';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';
import type { HttpService } from '@nestjs/axios';

/**
 * Wellfound (formerly AngelList Talent) Adapter
 */
export class WellfoundAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.wellfound.com/v1';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'Wellfound';
  }

  getProvider(): string {
    return 'wellfound';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;

    try {
      const params: any = {
        page,
        per_page: pageSize,
      };

      if (options?.keywords?.length) {
        params.role = options.keywords.join(',');
      }

      if (options?.location) {
        params.location = options.location;
      }

      if (options?.remoteOnly) {
        params.remote = 'true';
      }

      const response = await this.makeRequest(`${this.API_BASE_URL}/jobs`, {
        method: 'GET',
        params,
        headers: {
          ...this.getAuthHeaders(),
        },
      });

      const jobs =
        response.jobs?.map((job: any) => this.normalizeJob(job)) ||
        response.startups?.flatMap((s: any) =>
          s.jobs?.map((j: any) => this.normalizeJob(j, s)),
        ) ||
        [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: response.total || jobs.length,
          totalPages: response.last_page || Math.ceil(jobs.length / pageSize),
          hasMore: response.page < response.last_page || jobs.length === pageSize,
        },
        metadata: {
          apiVersion: 'v1',
        },
      };
    } catch (error) {
      this.logger.error(`Wellfound fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any, startup?: any): NormalizedJob {
    const company = startup || rawJob.startup || rawJob.company || {};
    const location = this.cleanLocation(
      rawJob.location_name || rawJob.locationName || '',
    );

    return {
      externalId: rawJob.id?.toString(),
      title: rawJob.title || rawJob.name,
      companyName: company.name || rawJob.company_name,
      location: rawJob.location_name || rawJob.locationName,
      ...location,
      remoteType: this.detectRemoteType(
        rawJob.remote_ok || rawJob.remoteOk
          ? 'remote'
          : rawJob.location_name || '',
      ),
      description: rawJob.description || '',
      requirements: this.extractSkills(rawJob),
      skills: rawJob.tags?.map((t: any) => t.name) || rawJob.skill_tags || [],
      experienceLevel: this.mapExperienceLevel(rawJob.experience_level),
      employmentType: this.mapEmploymentType(rawJob.job_type),
      salaryMin: rawJob.salary_min || rawJob.min_annual_salary,
      salaryMax: rawJob.salary_max || rawJob.max_annual_salary,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      postedAt: rawJob.created_at ? new Date(rawJob.created_at) : undefined,
      applicationUrl: rawJob.angellist_url || rawJob.url,
      tags: rawJob.tags?.map((t: any) => t.name) || [],
      metadata: {
        equity_min: rawJob.equity_min,
        equity_max: rawJob.equity_max,
        startup: {
          id: company.id,
          name: company.name,
          size: company.company_size,
          markets: company.markets,
        },
      },
    };
  }

  private mapExperienceLevel(level: string): any {
    const mapping: Record<string, any> = {
      'junior': 'junior',
      'mid': 'mid',
      'senior': 'senior',
      'lead': 'lead',
      'principal': 'lead',
    };
    return mapping[level?.toLowerCase()] || undefined;
  }

  private mapEmploymentType(type: string): any {
    const mapping: Record<string, any> = {
      'full-time': 'full_time',
      'fulltime': 'full_time',
      'part-time': 'part_time',
      'contract': 'contract',
      'internship': 'internship',
    };
    return mapping[type?.toLowerCase()] || 'full_time';
  }

  private extractSkills(rawJob: any): string[] {
    const skills: string[] = [];

    if (rawJob.skill_tags) {
      skills.push(...rawJob.skill_tags);
    }

    if (rawJob.tags) {
      skills.push(...rawJob.tags.map((t: any) => t.name || t));
    }

    return [...new Set(skills)]; // Remove duplicates
  }
}
