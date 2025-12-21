import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../../jobs/entities/job.entity';

import type { Job } from '../../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

interface LeverJob {
  id: string;
  text: string;
  categories: {
    team?: string;
    department?: string;
    location?: string;
    commitment?: string;
    level?: string;
  };
  description: string;
  descriptionPlain: string;
  lists?: Array<{
    text: string;
    content: string;
  }>;
  additional?: string;
  additionalPlain?: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
    interval: string;
  };
}

/**
 * Lever ATS Adapter
 *
 * Fetches public job postings from Lever.
 * Endpoint pattern: https://api.lever.co/v0/postings/{company}
 *
 * Features:
 * - No authentication required for public postings
 * - Supports filtering by team, location, commitment
 * - Rich metadata including categories and salary ranges
 * - Maintains list of known company identifiers
 */
@Injectable()
export class LeverAdapter implements JobProvider {
  private readonly logger = new Logger(LeverAdapter.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  // Curated list of companies using Lever
  private readonly companyBoards: string[] = [
    'netflix',
    'uber',
    'lyft',
    'postmates',
    'grubhub',
    'doordash',
    'deliveroo',
    'rappi',
    'gojek',
    'grab',
    'ola',
    'bolt',
    'lime',
    'bird',
    'zoox',
    'cruise',
    'waymo',
    'aurora',
    'nuro',
    'convoy',
    'flexport',
    'shippo',
    'samsara',
    'convoy',
    'blend',
    'better',
    'opendoor',
    'redfin',
    'compass',
    'houzz',
    'zillow',
    'trulia',
    'realtor',
    'apartmentlist',
    'zumper',
    'renttherunway',
    'warbyparker',
    'allbirds',
    'everlane',
    'glossier',
    'casper',
    'away',
    'outdoor',
    'patagonia',
    'nike',
    'adidas',
    'lululemon',
    'underarmour',
    'reebok',
    'puma',
    'newbalance',
    'vans',
    'converse',
    'toms',
    'zappos',
    'farfetch',
    'ssense',
    'revolve',
    'nordstrom',
    'macys',
    'bloomingdales',
    'saks',
    'barneys',
    'bergdorf',
    'neiman',
    'anthropologie',
    'urbanoutfitters',
    'freepeople',
    'jcrew',
    'madewell',
    'gap',
    'oldnavy',
    'bananarepublic',
    'athleta',
    'bonobos',
    'untuckit',
    'mizzen',
    'stitch',
    'trunkclub',
    'bombas',
    'meundies',
    'harrys',
    'dollar',
    'quip',
    'hims',
    'hers',
    'ro',
    'nurx',
    'curology',
    'keeps',
    'roman',
    'manual',
    'forhims',
    'forher',
  ];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiUrl: 'https://api.lever.co/v0',
      timeout: this.configService.get('LEVER_TIMEOUT', 30000),
      rateLimitPerMinute: this.configService.get('LEVER_RATE_LIMIT', 100),
    };

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ApplyForUs-JobAggregator/1.0',
      },
    });
  }

  getName(): string {
    return 'Lever';
  }

  /**
   * Fetch jobs from all known Lever company boards
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

      // Fetch from multiple company boards in parallel
      const boardsToFetch = this.companyBoards.slice(0, 15);

      const results = await Promise.allSettled(
        boardsToFetch.map(boardId => this.fetchJobsFromBoard(boardId, params)),
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
          job.description.toLowerCase().includes(keywords) ||
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
      this.logger.error(`Lever fetchJobs error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch jobs from a specific Lever company board
   */
  async fetchJobsFromBoard(boardId: string, params?: {
    keywords?: string;
    location?: string;
  }): Promise<RawJobData[]> {
    try {
      const queryParams: any = {
        mode: 'json',
      };

      if (params?.location) {
        queryParams.location = params.location;
      }

      const response = await this.httpClient.get(`/postings/${boardId}`, {
        params: queryParams,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      const jobs = response.data as LeverJob[];

      return jobs.map(job => this.mapLeverJob(job, boardId));
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.debug(`Board not found: ${boardId}`);
      } else {
        this.logger.warn(`Error fetching from Lever board ${boardId}: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Fetch detailed information for a specific job
   */
  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      // External ID format: lever-{boardId}-{jobId}
      const [, boardId, jobId] = externalId.split('-');

      const response = await this.httpClient.get(`/postings/${boardId}/${jobId}`);
      const job = response.data as LeverJob;

      return this.mapLeverJob(job, boardId);
    } catch (error) {
      this.logger.error(`Failed to fetch Lever job details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map Lever job to RawJobData
   */
  private mapLeverJob(job: LeverJob, boardId: string): RawJobData {
    const location = job.categories?.location || '';
    const commitment = job.categories?.commitment || '';
    const level = job.categories?.level || '';

    // Combine description and lists
    let fullDescription = job.descriptionPlain || job.description || '';
    if (job.lists && job.lists.length > 0) {
      fullDescription += '\n\n' + job.lists.map(list => `${list.text}\n${list.content}`).join('\n\n');
    }
    if (job.additionalPlain || job.additional) {
      fullDescription += '\n\n' + (job.additionalPlain || job.additional);
    }

    return {
      external_id: `lever-${boardId}-${job.id}`,
      title: job.text,
      company_name: this.formatCompanyName(boardId),
      location,
      remote_type: this.detectRemoteType(location, job.text),
      description: fullDescription,
      requirements: this.extractRequirements(fullDescription),
      benefits: this.extractBenefits(fullDescription),
      skills: this.extractSkills(fullDescription),
      experience_level: this.mapExperienceLevel(level, job.text),
      employment_type: this.mapEmploymentType(commitment),
      posted_at: job.createdAt ? new Date(job.createdAt) : new Date(),
      application_url: job.applyUrl || job.hostedUrl,
      salary_min: job.salaryRange?.min,
      salary_max: job.salaryRange?.max,
      salary_currency: job.salaryRange?.currency || 'USD',
      salary_period: this.mapSalaryInterval(job.salaryRange?.interval),
      metadata: {
        lever_board_id: boardId,
        lever_job_id: job.id,
        categories: job.categories,
        team: job.categories?.team,
        department: job.categories?.department,
        commitment,
        level,
        hosted_url: job.hostedUrl,
      },
    };
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.LEVER,
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
      ats_platform: 'Lever',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try fetching from a known reliable board
      const response = await this.httpClient.get('/postings/netflix', {
        params: { mode: 'json', limit: 1 },
        timeout: 5000,
      });
      return response.status === 200 && Array.isArray(response.data);
    } catch {
      return false;
    }
  }

  /**
   * Discover new company boards
   */
  async discoverNewBoards(potentialBoardIds: string[]): Promise<string[]> {
    const discoveredBoards: string[] = [];

    const results = await Promise.allSettled(
      potentialBoardIds.map(async boardId => {
        try {
          const response = await this.httpClient.get(`/postings/${boardId}`, {
            params: { mode: 'json' },
            timeout: 5000,
          });
          if (Array.isArray(response.data) && response.data.length > 0) {
            return boardId;
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

  getCompanyBoards(): string[] {
    return [...this.companyBoards];
  }

  addCompanyBoard(boardId: string): void {
    if (!this.companyBoards.includes(boardId)) {
      this.companyBoards.push(boardId);
      this.logger.log(`Added new Lever board: ${boardId}`);
    }
  }

  // Helper methods

  private formatCompanyName(boardId: string): string {
    return boardId
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private detectRemoteType(location: string, title: string): string {
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

  private mapExperienceLevel(level: string, title: string): string {
    const combined = `${level} ${title}`.toLowerCase();

    if (combined.includes('senior') || combined.includes('sr.') || combined.includes('sr ')) {
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
    if (combined.includes('director') || combined.includes('vp') || combined.includes('chief')) {
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

  private mapEmploymentType(commitment: string): string {
    const normalized = (commitment || '').toLowerCase();

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

  private mapSalaryInterval(interval: string): string {
    const normalized = (interval || '').toLowerCase();
    if (normalized.includes('year')) return 'yearly';
    if (normalized.includes('month')) return 'monthly';
    if (normalized.includes('hour')) return 'hourly';
    if (normalized.includes('day')) return 'daily';
    return 'yearly';
  }

  private extractRequirements(description: string): string[] {
    if (!description) return [];

    const requirements: string[] = [];

    const reqPatterns = [
      /requirements?:?\s*([^]*?)(?=\n\n|benefits|about|equal opportunity|$)/i,
      /qualifications?:?\s*([^]*?)(?=\n\n|benefits|about|equal opportunity|$)/i,
      /what (?:you'll|we're) (?:need|bring|looking for):?\s*([^]*?)(?=\n\n|benefits|about|$)/i,
      /you have:?\s*([^]*?)(?=\n\n|benefits|about|$)/i,
    ];

    for (const pattern of reqPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
            const req = trimmed.replace(/^[-•*]\s*/, '').trim();
            if (req && req.length > 10 && req.length < 300) {
              requirements.push(req);
            }
          }
        }
      }
      if (requirements.length > 0) break;
    }

    return requirements.slice(0, 20);
  }

  private extractBenefits(description: string): string[] {
    if (!description) return [];

    const benefits: string[] = [];

    const benefitPatterns = [
      /benefits?:?\s*([^]*?)(?=\n\n|about|equal opportunity|$)/i,
      /(?:what )?we offer:?\s*([^]*?)(?=\n\n|about|equal opportunity|$)/i,
      /perks (?:and benefits)?:?\s*([^]*?)(?=\n\n|about|equal opportunity|$)/i,
      /you'll get:?\s*([^]*?)(?=\n\n|about|equal opportunity|$)/i,
    ];

    for (const pattern of benefitPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
            const benefit = trimmed.replace(/^[-•*]\s*/, '').trim();
            if (benefit && benefit.length > 10 && benefit.length < 300) {
              benefits.push(benefit);
            }
          }
        }
      }
      if (benefits.length > 0) break;
    }

    return benefits.slice(0, 15);
  }

  private extractSkills(description: string): string[] {
    if (!description) return [];

    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
      'react', 'angular', 'vue', 'svelte', 'nextjs', 'next.js', 'node.js', 'nodejs', 'express', 'fastapi',
      'django', 'flask', 'spring', 'springboot', 'rails', 'laravel',
      'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
      'jenkins', 'gitlab', 'github actions', 'circleci',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
      'graphql', 'rest', 'grpc', 'microservices', 'serverless',
      'machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'computer vision',
      'data science', 'analytics', 'tableau', 'power bi', 'looker',
      'git', 'agile', 'scrum', 'kanban', 'ci/cd', 'devops', 'sre',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
