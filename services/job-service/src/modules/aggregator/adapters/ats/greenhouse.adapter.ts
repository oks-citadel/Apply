import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../../jobs/entities/job.entity';

import type { Job } from '../../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

interface GreenhouseJob {
  id: number;
  title: string;
  location: {
    name: string;
  };
  updated_at: string;
  absolute_url: string;
  metadata?: any[];
  departments?: Array<{
    id: number;
    name: string;
  }>;
  offices?: Array<{
    id: number;
    name: string;
    location: string;
  }>;
  content?: string;
}

interface GreenhouseJobDetail extends GreenhouseJob {
  content: string;
}

/**
 * Greenhouse ATS Adapter
 *
 * Fetches public job listings from Greenhouse boards.
 * Endpoint pattern: https://boards-api.greenhouse.io/v1/boards/{company}/jobs
 *
 * Features:
 * - No authentication required for public boards
 * - Supports job details endpoint
 * - Maintains list of known company boards
 * - Auto-discovery of new company boards
 */
@Injectable()
export class GreenhouseAdapter implements JobProvider {
  private readonly logger = new Logger(GreenhouseAdapter.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  // Curated list of top tech companies using Greenhouse
  private readonly companyBoards: string[] = [
    'spotify',
    'airbnb',
    'stripe',
    'shopify',
    'gitlab',
    'databricks',
    'coinbase',
    'figma',
    'notion',
    'airtable',
    'asana',
    'dropbox',
    'squareup',
    'reddit',
    'robinhood',
    'doordash',
    'instacart',
    'affirm',
    'plaid',
    'twilio',
    'segment',
    'hashicorp',
    'elastic',
    'mongodb',
    'snowflake',
    'databricks',
    'amplitude',
    'benchling',
    'chime',
    'ramp',
    'brex',
    'sourcegraph',
    'vercel',
    'planetscale',
    'supabase',
    'railway',
    'fly',
    'temporal',
    'retool',
    'mux',
    'loom',
    'canva',
    'pitch',
    'linear',
    'coda',
    'webflow',
    'zapier',
    'airtable',
    'lattice',
    'gusto',
    'rippling',
    'deel',
    'remote',
    'coursera',
    'udemy',
    'duolingo',
    '23andme',
    'tempus',
    'color',
    'grammarly',
    'discord',
    'twitch',
    'roblox',
    'unity',
    'epic',
    'niantic',
    'peloton',
    'calm',
    'noom',
    'headspace',
    'tiktok',
    'snap',
    'pinterest',
    'nextdoor',
    'medium',
    'substack',
    'patreon',
    'onlyfans',
    'cameo',
    'masterclass',
    'skillshare',
    'teachable',
    'thinkific',
    'kajabi',
    'podia',
    'gumroad',
    'convertkit',
    'beehiiv',
    'ghost',
    'wordpress',
    'automattic',
    'cloudflare',
    'fastly',
    'netlify',
    'render',
    'digitalocean',
    'linode',
    'vultr',
    'scaleway',
    'hetzner',
    'packet',
    'equinix',
  ];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiUrl: 'https://boards-api.greenhouse.io/v1',
      timeout: this.configService.get('GREENHOUSE_TIMEOUT', 30000),
      rateLimitPerMinute: this.configService.get('GREENHOUSE_RATE_LIMIT', 60),
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
    return 'Greenhouse';
  }

  /**
   * Fetch jobs from all known Greenhouse company boards
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

      // Fetch from multiple company boards in parallel (with rate limiting)
      const boardsToFetch = this.companyBoards.slice(0, 20); // Limit to first 20 companies per batch

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
      this.logger.error(`Greenhouse fetchJobs error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch jobs from a specific Greenhouse company board
   */
  async fetchJobsFromBoard(boardId: string, params?: {
    keywords?: string;
    location?: string;
  }): Promise<RawJobData[]> {
    try {
      const response = await this.httpClient.get(`/boards/${boardId}/jobs`, {
        params: {
          content: 'true', // Include job description
        },
      });

      if (!response.data?.jobs) {
        return [];
      }

      const jobs = response.data.jobs as GreenhouseJob[];

      return jobs.map(job => this.mapGreenhouseJob(job, boardId));
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.debug(`Board not found: ${boardId}`);
      } else {
        this.logger.warn(`Error fetching from Greenhouse board ${boardId}: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Fetch detailed information for a specific job
   */
  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      // External ID format: greenhouse-{boardId}-{jobId}
      const [, boardId, jobId] = externalId.split('-');

      const response = await this.httpClient.get(`/boards/${boardId}/jobs/${jobId}`);
      const job = response.data as GreenhouseJobDetail;

      return this.mapGreenhouseJob(job, boardId);
    } catch (error) {
      this.logger.error(`Failed to fetch Greenhouse job details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map Greenhouse job to RawJobData
   */
  private mapGreenhouseJob(job: GreenhouseJob, boardId: string): RawJobData {
    const location = job.location?.name || job.offices?.[0]?.location || '';
    const description = job.content || '';

    return {
      external_id: `greenhouse-${boardId}-${job.id}`,
      title: job.title,
      company_name: this.formatCompanyName(boardId),
      location,
      remote_type: this.detectRemoteType(location, job.title),
      description,
      requirements: this.extractRequirements(description),
      benefits: this.extractBenefits(description),
      skills: this.extractSkills(description),
      experience_level: this.detectExperienceLevel(job.title, description),
      employment_type: this.detectEmploymentType(job.title, description),
      posted_at: job.updated_at ? new Date(job.updated_at) : new Date(),
      application_url: job.absolute_url,
      metadata: {
        greenhouse_board_id: boardId,
        greenhouse_job_id: job.id,
        departments: job.departments,
        offices: job.offices,
        raw_location: job.location,
      },
    };
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.GREENHOUSE,
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
      ats_platform: 'Greenhouse',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try fetching from a known reliable board
      const response = await this.httpClient.get('/boards/spotify/jobs', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Discover new company boards by testing common company names
   */
  async discoverNewBoards(potentialBoardIds: string[]): Promise<string[]> {
    const discoveredBoards: string[] = [];

    const results = await Promise.allSettled(
      potentialBoardIds.map(async boardId => {
        try {
          const response = await this.httpClient.get(`/boards/${boardId}/jobs`, {
            timeout: 5000,
          });
          if (response.data?.jobs && response.data.jobs.length > 0) {
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

  /**
   * Get all company boards
   */
  getCompanyBoards(): string[] {
    return [...this.companyBoards];
  }

  /**
   * Add a new company board
   */
  addCompanyBoard(boardId: string): void {
    if (!this.companyBoards.includes(boardId)) {
      this.companyBoards.push(boardId);
      this.logger.log(`Added new Greenhouse board: ${boardId}`);
    }
  }

  // Helper methods

  private formatCompanyName(boardId: string): string {
    // Convert board ID to company name (e.g., "spotify" -> "Spotify")
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

  private detectExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('senior') || text.includes('sr.') || text.includes('sr ')) {
      return 'senior';
    }
    if (text.includes('lead') || text.includes('principal') || text.includes('staff')) {
      return 'lead';
    }
    if (text.includes('junior') || text.includes('jr.') || text.includes('entry')) {
      return 'junior';
    }
    if (text.includes('intern')) {
      return 'entry';
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

  private detectEmploymentType(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('contract') || text.includes('contractor')) {
      return 'contract';
    }
    if (text.includes('part-time') || text.includes('part time')) {
      return 'part_time';
    }
    if (text.includes('intern')) {
      return 'internship';
    }
    if (text.includes('temporary') || text.includes('temp')) {
      return 'temporary';
    }
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

  private extractRequirements(description: string): string[] {
    if (!description) return [];

    const requirements: string[] = [];
    const sections = description.toLowerCase();

    // Look for common requirement section headers
    const reqPatterns = [
      /requirements?:?\s*([^]*?)(?=\n\n|responsibilities|qualifications|benefits|about|$)/i,
      /qualifications?:?\s*([^]*?)(?=\n\n|responsibilities|requirements|benefits|about|$)/i,
      /must have:?\s*([^]*?)(?=\n\n|nice to have|benefits|about|$)/i,
      /what (?:you'll|we're) (?:need|looking for):?\s*([^]*?)(?=\n\n|benefits|about|$)/i,
    ];

    for (const pattern of reqPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
            const req = trimmed.replace(/^[-•*]\s*/, '').trim();
            if (req && req.length > 10) {
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
      /perks:?\s*([^]*?)(?=\n\n|about|equal opportunity|$)/i,
    ];

    for (const pattern of benefitPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
            const benefit = trimmed.replace(/^[-•*]\s*/, '').trim();
            if (benefit && benefit.length > 10) {
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
      'jenkins', 'gitlab', 'github actions', 'circleci', 'travis',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
      'graphql', 'rest', 'grpc', 'microservices', 'serverless',
      'machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'computer vision',
      'data science', 'analytics', 'big data', 'spark', 'hadoop',
      'git', 'agile', 'scrum', 'kanban', 'ci/cd', 'devops', 'sre',
      'react native', 'flutter', 'ios', 'android', 'mobile',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
