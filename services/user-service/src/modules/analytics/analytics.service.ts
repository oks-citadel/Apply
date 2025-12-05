import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profile/entities/profile.entity';
import { WorkExperience } from '../career/entities/work-experience.entity';
import { Education } from '../career/entities/education.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Subscription } from '../subscription/entities/subscription.entity';

@Injectable()
export class AnalyticsService {
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
  ) {}

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

  async getApplicationFunnelData(userId: string): Promise<any> {
    // This would typically integrate with the Application Service
    // For now, returning a placeholder structure
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
    };
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
