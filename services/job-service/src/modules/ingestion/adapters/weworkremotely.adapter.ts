
import { BaseJobAdapter } from './base.adapter';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';
import type { HttpService } from '@nestjs/axios';

/**
 * We Work Remotely Adapter
 * Uses their job board RSS feed or web scraping
 */
export class WeWorkRemotelyAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://weworkremotely.com/remote-jobs.json';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'We Work Remotely';
  }

  getProvider(): string {
    return 'weworkremotely';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    try {
      const response = await this.makeRequest(this.API_BASE_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      let jobs: any[] = [];

      // Parse the response structure
      if (Array.isArray(response)) {
        jobs = response;
      } else if (response.jobs) {
        jobs = response.jobs;
      } else {
        // If response contains categories, flatten them
        const categories = Object.values(response);
        jobs = categories.flatMap((category: any) => category.jobs || []);
      }

      // Filter by keywords
      if (options?.keywords?.length) {
        const keywords = options.keywords.map((k) => k.toLowerCase());
        jobs = jobs.filter((job: any) => {
          const searchText =
            `${job.title} ${job.company} ${job.category} ${job.tags}`.toLowerCase();
          return keywords.some((keyword) => searchText.includes(keyword));
        });
      }

      // Filter by date
      if (options?.startDate) {
        jobs = jobs.filter((job: any) => {
          const jobDate = new Date(job.published_at || job.created_at);
          return jobDate >= options.startDate;
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
          source: 'weworkremotely',
        },
      };
    } catch (error) {
      this.logger.error(`We Work Remotely fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    return {
      externalId: rawJob.id?.toString() || rawJob.slug,
      title: rawJob.title,
      companyName: rawJob.company || rawJob.company_name,
      location: 'Remote',
      country: rawJob.region || 'Anywhere',
      remoteType: 'remote', // All WWR jobs are remote
      description: rawJob.description || '',
      employmentType: this.mapEmploymentType(rawJob.category || rawJob.type),
      postedAt: rawJob.published_at
        ? new Date(rawJob.published_at)
        : rawJob.created_at
        ? new Date(rawJob.created_at)
        : undefined,
      applicationUrl: rawJob.url || `https://weworkremotely.com/remote-jobs/${rawJob.slug}`,
      tags: this.extractTags(rawJob),
      metadata: {
        category: rawJob.category,
        region: rawJob.region,
        logo: rawJob.company_logo,
      },
    };
  }

  private mapEmploymentType(category: string): any {
    if (!category) {return 'full_time';}

    const lowerCategory = category.toLowerCase();

    if (
      lowerCategory.includes('contract') ||
      lowerCategory.includes('freelance')
    )
      {return 'contract';}
    if (lowerCategory.includes('part-time')) {return 'part_time';}
    if (lowerCategory.includes('intern')) {return 'internship';}

    return 'full_time';
  }

  private extractTags(rawJob: any): string[] {
    const tags: string[] = [];

    if (rawJob.category) {tags.push(rawJob.category);}
    if (rawJob.region) {tags.push(rawJob.region);}
    if (rawJob.tags) {
      if (Array.isArray(rawJob.tags)) {
        tags.push(...rawJob.tags);
      } else if (typeof rawJob.tags === 'string') {
        tags.push(...rawJob.tags.split(',').map((t: string) => t.trim()));
      }
    }

    return tags;
  }
}
