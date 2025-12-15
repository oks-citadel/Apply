import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { NormalizedJob } from '../entities/normalized-job.entity';
import * as crypto from 'crypto';

interface DuplicateDetectionResult {
  is_duplicate: boolean;
  duplicate_of_job_id?: string;
  similarity_score: number;
  content_hash: string;
  duplicate_reasons?: string[];
}

interface JobFingerprint {
  title_hash: string;
  company_hash: string;
  location_hash: string;
  description_hash: string;
  content_hash: string;
}

@Injectable()
export class DuplicateDetectorService {
  private readonly logger = new Logger(DuplicateDetectorService.name);

  // Thresholds for duplicate detection
  private readonly EXACT_MATCH_THRESHOLD = 0.95;
  private readonly HIGH_SIMILARITY_THRESHOLD = 0.85;
  private readonly MODERATE_SIMILARITY_THRESHOLD = 0.70;

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(NormalizedJob)
    private readonly normalizedJobRepository: Repository<NormalizedJob>,
  ) {}

  /**
   * Detect if a job is a duplicate of existing jobs
   */
  async detectDuplicate(job: Job): Promise<DuplicateDetectionResult> {
    try {
      // Generate fingerprint for the job
      const fingerprint = this.generateFingerprint(job);

      // Check for exact hash matches first (fastest)
      const exactMatch = await this.findExactMatch(fingerprint.content_hash, job.id);
      if (exactMatch) {
        return {
          is_duplicate: true,
          duplicate_of_job_id: exactMatch.job_id,
          similarity_score: 100,
          content_hash: fingerprint.content_hash,
          duplicate_reasons: ['Exact content match'],
        };
      }

      // Check for fuzzy matches
      const fuzzyMatch = await this.findFuzzyMatches(job, fingerprint);
      if (fuzzyMatch) {
        return fuzzyMatch;
      }

      // Not a duplicate
      return {
        is_duplicate: false,
        similarity_score: 0,
        content_hash: fingerprint.content_hash,
      };
    } catch (error) {
      this.logger.error(`Error detecting duplicate for job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find exact content hash match
   */
  private async findExactMatch(contentHash: string, currentJobId: string): Promise<NormalizedJob | null> {
    return this.normalizedJobRepository.findOne({
      where: {
        content_hash: contentHash,
      },
      relations: ['job'],
    }).then((result) => {
      // Make sure it's not the same job
      if (result && result.job_id !== currentJobId) {
        return result;
      }
      return null;
    });
  }

  /**
   * Find fuzzy matches using multiple signals
   */
  private async findFuzzyMatches(
    job: Job,
    fingerprint: JobFingerprint,
  ): Promise<DuplicateDetectionResult | null> {
    // Find similar jobs from the same company with similar titles
    const candidates = await this.findCandidateDuplicates(job);

    if (candidates.length === 0) {
      return null;
    }

    // Calculate similarity scores for each candidate
    const similarities = candidates.map((candidate) => ({
      candidate,
      score: this.calculateSimilarityScore(job, candidate, fingerprint),
    }));

    // Sort by similarity score
    similarities.sort((a, b) => b.score - a.score);

    const bestMatch = similarities[0];

    // Check if similarity exceeds threshold
    if (bestMatch.score >= this.MODERATE_SIMILARITY_THRESHOLD) {
      const reasons = this.identifyDuplicateReasons(job, bestMatch.candidate, bestMatch.score);

      return {
        is_duplicate: true,
        duplicate_of_job_id: bestMatch.candidate.id,
        similarity_score: bestMatch.score * 100,
        content_hash: fingerprint.content_hash,
        duplicate_reasons: reasons,
      };
    }

    return null;
  }

  /**
   * Find candidate duplicates using database queries
   */
  private async findCandidateDuplicates(job: Job): Promise<Job[]> {
    const queryBuilder = this.jobRepository.createQueryBuilder('job');

    // Build query conditions
    const conditions: string[] = [];
    const parameters: Record<string, any> = {};

    // Same company
    if (job.company_id) {
      conditions.push('job.company_id = :companyId');
      parameters.companyId = job.company_id;
    } else if (job.company_name) {
      conditions.push('LOWER(job.company_name) = LOWER(:companyName)');
      parameters.companyName = job.company_name;
    }

    // Similar title (fuzzy match)
    if (job.title) {
      conditions.push('similarity(job.title, :title) > 0.6');
      parameters.title = job.title;
    }

    // Posted around the same time (within 30 days)
    if (job.posted_at) {
      conditions.push(`
        job.posted_at BETWEEN :startDate AND :endDate
      `);
      const date = new Date(job.posted_at);
      parameters.startDate = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
      parameters.endDate = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Not the same job
    conditions.push('job.id != :jobId');
    parameters.jobId = job.id;

    // Only active jobs
    conditions.push('job.is_active = true');

    if (conditions.length === 0) {
      return [];
    }

    queryBuilder
      .where(conditions.join(' AND '), parameters)
      .limit(10); // Limit candidates to improve performance

    return queryBuilder.getMany();
  }

  /**
   * Calculate similarity score between two jobs
   */
  private calculateSimilarityScore(job1: Job, job2: Job, fingerprint: JobFingerprint): number {
    let totalScore = 0;
    let weightSum = 0;

    // Title similarity (weight: 30%)
    const titleSim = this.calculateStringSimilarity(
      this.normalizeText(job1.title),
      this.normalizeText(job2.title),
    );
    totalScore += titleSim * 0.3;
    weightSum += 0.3;

    // Company similarity (weight: 25%)
    if (job1.company_id && job2.company_id) {
      const companySim = job1.company_id === job2.company_id ? 1 : 0;
      totalScore += companySim * 0.25;
      weightSum += 0.25;
    } else if (job1.company_name && job2.company_name) {
      const companySim = this.calculateStringSimilarity(
        this.normalizeText(job1.company_name),
        this.normalizeText(job2.company_name),
      );
      totalScore += companySim * 0.25;
      weightSum += 0.25;
    }

    // Location similarity (weight: 10%)
    if (job1.location && job2.location) {
      const locationSim = this.calculateStringSimilarity(
        this.normalizeText(job1.location),
        this.normalizeText(job2.location),
      );
      totalScore += locationSim * 0.1;
      weightSum += 0.1;
    }

    // Description similarity (weight: 25%)
    if (job1.description && job2.description) {
      const descSim = this.calculateDescriptionSimilarity(job1.description, job2.description);
      totalScore += descSim * 0.25;
      weightSum += 0.25;
    }

    // Salary similarity (weight: 10%)
    if (job1.salary_min && job2.salary_min) {
      const salarySim = this.calculateSalarySimilarity(
        job1.salary_min,
        job1.salary_max,
        job2.salary_min,
        job2.salary_max,
      );
      totalScore += salarySim * 0.1;
      weightSum += 0.1;
    }

    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    const len1 = str1.length;
    const len2 = str2.length;

    // Use simple character comparison for performance
    const minLen = Math.min(len1, len2);
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) matches++;
    }

    return matches / maxLen;
  }

  /**
   * Calculate description similarity using key phrases
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    // Extract key phrases (3-word combinations)
    const phrases1 = this.extractKeyPhrases(desc1);
    const phrases2 = this.extractKeyPhrases(desc2);

    if (phrases1.length === 0 || phrases2.length === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = phrases1.filter((p) => phrases2.includes(p)).length;
    const union = new Set([...phrases1, ...phrases2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Extract key phrases from text
   */
  private extractKeyPhrases(text: string): string[] {
    const words = this.normalizeText(text)
      .split(/\s+/)
      .filter((w) => w.length > 3); // Filter short words

    const phrases: string[] = [];
    for (let i = 0; i < words.length - 2; i++) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }

    return phrases;
  }

  /**
   * Calculate salary similarity
   */
  private calculateSalarySimilarity(
    min1: number,
    max1: number,
    min2: number,
    max2: number,
  ): number {
    // Calculate overlap
    const range1Min = Math.min(min1, max1 || min1);
    const range1Max = Math.max(min1, max1 || min1);
    const range2Min = Math.min(min2, max2 || min2);
    const range2Max = Math.max(min2, max2 || min2);

    const overlapStart = Math.max(range1Min, range2Min);
    const overlapEnd = Math.min(range1Max, range2Max);

    if (overlapStart > overlapEnd) return 0; // No overlap

    const overlap = overlapEnd - overlapStart;
    const range1 = range1Max - range1Min || 1;
    const range2 = range2Max - range2Min || 1;

    return overlap / Math.max(range1, range2);
  }

  /**
   * Identify specific reasons for duplicate classification
   */
  private identifyDuplicateReasons(job1: Job, job2: Job, score: number): string[] {
    const reasons: string[] = [];

    if (score >= this.EXACT_MATCH_THRESHOLD) {
      reasons.push('Nearly identical content');
    }

    // Check specific fields
    if (job1.title.toLowerCase() === job2.title.toLowerCase()) {
      reasons.push('Identical title');
    }

    if (job1.company_id && job1.company_id === job2.company_id) {
      reasons.push('Same company');
    }

    if (job1.location && job2.location && job1.location.toLowerCase() === job2.location.toLowerCase()) {
      reasons.push('Same location');
    }

    if (job1.external_id === job2.external_id && job1.source === job2.source) {
      reasons.push('Same external ID and source');
    }

    const descSim = this.calculateDescriptionSimilarity(job1.description, job2.description);
    if (descSim > 0.8) {
      reasons.push('Very similar description');
    }

    return reasons;
  }

  /**
   * Generate a fingerprint for a job
   */
  private generateFingerprint(job: Job): JobFingerprint {
    const title_hash = this.hashString(this.normalizeText(job.title));
    const company_hash = this.hashString(this.normalizeText(job.company_name || ''));
    const location_hash = this.hashString(this.normalizeText(job.location || ''));
    const description_hash = this.hashString(this.normalizeText(job.description));

    // Create composite hash
    const content_hash = this.hashString(
      `${title_hash}|${company_hash}|${location_hash}|${description_hash}`,
    );

    return {
      title_hash,
      company_hash,
      location_hash,
      description_hash,
      content_hash,
    };
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Hash a string using SHA-256
   */
  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Batch check for duplicates
   */
  async detectDuplicatesInBatch(jobs: Job[]): Promise<Map<string, DuplicateDetectionResult>> {
    const results = new Map<string, DuplicateDetectionResult>();

    for (const job of jobs) {
      try {
        const result = await this.detectDuplicate(job);
        results.set(job.id, result);
      } catch (error) {
        this.logger.error(`Error detecting duplicate for job ${job.id}: ${error.message}`);
      }
    }

    return results;
  }
}
