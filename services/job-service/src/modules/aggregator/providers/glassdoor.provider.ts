import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

@Injectable()
export class GlassdoorProvider implements JobProvider {
  private readonly logger = new Logger(GlassdoorProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('GLASSDOOR_API_KEY'),
      apiUrl: this.configService.get('GLASSDOOR_API_URL', 'https://api.glassdoor.com/api/api.htm'),
      rateLimitPerMinute: this.configService.get('GLASSDOOR_RATE_LIMIT', 100),
      timeout: this.configService.get('GLASSDOOR_TIMEOUT', 30000),
    };

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
    });
  }

  getName(): string {
    return 'Glassdoor';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      // Glassdoor Partner API (requires partner access)
      const response = await this.httpClient.get('', {
        params: {
          't.p': this.configService.get('GLASSDOOR_PARTNER_ID'),
          't.k': this.config.apiKey,
          format: 'json',
          v: '1',
          action: 'jobs',
          q: params?.keywords,
          l: params?.location,
          pn: params?.page || 1,
          ps: params?.limit || 25,
          userip: '0.0.0.0',
          useragent: 'ApplyForUs/1.0',
        },
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`Glassdoor API error: ${error.message}`);

      // Fallback to RapidAPI Glassdoor Jobs API
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
        this.logger.warn('No RapidAPI key configured for Glassdoor fallback');
        return [];
      }

      const response = await axios.get('https://glassdoor.p.rapidapi.com/job/', {
        params: {
          keyword: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'glassdoor.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (Array.isArray(response.data)) {
        return response.data.map((job: any) => this.mapRapidAPIJob(job));
      }
      if (response.data?.data) {
        return response.data.data.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI Glassdoor fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.job_id || job.id || `gd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.job_title || job.title || '',
      company_name: job.company_name || job.employer_name || '',
      company_logo_url: job.company_logo || job.employer_logo || null,
      location: job.location || job.job_location || '',
      remote_type: this.detectRemoteType(job),
      description: job.job_description || job.description || '',
      application_url: job.apply_link || job.job_apply_link || job.url || '',
      posted_at: job.posted_date ? new Date(job.posted_date) : new Date(),
      employment_type: this.mapEmploymentType(job.job_employment_type || job.employment_type),
      experience_level: this.mapExperienceLevel(job.experience_level),
      salary_min: this.parseSalary(job.salary_min || job.min_salary),
      salary_max: this.parseSalary(job.salary_max || job.max_salary),
      salary_currency: job.salary_currency || 'USD',
      metadata: {
        source_api: 'rapidapi',
        glassdoor_id: job.job_id || job.id,
        company_rating: job.employer_rating || job.company_rating,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.response?.jobListings) {return [];}

    return data.response.jobListings.map((job: any) => ({
      external_id: job.jobListingId || job.id || '',
      title: job.jobTitle || job.title || '',
      company_name: job.employer?.name || job.companyName || '',
      company_logo_url: job.employer?.logo || null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.descriptionFragment || job.description || '',
      application_url: job.jobViewUrl || job.applyUrl || '',
      posted_at: job.discoverDate ? new Date(job.discoverDate) : new Date(),
      expires_at: job.expirationDate ? new Date(job.expirationDate) : null,
      employment_type: this.mapEmploymentType(job.employmentType),
      experience_level: this.mapExperienceLevel(job.experienceLevel),
      salary_min: job.payEstimate?.low || null,
      salary_max: job.payEstimate?.high || null,
      salary_currency: 'USD',
      metadata: {
        glassdoor_job_id: job.jobListingId,
        employer_id: job.employer?.id,
        employer_rating: job.employer?.overallRating,
        easy_apply: job.easyApply,
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      const response = await this.httpClient.get('', {
        params: {
          't.p': this.configService.get('GLASSDOOR_PARTNER_ID'),
          't.k': this.config.apiKey,
          format: 'json',
          v: '1',
          action: 'job-prog',
          jobListingId: externalId,
          userip: '0.0.0.0',
          useragent: 'ApplyForUs/1.0',
        },
      });

      const job = response.data?.response?.jobListing;

      return {
        external_id: externalId,
        title: job?.jobTitle || '',
        company_name: job?.employer?.name || '',
        company_logo_url: job?.employer?.logo || null,
        location: job?.location || '',
        remote_type: this.detectRemoteType(job),
        description: job?.description || '',
        requirements: this.extractRequirements(job?.description),
        benefits: job?.benefits || this.extractBenefits(job?.description),
        skills: this.extractSkills(job?.description),
        application_url: job?.applyUrl || '',
        posted_at: job?.discoverDate ? new Date(job.discoverDate) : new Date(),
        employment_type: this.mapEmploymentType(job?.employmentType),
        experience_level: this.mapExperienceLevel(job?.experienceLevel),
        salary_min: job?.payEstimate?.low || null,
        salary_max: job?.payEstimate?.high || null,
        salary_currency: 'USD',
        metadata: {
          glassdoor_job_id: externalId,
          employer_rating: job?.employer?.overallRating,
          employer_reviews_count: job?.employer?.numberOfRatings,
          easy_apply: job?.easyApply,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Glassdoor job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.GLASSDOOR,
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
      ats_platform: 'Glassdoor',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try RapidAPI check
      const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
      if (rapidApiKey) {
        const response = await axios.get('https://glassdoor.p.rapidapi.com/job/', {
          params: { keyword: 'test', location: 'US', page: '1' },
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'glassdoor.p.rapidapi.com',
          },
          timeout: 5000,
        });
        return response.status === 200;
      }
      return false;
    } catch {
      return false;
    }
  }

  private detectRemoteType(job: any): string {
    const location = (job?.location || '').toLowerCase();
    const title = (job?.jobTitle || job?.title || '').toLowerCase();
    const remote = job?.remote || job?.is_remote;

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
      if (inRequirements && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
        requirements.push(line.trim().replace(/^[-•]\s*/, ''));
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
      if (inBenefits && (line.trim().startsWith('-') || line.trim().startsWith('•'))) {
        benefits.push(line.trim().replace(/^[-•]\s*/, ''));
      }
    }

    return benefits.slice(0, 15);
  }

  private extractSkills(description: string): string[] {
    if (!description) {return [];}

    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby',
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'git', 'agile', 'scrum', 'ci/cd', 'rest', 'graphql', 'microservices',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
