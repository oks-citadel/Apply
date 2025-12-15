import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
  StreamableFile,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { BulkImportUsersDto } from './dto/bulk-import-users.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePlacementDto } from './dto/create-placement.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { ExportUtil } from './utils/export.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantLicenseGuard } from './guards/tenant-license.guard';

@ApiTags('Tenants')
@Controller('api/v1/tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantController {
  private readonly logger = new Logger(TenantController.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly exportUtil: ExportUtil,
  ) {}

  /**
   * Create a new tenant organization
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant organization' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tenant created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tenant slug already exists',
  })
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    this.logger.log(`Creating tenant: ${createTenantDto.name}`);

    const tenant = await this.tenantService.createTenant(createTenantDto);

    return {
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
    };
  }

  /**
   * Get tenant by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  async getTenant(@Param('id') id: string) {
    const tenant = await this.tenantService.getTenantById(id);

    return {
      success: true,
      data: tenant,
    };
  }

  /**
   * Update tenant
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant updated successfully',
  })
  async updateTenant(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    this.logger.log(`Updating tenant: ${id}`);

    const tenant = await this.tenantService.updateTenant(id, updateTenantDto);

    return {
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
    };
  }

  /**
   * Bulk import users
   */
  @Post(':id/users/bulk')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Bulk import users to tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users imported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User limit exceeded or feature not available',
  })
  async bulkImportUsers(@Param('id') id: string, @Body() bulkImportDto: BulkImportUsersDto) {
    this.logger.log(`Bulk importing ${bulkImportDto.users.length} users to tenant: ${id}`);

    const results = await this.tenantService.bulkImportUsers(id, bulkImportDto);

    return {
      success: true,
      message: 'Bulk import completed',
      data: results,
    };
  }

  /**
   * Get tenant analytics
   */
  @Get(':id/analytics')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Get tenant analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
  })
  async getAnalytics(@Param('id') id: string, @Query() query: AnalyticsQueryDto) {
    this.logger.log(`Getting analytics for tenant: ${id}`);

    const analytics = await this.tenantService.getTenantAnalytics(id, query);

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Export analytics to CSV
   */
  @Get(':id/analytics/export/csv')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Export analytics to CSV' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV export generated successfully',
  })
  async exportAnalyticsCSV(@Param('id') id: string, @Query() query: AnalyticsQueryDto, @Res() res: Response) {
    this.logger.log(`Exporting analytics to CSV for tenant: ${id}`);

    const analytics = await this.tenantService.getTenantAnalytics(id, query);

    let csv: string;
    let filename: string;

    // Generate appropriate CSV based on analytics type
    if (analytics.placements) {
      csv = this.exportUtil.convertPlacementToCSV(analytics.placements);
      filename = `placement-analytics-${id}-${Date.now()}.csv`;
    } else if (analytics.users) {
      csv = this.exportUtil.convertUsersToCSV(analytics.users);
      filename = `user-analytics-${id}-${Date.now()}.csv`;
    } else if (analytics.departments) {
      csv = this.exportUtil.convertDepartmentsToCSV(analytics.departments);
      filename = `department-analytics-${id}-${Date.now()}.csv`;
    } else {
      csv = this.exportUtil.convertToCSV([analytics]);
      filename = `analytics-${id}-${Date.now()}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export analytics to PDF
   */
  @Get(':id/analytics/export/pdf')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Export analytics to PDF' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF export generated successfully',
  })
  async exportAnalyticsPDF(@Param('id') id: string, @Query() query: AnalyticsQueryDto, @Res() res: Response) {
    this.logger.log(`Exporting analytics to PDF for tenant: ${id}`);

    const analytics = await this.tenantService.getTenantAnalytics(id, query);

    const report = this.exportUtil.generatePlacementReport(analytics);
    const pdf = this.exportUtil.generateSimplePDF('Tenant Analytics Report', report);

    const filename = `analytics-report-${id}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  }

  /**
   * Update tenant branding
   */
  @Put(':id/branding')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Update tenant branding configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branding updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'White-labeling not available in current license',
  })
  async updateBranding(@Param('id') id: string, @Body() updateBrandingDto: UpdateBrandingDto) {
    this.logger.log(`Updating branding for tenant: ${id}`);

    const tenant = await this.tenantService.updateBranding(id, updateBrandingDto);

    return {
      success: true,
      message: 'Branding updated successfully',
      data: {
        id: tenant.id,
        logo_url: tenant.logo_url,
        primary_color: tenant.primary_color,
        secondary_color: tenant.secondary_color,
        custom_domain: tenant.custom_domain,
        branding_settings: tenant.branding_settings,
      },
    };
  }

  /**
   * Create department
   */
  @Post(':id/departments')
  @ApiOperation({ summary: 'Create a department within tenant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Department created successfully',
  })
  async createDepartment(@Param('id') id: string, @Body() createDepartmentDto: CreateDepartmentDto) {
    this.logger.log(`Creating department for tenant: ${id}`);

    const department = await this.tenantService.createDepartment(id, createDepartmentDto);

    return {
      success: true,
      message: 'Department created successfully',
      data: department,
    };
  }

  /**
   * Get departments
   */
  @Get(':id/departments')
  @ApiOperation({ summary: 'Get all departments in tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departments retrieved successfully',
  })
  async getDepartments(@Param('id') id: string) {
    const departments = await this.tenantService.getDepartments(id);

    return {
      success: true,
      data: departments,
    };
  }

  /**
   * Get department analytics
   */
  @Get(':id/departments/:departmentId/analytics')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Get department-specific analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department analytics retrieved successfully',
  })
  async getDepartmentAnalytics(@Param('id') id: string, @Param('departmentId') departmentId: string) {
    this.logger.log(`Getting analytics for department ${departmentId} in tenant: ${id}`);

    const analytics = await this.tenantService.getTenantAnalytics(id, {
      type: 'department' as any,
      department_id: departmentId,
    });

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Create placement tracking record
   */
  @Post(':id/placements')
  @ApiOperation({ summary: 'Create placement tracking record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Placement record created successfully',
  })
  async createPlacement(@Param('id') id: string, @Body() createPlacementDto: CreatePlacementDto) {
    this.logger.log(`Creating placement record for tenant: ${id}`);

    const placement = await this.tenantService.createPlacement(id, createPlacementDto);

    return {
      success: true,
      message: 'Placement record created successfully',
      data: placement,
    };
  }

  /**
   * Get placements by cohort
   */
  @Get(':id/cohorts/:cohort/placements')
  @ApiOperation({ summary: 'Get placement records for a cohort' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Placement records retrieved successfully',
  })
  async getPlacementsByCohort(@Param('id') id: string, @Param('cohort') cohort: string) {
    const placements = await this.tenantService.getPlacementsByCohort(id, cohort);

    return {
      success: true,
      data: placements,
    };
  }

  /**
   * Get cohort analytics
   */
  @Get(':id/cohorts/:cohort/analytics')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Get cohort-specific analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cohort analytics retrieved successfully',
  })
  async getCohortAnalytics(
    @Param('id') id: string,
    @Param('cohort') cohort: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(`Getting analytics for cohort ${cohort} in tenant: ${id}`);

    const analytics = await this.tenantService.getTenantAnalytics(id, {
      ...query,
      type: 'cohort' as any,
      cohort,
    });

    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get all cohorts (distinct cohorts from placements)
   */
  @Get(':id/cohorts')
  @ApiOperation({ summary: 'Get all cohorts in tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cohorts retrieved successfully',
  })
  async getCohorts(@Param('id') id: string) {
    // This would query distinct cohorts from placement tracking
    // Implementation simplified for brevity
    return {
      success: true,
      message: 'Cohorts endpoint - implementation depends on your cohort management strategy',
      data: [],
    };
  }

  /**
   * Export cohort placements to CSV
   */
  @Get(':id/cohorts/:cohort/export/csv')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Export cohort placements to CSV' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV export generated successfully',
  })
  async exportCohortCSV(@Param('id') id: string, @Param('cohort') cohort: string, @Res() res: Response) {
    this.logger.log(`Exporting cohort ${cohort} to CSV for tenant: ${id}`);

    const placements = await this.tenantService.getPlacementsByCohort(id, cohort);

    const csv = this.exportUtil.convertPlacementToCSV(placements);
    const filename = `cohort-${cohort}-placements-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Get tenant license information
   */
  @Get(':id/license')
  @ApiOperation({ summary: 'Get tenant license information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'License information retrieved successfully',
  })
  async getLicense(@Param('id') id: string) {
    const license = await this.tenantService.getTenantLicense(id);

    return {
      success: true,
      data: license,
    };
  }

  /**
   * Check API rate limits
   */
  @Get(':id/rate-limits')
  @ApiOperation({ summary: 'Get current API rate limit status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rate limit status retrieved successfully',
  })
  async getRateLimits(@Param('id') id: string) {
    const license = await this.tenantService.getTenantLicense(id);

    return {
      success: true,
      data: {
        limits: license.rate_limits,
        usage: {
          api_calls_today: license.api_calls_today,
          applications_this_month: license.applications_this_month,
          storage_used_gb: license.storage_used_gb,
        },
        maxLimits: {
          max_api_calls_per_day: license.max_api_calls_per_day,
          max_applications_per_month: license.max_applications_per_month,
          max_storage_gb: license.max_storage_gb,
          max_users: license.max_users,
        },
        current_users: license.current_users,
      },
    };
  }

  /**
   * Get tenant users
   */
  @Get(':id/users')
  @ApiOperation({ summary: 'Get all users in tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async getTenantUsers(@Param('id') id: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const analytics = await this.tenantService.getTenantAnalytics(id, {
      type: 'user_activity' as any,
      limit: limit || 100,
      offset: offset || 0,
    });

    return {
      success: true,
      data: analytics.users || [],
      summary: analytics.summary,
    };
  }

  /**
   * Export users to CSV
   */
  @Get(':id/users/export/csv')
  @UseGuards(TenantLicenseGuard)
  @ApiOperation({ summary: 'Export tenant users to CSV' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV export generated successfully',
  })
  async exportUsersCSV(@Param('id') id: string, @Res() res: Response) {
    this.logger.log(`Exporting users to CSV for tenant: ${id}`);

    const analytics = await this.tenantService.getTenantAnalytics(id, {
      type: 'user_activity' as any,
      limit: 10000, // Large limit for export
    });

    const csv = this.exportUtil.convertUsersToCSV(analytics.users || []);
    const filename = `tenant-users-${id}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
