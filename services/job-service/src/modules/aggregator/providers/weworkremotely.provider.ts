import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * We Work Remotely Provider - Uses RSS feed (free, no API key)
 * https://weworkremotely.com/categories/remote-programming-jobs.rss
 */
@Injectable()
export class WeWorkRemotelyProvider implements JobProvider {
  private readonly logger = new Logger(WeWorkRemotelyProvider.name);
  private readonly baseUrl = 'https://weworkremotely.com';
  // We'll use JSON endpoint that some sites provide or parse RSS
  private readonly categories = [
    'remote-programming-jobs',
    'remote-design-jobs',
    'remote-devops-sysadmin-jobs',
    'remote-product-jobs',
    'remote-customer-support-jobs',
    'remote-marketing-jobs',
    'remote-sales-jobs',
  ];

  getName(): string {
    return 'WeWorkRemotely';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    try {
      this.logger.log('Fetching jobs from We Work Remotely (RSS)...');

      const allJobs: RawJobData[] = [];
      const jobsPerCategory = Math.ceil((params?.limit || 50) / this.categories.length);

      // Fetch from each category
      for (const category of this.categories) {
        try {
          const jobs = await this.fetchCategoryJobs(category, jobsPerCategory);
          allJobs.push(...jobs);
        } catch (err) {
          this.logger.warn(`Failed to fetch ${category}: ${err.message}`);
        }
      }

      this.logger.log(`We Work Remotely returned ${allJobs.length} total jobs`);

      // Filter by keywords if provided
      let filteredJobs = allJobs;
      if (params?.keywords) {
        const keywords = params.keywords.toLowerCase().split(/\s+/);
        filteredJobs = allJobs.filter((job) => {
          const text = `${job.title} ${job.company_name} ${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();
          return keywords.some(kw => text.includes(kw));
        });
      }

      // Apply pagination
      const limit = params?.limit || 50;
      const page = params?.page || 1;
      const start = (page - 1) * limit;
      return filteredJobs.slice(start, start + limit);
    } catch (error) {
      this.logger.error(`We Work Remotely error: ${error.message}`);
      return [];
    }
  }

  private async fetchCategoryJobs(category: string, limit: number): Promise<RawJobData[]> {
    // Try JSON API first (some sites have it)
    try {
      const response = await axios.get(`${this.baseUrl}/api/listings.json`, {
        headers: {
          'User-Agent': 'ApplyForUs/1.0 (https://applyforus.com)',
          'Accept': 'application/json',
        },
        timeout: 15000,
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.slice(0, limit).map((job: any) => this.mapJob(job, category));
      }
    } catch {
      // JSON API not available, fall through
    }

    // Fallback: try RSS
    try {
      const rssUrl = `${this.baseUrl}/categories/${category}.rss`;
      const response = await axios.get(rssUrl, {
        headers: {
          'User-Agent': 'ApplyForUs/1.0 (https://applyforus.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        timeout: 15000,
      });

      // Simple RSS parsing
      const items = this.parseRssItems(response.data, limit);
      return items.map((item) => this.mapRssItem(item, category));
    } catch {
      return [];
    }
  }

  private parseRssItems(rssXml: string, limit: number): any[] {
    const items: any[] = [];
    const itemMatches = rssXml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const itemXml of itemMatches.slice(0, limit)) {
      const getTag = (tag: string): string => {
        const match = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')) ||
                      itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return match ? match[1].trim() : '';
      };

      items.push({
        title: getTag('title'),
        link: getTag('link'),
        description: getTag('description'),
        pubDate: getTag('pubDate'),
        category: getTag('category'),
      });
    }

    return items;
  }

  private mapRssItem(item: any, category: string): RawJobData {
    // Parse title to extract company and job title
    // Format is usually: "Company Name: Job Title"
    const titleParts = (item.title || '').split(':');
    const companyName = titleParts.length > 1 ? titleParts[0].trim() : '';
    const jobTitle = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : item.title;

    return {
      external_id: this.generateId(item.link || item.title),
      title: jobTitle,
      company_name: companyName,
      company_logo_url: null,
      location: 'Remote',
      remote_type: 'remote',
      description: this.cleanHtml(item.description || ''),
      application_url: item.link || '',
      posted_at: item.pubDate ? new Date(item.pubDate) : new Date(),
      employment_type: 'full_time',
      experience_level: this.mapExperienceLevel({ title: jobTitle }),
      salary_min: null,
      salary_max: null,
      salary_currency: 'USD',
      salary_period: 'yearly',
      skills: category ? [this.formatCategory(category)] : [],
      metadata: {
        source_api: 'weworkremotely',
        category: category,
        original_data: item,
      },
    };
  }

  private mapJob(job: any, category: string): RawJobData {
    return {
      external_id: String(job.id || job.slug) || `wwr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.title || job.position || '',
      company_name: job.company?.name || job.company_name || '',
      company_logo_url: job.company?.logo || null,
      location: 'Remote',
      remote_type: 'remote',
      description: job.description || '',
      application_url: job.url || job.apply_url || '',
      posted_at: job.published_at ? new Date(job.published_at) : new Date(),
      employment_type: 'full_time',
      experience_level: this.mapExperienceLevel(job),
      salary_min: null,
      salary_max: null,
      salary_currency: 'USD',
      salary_period: 'yearly',
      skills: job.tags || [this.formatCategory(category)],
      metadata: {
        source_api: 'weworkremotely',
        category: category,
        original_data: job,
      },
    };
  }

  private generateId(input: string): string {
    // Simple hash-like ID generation
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `wwr-${Math.abs(hash).toString(36)}`;
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatCategory(category: string): string {
    return category
      .replace(/^remote-/, '')
      .replace(/-jobs$/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    const jobs = await this.fetchJobs({ limit: 200 });
    const job = jobs.find(j => j.external_id === externalId);
    if (!job) {
      throw new Error(`Job ${externalId} not found`);
    }
    return job;
  }

  normalizeJob(rawJob: RawJobData): Partial<Job> {
    return {
      external_id: rawJob.external_id,
      source: JobSource.WEWORKREMOTELY,
      title: rawJob.title,
      company_name: rawJob.company_name,
      company_logo_url: rawJob.company_logo_url,
      location: rawJob.location,
      remote_type: RemoteType.REMOTE,
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
      ats_platform: 'WeWorkRemotely',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/categories/remote-programming-jobs.rss`, {
        headers: { 'User-Agent': 'ApplyForUs/1.0' },
        timeout: 5000,
      });
      return response.status === 200 && response.data.includes('<rss');
    } catch {
      return false;
    }
  }

  private mapExperienceLevel(job: any): string {
    const title = (job.title || job.position || '').toLowerCase();

    if (title.includes('senior') || title.includes('sr.')) return 'senior';
    if (title.includes('junior') || title.includes('jr.')) return 'junior';
    if (title.includes('lead') || title.includes('principal')) return 'lead';
    if (title.includes('director') || title.includes('head of')) return 'executive';
    if (title.includes('intern')) return 'entry';
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
