import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { JobSource, RemoteType, ExperienceLevel, EmploymentType } from '../../jobs/entities/job.entity';

import type { Job } from '../../jobs/entities/job.entity';
import type { JobProvider, RawJobData } from '../interfaces/job-provider.interface';

/**
 * USAJobs Provider - Official U.S. Government Job API
 * https://developer.usajobs.gov/
 * Requires free API key from developer.usajobs.gov
 */
@Injectable()
export class USAJobsProvider implements JobProvider {
  private readonly logger = new Logger(USAJobsProvider.name);
  private readonly apiUrl = 'https://data.usajobs.gov/api/search';
  private readonly apiKey = process.env.USAJOBS_API_KEY;
  private readonly userAgent = process.env.USAJOBS_USER_AGENT || 'job-aggregator@applyforus.com';

  getName(): string {
    return 'USAJobs';
  }

  async fetchJobs(params?: {
    keywords?: string;
    location?: string;
    limit?: number;
    page?: number;
  }): Promise<RawJobData[]> {
    if (!this.apiKey) {
      this.logger.warn('USAJobs API key not configured. Set USAJOBS_API_KEY environment variable.');
      return [];
    }

    try {
      this.logger.log('Fetching jobs from USAJobs API...');

      const queryParams: Record<string, any> = {
        ResultsPerPage: params?.limit || 100,
        Page: params?.page || 1,
      };

      if (params?.keywords) {
        queryParams.Keyword = params.keywords;
      }

      if (params?.location) {
        queryParams.LocationName = params.location;
      }

      const response = await axios.get(this.apiUrl, {
        params: queryParams,
        headers: {
          'Host': 'data.usajobs.gov',
          'User-Agent': this.userAgent,
          'Authorization-Key': this.apiKey,
        },
        timeout: 30000,
      });

      const searchResult = response.data.SearchResult || {};
      const items = searchResult.SearchResultItems || [];

      this.logger.log(`USAJobs returned ${items.length} jobs (Total: ${searchResult.SearchResultCount})`);

      return items.map((item: any) => this.mapJob(item.MatchedObjectDescriptor));
    } catch (error) {
      this.logger.error(`USAJobs API error: ${error.message}`);
      return [];
    }
  }

  private mapJob(job: any): RawJobData {
    const locations = job.PositionLocation?.map((loc: any) => loc.LocationName).join('; ') || 'United States';
    const firstLocation = job.PositionLocation?.[0] || {};

    // Extract city, state, country from location
    const locationName = firstLocation.LocationName || '';
    const locationParts = this.parseLocation(locationName);

    // Determine if remote
    const isRemote = job.PositionRemoteIndicator?.[0]?.RemoteIndicator === true;

    // Extract salary info
    const remuneration = job.PositionRemuneration?.[0] || {};
    const salaryMin = this.parseSalary(remuneration.MinimumRange);
    const salaryMax = this.parseSalary(remuneration.MaximumRange);

    return {
      external_id: job.PositionID || `usajobs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: job.PositionTitle || '',
      company_name: job.OrganizationName || job.DepartmentName || 'U.S. Government',
      company_logo_url: null,
      location: locations,
      remote_type: isRemote ? 'remote' : 'onsite',
      description: this.cleanDescription(job),
      requirements: this.extractQualifications(job),
      skills: this.extractSkills(job),
      experience_level: this.mapExperienceLevel(job.JobGrade?.[0]?.Code),
      employment_type: this.mapEmploymentType(job.PositionSchedule?.[0]?.Name),
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: 'USD',
      salary_period: 'yearly',
      posted_at: job.PublicationStartDate ? new Date(job.PublicationStartDate) : new Date(),
      expires_at: job.ApplicationCloseDate ? new Date(job.ApplicationCloseDate) : undefined,
      application_url: job.ApplyURI?.[0] || job.PositionURI || '',
      metadata: {
        source_api: 'usajobs',
        department: job.DepartmentName,
        sub_agency: job.SubAgency,
        pay_plan: job.JobGrade?.[0]?.Code,
        series: job.JobCategory?.[0]?.Code,
        security_clearance: job.SecurityClearance,
        travel_required: job.TravelCode,
        supervisory_status: job.SupervisoryStatus,
        who_may_apply: job.UserArea?.Details?.JobSummary?.WhoMayApply?.Name,
        original_data: job,
      },
    };
  }

  private parseLocation(locationName: string): { city?: string; state?: string; country: string } {
    if (!locationName) return { country: 'United States' };

    // Format: "City Name, State Abbrev" or "City, ST"
    const parts = locationName.split(',').map(p => p.trim());

    if (parts.length >= 2) {
      return {
        city: parts[0],
        state: parts[1],
        country: 'United States',
      };
    }

    return { country: 'United States' };
  }

  private cleanDescription(job: any): string {
    // Try multiple fields for description
    const desc = job.UserArea?.Details?.JobSummary?.JobSummary ||
                 job.QualificationSummary ||
                 job.PositionFormattedDescription?.[0]?.Content ||
                 '';

    return this.stripHtml(desc);
  }

  private extractQualifications(job: any): string[] {
    const qualifications: string[] = [];
    const content = job.QualificationSummary || job.UserArea?.Details?.JobSummary?.Qualifications || '';

    if (content) {
      const lines = content
        .split(/[.\n]/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 20 && l.length < 300);

      qualifications.push(...lines.slice(0, 5));
    }

    return qualifications;
  }

  private extractSkills(job: any): string[] {
    const skills: string[] = [];
    const description = job.PositionFormattedDescription?.[0]?.Content || '';
    const qualifications = job.QualificationSummary || '';
    const combined = `${description} ${qualifications}`.toLowerCase();

    // Common government job skills
    const commonSkills = [
      'communication', 'leadership', 'management', 'analysis', 'technical',
      'planning', 'research', 'writing', 'budgeting', 'project management',
      'customer service', 'data analysis', 'security clearance', 'Microsoft Office',
      'collaboration', 'problem solving', 'critical thinking',
    ];

    for (const skill of commonSkills) {
      if (combined.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private mapExperienceLevel(payPlan: string): string {
    if (!payPlan) return 'mid';

    // GS (General Schedule) grades mapping
    // GS-1 to GS-7: Entry
    // GS-8 to GS-11: Mid
    // GS-12 to GS-13: Senior
    // GS-14+: Lead/Executive
    if (payPlan.startsWith('GS')) {
      const grade = parseInt(payPlan.replace('GS-', '').replace('GS', ''));
      if (!isNaN(grade)) {
        if (grade <= 7) return 'entry';
        if (grade <= 11) return 'mid';
        if (grade <= 13) return 'senior';
        return 'lead';
      }
    }

    return 'mid';
  }

  private mapEmploymentType(schedule: string): string {
    if (!schedule) return 'full_time';

    const lowerSchedule = schedule.toLowerCase();
    if (lowerSchedule.includes('part')) return 'part_time';
    if (lowerSchedule.includes('intermittent')) return 'part_time';
    if (lowerSchedule.includes('seasonal')) return 'temporary';
    if (lowerSchedule.includes('temporary')) return 'temporary';

    return 'full_time';
  }

  private parseSalary(salaryStr: string): number | null {
    if (!salaryStr) return null;

    // Remove all non-digits
    const match = salaryStr.match(/\d+/g);
    if (match) {
      return parseInt(match.join(''));
    }

    return null;
  }

  private stripHtml(html: string): string {
    if (!html) return '';

    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  async fetchJobDetails(externalId: string): Promise<RawJobData> {
    // USAJobs doesn't have individual job endpoint, fetch all and filter
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
      source: JobSource.USAJOBS,
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
      ats_platform: 'USAJobs',
      ats_metadata: rawJob.metadata,
      is_active: true,
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await axios.get(this.apiUrl, {
        params: { ResultsPerPage: 1 },
        headers: {
          'Host': 'data.usajobs.gov',
          'User-Agent': this.userAgent,
          'Authorization-Key': this.apiKey,
        },
        timeout: 5000,
      });
      return response.status === 200 && response.data.SearchResult;
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
