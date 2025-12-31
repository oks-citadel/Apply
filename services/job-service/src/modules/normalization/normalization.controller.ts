import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  QualityScoreResponseDto,
  EmployerCredibilityResponseDto,
  NormalizationResultDto,
} from './dto/normalize-job.dto';
import { EmployerProfile } from './entities/employer-profile.entity';
import { JobReport, ReportSeverity, ReportStatus } from './entities/job-report.entity';
import { NormalizedJob } from './entities/normalized-job.entity';

import {
  NormalizeJobDto,
  BatchNormalizeJobsDto,
  ReportJobDto,
  UpdateEmployerVerificationDto,
} from './dto/normalize-job.dto';
import { EmployerCredibilityService } from './services/employer-credibility.service';
import { NormalizationService } from './services/normalization.service';
import { QualityScorerService } from './services/quality-scorer.service';
import { Repository } from 'typeorm';

@ApiTags('Job Normalization')
@ApiBearerAuth()
@Controller('api/v1/normalize')
@UseGuards(JwtAuthGuard) // Require authentication for normalization endpoints - admin operations
export class NormalizationController {
  constructor(
    private readonly normalizationService: NormalizationService,
    private readonly employerCredibilityService: EmployerCredibilityService,
    private readonly qualityScorerService: QualityScorerService,
    @InjectRepository(NormalizedJob)
    private readonly normalizedJobRepository: Repository<NormalizedJob>,
    @InjectRepository(EmployerProfile)
    private readonly employerProfileRepository: Repository<EmployerProfile>,
    @InjectRepository(JobReport)
    private readonly jobReportRepository: Repository<JobReport>,
  ) {}

  @Post('job')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Normalize a single job listing' })
  @ApiResponse({
    status: 200,
    description: 'Job normalized successfully',
    type: NormalizationResultDto,
  })
  async normalizeJob(@Body() dto: NormalizeJobDto): Promise<NormalizationResultDto> {
    return this.normalizationService.normalizeJob(dto.job_id, dto.force);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Normalize multiple jobs in batch' })
  @ApiResponse({
    status: 200,
    description: 'Jobs normalized successfully',
    type: [NormalizationResultDto],
  })
  async normalizeJobsBatch(
    @Body() dto: BatchNormalizeJobsDto,
  ): Promise<NormalizationResultDto[]> {
    return this.normalizationService.normalizeJobsBatch(dto.job_ids, dto.force);
  }

  @Get('jobs/:id/quality-score')
  @ApiOperation({ summary: 'Get quality score and analysis for a job' })
  @ApiResponse({
    status: 200,
    description: 'Quality score retrieved successfully',
    type: QualityScoreResponseDto,
  })
  async getQualityScore(@Param('id') jobId: string): Promise<QualityScoreResponseDto> {
    const normalizedJob = await this.normalizedJobRepository.findOne({
      where: { job_id: jobId },
    });

    if (!normalizedJob) {
      return {
        quality_score: 0,
        confidence_score: 0,
        quality_signals: {
          has_salary: false,
          has_detailed_description: false,
          has_clear_requirements: false,
          has_company_info: false,
          description_length: 0,
          readability_score: 0,
        },
        is_duplicate: false,
        scam_score: 0,
        scam_indicators: [],
        freshness_score: 0,
        age_days: 0,
      };
    }

    return {
      quality_score: normalizedJob.quality_score,
      confidence_score: normalizedJob.confidence_score,
      quality_signals: normalizedJob.quality_signals,
      is_duplicate: normalizedJob.is_duplicate,
      scam_score: normalizedJob.scam_score,
      scam_indicators: normalizedJob.scam_indicators,
      freshness_score: normalizedJob.freshness_score,
      age_days: normalizedJob.age_days,
    };
  }

  @Get('employers/:id/credibility')
  @ApiOperation({ summary: 'Get employer credibility score and details' })
  @ApiResponse({
    status: 200,
    description: 'Employer credibility retrieved successfully',
    type: EmployerCredibilityResponseDto,
  })
  async getEmployerCredibility(
    @Param('id') companyId: string,
  ): Promise<EmployerCredibilityResponseDto> {
    const profile = await this.employerProfileRepository.findOne({
      where: { company_id: companyId },
    });

    if (!profile) {
      // Calculate credibility for the first time
      const result = await this.employerCredibilityService.calculateCredibility(companyId);

      return {
        credibility_score: result.credibility_score,
        verification_status: result.verification_status,
        risk_level: result.risk_level,
        credibility_breakdown: result.credibility_breakdown,
        review_data: {},
        risk_factors: [],
        scam_reports_count: 0,
      };
    }

    return {
      credibility_score: profile.credibility_score,
      verification_status: profile.verification_status,
      risk_level: profile.risk_level,
      credibility_breakdown: profile.credibility_breakdown,
      review_data: {
        glassdoor_rating: profile.glassdoor_rating ? Number(profile.glassdoor_rating) : undefined,
        glassdoor_review_count: profile.glassdoor_review_count,
        indeed_rating: profile.indeed_rating ? Number(profile.indeed_rating) : undefined,
        indeed_review_count: profile.indeed_review_count,
      },
      risk_factors: profile.risk_factors,
      scam_reports_count: profile.scam_reports_count,
    };
  }

  @Post('jobs/report')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report a suspicious or fraudulent job' })
  @ApiResponse({
    status: 201,
    description: 'Job report submitted successfully',
  })
  async reportJob(@Body() dto: ReportJobDto): Promise<{ success: boolean; report_id: string }> {
    const report = this.jobReportRepository.create({
      job_id: dto.job_id,
      reporter_id: dto.reporter_id,
      reporter_email: dto.reporter_email,
      report_type: dto.report_type,
      severity: dto.severity || ReportSeverity.MEDIUM,
      description: dto.description,
      evidence_urls: dto.evidence_urls || [],
      status: ReportStatus.PENDING,
    } as Partial<JobReport>);

    const saved = await this.jobReportRepository.save(report);

    return {
      success: true,
      report_id: saved.id,
    };
  }

  @Post('employers/:id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employer verification status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Employer verification updated successfully',
  })
  async updateEmployerVerification(
    @Param('id') companyId: string,
    @Body() dto: UpdateEmployerVerificationDto,
  ): Promise<{ success: boolean }> {
    const profile = await this.employerProfileRepository.findOne({
      where: { company_id: companyId },
    });

    if (!profile) {
      throw new Error('Employer profile not found');
    }

    if (dto.verification_status) {
      profile.verification_status = dto.verification_status as any;
      profile.verified_at = new Date();
      profile.verified_by = dto.verified_by;
    }

    if (dto.notes) {
      profile.notes = {
        ...profile.notes,
        verification_notes: dto.notes,
      };
    }

    await this.employerProfileRepository.save(profile);

    return { success: true };
  }

  @Post('employers/:id/recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalculate employer credibility score' })
  @ApiResponse({
    status: 200,
    description: 'Credibility recalculated successfully',
    type: EmployerCredibilityResponseDto,
  })
  async recalculateEmployerCredibility(
    @Param('id') companyId: string,
  ): Promise<EmployerCredibilityResponseDto> {
    const result = await this.employerCredibilityService.calculateCredibility(companyId);

    const profile = await this.employerProfileRepository.findOne({
      where: { company_id: companyId },
    });

    return {
      credibility_score: result.credibility_score,
      verification_status: result.verification_status,
      risk_level: result.risk_level,
      credibility_breakdown: result.credibility_breakdown,
      review_data: {
        glassdoor_rating: profile?.glassdoor_rating ? Number(profile.glassdoor_rating) : undefined,
        glassdoor_review_count: profile?.glassdoor_review_count,
        indeed_rating: profile?.indeed_rating ? Number(profile.indeed_rating) : undefined,
        indeed_review_count: profile?.indeed_review_count,
      },
      risk_factors: profile?.risk_factors || [],
      scam_reports_count: profile?.scam_reports_count || 0,
    };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get all job reports (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
  })
  async getReports(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ): Promise<{ reports: JobReport[]; total: number }> {
    const queryBuilder = this.jobReportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.job', 'job')
      .orderBy('report.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('report.report_type = :type', { type });
    }

    const [reports, total] = await queryBuilder.getManyAndCount();

    return { reports, total };
  }
}
