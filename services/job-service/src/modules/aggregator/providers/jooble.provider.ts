import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

@Injectable()
export class JoobleProvider implements JobProvider {
  private readonly logger = new Logger(JoobleProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('JOOBLE_API_KEY'),
      apiUrl: this.configService.get('JOOBLE_API_URL', 'https://jooble.org/api'),
      rateLimitPerMinute: this.configService.get('JOOBLE_RATE_LIMIT', 500),
      timeout: this.configService.get('JOOBLE_TIMEOUT', 30000),
    };

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  getName(): string {
    return 'Jooble';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      // Jooble uses POST for search with API key in URL
      const response = await this.httpClient.post(`/${this.config.apiKey}`, {
        keywords: params?.keywords || '',
        location: params?.location || '',
        page: params?.page || 1,
        searchMode: 1,
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`Jooble API error: ${error.message}`);
      return this.fetchJobsViaRapidAPI(params);
    }
  }

  private async fetchJobsViaRapidAPI(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
      if (!rapidApiKey) {
        this.logger.warn('No RapidAPI key configured for Jooble fallback');
        return [];
      }

      const response = await axios.post('https://jooble.p.rapidapi.com/', {
        keywords: params?.keywords || 'software engineer',
        location: params?.location || 'United States',
        page: params?.page || 1,
      }, {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'jooble.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.data?.jobs) {
        return response.data.jobs.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI Jooble fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.id || `jb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company || '',
      company_logo_url: null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.snippet || job.description || '',
      application_url: job.link || '',
      posted_at: job.updated ? new Date(job.updated) : new Date(),
      employment_type: this.mapEmploymentType(job.type || ''),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary),
      salary_max: null,
      salary_currency: 'USD',
      metadata: {
        source_api: 'rapidapi',
        source: job.source,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.jobs) {return [];}

    return data.jobs.map((job: any) => ({
      external_id: job.id || `jb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company || '',
      company_logo_url: null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.snippet || '',
      application_url: job.link || '',
      posted_at: job.updated ? new Date(job.updated) : new Date(),
      expires_at: null,
      employment_type: this.mapEmploymentType(job.type),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary),
      salary_max: null,
      salary_currency: 'USD',
      metadata: {
        jooble_id: job.id,
        source: job.source,
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    // Jooble doesn't have individual job endpoint - redirect to link
    this.logger.warn(`Jooble doesn't support individual job fetch: ${externalId}`);
    throw new Error('Jooble does not support fetching individual job details');
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.JOOBLE,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: this.parseRemoteType(rawJob.remote_type),
      salary_min: rawJob.salary_min,
      salary_max: rawJob.salary_max,
      salary_currency: rawJob.salary_currency || 'USD',
      description: rawJob.description,
      requirements: rawJob.requirements || [],
      benefits: rawJob.benefits || [],
      skills: rawJob.skills || [],
      experience_level: this.parseExperienceLevel(rawJob.experience_level),
      employment_type: this.parseEmploymentType(rawJob.employment_type),
      posted_at: rawJob.posted_at,
      expires_at: rawJob.expires_at,
      application_url: rawJob.application_url,
      ats_platform: 'Jooble',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.post(`/${this.config.apiKey}`, {
        keywords: 'test',
        location: 'US',
        page: 1,
      }, { timeout: 5000 });
      return response.status === 200;
    } catch {
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.post('https://jooble.p.rapidapi.com/', {
            keywords: 'test',
            location: 'US',
            page: 1,
          }, {
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'jooble.p.rapidapi.com',
            },
            timeout: 5000,
          });
          return response.status === 200;
        }
      } catch {
        return false;
      }
      return false;
    }
  }

  private detectRemoteType(job: any): string {
    const location = (job.location || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const snippet = (job.snippet || '').toLowerCase();

    if (location.includes('remote') || title.includes('remote') || snippet.includes('remote')) {
      return 'remote';
    }
    if (location.includes('hybrid') || title.includes('hybrid')) {
      return 'hybrid';
    }
    return 'onsite';
  }

  private parseRemoteType(type: string): RemoteType {
    switch (type?.toLowerCase()) {
      case 'remote': return RemoteType.REMOTE;
      case 'hybrid': return RemoteType.HYBRID;
      default: return RemoteType.ONSITE;
    }
  }

  private mapEmploymentType(type: string): string {
    const normalized = (type || '').toLowerCase();
    if (normalized.includes('full')) {return 'full_time';}
    if (normalized.includes('part')) {return 'part_time';}
    if (normalized.includes('contract')) {return 'contract';}
    if (normalized.includes('temp')) {return 'temporary';}
    if (normalized.includes('intern')) {return 'internship';}
    return 'full_time';
  }

  private parseEmploymentType(type: string): EmploymentType {
    switch (type?.toLowerCase()) {
      case 'full_time': return EmploymentType.FULL_TIME;
      case 'part_time': return EmploymentType.PART_TIME;
      case 'contract': return EmploymentType.CONTRACT;
      case 'temporary': return EmploymentType.TEMPORARY;
      case 'internship': return EmploymentType.INTERNSHIP;
      default: return EmploymentType.FULL_TIME;
    }
  }

  private mapExperienceLevel(job: any): string {
    const title = (job.title || '').toLowerCase();

    if (title.includes('senior') || title.includes('sr.')) {return 'senior';}
    if (title.includes('junior') || title.includes('jr.')) {return 'junior';}
    if (title.includes('entry') || title.includes('graduate')) {return 'entry';}
    if (title.includes('lead') || title.includes('principal')) {return 'lead';}
    if (title.includes('director') || title.includes('executive')) {return 'executive';}
    return 'mid';
  }

  private parseExperienceLevel(level: string): ExperienceLevel {
    switch (level?.toLowerCase()) {
      case 'entry': return ExperienceLevel.ENTRY;
      case 'junior': return ExperienceLevel.JUNIOR;
      case 'mid': return ExperienceLevel.MID;
      case 'senior': return ExperienceLevel.SENIOR;
      case 'lead': return ExperienceLevel.LEAD;
      case 'executive': return ExperienceLevel.EXECUTIVE;
      default: return ExperienceLevel.MID;
    }
  }

  private parseSalary(value: any): number | null {
    if (!value) {return null;}
    if (typeof value === 'number') {return value;}

    // Jooble salary format varies
    const str = String(value).replace(/[$,€£]/g, '');
    const matches = str.match(/(\d+)/);
    if (matches) {
      const num = parseFloat(matches[1]);
      if (str.toLowerCase().includes('k')) {
        return num * 1000;
      }
      // If it looks like an hourly rate (< 500), convert to annual
      if (num < 500) {
        return num * 2080; // 40hrs * 52 weeks
      }
      return num;
    }
    return null;
  }
}
