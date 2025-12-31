import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import {
  SLATier,
  EligibilityStatus,
  ProfileCompletenessField,
  SLA_ELIGIBILITY_REQUIREMENTS,
} from '../enums/sla.enums';
import { EligibilityCheckResponseDto, EligibilityCheckResultDto } from '../dto';

/**
 * Eligibility Checker Service
 * Validates user eligibility for SLA contracts
 */
@Injectable()
export class EligibilityCheckerService {
  private readonly logger = new Logger(EligibilityCheckerService.name);
  private readonly userServiceUrl: string;
  private readonly resumeServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.userServiceUrl = this.configService.get<string>('USER_SERVICE_URL', 'http://localhost:8082');
    this.resumeServiceUrl = this.configService.get<string>('RESUME_SERVICE_URL', 'http://localhost:8083');
  }

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
      const status = isEligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE;

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
      this.logger.error(`Error checking eligibility for user ${userId}:`, error.stack);
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
    const profileCompleteness = (passedFields.length / requirements.requiredFields.length) * 100;

    // Check resume score
    const resumeScore = profile.resumeScore || 0;
    const resumeScorePassed = resumeScore >= requirements.minResumeScore;

    // Check work experience
    const workExperienceMonths = this.calculateWorkExperience(profile);
    const workExperiencePassed = workExperienceMonths >= requirements.minWorkExperience;

    // Check approved resume
    const hasApprovedResume = profile.hasApprovedResume || false;
    const approvedResumePassed = !requirements.mustHaveApprovedResume || hasApprovedResume;

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
        return !!(profile.firstName && profile.lastName && profile.email);

      case ProfileCompletenessField.CONTACT_INFO:
        return !!(profile.phone && profile.location);

      case ProfileCompletenessField.WORK_EXPERIENCE:
        return Array.isArray(profile.workExperience) && profile.workExperience.length > 0;

      case ProfileCompletenessField.EDUCATION:
        return Array.isArray(profile.education) && profile.education.length > 0;

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
      const endDate = experience.endDate ? new Date(experience.endDate) : new Date();

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
  private isEligible(checkResult: EligibilityCheckResultDto, requirements: any): boolean {
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
      recommendations.push(`Complete your profile: ${checkResult.failedFields.join(', ')}`);
    }

    // Resume score recommendation
    if (checkResult.resumeScore < requirements.minResumeScore) {
      recommendations.push(
        `Improve your resume score to at least ${requirements.minResumeScore}%. Current: ${checkResult.resumeScore}%`,
      );
    }

    // Work experience recommendation
    if (checkResult.workExperienceMonths < requirements.minWorkExperience) {
      const monthsNeeded = requirements.minWorkExperience - checkResult.workExperienceMonths;
      recommendations.push(`Add ${monthsNeeded} more months of work experience to your profile`);
    }

    // Approved resume recommendation
    if (requirements.mustHaveApprovedResume && !checkResult.hasApprovedResume) {
      recommendations.push('Upload and get your resume approved by our AI system');
    }

    // If eligible, provide optimization tips
    if (recommendations.length === 0) {
      recommendations.push('You meet all eligibility requirements!');
      recommendations.push('Consider optimizing your profile further for better job matches');
    }

    return recommendations;
  }

  /**
   * Fetch user profile from user-service
   * Makes HTTP calls to user-service and resume-service to gather complete profile data
   */
  private async fetchUserProfile(userId: string): Promise<any> {
    this.logger.log(`Fetching user profile for user ${userId} from user-service`);

    try {
      // Fetch profile, work experience, education, skills, and preferences in parallel
      const [profileResponse, workExperienceResponse, educationResponse, skillsResponse, preferencesResponse, resumeResponse] = await Promise.all([
        firstValueFrom(
          this.httpService.get(`${this.userServiceUrl}/api/v1/profile`, {
            headers: { 'X-User-Id': userId },
          }).pipe(
            timeout(10000),
            catchError((error) => {
              this.logger.warn(`Failed to fetch profile for user ${userId}: ${error.message}`);
              return of({ data: null });
            }),
          ),
        ),
        firstValueFrom(
          this.httpService.get(`${this.userServiceUrl}/api/v1/career/work-experience`, {
            headers: { 'X-User-Id': userId },
          }).pipe(
            timeout(10000),
            catchError((error) => {
              this.logger.warn(`Failed to fetch work experience for user ${userId}: ${error.message}`);
              return of({ data: [] });
            }),
          ),
        ),
        firstValueFrom(
          this.httpService.get(`${this.userServiceUrl}/api/v1/career/education`, {
            headers: { 'X-User-Id': userId },
          }).pipe(
            timeout(10000),
            catchError((error) => {
              this.logger.warn(`Failed to fetch education for user ${userId}: ${error.message}`);
              return of({ data: [] });
            }),
          ),
        ),
        firstValueFrom(
          this.httpService.get(`${this.userServiceUrl}/api/v1/skills`, {
            headers: { 'X-User-Id': userId },
          }).pipe(
            timeout(10000),
            catchError((error) => {
              this.logger.warn(`Failed to fetch skills for user ${userId}: ${error.message}`);
              return of({ data: [] });
            }),
          ),
        ),
        firstValueFrom(
          this.httpService.get(`${this.userServiceUrl}/api/v1/preferences`, {
            headers: { 'X-User-Id': userId },
          }).pipe(
            timeout(10000),
            catchError((error) => {
              this.logger.warn(`Failed to fetch preferences for user ${userId}: ${error.message}`);
              return of({ data: null });
            }),
          ),
        ),
        firstValueFrom(
          this.httpService.get(`${this.resumeServiceUrl}/api/v1/resumes`, {
            headers: { 'X-User-Id': userId },
            params: { limit: 1, sortBy: 'updatedAt', order: 'DESC' },
          }).pipe(
            timeout(10000),
            catchError((error) => {
              this.logger.warn(`Failed to fetch resumes for user ${userId}: ${error.message}`);
              return of({ data: { resumes: [] } });
            }),
          ),
        ),
      ]);

      const profile = profileResponse.data;
      const workExperience = Array.isArray(workExperienceResponse.data)
        ? workExperienceResponse.data
        : workExperienceResponse.data?.workExperiences || [];
      const education = Array.isArray(educationResponse.data)
        ? educationResponse.data
        : educationResponse.data?.education || [];
      const skills = Array.isArray(skillsResponse.data)
        ? skillsResponse.data.map((s: any) => s.name || s)
        : skillsResponse.data?.skills?.map((s: any) => s.name || s) || [];
      const preferences = preferencesResponse.data;
      const resumes = resumeResponse.data?.resumes || resumeResponse.data || [];
      const primaryResume = resumes[0];

      // Check if profile data was successfully fetched
      if (!profile) {
        this.logger.warn(`No profile found for user ${userId}, returning minimal profile`);
        return {
          userId,
          firstName: null,
          lastName: null,
          email: null,
          phone: null,
          location: null,
          workExperience: [],
          education: [],
          skills: [],
          resumeUrl: null,
          resumeId: null,
          resumeScore: 0,
          hasApprovedResume: false,
          preferences: null,
        };
      }

      // Parse full name into first and last name
      const nameParts = (profile.full_name || '').split(' ');
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(' ') || null;

      // Transform work experience to expected format
      const transformedWorkExperience = workExperience.map((exp: any) => ({
        company: exp.company || exp.company_name,
        title: exp.title || exp.job_title || exp.position,
        startDate: exp.start_date || exp.startDate,
        endDate: exp.end_date || exp.endDate,
        description: exp.description,
        current: exp.is_current || exp.current || !exp.end_date,
      }));

      // Transform education to expected format
      const transformedEducation = education.map((edu: any) => ({
        institution: edu.institution || edu.school,
        degree: edu.degree,
        field: edu.field_of_study || edu.field || edu.major,
        graduationDate: edu.graduation_date || edu.end_date || edu.graduationDate,
      }));

      return {
        userId,
        firstName,
        lastName,
        email: profile.email || null,
        phone: profile.phone || null,
        location: profile.location || null,
        workExperience: transformedWorkExperience,
        education: transformedEducation,
        skills,
        resumeUrl: primaryResume?.file_url || primaryResume?.fileUrl || null,
        resumeId: primaryResume?.id || null,
        resumeScore: primaryResume?.score || primaryResume?.ats_score || 0,
        hasApprovedResume: primaryResume?.status === 'approved' || primaryResume?.is_approved || false,
        preferences: preferences ? {
          desiredRoles: preferences.desired_roles || preferences.desiredRoles || [],
          desiredSalary: preferences.desired_salary || preferences.desiredSalary,
          remotePreference: preferences.remote_preference || preferences.remotePreference,
        } : null,
      };
    } catch (error) {
      this.logger.error(`Error fetching user profile for ${userId}:`, error.stack);
      // Return empty profile on error to allow graceful degradation
      return {
        userId,
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        location: null,
        workExperience: [],
        education: [],
        skills: [],
        resumeUrl: null,
        resumeId: null,
        resumeScore: 0,
        hasApprovedResume: false,
        preferences: null,
      };
    }
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
        this.logger.error(`Failed to check eligibility for user ${userId}:`, error.stack);
      }
    }

    return results;
  }

  /**
   * Re-validate existing contract eligibility
   */
  async revalidateEligibility(userId: string, tier: SLATier): Promise<boolean> {
    const result = await this.checkEligibility(userId, tier);
    return result.isEligible;
  }
}
