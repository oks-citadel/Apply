import { HttpService } from '@nestjs/axios';
import { BaseJobAdapter } from './base.adapter';
import {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * Lever ATS Adapter
 */
export class LeverAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.lever.co/v0/postings';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'Lever';
  }

  getProvider(): string {
    return 'lever';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    try {
      // Lever uses company subdomain
      const company = this.source.config?.custom?.company_subdomain;
      if (!company) {
        throw new Error('Lever company subdomain not configured');
      }

      const url = `${this.API_BASE_URL}/${company}`;
      const params: any = {
        mode: 'json',
      };

      if (options?.location) {
        params.location = options.location;
      }

      if (options?.jobType) {
        params.commitment = this.mapJobType(options.jobType);
      }

      const response = await this.makeRequest(url, {
        method: 'GET',
        params,
      });

      let jobs = Array.isArray(response) ? response : [];

      // Filter by keywords if provided
      if (options?.keywords?.length) {
        const keywords = options.keywords.map((k) => k.toLowerCase());
        jobs = jobs.filter((job: any) => {
          const searchText =
            `${job.text} ${job.categories?.team} ${job.categories?.department}`.toLowerCase();
          return keywords.some((keyword) => searchText.includes(keyword));
        });
      }

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 50;
      const start = (page - 1) * pageSize;
      const paginatedJobs = jobs.slice(start, start + pageSize);

      const normalizedJobs = paginatedJobs.map((job: any) =>
        this.normalizeJob(job),
      );

      return {
        jobs: normalizedJobs,
        pagination: {
          currentPage: page,
          totalResults: jobs.length,
          totalPages: Math.ceil(jobs.length / pageSize),
          hasMore: start + paginatedJobs.length < jobs.length,
        },
        metadata: {
          apiVersion: 'v0',
          company,
        },
      };
    } catch (error) {
      this.logger.error(`Lever fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(rawJob.categories?.location || '');

    return {
      externalId: rawJob.id,
      title: rawJob.text,
      companyName:
        this.source.config?.custom?.company_name || 'Company via Lever',
      location: rawJob.categories?.location,
      ...location,
      remoteType: this.detectRemoteType(
        rawJob.categories?.location || rawJob.text,
      ),
      description: rawJob.description || rawJob.descriptionPlain || '',
      requirements: this.extractLists(rawJob.lists || []),
      employmentType: this.mapEmploymentType(rawJob.categories?.commitment),
      postedAt: rawJob.createdAt ? new Date(rawJob.createdAt * 1000) : undefined,
      applicationUrl: rawJob.applyUrl || rawJob.hostedUrl,
      atsPlatform: 'lever',
      atsMetadata: {
        id: rawJob.id,
        team: rawJob.categories?.team,
        department: rawJob.categories?.department,
        level: rawJob.categories?.level,
        allLocations: rawJob.categories?.allLocations,
        workplaceType: rawJob.workplaceType,
      },
      tags: rawJob.tags || [],
      metadata: {
        salary: rawJob.salary,
        equity: rawJob.equity,
      },
    };
  }

  private mapJobType(jobType: string): string {
    const mapping: Record<string, string> = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
      internship: 'Internship',
    };
    return mapping[jobType] || 'Full-time';
  }

  private mapEmploymentType(commitment: string): any {
    const mapping: Record<string, any> = {
      'Full-time': 'full_time',
      'Part-time': 'part_time',
      'Contract': 'contract',
      'Internship': 'internship',
    };
    return mapping[commitment] || 'full_time';
  }

  private extractLists(lists: any[]): string[] {
    const requirements: string[] = [];

    for (const list of lists) {
      if (
        list.text?.toLowerCase().includes('qualifications') ||
        list.text?.toLowerCase().includes('requirements')
      ) {
        requirements.push(...(list.content?.split('\n') || []));
      }
    }

    return requirements.filter((r) => r.trim());
  }
}
