import { JobSource } from '../entities/job-source.entity';

/**
 * Normalized job data structure returned by all adapters
 */
export interface NormalizedJob {
  externalId: string;
  title: string;
  companyName: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  remoteType?: 'onsite' | 'remote' | 'hybrid';
  description: string;
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  experienceLevel?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  experienceYearsMin?: number;
  experienceYearsMax?: number;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  postedAt?: Date;
  expiresAt?: Date;
  applicationUrl: string;
  atsPlatform?: string;
  atsMetadata?: Record<string, any>;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Pagination information for fetching jobs
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages?: number;
  totalResults?: number;
  hasMore: boolean;
  nextPageToken?: string;
}

/**
 * Result of a job fetch operation
 */
export interface FetchResult {
  jobs: NormalizedJob[];
  pagination: PaginationInfo;
  metadata?: Record<string, any>;
}

/**
 * Options for fetching jobs from a source
 */
export interface FetchOptions {
  page?: number;
  pageSize?: number;
  pageToken?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  keywords?: string[];
  jobType?: string;
  remoteOnly?: boolean;
  incremental?: boolean; // Only fetch new/updated jobs since last sync
  maxResults?: number;
  filters?: Record<string, any>;
}

/**
 * Health check result for a job source adapter
 */
export interface HealthCheckResult {
  isHealthy: boolean;
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Base interface that all job source adapters must implement
 */
export interface IJobAdapter {
  /**
   * Get the name of the adapter
   */
  getName(): string;

  /**
   * Get the provider type
   */
  getProvider(): string;

  /**
   * Initialize the adapter with source configuration
   */
  initialize(source: JobSource): Promise<void>;

  /**
   * Fetch jobs from the source
   */
  fetchJobs(options?: FetchOptions): Promise<FetchResult>;

  /**
   * Validate credentials and connectivity
   */
  validateCredentials(): Promise<boolean>;

  /**
   * Check health of the source
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
  }>;

  /**
   * Transform raw data to normalized format
   */
  normalizeJob(rawJob: any): NormalizedJob;

  /**
   * Handle authentication/token refresh if needed
   */
  refreshAuthentication?(): Promise<void>;

  /**
   * Clean up resources
   */
  cleanup?(): Promise<void>;
}

/**
 * Factory for creating job adapters
 */
export interface IJobAdapterFactory {
  createAdapter(source: JobSource): IJobAdapter;
  supports(provider: string): boolean;
}
