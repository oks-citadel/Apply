import { HttpService } from '@nestjs/axios';
import { BaseJobAdapter } from './base.adapter';
import {
  FetchOptions,
  FetchResult,
  NormalizedJob,
} from '../interfaces/job-adapter.interface';

/**
 * Indeed API Adapter
 * Uses Indeed's Publisher API or Job Search API
 */
export class IndeedAdapter extends BaseJobAdapter {
  private readonly API_BASE_URL = 'https://api.indeed.com/ads/apisearch';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  getName(): string {
    return 'Indeed';
  }

  getProvider(): string {
    return 'indeed';
  }

  async fetchJobs(options?: FetchOptions): Promise<FetchResult> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 25;
    const start = (page - 1) * pageSize;

    try {
      const params: any = {
        publisher: this.source.credentials?.api_key,
        v: '2',
        format: 'json',
        start,
        limit: pageSize,
        fromage: this.getDaysAgo(options?.startDate),
        highlight: 0,
        co: this.getCountryCode(),
      };

      if (options?.keywords?.length) {
        params.q = options.keywords.join(' ');
      }

      if (options?.location) {
        params.l = options.location;
      }

      if (options?.jobType) {
        params.jt = this.mapJobType(options.jobType);
      }

      const response = await this.makeRequest(this.API_BASE_URL, {
        method: 'GET',
        params,
      });

      const jobs =
        response.results?.map((job: any) => this.normalizeJob(job)) || [];

      return {
        jobs,
        pagination: {
          currentPage: page,
          totalResults: response.totalResults,
          hasMore: start + jobs.length < response.totalResults,
        },
        metadata: {
          responseTime: response.responseTime,
          apiVersion: '2',
        },
      };
    } catch (error) {
      this.logger.error(`Indeed fetch failed: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: any): NormalizedJob {
    const location = this.cleanLocation(
      rawJob.formattedLocation || rawJob.location,
    );
    const salary = this.extractSalary(rawJob.formattedRelativeTime || '');

    return {
      externalId: rawJob.jobkey,
      title: rawJob.jobtitle,
      companyName: rawJob.company,
      location: rawJob.formattedLocation,
      ...location,
      remoteType: this.detectRemoteType(
        rawJob.formattedLocation + ' ' + rawJob.snippet,
      ),
      description: this.cleanHtml(rawJob.snippet || ''),
      requirements: this.extractRequirements(rawJob.snippet || ''),
      employmentType: this.mapEmploymentType(rawJob.jobtype),
      ...salary,
      postedAt: this.parseRelativeDate(rawJob.formattedRelativeTime),
      expiresAt: rawJob.expired
        ? new Date(rawJob.expired)
        : this.calculateExpiry(rawJob.formattedRelativeTime),
      applicationUrl: `https://www.indeed.com/viewjob?jk=${rawJob.jobkey}`,
      metadata: {
        sponsored: rawJob.sponsored,
        indeedApply: rawJob.indeedApply,
        source: rawJob.source,
      },
    };
  }

  private mapJobType(jobType: string): string {
    const mapping: Record<string, string> = {
      full_time: 'fulltime',
      part_time: 'parttime',
      contract: 'contract',
      temporary: 'temporary',
      internship: 'internship',
    };
    return mapping[jobType] || 'fulltime';
  }

  private mapEmploymentType(type: string): any {
    const mapping: Record<string, any> = {
      fulltime: 'full_time',
      parttime: 'part_time',
      contract: 'contract',
      temporary: 'temporary',
      internship: 'internship',
    };
    return mapping[type?.toLowerCase()] || 'full_time';
  }

  private getDaysAgo(startDate?: Date): number {
    if (!startDate) return 30; // Default to past 30 days

    const daysDiff = Math.floor(
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(1, daysDiff);
  }

  private getCountryCode(): string {
    // Extract from config or default to US
    return this.source.config?.countries?.[0] || 'us';
  }

  private parseRelativeDate(relativeTime: string): Date | undefined {
    if (!relativeTime) return undefined;

    const now = new Date();
    const match = relativeTime.match(/(\d+)\s*(hour|day|week|month)/i);

    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      switch (unit) {
        case 'hour':
          return new Date(now.getTime() - value * 60 * 60 * 1000);
        case 'day':
          return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        case 'week':
          return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
      }
    }

    return undefined;
  }

  private calculateExpiry(postedTime: string): Date | undefined {
    const postedDate = this.parseRelativeDate(postedTime);
    if (!postedDate) return undefined;

    // Most Indeed jobs expire after 30 days
    return new Date(postedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  private extractRequirements(snippet: string): string[] {
    const requirements: string[] = [];
    const cleaned = this.cleanHtml(snippet);
    const sentences = cleaned.split(/[.!?]\s+/);

    for (const sentence of sentences) {
      if (
        /experience|required|must|skills|qualification/i.test(sentence) &&
        sentence.length > 20
      ) {
        requirements.push(sentence.trim());
      }
    }

    return requirements.slice(0, 5); // Limit to 5 requirements
  }
}
