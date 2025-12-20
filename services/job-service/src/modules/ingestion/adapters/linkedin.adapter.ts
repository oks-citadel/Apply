
import { BaseJobAdapter } from './base.adapter';
import { HttpService } from '@nestjs/axios';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * LinkedIn Jobs API Adapter
 * Note: This requires LinkedIn API access or uses compliant web scraping
 * For production, consider using LinkedIn's official Job Search API
 */
export class LinkedInAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.linkedin.com/v2';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'LinkedIn Jobs';
  }

  getProvider(): string {
    return 'linkedin';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 25;
    const start = (page - 1) * pageSize;

    try {
      // Return mock data if using mock access token
      if (this.source.credentials?.access_token?.startsWith('mock_')) {
        const { mockLinkedInJobs } = await import('./mock-data');
        const jobs = mockLinkedInJobs.map((job) => this.normalizeJob(job));

        return {
          jobs,
          pagination: {
            currentPage: page,
            totalResults: jobs.length,
            totalPages: 1,
            hasMore: false,
          },
          metadata: {
            responseTime: 100,
            apiVersion: '202401',
            source: 'mock',
          },
        };
      }

      // Using LinkedIn Job Search API (requires authentication)
      const params: any = {
        start,
        count: pageSize,
      };

      if (options?.keywords?.length) {
        params.keywords = options.keywords.join(' ');
      }

      if (options?.location) {
        params.location = options.location;
      }

      if (options?.jobType) {
        params.f_JT = this.mapJobType(options.jobType);
      }

      if (options?.remoteOnly) {
        params.f_WRA = 'true'; // Remote jobs filter
      }

      if (options?.startDate) {
        params.f_TPR = this.getTimePostedRange(options.startDate);
      }

      const headers = {
        ...this.getAuthHeaders(),
        'LinkedIn-Version': '202401',
      };

      const response = await this.makeRequest(
        `${this.API_BASE_URL}/jobSearch`,
        {
          method: 'GET',
          params,
          headers,
        },
      );

      const jobs = response.elements?.map((job: any) =>
        this.normalizeJob(job),
      ) || [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: response.paging?.total,
          totalPages: Math.ceil((response.paging?.total || 0) / pageSize),
          hasMore: start + jobs.length < (response.paging?.total || 0),
        },
        metadata: {
          responseTime: response.responseTime,
          apiVersion: '202401',
        },
      };
    } catch (error) {
      this.logger.error(`LinkedIn fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(
      rawJob.location?.displayName || rawJob.formattedLocation,
    );

    return {
      externalId: rawJob.id?.toString() || rawJob.entityUrn,
      title: rawJob.title || rawJob.localizedTitle,
      companyName: rawJob.company?.name || rawJob.companyDetails?.name,
      location: rawJob.location?.displayName || rawJob.formattedLocation,
      ...location,
      remoteType: this.detectRemoteType(
        rawJob.workRemoteAllowed ? 'remote' : rawJob.formattedLocation,
      ),
      description: rawJob.description?.text || '',
      requirements: this.extractRequirements(rawJob.description?.text || ''),
      skills: rawJob.skills?.map((s: any) => s.name) || [],
      experienceLevel: this.mapExperienceLevel(rawJob.experienceLevel),
      employmentType: this.mapEmploymentType(rawJob.employmentType),
      postedAt: rawJob.listedAt
        ? new Date(rawJob.listedAt)
        : rawJob.originalListedAt
        ? new Date(rawJob.originalListedAt)
        : undefined,
      applicationUrl: rawJob.applyUrl || `https://www.linkedin.com/jobs/view/${rawJob.id}`,
      metadata: {
        jobState: rawJob.jobState,
        industries: rawJob.industries,
        jobFunctions: rawJob.jobFunctions,
        workplaceTypes: rawJob.workplaceTypes,
      },
    };
  }

  private mapJobType(jobType: string): string {
    const mapping: Record<string, string> = {
      full_time: 'F',
      part_time: 'P',
      contract: 'C',
      temporary: 'T',
      internship: 'I',
      volunteer: 'V',
    };
    return mapping[jobType] || 'F';
  }

  private mapExperienceLevel(level: string): any {
    const mapping: Record<string, any> = {
      '1': 'entry',
      '2': 'entry',
      '3': 'mid',
      '4': 'senior',
      '5': 'lead',
      '6': 'executive',
      'ENTRY_LEVEL': 'entry',
      'ASSOCIATE': 'junior',
      'MID_SENIOR': 'mid',
      'DIRECTOR': 'lead',
      'EXECUTIVE': 'executive',
    };
    return mapping[level?.toString()] || undefined;
  }

  private mapEmploymentType(type: string): any {
    const mapping: Record<string, any> = {
      'FULL_TIME': 'full_time',
      'PART_TIME': 'part_time',
      'CONTRACT': 'contract',
      'TEMPORARY': 'temporary',
      'INTERNSHIP': 'internship',
      'VOLUNTEER': 'internship',
    };
    return mapping[type] || 'full_time';
  }

  private getTimePostedRange(startDate: Date): string {
    const daysDiff = Math.floor(
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 1) {return 'r86400';} // Past 24 hours
    if (daysDiff <= 7) {return 'r604800';} // Past week
    if (daysDiff <= 30) {return 'r2592000';} // Past month
    return '';
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const lines = description.split('\n');

    let inRequirementsSection = false;
    for (const line of lines) {
      const trimmed = line.trim();

      if (
        /requirements|qualifications|must have|required|you have/i.test(
          trimmed,
        )
      ) {
        inRequirementsSection = true;
        continue;
      }

      if (/responsibilities|benefits|about|we offer/i.test(trimmed)) {
        inRequirementsSection = false;
      }

      if (inRequirementsSection && /^[•\-\*]/.test(trimmed)) {
        requirements.push(trimmed.replace(/^[•\-\*]\s*/, ''));
      }
    }

    return requirements;
  }
}
