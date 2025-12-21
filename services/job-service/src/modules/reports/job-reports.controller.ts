import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import {
  ReportResponseDto,
  PaginatedReportsResponseDto,
} from './dto/report-response.dto';
import { JwtAuthGuard, AdminGuard, RateLimitGuard } from '../../common/guards';

import type { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';


@ApiTags('Jobs')
@Controller('jobs')
export class JobReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':id/report')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Report a job posting' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 201, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 409, description: 'You have already reported this job' })
  @ApiResponse({ status: 429, description: 'Too many reports. Please try again later.' })
  async reportJob(
    @Param('id') jobId: string,
    @Body() createReportDto: CreateReportDto,
    @Request() req: any,
  ): Promise<ReportResponseDto> {
    return this.reportsService.createReport(jobId, req.user.sub, createReportDto);
  }

  @Get(':id/reports')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all reports for a specific job (admin only)' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: PaginatedReportsResponseDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobReports(
    @Param('id') jobId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedReportsResponseDto> {
    return this.reportsService.getReportsByJobId(jobId, page, limit);
  }

  @Get(':id/reports/count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get report count for a job (admin only)' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { count: { type: 'number' } } } })
  async getJobReportCount(@Param('id') jobId: string): Promise<{ count: number }> {
    const count = await this.reportsService.getJobReportCount(jobId);
    return { count };
  }
}
