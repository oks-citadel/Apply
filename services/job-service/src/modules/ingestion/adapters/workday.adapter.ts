import { HttpService } from '@nestjs/axios';
import { BaseJobAdapter } from './base.adapter';
import {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * Workday ATS Adapter
 * Note: Workday doesn't have a public API, this uses their public job board RSS/JSON feeds
 */
export class WorkdayAdapter extends BaseJobAdapter {
  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'Workday';
  }

  getProvider(): string {
    return 'workday';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    try {
      // Workday uses company-specific job board URLs
      const companyUrl = this.source.config?.custom?.company_url;
      if (!companyUrl) {
        throw new Error('Workday company URL not configured');
      }

      // Workday job board typically at: https://[company].wd5.myworkdayjobs.com/[site]/jobs
      const url = `${companyUrl}`;

      const params: any = {};

      if (options?.location) {
        params.locationCountry = options.location;
      }

      if (options?.keywords?.length) {
        params.searchText = options.keywords.join(' ');
      }

      // Workday uses pagination with offset
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      params.offset = (page - 1) * pageSize;
      params.limit = pageSize;

      const response = await this.makeRequest(url, {
        method: 'GET',
        params,
        headers: {
          Accept: 'application/json',
        },
      });

      const jobs =
        response.jobPostings?.map((job: any) => this.normalizeJob(job)) ||
        response.jobs?.map((job: any) => this.normalizeJob(job)) ||
        [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: response.total || jobs.length,
          hasMore: jobs.length === pageSize,
        },
        metadata: {
          companyUrl,
        },
      };
    } catch (error) {
      this.logger.error(`Workday fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(
      rawJob.location || rawJob.primaryLocation?.descriptor || '',
    );

    return {
      externalId: rawJob.bulletFields?.[0] || rawJob.id || rawJob.externalPath,
      title: rawJob.title || rawJob.jobReqTitle,
      companyName:
        this.source.config?.custom?.company_name || 'Company via Workday',
      location: rawJob.location || rawJob.primaryLocation?.descriptor,
      ...location,
      remoteType: this.detectRemoteType(
        rawJob.location || rawJob.primaryLocation?.descriptor || '',
      ),
      description: rawJob.jobDescription || rawJob.description || '',
      employmentType: this.mapEmploymentType(rawJob.timeType),
      postedAt: rawJob.postedOn ? new Date(rawJob.postedOn) : undefined,
      applicationUrl: rawJob.externalUrl || `${this.source.config?.custom?.company_url}${rawJob.externalPath}`,
      atsPlatform: 'workday',
      atsMetadata: {
        bulletFields: rawJob.bulletFields,
        timeType: rawJob.timeType,
        jobFamily: rawJob.jobFamily,
        locations: rawJob.locations,
      },
      metadata: {
        locale: rawJob.locale,
        jobFamilyGroup: rawJob.jobFamilyGroup,
      },
    };
  }

  private mapEmploymentType(timeType: string): any {
    const mapping: Record<string, any> = {
      'Full time': 'full_time',
      'Full_time': 'full_time',
      'Part time': 'part_time',
      'Part_time': 'part_time',
      'Contract': 'contract',
      'Temporary': 'temporary',
      'Intern': 'internship',
    };
    return mapping[timeType] || 'full_time';
  }
}
