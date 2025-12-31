import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

import { Education } from '../career/entities/education.entity';
import { WorkExperience } from '../career/entities/work-experience.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Subscription } from '../subscription/entities/subscription.entity';

import { Repository } from 'typeorm';

export interface ApplicationFunnelData {
  total_jobs_viewed: number;
  jobs_saved: number;
  applications_started: number;
  applications_submitted: number;
  interviews_scheduled: number;
  offers_received: number;
  conversion_rates: {
    view_to_save: number;
    save_to_apply: number;
    apply_to_interview: number;
    interview_to_offer: number;
  };
  timeline?: Array<{
    date: string;
    applications: number;
    interviews: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly jobServiceUrl: string;
  private readonly autoApplyServiceUrl: string;
  private readonly analyticsServiceUrl: string;

  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(WorkExperience)
    private workExperienceRepository: Repository<WorkExperience>,
    @InjectRepository(Education)
    private educationRepository: Repository<Education>,
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.jobServiceUrl = this.configService.get<string>('JOB_SERVICE_URL', 'http://localhost:8084');
    this.autoApplyServiceUrl = this.configService.get<string>('AUTO_APPLY_SERVICE_URL', 'http://localhost:8085');
    this.analyticsServiceUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL', 'http://localhost:8086');
  }

  async getDashboardStats(userId: string): Promise<any> {
    const [
      profile,
      workExperiences,
      education,
      skills,
      subscription,
    ] = await Promise.all([
      this.profileRepository.findOne({ where: { user_id: userId } }),
      this.workExperienceRepository.count({ where: { user_id: userId } }),
      this.educationRepository.count({ where: { user_id: userId } }),
      this.skillRepository.count({ where: { user_id: userId } }),
      this.subscriptionRepository.findOne({ where: { user_id: userId } }),
    ]);

    return {
      profile: {
        completeness: profile?.completeness_score || 0,
        has_photo: !!profile?.profile_photo_url,
      },
      career: {
        work_experiences: workExperiences,
        education_entries: education,
      },
      skills: {
        total: skills,
      },
      subscription: {
        tier: subscription?.tier || 'free',
        status: subscription?.status || 'active',
      },
    };
  }

  async getApplicationFunnelData(userId: string): Promise<ApplicationFunnelData> {
    this.logger.log(`Fetching application funnel data for user ${userId}`);

    try {
      // Fetch data from multiple services in parallel
      const [savedJobsData, applicationsData, analyticsData] = await Promise.all([
        // Get saved jobs count from job-service
        this.fetchSavedJobsData(userId),
        // Get application statistics from auto-apply-service
        this.fetchApplicationsData(userId),
        // Get engagement analytics from analytics-service
        this.fetchAnalyticsData(userId),
      ]);

      // Combine the data from all sources
      const totalJobsViewed = analyticsData?.jobs_viewed || 0;
      const jobsSaved = savedJobsData?.count || 0;
      const applicationsStarted = applicationsData?.started || 0;
      const applicationsSubmitted = applicationsData?.submitted || 0;
      const interviewsScheduled = applicationsData?.interviews || 0;
      const offersReceived = applicationsData?.offers || 0;

      // Calculate conversion rates (avoid division by zero)
      const viewToSave = totalJobsViewed > 0
        ? Math.round((jobsSaved / totalJobsViewed) * 100 * 100) / 100
        : 0;
      const saveToApply = jobsSaved > 0
        ? Math.round((applicationsSubmitted / jobsSaved) * 100 * 100) / 100
        : 0;
      const applyToInterview = applicationsSubmitted > 0
        ? Math.round((interviewsScheduled / applicationsSubmitted) * 100 * 100) / 100
        : 0;
      const interviewToOffer = interviewsScheduled > 0
        ? Math.round((offersReceived / interviewsScheduled) * 100 * 100) / 100
        : 0;

      return {
        total_jobs_viewed: totalJobsViewed,
        jobs_saved: jobsSaved,
        applications_started: applicationsStarted,
        applications_submitted: applicationsSubmitted,
        interviews_scheduled: interviewsScheduled,
        offers_received: offersReceived,
        conversion_rates: {
          view_to_save: viewToSave,
          save_to_apply: saveToApply,
          apply_to_interview: applyToInterview,
          interview_to_offer: interviewToOffer,
        },
        timeline: applicationsData?.timeline || [],
      };
    } catch (error) {
      this.logger.error(`Error fetching application funnel data for user ${userId}: ${error.message}`, error.stack);
      // Return empty funnel data on error
      return {
        total_jobs_viewed: 0,
        jobs_saved: 0,
        applications_started: 0,
        applications_submitted: 0,
        interviews_scheduled: 0,
        offers_received: 0,
        conversion_rates: {
          view_to_save: 0,
          save_to_apply: 0,
          apply_to_interview: 0,
          interview_to_offer: 0,
        },
        timeline: [],
      };
    }
  }

  /**
   * Fetch saved jobs data from job-service
   */
  private async fetchSavedJobsData(userId: string): Promise<{ count: number } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.jobServiceUrl}/api/v1/saved-jobs/count`, {
          headers: { 'X-User-Id': userId },
        }).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.warn(`Failed to fetch saved jobs data: ${error.message}`);
            return of(null);
          }),
        ),
      );

      return response?.data || null;
    } catch (error) {
      this.logger.warn(`Error fetching saved jobs data: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch applications data from auto-apply-service
   */
  private async fetchApplicationsData(userId: string): Promise<{
    started: number;
    submitted: number;
    interviews: number;
    offers: number;
    timeline?: Array<{ date: string; applications: number; interviews: number }>;
  } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.autoApplyServiceUrl}/api/v1/applications/stats`, {
          headers: { 'X-User-Id': userId },
        }).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.warn(`Failed to fetch applications data: ${error.message}`);
            return of(null);
          }),
        ),
      );

      if (response?.data) {
        // Map response to expected format
        const data = response.data;
        return {
          started: data.started || data.draft || 0,
          submitted: data.submitted || data.completed || data.sent || 0,
          interviews: data.interviews || data.interview_scheduled || 0,
          offers: data.offers || data.offer_received || 0,
          timeline: data.timeline || data.activity_timeline,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Error fetching applications data: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch engagement analytics from analytics-service
   */
  private async fetchAnalyticsData(userId: string): Promise<{ jobs_viewed: number } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.analyticsServiceUrl}/api/v1/user-engagement/${userId}`, {
          headers: { 'X-User-Id': userId },
        }).pipe(
          timeout(5000),
          catchError((error) => {
            this.logger.warn(`Failed to fetch analytics data: ${error.message}`);
            return of(null);
          }),
        ),
      );

      if (response?.data) {
        return {
          jobs_viewed: response.data.jobs_viewed || response.data.page_views || 0,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Error fetching analytics data: ${error.message}`);
      return null;
    }
  }

  async getRecentActivity(userId: string, limit: number = 10): Promise<any[]> {
    const activities = [];

    // Get recent profile updates
    const profile = await this.profileRepository.findOne({
      where: { user_id: userId },
    });
    if (profile) {
      activities.push({
        type: 'profile_update',
        description: 'Profile updated',
        timestamp: profile.updated_at,
      });
    }

    // Get recent work experiences
    const recentExperiences = await this.workExperienceRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 3,
    });
    recentExperiences.forEach((exp) => {
      activities.push({
        type: 'work_experience_added',
        description: `Added work experience at ${exp.company}`,
        timestamp: exp.created_at,
      });
    });

    // Get recent skills
    const recentSkills = await this.skillRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 3,
    });
    recentSkills.forEach((skill) => {
      activities.push({
        type: 'skill_added',
        description: `Added skill: ${skill.name}`,
        timestamp: skill.created_at,
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getProfileStrength(userId: string): Promise<any> {
    const [
      profile,
      workCount,
      educationCount,
      skillCount,
    ] = await Promise.all([
      this.profileRepository.findOne({ where: { user_id: userId } }),
      this.workExperienceRepository.count({ where: { user_id: userId } }),
      this.educationRepository.count({ where: { user_id: userId } }),
      this.skillRepository.count({ where: { user_id: userId } }),
    ]);

    const strengths = [];
    const improvements = [];

    // Check profile completeness
    if (profile?.completeness_score >= 80) {
      strengths.push('Complete profile information');
    } else {
      improvements.push('Complete your profile information');
    }

    // Check work experience
    if (workCount >= 2) {
      strengths.push('Strong work history');
    } else if (workCount === 0) {
      improvements.push('Add your work experience');
    }

    // Check education
    if (educationCount >= 1) {
      strengths.push('Education background added');
    } else {
      improvements.push('Add your education history');
    }

    // Check skills
    if (skillCount >= 5) {
      strengths.push('Well-rounded skill set');
    } else if (skillCount < 3) {
      improvements.push('Add more skills to your profile');
    }

    // Check profile photo
    if (profile?.profile_photo_url) {
      strengths.push('Professional profile photo');
    } else {
      improvements.push('Upload a profile photo');
    }

    // Calculate overall strength score
    const maxScore = 100;
    const profileScore = profile?.completeness_score || 0;
    const workScore = Math.min(workCount * 15, 30);
    const educationScore = Math.min(educationCount * 15, 15);
    const skillScore = Math.min(skillCount * 2, 20);
    const photoScore = profile?.profile_photo_url ? 10 : 0;

    const totalScore = Math.min(
      (profileScore * 0.25) + workScore + educationScore + skillScore + photoScore,
      maxScore,
    );

    return {
      score: Math.round(totalScore),
      strengths,
      improvements,
      breakdown: {
        profile: profileScore,
        work_experience: workCount,
        education: educationCount,
        skills: skillCount,
        has_photo: !!profile?.profile_photo_url,
      },
    };
  }
}
