import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';




import { Job } from '../../jobs/entities/job.entity';
import { EmployerProfile } from '../entities/employer-profile.entity';
import { NormalizedJob, ApplicationComplexity } from '../entities/normalized-job.entity';

import type { DuplicateDetectorService } from './duplicate-detector.service';
import type { EmployerCredibilityService } from './employer-credibility.service';
import type { FraudDetectorService } from './fraud-detector.service';
import type { QualityScorerService } from './quality-scorer.service';
import type { SkillExtractorService } from './skill-extractor.service';
import type { TitleNormalizerService } from './title-normalizer.service';
import type { NormalizationResultDto } from '../dto/normalize-job.dto';
import type { Repository } from 'typeorm';

@Injectable()
export class NormalizationService {
  private readonly logger = new Logger(NormalizationService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(NormalizedJob)
    private readonly normalizedJobRepository: Repository<NormalizedJob>,
    @InjectRepository(EmployerProfile)
    private readonly employerProfileRepository: Repository<EmployerProfile>,
    private readonly titleNormalizer: TitleNormalizerService,
    private readonly skillExtractor: SkillExtractorService,
    private readonly duplicateDetector: DuplicateDetectorService,
    private readonly fraudDetector: FraudDetectorService,
    private readonly qualityScorer: QualityScorerService,
    private readonly employerCredibility: EmployerCredibilityService,
  ) {}

  /**
   * Normalize a single job posting
   */
  async normalizeJob(jobId: string, force: boolean = false): Promise<NormalizationResultDto> {
    try {
      this.logger.log(`Starting normalization for job ${jobId}`);

      // Check if already normalized
      if (!force) {
        const existing = await this.normalizedJobRepository.findOne({
          where: { job_id: jobId },
        });

        if (existing) {
          this.logger.log(`Job ${jobId} already normalized, skipping`);
          return this.buildResultDto(existing);
        }
      }

      // Fetch the job
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['company'],
      });

      if (!job) {
        throw new NotFoundException(`Job ${jobId} not found`);
      }

      // Perform normalization
      const normalizedJob = await this.performNormalization(job);

      // Save normalized job
      const saved = await this.normalizedJobRepository.save(normalizedJob);

      this.logger.log(`Successfully normalized job ${jobId}`);
      return this.buildResultDto(saved);
    } catch (error) {
      this.logger.error(`Error normalizing job ${jobId}: ${error.message}`, error.stack);
      return {
        job_id: jobId,
        normalized_job_id: null,
        standardized_title: null,
        seniority_level: null,
        function_category: null,
        quality_score: 0,
        confidence_score: 0,
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Perform the actual normalization
   */
  private async performNormalization(job: Job): Promise<NormalizedJob> {
    // Step 1: Normalize title
    const titleResult = await this.titleNormalizer.normalizeTitle(job.title);

    // Step 2: Extract and categorize skills
    const skillsResult = await this.skillExtractor.extractSkills(
      job.description,
      job.requirements,
      job.benefits,
    );

    // Step 3: Detect duplicates
    const duplicateResult = await this.duplicateDetector.detectDuplicate(job);

    // Step 4: Get employer profile
    let employerProfile: EmployerProfile | undefined;
    if (job.company_id) {
      employerProfile = await this.employerProfileRepository.findOne({
        where: { company_id: job.company_id },
      });
    }

    // Step 5: Detect fraud
    const fraudResult = await this.fraudDetector.detectFraud(job, employerProfile);

    // Step 6: Calculate quality score
    const qualityResult = await this.qualityScorer.calculateQualityScore(job);

    // Step 7: Normalize location
    const locationData = this.normalizeLocation(job);

    // Step 8: Normalize compensation
    const compensationData = this.normalizeCompensation(job);

    // Step 9: Analyze application complexity
    const applicationData = this.analyzeApplicationComplexity(job);

    // Step 10: Calculate confidence score
    const confidenceScore = this.calculateOverallConfidence({
      titleConfidence: titleResult.confidence_score,
      skillsConfidence: skillsResult.confidence_score,
      qualityScore: qualityResult.quality_score,
      fraudScore: fraudResult.scam_score,
    });

    // Create or update normalized job
    let normalizedJob = await this.normalizedJobRepository.findOne({
      where: { job_id: job.id },
    });

    if (!normalizedJob) {
      normalizedJob = this.normalizedJobRepository.create({
        job_id: job.id,
      });
    }

    // Populate normalized job fields
    normalizedJob.standardized_title = titleResult.standardized_title;
    normalizedJob.seniority_level = titleResult.seniority_level;
    normalizedJob.function_category = titleResult.function_category;
    normalizedJob.role_family = titleResult.role_family;

    normalizedJob.categorized_skills = skillsResult.categorized_skills;
    normalizedJob.required_skills = skillsResult.required_skills;
    normalizedJob.preferred_skills = skillsResult.preferred_skills;

    normalizedJob.min_years_experience = job.experience_years_min;
    normalizedJob.max_years_experience = job.experience_years_max;

    Object.assign(normalizedJob, locationData);
    Object.assign(normalizedJob, compensationData);
    Object.assign(normalizedJob, applicationData);

    normalizedJob.is_duplicate = duplicateResult.is_duplicate;
    normalizedJob.duplicate_of_job_id = duplicateResult.duplicate_of_job_id;
    normalizedJob.content_hash = duplicateResult.content_hash;
    normalizedJob.similarity_score = duplicateResult.similarity_score;

    normalizedJob.is_scam = fraudResult.is_scam;
    normalizedJob.scam_score = fraudResult.scam_score;
    normalizedJob.scam_indicators = fraudResult.scam_indicators;
    normalizedJob.fraud_signals = fraudResult.fraud_signals;

    normalizedJob.quality_score = qualityResult.quality_score;
    normalizedJob.quality_signals = qualityResult.quality_signals;
    normalizedJob.freshness_score = qualityResult.freshness_score;
    normalizedJob.age_days = qualityResult.age_days;

    normalizedJob.confidence_score = confidenceScore;
    normalizedJob.last_normalized_at = new Date();

    // ML model versions (placeholder - would use actual model versions)
    normalizedJob.normalization_model_version = '1.0.0';
    normalizedJob.classification_model_version = '1.0.0';
    normalizedJob.fraud_detection_model_version = '1.0.0';

    return normalizedJob;
  }

  /**
   * Normalize location data
   */
  private normalizeLocation(job: Job): Partial<NormalizedJob> {
    return {
      normalized_location: job.location,
      country_code: job.country || this.extractCountryCode(job.location),
      allows_remote: job.remote_type === 'remote' || job.remote_type === 'hybrid',
      requires_relocation: this.detectRelocationRequirement(job.description),
      visa_support: this.detectVisaSupport(job.description),
    };
  }

  /**
   * Normalize compensation data
   */
  private normalizeCompensation(job: Job): Partial<NormalizedJob> {
    // Convert to USD (simplified - would use real exchange rates)
    const salaryMinUsd = this.convertToUSD(job.salary_min, job.salary_currency);
    const salaryMaxUsd = this.convertToUSD(job.salary_max, job.salary_currency);
    const salaryMedianUsd = salaryMinUsd && salaryMaxUsd ? (salaryMinUsd + salaryMaxUsd) / 2 : null;

    return {
      salary_min_usd: salaryMinUsd,
      salary_max_usd: salaryMaxUsd,
      salary_median_usd: salaryMedianUsd,
      compensation_period: job.salary_period || 'yearly',
    };
  }

  /**
   * Analyze application complexity
   */
  private analyzeApplicationComplexity(job: Job): Partial<NormalizedJob> {
    let complexity = ApplicationComplexity.MODERATE;
    let estimatedTime = 15; // minutes

    const description = job.description.toLowerCase();
    const requirements = job.requirements.join(' ').toLowerCase();

    // Check for application requirements
    const hasScreeningQuestions = description.includes('screening') || description.includes('questionnaire');
    const requiresCoverLetter = description.includes('cover letter');
    const requiresPortfolio = description.includes('portfolio') || description.includes('work samples');
    const requiresAssessment = description.includes('assessment') || description.includes('test');

    // Determine complexity
    if (description.includes('quick apply') || description.includes('easy apply')) {
      complexity = ApplicationComplexity.SIMPLE;
      estimatedTime = 5;
    } else if (requiresAssessment || (requiresCoverLetter && requiresPortfolio)) {
      complexity = ApplicationComplexity.VERY_COMPLEX;
      estimatedTime = 45;
    } else if (requiresPortfolio || hasScreeningQuestions) {
      complexity = ApplicationComplexity.COMPLEX;
      estimatedTime = 30;
    }

    return {
      application_complexity: complexity,
      ats_system: job.ats_platform,
      estimated_application_time_minutes: estimatedTime,
      has_screening_questions: hasScreeningQuestions,
      requires_cover_letter: requiresCoverLetter,
      requires_portfolio: requiresPortfolio,
      requires_assessment: requiresAssessment,
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(scores: {
    titleConfidence: number;
    skillsConfidence: number;
    qualityScore: number;
    fraudScore: number;
  }): number {
    // Weighted average
    const confidence =
      scores.titleConfidence * 0.25 +
      scores.skillsConfidence * 0.25 +
      scores.qualityScore * 0.3 +
      (100 - scores.fraudScore) * 0.2; // Inverse fraud score

    return Math.round(Math.max(0, Math.min(100, confidence)));
  }

  /**
   * Extract country code from location string
   */
  private extractCountryCode(location: string): string {
    if (!location) {return null;}

    // Simple country detection (would use a proper library in production)
    const countryPatterns: Record<string, string> = {
      'united states|usa|us': 'US',
      'united kingdom|uk|britain': 'GB',
      'canada': 'CA',
      'australia': 'AU',
      'germany': 'DE',
      'france': 'FR',
      'india': 'IN',
      'singapore': 'SG',
    };

    const lowerLocation = location.toLowerCase();
    for (const [pattern, code] of Object.entries(countryPatterns)) {
      if (new RegExp(pattern).test(lowerLocation)) {
        return code;
      }
    }

    return null;
  }

  /**
   * Convert salary to USD
   */
  private convertToUSD(amount: number, currency: string): number {
    if (!amount) {return null;}

    // Simplified exchange rates (would use real-time rates in production)
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 1.1,
      GBP: 1.25,
      CAD: 0.75,
      AUD: 0.68,
      INR: 0.012,
      SGD: 0.74,
    };

    const rate = rates[currency?.toUpperCase()] || 1;
    return Math.round(amount * rate);
  }

  /**
   * Detect if relocation is required
   */
  private detectRelocationRequirement(description: string): boolean {
    const lowerDesc = description.toLowerCase();
    return (
      lowerDesc.includes('relocation') ||
      lowerDesc.includes('relocate') ||
      lowerDesc.includes('must be willing to move')
    );
  }

  /**
   * Detect visa support level
   */
  private detectVisaSupport(description: string): any {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('will sponsor') || lowerDesc.includes('visa sponsorship')) {
      return 'will_sponsor';
    }
    if (lowerDesc.includes('transfer only') || lowerDesc.includes('h1b transfer')) {
      return 'transfer_only';
    }
    if (lowerDesc.includes('no sponsorship') || lowerDesc.includes('must be authorized')) {
      return 'no_sponsorship';
    }

    return 'not_specified';
  }

  /**
   * Batch normalize multiple jobs
   */
  async normalizeJobsBatch(jobIds: string[], force: boolean = false): Promise<NormalizationResultDto[]> {
    const results: NormalizationResultDto[] = [];

    for (const jobId of jobIds) {
      const result = await this.normalizeJob(jobId, force);
      results.push(result);
    }

    return results;
  }

  /**
   * Build result DTO from normalized job
   */
  private buildResultDto(normalizedJob: NormalizedJob): NormalizationResultDto {
    return {
      job_id: normalizedJob.job_id,
      normalized_job_id: normalizedJob.id,
      standardized_title: normalizedJob.standardized_title,
      seniority_level: normalizedJob.seniority_level,
      function_category: normalizedJob.function_category,
      quality_score: normalizedJob.quality_score,
      confidence_score: normalizedJob.confidence_score,
      success: true,
    };
  }
}
