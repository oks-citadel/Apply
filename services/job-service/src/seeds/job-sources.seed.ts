import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JobSource,
  SourceProvider,
  SourceType,
  SourceStatus,
} from '../modules/ingestion/entities/job-source.entity';

@Injectable()
export class JobSourcesSeeder {
  private readonly logger = new Logger(JobSourcesSeeder.name);

  constructor(
    @InjectRepository(JobSource)
    private readonly jobSourceRepository: Repository<JobSource>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting job sources seeding...');

    const sources = [
      // Indeed - Job Board
      {
        name: 'Indeed Jobs',
        provider: SourceProvider.INDEED,
        type: SourceType.JOB_BOARD,
        description: 'Indeed job board integration',
        base_url: 'https://api.indeed.com/ads/apisearch',
        credentials: {
          // Mock API key - replace with real key for production
          api_key: process.env.INDEED_API_KEY || 'mock_indeed_api_key',
        },
        config: {
          requests_per_minute: 60,
          requests_per_hour: 1000,
          timeout_ms: 30000,
          retry_attempts: 3,
          retry_delay_ms: 1000,
          page_size: 25,
          max_pages: 10,
          countries: ['us', 'ca', 'gb'],
          job_types: ['fulltime', 'parttime', 'contract'],
          keywords: ['software', 'engineer', 'developer'],
        },
        sync_interval_minutes: 60,
        status: SourceStatus.ACTIVE,
        is_enabled: true,
        metadata: {
          priority: 1,
          tags: ['job-board', 'popular'],
          notes: 'Primary job board source',
        },
      },

      // LinkedIn - Job Board
      {
        name: 'LinkedIn Jobs',
        provider: SourceProvider.LINKEDIN,
        type: SourceType.JOB_BOARD,
        description: 'LinkedIn jobs API integration',
        base_url: 'https://api.linkedin.com/v2',
        credentials: {
          // Mock credentials - replace with real OAuth tokens for production
          client_id: process.env.LINKEDIN_CLIENT_ID || 'mock_linkedin_client_id',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || 'mock_linkedin_secret',
          access_token: process.env.LINKEDIN_ACCESS_TOKEN || 'mock_access_token',
        },
        config: {
          requests_per_minute: 30,
          requests_per_hour: 500,
          timeout_ms: 30000,
          retry_attempts: 3,
          retry_delay_ms: 2000,
          page_size: 25,
          max_pages: 10,
          countries: ['us', 'ca', 'gb', 'de'],
          keywords: ['software engineer', 'data scientist', 'product manager'],
        },
        sync_interval_minutes: 120,
        status: SourceStatus.ACTIVE,
        is_enabled: true,
        metadata: {
          priority: 2,
          tags: ['job-board', 'professional'],
          notes: 'Professional networking platform',
        },
      },

      // Glassdoor - Job Board
      {
        name: 'Glassdoor Jobs',
        provider: SourceProvider.GLASSDOOR,
        type: SourceType.JOB_BOARD,
        description: 'Glassdoor job board with company reviews',
        base_url: 'https://api.glassdoor.com/api/api.htm',
        credentials: {
          // Mock credentials
          api_key: process.env.GLASSDOOR_API_KEY || 'mock_glassdoor_api_key',
          client_id: process.env.GLASSDOOR_CLIENT_ID || 'mock_glassdoor_client_id',
        },
        config: {
          requests_per_minute: 20,
          requests_per_hour: 200,
          timeout_ms: 30000,
          retry_attempts: 3,
          retry_delay_ms: 1500,
          page_size: 20,
          max_pages: 5,
          countries: ['us'],
          keywords: ['tech', 'engineering'],
        },
        sync_interval_minutes: 180,
        status: SourceStatus.ACTIVE,
        is_enabled: true,
        metadata: {
          priority: 3,
          tags: ['job-board', 'reviews'],
          notes: 'Includes company reviews and ratings',
        },
      },

      // Greenhouse - ATS Platform
      {
        name: 'Greenhouse ATS',
        provider: SourceProvider.GREENHOUSE,
        type: SourceType.ATS,
        description: 'Greenhouse applicant tracking system integration',
        base_url: 'https://api.greenhouse.io/v1',
        credentials: {
          // Mock board token - this should be company-specific
          api_key: process.env.GREENHOUSE_BOARD_TOKEN || 'mock_greenhouse_board_token',
        },
        config: {
          requests_per_minute: 50,
          timeout_ms: 30000,
          retry_attempts: 3,
          retry_delay_ms: 1000,
          page_size: 100,
          custom: {
            company_name: 'Test Company',
          },
        },
        sync_interval_minutes: 240,
        status: SourceStatus.ACTIVE,
        is_enabled: true,
        metadata: {
          priority: 4,
          tags: ['ats', 'enterprise'],
          notes: 'Company ATS integration',
        },
      },

      // Google Jobs - Job Board
      {
        name: 'Google for Jobs',
        provider: SourceProvider.GOOGLE_JOBS,
        type: SourceType.JOB_BOARD,
        description: 'Google Cloud Talent Solution API',
        base_url: 'https://jobs.googleapis.com/v4/projects',
        credentials: {
          client_id: process.env.GOOGLE_PROJECT_ID || 'mock_google_project_id',
          access_token: process.env.GOOGLE_ACCESS_TOKEN || 'mock_google_token',
        },
        config: {
          requests_per_minute: 100,
          timeout_ms: 30000,
          retry_attempts: 3,
          page_size: 100,
          custom: {
            tenant: 'default',
          },
        },
        sync_interval_minutes: 360,
        status: SourceStatus.PAUSED,
        is_enabled: false,
        metadata: {
          priority: 5,
          tags: ['job-board', 'aggregator'],
          notes: 'Google jobs aggregator - requires Cloud Talent API setup',
        },
      },

      // ZipRecruiter - Job Board
      {
        name: 'ZipRecruiter',
        provider: SourceProvider.ZIPRECRUITER,
        type: SourceType.JOB_BOARD,
        description: 'ZipRecruiter job board integration',
        base_url: 'https://api.ziprecruiter.com/jobs/v1',
        credentials: {
          api_key: process.env.ZIPRECRUITER_API_KEY || 'mock_ziprecruiter_api_key',
        },
        config: {
          requests_per_minute: 30,
          timeout_ms: 30000,
          retry_attempts: 3,
          page_size: 20,
        },
        sync_interval_minutes: 120,
        status: SourceStatus.PAUSED,
        is_enabled: false,
        metadata: {
          priority: 6,
          tags: ['job-board'],
          notes: 'ZipRecruiter job aggregator',
        },
      },

      // RemoteOK - Remote Platform
      {
        name: 'RemoteOK',
        provider: SourceProvider.REMOTEOK,
        type: SourceType.REMOTE_PLATFORM,
        description: 'RemoteOK remote jobs platform',
        base_url: 'https://remoteok.com/api',
        credentials: {},
        config: {
          requests_per_minute: 10,
          timeout_ms: 30000,
          retry_attempts: 3,
          page_size: 50,
        },
        sync_interval_minutes: 360,
        status: SourceStatus.ACTIVE,
        is_enabled: true,
        metadata: {
          priority: 7,
          tags: ['remote', 'tech'],
          notes: 'Remote-only job listings',
        },
      },

      // Lever - ATS Platform
      {
        name: 'Lever ATS',
        provider: SourceProvider.LEVER,
        type: SourceType.ATS,
        description: 'Lever applicant tracking system',
        base_url: 'https://api.lever.co/v0/postings',
        credentials: {},
        config: {
          requests_per_minute: 60,
          timeout_ms: 30000,
          retry_attempts: 3,
          page_size: 50,
          custom: {
            company_subdomain: 'example',
            company_name: 'Example Company',
          },
        },
        sync_interval_minutes: 240,
        status: SourceStatus.PAUSED,
        is_enabled: false,
        metadata: {
          priority: 8,
          tags: ['ats'],
          notes: 'Requires company subdomain configuration',
        },
      },
    ];

    for (const sourceData of sources) {
      try {
        // Check if source already exists
        const existing = await this.jobSourceRepository.findOne({
          where: { provider: sourceData.provider },
        });

        if (existing) {
          this.logger.log(`Source already exists: ${sourceData.name}`);
          continue;
        }

        const source = this.jobSourceRepository.create(sourceData);
        await this.jobSourceRepository.save(source);
        this.logger.log(`Created source: ${sourceData.name}`);
      } catch (error: any) {
        this.logger.error(
          `Failed to create source ${sourceData.name}: ${error?.message || error}`,
        );
      }
    }

    this.logger.log('Job sources seeding completed');
  }
}
