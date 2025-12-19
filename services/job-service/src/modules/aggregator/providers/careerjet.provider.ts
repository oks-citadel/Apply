import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import { Job, JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

/**
 * CareerJet Provider - International job aggregator
 * Covers listings in over 90 countries
 */
@Injectable()
export class CareerJetProvider implements JobProvider {
  private readonly logger = new Logger(CareerJetProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  // Supported locale codes for CareerJet
  private readonly supportedLocales = ['en_US', 'en_GB', 'en_CA', 'en_AU', 'de_DE', 'fr_FR', 'es_ES', 'it_IT', 'nl_NL', 'pl_PL', 'pt_BR'];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('CAREERJET_AFFILIATE_ID'),
      apiUrl: this.configService.get('CAREERJET_API_URL', 'https://public.api.careerjet.net'),
      rateLimitPerMinute: this.configService.get('CAREERJET_RATE_LIMIT', 100),
      timeout: this.configService.get('CAREERJET_TIMEOUT', 30000),
    };

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ApplyForUs/1.0',
      },
    });
  }

  getName(): string {
    return 'CareerJet';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
    locale?: string;
  }): Promise<RawJobData[]> {
    try {
      const locale = params?.locale || 'en_US';
      const response = await this.httpClient.get('/search', {
        params: {
          affid: this.config.apiKey,
          keywords: params?.keywords,
          location: params?.location,
          page: params?.page || 1,
          pagesize: params?.limit || 25,
          locale_code: locale,
          user_ip: '0.0.0.0',
          user_agent: 'ApplyForUs/1.0',
        },
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`CareerJet API error: ${error.message}`);
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
        this.logger.warn('No RapidAPI key configured for CareerJet fallback');
        return [];
      }

      const response = await axios.get('https://careerjet-jobs-search.p.rapidapi.com/search', {
        params: {
          keywords: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
          pagesize: String(params?.limit || 25),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'careerjet-jobs-search.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (response.data?.jobs) {
        return response.data.jobs.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI CareerJet fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.url ? this.hashUrl(job.url) : `cj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company || '',
      company_logo_url: null,
      location: job.locations || job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || job.snippet || '',
      application_url: job.url || '',
      posted_at: job.date ? new Date(job.date) : new Date(),
      employment_type: this.mapEmploymentType(job.job_type || ''),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary_min || job.salary),
      salary_max: this.parseSalary(job.salary_max),
      salary_currency: job.salary_currency_code || 'USD',
      metadata: {
        source_api: 'rapidapi',
        site: job.site,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.jobs) return [];

    return data.jobs.map((job: any) => ({
      external_id: job.url ? this.hashUrl(job.url) : `cj-${Date.now()}`,
      title: job.title || '',
      company_name: job.company || '',
      company_logo_url: null,
      location: job.locations || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || '',
      application_url: job.url || '',
      posted_at: job.date ? new Date(job.date) : new Date(),
      expires_at: null,
      employment_type: this.mapEmploymentType(job.job_type),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary_min),
      salary_max: this.parseSalary(job.salary_max),
      salary_currency: job.salary_currency_code || 'USD',
      metadata: {
        careerjet_url: job.url,
        site: job.site,
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    // CareerJet doesn't have individual job API - redirect to URL
    this.logger.warn(`CareerJet doesn't support individual job fetch: ${externalId}`);
    throw new Error('CareerJet does not support fetching individual job details');
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.CAREERJET,
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
      ats_platform: 'CareerJet',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/search', {
        params: {
          affid: this.config.apiKey,
          keywords: 'test',
          location: 'US',
          pagesize: 1,
          locale_code: 'en_US',
          user_ip: '0.0.0.0',
          user_agent: 'ApplyForUs/1.0',
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.get('https://careerjet-jobs-search.p.rapidapi.com/search', {
            params: { keywords: 'test', location: 'US', page: '1' },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'careerjet-jobs-search.p.rapidapi.com',
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

  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `cj-${Math.abs(hash).toString(36)}`;
  }

  private detectRemoteType(job: any): string {
    const location = (job.locations || job.location || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();

    if (location.includes('remote') || title.includes('remote') || description.includes('work from home') || description.includes('remote position')) {
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
    if (normalized.includes('full') || normalized.includes('permanent')) return 'full_time';
    if (normalized.includes('part')) return 'part_time';
    if (normalized.includes('contract') || normalized.includes('freelance')) return 'contract';
    if (normalized.includes('temp')) return 'temporary';
    if (normalized.includes('intern') || normalized.includes('apprentice')) return 'internship';
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

    if (title.includes('senior') || title.includes('sr.')) return 'senior';
    if (title.includes('junior') || title.includes('jr.')) return 'junior';
    if (title.includes('entry') || title.includes('graduate') || title.includes('trainee')) return 'entry';
    if (title.includes('lead') || title.includes('principal') || title.includes('architect')) return 'lead';
    if (title.includes('director') || title.includes('executive') || title.includes('head of')) return 'executive';
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
    if (!value) return null;
    if (typeof value === 'number') return value;

    const str = String(value).replace(/[$,€£¥]/g, '');
    if (str.toLowerCase().includes('k')) {
      return parseFloat(str) * 1000;
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
}
