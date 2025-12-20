import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

/**
 * Dice Provider - Tech-focused job aggregator
 * Specializes in IT, technology, and engineering positions
 */
@Injectable()
export class DiceProvider implements JobProvider {
  private readonly logger = new Logger(DiceProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  // Common tech skills for enhanced matching
  private readonly techSkills = [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'golang', 'rust', 'ruby', 'scala', 'kotlin', 'swift', 'php', 'perl',
    // Frontend
    'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'gatsby', 'remix', 'html', 'css', 'sass', 'tailwind',
    // Backend
    'node.js', 'nodejs', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'spring', 'spring boot', '.net', 'asp.net', 'rails',
    // Cloud & DevOps
    'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'gitlab ci', 'github actions', 'circleci',
    // Databases
    'sql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'oracle', 'sql server',
    // Data & AI
    'machine learning', 'ml', 'ai', 'artificial intelligence', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'spark', 'hadoop', 'kafka',
    // Other
    'git', 'agile', 'scrum', 'ci/cd', 'rest', 'graphql', 'microservices', 'api', 'security', 'cybersecurity', 'blockchain', 'web3',
  ];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get('DICE_API_KEY'),
      apiUrl: this.configService.get('DICE_API_URL', 'https://api.dice.com/v2'),
      rateLimitPerMinute: this.configService.get('DICE_RATE_LIMIT', 100),
      timeout: this.configService.get('DICE_TIMEOUT', 30000),
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
    return 'Dice';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      const response = await this.httpClient.get('/jobs/search', {
        params: {
          q: params?.keywords,
          location: params?.location,
          page: params?.page || 1,
          pageSize: params?.limit || 25,
          sort: 'date',
        },
      });

      return this.parseJobListings(response.data);
    } catch (error) {
      this.logger.error(`Dice API error: ${error.message}`);
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
        this.logger.warn('No RapidAPI key configured for Dice fallback');
        return [];
      }

      const response = await axios.get('https://dice-jobs-search.p.rapidapi.com/api/v1/search', {
        params: {
          query: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
          pageSize: String(params?.limit || 25),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'dice-jobs-search.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (response.data?.jobs || response.data?.data) {
        const jobs = response.data.jobs || response.data.data || [];
        return jobs.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI Dice fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    const description = job.description || job.snippet || '';

    return {
      external_id: job.id || job.detailsId || `dice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || job.jobTitle || '',
      company_name: job.company?.name || job.companyName || job.employer?.name || '',
      company_logo_url: job.company?.logo || job.companyLogo || null,
      location: job.location || job.jobLocation?.displayName || '',
      remote_type: this.detectRemoteType(job),
      description,
      application_url: job.detailsPageUrl || job.applyUrl || job.url || '',
      posted_at: job.postedDate ? new Date(job.postedDate) : new Date(),
      employment_type: this.mapEmploymentType(job.employmentType || job.jobType || ''),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary?.min || job.salaryMin),
      salary_max: this.parseSalary(job.salary?.max || job.salaryMax),
      salary_currency: 'USD',
      salary_period: 'yearly',
      skills: this.extractTechSkills(description, job.skills),
      metadata: {
        source_api: 'rapidapi',
        dice_id: job.id || job.detailsId,
        employment_type: job.employmentType,
        work_authorization: job.workAuthorization,
        travel_required: job.travelRequired,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.data) {return [];}

    return data.data.map((job: any) => ({
      external_id: job.id || job.detailsId || '',
      title: job.title || '',
      company_name: job.company?.name || job.employer?.name || '',
      company_logo_url: job.company?.logo || null,
      location: job.location || job.jobLocation?.displayName || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || job.snippet || '',
      application_url: job.detailsPageUrl || '',
      posted_at: job.postedDate ? new Date(job.postedDate) : new Date(),
      expires_at: job.expirationDate ? new Date(job.expirationDate) : null,
      employment_type: this.mapEmploymentType(job.employmentType),
      experience_level: this.mapExperienceLevel(job),
      salary_min: this.parseSalary(job.salary?.min),
      salary_max: this.parseSalary(job.salary?.max),
      salary_currency: 'USD',
      salary_period: 'yearly',
      skills: this.extractTechSkills(job.description, job.skills),
      metadata: {
        dice_id: job.id,
        work_authorization: job.workAuthorization,
        travel_required: job.travelRequired,
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
        company_name: job.company?.name || '',
        company_logo_url: job.company?.logo || null,
        location: job.location || '',
        remote_type: this.detectRemoteType(job),
        description: job.description || '',
        requirements: this.extractRequirements(job.description),
        benefits: this.extractBenefits(job.description),
        skills: this.extractTechSkills(job.description, job.skills),
        application_url: job.detailsPageUrl || job.applyUrl || '',
        posted_at: job.postedDate ? new Date(job.postedDate) : new Date(),
        employment_type: this.mapEmploymentType(job.employmentType),
        experience_level: this.mapExperienceLevel(job),
        salary_min: this.parseSalary(job.salary?.min),
        salary_max: this.parseSalary(job.salary?.max),
        salary_currency: 'USD',
        metadata: {
          dice_id: externalId,
          work_authorization: job.workAuthorization,
          travel_required: job.travelRequired,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Dice job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.DICE,
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
      ats_platform: 'Dice',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/jobs/search', {
        params: { q: 'software engineer', pageSize: 1 },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.get('https://dice-jobs-search.p.rapidapi.com/api/v1/search', {
            params: { query: 'test', page: '1' },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'dice-jobs-search.p.rapidapi.com',
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
    const location = (job.location || job.jobLocation?.displayName || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const remote = job.remote || job.isRemote || job.workFromHome;

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
    if (normalized.includes('full') || normalized.includes('perm')) {return 'full_time';}
    if (normalized.includes('part')) {return 'part_time';}
    if (normalized.includes('contract') || normalized.includes('c2c') || normalized.includes('corp-to-corp')) {return 'contract';}
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
    const experience = job.yearsOfExperience || job.experience;

    // Check title first
    if (title.includes('senior') || title.includes('sr.') || title.includes('sr ') || title.includes('iii')) {return 'senior';}
    if (title.includes('junior') || title.includes('jr.') || title.includes('jr ') || title.includes(' i ')) {return 'junior';}
    if (title.includes('entry') || title.includes('associate') || title.includes('graduate')) {return 'entry';}
    if (title.includes('lead') || title.includes('principal') || title.includes('staff')) {return 'lead';}
    if (title.includes('director') || title.includes('executive') || title.includes('vp') || title.includes('chief')) {return 'executive';}
    if (title.includes(' ii ')) {return 'mid';}

    // Check years of experience if available
    if (experience) {
      const years = parseInt(experience);
      if (years <= 2) {return 'entry';}
      if (years <= 4) {return 'junior';}
      if (years <= 7) {return 'mid';}
      if (years <= 10) {return 'senior';}
      return 'lead';
    }

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

  private extractTechSkills(description: string, existingSkills?: string[]): string[] {
    const skills = new Set<string>(existingSkills || []);

    if (description) {
      const descLower = description.toLowerCase();
      for (const skill of this.techSkills) {
        if (descLower.includes(skill.toLowerCase())) {
          skills.add(skill);
        }
      }
    }

    return Array.from(skills).slice(0, 30);
  }

  private extractRequirements(description: string): string[] {
    if (!description) {return [];}
    const requirements: string[] = [];
    const lines = description.split('\n');
    let inRequirements = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('requirement') || lower.includes('qualification') || lower.includes('must have') || lower.includes('you will need') || lower.includes('skills required')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && (lower.includes('benefit') || lower.includes('we offer') || lower.includes('nice to have'))) {
        inRequirements = false;
      }
      if (inRequirements && line.trim().match(/^[-•*\d.]/)) {
        requirements.push(line.trim().replace(/^[-•*\d.]+\s*/, ''));
      }
    }
    return requirements.slice(0, 25);
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
      if (inBenefits && line.trim().match(/^[-•*\d.]/)) {
        benefits.push(line.trim().replace(/^[-•*\d.]+\s*/, ''));
      }
    }
    return benefits.slice(0, 15);
  }
}
