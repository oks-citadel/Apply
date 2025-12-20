import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { ConfigService } from '@nestjs/config';
import type { AxiosInstance } from 'axios';

@Injectable()
export class ZipRecruiterProvider implements JobProvider {
  private readonly logger = new Logger(ZipRecruiterProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('ZIPRECRUITER_API_KEY'),
      apiUrl: this.configService.get('ZIPRECRUITER_API_URL', 'https://api.ziprecruiter.com/jobs/v1'),
      rateLimitPerMinute: this.configService.get('ZIPRECRUITER_RATE_LIMIT', 100),
      timeout: this.configService.get('ZIPRECRUITER_TIMEOUT', 30000),
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
    return 'ZipRecruiter';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      // Primary ZipRecruiter API
      const response = await this.httpClient.get('/search', {
        params: {
          search: params?.keywords,
          location: params?.location,
          page: params?.page || 1,
          jobs_per_page: params?.limit || 25,
          api_key: this.config.apiKey,
        },
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`ZipRecruiter API error: ${error.message}`);
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
        this.logger.warn('No RapidAPI key configured for ZipRecruiter fallback');
        return [];
      }

      const response = await axios.get('https://ziprecruiter-jobs-search.p.rapidapi.com/api/v1/search', {
        params: {
          keywords: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
          jobs_per_page: String(params?.limit || 25),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'ziprecruiter-jobs-search.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (response.data?.jobs) {
        return response.data.jobs.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI ZipRecruiter fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.id || `zr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || job.name || '',
      company_name: job.hiring_company?.name || job.company_name || '',
      company_logo_url: job.hiring_company?.logo || null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.snippet || job.description || '',
      application_url: job.url || job.apply_url || '',
      posted_at: job.posted_time ? new Date(job.posted_time) : new Date(),
      employment_type: this.mapEmploymentType(job.job_type || ''),
      experience_level: this.mapExperienceLevel(job.experience_level),
      salary_min: this.parseSalary(job.salary_min_annual),
      salary_max: this.parseSalary(job.salary_max_annual),
      salary_currency: 'USD',
      metadata: {
        source_api: 'rapidapi',
        has_quick_apply: job.has_quick_apply,
        source: job.source,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.jobs) {return [];}

    return data.jobs.map((job: any) => ({
      external_id: job.id || '',
      title: job.title || job.name || '',
      company_name: job.hiring_company?.name || '',
      company_logo_url: job.hiring_company?.logo || null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.snippet || job.description || '',
      application_url: job.url || '',
      posted_at: job.posted_time ? new Date(job.posted_time) : new Date(),
      expires_at: job.expiration_time ? new Date(job.expiration_time) : null,
      employment_type: this.mapEmploymentType(job.job_type),
      experience_level: this.mapExperienceLevel(job.experience_level),
      salary_min: this.parseSalary(job.salary_min_annual),
      salary_max: this.parseSalary(job.salary_max_annual),
      salary_currency: 'USD',
      metadata: {
        ziprecruiter_id: job.id,
        has_quick_apply: job.has_quick_apply,
        source: job.source,
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      const response = await this.httpClient.get(`/job/${externalId}`, {
        params: { api_key: this.config.apiKey },
      });
      const job = response.data;

      return {
        external_id: externalId,
        title: job.title || '',
        company_name: job.hiring_company?.name || '',
        company_logo_url: job.hiring_company?.logo || null,
        location: job.location || '',
        remote_type: this.detectRemoteType(job),
        description: job.description || '',
        requirements: this.extractRequirements(job.description),
        benefits: job.benefits || this.extractBenefits(job.description),
        skills: this.extractSkills(job.description),
        application_url: job.url || '',
        posted_at: job.posted_time ? new Date(job.posted_time) : new Date(),
        employment_type: this.mapEmploymentType(job.job_type),
        experience_level: this.mapExperienceLevel(job.experience_level),
        salary_min: this.parseSalary(job.salary_min_annual),
        salary_max: this.parseSalary(job.salary_max_annual),
        salary_currency: 'USD',
        metadata: {
          ziprecruiter_id: externalId,
          has_quick_apply: job.has_quick_apply,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch ZipRecruiter job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.ZIPRECRUITER,
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
      ats_platform: 'ZipRecruiter',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/search', {
        params: {
          search: 'test',
          location: 'US',
          jobs_per_page: 1,
          api_key: this.config.apiKey,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.get('https://ziprecruiter-jobs-search.p.rapidapi.com/api/v1/search', {
            params: { keywords: 'test', location: 'US', page: '1' },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'ziprecruiter-jobs-search.p.rapidapi.com',
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
    const title = (job.title || job.name || '').toLowerCase();
    const remote = job.remote || job.is_remote;

    if (remote === true || location.includes('remote') || title.includes('remote')) {
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

  private mapExperienceLevel(level: string): string {
    const normalized = (level || '').toLowerCase();
    if (normalized.includes('entry') || normalized.includes('junior')) {return 'entry';}
    if (normalized.includes('mid')) {return 'mid';}
    if (normalized.includes('senior') || normalized.includes('sr')) {return 'senior';}
    if (normalized.includes('lead') || normalized.includes('principal')) {return 'lead';}
    if (normalized.includes('executive') || normalized.includes('director')) {return 'executive';}
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

    const str = String(value).replace(/[$,]/g, '');
    if (str.toLowerCase().includes('k')) {
      return parseFloat(str) * 1000;
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  private extractRequirements(description: string): string[] {
    if (!description) {return [];}

    const requirements: string[] = [];
    const lines = description.split('\n');
    let inRequirements = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('requirement') || lower.includes('qualification') || lower.includes('must have')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && (lower.includes('benefit') || lower.includes('we offer'))) {
        inRequirements = false;
      }
      if (inRequirements && (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*'))) {
        requirements.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }

    return requirements.slice(0, 20);
  }

  private extractBenefits(description: string): string[] {
    if (!description) {return [];}

    const benefits: string[] = [];
    const lines = description.split('\n');
    let inBenefits = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('benefit') || lower.includes('we offer') || lower.includes('perks')) {
        inBenefits = true;
        continue;
      }
      if (inBenefits && (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*'))) {
        benefits.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }

    return benefits.slice(0, 15);
  }

  private extractSkills(description: string): string[] {
    if (!description) {return [];}

    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby',
      'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'git', 'agile', 'scrum', 'ci/cd', 'rest', 'graphql', 'microservices',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
