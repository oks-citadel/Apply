import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { REGIONAL_PLAYBOOKS } from './config';
import { PlaybookApplication, ApplicationStatus } from './entities/playbook-application.entity';
import { Playbook, Region } from './entities/playbook.entity';
import { Job, RemoteType } from '../jobs/entities/job.entity';

import type {
  ApplyPlaybookDto,
  ApplyPlaybookResponseDto,
  UpdateApplicationStatusDto,
  ApplicationStatsDto,
  RecommendationResponseDto,
} from './dto';
import type { Repository } from 'typeorm';


@Injectable()
export class PlaybooksService {
  private readonly logger = new Logger(PlaybooksService.name);

  constructor(
    @InjectRepository(Playbook)
    private playbookRepository: Repository<Playbook>,
    @InjectRepository(PlaybookApplication)
    private applicationRepository: Repository<PlaybookApplication>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async onModuleInit() {
    await this.seedPlaybooks();
  }

  /**
   * Seed regional playbooks into database if they don't exist
   */
  private async seedPlaybooks(): Promise<void> {
    try {
      const existingCount = await this.playbookRepository.count();

      if (existingCount === 0) {
        this.logger.log('Seeding regional playbooks...');

        for (const config of REGIONAL_PLAYBOOKS) {
          const playbook = this.playbookRepository.create(config as any);
          await this.playbookRepository.save(playbook);
        }

        this.logger.log(`Seeded ${REGIONAL_PLAYBOOKS.length} regional playbooks`);
      }
    } catch (error) {
      this.logger.error('Failed to seed playbooks', error.stack);
    }
  }

  /**
   * Get all active playbooks
   */
  async findAll(): Promise<Playbook[]> {
    return this.playbookRepository.find({
      where: { is_active: true },
      order: { usage_count: 'DESC' },
    });
  }

  /**
   * Get playbook by ID
   */
  async findOne(id: string): Promise<Playbook> {
    const playbook = await this.playbookRepository.findOne({
      where: { id },
    });

    if (!playbook) {
      throw new NotFoundException(`Playbook with ID ${id} not found`);
    }

    return playbook;
  }

  /**
   * Get playbook by region
   */
  async findByRegion(region: Region): Promise<Playbook> {
    const playbook = await this.playbookRepository.findOne({
      where: { region, is_active: true },
    });

    if (!playbook) {
      throw new NotFoundException(`Playbook for region ${region} not found`);
    }

    return playbook;
  }

  /**
   * Recommend playbook based on job location and characteristics
   */
  async recommendPlaybook(jobId: string, userId?: string): Promise<RecommendationResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Determine region based on job location
    const region = this.determineRegion(job);
    const recommendedPlaybook = await this.findByRegion(region);

    // Get alternative playbooks
    const allPlaybooks = await this.findAll();
    const alternativePlaybooks = allPlaybooks
      .filter(p => p.region !== region)
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        region: p.region,
        name: p.name,
        country: p.country,
        description: p.description,
        usage_count: p.usage_count,
        success_rate: p.success_rate,
        is_active: p.is_active,
      }));

    // Calculate match score and reasons
    const { matchScore, matchReasons } = this.calculateMatchScore(job, recommendedPlaybook);

    return {
      recommended_playbook: recommendedPlaybook,
      match_score: matchScore,
      match_reasons: matchReasons,
      alternative_playbooks: alternativePlaybooks,
    };
  }

  /**
   * Determine region based on job location
   */
  private determineRegion(job: Job): Region {
    const country = job.country?.toLowerCase();
    const location = job.location?.toLowerCase();

    // Check for remote positions
    if (job.remote_type === RemoteType.REMOTE || location?.includes('remote')) {
      return Region.GLOBAL_REMOTE;
    }

    // Map countries to regions
    if (country === 'united states' || country === 'usa' || country === 'us') {
      return Region.UNITED_STATES;
    }

    if (country === 'canada' || country === 'ca') {
      return Region.CANADA;
    }

    if (country === 'united kingdom' || country === 'uk' || country === 'gb') {
      return Region.UNITED_KINGDOM;
    }

    if (country === 'australia' || country === 'au') {
      return Region.AUSTRALIA;
    }

    // EU countries
    const euCountries = [
      'germany', 'france', 'italy', 'spain', 'netherlands', 'poland',
      'belgium', 'sweden', 'austria', 'denmark', 'finland', 'ireland',
      'portugal', 'czech republic', 'romania', 'greece', 'hungary',
    ];

    if (euCountries.some(c => country?.includes(c) || location?.includes(c))) {
      return Region.EUROPEAN_UNION;
    }

    // Default to US playbook
    this.logger.warn(`Unable to determine region for job ${job.id}, defaulting to UNITED_STATES`);
    return Region.UNITED_STATES;
  }

  /**
   * Calculate match score between job and playbook
   */
  private calculateMatchScore(job: Job, playbook: Playbook): { matchScore: number; matchReasons: string[] } {
    let matchScore = 70; // Base score
    const matchReasons: string[] = [];

    // ATS system match
    if (job.ats_platform && playbook.common_ats_systems.includes(job.ats_platform)) {
      matchScore += 15;
      matchReasons.push(`ATS system ${job.ats_platform} is commonly used in ${playbook.name}`);
    }

    // Remote work match
    if (job.remote_type === RemoteType.REMOTE && playbook.region === Region.GLOBAL_REMOTE) {
      matchScore += 10;
      matchReasons.push('Optimized for remote positions');
    }

    // Location match
    if (job.country === playbook.country) {
      matchScore += 5;
      matchReasons.push(`Location matches ${playbook.name} standards`);
    }

    matchReasons.push(`${playbook.name} playbook provides region-specific formatting and cultural preferences`);

    return { matchScore: Math.min(matchScore, 100), matchReasons };
  }

  /**
   * Apply playbook to a job application
   */
  async applyPlaybook(dto: ApplyPlaybookDto): Promise<ApplyPlaybookResponseDto> {
    // Validate job exists
    const job = await this.jobRepository.findOne({
      where: { id: dto.job_id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${dto.job_id} not found`);
    }

    // Validate playbook exists
    const playbook = await this.findOne(dto.playbook_id);

    // Check if application already exists
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        user_id: dto.user_id,
        job_id: dto.job_id,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Application already exists for this job');
    }

    // Create playbook application
    const application = this.applicationRepository.create({
      user_id: dto.user_id,
      job_id: dto.job_id,
      playbook_id: dto.playbook_id,
      resume_id: dto.resume_id,
      cover_letter_id: dto.cover_letter_id,
      resume_auto_formatted: dto.auto_format_resume || false,
      cover_letter_auto_generated: dto.auto_generate_cover_letter || false,
      ats_optimized: dto.optimize_for_ats || false,
      ats_system_detected: job.ats_platform,
      salary_min_proposed: dto.salary_min,
      salary_max_proposed: dto.salary_max,
      salary_currency: playbook.salary_norms.currency,
      user_notes: dto.user_notes,
      status: ApplicationStatus.PENDING,
    });

    // Calculate metrics
    const atsScore = this.calculateAtsCompatibilityScore(job, playbook);
    const playbookMatchScore = this.calculateMatchScore(job, playbook).matchScore;

    application.application_metrics = {
      application_time_seconds: 0,
      resume_score: 0,
      ats_compatibility_score: atsScore,
      playbook_match_score: playbookMatchScore,
      modifications_made: 0,
    };

    // Save application
    const savedApplication = await this.applicationRepository.save(application);

    // Update playbook usage count
    await this.playbookRepository.increment(
      { id: playbook.id },
      'usage_count',
      1,
    );

    // Generate recommendations and warnings
    const recommendations = this.generateRecommendations(job, playbook);
    const warnings = this.generateWarnings(job, playbook);
    const nextSteps = this.generateNextSteps(playbook, dto);

    return {
      application_id: savedApplication.id,
      playbook_id: playbook.id,
      job_id: job.id,
      status: savedApplication.status,
      resume_formatted: dto.auto_format_resume || false,
      cover_letter_generated: dto.auto_generate_cover_letter || false,
      ats_optimized: dto.optimize_for_ats || false,
      ats_compatibility_score: atsScore,
      playbook_match_score: playbookMatchScore,
      recommendations,
      warnings,
      next_steps: nextSteps,
      estimated_application_time: this.estimateApplicationTime(playbook, dto),
      created_at: savedApplication.created_at,
    };
  }

  /**
   * Calculate ATS compatibility score
   */
  private calculateAtsCompatibilityScore(job: Job, playbook: Playbook): number {
    let score = 50; // Base score

    if (job.ats_platform && playbook.common_ats_systems.includes(job.ats_platform)) {
      score += 30;
    }

    if (playbook.ats_optimization_tips) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate application recommendations
   */
  private generateRecommendations(job: Job, playbook: Playbook): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Follow ${playbook.name} resume format standards (${playbook.preferred_resume_format})`);
    recommendations.push(`Keep resume to ${playbook.resume_max_pages} page(s) maximum`);

    if (playbook.cover_letter_required) {
      recommendations.push(`Include cover letter (${playbook.cover_letter_word_count_min}-${playbook.cover_letter_word_count_max} words)`);
    }

    if (job.ats_platform) {
      recommendations.push(`Optimize for ${job.ats_platform} ATS system`);
    }

    if (playbook.ask_work_authorization) {
      recommendations.push('Clearly state work authorization status');
    }

    recommendations.push(...playbook.application_dos.slice(0, 3));

    return recommendations;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(job: Job, playbook: Playbook): string[] {
    const warnings: string[] = [];

    if (playbook.visa_requirements !== 'none_required') {
      warnings.push(`Work authorization required: ${playbook.visa_requirements}`);
    }

    if (!job.ats_platform) {
      warnings.push('ATS system not detected - use standard formatting');
    }

    if (playbook.protected_characteristics.length > 0) {
      warnings.push(`Do not include: ${playbook.protected_characteristics.slice(0, 3).join(', ')}`);
    }

    return warnings;
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(playbook: Playbook, dto: ApplyPlaybookDto): string[] {
    const steps: string[] = [];

    if (dto.auto_format_resume) {
      steps.push('Resume will be auto-formatted according to playbook standards');
    } else {
      steps.push('Review and format resume according to playbook guidelines');
    }

    if (dto.auto_generate_cover_letter) {
      steps.push('Cover letter will be auto-generated');
    } else if (playbook.cover_letter_required) {
      steps.push('Write cover letter following playbook template');
    }

    if (dto.optimize_for_ats) {
      steps.push('Application will be optimized for ATS compatibility');
    }

    steps.push('Review application before submitting');
    steps.push('Submit application through provided URL or platform');
    steps.push(`Follow up after ${playbook.hiring_timeline.follow_up_days} days if no response`);

    return steps;
  }

  /**
   * Estimate application completion time
   */
  private estimateApplicationTime(playbook: Playbook, dto: ApplyPlaybookDto): number {
    let estimatedSeconds = 300; // Base 5 minutes

    if (!dto.auto_format_resume) {
      estimatedSeconds += 600; // 10 minutes for manual formatting
    }

    if (!dto.auto_generate_cover_letter && playbook.cover_letter_required) {
      estimatedSeconds += 900; // 15 minutes for cover letter
    }

    if (dto.optimize_for_ats) {
      estimatedSeconds += 300; // 5 minutes for ATS optimization
    }

    return estimatedSeconds;
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<PlaybookApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['playbook'],
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    application.status = dto.status as ApplicationStatus;

    if (dto.rejection_reason) {
      application.rejection_reason = dto.rejection_reason;
    }

    if (dto.user_notes) {
      application.user_notes = dto.user_notes;
    }

    if (dto.user_rating) {
      application.user_rating = dto.user_rating;
    }

    if (dto.user_feedback) {
      application.user_feedback = dto.user_feedback;
    }

    // Update timestamps based on status
    if (dto.status === ApplicationStatus.APPLIED && !application.applied_at) {
      application.applied_at = new Date();
    }

    if (dto.status === ApplicationStatus.INTERVIEW && !application.interview_scheduled_at) {
      application.interview_scheduled_at = new Date();
      application.got_interview = true;
    }

    if (dto.status === ApplicationStatus.ACCEPTED) {
      application.got_offer = true;
    }

    // Calculate response time if we got a response
    if (application.applied_at && !application.response_received_at) {
      if ([ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED, ApplicationStatus.ACCEPTED].includes(dto.status as ApplicationStatus)) {
        application.response_received_at = new Date();
        const diffMs = application.response_received_at.getTime() - application.applied_at.getTime();
        application.response_time_hours = Math.round(diffMs / (1000 * 60 * 60));
      }
    }

    return this.applicationRepository.save(application);
  }

  /**
   * Get user's application statistics
   */
  async getUserApplicationStats(userId: string): Promise<ApplicationStatsDto> {
    const applications = await this.applicationRepository.find({
      where: { user_id: userId },
      relations: ['playbook'],
    });

    const totalApplications = applications.length;

    // Applications by status
    const applicationsByStatus: Record<string, number> = {};
    applications.forEach(app => {
      applicationsByStatus[app.status] = (applicationsByStatus[app.status] || 0) + 1;
    });

    // Applications by region
    const applicationsByRegion: Record<string, number> = {};
    applications.forEach(app => {
      const region = app.playbook.region;
      applicationsByRegion[region] = (applicationsByRegion[region] || 0) + 1;
    });

    // Average response time
    const responseTimes = applications
      .filter(app => app.response_time_hours !== null)
      .map(app => app.response_time_hours);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Interview and offer rates
    const interviewCount = applications.filter(app => app.got_interview).length;
    const offerCount = applications.filter(app => app.got_offer).length;
    const interviewRate = totalApplications > 0 ? (interviewCount / totalApplications) * 100 : 0;
    const offerRate = totalApplications > 0 ? (offerCount / totalApplications) * 100 : 0;

    // Success rate by playbook
    const playbookStats = new Map<string, {
      playbook_id: string;
      playbook_name: string;
      region: string;
      total: number;
      interviews: number;
      offers: number;
      ratings: number[];
    }>();

    applications.forEach(app => {
      const key = app.playbook_id;
      if (!playbookStats.has(key)) {
        playbookStats.set(key, {
          playbook_id: app.playbook_id,
          playbook_name: app.playbook.name,
          region: app.playbook.region,
          total: 0,
          interviews: 0,
          offers: 0,
          ratings: [],
        });
      }

      const stats = playbookStats.get(key)!;
      stats.total++;
      if (app.got_interview) {stats.interviews++;}
      if (app.got_offer) {stats.offers++;}
      if (app.user_rating) {stats.ratings.push(app.user_rating);}
    });

    const successRateByPlaybook = Array.from(playbookStats.values()).map(stats => ({
      playbook_id: stats.playbook_id,
      playbook_name: stats.playbook_name,
      region: stats.region,
      total_applications: stats.total,
      interview_rate: stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
      offer_rate: stats.total > 0 ? (stats.offers / stats.total) * 100 : 0,
      average_rating: stats.ratings.length > 0
        ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length
        : 0,
    }));

    // Most successful playbook
    const mostSuccessful = successRateByPlaybook.reduce((best, current) => {
      const currentSuccess = (current.interview_rate + current.offer_rate) / 2;
      const bestSuccess = (best.interview_rate + best.offer_rate) / 2;
      return currentSuccess > bestSuccess ? current : best;
    }, successRateByPlaybook[0] || {
      playbook_id: '',
      playbook_name: 'N/A',
      region: '',
      interview_rate: 0,
      offer_rate: 0,
    });

    return {
      total_applications: totalApplications,
      applications_by_status: applicationsByStatus,
      applications_by_region: applicationsByRegion,
      average_response_time_hours: averageResponseTime,
      interview_rate: interviewRate,
      offer_rate: offerRate,
      success_rate_by_playbook: successRateByPlaybook,
      most_successful_playbook: {
        playbook_id: mostSuccessful.playbook_id,
        playbook_name: mostSuccessful.playbook_name,
        region: mostSuccessful.region,
        success_rate: (mostSuccessful.interview_rate + mostSuccessful.offer_rate) / 2,
      },
    };
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string): Promise<PlaybookApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['playbook'],
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    return application;
  }

  /**
   * Get user's applications
   */
  async getUserApplications(userId: string): Promise<PlaybookApplication[]> {
    return this.applicationRepository.find({
      where: { user_id: userId },
      relations: ['playbook'],
      order: { created_at: 'DESC' },
    });
  }
}
