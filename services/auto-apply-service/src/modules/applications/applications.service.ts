import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Application, ApplicationStatus } from './entities/application.entity';

import type { CreateApplicationDto } from './dto/create-application.dto';
import type { QueryApplicationDto } from './dto/query-application.dto';
import type { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  async create(createApplicationDto: CreateApplicationDto): Promise<Application> {
    const application = this.applicationRepository.create({
      ...createApplicationDto,
      applied_at: new Date(),
    });

    return await this.applicationRepository.save(application);
  }

  async findAll(userId: string, query: QueryApplicationDto) {
    const { page, limit, status, company_name, ats_platform, sort_by, sort_order } = query;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .where('application.user_id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    if (company_name) {
      queryBuilder.andWhere('application.company_name ILIKE :company_name', {
        company_name: `%${company_name}%`,
      });
    }

    if (ats_platform) {
      queryBuilder.andWhere('application.ats_platform = :ats_platform', { ats_platform });
    }

    const total = await queryBuilder.getCount();

    const applications = await queryBuilder
      .orderBy(`application.${sort_by}`, sort_order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async update(
    id: string,
    userId: string,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<Application> {
    const application = await this.findOne(id, userId);

    Object.assign(application, updateApplicationDto);

    return await this.applicationRepository.save(application);
  }

  async updateStatus(
    id: string,
    userId: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<Application> {
    const application = await this.findOne(id, userId);

    application.status = updateStatusDto.status;
    if (updateStatusDto.notes) {
      application.notes = updateStatusDto.notes;
    }

    if (updateStatusDto.status !== ApplicationStatus.APPLIED && !application.response_received_at) {
      application.response_received_at = new Date();
    }

    return await this.applicationRepository.save(application);
  }

  async remove(id: string, userId: string): Promise<void> {
    const application = await this.findOne(id, userId);
    await this.applicationRepository.remove(application);
  }

  async getAnalytics(userId: string) {
    const applications = await this.applicationRepository.find({
      where: { user_id: userId },
    });

    const totalApplications = applications.length;
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const autoAppliedCount = applications.filter(app => app.auto_applied).length;
    const averageMatchScore = applications.reduce((sum, app) => sum + (app.match_score || 0), 0) / totalApplications || 0;

    const responseRate = applications.filter(app => app.response_received_at).length / totalApplications || 0;

    const platformCounts = applications.reduce((acc, app) => {
      if (app.ats_platform) {
        acc[app.ats_platform] = (acc[app.ats_platform] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentApplications = applications.filter(app => new Date(app.created_at) >= last30Days).length;

    return {
      total_applications: totalApplications,
      status_breakdown: statusCounts,
      auto_applied_count: autoAppliedCount,
      manual_applied_count: totalApplications - autoAppliedCount,
      average_match_score: Math.round(averageMatchScore * 100) / 100,
      response_rate: Math.round(responseRate * 100),
      platform_breakdown: platformCounts,
      applications_last_30_days: recentApplications,
    };
  }

  async logManualApplication(createApplicationDto: CreateApplicationDto): Promise<Application> {
    const application = this.applicationRepository.create({
      ...createApplicationDto,
      auto_applied: false,
      applied_at: new Date(),
      queue_status: 'completed',
    });

    return await this.applicationRepository.save(application);
  }

  async updateApplicationScreenshot(id: string, screenshotUrl: string): Promise<void> {
    await this.applicationRepository.update(id, { screenshot_url: screenshotUrl });
  }

  async updateApplicationError(id: string, error: any, retryCount: number): Promise<void> {
    await this.applicationRepository.update(id, {
      error_log: error,
      retry_count: retryCount,
      queue_status: 'failed',
    });
  }

  async updateApplicationSuccess(
    id: string,
    applicationReferenceId: string,
    screenshotUrl: string,
  ): Promise<void> {
    await this.applicationRepository.update(id, {
      application_reference_id: applicationReferenceId,
      screenshot_url: screenshotUrl,
      queue_status: 'completed',
      applied_at: new Date(),
    });
  }
}
