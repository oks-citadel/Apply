import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SourceType {
  JOB_BOARD = 'job_board',
  ATS = 'ats',
  REMOTE_PLATFORM = 'remote_platform',
  GOVERNMENT = 'government',
  COMPANY_DIRECT = 'company_direct',
}

export enum SourceProvider {
  // Job Boards
  LINKEDIN = 'linkedin',
  INDEED = 'indeed',
  GLASSDOOR = 'glassdoor',
  GOOGLE_JOBS = 'google_jobs',
  ZIPRECRUITER = 'ziprecruiter',

  // ATS Platforms
  GREENHOUSE = 'greenhouse',
  LEVER = 'lever',
  WORKDAY = 'workday',
  BAMBOOHR = 'bamboohr',
  TALEO = 'taleo',
  SMARTRECRUITERS = 'smartrecruiters',
  ASHBYHQ = 'ashbyhq',

  // Remote Platforms
  WELLFOUND = 'wellfound',
  REMOTEOK = 'remoteok',
  WEWORKREMOTELY = 'weworkremotely',
  REMOTE_CO = 'remote_co',

  // Government
  USAJOBS = 'usajobs',
  UK_CIVIL_SERVICE = 'uk_civil_service',

  // Generic
  RSS_FEED = 'rss_feed',
  API = 'api',
  WEB_SCRAPER = 'web_scraper',
}

export enum SourceStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled',
  ERROR = 'error',
}

@Entity('job_sources')
@Index(['provider'])
@Index(['status'])
@Index(['type'])
export class JobSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: SourceProvider,
  })
  @Index()
  provider: SourceProvider;

  @Column({
    type: 'enum',
    enum: SourceType,
  })
  type: SourceType;

  @Column({
    type: 'enum',
    enum: SourceStatus,
    default: SourceStatus.ACTIVE,
  })
  @Index()
  status: SourceStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  // API/Scraping Configuration
  @Column({ type: 'text', nullable: true })
  base_url: string;

  @Column({ type: 'jsonb', nullable: true })
  credentials: {
    api_key?: string;
    api_secret?: string;
    client_id?: string;
    client_secret?: string;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string;
    username?: string;
    password?: string;
    custom?: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  config: {
    // Rate limiting
    requests_per_minute?: number;
    requests_per_hour?: number;
    requests_per_day?: number;

    // Request settings
    timeout_ms?: number;
    retry_attempts?: number;
    retry_delay_ms?: number;

    // Scraping settings
    user_agent?: string;
    headers?: Record<string, string>;
    proxy?: string;

    // Pagination
    max_pages?: number;
    page_size?: number;

    // Filtering
    countries?: string[];
    job_types?: string[];
    keywords?: string[];
    exclude_keywords?: string[];

    // Custom settings per provider
    custom?: Record<string, any>;
  };

  // Rate Limiting Tracking
  @Column({ type: 'int', default: 0 })
  requests_today: number;

  @Column({ type: 'int', default: 0 })
  requests_this_hour: number;

  @Column({ type: 'int', default: 0 })
  requests_this_minute: number;

  @Column({ type: 'timestamp', nullable: true })
  last_request_at: Date;

  // Ingestion Schedule
  @Column({ type: 'int', default: 60 })
  sync_interval_minutes: number; // How often to sync

  @Column({ type: 'timestamp', nullable: true })
  last_sync_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  next_sync_at: Date;

  // Health Monitoring
  @Column({ type: 'int', default: 0 })
  consecutive_failures: number;

  @Column({ type: 'timestamp', nullable: true })
  last_success_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_failure_at: Date;

  @Column({ type: 'text', nullable: true })
  last_error: string;

  // Statistics
  @Column({ type: 'int', default: 0 })
  total_jobs_ingested: number;

  @Column({ type: 'int', default: 0 })
  total_runs: number;

  @Column({ type: 'int', default: 0 })
  successful_runs: number;

  @Column({ type: 'int', default: 0 })
  failed_runs: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  average_run_duration_seconds: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    priority?: number;
    tags?: string[];
    owner?: string;
    contact_email?: string;
    documentation_url?: string;
    notes?: string;
    custom?: Record<string, any>;
  };

  @Column({ type: 'boolean', default: true })
  is_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
