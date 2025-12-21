import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../../jobs/entities/job.entity';

import type { Job } from '../../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

interface WorkableJob {
  id: string;
  title: string;
  full_title: string;
  shortcode: string;
  code: string;
  state: string;
  department: string;
  url: string;
  application_url: string;
  shortlink: string;
  location: {
    location_str: string;
    country: string;
    country_code: string;
    region: string;
    region_code: string;
    city: string;
    zip_code?: string;
    telecommuting: boolean;
  };
  created_at: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  employment_type?: string;
  experience?: string;
  education?: string;
  industry?: string;
  function?: string;
}

/**
 * Workable ATS Adapter
 *
 * Fetches public job listings from Workable.
 * Endpoint pattern: https://{subdomain}.workable.com/api/v3/accounts/{account}/jobs
 * Also supports: https://{subdomain}.workable.com/spi/v3/jobs
 *
 * Features:
 * - Public API access (no auth for public jobs)
 * - Detailed job information including requirements and benefits
 * - Location data with telecommuting flag
 * - Employment type and experience level
 */
@Injectable()
export class WorkableAdapter implements JobProvider {
  private readonly logger = new Logger(WorkableAdapter.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  // Known companies using Workable with their subdomains
  private readonly companyBoards: Array<{ subdomain: string; name: string }> = [
    { subdomain: 'apply', name: 'Various' },
    { subdomain: 'jobs', name: 'Various' },
    { subdomain: 'careers', name: 'Various' },
    { subdomain: 'workable', name: 'Workable' },
    { subdomain: 'booking', name: 'Booking.com' },
    { subdomain: 'trivago', name: 'Trivago' },
    { subdomain: 'delivery-hero', name: 'Delivery Hero' },
    { subdomain: 'wolt', name: 'Wolt' },
    { subdomain: 'glovo', name: 'Glovo' },
    { subdomain: 'hellofresh', name: 'HelloFresh' },
    { subdomain: 'gorillas', name: 'Gorillas' },
    { subdomain: 'getir', name: 'Getir' },
    { subdomain: 'blinkist', name: 'Blinkist' },
    { subdomain: 'soundcloud', name: 'SoundCloud' },
    { subdomain: 'n26', name: 'N26' },
    { subdomain: 'revolut', name: 'Revolut' },
    { subdomain: 'klarna', name: 'Klarna' },
    { subdomain: 'sumup', name: 'SumUp' },
    { subdomain: 'mollie', name: 'Mollie' },
    { subdomain: 'adyen', name: 'Adyen' },
    { subdomain: 'checkout', name: 'Checkout.com' },
    { subdomain: 'stripe', name: 'Stripe' },
    { subdomain: 'wise', name: 'Wise' },
    { subdomain: 'monzo', name: 'Monzo' },
    { subdomain: 'starling', name: 'Starling Bank' },
    { subdomain: 'zopa', name: 'Zopa' },
    { subdomain: 'curve', name: 'Curve' },
    { subdomain: 'tide', name: 'Tide' },
    { subdomain: 'oaknorth', name: 'OakNorth' },
    { subdomain: 'thought-machine', name: 'Thought Machine' },
    { subdomain: 'transferwise', name: 'TransferWise' },
    { subdomain: 'seedrs', name: 'Seedrs' },
    { subdomain: 'crowdcube', name: 'Crowdcube' },
    { subdomain: 'funding-circle', name: 'Funding Circle' },
    { subdomain: 'iwoca', name: 'iwoca' },
    { subdomain: 'truelayer', name: 'TrueLayer' },
    { subdomain: 'yapily', name: 'Yapily' },
    { subdomain: 'plum', name: 'Plum' },
    { subdomain: 'chip', name: 'Chip' },
    { subdomain: 'cleo', name: 'Cleo' },
    { subdomain: 'emma', name: 'Emma' },
  ];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      timeout: this.configService.get('WORKABLE_TIMEOUT', 30000),
      rateLimitPerMinute: this.configService.get('WORKABLE_RATE_LIMIT', 60),
    };

    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ApplyForUs-JobAggregator/1.0',
      },
    });
  }

  getName(): string {
    return 'Workable';
  }

  /**
   * Fetch jobs from all known Workable company boards
   */
  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      const allJobs: RawJobData[] = [];
      const limit = params?.limit || 100;

      // Fetch from multiple company boards
      const boardsToFetch = this.companyBoards.slice(0, 10);

      const results = await Promise.allSettled(
        boardsToFetch.map(board => this.fetchJobsFromBoard(board.subdomain, params)),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allJobs.push(...result.value);
        } else {
          this.logger.debug(`Failed to fetch from board: ${result.reason?.message}`);
        }
      }

      // Apply filters
      let filteredJobs = allJobs;

      if (params?.keywords) {
        const keywords = params.keywords.toLowerCase();
        filteredJobs = filteredJobs.filter(job =>
          job.title.toLowerCase().includes(keywords) ||
          job.description?.toLowerCase().includes(keywords) ||
          job.skills?.some(skill => skill.toLowerCase().includes(keywords)),
        );
      }

      if (params?.location) {
        const location = params.location.toLowerCase();
        filteredJobs = filteredJobs.filter(job =>
          job.location?.toLowerCase().includes(location),
        );
      }

      // Apply pagination
      const startIndex = ((params?.page || 1) - 1) * limit;
      return filteredJobs.slice(startIndex, startIndex + limit);
    } catch (error) {
      this.logger.error(`Workable fetchJobs error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch jobs from a specific Workable subdomain
   */
  async fetchJobsFromBoard(subdomain: string, params?: {
    keywords?: string;
    location?: string;
  }): Promise<RawJobData[]> {
    try {
      // Try the public jobs API
      const url = `https://${subdomain}.workable.com/spi/v3/jobs`;

      const queryParams: any = {
        state: 'published',
      };

      if (params?.location) {
        queryParams.location = params.location;
      }

      const response = await this.httpClient.get(url, {
        params: queryParams,
      });

      if (!response.data?.jobs || !Array.isArray(response.data.jobs)) {
        return [];
      }

      const jobs = response.data.jobs as WorkableJob[];
      const companyName = this.companyBoards.find(b => b.subdomain === subdomain)?.name || this.formatCompanyName(subdomain);

      return jobs.map(job => this.mapWorkableJob(job, subdomain, companyName));
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        this.logger.debug(`Board not accessible: ${subdomain}`);
      } else {
        this.logger.warn(`Error fetching from Workable board ${subdomain}: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Fetch detailed information for a specific job
   */
  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      // External ID format: workable-{subdomain}-{shortcode}
      const [, subdomain, shortcode] = externalId.split('-');

      const url = `https://${subdomain}.workable.com/spi/v3/jobs/${shortcode}`;
      const response = await this.httpClient.get(url);

      const job = response.data as WorkableJob;
      const companyName = this.companyBoards.find(b => b.subdomain === subdomain)?.name || this.formatCompanyName(subdomain);

      return this.mapWorkableJob(job, subdomain, companyName);
    } catch (error) {
      this.logger.error(`Failed to fetch Workable job details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map Workable job to RawJobData
   */
  private mapWorkableJob(job: WorkableJob, subdomain: string, companyName: string): RawJobData {
    const location = job.location?.location_str || '';
    const isRemote = job.location?.telecommuting || false;

    // Build full description
    let fullDescription = job.description || '';
    if (job.requirements) {
      fullDescription += '\n\nRequirements:\n' + job.requirements;
    }
    if (job.benefits) {
      fullDescription += '\n\nBenefits:\n' + job.benefits;
    }

    return {
      external_id: `workable-${subdomain}-${job.shortcode}`,
      title: job.full_title || job.title,
      company_name: companyName,
      location,
      remote_type: this.detectRemoteType(isRemote, location, job.title),
      description: fullDescription,
      requirements: this.extractRequirements(job.requirements || fullDescription),
      benefits: this.extractBenefits(job.benefits || fullDescription),
      skills: this.extractSkills(fullDescription),
      experience_level: this.mapExperienceLevel(job.experience, job.title),
      employment_type: this.mapEmploymentType(job.employment_type),
      posted_at: job.created_at ? new Date(job.created_at) : new Date(),
      application_url: job.application_url || job.url,
      metadata: {
        workable_subdomain: subdomain,
        workable_shortcode: job.shortcode,
        workable_code: job.code,
        department: job.department,
        state: job.state,
        location_details: job.location,
        industry: job.industry,
        function: job.function,
        education: job.education,
        shortlink: job.shortlink,
      },
    };
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.WORKABLE,
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
      ats_platform: 'Workable',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try a known working board
      const response = await this.httpClient.get('https://workable.workable.com/spi/v3/jobs', {
        params: { state: 'published', limit: 1 },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Discover new company boards
   */
  async discoverNewBoards(potentialSubdomains: string[]): Promise<Array<{ subdomain: string; name: string }>> {
    const discoveredBoards: Array<{ subdomain: string; name: string }> = [];

    const results = await Promise.allSettled(
      potentialSubdomains.map(async subdomain => {
        try {
          const response = await this.httpClient.get(`https://${subdomain}.workable.com/spi/v3/jobs`, {
            params: { state: 'published', limit: 1 },
            timeout: 5000,
          });
          if (response.data?.jobs && response.data.jobs.length > 0) {
            return { subdomain, name: this.formatCompanyName(subdomain) };
          }
        } catch {
          return null;
        }
        return null;
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        discoveredBoards.push(result.value);
      }
    }

    return discoveredBoards;
  }

  getCompanyBoards(): Array<{ subdomain: string; name: string }> {
    return [...this.companyBoards];
  }

  addCompanyBoard(subdomain: string, name?: string): void {
    if (!this.companyBoards.find(b => b.subdomain === subdomain)) {
      this.companyBoards.push({
        subdomain,
        name: name || this.formatCompanyName(subdomain),
      });
      this.logger.log(`Added new Workable board: ${subdomain}`);
    }
  }

  // Helper methods

  private formatCompanyName(subdomain: string): string {
    return subdomain
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private detectRemoteType(isRemote: boolean, location: string, title: string): string {
    if (isRemote) return 'remote';

    const locationLower = location.toLowerCase();
    const titleLower = title.toLowerCase();

    if (locationLower.includes('remote') || titleLower.includes('remote')) {
      return 'remote';
    }
    if (locationLower.includes('hybrid') || titleLower.includes('hybrid')) {
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

  private mapExperienceLevel(experience: string, title: string): string {
    const combined = `${experience} ${title}`.toLowerCase();

    if (combined.includes('senior') || combined.includes('sr.')) {
      return 'senior';
    }
    if (combined.includes('lead') || combined.includes('principal') || combined.includes('staff')) {
      return 'lead';
    }
    if (combined.includes('junior') || combined.includes('jr.') || combined.includes('entry')) {
      return 'junior';
    }
    if (combined.includes('intern')) {
      return 'entry';
    }
    if (combined.includes('director') || combined.includes('vp') || combined.includes('executive')) {
      return 'executive';
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

  private extractRequirements(text: string): string[] {
    if (!text) return [];

    const requirements: string[] = [];
    const lines = text.split('\n');
    let inRequirements = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('requirement') || lower.includes('qualification') || lower.includes('must have')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && (lower.includes('benefit') || lower.includes('we offer'))) {
        break;
      }
      if (inRequirements) {
        const trimmed = line.trim();
        if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
          const req = trimmed.replace(/^[-•*]\s*/, '').trim();
          if (req && req.length > 10 && req.length < 300) {
            requirements.push(req);
          }
        }
      }
    }

    return requirements.slice(0, 20);
  }

  private extractBenefits(text: string): string[] {
    if (!text) return [];

    const benefits: string[] = [];
    const lines = text.split('\n');
    let inBenefits = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('benefit') || lower.includes('we offer') || lower.includes('perks')) {
        inBenefits = true;
        continue;
      }
      if (inBenefits && (lower.includes('requirement') || lower.includes('about us'))) {
        break;
      }
      if (inBenefits) {
        const trimmed = line.trim();
        if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
          const benefit = trimmed.replace(/^[-•*]\s*/, '').trim();
          if (benefit && benefit.length > 10 && benefit.length < 300) {
            benefits.push(benefit);
          }
        }
      }
    }

    return benefits.slice(0, 15);
  }

  private extractSkills(description: string): string[] {
    if (!description) return [];

    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby', 'php',
      'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'graphql', 'rest', 'microservices', 'ci/cd', 'devops', 'agile', 'scrum',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
