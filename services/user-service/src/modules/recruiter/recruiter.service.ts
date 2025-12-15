import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThanOrEqual } from 'typeorm';
import { Logger } from '@applyforus/logging';
import {
  RecruiterProfile,
  RecruiterStatus,
  RecruiterTier,
} from './entities/recruiter-profile.entity';
import {
  RecruiterAssignment,
  AssignmentStatus,
  AssignmentType,
} from './entities/recruiter-assignment.entity';
import { PlacementOutcome, PlacementStatus } from './entities/placement-outcome.entity';
import { RecruiterReview, ReviewStatus } from './entities/recruiter-review.entity';
import { RecruiterRevenue, RevenueType, RevenueStatus } from './entities/recruiter-revenue.entity';
import { RegisterRecruiterDto } from './dto/register-recruiter.dto';
import { AssignRecruiterDto } from './dto/assign-recruiter.dto';
import { EscalateApplicationDto } from './dto/escalate-application.dto';
import { SearchRecruitersDto } from './dto/search-recruiters.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class RecruiterService {
  private readonly logger = new Logger(RecruiterService.name);

  constructor(
    @InjectRepository(RecruiterProfile)
    private recruiterProfileRepo: Repository<RecruiterProfile>,
    @InjectRepository(RecruiterAssignment)
    private assignmentRepo: Repository<RecruiterAssignment>,
    @InjectRepository(PlacementOutcome)
    private placementOutcomeRepo: Repository<PlacementOutcome>,
    @InjectRepository(RecruiterReview)
    private reviewRepo: Repository<RecruiterReview>,
    @InjectRepository(RecruiterRevenue)
    private revenueRepo: Repository<RecruiterRevenue>,
  ) {}

  // ==================== RECRUITER REGISTRATION ====================

  async registerRecruiter(
    userId: string,
    dto: RegisterRecruiterDto,
  ): Promise<RecruiterProfile> {
    this.logger.info('Registering new recruiter', { userId });

    // Check if user already has a recruiter profile
    const existing = await this.recruiterProfileRepo.findOne({
      where: { user_id: userId },
    });

    if (existing) {
      throw new ConflictException('User already has a recruiter profile');
    }

    const profile = this.recruiterProfileRepo.create({
      user_id: userId,
      company_name: dto.company_name,
      company_website: dto.company_website,
      bio: dto.bio,
      years_of_experience: dto.years_of_experience,
      linkedin_url: dto.linkedin_url,
      certification: dto.certification,
      certification_url: dto.certification_url,
      industries: dto.industries,
      roles: dto.roles,
      regions: dto.regions,
      languages: dto.languages,
      max_concurrent_assignments: dto.max_concurrent_assignments,
      available_hours: dto.available_hours,
      timezone: dto.timezone,
      placement_fee_percentage: dto.placement_fee_percentage,
      status: RecruiterStatus.PENDING,
      tier: RecruiterTier.STANDARD,
      quality_score: 50, // Start with base score
    });

    const saved = await this.recruiterProfileRepo.save(profile);
    this.logger.info('Recruiter registered successfully', {
      userId,
      recruiterId: saved.id,
    });

    return saved;
  }

  // ==================== RECRUITER SEARCH ====================

  async searchRecruiters(dto: SearchRecruitersDto) {
    this.logger.debug('Searching recruiters', { filters: dto });

    const queryBuilder = this.recruiterProfileRepo
      .createQueryBuilder('recruiter')
      .where('recruiter.status = :status', { status: RecruiterStatus.ACTIVE });

    // Apply filters
    if (dto.industries && dto.industries.length > 0) {
      queryBuilder.andWhere('recruiter.industries && :industries', {
        industries: dto.industries,
      });
    }

    if (dto.roles && dto.roles.length > 0) {
      queryBuilder.andWhere('recruiter.roles && :roles', {
        roles: dto.roles,
      });
    }

    if (dto.regions && dto.regions.length > 0) {
      queryBuilder.andWhere('recruiter.regions && :regions', {
        regions: dto.regions,
      });
    }

    if (dto.tier) {
      queryBuilder.andWhere('recruiter.tier = :tier', { tier: dto.tier });
    }

    if (dto.min_quality_score) {
      queryBuilder.andWhere('recruiter.quality_score >= :minScore', {
        minScore: dto.min_quality_score,
      });
    }

    if (dto.min_rating) {
      queryBuilder.andWhere('recruiter.average_rating >= :minRating', {
        minRating: dto.min_rating,
      });
    }

    if (dto.accepting_assignments !== undefined && dto.accepting_assignments) {
      queryBuilder.andWhere('recruiter.accepting_new_assignments = :accepting', {
        accepting: true,
      });
      queryBuilder.andWhere(
        'recruiter.active_assignments < recruiter.max_concurrent_assignments',
      );
    }

    if (dto.verified_only !== undefined && dto.verified_only) {
      queryBuilder.andWhere('recruiter.is_verified = :verified', {
        verified: true,
      });
    }

    // Pagination
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = dto.sort_by || 'quality_score';
    const sortOrder = dto.sort_order || 'DESC';
    queryBuilder.orderBy(`recruiter.${sortBy}`, sortOrder);

    const [recruiters, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    this.logger.debug('Recruiters found', { count: recruiters.length, total });

    return {
      data: recruiters,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== ASSIGNMENT MANAGEMENT ====================

  async assignRecruiter(
    userId: string,
    dto: AssignRecruiterDto,
  ): Promise<RecruiterAssignment> {
    this.logger.info('Assigning recruiter to user', { userId, dto });

    // Validate recruiter
    const recruiter = await this.recruiterProfileRepo.findOne({
      where: { id: dto.recruiter_id },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    if (!recruiter.canAcceptAssignment()) {
      throw new BadRequestException(
        'Recruiter is not available for new assignments',
      );
    }

    // Check if user already has an active assignment with this recruiter
    const existingAssignment = await this.assignmentRepo.findOne({
      where: {
        user_id: userId,
        recruiter_id: dto.recruiter_id,
        status: In([
          AssignmentStatus.REQUESTED,
          AssignmentStatus.ACCEPTED,
          AssignmentStatus.IN_PROGRESS,
        ]),
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'You already have an active assignment with this recruiter',
      );
    }

    const assignment = this.assignmentRepo.create({
      user_id: userId,
      recruiter_id: dto.recruiter_id,
      assignment_type: dto.assignment_type,
      priority: dto.priority,
      user_requirements: dto.user_requirements,
      target_industries: dto.target_industries,
      target_roles: dto.target_roles,
      target_locations: dto.target_locations,
      target_salary_min: dto.target_salary_min,
      target_salary_max: dto.target_salary_max,
      salary_currency: dto.salary_currency || 'USD',
      agreed_fee: this.calculateAssignmentFee(
        dto.assignment_type,
        recruiter.placement_fee_percentage,
      ),
      platform_fee_percentage: this.getPlatformFeePercentage(recruiter.tier),
      status: AssignmentStatus.REQUESTED,
    });

    const saved = await this.assignmentRepo.save(assignment);

    // Update recruiter stats
    recruiter.total_assignments += 1;
    recruiter.active_assignments += 1;
    await this.recruiterProfileRepo.save(recruiter);

    this.logger.info('Assignment created', { assignmentId: saved.id });

    return saved;
  }

  async escalateApplication(
    userId: string,
    dto: EscalateApplicationDto,
  ): Promise<RecruiterAssignment> {
    this.logger.info('Escalating application to recruiter', { userId, dto });

    let recruiterId = dto.recruiter_id;

    // If no specific recruiter, find the best match
    if (!recruiterId) {
      const bestRecruiter = await this.findBestRecruiterForEscalation(userId);
      if (!bestRecruiter) {
        throw new NotFoundException(
          'No available recruiters found for escalation',
        );
      }
      recruiterId = bestRecruiter.id;
    }

    const assignment = await this.assignRecruiter(userId, {
      recruiter_id: recruiterId,
      assignment_type: dto.assignment_type || AssignmentType.APPLICATION_SUPPORT,
      priority: dto.priority,
      user_requirements: dto.notes,
    });

    // Mark as escalation
    assignment.is_escalation = true;
    assignment.escalated_from_application_id = dto.application_id;
    assignment.escalation_reason = dto.escalation_reason;

    await this.assignmentRepo.save(assignment);

    this.logger.info('Application escalated', {
      assignmentId: assignment.id,
      applicationId: dto.application_id,
    });

    return assignment;
  }

  async updateAssignment(
    assignmentId: string,
    recruiterId: string,
    dto: UpdateAssignmentDto,
  ): Promise<RecruiterAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, recruiter_id: recruiterId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Update fields
    if (dto.status) {
      assignment.status = dto.status;

      if (dto.status === AssignmentStatus.ACCEPTED) {
        assignment.accepted_at = new Date();
      } else if (dto.status === AssignmentStatus.IN_PROGRESS) {
        assignment.started_at = new Date();
      } else if (dto.status === AssignmentStatus.COMPLETED) {
        assignment.completed_at = new Date();
      }
    }

    if (dto.recruiter_notes) {
      assignment.recruiter_notes = dto.recruiter_notes;
    }

    if (dto.applications_submitted !== undefined) {
      assignment.applications_submitted = dto.applications_submitted;
    }

    if (dto.interviews_scheduled !== undefined) {
      assignment.interviews_scheduled = dto.interviews_scheduled;
    }

    if (dto.offers_received !== undefined) {
      assignment.offers_received = dto.offers_received;
    }

    if (dto.progress_percentage !== undefined) {
      assignment.progress_percentage = dto.progress_percentage;
    } else {
      assignment.updateProgress();
    }

    assignment.last_activity_at = new Date();

    return await this.assignmentRepo.save(assignment);
  }

  // ==================== PLACEMENT TRACKING ====================

  async trackPlacement(
    assignmentId: string,
    placementData: Partial<PlacementOutcome>,
  ): Promise<PlacementOutcome> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const placement = this.placementOutcomeRepo.create({
      assignment_id: assignmentId,
      user_id: assignment.user_id,
      recruiter_id: assignment.recruiter_id,
      ...placementData,
    });

    const saved = await this.placementOutcomeRepo.save(placement);

    // Update assignment stats
    assignment.offers_received += 1;
    assignment.updateProgress();
    await this.assignmentRepo.save(assignment);

    return saved;
  }

  async updatePlacementStatus(
    placementId: string,
    status: PlacementStatus,
    data?: Partial<PlacementOutcome>,
  ): Promise<PlacementOutcome> {
    const placement = await this.placementOutcomeRepo.findOne({
      where: { id: placementId },
    });

    if (!placement) {
      throw new NotFoundException('Placement not found');
    }

    placement.status = status;

    if (data) {
      Object.assign(placement, data);
    }

    // Calculate placement fee if offer accepted
    if (
      status === PlacementStatus.OFFER_ACCEPTED &&
      placement.offered_salary &&
      placement.fee_percentage
    ) {
      const totalFee = placement.calculatePlacementFee();
      placement.placement_fee = totalFee;

      const assignment = await this.assignmentRepo.findOne({
        where: { id: placement.assignment_id },
      });

      if (assignment) {
        const platformFee = assignment.platform_fee_percentage;
        const split = placement.calculateRevenueSplit(platformFee);
        placement.recruiter_payout = split.recruiterPayout;
        placement.platform_commission = split.platformCommission;

        // Create revenue record
        await this.createRevenueRecord(placement, assignment);
      }

      placement.setGuaranteeEndDate();
    }

    if (status === PlacementStatus.HIRED) {
      placement.calculateDaysToHire();
      await this.updateRecruiterPerformance(placement.recruiter_id, true);
    }

    return await this.placementOutcomeRepo.save(placement);
  }

  // ==================== REVIEWS ====================

  async createReview(
    userId: string,
    dto: CreateReviewDto,
  ): Promise<RecruiterReview> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: dto.assignment_id, user_id: userId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== AssignmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Can only review completed assignments',
      );
    }

    // Check for existing review
    const existing = await this.reviewRepo.findOne({
      where: { assignment_id: dto.assignment_id, user_id: userId },
    });

    if (existing) {
      throw new ConflictException('Review already submitted for this assignment');
    }

    const review = this.reviewRepo.create({
      recruiter_id: assignment.recruiter_id,
      user_id: userId,
      assignment_id: dto.assignment_id,
      rating: dto.rating,
      communication_rating: dto.communication_rating,
      professionalism_rating: dto.professionalism_rating,
      expertise_rating: dto.expertise_rating,
      responsiveness_rating: dto.responsiveness_rating,
      review_title: dto.review_title,
      review_text: dto.review_text,
      pros: dto.pros,
      cons: dto.cons,
      would_recommend: dto.would_recommend,
      status: ReviewStatus.PUBLISHED,
      is_verified_placement: assignment.offers_received > 0,
    });

    const saved = await this.reviewRepo.save(review);

    // Update recruiter ratings
    await this.updateRecruiterRatings(assignment.recruiter_id);

    return saved;
  }

  // ==================== PERFORMANCE & QUALITY SCORING ====================

  async updateRecruiterPerformance(
    recruiterId: string,
    successful: boolean,
  ): Promise<void> {
    const recruiter = await this.recruiterProfileRepo.findOne({
      where: { id: recruiterId },
    });

    if (!recruiter) return;

    recruiter.total_placements += 1;
    if (successful) {
      recruiter.successful_placements += 1;
    }

    recruiter.updateSuccessRate();

    // Calculate average time to placement
    const placements = await this.placementOutcomeRepo.find({
      where: {
        recruiter_id: recruiterId,
        status: PlacementStatus.HIRED,
      },
    });

    if (placements.length > 0) {
      const totalDays = placements.reduce(
        (sum, p) => sum + (p.days_to_hire || 0),
        0,
      );
      recruiter.average_time_to_placement = totalDays / placements.length;
    }

    // Recalculate quality score
    recruiter.quality_score = recruiter.calculateQualityScore();

    // Update tier based on performance
    recruiter.tier = this.calculateRecruiterTier(recruiter);

    await this.recruiterProfileRepo.save(recruiter);
  }

  async updateRecruiterRatings(recruiterId: string): Promise<void> {
    const recruiter = await this.recruiterProfileRepo.findOne({
      where: { id: recruiterId },
    });

    if (!recruiter) return;

    const reviews = await this.reviewRepo.find({
      where: {
        recruiter_id: recruiterId,
        status: ReviewStatus.PUBLISHED,
      },
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    recruiter.average_rating = totalRating / reviews.length;
    recruiter.total_reviews = reviews.length;

    // Recalculate quality score
    recruiter.quality_score = recruiter.calculateQualityScore();

    await this.recruiterProfileRepo.save(recruiter);
  }

  calculateRecruiterTier(recruiter: RecruiterProfile): RecruiterTier {
    const score = recruiter.quality_score;
    const placements = recruiter.total_placements;

    if (score >= 80 && placements >= 50) {
      return RecruiterTier.ELITE;
    } else if (score >= 65 && placements >= 20) {
      return RecruiterTier.PREMIUM;
    }

    return RecruiterTier.STANDARD;
  }

  // ==================== REVENUE MANAGEMENT ====================

  async createRevenueRecord(
    placement: PlacementOutcome,
    assignment: RecruiterAssignment,
  ): Promise<RecruiterRevenue> {
    const revenue = this.revenueRepo.create({
      recruiter_id: placement.recruiter_id,
      placement_id: placement.id,
      assignment_id: placement.assignment_id,
      revenue_type: RevenueType.PLACEMENT_FEE,
      gross_amount: placement.placement_fee,
      platform_commission: placement.platform_commission,
      platform_commission_rate: assignment.platform_fee_percentage,
      net_amount: placement.recruiter_payout,
      currency: placement.fee_currency,
      status: RevenueStatus.PENDING,
      description: `Placement fee for ${placement.position_title} at ${placement.company_name}`,
    });

    const saved = await this.revenueRepo.save(revenue);

    // Update recruiter revenue totals
    const recruiter = await this.recruiterProfileRepo.findOne({
      where: { id: placement.recruiter_id },
    });

    if (recruiter) {
      recruiter.pending_revenue += placement.recruiter_payout;
      recruiter.total_revenue += placement.recruiter_payout;
      await this.recruiterProfileRepo.save(recruiter);
    }

    return saved;
  }

  async getRecruiterPerformance(recruiterId: string) {
    const recruiter = await this.recruiterProfileRepo.findOne({
      where: { id: recruiterId },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const assignments = await this.assignmentRepo.find({
      where: { recruiter_id: recruiterId },
    });

    const placements = await this.placementOutcomeRepo.find({
      where: { recruiter_id: recruiterId },
    });

    const reviews = await this.reviewRepo.find({
      where: { recruiter_id: recruiterId, status: ReviewStatus.PUBLISHED },
    });

    const revenue = await this.revenueRepo.find({
      where: { recruiter_id: recruiterId },
    });

    // Calculate statistics
    const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.net_amount), 0);
    const pendingRevenue = revenue
      .filter(r => r.status === RevenueStatus.PENDING)
      .reduce((sum, r) => sum + Number(r.net_amount), 0);
    const paidRevenue = revenue
      .filter(r => r.status === RevenueStatus.COMPLETED)
      .reduce((sum, r) => sum + Number(r.net_amount), 0);

    const successfulPlacements = placements.filter(p =>
      [PlacementStatus.HIRED, PlacementStatus.OFFER_ACCEPTED].includes(p.status),
    ).length;

    return {
      recruiter: {
        id: recruiter.id,
        company_name: recruiter.company_name,
        quality_score: recruiter.quality_score,
        tier: recruiter.tier,
        status: recruiter.status,
      },
      performance: {
        total_assignments: recruiter.total_assignments,
        active_assignments: recruiter.active_assignments,
        completed_assignments: assignments.filter(
          a => a.status === AssignmentStatus.COMPLETED,
        ).length,
        total_placements: recruiter.total_placements,
        successful_placements: successfulPlacements,
        success_rate: recruiter.success_rate,
        average_time_to_placement: recruiter.average_time_to_placement,
      },
      ratings: {
        average_rating: recruiter.average_rating,
        total_reviews: recruiter.total_reviews,
        reviews_breakdown: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length,
        },
      },
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        paid: paidRevenue,
        currency: 'USD',
      },
    };
  }

  // ==================== HELPER METHODS ====================

  private calculateAssignmentFee(
    type: AssignmentType,
    basePercentage: number,
  ): number {
    // Different fee structures based on assignment type
    const multipliers = {
      [AssignmentType.FULL_SERVICE]: 1.0,
      [AssignmentType.RESUME_REVIEW]: 0.2,
      [AssignmentType.INTERVIEW_PREP]: 0.3,
      [AssignmentType.APPLICATION_SUPPORT]: 0.5,
      [AssignmentType.CAREER_CONSULTING]: 0.4,
    };

    return basePercentage * (multipliers[type] || 1.0);
  }

  private getPlatformFeePercentage(tier: RecruiterTier): number {
    // Platform takes smaller cut from higher tier recruiters
    const fees = {
      [RecruiterTier.STANDARD]: 25,
      [RecruiterTier.PREMIUM]: 20,
      [RecruiterTier.ELITE]: 15,
    };

    return fees[tier] || 25;
  }

  private async findBestRecruiterForEscalation(
    userId: string,
  ): Promise<RecruiterProfile | null> {
    // Find best available recruiter based on quality score and availability
    const recruiters = await this.recruiterProfileRepo.find({
      where: {
        status: RecruiterStatus.ACTIVE,
        is_verified: true,
        accepting_new_assignments: true,
      },
      order: {
        quality_score: 'DESC',
      },
      take: 10,
    });

    // Filter by capacity
    const available = recruiters.filter(r => r.canAcceptAssignment());

    return available.length > 0 ? available[0] : null;
  }
}
