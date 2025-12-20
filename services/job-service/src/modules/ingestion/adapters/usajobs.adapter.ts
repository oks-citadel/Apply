
import { BaseJobAdapter } from './base.adapter';
import { HttpService } from '@nestjs/axios';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * USAJobs Adapter
 * Uses the official USAJobs API
 */
export class USAJobsAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://data.usajobs.gov/api/search';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'USAJobs';
  }

  getProvider(): string {
    return 'usajobs';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 100;

    try {
      const params: any = {
        ResultsPerPage: pageSize,
        Page: page,
      };

      if (options?.keywords?.length) {
        params.Keyword = options.keywords.join(' ');
      }

      if (options?.location) {
        params.LocationName = options.location;
      }

      if (options?.startDate) {
        const days = Math.floor(
          (Date.now() - options.startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        params.DatePosted = days;
      }

      if (options?.remoteOnly) {
        params.RemoteIndicator = 'true';
      }

      const headers = {
        Host: 'data.usajobs.gov',
        'User-Agent': this.source.credentials?.username || 'job-aggregator@applyforus.com',
        'Authorization-Key': this.source.credentials?.api_key,
      };

      const response = await this.makeRequest(this.API_BASE_URL, {
        method: 'GET',
        params,
        headers,
      });

      const searchResult = response.SearchResult || {};
      const jobs =
        searchResult.SearchResultItems?.map((item: any) =>
          this.normalizeJob(item.MatchedObjectDescriptor),
        ) || [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: searchResult.SearchResultCount,
          totalPages: Math.ceil(searchResult.SearchResultCount / pageSize),
          hasMore: searchResult.SearchResultCount > page * pageSize,
        },
        metadata: {
          apiVersion: '1',
          userArea: response.LanguageCode,
        },
      };
    } catch (error) {
      this.logger.error(`USAJobs fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const locations =
      rawJob.PositionLocation?.map((loc: any) => loc.LocationName).join('; ') ||
      '';
    const firstLocation = rawJob.PositionLocation?.[0] || {};
    const locationParts = this.cleanLocation(firstLocation.LocationName || '');

    return {
      externalId: rawJob.PositionID,
      title:
        rawJob.PositionTitle ||
        rawJob.UserArea?.Details?.JobSummary?.PositionTitle,
      companyName:
        rawJob.OrganizationName || rawJob.DepartmentName || 'U.S. Government',
      location: locations,
      ...locationParts,
      remoteType: rawJob.PositionRemoteIndicator?.[0]?.RemoteIndicator
        ? 'remote'
        : 'onsite',
      description:
        rawJob.UserArea?.Details?.JobSummary?.WhoMayApply?.Name ||
        rawJob.PositionFormattedDescription?.[0]?.Content ||
        '',
      requirements: this.extractQualifications(rawJob),
      skills: rawJob.PositionFormattedDescription?.[0]?.Content
        ? this.extractSkills(
            rawJob.PositionFormattedDescription[0].Content,
          )
        : [],
      experienceLevel: this.mapPayPlan(rawJob.JobGrade?.[0]?.Code),
      employmentType: this.mapEmploymentType(
        rawJob.PositionSchedule?.[0]?.Name,
      ),
      salaryMin: this.parseSalary(rawJob.PositionRemuneration?.[0]?.MinimumRange),
      salaryMax: this.parseSalary(rawJob.PositionRemuneration?.[0]?.MaximumRange),
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
      postedAt: rawJob.PublicationStartDate
        ? new Date(rawJob.PublicationStartDate)
        : undefined,
      expiresAt: rawJob.ApplicationCloseDate
        ? new Date(rawJob.ApplicationCloseDate)
        : undefined,
      applicationUrl: rawJob.ApplyURI?.[0] || rawJob.PositionURI,
      metadata: {
        department: rawJob.DepartmentName,
        subAgency: rawJob.SubAgency,
        payPlan: rawJob.JobGrade?.[0]?.Code,
        series: rawJob.JobCategory?.[0]?.Code,
        securityClearance: rawJob.SecurityClearance,
        travelRequired: rawJob.TravelCode,
        supervisoryStatus: rawJob.SupervisoryStatus,
      },
    };
  }

  private extractQualifications(rawJob: any): string[] {
    const qualifications: string[] = [];
    const content =
      rawJob.QualificationSummary ||
      rawJob.UserArea?.Details?.JobSummary?.Qualifications;

    if (content) {
      const lines = content.split(/[.\n]/).filter((l: string) => l.trim().length > 20);
      qualifications.push(...lines.slice(0, 5));
    }

    return qualifications;
  }

  private extractSkills(content: string): string[] {
    const skills: string[] = [];
    const commonSkills = [
      'communication',
      'leadership',
      'management',
      'analysis',
      'technical',
      'planning',
      'research',
    ];

    const lowerContent = content.toLowerCase();
    for (const skill of commonSkills) {
      if (lowerContent.includes(skill)) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private mapPayPlan(payPlan: string): any {
    if (!payPlan) {return undefined;}

    // GS (General Schedule) grades mapping
    if (payPlan.startsWith('GS')) {
      const grade = parseInt(payPlan.replace('GS', ''));
      if (grade <= 7) {return 'entry';}
      if (grade <= 11) {return 'mid';}
      if (grade <= 13) {return 'senior';}
      return 'lead';
    }

    return undefined;
  }

  private mapEmploymentType(schedule: string): any {
    if (!schedule) {return 'full_time';}

    const lowerSchedule = schedule.toLowerCase();
    if (lowerSchedule.includes('part')) {return 'part_time';}
    if (lowerSchedule.includes('intermittent')) {return 'part_time';}
    if (lowerSchedule.includes('seasonal')) {return 'temporary';}

    return 'full_time';
  }

  private parseSalary(salaryStr: string): number | undefined {
    if (!salaryStr) {return undefined;}
    const match = salaryStr.match(/\d+/g);
    if (match) {
      return parseInt(match.join(''));
    }
    return undefined;
  }
}
