import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../../jobs/entities/job.entity';

import type { Job } from '../../../jobs/entities/job.entity';
import type { JobProvider, RawJobData, JobProviderConfig } from '../../interfaces/job-provider.interface';
import type { AxiosInstance } from 'axios';

interface SmartRecruitersJob {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    identifier: string;
  };
  department?: {
    id: string;
    label: string;
  };
  location?: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
  };
  typeOfEmployment?: {
    id: string;
    label: string;
  };
  experienceLevel?: {
    id: string;
    label: string;
  };
  industry?: {
    id: string;
    label: string;
  };
  function?: {
    id: string;
    label: string;
  };
  refNumber?: string;
  postingDate?: string;
  releasedDate?: string;
  updatedDate?: string;
  jobAd?: {
    sections: {
      title: string;
      text: string;
    }[];
  };
  creator?: {
    name: string;
  };
  customFields?: Array<{
    fieldId: string;
    fieldLabel: string;
    valueId?: string;
    valueLabel?: string;
  }>;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface SmartRecruitersResponse {
  content: SmartRecruitersJob[];
  totalFound: number;
  offset: number;
  limit: number;
}

/**
 * SmartRecruiters ATS Adapter
 *
 * Fetches public job postings from SmartRecruiters.
 * Endpoint: https://api.smartrecruiters.com/v1/companies/{companyId}/postings
 *
 * Features:
 * - No authentication required for public postings
 * - Detailed job information with structured sections
 * - Rich metadata including experience level, employment type
 * - Salary information when available
 * - Supports pagination and filtering
 */
@Injectable()
export class SmartRecruitersAdapter implements JobProvider {
  private readonly logger = new Logger(SmartRecruitersAdapter.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: JobProviderConfig;

  // Known companies using SmartRecruiters with their company IDs
  private readonly companyBoards: Array<{ id: string; name: string }> = [
    { id: 'BOSCH', name: 'Bosch' },
    { id: 'Visa', name: 'Visa' },
    { id: 'LinkedIn', name: 'LinkedIn' },
    { id: 'Skechers', name: 'Skechers' },
    { id: 'IKEA', name: 'IKEA' },
    { id: 'McDonalds', name: "McDonald's" },
    { id: 'Loreal', name: "L'Oréal" },
    { id: 'Adidas', name: 'Adidas' },
    { id: 'Puma', name: 'Puma' },
    { id: 'UnderArmour', name: 'Under Armour' },
    { id: 'NewBalance', name: 'New Balance' },
    { id: 'Converse', name: 'Converse' },
    { id: 'VF', name: 'VF Corporation' },
    { id: 'Hanesbrands', name: 'Hanesbrands' },
    { id: 'PVH', name: 'PVH Corp' },
    { id: 'RalphLauren', name: 'Ralph Lauren' },
    { id: 'Burberry', name: 'Burberry' },
    { id: 'HugoBoss', name: 'Hugo Boss' },
    { id: 'TommyHilfiger', name: 'Tommy Hilfiger' },
    { id: 'CalvinKlein', name: 'Calvin Klein' },
    { id: 'MichaelKors', name: 'Michael Kors' },
    { id: 'Coach', name: 'Coach' },
    { id: 'KateSpade', name: 'Kate Spade' },
    { id: 'Guess', name: 'Guess' },
    { id: 'Levis', name: "Levi's" },
    { id: 'Wrangler', name: 'Wrangler' },
    { id: 'Lee', name: 'Lee' },
    { id: 'Diesel', name: 'Diesel' },
    { id: 'GStarRaw', name: 'G-Star Raw' },
    { id: 'TrueReligion', name: 'True Religion' },
    { id: 'SevenForAllMankind', name: 'Seven For All Mankind' },
    { id: 'Agolde', name: 'Agolde' },
    { id: 'MotherDenim', name: 'Mother Denim' },
    { id: 'Paige', name: 'Paige' },
    { id: 'JBrand', name: 'J Brand' },
    { id: 'CurrentElliott', name: 'Current/Elliott' },
    { id: 'Rag', name: 'Rag & Bone' },
    { id: 'APC', name: 'A.P.C.' },
    { id: 'Acne', name: 'Acne Studios' },
    { id: 'Norse', name: 'Norse Projects' },
  ];

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiUrl: 'https://api.smartrecruiters.com/v1',
      timeout: this.configService.get('SMARTRECRUITERS_TIMEOUT', 30000),
      rateLimitPerMinute: this.configService.get('SMARTRECRUITERS_RATE_LIMIT', 100),
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
    return 'SmartRecruiters';
  }

  /**
   * Fetch jobs from all known SmartRecruiters company boards
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
        boardsToFetch.map(board => this.fetchJobsFromBoard(board.id, params)),
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
      this.logger.error(`SmartRecruiters fetchJobs error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch jobs from a specific SmartRecruiters company
   */
  async fetchJobsFromBoard(companyId: string, params?: {
    keywords?: string;
    location?: string;
    limit?: number;
  }): Promise<RawJobData[]> {
    try {
      const queryParams: any = {
        limit: params?.limit || 100,
        offset: 0,
      };

      if (params?.location) {
        queryParams.location = params.location;
      }

      const response = await this.httpClient.get(`/companies/${companyId}/postings`, {
        params: queryParams,
      });

      const data = response.data as SmartRecruitersResponse;

      if (!data?.content || !Array.isArray(data.content)) {
        return [];
      }

      const jobs = data.content;
      const companyName = this.companyBoards.find(b => b.id === companyId)?.name || companyId;

      return jobs.map(job => this.mapSmartRecruitersJob(job, companyId, companyName));
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        this.logger.debug(`Company not found or not accessible: ${companyId}`);
      } else {
        this.logger.warn(`Error fetching from SmartRecruiters company ${companyId}: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Fetch detailed information for a specific job
   */
  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    try {
      // External ID format: smartrecruiters-{companyId}-{jobId}
      const [, companyId, jobId] = externalId.split('-', 3);

      const response = await this.httpClient.get(`/companies/${companyId}/postings/${jobId}`);
      const job = response.data as SmartRecruitersJob;

      const companyName = this.companyBoards.find(b => b.id === companyId)?.name || job.company?.name || companyId;

      return this.mapSmartRecruitersJob(job, companyId, companyName);
    } catch (error) {
      this.logger.error(`Failed to fetch SmartRecruiters job details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map SmartRecruiters job to RawJobData
   */
  private mapSmartRecruitersJob(job: SmartRecruitersJob, companyId: string, companyName: string): RawJobData {
    // Build location string
    const locationParts = [];
    if (job.location?.city) locationParts.push(job.location.city);
    if (job.location?.region) locationParts.push(job.location.region);
    if (job.location?.country) locationParts.push(job.location.country);
    const location = locationParts.join(', ');

    // Build description from job ad sections
    let description = '';
    if (job.jobAd?.sections) {
      description = job.jobAd.sections
        .map(section => `${section.title}\n\n${section.text}`)
        .join('\n\n---\n\n');
    }

    return {
      external_id: `smartrecruiters-${companyId}-${job.id}`,
      title: job.title,
      company_name: companyName,
      location,
      remote_type: this.detectRemoteType(job.location?.remote, location, job.title),
      description,
      requirements: this.extractRequirements(description),
      benefits: this.extractBenefits(description),
      skills: this.extractSkills(description),
      experience_level: this.mapExperienceLevel(job.experienceLevel?.label || '', job.title),
      employment_type: this.mapEmploymentType(job.typeOfEmployment?.label || ''),
      posted_at: job.releasedDate ? new Date(job.releasedDate) : (job.postingDate ? new Date(job.postingDate) : new Date()),
      application_url: `https://jobs.smartrecruiters.com/${companyId}/${job.id}`,
      salary_min: job.salaryRange?.min,
      salary_max: job.salaryRange?.max,
      salary_currency: job.salaryRange?.currency || 'USD',
      salary_period: 'yearly',
      metadata: {
        smartrecruiters_company_id: companyId,
        smartrecruiters_job_id: job.id,
        ref_number: job.refNumber,
        department: job.department,
        industry: job.industry,
        function: job.function,
        creator: job.creator,
        custom_fields: job.customFields,
        updated_date: job.updatedDate,
      },
    };
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.SMARTRECRUITERS,
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
      ats_platform: 'SmartRecruiters',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try a known working company
      const response = await this.httpClient.get('/companies/BOSCH/postings', {
        params: { limit: 1 },
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
  async discoverNewBoards(potentialCompanyIds: string[]): Promise<Array<{ id: string; name: string }>> {
    const discoveredBoards: Array<{ id: string; name: string }> = [];

    const results = await Promise.allSettled(
      potentialCompanyIds.map(async companyId => {
        try {
          const response = await this.httpClient.get(`/companies/${companyId}/postings`, {
            params: { limit: 1 },
            timeout: 5000,
          });
          if (response.data?.content && response.data.content.length > 0) {
            const companyName = response.data.content[0]?.company?.name || companyId;
            return { id: companyId, name: companyName };
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

  getCompanyBoards(): Array<{ id: string; name: string }> {
    return [...this.companyBoards];
  }

  addCompanyBoard(id: string, name?: string): void {
    if (!this.companyBoards.find(b => b.id === id)) {
      this.companyBoards.push({
        id,
        name: name || id,
      });
      this.logger.log(`Added new SmartRecruiters board: ${id}`);
    }
  }

  // Helper methods

  private detectRemoteType(isRemote: boolean | undefined, location: string, title: string): string {
    if (isRemote === true) return 'remote';

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
    if (combined.includes('experienced') || combined.includes('professional')) {
      return 'mid';
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
    if (normalized.includes('permanent')) return 'full_time';
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

    const reqPatterns = [
      /(?:requirements?|qualifications?|what (?:you'll|we're) (?:need|bring|looking for)|you have):?\s*([^]*?)(?=\n\n---|benefits?|what we offer|about|$)/i,
    ];

    for (const pattern of reqPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*') || /^\d+\./.test(trimmed))) {
            const req = trimmed.replace(/^[-•*]\s*|\d+\.\s*/, '').trim();
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
      /(?:benefits?|what we offer|perks|you'll get):?\s*([^]*?)(?=\n\n---|requirements?|about|$)/i,
    ];

    for (const pattern of benefitPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*') || /^\d+\./.test(trimmed))) {
            const benefit = trimmed.replace(/^[-•*]\s*|\d+\.\s*/, '').trim();
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
      'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'graphql', 'rest', 'microservices', 'ci/cd', 'devops', 'agile', 'scrum',
      'machine learning', 'ai', 'data science', 'analytics',
    ];

    const descLower = description.toLowerCase();
    return commonSkills.filter(skill => descLower.includes(skill));
  }
}
