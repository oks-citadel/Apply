import { HttpService } from '@nestjs/axios';
import { BaseJobAdapter } from './base.adapter';
import {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * Greenhouse ATS Adapter
 * Uses Greenhouse Job Board API (public) or Harvest API (authenticated)
 */
export class GreenhouseAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.greenhouse.io/v1';
  private readonly HARVEST_API_URL = 'https://harvest.greenhouse.io/v1';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'Greenhouse';
  }

  getProvider(): string {
    return 'greenhouse';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 100;

    try {
      // Return mock data if using mock board token
      if (this.source.credentials?.api_key?.startsWith('mock_')) {
        const { mockGreenhouseJobs } = await import('./mock-data');
        const jobs = mockGreenhouseJobs.jobs.map((job) => this.normalizeJob(job));

        return {
          jobs,
          pagination: {
            currentPage: page,
            totalResults: jobs.length,
            totalPages: 1,
            hasMore: false,
          },
          metadata: {
            apiVersion: 'v1',
            boardToken: this.source.credentials?.api_key,
            source: 'mock',
          },
        };
      }

      // Use Job Board API for public listings
      const boardToken = this.source.credentials?.api_key;
      const url = `${this.API_BASE_URL}/boards/${boardToken}/jobs`;

      const params: any = {
        content: 'true', // Include job description
      };

      const response = await this.makeRequest(url, {
        method: 'GET',
        params,
      });

      let jobs = response.jobs || [];

      // Filter based on options
      if (options?.keywords?.length) {
        const keywords = options.keywords.map((k) => k.toLowerCase());
        jobs = jobs.filter((job: any) => {
          const searchText = `${job.title} ${job.departments?.map((d: any) => d.name).join(' ')}`.toLowerCase();
          return keywords.some((keyword) => searchText.includes(keyword));
        });
      }

      if (options?.location) {
        jobs = jobs.filter((job: any) =>
          job.location?.name?.toLowerCase().includes(options.location.toLowerCase()),
        );
      }

      // Paginate
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
          apiVersion: 'v1',
          boardToken,
        },
      };
    } catch (error) {
      this.logger.error(`Greenhouse fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(rawJob.location?.name || '');

    return {
      externalId: rawJob.id?.toString(),
      title: rawJob.title,
      companyName:
        this.source.config?.custom?.company_name || 'Company via Greenhouse',
      location: rawJob.location?.name,
      ...location,
      remoteType: this.detectRemoteType(rawJob.location?.name || ''),
      description: rawJob.content || rawJob.description || '',
      requirements: this.extractRequirements(rawJob.content || ''),
      postedAt: rawJob.updated_at ? new Date(rawJob.updated_at) : undefined,
      applicationUrl: rawJob.absolute_url,
      atsPlatform: 'greenhouse',
      atsMetadata: {
        id: rawJob.id,
        internal_job_id: rawJob.internal_job_id,
        requisition_id: rawJob.requisition_id,
        departments: rawJob.departments,
        offices: rawJob.offices,
      },
      metadata: {
        compliance: rawJob.compliance,
        demographics: rawJob.demographics,
      },
    };
  }

  private extractRequirements(content: string): string[] {
    const requirements: string[] = [];
    const lines = content.split('\n');

    let inRequirementsSection = false;
    for (const line of lines) {
      const trimmed = line.trim();

      if (/qualifications|requirements|you have|must have/i.test(trimmed)) {
        inRequirementsSection = true;
        continue;
      }

      if (
        /responsibilities|about|benefits|what we offer|bonus/i.test(trimmed)
      ) {
        inRequirementsSection = false;
      }

      if (inRequirementsSection && /^[•\-\*]/.test(trimmed)) {
        requirements.push(trimmed.replace(/^[•\-\*]\s*/, ''));
      }
    }

    return requirements;
  }
}
