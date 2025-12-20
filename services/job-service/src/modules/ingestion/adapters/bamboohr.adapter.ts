
import { BaseJobAdapter } from './base.adapter';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';
import type { HttpService } from '@nestjs/axios';

/**
 * BambooHR ATS Adapter
 */
export class BambooHRAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.bamboohr.com/api/gateway.php';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'BambooHR';
  }

  getProvider(): string {
    return 'bamboohr';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    try {
      const subdomain = this.source.config?.custom?.subdomain;
      if (!subdomain) {
        throw new Error('BambooHR subdomain not configured');
      }

      // BambooHR applicant tracking endpoint
      const url = `${this.API_BASE_URL}/${subdomain}/v1/applicant_tracking/jobs`;

      const headers = {
        ...this.getAuthHeaders(),
        Accept: 'application/json',
      };

      const response = await this.makeRequest(url, {
        method: 'GET',
        headers,
      });

      let jobs = response.jobs || response || [];

      // Filter by status (only active jobs)
      jobs = jobs.filter((job: any) => job.status === 'Open' || !job.status);

      // Filter by keywords
      if (options?.keywords?.length) {
        const keywords = options.keywords.map((k) => k.toLowerCase());
        jobs = jobs.filter((job: any) => {
          const searchText =
            `${job.title} ${job.department} ${job.description}`.toLowerCase();
          return keywords.some((keyword) => searchText.includes(keyword));
        });
      }

      // Filter by location
      if (options?.location) {
        jobs = jobs.filter((job: any) =>
          job.location?.name
            ?.toLowerCase()
            .includes(options.location.toLowerCase()),
        );
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
          apiVersion: 'v1',
          subdomain,
        },
      };
    } catch (error) {
      this.logger.error(`BambooHR fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(rawJob.location?.name || '');

    return {
      externalId: rawJob.id?.toString() || rawJob.jobId?.toString(),
      title: rawJob.title || rawJob.jobTitle,
      companyName:
        this.source.config?.custom?.company_name || 'Company via BambooHR',
      location: rawJob.location?.name,
      ...location,
      remoteType: this.detectRemoteType(rawJob.location?.name || rawJob.title),
      description: rawJob.description || rawJob.jobDescription || '',
      requirements: this.extractRequirements(rawJob.description || ''),
      employmentType: this.mapEmploymentType(rawJob.employmentType),
      postedAt: rawJob.postingDate
        ? new Date(rawJob.postingDate)
        : rawJob.createdDate
        ? new Date(rawJob.createdDate)
        : undefined,
      applicationUrl: rawJob.applicationUrl || `https://${this.source.config?.custom?.subdomain}.bamboohr.com/jobs/view.php?id=${rawJob.id}`,
      atsPlatform: 'bamboohr',
      atsMetadata: {
        id: rawJob.id,
        department: rawJob.department,
        minimumExperience: rawJob.minimumExperience,
        compensationType: rawJob.compensationType,
      },
      metadata: {
        status: rawJob.status,
        hiringLead: rawJob.hiringLead,
      },
    };
  }

  private mapEmploymentType(type: string): any {
    const mapping: Record<string, any> = {
      'Full-Time': 'full_time',
      'Part-Time': 'part_time',
      'Contract': 'contract',
      'Temporary': 'temporary',
      'Intern': 'internship',
      'Seasonal': 'temporary',
    };
    return mapping[type] || 'full_time';
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const lines = description.split('\n');

    let inRequirementsSection = false;
    for (const line of lines) {
      const trimmed = line.trim();

      if (/qualifications|requirements|skills|experience/i.test(trimmed)) {
        inRequirementsSection = true;
        continue;
      }

      if (/responsibilities|benefits|about/i.test(trimmed)) {
        inRequirementsSection = false;
      }

      if (inRequirementsSection && /^[•\-\*]/.test(trimmed)) {
        requirements.push(trimmed.replace(/^[•\-\*]\s*/, ''));
      }
    }

    return requirements;
  }

  protected getAuthHeaders(): Record<string, string> {
    const credentials = this.source.credentials || {};
    if (credentials.api_key) {
      const auth = Buffer.from(`${credentials.api_key}:x`).toString('base64');
      return {
        Authorization: `Basic ${auth}`,
      };
    }
    return {};
  }
}
