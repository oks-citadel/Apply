
import { BaseJobAdapter } from './base.adapter';
import { HttpService } from '@nestjs/axios';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * Google Jobs (Google for Jobs) API Adapter
 * Uses Google Cloud Talent Solution API
 */
export class GoogleJobsAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL =
    'https://jobs.googleapis.com/v4/projects';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'Google Jobs';
  }

  getProvider(): string {
    return 'google_jobs';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const pageSize = options?.pageSize || 100;

    try {
      const projectId = this.source.credentials?.client_id;
      const tenant = this.source.config?.custom?.tenant || 'default';

      const searchParams: any = {
        jobQuery: {},
        pageSize,
        orderBy: 'posting_publish_time desc',
      };

      if (options?.keywords?.length) {
        searchParams.jobQuery.query = options.keywords.join(' ');
      }

      if (options?.location) {
        searchParams.jobQuery.locationFilters = [
          {
            address: options.location,
          },
        ];
      }

      if (options?.pageToken) {
        searchParams.pageToken = options.pageToken;
      }

      if (options?.startDate) {
        searchParams.jobQuery.publishTimeRange = {
          startTime: options.startDate.toISOString(),
          endTime: new Date().toISOString(),
        };
      }

      const response = await this.makeRequest(
        `${this.API_BASE_URL}/${projectId}/tenants/${tenant}/jobs:search`,
        {
          method: 'POST',
          data: searchParams,
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        },
      );

      const jobs =
        response.matchingJobs?.map((match: any) =>
          this.normalizeJob(match.job),
        ) || [];

      return {
        jobs,
        pagination: {
          currentPage: options?.page || 1,
          totalResults: response.totalSize,
          hasMore: !!response.nextPageToken,
          nextPageToken: response.nextPageToken,
        },
        metadata: {
          apiVersion: 'v4',
          estimatedTotalSize: response.estimatedTotalSize,
        },
      };
    } catch (error) {
      this.logger.error(`Google Jobs fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const addresses = rawJob.addresses || [];
    const location = addresses[0] || '';
    const locationParts = this.cleanLocation(location);

    return {
      externalId: rawJob.name,
      title: rawJob.title,
      companyName: rawJob.company?.displayName || rawJob.companyName,
      location,
      ...locationParts,
      remoteType: this.mapRemoteType(rawJob.postingRegion),
      description: rawJob.description,
      requirements: rawJob.qualifications?.split('\n').filter((q: string) => q.trim()) || [],
      benefits: rawJob.benefits?.split('\n').filter((b: string) => b.trim()) || [],
      skills: rawJob.degreeTypes || [],
      experienceLevel: this.mapExperienceLevel(
        rawJob.jobLevel || rawJob.jobBenefits,
      ),
      employmentType: this.mapEmploymentType(rawJob.employmentTypes?.[0]),
      applicationUrl: rawJob.applicationInfo?.uris?.[0] || rawJob.postingCreateTime,
      postedAt: rawJob.postingPublishTime
        ? new Date(rawJob.postingPublishTime)
        : undefined,
      expiresAt: rawJob.postingExpireTime
        ? new Date(rawJob.postingExpireTime)
        : undefined,
      metadata: {
        visibility: rawJob.visibility,
        languageCode: rawJob.languageCode,
        promotionValue: rawJob.promotionValue,
        incentives: rawJob.incentives,
      },
    };
  }

  private mapRemoteType(postingRegion: string): 'onsite' | 'remote' | 'hybrid' {
    if (postingRegion === 'TELECOMMUTE') {return 'remote';}
    return 'onsite';
  }

  private mapExperienceLevel(level: string): any {
    const mapping: Record<string, any> = {
      'ENTRY_LEVEL': 'entry',
      'EXPERIENCED': 'mid',
      'MANAGER': 'senior',
      'DIRECTOR': 'lead',
      'EXECUTIVE': 'executive',
    };
    return mapping[level] || undefined;
  }

  private mapEmploymentType(type: string): any {
    const mapping: Record<string, any> = {
      'FULL_TIME': 'full_time',
      'PART_TIME': 'part_time',
      'CONTRACTOR': 'contract',
      'CONTRACT_TO_HIRE': 'contract',
      'TEMPORARY': 'temporary',
      'INTERN': 'internship',
      'VOLUNTEER': 'internship',
      'PER_DIEM': 'part_time',
      'FLY_IN_FLY_OUT': 'contract',
    };
    return mapping[type] || 'full_time';
  }
}
