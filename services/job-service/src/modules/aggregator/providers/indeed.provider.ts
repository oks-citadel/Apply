import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { ConfigService } from '@nestjs/config';
import type { AxiosInstance } from 'axios';

@Injectable()
export class IndeedProvider implements JobProvider {
  private readonly logger = new Logger(IndeedProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('INDEED_API_KEY'),
      apiUrl: this.configService.get('INDEED_API_URL', 'https://apis.indeed.com/v3'),
      rateLimitPerMinute: this.configService.get('INDEED_RATE_LIMIT', 100),
      timeout: this.configService.get('INDEED_TIMEOUT', 30000),
    };

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getName(): string {
    return 'Indeed';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      // Primary Indeed API (requires Indeed publisher access)
      const response = await this.httpClient.get('/search/jobs', {
        params: {
          q: params?.keywords,
          l: params?.location,
          start: ((params?.page || 1) - 1) * (params?.limit || 25),
          limit: params?.limit || 25,
          format: 'json',
        },
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`Indeed API error: ${error.message}`);

      // Fallback to RapidAPI Indeed Jobs API
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
        this.logger.warn('No RapidAPI key configured for Indeed fallback');
        return [];
      }

      const response = await axios.get('https://indeed12.p.rapidapi.com/jobs/search', {
        params: {
          query: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page_id: String(params?.page || 1),
          locality: 'us',
          fromage: '14', // Last 14 days
          radius: '50',
          sort: 'date',
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'indeed12.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (response.data?.hits) {
        return response.data.hits.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI Indeed fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.id || `indeed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company_name || '',
      company_logo_url: job.company_logo || null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || job.snippet || '',
      application_url: job.link || job.apply_link || '',
      posted_at: job.pub_date_ts_milli ? new Date(job.pub_date_ts_milli) : new Date(),
      employment_type: this.mapEmploymentType(job.job_types?.join(', ') || ''),
      experience_level: this.mapExperienceLevel(job.experience_level),
      salary_min: this.parseSalary(job.salary_min || job.salary?.min),
      salary_max: this.parseSalary(job.salary_max || job.salary?.max),
      salary_currency: 'USD',
      salary_period: 'yearly',
      metadata: {
        source_api: 'rapidapi',
        indeed_apply: job.indeed_apply === true,
        job_types: job.job_types,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.results) {return [];}

    return data.results.map((job: any) => ({
      external_id: job.jobkey || job.id || '',
      title: job.jobtitle || job.title || '',
      company_name: job.company || '',
      company_logo_url: job.company_logo || null,
      location: job.formattedLocation || job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.snippet || job.description || '',
      application_url: job.url || '',
      posted_at: job.date ? new Date(job.date) : new Date(),
      expires_at: job.expiry ? new Date(job.expiry) : null,
      employment_type: this.mapEmploymentType(job.jobtype || job.employmentType),
      experience_level: this.mapExperienceLevel(job.experienceLevel),
      salary_min: this.parseSalary(job.salary_min || job.salary?.min),
      salary_max: this.parseSalary(job.salary_max || job.salary?.max),
      salary_currency: 'USD',
      salary_period: 'yearly',
      metadata: {
        indeed_job_key: job.jobkey,
        sponsored: job.sponsored,
        indeed_apply: job.indeedApply,
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      const response = await this.httpClient.get(`/job/${externalId}`);
      const job = response.data;

      return {
        external_id: externalId,
        title: job.title || '',
        company_name: job.company || '',
        company_logo_url: job.company_logo || null,
        location: job.formattedLocation || '',
        remote_type: this.detectRemoteType(job),
        description: job.description || '',
        requirements: this.extractRequirements(job.description),
        benefits: job.benefits || this.extractBenefits(job.description),
        skills: this.extractSkills(job.description),
        application_url: job.url || '',
        posted_at: job.datePosted ? new Date(job.datePosted) : new Date(),
        employment_type: this.mapEmploymentType(job.jobtype),
        experience_level: this.mapExperienceLevel(job.experienceLevel),
        salary_min: this.parseSalary(job.salary_min),
        salary_max: this.parseSalary(job.salary_max),
        salary_currency: 'USD',
        metadata: {
          indeed_job_key: externalId,
          indeed_apply: job.indeedApply,
          applicant_count: job.applicantCount,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Indeed job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.INDEED,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: this.parseRemoteType(rawJob.remote_type),
      salary_min: rawJob.salary_min,
      salary_max: rawJob.salary_max,
      salary_currency: rawJob.salary_currency || 'USD',
      salary_period: rawJob.salary_period || 'yearly',
      description: rawJob.description,
      requirements: rawJob.requirements || [],
      benefits: rawJob.benefits || [],
      skills: rawJob.skills || [],
      experience_level: this.parseExperienceLevel(rawJob.experience_level),
      employment_type: this.parseEmploymentType(rawJob.employment_type),
      posted_at: rawJob.posted_at,
      expires_at: rawJob.expires_at,
      application_url: rawJob.application_url,
      ats_platform: 'Indeed',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      // Try RapidAPI as fallback check
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.get('https://indeed12.p.rapidapi.com/jobs/search', {
            params: { query: 'test', location: 'US', page_id: '1' },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'indeed12.p.rapidapi.com',
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
    const location = (job.location || job.formattedLocation || '').toLowerCase();
    const title = (job.title || job.jobtitle || '').toLowerCase();
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

    // Parse string salary like "$100,000" or "100k"
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
      if (lower.includes('requirement') || lower.includes('qualification') || lower.includes('must have') || lower.includes('looking for')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && (lower.includes('benefit') || lower.includes('we offer') || lower.includes('what we provide'))) {
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
      if (lower.includes('benefit') || lower.includes('we offer') || lower.includes('perks') || lower.includes('what we provide')) {
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
      'machine learning', 'ai', 'data science', 'analytics',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
