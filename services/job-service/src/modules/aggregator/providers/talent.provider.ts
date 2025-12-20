import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { ConfigService } from '@nestjs/config';
import type { AxiosInstance } from 'axios';

/**
 * Talent.com Provider (formerly Neuvoo)
 * Large international aggregator with global reach
 */
@Injectable()
export class TalentProvider implements JobProvider {
  private readonly logger = new Logger(TalentProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('TALENT_API_KEY'),
      apiUrl: this.configService.get('TALENT_API_URL', 'https://www.talent.com/api/v2'),
      rateLimitPerMinute: this.configService.get('TALENT_RATE_LIMIT', 100),
      timeout: this.configService.get('TALENT_TIMEOUT', 30000),
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
    return 'Talent.com';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
    country?: string;
  }): Promise<RawJobData[]> {
    try {
      const country = params?.country || 'us';

      const response = await this.httpClient.get('/jobs', {
        params: {
          q: params?.keywords,
          l: params?.location,
          page: params?.page || 1,
          limit: params?.limit || 25,
          country,
          api_key: this.config.apiKey,
        },
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`Talent.com API error: ${error.message}`);
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
        this.logger.warn('No RapidAPI key configured for Talent.com fallback');
        return [];
      }

      // Try neuvoo/talent.com API on RapidAPI
      const response = await axios.get('https://talent-com-job-search.p.rapidapi.com/search', {
        params: {
          query: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
          limit: String(params?.limit || 25),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'talent-com-job-search.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (response.data?.jobs || response.data?.data) {
        const jobs = response.data.jobs || response.data.data || [];
        return jobs.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI Talent.com fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.id || job.job_id || `tn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || job.job_title || '',
      company_name: job.company || job.employer || '',
      company_logo_url: job.company_logo || null,
      location: job.location || job.city || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || job.snippet || '',
      application_url: job.url || job.apply_url || '',
      posted_at: job.date_posted ? new Date(job.date_posted) : new Date(),
      employment_type: this.mapEmploymentType(job.employment_type || job.job_type || ''),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary_min),
      salary_max: this.parseSalary(job.salary_max),
      salary_currency: job.salary_currency || 'USD',
      metadata: {
        source_api: 'rapidapi',
        source: job.source,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.jobs && !data?.results) {return [];}
    const jobs = data.jobs || data.results || [];

    return jobs.map((job: any) => ({
      external_id: job.id || job.job_id || '',
      title: job.title || '',
      company_name: job.company || job.employer || '',
      company_logo_url: job.company_logo || null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || job.snippet || '',
      application_url: job.url || job.apply_url || '',
      posted_at: job.date_posted ? new Date(job.date_posted) : new Date(),
      expires_at: job.expiry_date ? new Date(job.expiry_date) : null,
      employment_type: this.mapEmploymentType(job.employment_type),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary_min),
      salary_max: this.parseSalary(job.salary_max),
      salary_currency: job.salary_currency || 'USD',
      metadata: {
        talent_id: job.id,
        source: job.source,
        country: job.country,
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
        company_name: job.company || '',
        company_logo_url: job.company_logo || null,
        location: job.location || '',
        remote_type: this.detectRemoteType(job),
        description: job.description || '',
        requirements: this.extractRequirements(job.description),
        benefits: this.extractBenefits(job.description),
        skills: this.extractSkills(job.description),
        application_url: job.url || '',
        posted_at: job.date_posted ? new Date(job.date_posted) : new Date(),
        employment_type: this.mapEmploymentType(job.employment_type),
        experience_level: this.mapExperienceLevel(job),
        salary_min: this.parseSalary(job.salary_min),
        salary_max: this.parseSalary(job.salary_max),
        salary_currency: job.salary_currency || 'USD',
        metadata: {
          talent_id: externalId,
          source: job.source,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Talent.com job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.TALENT_COM,
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
      ats_platform: 'Talent.com',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/jobs', {
        params: {
          q: 'test',
          l: 'US',
          limit: 1,
          api_key: this.config.apiKey,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.get('https://talent-com-job-search.p.rapidapi.com/search', {
            params: { query: 'test', location: 'US', page: '1' },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'talent-com-job-search.p.rapidapi.com',
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
    const remote = job.remote || job.is_remote || job.work_from_home;

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
    if (normalized.includes('full') || normalized.includes('permanent')) {return 'full_time';}
    if (normalized.includes('part')) {return 'part_time';}
    if (normalized.includes('contract') || normalized.includes('freelance')) {return 'contract';}
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

    const str = String(value).replace(/[$,€£¥]/g, '');
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
      if (inRequirements && line.trim().match(/^[-•*]/)) {
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
      if (inBenefits && line.trim().match(/^[-•*]/)) {
        benefits.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }
    return benefits.slice(0, 15);
  }

  private extractSkills(description: string): string[] {
    if (!description) {return [];}
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby',
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis',
      'git', 'agile', 'scrum', 'ci/cd', 'rest', 'graphql',
    ];
    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
