import { HttpService } from '@nestjs/axios';
import { BaseJobAdapter } from './base.adapter';
import {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * ZipRecruiter API Adapter
 */
export class ZipRecruiterAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.ziprecruiter.com/jobs/v1';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'ZipRecruiter';
  }

  getProvider(): string {
    return 'ziprecruiter';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    try {
      const params: any = {
        api_key: this.source.credentials?.api_key,
        page,
        jobs_per_page: pageSize,
      };

      if (options?.keywords?.length) {
        params.search = options.keywords.join(' ');
      }

      if (options?.location) {
        params.location = options.location;
      }

      if (options?.startDate) {
        params.days_ago = this.getDaysAgo(options.startDate);
      }

      if (options?.remoteOnly) {
        params.refine_by_location = 'remote';
      }

      const response = await this.makeRequest(this.API_BASE_URL, {
        method: 'GET',
        params,
      });

      const jobs = response.jobs?.map((job: any) => this.normalizeJob(job)) || [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: response.total_jobs,
          hasMore: jobs.length === pageSize,
        },
        metadata: {
          apiVersion: 'v1',
        },
      };
    } catch (error) {
      this.logger.error(`ZipRecruiter fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(rawJob.location);
    const salary = this.extractSalary(rawJob.salary_interval || '');

    return {
      externalId: rawJob.id || rawJob.job_id,
      title: rawJob.name || rawJob.job_title,
      companyName: rawJob.hiring_company?.name || rawJob.company,
      location: rawJob.location,
      ...location,
      remoteType: this.detectRemoteType(rawJob.location + ' ' + rawJob.name),
      description: rawJob.snippet || rawJob.job_description || '',
      employmentType: this.mapEmploymentType(rawJob.employment_type),
      ...salary,
      postedAt: rawJob.posted_time ? new Date(rawJob.posted_time) : undefined,
      applicationUrl: rawJob.url,
      metadata: {
        category: rawJob.category,
        source: rawJob.source,
        savedJob: rawJob.saved_job,
      },
    };
  }

  private mapEmploymentType(type: string): any {
    const mapping: Record<string, any> = {
      'Full-Time': 'full_time',
      'Part-Time': 'part_time',
      'Contract': 'contract',
      'Temporary': 'temporary',
      'Internship': 'internship',
    };
    return mapping[type] || 'full_time';
  }

  private getDaysAgo(startDate: Date): number {
    return Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}
