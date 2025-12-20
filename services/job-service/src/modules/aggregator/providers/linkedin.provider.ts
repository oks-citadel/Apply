import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

@Injectable()
export class LinkedInProvider implements JobProvider {
  private readonly logger = new Logger(LinkedInProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('LINKEDIN_API_KEY'),
      apiUrl: this.configService.get('LINKEDIN_API_URL', 'https://api.linkedin.com/v2'),
      rateLimitPerMinute: this.configService.get('LINKEDIN_RATE_LIMIT', 100),
      timeout: this.configService.get('LINKEDIN_TIMEOUT', 30000),
    };

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });
  }

  getName(): string {
    return 'LinkedIn';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      // LinkedIn Jobs API endpoint (requires LinkedIn partner access)
      // For public API access, we use LinkedIn's job search via scraping fallback
      const response = await this.httpClient.get('/jobSearch', {
        params: {
          keywords: params?.keywords,
          location: params?.location,
          start: ((params?.page || 1) - 1) * (params?.limit || 25),
          count: params?.limit || 25,
        },
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`LinkedIn API error: ${error.message}`);

      // Fallback to RapidAPI LinkedIn Jobs API if main API fails
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
        this.logger.warn('No RapidAPI key configured for LinkedIn fallback');
        return [];
      }

      const response = await axios.get('https://linkedin-jobs-search.p.rapidapi.com/', {
        params: {
          search_terms: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'linkedin-jobs-search.p.rapidapi.com',
        },
        timeout: 30000,
      });

      return response.data.map((job: any) => this.mapRapidAPIJob(job));
    } catch (error) {
      this.logger.error(`RapidAPI LinkedIn fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.job_id || job.linkedin_job_id || `li-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.job_title || job.title || '',
      company_name: job.company_name || '',
      company_logo_url: job.company_logo || job.company_url || null,
      location: job.job_location || job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.job_description || job.description || '',
      application_url: job.linkedin_job_url_cleaned || job.job_url || job.apply_url || '',
      posted_at: job.job_posted_date ? new Date(job.job_posted_date) : new Date(),
      employment_type: this.mapEmploymentType(job.job_employment_type || job.employment_type),
      experience_level: this.mapExperienceLevel(job.job_experience_level || job.seniority_level),
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      salary_currency: 'USD',
      salary_period: 'yearly',
      metadata: {
        source_api: 'rapidapi',
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.elements) {return [];}

    return data.elements.map((job: any) => ({
      external_id: job.id || job.jobPosting?.id || '',
      title: job.title || job.jobPosting?.title || '',
      company_name: job.companyName || job.company?.name || '',
      company_logo_url: job.company?.logo?.url || null,
      location: job.location?.displayName || job.formattedLocation || '',
      remote_type: this.detectRemoteType(job),
      description: job.description?.text || '',
      application_url: job.applyUrl || job.jobPosting?.applyUrl || '',
      posted_at: job.listedAt ? new Date(job.listedAt) : new Date(),
      expires_at: job.expireAt ? new Date(job.expireAt) : null,
      employment_type: this.mapEmploymentType(job.employmentType),
      experience_level: this.mapExperienceLevel(job.experienceLevel),
      salary_min: job.compensationInfo?.baseSalary?.min || null,
      salary_max: job.compensationInfo?.baseSalary?.max || null,
      salary_currency: job.compensationInfo?.baseSalary?.currency || 'USD',
      salary_period: 'yearly',
      skills: job.skills?.map((s: any) => s.name) || [],
      metadata: {
        linkedin_job_id: job.id,
        easy_apply: job.applyMethod?.includes('EASY_APPLY'),
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      const response = await this.httpClient.get(`/jobs/${externalId}`);
      const job = response.data;

      return {
        external_id: externalId,
        title: job.title || '',
        company_name: job.companyName || '',
        company_logo_url: job.company?.logo?.url || null,
        location: job.formattedLocation || '',
        remote_type: this.detectRemoteType(job),
        description: job.description?.text || '',
        requirements: this.extractRequirements(job.description?.text),
        benefits: this.extractBenefits(job.description?.text),
        skills: job.skills?.map((s: any) => s.name) || [],
        application_url: job.applyUrl || '',
        posted_at: job.listedAt ? new Date(job.listedAt) : new Date(),
        employment_type: this.mapEmploymentType(job.employmentType),
        experience_level: this.mapExperienceLevel(job.experienceLevel),
        salary_min: job.compensationInfo?.baseSalary?.min || null,
        salary_max: job.compensationInfo?.baseSalary?.max || null,
        salary_currency: job.compensationInfo?.baseSalary?.currency || 'USD',
        metadata: {
          linkedin_job_id: externalId,
          easy_apply: job.applyMethod?.includes('EASY_APPLY'),
          applicant_count: job.applicantCount,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch LinkedIn job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.LINKEDIN,
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
      ats_platform: 'LinkedIn',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test API connectivity
      const response = await this.httpClient.get('/me', { timeout: 5000 });
      return response.status === 200;
    } catch {
      // Try RapidAPI as fallback check
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.get('https://linkedin-jobs-search.p.rapidapi.com/', {
            params: { search_terms: 'test', location: 'US', page: '1' },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'linkedin-jobs-search.p.rapidapi.com',
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
    const location = (job.location || job.job_location || '').toLowerCase();
    const title = (job.title || job.job_title || '').toLowerCase();
    const description = (job.description || job.job_description || '').toLowerCase();

    if (location.includes('remote') || title.includes('remote') || job.remote === true) {
      return 'remote';
    }
    if (location.includes('hybrid') || title.includes('hybrid') || description.includes('hybrid')) {
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
    if (normalized.includes('entry') || normalized.includes('junior') || normalized.includes('associate')) {return 'entry';}
    if (normalized.includes('mid') || normalized.includes('intermediate')) {return 'mid';}
    if (normalized.includes('senior') || normalized.includes('sr')) {return 'senior';}
    if (normalized.includes('lead') || normalized.includes('principal')) {return 'lead';}
    if (normalized.includes('executive') || normalized.includes('director') || normalized.includes('vp')) {return 'executive';}
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

  private extractRequirements(description: string): string[] {
    if (!description) {return [];}

    const requirements: string[] = [];
    const lines = description.split('\n');
    let inRequirements = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('requirement') || lower.includes('qualifications') || lower.includes('must have')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && (lower.includes('benefit') || lower.includes('we offer') || lower.includes('perks'))) {
        inRequirements = false;
      }
      if (inRequirements && line.trim().startsWith('-') || line.trim().startsWith('•')) {
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
      if (lower.includes('benefit') || lower.includes('we offer') || lower.includes('perks') || lower.includes('what we offer')) {
        inBenefits = true;
        continue;
      }
      if (inBenefits && line.trim().startsWith('-') || line.trim().startsWith('•')) {
        benefits.push(line.trim().replace(/^[-•]\s*/, ''));
      }
    }

    return benefits.slice(0, 15);
  }
}
