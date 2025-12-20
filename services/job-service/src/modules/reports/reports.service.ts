import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';


import { JobReport } from './entities/report.entity';
import { ReportType, ReportStatus } from './enums/report-type.enum';
import { Job } from '../jobs/entities/job.entity';

import type { CreateReportDto } from './dto/create-report.dto';
import type { QueryReportsDto } from './dto/query-reports.dto';
import type {
  ReportResponseDto,
  PaginatedReportsResponseDto,
  ReportStatsDto,
} from './dto/report-response.dto';
import type { UpdateReportDto } from './dto/update-report.dto';
import type { Repository, FindOptionsWhere } from 'typeorm';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(JobReport)
    private readonly reportRepository: Repository<JobReport>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Create a new report for a job
   */
  async createReport(
    jobId: string,
    userId: string,
    createReportDto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    // Check if job exists
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check for duplicate report from same user for same job
    const existingReport = await this.reportRepository.findOne({
      where: {
        job_id: jobId,
        user_id: userId,
      },
    });

    if (existingReport) {
      throw new ConflictException(
        'You have already reported this job. Your previous report is being reviewed.',
      );
    }

    // Create the report
    const report = this.reportRepository.create({
      job_id: jobId,
      user_id: userId,
      report_type: createReportDto.reportType,
      reason: createReportDto.reason,
      description: createReportDto.description,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);

    this.logger.log(
      `Job ${jobId} reported by user ${userId}. Reason: ${createReportDto.reportType}`,
    );

    return this.mapToResponseDto(savedReport);
  }

  /**
   * Get all reports with filtering and pagination
   */
  async getReports(
    queryDto: QueryReportsDto,
  ): Promise<PaginatedReportsResponseDto> {
    const { page, limit, status, reportType, jobId, userId, sortBy, sortOrder } =
      queryDto;

    const where: FindOptionsWhere<JobReport> = {};

    if (status) {
      where.status = status;
    }

    if (reportType) {
      where.report_type = reportType;
    }

    if (jobId) {
      where.job_id = jobId;
    }

    if (userId) {
      where.user_id = userId;
    }

    const [reports, total] = await this.reportRepository.findAndCount({
      where,
      order: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['job'],
    });

    const data = reports.map((report) => this.mapToResponseDto(report));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Get a single report by ID
   */
  async getReportById(reportId: string): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['job'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.mapToResponseDto(report);
  }

  /**
   * Get all reports for a specific job
   */
  async getReportsByJobId(
    jobId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReportsResponseDto> {
    // Check if job exists
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const [reports, total] = await this.reportRepository.findAndCount({
      where: { job_id: jobId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['job'],
    });

    const data = reports.map((report) => this.mapToResponseDto(report));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Update a report (admin only)
   */
  async updateReport(
    reportId: string,
    adminUserId: string,
    updateReportDto: UpdateReportDto,
  ): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Update the report
    report.status = updateReportDto.status;
    report.resolved_by = adminUserId;
    report.resolved_at = new Date();

    if (updateReportDto.resolutionNotes) {
      report.resolution_notes = updateReportDto.resolutionNotes;
    }

    const updatedReport = await this.reportRepository.save(report);

    this.logger.log(
      `Report ${reportId} updated to status: ${updateReportDto.status} by admin ${adminUserId}`,
    );

    // If report is resolved and it's a valid concern, consider updating the job
    if (
      updateReportDto.status === ReportStatus.RESOLVED &&
      (report.report_type === ReportType.SPAM ||
        report.report_type === ReportType.EXPIRED ||
        report.report_type === ReportType.INAPPROPRIATE)
    ) {
      // Optionally deactivate the job
      await this.jobRepository.update(report.job_id, {
        is_active: false,
      });

      this.logger.log(
        `Job ${report.job_id} deactivated due to resolved report ${reportId}`,
      );
    }

    return this.mapToResponseDto(updatedReport);
  }

  /**
   * Delete a report (admin only)
   */
  async deleteReport(reportId: string): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.reportRepository.remove(report);

    this.logger.log(`Report ${reportId} deleted`);
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<ReportStatsDto> {
    const total = await this.reportRepository.count();

    const pending = await this.reportRepository.count({
      where: { status: ReportStatus.PENDING },
    });

    const reviewed = await this.reportRepository.count({
      where: { status: ReportStatus.REVIEWED },
    });

    const resolved = await this.reportRepository.count({
      where: { status: ReportStatus.RESOLVED },
    });

    const dismissed = await this.reportRepository.count({
      where: { status: ReportStatus.DISMISSED },
    });

    // Get counts by type
    const byType: Record<ReportType, number> = {} as Record<ReportType, number>;

    for (const type of Object.values(ReportType)) {
      byType[type] = await this.reportRepository.count({
        where: { report_type: type },
      });
    }

    return {
      total,
      pending,
      reviewed,
      resolved,
      dismissed,
      byType,
    };
  }

  /**
   * Get reports by user ID
   */
  async getReportsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReportsResponseDto> {
    const [reports, total] = await this.reportRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['job'],
    });

    const data = reports.map((report) => this.mapToResponseDto(report));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }

  /**
   * Check if user has already reported a job
   */
  async hasUserReportedJob(userId: string, jobId: string): Promise<boolean> {
    const report = await this.reportRepository.findOne({
      where: {
        user_id: userId,
        job_id: jobId,
      },
    });

    return !!report;
  }

  /**
   * Get report count for a job
   */
  async getJobReportCount(jobId: string): Promise<number> {
    return this.reportRepository.count({
      where: { job_id: jobId },
    });
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(report: JobReport): ReportResponseDto {
    return {
      id: report.id,
      jobId: report.job_id,
      userId: report.user_id,
      reportType: report.report_type,
      reason: report.reason,
      description: report.description,
      status: report.status,
      resolvedBy: report.resolved_by,
      resolvedAt: report.resolved_at,
      resolutionNotes: report.resolution_notes,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };
  }
}
