import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Job, JobSource, RemoteType, EmploymentType, ExperienceLevel } from '../../jobs/entities/job.entity';

export interface ATSCompany {
  id: string;
  name: string;
  slug: string;
  platform: ATSPlatform;
  discoveredAt: Date;
  lastFetched?: Date;
  jobCount?: number;
  isActive: boolean;
}

export enum ATSPlatform {
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  WORKABLE = 'workable',
  SMARTRECRUITERS = 'smartrecruiters',
  ASHBY = 'ashby',
  WORKDAY = 'workday',
  ICIMS = 'icims',
  TALEO = 'taleo',
  BAMBOOHR = 'bamboohr',
  BREEZYHR = 'breezyhr',
  RECRUITEE = 'recruitee',
  TEAMTAILOR = 'teamtailor',
  JAZZHR = 'jazzhr',
  JOBVITE = 'jobvite',
  PERSONIO = 'personio',
}

interface ATSJobData {
  id: string;
  title: string;
  location?: string;
  department?: string;
  content?: string;
  applyUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class ATSDiscoveryService {
  private readonly logger = new Logger(ATSDiscoveryService.name);
  private readonly atsEndpoints: Map<ATSPlatform, ATSEndpointConfig>;
  private companyRegistry: Map<string, ATSCompany> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {
    this.atsEndpoints = this.initializeATSEndpoints();
    this.loadCompanyRegistry();
  }

  private initializeATSEndpoints(): Map<ATSPlatform, ATSEndpointConfig> {
    const endpoints = new Map<ATSPlatform, ATSEndpointConfig>();

    endpoints.set(ATSPlatform.GREENHOUSE, {
      platform: ATSPlatform.GREENHOUSE,
      boardsApiPattern: 'https://boards-api.greenhouse.io/v1/boards/{company}/jobs',
      jobApiPattern: 'https://boards-api.greenhouse.io/v1/boards/{company}/jobs/{jobId}',
      parseJobs: this.parseGreenhouseJobs.bind(this),
    });

    endpoints.set(ATSPlatform.LEVER, {
      platform: ATSPlatform.LEVER,
      boardsApiPattern: 'https://api.lever.co/v0/postings/{company}',
      jobApiPattern: 'https://api.lever.co/v0/postings/{company}/{jobId}',
      parseJobs: this.parseLeverJobs.bind(this),
    });

    endpoints.set(ATSPlatform.WORKABLE, {
      platform: ATSPlatform.WORKABLE,
      boardsApiPattern: 'https://apply.workable.com/api/v3/accounts/{company}/jobs',
      parseJobs: this.parseWorkableJobs.bind(this),
    });

    endpoints.set(ATSPlatform.SMARTRECRUITERS, {
      platform: ATSPlatform.SMARTRECRUITERS,
      boardsApiPattern: 'https://api.smartrecruiters.com/v1/companies/{company}/postings',
      parseJobs: this.parseSmartRecruitersJobs.bind(this),
    });

    endpoints.set(ATSPlatform.ASHBY, {
      platform: ATSPlatform.ASHBY,
      boardsApiPattern: 'https://api.ashbyhq.com/posting-api/job-board/{company}',
      parseJobs: this.parseAshbyJobs.bind(this),
    });

    endpoints.set(ATSPlatform.BAMBOOHR, {
      platform: ATSPlatform.BAMBOOHR,
      boardsApiPattern: 'https://{company}.bamboohr.com/jobs/embed2.php',
      parseJobs: this.parseBambooHRJobs.bind(this),
    });

    endpoints.set(ATSPlatform.RECRUITEE, {
      platform: ATSPlatform.RECRUITEE,
      boardsApiPattern: 'https://{company}.recruitee.com/api/offers',
      parseJobs: this.parseRecruiteeJobs.bind(this),
    });

    endpoints.set(ATSPlatform.BREEZYHR, {
      platform: ATSPlatform.BREEZYHR,
      boardsApiPattern: 'https://{company}.breezy.hr/json',
      parseJobs: this.parseBreezyHRJobs.bind(this),
    });

    return endpoints;
  }

  private async loadCompanyRegistry(): Promise<void> {
    // Load known companies from various sources
    const knownCompanies: ATSCompany[] = [
      // Greenhouse companies
      ...this.getGreenhouseCompanies(),
      // Lever companies
      ...this.getLeverCompanies(),
      // Workable companies
      ...this.getWorkableCompanies(),
      // SmartRecruiters companies
      ...this.getSmartRecruitersCompanies(),
      // Ashby companies
      ...this.getAshbyCompanies(),
    ];

    for (const company of knownCompanies) {
      this.companyRegistry.set(`${company.platform}:${company.slug}`, company);
    }

    this.logger.log(`Loaded ${this.companyRegistry.size} companies into ATS registry`);
  }

  private getGreenhouseCompanies(): ATSCompany[] {
    // Top tech companies using Greenhouse
    const companies = [
      'airbnb', 'stripe', 'spotify', 'discord', 'figma', 'notion', 'dropbox',
      'twitch', 'pinterest', 'lyft', 'instacart', 'doordash', 'affirm', 'plaid',
      'coinbase', 'robinhood', 'databricks', 'snowflake', 'datadog', 'hashicorp',
      'cloudflare', 'mongodb', 'elastic', 'twilio', 'okta', 'pagerduty',
      'splunk', 'zendesk', 'hubspot', 'intercom', 'segment', 'amplitude',
      'mixpanel', 'launchdarkly', 'braze', 'contentful', 'algolia', 'auth0',
      'netlify', 'vercel', 'supabase', 'railway', 'render', 'fly', 'planetscale',
      'linear', 'loom', 'miro', 'coda', 'airtable', 'retool', 'zapier',
      'calendly', 'typeform', 'webflow', 'canva', 'grammarly', 'duolingo',
      'coursera', 'udemy', 'masterclass', 'brilliant', 'khan-academy',
      'gusto', 'rippling', 'deel', 'remote', 'oyster', 'papaya-global',
      'lattice', 'culture-amp', 'fifteen-five', 'leapsome', 'workday',
      'asana', 'monday', 'clickup', 'wrike', 'smartsheet', 'basecamp',
      'front', 'superhuman', 'nylas', 'sendgrid', 'mailchimp', 'klaviyo',
      'attentive', 'postscript', 'yotpo', 'gorgias', 'zendesk', 'freshworks',
      'anthropic', 'openai', 'cohere', 'stability-ai', 'midjourney', 'huggingface',
      'scale', 'labelbox', 'snorkel', 'weights-and-biases', 'neptune-ai',
      'anyscale', 'modal', 'replicate', 'together-ai', 'perplexity',
      'tesla', 'rivian', 'lucid-motors', 'waymo', 'cruise', 'aurora',
      'nuro', 'zoox', 'motional', 'argo-ai', 'aptiv', 'mobileye',
    ];

    return companies.map((slug) => ({
      id: `greenhouse-${slug}`,
      name: this.slugToName(slug),
      slug,
      platform: ATSPlatform.GREENHOUSE,
      discoveredAt: new Date(),
      isActive: true,
    }));
  }

  private getLeverCompanies(): ATSCompany[] {
    const companies = [
      'netflix', 'uber', 'palantir', 'databricks', 'anduril', 'scale',
      'ramp', 'brex', 'mercury', 'pipe', 'capchase', 'clearco',
      'faire', 'goat', 'poshmark', 'depop', 'thredup', 'realreal',
      'warby-parker', 'allbirds', 'away', 'glossier', 'outdoor-voices',
      'peloton', 'mirror', 'tonal', 'whoop', 'oura', 'levels',
      'ro', 'hims', 'nurx', 'alto', 'capsule', 'truepill',
      'cerebral', 'talkspace', 'ginger', 'lyra-health', 'spring-health',
      'headspace', 'calm', 'noom', 'virta', 'omada', 'livongo',
      'olive-ai', 'tempus', 'flatiron-health', 'color', 'grail',
      'devoted-health', 'clover', 'oscar', 'collective-health', 'justworks',
      'pilot', 'bench', 'wave', 'freshbooks', 'xero', 'sage-intacct',
      'bill', 'divvy', 'airbase', 'ramp', 'brex', 'mercury',
      'modern-treasury', 'column', 'increase', 'treasury-prime', 'unit',
      'marqeta', 'lithic', 'highnote', 'galileo', 'synapse', 'bond',
      'alloy', 'persona', 'socure', 'jumio', 'onfido', 'veriff',
      'sardine', 'feedzai', 'forter', 'signifyd', 'riskified', 'sift',
    ];

    return companies.map((slug) => ({
      id: `lever-${slug}`,
      name: this.slugToName(slug),
      slug,
      platform: ATSPlatform.LEVER,
      discoveredAt: new Date(),
      isActive: true,
    }));
  }

  private getWorkableCompanies(): ATSCompany[] {
    const companies = [
      'taxfix', 'n26', 'klarna', 'revolut', 'monzo', 'starling',
      'wise', 'checkout', 'adyen', 'mollie', 'payoneer', 'rapyd',
      'sumup', 'zettle', 'square', 'toast', 'lightspeed', 'shopify',
      'bigcommerce', 'wix', 'squarespace', 'godaddy', 'ionos', 'hostinger',
      'bluehost', 'siteground', 'dreamhost', 'namecheap', 'cloudways',
      'wpengine', 'kinsta', 'flywheel', 'pantheon', 'platform-sh',
      'heroku', 'digitalocean', 'vultr', 'linode', 'ovhcloud',
      'hetzner', 'contabo', 'scaleway', 'exoscale', 'upcloud',
      'backblaze', 'wasabi', 'storj', 'filebase', 'cloudflare-r2',
    ];

    return companies.map((slug) => ({
      id: `workable-${slug}`,
      name: this.slugToName(slug),
      slug,
      platform: ATSPlatform.WORKABLE,
      discoveredAt: new Date(),
      isActive: true,
    }));
  }

  private getSmartRecruitersCompanies(): ATSCompany[] {
    const companies = [
      'visa', 'equinix', 'bosch', 'siemens', 'philips', 'ing',
      'abn-amro', 'rabobank', 'bunq', 'adidas', 'puma', 'nike',
      'ikea', 'h-and-m', 'zara', 'uniqlo', 'lego', 'hasbro',
      'mattel', 'disney', 'warner-bros', 'paramount', 'sony-pictures',
      'universal', 'lionsgate', 'mgm', 'a24', 'neon', 'focus-features',
      'spotify', 'deezer', 'tidal', 'soundcloud', 'bandcamp', 'audiomack',
    ];

    return companies.map((slug) => ({
      id: `smartrecruiters-${slug}`,
      name: this.slugToName(slug),
      slug,
      platform: ATSPlatform.SMARTRECRUITERS,
      discoveredAt: new Date(),
      isActive: true,
    }));
  }

  private getAshbyCompanies(): ATSCompany[] {
    const companies = [
      'notion', 'ramp', 'linear', 'vercel', 'supabase', 'railway',
      'planetscale', 'neon', 'turso', 'upstash', 'fauna', 'cockroach',
      'timescale', 'questdb', 'influxdata', 'clickhouse', 'duckdb',
      'motherduck', 'firebolt', 'starburst', 'dbt-labs', 'airbyte',
      'fivetran', 'census', 'hightouch', 'rudderstack', 'segment',
      'heap', 'amplitude', 'mixpanel', 'posthog', 'june-so',
    ];

    return companies.map((slug) => ({
      id: `ashby-${slug}`,
      name: this.slugToName(slug),
      slug,
      platform: ATSPlatform.ASHBY,
      discoveredAt: new Date(),
      isActive: true,
    }));
  }

  private slugToName(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Fetch jobs from a specific ATS company
   */
  async fetchJobsFromCompany(company: ATSCompany): Promise<ATSJobData[]> {
    const config = this.atsEndpoints.get(company.platform);
    if (!config) {
      throw new Error(`No configuration for platform: ${company.platform}`);
    }

    const url = config.boardsApiPattern.replace('{company}', company.slug);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ApplyForUs-JobAggregator/1.0',
          },
        }),
      );

      return config.parseJobs(response.data, company);
    } catch (error) {
      this.logger.warn(`Failed to fetch jobs from ${company.platform}:${company.slug}: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch jobs from all registered companies for a platform
   */
  async fetchJobsFromPlatform(platform: ATSPlatform): Promise<{ company: string; jobs: ATSJobData[] }[]> {
    const companies = Array.from(this.companyRegistry.values()).filter(
      (c) => c.platform === platform && c.isActive,
    );

    const results: { company: string; jobs: ATSJobData[] }[] = [];

    for (const company of companies) {
      try {
        const jobs = await this.fetchJobsFromCompany(company);
        results.push({ company: company.slug, jobs });

        // Update company metadata
        company.lastFetched = new Date();
        company.jobCount = jobs.length;

        // Rate limiting between requests
        await this.delay(500);
      } catch (error) {
        this.logger.warn(`Error fetching from ${company.slug}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Discover and fetch all jobs from all ATS platforms
   */
  async discoverAllJobs(): Promise<{
    platform: ATSPlatform;
    totalJobs: number;
    companies: number;
  }[]> {
    const results: { platform: ATSPlatform; totalJobs: number; companies: number }[] = [];

    for (const platform of Object.values(ATSPlatform)) {
      try {
        const platformResults = await this.fetchJobsFromPlatform(platform as ATSPlatform);
        const totalJobs = platformResults.reduce((sum, r) => sum + r.jobs.length, 0);

        results.push({
          platform: platform as ATSPlatform,
          totalJobs,
          companies: platformResults.length,
        });

        this.logger.log(`${platform}: ${totalJobs} jobs from ${platformResults.length} companies`);
      } catch (error) {
        this.logger.error(`Platform ${platform} discovery failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Save discovered jobs to database
   */
  async saveJobsToDatabase(jobs: ATSJobData[], company: ATSCompany): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const job of jobs) {
      try {
        const existingJob = await this.jobRepository.findOne({
          where: {
            external_id: job.id,
            source: this.platformToJobSource(company.platform),
          },
        });

        const jobData = this.normalizeATSJob(job, company);

        if (existingJob) {
          Object.assign(existingJob, jobData, { updated_at: new Date() });
          await this.jobRepository.save(existingJob);
          updated++;
        } else {
          const newJob = this.jobRepository.create(jobData);
          await this.jobRepository.save(newJob);
          inserted++;
        }
      } catch (error) {
        this.logger.warn(`Failed to save job ${job.id}: ${error.message}`);
      }
    }

    return { inserted, updated };
  }

  private platformToJobSource(platform: ATSPlatform): JobSource {
    // Map ATS platforms to generic sources for now
    // In production, you might want to extend the JobSource enum
    return JobSource.DIRECT;
  }

  private normalizeATSJob(job: ATSJobData, company: ATSCompany): Partial<Job> {
    const location = this.parseLocation(job.location);

    return {
      external_id: job.id,
      source: this.platformToJobSource(company.platform),
      title: job.title,
      company_name: company.name,
      location: job.location || 'Remote',
      city: location.city,
      state: location.state,
      country: location.country,
      remote_type: this.inferRemoteType(job.location, job.title),
      description: job.content || '',
      application_url: job.applyUrl,
      ats_platform: company.platform,
      ats_metadata: job.metadata,
      posted_at: job.createdAt || new Date(),
      is_active: true,
      employment_type: EmploymentType.FULL_TIME,
    };
  }

  private parseLocation(location?: string): { city?: string; state?: string; country?: string } {
    if (!location) return {};

    // Simple location parsing - in production, use a proper geocoding service
    const parts = location.split(',').map((p) => p.trim());

    if (parts.length >= 3) {
      return { city: parts[0], state: parts[1], country: parts[2] };
    } else if (parts.length === 2) {
      return { city: parts[0], country: parts[1] };
    } else {
      return { city: parts[0] };
    }
  }

  private inferRemoteType(location?: string, title?: string): RemoteType {
    const text = `${location || ''} ${title || ''}`.toLowerCase();

    if (text.includes('remote') || text.includes('anywhere') || text.includes('distributed')) {
      return RemoteType.REMOTE;
    }
    if (text.includes('hybrid')) {
      return RemoteType.HYBRID;
    }
    return RemoteType.ONSITE;
  }

  // Platform-specific job parsers
  private parseGreenhouseJobs(data: any, company: ATSCompany): ATSJobData[] {
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((job: any) => ({
      id: String(job.id),
      title: job.title,
      location: job.location?.name,
      department: job.departments?.[0]?.name,
      content: job.content,
      applyUrl: job.absolute_url,
      createdAt: job.updated_at ? new Date(job.updated_at) : undefined,
      metadata: {
        departments: job.departments,
        offices: job.offices,
        education: job.education,
      },
    }));
  }

  private parseLeverJobs(data: any, company: ATSCompany): ATSJobData[] {
    if (!Array.isArray(data)) return [];

    return data.map((job: any) => ({
      id: job.id,
      title: job.text,
      location: job.categories?.location,
      department: job.categories?.team,
      content: job.descriptionPlain || job.description,
      applyUrl: job.applyUrl || job.hostedUrl,
      createdAt: job.createdAt ? new Date(job.createdAt) : undefined,
      metadata: {
        categories: job.categories,
        commitment: job.categories?.commitment,
      },
    }));
  }

  private parseWorkableJobs(data: any, company: ATSCompany): ATSJobData[] {
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((job: any) => ({
      id: job.shortcode,
      title: job.title,
      location: job.location?.city
        ? `${job.location.city}, ${job.location.country}`
        : job.location?.country,
      department: job.department,
      content: job.description,
      applyUrl: job.url,
      createdAt: job.published_on ? new Date(job.published_on) : undefined,
      metadata: {
        employment_type: job.employment_type,
        experience: job.experience,
        remote: job.remote,
      },
    }));
  }

  private parseSmartRecruitersJobs(data: any, company: ATSCompany): ATSJobData[] {
    if (!data.content || !Array.isArray(data.content)) return [];

    return data.content.map((job: any) => ({
      id: job.id,
      title: job.name,
      location: job.location?.city
        ? `${job.location.city}, ${job.location.country}`
        : undefined,
      department: job.department?.label,
      applyUrl: job.applyUrl,
      createdAt: job.releasedDate ? new Date(job.releasedDate) : undefined,
      metadata: {
        experienceLevel: job.experienceLevel,
        typeOfEmployment: job.typeOfEmployment,
        industry: job.industry,
      },
    }));
  }

  private parseAshbyJobs(data: any, company: ATSCompany): ATSJobData[] {
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      department: job.department,
      content: job.descriptionPlain || job.descriptionHtml,
      applyUrl: job.applyUrl,
      createdAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
      metadata: {
        employmentType: job.employmentType,
        isRemote: job.isRemote,
        team: job.team,
      },
    }));
  }

  private parseBambooHRJobs(data: any, company: ATSCompany): ATSJobData[] {
    // BambooHR returns HTML, needs parsing
    // This is a simplified version - in production, use cheerio
    return [];
  }

  private parseRecruiteeJobs(data: any, company: ATSCompany): ATSJobData[] {
    if (!data.offers || !Array.isArray(data.offers)) return [];

    return data.offers.map((job: any) => ({
      id: String(job.id),
      title: job.title,
      location: job.location,
      department: job.department,
      content: job.description,
      applyUrl: job.careers_url,
      createdAt: job.created_at ? new Date(job.created_at) : undefined,
      metadata: {
        employment_type: job.employment_type_code,
        remote: job.remote,
      },
    }));
  }

  private parseBreezyHRJobs(data: any, company: ATSCompany): ATSJobData[] {
    if (!Array.isArray(data)) return [];

    return data.map((job: any) => ({
      id: job.id,
      title: job.name,
      location: job.location?.name,
      department: job.department,
      content: job.description,
      applyUrl: `https://${company.slug}.breezy.hr/p/${job.id}`,
      createdAt: job.published_date ? new Date(job.published_date) : undefined,
      metadata: {
        type: job.type,
      },
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalCompanies: number;
    byPlatform: Record<ATSPlatform, number>;
    activeCompanies: number;
  } {
    const stats = {
      totalCompanies: this.companyRegistry.size,
      byPlatform: {} as Record<ATSPlatform, number>,
      activeCompanies: 0,
    };

    for (const company of this.companyRegistry.values()) {
      stats.byPlatform[company.platform] = (stats.byPlatform[company.platform] || 0) + 1;
      if (company.isActive) stats.activeCompanies++;
    }

    return stats;
  }
}

interface ATSEndpointConfig {
  platform: ATSPlatform;
  boardsApiPattern: string;
  jobApiPattern?: string;
  parseJobs: (data: any, company: ATSCompany) => ATSJobData[];
}
