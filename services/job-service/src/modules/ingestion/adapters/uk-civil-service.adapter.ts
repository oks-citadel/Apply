
import { BaseJobAdapter } from './base.adapter';

import type {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';
import type { HttpService } from '@nestjs/axios';

/**
 * UK Civil Service Jobs Adapter
 * Uses the Civil Service Jobs API
 */
export class UKCivilServiceAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL =
    'https://api.civilservicejobs.service.gov.uk/search';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'UK Civil Service';
  }

  getProvider(): string {
    return 'uk_civil_service';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;

    try {
      const params: any = {
        page,
        pageSize,
      };

      if (options?.keywords?.length) {
        params.keyword = options.keywords.join(' ');
      }

      if (options?.location) {
        params.location = options.location;
      }

      const response = await this.makeRequest(this.API_BASE_URL, {
        method: 'GET',
        params,
        headers: {
          Accept: 'application/json',
        },
      });

      const jobs =
        response.results?.map((job: any) => this.normalizeJob(job)) ||
        response.jobs?.map((job: any) => this.normalizeJob(job)) ||
        [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: response.total || response.totalResults || jobs.length,
          totalPages:
            response.totalPages ||
            Math.ceil((response.total || jobs.length) / pageSize),
          hasMore: response.hasMore || jobs.length === pageSize,
        },
        metadata: {
          apiVersion: '1',
        },
      };
    } catch (error) {
      this.logger.error(`UK Civil Service fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(
      rawJob.location || rawJob.locationName || '',
    );

    return {
      externalId: rawJob.id?.toString() || rawJob.vacancyId?.toString(),
      title: rawJob.title || rawJob.jobTitle,
      companyName:
        rawJob.department ||
        rawJob.departmentName ||
        rawJob.organisation ||
        'UK Civil Service',
      location: rawJob.location || rawJob.locationName,
      ...location,
      remoteType: this.detectRemoteType(
        rawJob.workingPattern || rawJob.location || '',
      ),
      description: rawJob.description || rawJob.jobSummary || '',
      requirements: this.extractEssentialCriteria(rawJob),
      experienceLevel: this.mapGrade(rawJob.grade),
      employmentType: this.mapEmploymentType(rawJob.workingPattern),
      salaryMin: this.parseSalary(rawJob.salaryMin || rawJob.salary),
      salaryMax: this.parseSalary(rawJob.salaryMax || rawJob.salary),
      salaryCurrency: 'GBP',
      salaryPeriod: 'yearly',
      postedAt: rawJob.publishedDate
        ? new Date(rawJob.publishedDate)
        : rawJob.createdDate
        ? new Date(rawJob.createdDate)
        : undefined,
      expiresAt: rawJob.closingDate
        ? new Date(rawJob.closingDate)
        : rawJob.expiryDate
        ? new Date(rawJob.expiryDate)
        : undefined,
      applicationUrl: rawJob.url || rawJob.applyUrl || `https://www.civilservicejobs.service.gov.uk/csr/jobs.cgi?jcode=${rawJob.id}`,
      metadata: {
        department: rawJob.department,
        grade: rawJob.grade,
        contractType: rawJob.contractType,
        workingPattern: rawJob.workingPattern,
        numberOfPosts: rawJob.numberOfPosts,
        securityClearance: rawJob.securityClearance,
      },
    };
  }

  private extractEssentialCriteria(rawJob: any): string[] {
    const criteria: string[] = [];

    if (rawJob.essentialCriteria) {
      if (Array.isArray(rawJob.essentialCriteria)) {
        criteria.push(...rawJob.essentialCriteria);
      } else if (typeof rawJob.essentialCriteria === 'string') {
        criteria.push(
          ...rawJob.essentialCriteria
            .split(/[.\n]/)
            .filter((c: string) => c.trim().length > 20)
            .slice(0, 5),
        );
      }
    }

    return criteria;
  }

  private mapGrade(grade: string): any {
    if (!grade) {return undefined;}

    const lowerGrade = grade.toLowerCase();

    if (
      lowerGrade.includes('executive officer') ||
      lowerGrade.includes('eo')
    ) {
      return 'entry';
    }
    if (
      lowerGrade.includes('higher executive officer') ||
      lowerGrade.includes('heo')
    ) {
      return 'junior';
    }
    if (
      lowerGrade.includes('senior executive officer') ||
      lowerGrade.includes('seo') ||
      lowerGrade.includes('grade 7')
    ) {
      return 'mid';
    }
    if (lowerGrade.includes('grade 6')) {
      return 'senior';
    }
    if (
      lowerGrade.includes('senior civil service') ||
      lowerGrade.includes('scs')
    ) {
      return 'lead';
    }

    return undefined;
  }

  private mapEmploymentType(workingPattern: string): any {
    if (!workingPattern) {return 'full_time';}

    const lowerPattern = workingPattern.toLowerCase();

    if (lowerPattern.includes('part')) {return 'part_time';}
    if (lowerPattern.includes('flexible')) {return 'full_time';}
    if (lowerPattern.includes('job share')) {return 'part_time';}
    if (lowerPattern.includes('fixed term')) {return 'contract';}

    return 'full_time';
  }

  private parseSalary(salaryStr: string | number): number | undefined {
    if (typeof salaryStr === 'number') {return salaryStr;}
    if (!salaryStr) {return undefined;}

    const match = salaryStr.toString().match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }

    return undefined;
  }
}
