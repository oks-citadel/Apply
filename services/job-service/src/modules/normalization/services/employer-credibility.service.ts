import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployerProfile, EmployerVerificationStatus, EmployerRiskLevel } from '../entities/employer-profile.entity';
import { Company } from '../../companies/entities/company.entity';

interface CredibilityUpdateResult {
  credibility_score: number;
  verification_status: EmployerVerificationStatus;
  risk_level: EmployerRiskLevel;
  credibility_breakdown: {
    company_age: number;
    online_presence: number;
    review_quality: number;
    job_history: number;
    response_rate: number;
    transparency: number;
  };
}

@Injectable()
export class EmployerCredibilityService {
  private readonly logger = new Logger(EmployerCredibilityService.name);

  constructor(
    @InjectRepository(EmployerProfile)
    private readonly employerProfileRepository: Repository<EmployerProfile>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  /**
   * Calculate and update employer credibility score
   */
  async calculateCredibility(companyId: string): Promise<CredibilityUpdateResult> {
    try {
      // Get or create employer profile
      let profile = await this.employerProfileRepository.findOne({
        where: { company_id: companyId },
        relations: ['company'],
      });

      if (!profile) {
        profile = await this.createEmployerProfile(companyId);
      }

      // Calculate individual components
      const companyAge = this.calculateCompanyAgeScore(profile);
      const onlinePresence = this.calculateOnlinePresenceScore(profile);
      const reviewQuality = this.calculateReviewQualityScore(profile);
      const jobHistory = this.calculateJobHistoryScore(profile);
      const responseRate = this.calculateResponseRateScore(profile);
      const transparency = this.calculateTransparencyScore(profile);

      const breakdown = {
        company_age: companyAge,
        online_presence: onlinePresence,
        review_quality: reviewQuality,
        job_history: jobHistory,
        response_rate: responseRate,
        transparency: transparency,
      };

      // Calculate overall credibility score
      const credibilityScore = companyAge + onlinePresence + reviewQuality + jobHistory + responseRate + transparency;

      // Determine verification status
      const verificationStatus = this.determineVerificationStatus(profile, credibilityScore);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(profile, credibilityScore);

      // Update profile
      profile.credibility_score = Math.round(credibilityScore);
      profile.credibility_breakdown = breakdown;
      profile.verification_status = verificationStatus;
      profile.risk_level = riskLevel;
      profile.last_credibility_update = new Date();

      await this.employerProfileRepository.save(profile);

      return {
        credibility_score: Math.round(credibilityScore),
        verification_status: verificationStatus,
        risk_level: riskLevel,
        credibility_breakdown: breakdown,
      };
    } catch (error) {
      this.logger.error(`Error calculating credibility for company ${companyId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate company age score (0-20 points)
   */
  private calculateCompanyAgeScore(profile: EmployerProfile): number {
    if (!profile.company_age_years) return 5; // Neutral score for unknown age

    const age = profile.company_age_years;

    if (age >= 10) return 20; // Well-established
    if (age >= 5) return 15; // Established
    if (age >= 3) return 12; // Growing
    if (age >= 1) return 8; // Startup
    return 5; // Very new
  }

  /**
   * Calculate online presence score (0-15 points)
   */
  private calculateOnlinePresenceScore(profile: EmployerProfile): number {
    let score = 0;

    // Domain verification (5 points)
    if (profile.has_verified_domain) {
      score += 5;

      // Domain age bonus
      if (profile.domain_registered_date) {
        const domainAge = this.getYearsSince(profile.domain_registered_date);
        if (domainAge >= 5) score += 2;
      }
    }

    // Active website (2 points)
    if (profile.has_active_website) score += 2;

    // LinkedIn presence (3 points)
    if (profile.has_linkedin_page) {
      score += 2;
      if (profile.linkedin_followers && profile.linkedin_followers > 1000) score += 1;
    }

    // Review site presence (3 points)
    if (profile.has_glassdoor_profile) score += 1.5;
    if (profile.has_indeed_profile) score += 1.5;

    return Math.min(score, 15);
  }

  /**
   * Calculate review quality score (0-25 points)
   */
  private calculateReviewQualityScore(profile: EmployerProfile): number {
    let score = 0;

    // Glassdoor reviews
    if (profile.glassdoor_review_count > 0) {
      // Review count (5 points)
      if (profile.glassdoor_review_count >= 100) score += 5;
      else if (profile.glassdoor_review_count >= 50) score += 4;
      else if (profile.glassdoor_review_count >= 20) score += 3;
      else if (profile.glassdoor_review_count >= 10) score += 2;
      else score += 1;

      // Rating quality (10 points)
      if (profile.glassdoor_rating) {
        const rating = Number(profile.glassdoor_rating);
        if (rating >= 4.5) score += 10;
        else if (rating >= 4.0) score += 8;
        else if (rating >= 3.5) score += 6;
        else if (rating >= 3.0) score += 4;
        else if (rating >= 2.5) score += 2;
      }

      // CEO approval (5 points)
      if (profile.glassdoor_ceo_approval) {
        const approval = Number(profile.glassdoor_ceo_approval);
        score += (approval / 100) * 5;
      }

      // Recommend percentage (5 points)
      if (profile.glassdoor_recommend_percent) {
        const recommend = Number(profile.glassdoor_recommend_percent);
        score += (recommend / 100) * 5;
      }
    }

    // Penalize for fake reviews
    if (profile.has_fake_reviews) {
      score = Math.max(0, score - 15);
    }

    return Math.min(score, 25);
  }

  /**
   * Calculate job history score (0-20 points)
   */
  private calculateJobHistoryScore(profile: EmployerProfile): number {
    let score = 0;

    // Total jobs posted (5 points)
    if (profile.total_jobs_posted >= 50) score += 5;
    else if (profile.total_jobs_posted >= 20) score += 4;
    else if (profile.total_jobs_posted >= 10) score += 3;
    else if (profile.total_jobs_posted >= 5) score += 2;
    else if (profile.total_jobs_posted > 0) score += 1;

    // Job fill rate (8 points)
    if (profile.job_fill_rate) {
      const fillRate = Number(profile.job_fill_rate);
      if (fillRate >= 0.7) score += 8;
      else if (fillRate >= 0.5) score += 6;
      else if (fillRate >= 0.3) score += 4;
      else score += 2;
    }

    // Posting consistency (7 points)
    if (profile.first_job_posted_at && profile.last_job_posted_at) {
      const postingHistory = this.getMonthsSince(profile.first_job_posted_at);
      const recentActivity = this.getMonthsSince(profile.last_job_posted_at);

      // Long posting history
      if (postingHistory >= 12) score += 4;
      else if (postingHistory >= 6) score += 2;

      // Recent activity
      if (recentActivity <= 1) score += 3;
      else if (recentActivity <= 3) score += 2;
      else if (recentActivity <= 6) score += 1;
    }

    return Math.min(score, 20);
  }

  /**
   * Calculate response rate score (0-10 points)
   */
  private calculateResponseRateScore(profile: EmployerProfile): number {
    let score = 0;

    // Response rate (5 points)
    if (profile.response_rate) {
      const responseRate = Number(profile.response_rate);
      score += (responseRate / 100) * 5;
    }

    // Response time (5 points)
    if (profile.avg_response_time_days) {
      const responseTime = profile.avg_response_time_days;
      if (responseTime <= 3) score += 5;
      else if (responseTime <= 7) score += 4;
      else if (responseTime <= 14) score += 3;
      else if (responseTime <= 30) score += 2;
      else score += 1;
    }

    // Penalize for ghosting
    if (profile.ghosted_candidates_count > 10) {
      score = Math.max(0, score - 3);
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate transparency score (0-10 points)
   */
  private calculateTransparencyScore(profile: EmployerProfile): number {
    let score = 0;

    // Salary transparency (4 points)
    if (profile.salary_transparency_score) {
      const transparency = Number(profile.salary_transparency_score);
      score += (transparency / 100) * 4;
    }

    // Detailed descriptions (3 points)
    if (profile.posts_detailed_descriptions) score += 3;

    // Responsiveness (3 points)
    if (profile.responds_to_inquiries) score += 3;

    return Math.min(score, 10);
  }

  /**
   * Determine verification status based on credibility
   */
  private determineVerificationStatus(
    profile: EmployerProfile,
    credibilityScore: number,
  ): EmployerVerificationStatus {
    // Check for blacklist conditions
    if (profile.verified_scam_count > 0) {
      return EmployerVerificationStatus.BLACKLISTED;
    }

    // Check for suspicious conditions
    if (
      profile.scam_reports_count > 5 ||
      profile.fake_job_reports > 3 ||
      profile.has_fake_reviews ||
      credibilityScore < 20
    ) {
      return EmployerVerificationStatus.SUSPICIOUS;
    }

    // Check for verification
    if (profile.is_verified_employer) {
      return EmployerVerificationStatus.VERIFIED;
    }

    // High credibility = pending verification
    if (credibilityScore >= 70) {
      return EmployerVerificationStatus.PENDING;
    }

    return EmployerVerificationStatus.UNVERIFIED;
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(profile: EmployerProfile, credibilityScore: number): EmployerRiskLevel {
    // Critical risk conditions
    if (
      profile.verified_scam_count > 0 ||
      profile.requires_payment_from_applicants ||
      credibilityScore < 20
    ) {
      return EmployerRiskLevel.CRITICAL;
    }

    // High risk conditions
    if (
      profile.scam_reports_count > 3 ||
      profile.fake_job_reports > 2 ||
      profile.has_fake_reviews ||
      credibilityScore < 40
    ) {
      return EmployerRiskLevel.HIGH;
    }

    // Medium risk conditions
    if (
      profile.scam_reports_count > 1 ||
      profile.poor_communication_history ||
      credibilityScore < 60
    ) {
      return EmployerRiskLevel.MEDIUM;
    }

    return EmployerRiskLevel.LOW;
  }

  /**
   * Create new employer profile
   */
  private async createEmployerProfile(companyId: string): Promise<EmployerProfile> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    const profile = this.employerProfileRepository.create({
      company_id: companyId,
      company: company,
      credibility_score: 50, // Default neutral score
      verification_status: EmployerVerificationStatus.UNVERIFIED,
      risk_level: EmployerRiskLevel.LOW,
      credibility_breakdown: {
        company_age: 0,
        online_presence: 0,
        review_quality: 0,
        job_history: 0,
        response_rate: 0,
        transparency: 0,
      },
    });

    return this.employerProfileRepository.save(profile);
  }

  /**
   * Helper: Get years since a date
   */
  private getYearsSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  /**
   * Helper: Get months since a date
   */
  private getMonthsSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Batch calculate credibility for multiple employers
   */
  async calculateCredibilityInBatch(companyIds: string[]): Promise<Map<string, CredibilityUpdateResult>> {
    const results = new Map<string, CredibilityUpdateResult>();

    for (const companyId of companyIds) {
      try {
        const result = await this.calculateCredibility(companyId);
        results.set(companyId, result);
      } catch (error) {
        this.logger.error(`Error calculating credibility for company ${companyId}: ${error.message}`);
      }
    }

    return results;
  }
}
