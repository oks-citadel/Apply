import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job} from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

/**
 * Circuit Breaker States
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * FindWork Provider with Rate Limiting and Circuit Breaker
 * Tech jobs aggregator with free tier
 * API Documentation: https://findwork.dev/developers/
 */
@Injectable()
export class FindWorkProvider implements JobProvider {
  private readonly logger = new Logger(FindWorkProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;
  private readonly apiKey: string;

  // Rate limiting
  private requestQueue: number[] = [];
  private readonly rateLimitWindow = 60000; // 1 minute
  private readonly maxRequestsPerWindow: number;

  // Circuit breaker
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000;
  private readonly halfOpenMaxRequests = 3;
  private halfOpenRequests = 0;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('FINDWORK_API_KEY', '');

    this.config = {
      apiKey: this.apiKey,
      apiUrl: this.configService.get('FINDWORK_API_URL', 'https://findwork.dev/api'),
      rateLimitPerMinute: this.configService.get('FINDWORK_RATE_LIMIT', 60),
      timeout: this.configService.get('FINDWORK_TIMEOUT', 30000),
    };

    this.maxRequestsPerWindow = this.config.rateLimitPerMinute;

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
    });
  }

  getName(): string {
    return 'FindWork';
  }

  /**
   * Rate Limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    this.requestQueue = this.requestQueue.filter(time => now - time < this.rateLimitWindow);

    if (this.requestQueue.length >= this.maxRequestsPerWindow) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = this.rateLimitWindow - (now - oldestRequest);

      this.logger.warn(`Rate limit reached for FindWork. Waiting ${waitTime}ms`, {
        provider: 'FindWork',
        current_requests: this.requestQueue.length,
        max_requests: this.maxRequestsPerWindow,
        wait_time_ms: waitTime,
      });

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkRateLimit();
    }

    this.requestQueue.push(now);
  }

  /**
   * Circuit Breaker
   */
  private checkCircuitBreaker(): void {
    const now = Date.now();

    if (this.circuitState === CircuitState.OPEN) {
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.logger.log('Circuit breaker transitioning to HALF_OPEN', {
          provider: 'FindWork',
          previous_state: 'OPEN',
          failure_count: this.failureCount,
        });
        this.circuitState = CircuitState.HALF_OPEN;
        this.halfOpenRequests = 0;
      } else {
        throw new Error(`Circuit breaker OPEN for FindWork. Service temporarily unavailable.`);
      }
    }

    if (this.circuitState === CircuitState.HALF_OPEN && this.halfOpenRequests >= this.halfOpenMaxRequests) {
      throw new Error(`Circuit breaker HALF_OPEN limit reached for FindWork.`);
    }
  }

  private recordSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.logger.log('Circuit breaker transitioning to CLOSED', {
        provider: 'FindWork',
        previous_state: 'HALF_OPEN',
      });
      this.circuitState = CircuitState.CLOSED;
      this.failureCount = 0;
      this.halfOpenRequests = 0;
    }
  }

  private recordFailure(error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.logger.warn('Circuit breaker opening due to failure in HALF_OPEN state', {
        provider: 'FindWork',
        error: error.message,
      });
      this.circuitState = CircuitState.OPEN;
      this.halfOpenRequests = 0;
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      this.logger.error('Circuit breaker OPENING due to failure threshold', {
        provider: 'FindWork',
        failure_count: this.failureCount,
        threshold: this.failureThreshold,
        error: error.message,
      });
      this.circuitState = CircuitState.OPEN;
    }
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
    remote?: boolean;
  }): Promise<RawJobData[]> {
    const startTime = Date.now();

    try {
      // Check circuit breaker
      this.checkCircuitBreaker();

      // Apply rate limiting
      await this.checkRateLimit();

      if (this.circuitState === CircuitState.HALF_OPEN) {
        this.halfOpenRequests++;
      }

      this.logger.log('Fetching jobs from FindWork', {
        provider: 'FindWork',
        keywords: params?.keywords,
        location: params?.location,
        page: params?.page || 1,
        circuit_state: this.circuitState,
      });

      const queryParams: Record<string, any> = {
        page: params?.page || 1,
      };

      if (params?.keywords) {
        queryParams.search = params.keywords;
      }

      if (params?.location) {
        queryParams.location = params.location;
      }

      if (params?.remote !== undefined) {
        queryParams.remote = params.remote;
      }

      const response = await this.httpClient.get('/jobs/', {
        params: queryParams,
      });

      const jobs = this.parseJobListings(response.data);
      const duration = Date.now() - startTime;

      this.logger.log('Successfully fetched jobs from FindWork', {
        provider: 'FindWork',
        job_count: jobs.length,
        duration_ms: duration,
        circuit_state: this.circuitState,
      });

      this.recordSuccess();
      return jobs;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(error);

      this.logger.error('FindWork API error', {
        provider: 'FindWork',
        error: error.message,
        duration_ms: duration,
        circuit_state: this.circuitState,
        failure_count: this.failureCount,
      });

      // Return empty array on failure
      return [];
    }
  }

  private parseJobListings(data: any): RawJobData[] {
    // FindWork API returns { count, next, previous, results }
    const results = data?.results || [];

    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((job: any) => ({
      external_id: String(job.id) || `findwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.role || job.title || '',
      company_name: job.company_name || '',
      company_logo_url: job.logo || null,
      location: job.location || (job.remote ? 'Remote' : 'Unknown'),
      remote_type: job.remote ? 'remote' : 'onsite',
      description: job.text || job.description || '',
      application_url: job.url || `https://findwork.dev/jobs/${job.id}`,
      posted_at: job.date_posted ? new Date(job.date_posted) : new Date(),
      expires_at: null,
      employment_type: this.mapEmploymentType(job.employment_type),
      experience_level: this.mapExperienceLevel(job),
      salary_min: null, // FindWork doesn't typically provide salary in free tier
      salary_max: null,
      salary_currency: 'USD',
      salary_period: 'yearly',
      requirements: this.extractRequirements(job.text || job.description),
      skills: job.keywords || [],
      benefits: this.extractBenefits(job.text || job.description),
      metadata: {
        findwork_id: job.id,
        slug: job.slug,
        keywords: job.keywords,
        source: job.source,
        remote: job.remote,
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    const startTime = Date.now();

    try {
      this.checkCircuitBreaker();
      await this.checkRateLimit();

      if (this.circuitState === CircuitState.HALF_OPEN) {
        this.halfOpenRequests++;
      }

      this.logger.log('Fetching job details from FindWork', {
        provider: 'FindWork',
        external_id: externalId,
        circuit_state: this.circuitState,
      });

      const response = await this.httpClient.get(`/jobs/${externalId}/`);
      const job = response.data;

      const duration = Date.now() - startTime;

      this.logger.log('Successfully fetched job details from FindWork', {
        provider: 'FindWork',
        external_id: externalId,
        duration_ms: duration,
      });

      this.recordSuccess();

      return {
        external_id: String(job.id) || externalId,
        title: job.role || job.title || '',
        company_name: job.company_name || '',
        company_logo_url: job.logo || null,
        location: job.location || (job.remote ? 'Remote' : 'Unknown'),
        remote_type: job.remote ? 'remote' : 'onsite',
        description: job.text || job.description || '',
        requirements: this.extractRequirements(job.text || job.description),
        benefits: this.extractBenefits(job.text || job.description),
        skills: job.keywords || [],
        application_url: job.url || `https://findwork.dev/jobs/${job.id}`,
        posted_at: job.date_posted ? new Date(job.date_posted) : new Date(),
        expires_at: null,
        employment_type: this.mapEmploymentType(job.employment_type),
        experience_level: this.mapExperienceLevel(job),
        salary_min: null,
        salary_max: null,
        salary_currency: 'USD',
        salary_period: 'yearly',
        metadata: {
          findwork_id: job.id,
          slug: job.slug,
          keywords: job.keywords,
          source: job.source,
          remote: job.remote,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(error);

      this.logger.error('Failed to fetch FindWork job details', {
        provider: 'FindWork',
        external_id: externalId,
        error: error.message,
        duration_ms: duration,
      });

      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.FINDWORK,
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
      ats_platform: 'FindWork',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/jobs/', {
        params: { page: 1 },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn('FindWork health check failed', {
        provider: 'FindWork',
        error: error.message,
      });
      return false;
    }
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
    if (normalized.includes('full') || normalized.includes('permanent')) {
      return 'full_time';
    }
    if (normalized.includes('part')) {
      return 'part_time';
    }
    if (normalized.includes('contract') || normalized.includes('freelance')) {
      return 'contract';
    }
    if (normalized.includes('temp')) {
      return 'temporary';
    }
    if (normalized.includes('intern')) {
      return 'internship';
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

  private mapExperienceLevel(job: any): string {
    const title = (job.role || job.title || '').toLowerCase();
    const text = (job.text || job.description || '').toLowerCase();

    if (title.includes('senior') || title.includes('sr.') || title.includes('sr ')) {
      return 'senior';
    }
    if (title.includes('junior') || title.includes('jr.') || title.includes('jr ')) {
      return 'junior';
    }
    if (title.includes('entry') || title.includes('graduate') || text.includes('0-2 years')) {
      return 'entry';
    }
    if (title.includes('lead') || title.includes('principal') || title.includes('staff')) {
      return 'lead';
    }
    if (title.includes('director') || title.includes('executive') || title.includes('head of') || title.includes('vp')) {
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

  private extractRequirements(description: string): string[] {
    if (!description) {
      return [];
    }

    const requirements: string[] = [];
    const lines = description.split('\n');
    let inRequirements = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('requirement') || lower.includes('qualification') || lower.includes('must have') || lower.includes('you will')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && (lower.includes('benefit') || lower.includes('we offer') || lower.includes('nice to have'))) {
        inRequirements = false;
      }
      if (inRequirements && line.trim().match(/^[-•*\d]/)) {
        requirements.push(line.trim().replace(/^[-•*\d.)\s]+/, ''));
      }
    }

    return requirements.slice(0, 20);
  }

  private extractBenefits(description: string): string[] {
    if (!description) {
      return [];
    }

    const benefits: string[] = [];
    const lines = description.split('\n');
    let inBenefits = false;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('benefit') || lower.includes('we offer') || lower.includes('perks') || lower.includes('what we offer')) {
        inBenefits = true;
        continue;
      }
      if (inBenefits && line.trim().match(/^[-•*\d]/)) {
        benefits.push(line.trim().replace(/^[-•*\d.)\s]+/, ''));
      }
    }

    return benefits.slice(0, 15);
  }
}
