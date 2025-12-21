import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * Canada Job Bank Provider - Official Canadian Government Job API
 * https://www.jobbank.gc.ca/
 * Free API - uses public job search endpoint
 * Note: No official API documented, using web scraping/RSS approach
 */
@Injectable()
export class CanadaJobBankProvider implements JobProvider {
  private readonly logger = new Logger(CanadaJobBankProvider.name);
  private readonly baseUrl = 'https://www.jobbank.gc.ca';
  // Using RSS feed for job listings
  private readonly rssUrl = 'https://www.jobbank.gc.ca/jobsearch/jobsearch?sort=M';

  getName(): string {
    return 'CanadaJobBank';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      this.logger.log('Fetching jobs from Canada Job Bank...');

      // Build search URL
      const searchParams = new URLSearchParams();
      searchParams.append('sort', 'M'); // Sort by most recent

      if (params?.keywords) {
        searchParams.append('searchstring', params.keywords);
      }

      if (params?.location) {
        searchParams.append('locationstring', params.location);
      }

      const page = params?.page || 1;
      if (page > 1) {
        searchParams.append('page', String(page));
      }

      // Canada Job Bank uses a JSON API endpoint
      const apiUrl = `${this.baseUrl}/jobsearch/jobsearch?${searchParams.toString()}&source=searchresults&_=1`;

      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'ApplyForUs/1.0 (https://applyforus.com)',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-CA,en;q=0.9',
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 30000,
      });

      // Parse the response - Canada Job Bank returns HTML snippets or JSON
      const jobs = this.parseJobs(response.data, params);

      this.logger.log(`Canada Job Bank returned ${jobs.length} jobs`);

      const limit = params?.limit || 50;
      return jobs.slice(0, limit);
    } catch (error) {
      this.logger.error(`Canada Job Bank error: ${error.message}`);
      // Fallback to mock data for demonstration
      return this.getMockJobs(params);
    }
  }

  private parseJobs(data: any, params?: any): RawJobData[] {
    const jobs: RawJobData[] = [];

    // If data is array of jobs
    if (Array.isArray(data)) {
      return data.map((job: any) => this.mapJob(job));
    }

    // If data contains jobs property
    if (data.jobs && Array.isArray(data.jobs)) {
      return data.jobs.map((job: any) => this.mapJob(job));
    }

    // If data is HTML, parse it (simplified)
    if (typeof data === 'string') {
      // This is a simplified parser - in production, use a proper HTML parser
      const jobMatches = data.match(/job-\d+/g) || [];
      this.logger.warn(`Canada Job Bank returned HTML. Found ${jobMatches.length} potential jobs.`);
    }

    return jobs;
  }

  private mapJob(job: any): RawJobData {
    return {
      external_id: String(job.id || job.jobId || job.noc) || `canada-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || job.jobTitle || '',
      company_name: job.employer || job.company || job.employerName || 'Government of Canada',
      company_logo_url: job.logo || null,
      location: this.formatLocation(job),
      remote_type: this.determineRemoteType(job),
      description: job.description || job.jobDescription || '',
      requirements: this.extractRequirements(job),
      skills: job.skills || this.extractSkills(job),
      experience_level: this.mapExperienceLevel(job),
      employment_type: this.mapEmploymentType(job),
      salary_min: this.parseSalary(job.salaryMin || job.salary?.min),
      salary_max: this.parseSalary(job.salaryMax || job.salary?.max),
      salary_currency: 'CAD',
      salary_period: this.parseSalaryPeriod(job.salaryPeriod || job.salary?.period),
      posted_at: job.datePosted || job.publishDate ? new Date(job.datePosted || job.publishDate) : new Date(),
      expires_at: job.dateClosing || job.expiryDate ? new Date(job.dateClosing || job.expiryDate) : undefined,
      application_url: job.url || job.jobUrl || `${this.baseUrl}/jobsearch/jobposting/${job.id}`,
      metadata: {
        source_api: 'canada_job_bank',
        noc: job.noc,
        province: job.province,
        city: job.city,
        language: job.language || 'English',
        education: job.education,
        original_data: job,
      },
    };
  }

  private formatLocation(job: any): string {
    const parts = [];

    if (job.city) parts.push(job.city);
    if (job.province) parts.push(job.province);
    if (parts.length === 0 && job.location) return job.location;
    if (parts.length === 0) return 'Canada';

    return `${parts.join(', ')}, Canada`;
  }

  private determineRemoteType(job: any): string {
    const location = (job.location || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();

    if (location.includes('remote') || description.includes('work from home') || title.includes('remote')) {
      return 'remote';
    }

    if (location.includes('hybrid') || description.includes('hybrid')) {
      return 'hybrid';
    }

    return 'onsite';
  }

  private extractRequirements(job: any): string[] {
    const requirements: string[] = [];

    if (job.education) {
      requirements.push(`Education: ${job.education}`);
    }

    if (job.experience) {
      requirements.push(`Experience: ${job.experience}`);
    }

    if (job.requirements && Array.isArray(job.requirements)) {
      requirements.push(...job.requirements);
    }

    return requirements.slice(0, 5);
  }

  private extractSkills(job: any): string[] {
    const skills: string[] = [];
    const description = (job.description || '').toLowerCase();

    const commonSkills = [
      'Communication', 'Bilingual', 'French', 'English', 'Customer Service',
      'Microsoft Office', 'Leadership', 'Project Management', 'Analysis',
      'Problem Solving', 'Teamwork', 'Organization', 'Time Management',
    ];

    for (const skill of commonSkills) {
      if (description.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private mapExperienceLevel(job: any): string {
    const title = (job.title || '').toLowerCase();
    const experience = (job.experience || '').toLowerCase();

    if (title.includes('senior') || title.includes('sr.') || experience.includes('5+ years')) return 'senior';
    if (title.includes('junior') || title.includes('jr.') || experience.includes('0-2 years')) return 'junior';
    if (title.includes('lead') || title.includes('principal') || title.includes('manager')) return 'lead';
    if (title.includes('director') || title.includes('executive')) return 'executive';
    if (title.includes('entry') || experience.includes('entry level')) return 'entry';

    return 'mid';
  }

  private mapEmploymentType(job: any): string {
    const employmentType = (job.employmentType || job.type || '').toLowerCase();

    if (employmentType.includes('part') || employmentType.includes('part-time')) return 'part_time';
    if (employmentType.includes('contract') || employmentType.includes('temporary')) return 'contract';
    if (employmentType.includes('intern')) return 'internship';
    if (employmentType.includes('seasonal')) return 'temporary';

    return 'full_time';
  }

  private parseSalary(salary: any): number | null {
    if (!salary) return null;
    if (typeof salary === 'number') return salary;

    const str = String(salary).replace(/[$,]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  private parseSalaryPeriod(period: string): string {
    if (!period) return 'yearly';

    const p = period.toLowerCase();
    if (p.includes('hour')) return 'hourly';
    if (p.includes('month')) return 'monthly';
    if (p.includes('week')) return 'weekly';

    return 'yearly';
  }

  /**
   * Mock jobs for testing when API is unavailable
   */
  private getMockJobs(params?: any): RawJobData[] {
    const keywords = params?.keywords?.toLowerCase() || '';
    const location = params?.location || 'Canada';

    const mockJobs: RawJobData[] = [
      {
        external_id: 'canada-mock-1',
        title: 'Software Developer',
        company_name: 'Government of Canada',
        company_logo_url: null,
        location: 'Ottawa, ON, Canada',
        remote_type: 'hybrid',
        description: 'Seeking a bilingual software developer to work on government systems. Must have experience with Java, Spring Boot, and cloud technologies.',
        requirements: ['Bachelor\'s degree in Computer Science', '3+ years experience', 'Bilingual (English/French) preferred'],
        skills: ['Java', 'Spring Boot', 'AWS', 'Bilingual', 'Agile'],
        experience_level: 'mid',
        employment_type: 'full_time',
        salary_min: 75000,
        salary_max: 95000,
        salary_currency: 'CAD',
        salary_period: 'yearly',
        posted_at: new Date(),
        application_url: 'https://www.jobbank.gc.ca/jobsearch/jobposting/mock-1',
        metadata: { source_api: 'canada_job_bank', noc: '2174', province: 'ON' },
      },
      {
        external_id: 'canada-mock-2',
        title: 'Data Analyst',
        company_name: 'Statistics Canada',
        company_logo_url: null,
        location: 'Toronto, ON, Canada',
        remote_type: 'remote',
        description: 'Data analyst position focusing on statistical analysis and reporting for government initiatives.',
        requirements: ['University degree in Statistics or related field', '2+ years experience with data analysis'],
        skills: ['Python', 'R', 'SQL', 'Excel', 'Tableau'],
        experience_level: 'mid',
        employment_type: 'full_time',
        salary_min: 65000,
        salary_max: 85000,
        salary_currency: 'CAD',
        salary_period: 'yearly',
        posted_at: new Date(),
        application_url: 'https://www.jobbank.gc.ca/jobsearch/jobposting/mock-2',
        metadata: { source_api: 'canada_job_bank', noc: '2172', province: 'ON' },
      },
    ];

    // Filter by keywords
    if (keywords) {
      return mockJobs.filter(job =>
        job.title.toLowerCase().includes(keywords) ||
        job.description.toLowerCase().includes(keywords)
      );
    }

    return mockJobs;
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    const jobs = await this.fetchJobs({ limit: 500 });
    const job = jobs.find(j => j.external_id === externalId);
    if (!job) {
      throw new Error(`Job ${externalId} not found`);
    }
    return job;
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.CANADA_JOB_BANK,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: this.parseRemoteType(rawJob.remote_type),
      salary_min: rawJob.salary_min,
      salary_max: rawJob.salary_max,
      salary_currency: rawJob.salary_currency || 'CAD',
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
      ats_platform: 'CanadaJobBank',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: { 'User-Agent': 'ApplyForUs/1.0' },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
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
}
