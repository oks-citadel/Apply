
import { BaseJobAdapter } from './base.adapter';
import { HttpService } from '@nestjs/axios';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * Glassdoor API Adapter
 */
export class GlassdoorAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.glassdoor.com/api/api.htm';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'Glassdoor';
  }

  getProvider(): string {
    return 'glassdoor';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    try {
      // Return mock data if using mock API key
      if (this.source.credentials?.api_key?.startsWith('mock_')) {
        const { mockGlassdoorJobs } = await import('./mock-data');
        const jobs = mockGlassdoorJobs.map((job) => this.normalizeJob(job));

        return {
          jobs,
          pagination: {
            currentPage: page,
            totalResults: jobs.length,
            hasMore: false,
          },
          metadata: {
            apiVersion: '1',
            source: 'mock',
          },
        };
      }

      const params: any = {
        't.p': this.source.credentials?.api_key,
        't.k': this.source.credentials?.client_id,
        action: 'jobs-stats',
        v: '1',
        format: 'json',
        pn: page,
        ps: pageSize,
        returnJobListings: true,
      };

      if (options?.keywords?.length) {
        params.q = options.keywords.join(' ');
      }

      if (options?.location) {
        params.l = options.location;
      }

      const response = await this.makeRequest(this.API_BASE_URL, {
        method: 'GET',
        params,
      });

      const jobs =
        response.response?.jobListings?.map((job: any) =>
          this.normalizeJob(job),
        ) || [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: response.response?.totalJobsAvailable,
          hasMore: page * pageSize < response.response?.totalJobsAvailable,
        },
        metadata: {
          apiVersion: '1',
        },
      };
    } catch (error) {
      this.logger.error(`Glassdoor fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(rawJob.location);
    const salary = this.extractSalary(
      rawJob.salarySource || rawJob.estimatedSalary || '',
    );

    return {
      externalId: rawJob.jobListingId?.toString(),
      title: rawJob.jobTitle,
      companyName: rawJob.employer,
      location: rawJob.location,
      ...location,
      remoteType: this.detectRemoteType(`${rawJob.location  } ${  rawJob.jobTitle}`),
      description: rawJob.jobDescription || '',
      employmentType: this.mapEmploymentType(rawJob.employmentType),
      ...salary,
      postedAt: rawJob.discoverDate ? new Date(rawJob.discoverDate) : undefined,
      applicationUrl: rawJob.jobViewUrl,
      metadata: {
        rating: rawJob.overallRating,
        recommendToFriend: rawJob.recommendToFriend,
        cultureAndValues: rawJob.cultureAndValues,
        compensationAndBenefits: rawJob.compensationAndBenefits,
      },
    };
  }

  private mapEmploymentType(type: string): any {
    const mapping: Record<string, any> = {
      'FULL_TIME': 'full_time',
      'PART_TIME': 'part_time',
      'CONTRACT': 'contract',
      'TEMPORARY': 'temporary',
      'INTERN': 'internship',
    };
    return mapping[type] || 'full_time';
  }
}
