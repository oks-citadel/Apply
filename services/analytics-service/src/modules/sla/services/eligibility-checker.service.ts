import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SLATier,
  EligibilityStatus,
  ProfileCompletenessField,
  SLA_ELIGIBILITY_REQUIREMENTS,
} from '../enums/sla.enums';
import {
  EligibilityCheckResponseDto,
  EligibilityCheckResultDto,
} from '../dto';

/**
 * Eligibility Checker Service
 * Validates user eligibility for SLA contracts
 */
@Injectable()
export class EligibilityCheckerService {
  private readonly logger = new Logger(EligibilityCheckerService.name);

  constructor() {}

  /**
   * Check if user is eligible for SLA tier
   */
  async checkEligibility(
    userId: string,
    tier: SLATier,
    userProfile?: any,
  ): Promise<EligibilityCheckResponseDto> {
    this.logger.log(`Checking eligibility for user ${userId} tier ${tier}`);

    try {
      const requirements = SLA_ELIGIBILITY_REQUIREMENTS[tier];
      const checkResult = await this.performEligibilityCheck(
        userId,
        tier,
        requirements,
        userProfile,
      );

      const isEligible = this.isEligible(checkResult, requirements);
      const status = isEligible
        ? EligibilityStatus.ELIGIBLE
        : EligibilityStatus.INELIGIBLE;

      const recommendations = this.generateRecommendations(checkResult, requirements);

      return {
        userId,
        tier,
        status,
        isEligible,
        checkResult,
        recommendations,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error checking eligibility for user ${userId}:`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Perform detailed eligibility check
   */
  private async performEligibilityCheck(
    userId: string,
    tier: SLATier,
    requirements: any,
    userProfile?: any,
  ): Promise<EligibilityCheckResultDto> {
    // In production, this would fetch real user data from user-service
    // For now, we'll use the provided profile or mock data
    const profile = userProfile || (await this.fetchUserProfile(userId));

    const passedFields: string[] = [];
    const failedFields: string[] = [];
    const details: any = {};

    // Check each required field
    for (const field of requirements.requiredFields) {
      const passed = this.checkField(field, profile);
      details[field] = passed;

      if (passed) {
        passedFields.push(field);
      } else {
        failedFields.push(field);
      }
    }

    // Calculate profile completeness
    const profileCompleteness =
      (passedFields.length / requirements.requiredFields.length) * 100;

    // Check resume score
    const resumeScore = profile.resumeScore || 0;
    const resumeScorePassed = resumeScore >= requirements.minResumeScore;

    // Check work experience
    const workExperienceMonths = this.calculateWorkExperience(profile);
    const workExperiencePassed =
      workExperienceMonths >= requirements.minWorkExperience;

    // Check approved resume
    const hasApprovedResume = profile.hasApprovedResume || false;
    const approvedResumePassed =
      !requirements.mustHaveApprovedResume || hasApprovedResume;

    // Overall eligibility
    const meetsMinimumRequirements =
      profileCompleteness >= 80 &&
      resumeScorePassed &&
      workExperiencePassed &&
      approvedResumePassed;

    return {
      passedFields,
      failedFields,
      profileCompleteness,
      resumeScore,
      workExperienceMonths,
      hasApprovedResume,
      meetsMinimumRequirements,
      details,
    };
  }

  /**
   * Check individual profile field
   */
  private checkField(field: ProfileCompletenessField, profile: any): boolean {
    switch (field) {
      case ProfileCompletenessField.BASIC_INFO:
        return !!(
          profile.firstName &&
          profile.lastName &&
          profile.email
        );

      case ProfileCompletenessField.CONTACT_INFO:
        return !!(profile.phone && profile.location);

      case ProfileCompletenessField.WORK_EXPERIENCE:
        return (
          Array.isArray(profile.workExperience) &&
          profile.workExperience.length > 0
        );

      case ProfileCompletenessField.EDUCATION:
        return (
          Array.isArray(profile.education) && profile.education.length > 0
        );

      case ProfileCompletenessField.SKILLS:
        return Array.isArray(profile.skills) && profile.skills.length >= 3;

      case ProfileCompletenessField.RESUME:
        return !!(profile.resumeUrl || profile.resumeId);

      case ProfileCompletenessField.PREFERENCES:
        return !!(
          profile.preferences &&
          profile.preferences.desiredRoles &&
          profile.preferences.desiredRoles.length > 0
        );

      default:
        return false;
    }
  }

  /**
   * Calculate total work experience in months
   */
  private calculateWorkExperience(profile: any): number {
    if (!Array.isArray(profile.workExperience)) {
      return 0;
    }

    let totalMonths = 0;

    for (const experience of profile.workExperience) {
      const startDate = new Date(experience.startDate);
      const endDate = experience.endDate
        ? new Date(experience.endDate)
        : new Date();

      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());

      totalMonths += Math.max(0, months);
    }

    return totalMonths;
  }

  /**
   * Determine if user meets eligibility criteria
   */
  private isEligible(
    checkResult: EligibilityCheckResultDto,
    requirements: any,
  ): boolean {
    return (
      checkResult.meetsMinimumRequirements &&
      checkResult.resumeScore >= requirements.minResumeScore &&
      checkResult.workExperienceMonths >= requirements.minWorkExperience &&
      (!requirements.mustHaveApprovedResume || checkResult.hasApprovedResume)
    );
  }

  /**
   * Generate recommendations for improving eligibility
   */
  private generateRecommendations(
    checkResult: EligibilityCheckResultDto,
    requirements: any,
  ): string[] {
    const recommendations: string[] = [];

    // Profile completeness recommendations
    if (checkResult.failedFields.length > 0) {
      recommendations.push(
        `Complete your profile: ${checkResult.failedFields.join(', ')}`,
      );
    }

    // Resume score recommendation
    if (checkResult.resumeScore < requirements.minResumeScore) {
      recommendations.push(
        `Improve your resume score to at least ${requirements.minResumeScore}%. Current: ${checkResult.resumeScore}%`,
      );
    }

    // Work experience recommendation
    if (
      checkResult.workExperienceMonths < requirements.minWorkExperience
    ) {
      const monthsNeeded =
        requirements.minWorkExperience - checkResult.workExperienceMonths;
      recommendations.push(
        `Add ${monthsNeeded} more months of work experience to your profile`,
      );
    }

    // Approved resume recommendation
    if (
      requirements.mustHaveApprovedResume &&
      !checkResult.hasApprovedResume
    ) {
      recommendations.push(
        'Upload and get your resume approved by our AI system',
      );
    }

    // If eligible, provide optimization tips
    if (recommendations.length === 0) {
      recommendations.push('You meet all eligibility requirements!');
      recommendations.push(
        'Consider optimizing your profile further for better job matches',
      );
    }

    return recommendations;
  }

  /**
   * Fetch user profile from user-service
   * In production, this would make an HTTP call to the user-service
   */
  private async fetchUserProfile(userId: string): Promise<any> {
    // TODO: Implement actual API call to user-service
    // For now, return mock data
    this.logger.warn(
      `Using mock profile data for user ${userId}. Implement user-service integration.`,
    );

    return {
      userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      location: 'New York, NY',
      workExperience: [
        {
          company: 'Tech Corp',
          title: 'Software Engineer',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
        },
      ],
      education: [
        {
          institution: 'University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          graduationDate: '2019-05-01',
        },
      ],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      resumeUrl: 'https://example.com/resume.pdf',
      resumeId: 'resume-123',
      resumeScore: 75,
      hasApprovedResume: true,
      preferences: {
        desiredRoles: ['Software Engineer', 'Full Stack Developer'],
        desiredSalary: 100000,
        remotePreference: 'remote',
      },
    };
  }

  /**
   * Batch check eligibility for multiple users
   */
  async batchCheckEligibility(
    userIds: string[],
    tier: SLATier,
  ): Promise<Map<string, EligibilityCheckResponseDto>> {
    const results = new Map<string, EligibilityCheckResponseDto>();

    for (const userId of userIds) {
      try {
        const result = await this.checkEligibility(userId, tier);
        results.set(userId, result);
      } catch (error) {
        this.logger.error(
          `Failed to check eligibility for user ${userId}:`,
          error.stack,
        );
      }
    }

    return results;
  }

  /**
   * Re-validate existing contract eligibility
   */
  async revalidateEligibility(
    userId: string,
    tier: SLATier,
  ): Promise<boolean> {
    const result = await this.checkEligibility(userId, tier);
    return result.isEligible;
  }
}
