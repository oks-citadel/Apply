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
 * Reed Provider with Rate Limiting and Circuit Breaker
 * UK's leading job board - Free tier available
 * API Documentation: https://www.reed.co.uk/developers/jobseeker
 */
@Injectable()
export class ReedProvider implements JobProvider {
  private readonly logger = new Logger(ReedProvider.name);
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
    this.apiKey = this.configService.get('REED_API_KEY', '');

    this.config = {
      apiKey: this.apiKey,
      apiUrl: this.configService.get('REED_API_URL', 'https://www.reed.co.uk/api/1.0'),
      rateLimitPerMinute: this.configService.get('REED_RATE_LIMIT', 60),
      timeout: this.configService.get('REED_TIMEOUT', 30000),
    };

    this.maxRequestsPerWindow = this.config.rateLimitPerMinute;

    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: this.apiKey,
        password: '', // Reed uses Basic Auth with API key as username
      },
    });
  }

  getName(): string {
    return 'Reed';
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

      this.logger.warn(`Rate limit reached for Reed. Waiting ${waitTime}ms`, {
        provider: 'Reed',
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
          provider: 'Reed',
          previous_state: 'OPEN',
          failure_count: this.failureCount,
        });
        this.circuitState = CircuitState.HALF_OPEN;
        this.halfOpenRequests = 0;
      } else {
        throw new Error(`Circuit breaker OPEN for Reed. Service temporarily unavailable.`);
      }
    }

    if (this.circuitState === CircuitState.HALF_OPEN && this.halfOpenRequests >= this.halfOpenMaxRequests) {
      throw new Error(`Circuit breaker HALF_OPEN limit reached for Reed.`);
    }
  }

  private recordSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.logger.log('Circuit breaker transitioning to CLOSED', {
        provider: 'Reed',
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
        provider: 'Reed',
        error: error.message,
      });
      this.circuitState = CircuitState.OPEN;
      this.halfOpenRequests = 0;
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      this.logger.error('Circuit breaker OPENING due to failure threshold', {
        provider: 'Reed',
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

      this.logger.log('Fetching jobs from Reed', {
        provider: 'Reed',
        keywords: params?.keywords,
        location: params?.location,
        page: params?.page || 1,
        circuit_state: this.circuitState,
      });

      const response = await this.httpClient.get('/search', {
        params: {
          keywords: params?.keywords || '',
          locationName: params?.location || '',
          resultsToTake: params?.limit || 25,
          resultsToSkip: ((params?.page || 1) - 1) * (params?.limit || 25),
        },
      });

      const jobs = this.parseJobListings(response.data);
      const duration = Date.now() - startTime;

      this.logger.log('Successfully fetched jobs from Reed', {
        provider: 'Reed',
        job_count: jobs.length,
        duration_ms: duration,
        circuit_state: this.circuitState,
      });

      this.recordSuccess();
      return jobs;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(error);

      this.logger.error('Reed API error', {
        provider: 'Reed',
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
    if (!data?.results) {
      return [];
    }

    return data.results.map((job: any) => ({
      external_id: String(job.jobId) || `reed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.jobTitle || '',
      company_name: job.employerName || '',
      company_logo_url: null,
      location: job.locationName || '',
      remote_type: this.detectRemoteType(job),
      description: job.jobDescription || '',
      application_url: job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`,
      posted_at: job.date ? new Date(job.date) : new Date(),
      expires_at: job.expirationDate ? new Date(job.expirationDate) : null,
      employment_type: this.mapEmploymentType(job.jobType || job.contractType),
      experience_level: this.mapExperienceLevel(job),
      salary_min: job.minimumSalary || null,
      salary_max: job.maximumSalary || null,
      salary_currency: job.currency || 'GBP',
      salary_period: 'yearly',
      requirements: this.extractRequirements(job.jobDescription),
      skills: this.extractSkills(job.jobDescription),
      benefits: this.extractBenefits(job.jobDescription),
      metadata: {
        reed_id: job.jobId,
        employer_id: job.employerId,
        applications: job.applications,
        part_time: job.partTime,
        full_time: job.fullTime,
        contract_type: job.contractType,
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

      this.logger.log('Fetching job details from Reed', {
        provider: 'Reed',
        external_id: externalId,
        circuit_state: this.circuitState,
      });

      const response = await this.httpClient.get(`/jobs/${externalId}`);
      const job = response.data;

      const duration = Date.now() - startTime;

      this.logger.log('Successfully fetched job details from Reed', {
        provider: 'Reed',
        external_id: externalId,
        duration_ms: duration,
      });

      this.recordSuccess();

      return {
        external_id: String(job.jobId) || externalId,
        title: job.jobTitle || '',
        company_name: job.employerName || '',
        company_logo_url: null,
        location: job.locationName || '',
        remote_type: this.detectRemoteType(job),
        description: job.jobDescription || '',
        requirements: this.extractRequirements(job.jobDescription),
        benefits: this.extractBenefits(job.jobDescription),
        skills: this.extractSkills(job.jobDescription),
        application_url: job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`,
        posted_at: job.date ? new Date(job.date) : new Date(),
        expires_at: job.expirationDate ? new Date(job.expirationDate) : null,
        employment_type: this.mapEmploymentType(job.jobType || job.contractType),
        experience_level: this.mapExperienceLevel(job),
        salary_min: job.minimumSalary,
        salary_max: job.maximumSalary,
        salary_currency: job.currency || 'GBP',
        salary_period: 'yearly',
        metadata: {
          reed_id: job.jobId,
          employer_id: job.employerId,
          applications: job.applications,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(error);

      this.logger.error('Failed to fetch Reed job details', {
        provider: 'Reed',
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
      source: JobSource.REED,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: this.parseRemoteType(rawJob.remote_type),
      salary_min: rawJob.salary_min,
      salary_max: rawJob.salary_max,
      salary_currency: rawJob.salary_currency || 'GBP',
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
      ats_platform: 'Reed',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/search', {
        params: {
          keywords: 'developer',
          resultsToTake: 1,
        },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn('Reed health check failed', {
        provider: 'Reed',
        error: error.message,
      });
      return false;
    }
  }

  private detectRemoteType(job: any): string {
    const location = (job.locationName || '').toLowerCase();
    const title = (job.jobTitle || '').toLowerCase();
    const description = (job.jobDescription || '').toLowerCase();

    if (location.includes('remote') || title.includes('remote') || description.includes('work from home') || description.includes('remote working')) {
      return 'remote';
    }
    if (location.includes('hybrid') || title.includes('hybrid') || description.includes('hybrid working')) {
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
    if (normalized.includes('permanent') || normalized.includes('full')) {
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
    if (normalized.includes('intern') || normalized.includes('apprentice')) {
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
    const title = (job.jobTitle || '').toLowerCase();
    const description = (job.jobDescription || '').toLowerCase();

    if (title.includes('senior') || title.includes('sr.') || title.includes('sr ')) {
      return 'senior';
    }
    if (title.includes('junior') || title.includes('jr.') || title.includes('jr ')) {
      return 'junior';
    }
    if (title.includes('entry') || title.includes('graduate') || description.includes('0-2 years')) {
      return 'entry';
    }
    if (title.includes('lead') || title.includes('principal') || title.includes('architect')) {
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
      if (lower.includes('requirement') || lower.includes('essential') || lower.includes('must have') || lower.includes('you will need')) {
        inRequirements = true;
        continue;
      }
      if (inRequirements && (lower.includes('benefit') || lower.includes('desirable') || lower.includes('nice to have'))) {
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
      if (lower.includes('benefit') || lower.includes('we offer') || lower.includes('perks') || lower.includes('package includes')) {
        inBenefits = true;
        continue;
      }
      if (inBenefits && line.trim().match(/^[-•*\d]/)) {
        benefits.push(line.trim().replace(/^[-•*\d.)\s]+/, ''));
      }
    }

    return benefits.slice(0, 15);
  }

  private extractSkills(description: string): string[] {
    if (!description) {
      return [];
    }

    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net', '.net',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'circleci',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
      'git', 'agile', 'scrum', 'kanban', 'ci/cd', 'rest', 'graphql', 'microservices', 'api',
      'html', 'css', 'sass', 'less', 'webpack', 'babel', 'jest', 'mocha', 'pytest',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
