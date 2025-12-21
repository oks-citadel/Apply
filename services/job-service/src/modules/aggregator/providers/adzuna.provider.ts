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
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing - reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Adzuna Provider with Rate Limiting and Circuit Breaker
 * FREE tier: 250 calls/day
 * API Documentation: https://developer.adzuna.com/
 */
@Injectable()
export class AdzunaProvider implements JobProvider {
  private readonly logger = new Logger(AdzunaProvider.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;
  private readonly appId: string;
  private readonly appKey: string;

  // Rate limiting
  private requestQueue: number[] = [];
  private readonly rateLimitWindow = 60000; // 1 minute in ms
  private readonly maxRequestsPerWindow: number;

  // Circuit breaker
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute
  private readonly halfOpenMaxRequests = 3;
  private halfOpenRequests = 0;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get('ADZUNA_APP_ID', '');
    this.appKey = this.configService.get('ADZUNA_API_KEY', '');

    this.config = {
      apiUrl: this.configService.get('ADZUNA_API_URL', 'https://api.adzuna.com/v1/api/jobs'),
      rateLimitPerMinute: this.configService.get('ADZUNA_RATE_LIMIT', 250),
      timeout: this.configService.get('ADZUNA_TIMEOUT', 30000),
    };

    this.maxRequestsPerWindow = this.config.rateLimitPerMinute;

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  getName(): string {
    return 'Adzuna';
  }

  /**
   * Rate Limiting: Check if we can make a request
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Remove requests outside the current window
    this.requestQueue = this.requestQueue.filter(time => now - time < this.rateLimitWindow);

    if (this.requestQueue.length >= this.maxRequestsPerWindow) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = this.rateLimitWindow - (now - oldestRequest);

      this.logger.warn(`Rate limit reached for Adzuna. Waiting ${waitTime}ms`, {
        provider: 'Adzuna',
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
   * Circuit Breaker: Check if we should allow the request
   */
  private checkCircuitBreaker(): void {
    const now = Date.now();

    if (this.circuitState === CircuitState.OPEN) {
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.logger.log('Circuit breaker transitioning to HALF_OPEN', {
          provider: 'Adzuna',
          previous_state: 'OPEN',
          failure_count: this.failureCount,
        });
        this.circuitState = CircuitState.HALF_OPEN;
        this.halfOpenRequests = 0;
      } else {
        throw new Error(`Circuit breaker OPEN for Adzuna. Service temporarily unavailable.`);
      }
    }

    if (this.circuitState === CircuitState.HALF_OPEN && this.halfOpenRequests >= this.halfOpenMaxRequests) {
      throw new Error(`Circuit breaker HALF_OPEN limit reached for Adzuna.`);
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.logger.log('Circuit breaker transitioning to CLOSED', {
        provider: 'Adzuna',
        previous_state: 'HALF_OPEN',
      });
      this.circuitState = CircuitState.CLOSED;
      this.failureCount = 0;
      this.halfOpenRequests = 0;
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.logger.warn('Circuit breaker opening due to failure in HALF_OPEN state', {
        provider: 'Adzuna',
        error: error.message,
      });
      this.circuitState = CircuitState.OPEN;
      this.halfOpenRequests = 0;
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      this.logger.error('Circuit breaker OPENING due to failure threshold', {
        provider: 'Adzuna',
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
    country?: string;
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

      const country = params?.country || 'us';

      this.logger.log('Fetching jobs from Adzuna', {
        provider: 'Adzuna',
        keywords: params?.keywords,
        location: params?.location,
        country,
        page: params?.page || 1,
        circuit_state: this.circuitState,
      });

      const response = await this.httpClient.get(`/${country}/search/${params?.page || 1}`, {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          what: params?.keywords,
          where: params?.location,
          results_per_page: params?.limit || 25,
          content_type: 'application/json',
        },
      });

      const jobs = this.parseJobListings(response.data);
      const duration = Date.now() - startTime;

      this.logger.log('Successfully fetched jobs from Adzuna', {
        provider: 'Adzuna',
        job_count: jobs.length,
        duration_ms: duration,
        circuit_state: this.circuitState,
      });

      this.recordSuccess();
      return jobs;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(error);

      this.logger.error('Adzuna API error', {
        provider: 'Adzuna',
        error: error.message,
        duration_ms: duration,
        circuit_state: this.circuitState,
        failure_count: this.failureCount,
      });

      // Fallback to RapidAPI
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
        this.logger.warn('No RapidAPI key configured for Adzuna fallback');
        return [];
      }

      const response = await axios.get('https://adzuna.p.rapidapi.com/search', {
        params: {
          query: params?.keywords || 'software engineer',
          location: params?.location || 'United States',
          page: String(params?.page || 1),
          results_per_page: String(params?.limit || 25),
        },
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'adzuna.p.rapidapi.com',
        },
        timeout: 30000,
      });

      if (response.data?.results) {
        return response.data.results.map((job: any) => this.mapRapidAPIJob(job));
      }
      return [];
    } catch (error) {
      this.logger.error(`RapidAPI Adzuna fallback error: ${error.message}`);
      return [];
    }
  }

  private mapRapidAPIJob(job: any): RawJobData {
    return {
      external_id: job.id || `az-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || '',
      company_name: job.company?.display_name || '',
      company_logo_url: null,
      location: job.location?.display_name || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || '',
      application_url: job.redirect_url || '',
      posted_at: job.created ? new Date(job.created) : new Date(),
      employment_type: this.mapEmploymentType(job.contract_type || ''),
      experience_level: this.mapExperienceLevel(job),
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      salary_currency: 'USD',
      salary_period: 'yearly',
      metadata: {
        source_api: 'rapidapi',
        category: job.category?.label,
        latitude: job.latitude,
        longitude: job.longitude,
        original_data: job,
      },
    };
  }

  private parseJobListings(data: any): RawJobData[] {
    if (!data?.results) {return [];}

    return data.results.map((job: any) => ({
      external_id: job.id || '',
      title: job.title || '',
      company_name: job.company?.display_name || '',
      company_logo_url: null,
      location: job.location?.display_name || '',
      remote_type: this.detectRemoteType(job),
      description: job.description || '',
      application_url: job.redirect_url || '',
      posted_at: job.created ? new Date(job.created) : new Date(),
      expires_at: null,
      employment_type: this.mapEmploymentType(job.contract_type || job.contract_time),
      experience_level: this.mapExperienceLevel(job),
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      salary_currency: 'GBP', // Adzuna default is GBP, convert as needed
      salary_period: 'yearly',
      metadata: {
        adzuna_id: job.id,
        category: job.category?.label,
        latitude: job.latitude,
        longitude: job.longitude,
      },
    }));
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      // Adzuna doesn't have a dedicated job details endpoint
      // Return a search result with the job ID
      const response = await this.httpClient.get('/us/search/1', {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          what: externalId,
          results_per_page: 1,
        },
      });

      if (response.data?.results?.[0]) {
        const job = response.data.results[0];
        return {
          external_id: job.id,
          title: job.title || '',
          company_name: job.company?.display_name || '',
          company_logo_url: null,
          location: job.location?.display_name || '',
          remote_type: this.detectRemoteType(job),
          description: job.description || '',
          requirements: this.extractRequirements(job.description),
          benefits: this.extractBenefits(job.description),
          skills: this.extractSkills(job.description),
          application_url: job.redirect_url || '',
          posted_at: job.created ? new Date(job.created) : new Date(),
          employment_type: this.mapEmploymentType(job.contract_type),
          experience_level: this.mapExperienceLevel(job),
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: 'USD',
          metadata: {
            adzuna_id: job.id,
            category: job.category?.label,
          },
        };
      }
      throw new Error('Job not found');
    } catch (error) {
      this.logger.error(`Failed to fetch Adzuna job details: ${error.message}`);
      throw error;
    }
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.ADZUNA,
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
      ats_platform: 'Adzuna',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/us/search/1', {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          what: 'test',
          results_per_page: 1,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      try {
        const rapidApiKey = this.configService.get('RAPIDAPI_KEY');
        if (rapidApiKey) {
          const response = await axios.get('https://adzuna.p.rapidapi.com/search', {
            params: { query: 'test', location: 'US', page: '1' },
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'adzuna.p.rapidapi.com',
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
    const location = (job.location?.display_name || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();

    if (location.includes('remote') || title.includes('remote') || description.includes('remote position')) {
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

  private mapExperienceLevel(job: any): string {
    const title = (job.title || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();

    if (title.includes('senior') || title.includes('sr.') || title.includes('sr ')) {return 'senior';}
    if (title.includes('junior') || title.includes('jr.') || title.includes('jr ')) {return 'junior';}
    if (title.includes('entry') || title.includes('graduate') || desc.includes('0-2 years')) {return 'entry';}
    if (title.includes('lead') || title.includes('principal')) {return 'lead';}
    if (title.includes('director') || title.includes('executive') || title.includes('vp')) {return 'executive';}
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
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby', 'php',
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'git', 'agile', 'scrum', 'ci/cd', 'rest', 'graphql', 'microservices',
    ];
    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
