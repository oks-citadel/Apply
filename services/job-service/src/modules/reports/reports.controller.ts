import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import {
  ReportResponseDto,
  PaginatedReportsResponseDto,
  ReportStatsDto,
} from './dto/report-response.dto';
import { JwtAuthGuard, AdminGuard } from '../../common/guards';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all reports (admin only)' })
  @ApiResponse({ status: 200, type: PaginatedReportsResponseDto })
  async getReports(
    @Query() queryDto: QueryReportsDto,
  ): Promise<PaginatedReportsResponseDto> {
    return this.reportsService.getReports(queryDto);
  }

  @Get('my-reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user\'s reports' })
  @ApiResponse({ status: 200, type: PaginatedReportsResponseDto })
  async getMyReports(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedReportsResponseDto> {
    return this.reportsService.getReportsByUserId(req.user.sub, page, limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get report statistics (admin only)' })
  @ApiResponse({ status: 200, type: ReportStatsDto })
  async getReportStats(): Promise<ReportStatsDto> {
    return this.reportsService.getReportStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get report by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.reportsService.getReportById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update report status (admin only)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req: any,
  ): Promise<ReportResponseDto> {
    return this.reportsService.updateReport(id, req.user.sub, updateReportDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a report (admin only)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 204, description: 'Report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReport(@Param('id') id: string): Promise<void> {
    return this.reportsService.deleteReport(id);
  }
}
