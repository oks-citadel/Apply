import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import { Job, JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

@Injectable()
export class SimplyHiredProvider implements JobProvider {
  private readonly logger = new Logger(SimplyHiredProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('SIMPLYHIRED_API_KEY'),
      apiUrl: this.configService.get('SIMPLYHIRED_API_URL', 'https://api.simplyhired.com'),
      rateLimitPerMinute: this.configService.get('SIMPLYHIRED_RATE_LIMIT', 100),
      timeout: this.configService.get('SIMPLYHIRED_TIMEOUT', 30000),
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
    return 'SimplyHired';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      // SimplyHired now redirects through Indeed - use RapidAPI
      return this.fetchJobsViaRapidAPI(params);
    } catch (error) {
      this.logger.error(`SimplyHired API error: ${error.message}`);
      return [];
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
        this.logger.warn('No RapidAPI key configured for SimplyHired');
        return [];
      }

      const response = await axios.get('https://simplyhired.p.rapidapi.com/search', {
        params: {
          query: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
          limit: String(params?.limit || 25),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'simplyhired.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (response.data?.jobs) {
        return response.data.jobs.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI SimplyHired error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.id || `sh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company || job.company_name || '',
      company_logo_url: job.company_logo || null,
      location: job.location || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || job.snippet || '',
      application_url: job.url || job.link || '',
      posted_at: job.posted_date ? new Date(job.posted_date) : new Date(),
      employment_type: this.mapEmploymentType(job.job_type || ''),
      experience_level: this.mapExperienceLevel(job.experience_level),
      salary_min: this.parseSalary(job.salary_min),
      salary_max: this.parseSalary(job.salary_max),
      salary_currency: 'USD',
      metadata: {
        source_api: 'rapidapi',
        original_data: job,
      },
    };
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
      if (!rapidApiKey) {
        throw new Error('No RapidAPI key configured');
      }

      const response = await axios.get(`https://simplyhired.p.rapidapi.com/job/${externalId}`, {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'simplyhired.p.rapidapi.com',
        },
        timeout: 30000,
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
        posted_at: job.posted_date ? new Date(job.posted_date) : new Date(),
        employment_type: this.mapEmploymentType(job.job_type),
        experience_level: this.mapExperienceLevel(job.experience_level),
        salary_min: this.parseSalary(job.salary_min),
        salary_max: this.parseSalary(job.salary_max),
        salary_currency: 'USD',
        metadata: { simplyhired_id: externalId },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch SimplyHired job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.SIMPLYHIRED,
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
      ats_platform: 'SimplyHired',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
      if (rapidApiKey) {
        const response = await axios.get('https://simplyhired.p.rapidapi.com/search', {
          params: { query: 'test', location: 'US', page: '1' },
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'simplyhired.p.rapidapi.com',
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
    const location = (job.location || '').toLowerCase();
    const title = (job.title || '').toLowerCase();

    if (location.includes('remote') || title.includes('remote')) {
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
    if (normalized.includes('full')) return 'full_time';
    if (normalized.includes('part')) return 'part_time';
    if (normalized.includes('contract')) return 'contract';
    if (normalized.includes('temp')) return 'temporary';
    if (normalized.includes('intern')) return 'internship';
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
    if (normalized.includes('entry') || normalized.includes('junior')) return 'entry';
    if (normalized.includes('mid')) return 'mid';
    if (normalized.includes('senior')) return 'senior';
    if (normalized.includes('lead')) return 'lead';
    if (normalized.includes('executive')) return 'executive';
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

    const str = String(value).replace(/[$,]/g, '');
    if (str.toLowerCase().includes('k')) {
      return parseFloat(str) * 1000;
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  private extractRequirements(description: string): string[] {
    if (!description) return [];
    const requirements: string[] = [];
    const lines = description.split('\n');
    let inRequirements = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('requirement') || lower.includes('qualification')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && lower.includes('benefit')) {
        inRequirements = false;
      }
      if (inRequirements && line.trim().match(/^[-•*]/)) {
        requirements.push(line.trim().replace(/^[-•*]\s*/, ''));
      }
    }
    return requirements.slice(0, 20);
  }

  private extractBenefits(description: string): string[] {
    if (!description) return [];
    const benefits: string[] = [];
    const lines = description.split('\n');
    let inBenefits = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('benefit') || lower.includes('we offer')) {
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
    if (!description) return [];
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
