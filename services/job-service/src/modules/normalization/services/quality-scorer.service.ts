import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';

interface QualityScoreResult {
  quality_score: number; // 0-100
  quality_signals: {
    has_salary: boolean;
    has_detailed_description: boolean;
    has_clear_requirements: boolean;
    has_company_info: boolean;
    description_length: number;
    readability_score: number;
  };
  freshness_score: number;
  age_days: number;
}

@Injectable()
export class QualityScorerService {
  private readonly logger = new Logger(QualityScorerService.name);

  /**
   * Calculate overall quality score for a job
   */
  async calculateQualityScore(job: Job): Promise<QualityScoreResult> {
    try {
      // Calculate individual signals
      const hasSalary = this.hasSalaryInfo(job);
      const hasDetailedDescription = this.hasDetailedDescription(job);
      const hasClearRequirements = this.hasClearRequirements(job);
      const hasCompanyInfo = this.hasCompanyInfo(job);
      const descriptionLength = job.description?.length || 0;
      const readabilityScore = this.calculateReadability(job.description);

      const signals = {
        has_salary: hasSalary,
        has_detailed_description: hasDetailedDescription,
        has_clear_requirements: hasClearRequirements,
        has_company_info: hasCompanyInfo,
        description_length: descriptionLength,
        readability_score: readabilityScore,
      };

      // Calculate freshness
      const { freshness_score, age_days } = this.calculateFreshness(job);

      // Calculate overall quality score
      const qualityScore = this.calculateOverallQuality(signals, job);

      return {
        quality_score: Math.round(qualityScore),
        quality_signals: signals,
        freshness_score: Math.round(freshness_score),
        age_days,
      };
    } catch (error) {
      this.logger.error(`Error calculating quality score for job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if job has salary information
   */
  private hasSalaryInfo(job: Job): boolean {
    return !!(job.salary_min || job.salary_max);
  }

  /**
   * Check if job has detailed description
   */
  private hasDetailedDescription(job: Job): boolean {
    const description = job.description || '';

    // Must be at least 300 characters
    if (description.length < 300) return false;

    // Should have multiple paragraphs or sections
    const paragraphs = description.split(/\n\n|\n/).filter((p) => p.trim().length > 50);
    if (paragraphs.length < 3) return false;

    return true;
  }

  /**
   * Check if job has clear requirements
   */
  private hasClearRequirements(job: Job): boolean {
    // Should have explicit requirements
    if (!job.requirements || job.requirements.length === 0) {
      // Check if requirements are in description
      const description = job.description?.toLowerCase() || '';
      return description.includes('requirement') || description.includes('qualifications');
    }

    return job.requirements.length >= 3;
  }

  /**
   * Check if job has company information
   */
  private hasCompanyInfo(job: Job): boolean {
    let score = 0;

    if (job.company_id) score += 40;
    if (job.company_name) score += 20;
    if (job.company_logo_url) score += 20;
    if (job.company?.description) score += 20;

    return score >= 60;
  }

  /**
   * Calculate readability score for description
   */
  private calculateReadability(description: string): number {
    if (!description) return 0;

    let score = 50; // Base score

    // Check sentence structure
    const sentences = description.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength = description.length / (sentences.length || 1);

    // Ideal sentence length: 15-25 words
    if (avgSentenceLength >= 15 && avgSentenceLength <= 25) {
      score += 15;
    } else if (avgSentenceLength < 10 || avgSentenceLength > 40) {
      score -= 10;
    }

    // Check paragraph structure
    const paragraphs = description.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length >= 3 && paragraphs.length <= 10) {
      score += 10;
    }

    // Check for formatting (bullets, numbering)
    if (/[-*•]\s/.test(description) || /\d+\.\s/.test(description)) {
      score += 10;
    }

    // Check for appropriate punctuation
    const punctuationRatio = (description.match(/[.,;:!?]/g) || []).length / description.length;
    if (punctuationRatio > 0.02 && punctuationRatio < 0.1) {
      score += 5;
    }

    // Check for complex words (penalize excessive jargon)
    const words = description.split(/\s+/);
    const complexWords = words.filter((w) => w.length > 12).length;
    const complexWordRatio = complexWords / (words.length || 1);
    if (complexWordRatio < 0.05) {
      score += 10;
    } else if (complexWordRatio > 0.15) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate freshness score based on posting date
   */
  private calculateFreshness(job: Job): { freshness_score: number; age_days: number } {
    if (!job.posted_at) {
      return { freshness_score: 50, age_days: 0 };
    }

    const now = new Date();
    const postedDate = new Date(job.posted_at);
    const ageMs = now.getTime() - postedDate.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    // Freshness decay curve
    let freshnessScore = 100;

    if (ageDays <= 7) {
      freshnessScore = 100; // Very fresh
    } else if (ageDays <= 14) {
      freshnessScore = 90; // Fresh
    } else if (ageDays <= 30) {
      freshnessScore = 75; // Recent
    } else if (ageDays <= 60) {
      freshnessScore = 50; // Aging
    } else if (ageDays <= 90) {
      freshnessScore = 25; // Old
    } else {
      freshnessScore = 10; // Very old
    }

    return {
      freshness_score: freshnessScore,
      age_days: ageDays,
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQuality(
    signals: {
      has_salary: boolean;
      has_detailed_description: boolean;
      has_clear_requirements: boolean;
      has_company_info: boolean;
      description_length: number;
      readability_score: number;
    },
    job: Job,
  ): number {
    let score = 0;

    // Salary information (15 points)
    if (signals.has_salary) score += 15;

    // Detailed description (20 points)
    if (signals.has_detailed_description) score += 20;

    // Clear requirements (15 points)
    if (signals.has_clear_requirements) score += 15;

    // Company information (15 points)
    if (signals.has_company_info) score += 15;

    // Description length (10 points)
    if (signals.description_length > 500) {
      score += 10;
    } else if (signals.description_length > 300) {
      score += 7;
    } else if (signals.description_length > 150) {
      score += 4;
    }

    // Readability (10 points)
    score += (signals.readability_score / 100) * 10;

    // Skills listed (10 points)
    if (job.skills && job.skills.length > 0) {
      score += Math.min(job.skills.length * 2, 10);
    }

    // Benefits listed (5 points)
    if (job.benefits && job.benefits.length > 0) {
      score += Math.min(job.benefits.length, 5);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Batch calculate quality scores
   */
  async calculateQualityScoresInBatch(jobs: Job[]): Promise<Map<string, QualityScoreResult>> {
    const results = new Map<string, QualityScoreResult>();

    for (const job of jobs) {
      try {
        const result = await this.calculateQualityScore(job);
        results.set(job.id, result);
      } catch (error) {
        this.logger.error(`Error calculating quality score for job ${job.id}: ${error.message}`);
      }
    }

    return results;
  }
}
