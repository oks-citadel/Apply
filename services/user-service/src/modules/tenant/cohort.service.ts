import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between } from 'typeorm';

import { Cohort } from './entities/cohort.entity';
import { PlacementTracking } from './entities/placement-tracking.entity';
import { TenantUser } from './entities/tenant-user.entity';

import type { CreateCohortDto } from './dto/create-cohort.dto';
import type { Repository} from 'typeorm';

@Injectable()
export class CohortService {
  private readonly logger = new Logger(CohortService.name);

  constructor(
    @InjectRepository(Cohort)
    private readonly cohortRepository: Repository<Cohort>,
    @InjectRepository(PlacementTracking)
    private readonly placementTrackingRepository: Repository<PlacementTracking>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
  ) {}

  /**
   * Create a new cohort
   */
  async createCohort(tenantId: string, createCohortDto: CreateCohortDto): Promise<Cohort> {
    // Check if cohort name already exists for this tenant
    const existingCohort = await this.cohortRepository.findOne({
      where: {
        tenant_id: tenantId,
        name: createCohortDto.name,
      },
    });

    if (existingCohort) {
      throw new ConflictException('Cohort with this name already exists');
    }

    const cohort = this.cohortRepository.create({
      tenant_id: tenantId,
      ...createCohortDto,
      status: 'active',
    });

    const savedCohort = await this.cohortRepository.save(cohort);

    this.logger.log(`Cohort created: ${savedCohort.id} (${savedCohort.name})`);

    return savedCohort;
  }

  /**
   * Get all cohorts for a tenant
   */
  async getCohorts(
    tenantId: string,
    status?: string,
    limit = 100,
    offset = 0,
  ): Promise<{ cohorts: Cohort[]; total: number }> {
    const whereClause: any = { tenant_id: tenantId };

    if (status) {
      whereClause.status = status;
    }

    const [cohorts, total] = await this.cohortRepository.findAndCount({
      where: whereClause,
      take: limit,
      skip: offset,
      order: {
        start_date: 'DESC',
      },
    });

    return { cohorts, total };
  }

  /**
   * Get cohort by ID
   */
  async getCohortById(tenantId: string, cohortId: string): Promise<Cohort> {
    const cohort = await this.cohortRepository.findOne({
      where: {
        id: cohortId,
        tenant_id: tenantId,
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }

    return cohort;
  }

  /**
   * Update cohort
   */
  async updateCohort(tenantId: string, cohortId: string, updateData: Partial<CreateCohortDto>): Promise<Cohort> {
    const cohort = await this.getCohortById(tenantId, cohortId);

    Object.assign(cohort, updateData);

    return await this.cohortRepository.save(cohort);
  }

  /**
   * Get cohort students
   */
  async getCohortStudents(tenantId: string, cohortName: string) {
    const students = await this.tenantUserRepository.find({
      where: {
        tenant_id: tenantId,
        cohort: cohortName,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return students;
  }

  /**
   * Add students to cohort
   */
  async addStudentsToCohort(tenantId: string, cohortName: string, userIds: string[]) {
    const results = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        const tenantUser = await this.tenantUserRepository.findOne({
          where: {
            tenant_id: tenantId,
            user_id: userId,
          },
        });

        if (!tenantUser) {
          results.failed.push({
            userId,
            reason: 'User not found in tenant',
          });
          continue;
        }

        tenantUser.cohort = cohortName;
        await this.tenantUserRepository.save(tenantUser);

        results.success.push(userId);
      } catch (error) {
        this.logger.error(`Failed to add student ${userId} to cohort: ${error.message}`);
        results.failed.push({
          userId,
          reason: error.message,
        });
      }
    }

    // Update cohort enrollment count
    await this.updateCohortMetrics(tenantId, cohortName);

    return results;
  }

  /**
   * Get cohort placement statistics
   */
  async getCohortPlacementStats(tenantId: string, cohortName: string) {
    const placements = await this.placementTrackingRepository.find({
      where: {
        tenant_id: tenantId,
        cohort: cohortName,
      },
    });

    const totalStudents = placements.length;
    const placedStudents = placements.filter((p) => p.placement_status === 'placed').length;
    const seekingStudents = placements.filter((p) => p.placement_status === 'seeking').length;
    const notSeekingStudents = placements.filter((p) => p.placement_status === 'not_seeking').length;

    const placementRate = totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0;

    const salaries = placements.filter((p) => p.salary && p.placement_status === 'placed').map((p) => Number(p.salary));
    const averageSalary = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;

    const daysToPlacement = placements
      .filter((p) => p.days_to_placement && p.placement_status === 'placed')
      .map((p) => p.days_to_placement);
    const averageDaysToPlacement =
      daysToPlacement.length > 0 ? daysToPlacement.reduce((a, b) => a + b, 0) / daysToPlacement.length : 0;

    // Group by industry
    const byIndustry = placements
      .filter((p) => p.industry && p.placement_status === 'placed')
      .reduce((acc, p) => {
        acc[p.industry] = (acc[p.industry] || 0) + 1;
        return acc;
      }, {});

    // Group by company
    const byCompany = placements
      .filter((p) => p.company_name && p.placement_status === 'placed')
      .reduce((acc, p) => {
        acc[p.company_name] = (acc[p.company_name] || 0) + 1;
        return acc;
      }, {});

    // Top skills from placed students
    const allSkills = placements
      .filter((p) => p.skills && p.placement_status === 'placed')
      .flatMap((p) => p.skills);

    const skillCounts = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});

    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    return {
      cohort: cohortName,
      summary: {
        totalStudents,
        placedStudents,
        seekingStudents,
        notSeekingStudents,
        placementRate: placementRate.toFixed(2),
        averageSalary: averageSalary.toFixed(2),
        averageDaysToPlacement: averageDaysToPlacement.toFixed(0),
      },
      byIndustry,
      byCompany,
      topSkills,
      recentPlacements: placements
        .filter((p) => p.placement_status === 'placed')
        .sort((a, b) => {
          if (!a.placement_date || !b.placement_date) {return 0;}
          return new Date(b.placement_date).getTime() - new Date(a.placement_date).getTime();
        })
        .slice(0, 10),
    };
  }

  /**
   * Update cohort metrics
   */
  async updateCohortMetrics(tenantId: string, cohortName: string) {
    const cohort = await this.cohortRepository.findOne({
      where: {
        tenant_id: tenantId,
        name: cohortName,
      },
    });

    if (!cohort) {
      return;
    }

    // Count enrolled students
    const enrolledCount = await this.tenantUserRepository.count({
      where: {
        tenant_id: tenantId,
        cohort: cohortName,
      },
    });

    // Get placement stats
    const placements = await this.placementTrackingRepository.find({
      where: {
        tenant_id: tenantId,
        cohort: cohortName,
      },
    });

    const placedCount = placements.filter((p) => p.placement_status === 'placed').length;
    const placementRate = placements.length > 0 ? (placedCount / placements.length) * 100 : 0;

    const salaries = placements.filter((p) => p.salary && p.placement_status === 'placed').map((p) => Number(p.salary));
    const averageSalary = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : null;

    const daysToPlacement = placements
      .filter((p) => p.days_to_placement && p.placement_status === 'placed')
      .map((p) => p.days_to_placement);
    const averageDaysToPlacement =
      daysToPlacement.length > 0 ? daysToPlacement.reduce((a, b) => a + b, 0) / daysToPlacement.length : null;

    // Update cohort
    cohort.enrolled_count = enrolledCount;
    cohort.placed_count = placedCount;
    cohort.placement_rate = parseFloat(placementRate.toFixed(2));
    cohort.average_salary = averageSalary;
    cohort.average_days_to_placement = averageDaysToPlacement;

    await this.cohortRepository.save(cohort);

    this.logger.log(`Updated metrics for cohort ${cohortName}: ${enrolledCount} students, ${placedCount} placed`);
  }

  /**
   * Archive cohort
   */
  async archiveCohort(tenantId: string, cohortId: string): Promise<Cohort> {
    const cohort = await this.getCohortById(tenantId, cohortId);

    cohort.status = 'archived';

    return await this.cohortRepository.save(cohort);
  }

  /**
   * Complete cohort
   */
  async completeCohort(tenantId: string, cohortId: string): Promise<Cohort> {
    const cohort = await this.getCohortById(tenantId, cohortId);

    cohort.status = 'completed';

    // Update graduated count
    const graduatedCount = await this.tenantUserRepository.count({
      where: {
        tenant_id: tenantId,
        cohort: cohort.name,
      },
    });

    cohort.graduated_count = graduatedCount;

    // Update final metrics
    await this.updateCohortMetrics(tenantId, cohort.name);

    return await this.cohortRepository.save(cohort);
  }

  /**
   * Get cohort timeline/milestones
   */
  async getCohortTimeline(tenantId: string, cohortId: string) {
    const cohort = await this.getCohortById(tenantId, cohortId);

    const timeline = [
      {
        event: 'Cohort Start',
        date: cohort.start_date,
        status: 'completed',
      },
      {
        event: 'Cohort End',
        date: cohort.end_date,
        status: new Date() > new Date(cohort.end_date) ? 'completed' : 'upcoming',
      },
    ];

    if (cohort.graduation_date) {
      timeline.push({
        event: 'Graduation',
        date: cohort.graduation_date,
        status: new Date() > new Date(cohort.graduation_date) ? 'completed' : 'upcoming',
      });
    }

    return {
      cohort: {
        id: cohort.id,
        name: cohort.name,
        program: cohort.program,
        status: cohort.status,
      },
      timeline: timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      daysRemaining: cohort.end_date ? Math.ceil((new Date(cohort.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
    };
  }
}
