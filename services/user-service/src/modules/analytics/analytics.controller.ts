import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getDashboardStats(userId);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Get application funnel data' })
  @ApiResponse({ status: 200, description: 'Application funnel data retrieved successfully' })
  async getApplicationFunnelData(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getApplicationFunnelData(userId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent user activity' })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getRecentActivity(
    @CurrentUser('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getRecentActivity(userId, limit || 10);
  }

  @Get('profile-strength')
  @ApiOperation({ summary: 'Get profile strength analysis' })
  @ApiResponse({ status: 200, description: 'Profile strength analysis retrieved successfully' })
  async getProfileStrength(@CurrentUser('userId') userId: string) {
    return this.analyticsService.getProfileStrength(userId);
  }
}
