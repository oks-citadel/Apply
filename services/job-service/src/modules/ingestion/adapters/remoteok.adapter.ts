
import { BaseJobAdapter } from './base.adapter';
import { HttpService } from '@nestjs/axios';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * RemoteOK Adapter
 * Uses RemoteOK's public API
 */
export class RemoteOKAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://remoteok.com/api';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'RemoteOK';
  }

  getProvider(): string {
    return 'remoteok';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    try {
      const response = await this.makeRequest(this.API_BASE_URL, {
        method: 'GET',
        headers: {
          'User-Agent': 'ApplyForUs Job Aggregator/1.0',
        },
      });

      // RemoteOK returns array where first element is metadata
      let jobs = Array.isArray(response) ? response.slice(1) : [];

      // Filter by keywords
      if (options?.keywords?.length) {
        const keywords = options.keywords.map((k) => k.toLowerCase());
        jobs = jobs.filter((job: any) => {
          const searchText =
            `${job.position} ${job.tags?.join(' ')} ${job.description}`.toLowerCase();
          return keywords.some((keyword) => searchText.includes(keyword));
        });
      }

      // Filter by location (though most are remote)
      if (options?.location && options.location.toLowerCase() !== 'remote') {
        jobs = jobs.filter((job: any) =>
          job.location?.toLowerCase().includes(options.location.toLowerCase()),
        );
      }

      // Filter by date
      if (options?.startDate) {
        const startTimestamp = Math.floor(options.startDate.getTime() / 1000);
        jobs = jobs.filter((job: any) => job.date >= startTimestamp);
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
          source: 'remoteok',
        },
      };
    } catch (error) {
      this.logger.error(`RemoteOK fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(rawJob.location || 'Remote');

    return {
      externalId: rawJob.id || rawJob.slug,
      title: rawJob.position,
      companyName: rawJob.company,
      location: rawJob.location || 'Remote',
      ...location,
      remoteType: 'remote', // All RemoteOK jobs are remote
      description: rawJob.description || '',
      skills: rawJob.tags || [],
      employmentType: this.detectEmploymentType(rawJob.position),
      salaryMin: rawJob.salary_min,
      salaryMax: rawJob.salary_max,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      postedAt: rawJob.date ? new Date(rawJob.date * 1000) : undefined,
      applicationUrl: rawJob.url || `https://remoteok.com/remote-jobs/${rawJob.slug}`,
      tags: rawJob.tags || [],
      metadata: {
        logo: rawJob.company_logo,
        epoch: rawJob.epoch,
        featured: rawJob.featured,
      },
    };
  }

  private detectEmploymentType(title: string): any {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('intern')) {return 'internship';}
    if (lowerTitle.includes('contract') || lowerTitle.includes('freelance'))
      {return 'contract';}
    if (lowerTitle.includes('part-time') || lowerTitle.includes('part time'))
      {return 'part_time';}

    return 'full_time';
  }
}
