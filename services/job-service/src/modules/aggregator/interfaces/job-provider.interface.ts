import { Job } from '../../jobs/entities/job.entity';

export interface JobProviderConfig {
  apiKey?: string;
  apiUrl?: string;
  rateLimitPerMinute?: number;
  timeout?: number;
}

export interface RawJobData {
  external_id: string;
  title: string;
  company_name: string;
  company_logo_url?: string;
  location?: string;
  remote_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  experience_level?: string;
  employment_type?: string;
  posted_at?: Date;
  expires_at?: Date;
  application_url?: string;
  metadata?: Record<string, any>;
}

export interface JobProvider {
  /**
   * Provider name
   */
  getName(): string;

  /**
   * Fetch jobs from provider
   */
  fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]>;

  /**
   * Fetch single job details
   */
  fetchJobDetails(externalId: string): Promise<RawJobData>;

  /**
   * Normalize raw job data to Job entity
   */
  normalizeJob(rawJob: RawJobData): Partial<Job>;

  /**
   * Check if provider is healthy and accessible
   */
  healthCheck(): Promise<boolean>;
}
