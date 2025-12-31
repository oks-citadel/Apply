import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RevenueMetricsService, RevenueMetrics, MrrByPlan, RevenueTrendPoint } from './revenue-metrics.service';

@ApiTags('Revenue Metrics')
@Controller('revenue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Require authentication for revenue metrics - admin only
export class RevenueController {
  constructor(private readonly revenueMetricsService: RevenueMetricsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get comprehensive revenue metrics' })
  @ApiResponse({ status: 200, description: 'Revenue metrics' })
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    return this.revenueMetricsService.getRevenueMetrics();
  }

  @Get('mrr')
  @ApiOperation({ summary: 'Get current MRR' })
  @ApiResponse({ status: 200, description: 'Current MRR value' })
  async getMrr(): Promise<{ mrr: number; currency: string }> {
    const mrr = await this.revenueMetricsService.calculateMrr();
    return { mrr, currency: 'USD' };
  }

  @Get('arr')
  @ApiOperation({ summary: 'Get current ARR' })
  @ApiResponse({ status: 200, description: 'Current ARR value' })
  async getArr(): Promise<{ arr: number; currency: string }> {
    const arr = await this.revenueMetricsService.calculateArr();
    return { arr, currency: 'USD' };
  }

  @Get('mrr-by-plan')
  @ApiOperation({ summary: 'Get MRR breakdown by plan' })
  @ApiResponse({ status: 200, description: 'MRR by plan' })
  async getMrrByPlan(): Promise<MrrByPlan[]> {
    return this.revenueMetricsService.getMrrByPlan();
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get revenue trend over time' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months (default: 12)' })
  @ApiResponse({ status: 200, description: 'Revenue trend' })
  async getRevenueTrend(@Query('months') months?: string): Promise<RevenueTrendPoint[]> {
    return this.revenueMetricsService.getRevenueTrend(parseInt(months || '12', 10));
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get revenue forecast' })
  @ApiQuery({ name: 'months', required: false, description: 'Forecast months (default: 6)' })
  @ApiResponse({ status: 200, description: 'Revenue forecast' })
  async getRevenueForecast(@Query('months') months?: string): Promise<RevenueTrendPoint[]> {
    return this.revenueMetricsService.getRevenueForecast(parseInt(months || '6', 10));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get quick revenue summary for dashboard' })
  @ApiResponse({ status: 200, description: 'Revenue summary' })
  async getRevenueSummary(): Promise<{
    mrr: number;
    arr: number;
    activeSubscribers: number;
    mrrGrowth: number;
    churnRate: number;
  }> {
    const metrics = await this.revenueMetricsService.getRevenueMetrics();
    return {
      mrr: metrics.mrr,
      arr: metrics.arr,
      activeSubscribers: metrics.totalActiveSubscribers,
      mrrGrowth: metrics.netMrrGrowthRate,
      churnRate: metrics.churnRate,
    };
  }
}
