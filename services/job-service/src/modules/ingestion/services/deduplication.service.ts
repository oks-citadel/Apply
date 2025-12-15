import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { RawJobListing } from '../entities/raw-job-listing.entity';
import { Job } from '../../jobs/entities/job.entity';
import { NormalizedJob } from '../interfaces/job-adapter.interface';

export interface DeduplicationResult {
  isDuplicate: boolean;
  fingerprint: string;
  duplicateOf?: string; // ID of the original listing
  similarJobs?: Array<{
    id: string;
    similarity: number;
  }>;
  confidence: number; // 0-1 score
}

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(
    @InjectRepository(RawJobListing)
    private readonly rawJobRepository: Repository<RawJobListing>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Generate a fingerprint for a job listing
   * Uses key fields to create a unique hash
   */
  generateFingerprint(job: NormalizedJob | Partial<RawJobListing>): string {
    const normalizedData = this.normalizeForFingerprinting(job);

    // Create a stable string representation of key fields
    const fingerprintString = [
      normalizedData.title,
      normalizedData.companyName,
      normalizedData.location,
      normalizedData.description?.substring(0, 500), // First 500 chars
    ]
      .filter(Boolean)
      .join('|||')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Generate SHA256 hash
    return createHash('sha256').update(fingerprintString).digest('hex');
  }

  /**
   * Check if a job is a duplicate
   */
  async checkDuplicate(
    job: NormalizedJob,
    sourceId: string,
  ): Promise<DeduplicationResult> {
    const fingerprint = this.generateFingerprint(job);

    // Check for exact fingerprint match
    const exactMatch = await this.rawJobRepository.findOne({
      where: {
        fingerprint,
        is_latest: true,
        is_archived: false,
      },
      order: {
        created_at: 'DESC',
      },
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        fingerprint,
        duplicateOf: exactMatch.id,
        confidence: 1.0,
      };
    }

    // Check for fuzzy matches
    const similarJobs = await this.findSimilarJobs(job, fingerprint);

    if (similarJobs.length > 0 && similarJobs[0].similarity >= 0.85) {
      return {
        isDuplicate: true,
        fingerprint,
        duplicateOf: similarJobs[0].id,
        similarJobs,
        confidence: similarJobs[0].similarity,
      };
    }

    return {
      isDuplicate: false,
      fingerprint,
      similarJobs: similarJobs.slice(0, 5), // Top 5 similar jobs
      confidence: 0,
    };
  }

  /**
   * Find similar jobs using fuzzy matching
   */
  async findSimilarJobs(
    job: NormalizedJob,
    fingerprint: string,
  ): Promise<Array<{ id: string; similarity: number }>> {
    const normalizedJob = this.normalizeForFingerprinting(job);

    // Fetch recent jobs from same company
    const recentJobs = await this.rawJobRepository.find({
      where: {
        company_name: normalizedJob.companyName,
        is_latest: true,
        is_archived: false,
      },
      take: 100, // Limit for performance
      order: {
        created_at: 'DESC',
      },
    });

    const similarJobs: Array<{ id: string; similarity: number }> = [];

    for (const existing of recentJobs) {
      if (existing.fingerprint === fingerprint) continue;

      const similarity = this.calculateSimilarity(
        normalizedJob,
        this.normalizeForFingerprinting({
          title: existing.title,
          companyName: existing.company_name,
          location: existing.location,
          description: existing.description,
        }),
      );

      if (similarity >= 0.7) {
        similarJobs.push({
          id: existing.id,
          similarity,
        });
      }
    }

    // Sort by similarity descending
    return similarJobs.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate similarity between two job listings
   * Returns a score between 0 and 1
   */
  private calculateSimilarity(
    job1: ReturnType<typeof this.normalizeForFingerprinting>,
    job2: ReturnType<typeof this.normalizeForFingerprinting>,
  ): number {
    let score = 0;
    let weights = 0;

    // Title similarity (weight: 40%)
    if (job1.title && job2.title) {
      score += this.stringSimilarity(job1.title, job2.title) * 0.4;
      weights += 0.4;
    }

    // Company name must match (weight: 30%)
    if (job1.companyName && job2.companyName) {
      const companySimilarity = this.stringSimilarity(
        job1.companyName,
        job2.companyName,
      );
      if (companySimilarity < 0.8) return 0; // Different companies
      score += companySimilarity * 0.3;
      weights += 0.3;
    }

    // Location similarity (weight: 15%)
    if (job1.location && job2.location) {
      score += this.stringSimilarity(job1.location, job2.location) * 0.15;
      weights += 0.15;
    }

    // Description similarity (weight: 15%)
    if (job1.description && job2.description) {
      score += this.stringSimilarity(job1.description, job2.description) * 0.15;
      weights += 0.15;
    }

    return weights > 0 ? score / weights : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Quick check for substring
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.max(s2.length / s1.length, s1.length / s2.length);
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Normalize job data for fingerprinting
   */
  private normalizeForFingerprinting(
    job: NormalizedJob | Partial<RawJobListing>,
  ): {
    title: string;
    companyName: string;
    location: string;
    description: string;
  } {
    const isNormalizedJob = 'externalId' in job;

    return {
      title: this.normalizeString(
        isNormalizedJob ? job.title : (job as any).title || '',
      ),
      companyName: this.normalizeString(
        isNormalizedJob ? job.companyName : (job as any).company_name || '',
      ),
      location: this.normalizeString(
        isNormalizedJob ? job.location || '' : (job as any).location || '',
      ),
      description: this.normalizeString(
        isNormalizedJob ? job.description : (job as any).description || '',
      ),
    };
  }

  /**
   * Normalize a string for comparison
   */
  private normalizeString(str: string): string {
    if (!str) return '';

    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Mark old versions of a job as not latest
   */
  async markOldVersions(fingerprint: string, newJobId: string): Promise<void> {
    await this.rawJobRepository.update(
      {
        fingerprint,
        is_latest: true,
      },
      {
        is_latest: false,
      },
    );

    this.logger.debug(
      `Marked old versions as not latest for fingerprint: ${fingerprint}`,
    );
  }

  /**
   * Archive old raw job listings
   * Call this periodically to clean up old data
   */
  async archiveOldListings(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.rawJobRepository
      .createQueryBuilder()
      .update()
      .set({ is_archived: true })
      .where('created_at < :cutoffDate', { cutoffDate })
      .andWhere('is_latest = false')
      .andWhere('is_archived = false')
      .execute();

    this.logger.log(
      `Archived ${result.affected} raw job listings older than ${daysOld} days`,
    );

    return result.affected || 0;
  }

  /**
   * Get deduplication statistics
   */
  async getDeduplicationStats(): Promise<{
    totalRawListings: number;
    uniqueListings: number;
    duplicates: number;
    deduplicationRate: number;
  }> {
    const [totalRawListings, uniqueListings] = await Promise.all([
      this.rawJobRepository.count({
        where: { is_archived: false },
      }),
      this.rawJobRepository.count({
        where: {
          is_latest: true,
          is_archived: false,
        },
      }),
    ]);

    const duplicates = totalRawListings - uniqueListings;
    const deduplicationRate =
      totalRawListings > 0 ? (duplicates / totalRawListings) * 100 : 0;

    return {
      totalRawListings,
      uniqueListings,
      duplicates,
      deduplicationRate,
    };
  }
}
