import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, MoreThan } from 'typeorm';
import { randomBytes } from 'crypto';
import { Tenant } from './entities/tenant.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { TenantLicense } from './entities/tenant-license.entity';
import { TenantDepartment } from './entities/tenant-department.entity';
import { PlacementTracking } from './entities/placement-tracking.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { BulkImportUsersDto } from './dto/bulk-import-users.dto';
import { AnalyticsQueryDto, AnalyticsType, TimeRange } from './dto/analytics-query.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePlacementDto } from './dto/create-placement.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { TenantStatus, LicenseType } from './enums/tenant-type.enum';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(TenantLicense)
    private readonly tenantLicenseRepository: Repository<TenantLicense>,
    @InjectRepository(TenantDepartment)
    private readonly tenantDepartmentRepository: Repository<TenantDepartment>,
    @InjectRepository(PlacementTracking)
    private readonly placementTrackingRepository: Repository<PlacementTracking>,
  ) {}

  /**
   * Create a new tenant organization
   */
  async createTenant(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check if slug is already taken
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: createTenantDto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      name: createTenantDto.name,
      slug: createTenantDto.slug,
      type: createTenantDto.type,
      description: createTenantDto.description,
      industry: createTenantDto.industry,
      website: createTenantDto.website,
      admin_email: createTenantDto.admin_email,
      admin_phone: createTenantDto.admin_phone,
      billing_email: createTenantDto.billing_email || createTenantDto.admin_email,
      branding_settings: createTenantDto.branding_settings,
      status: TenantStatus.TRIAL,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      api_key: this.generateApiKey(),
      api_secret: this.generateApiSecret(),
      api_enabled: false,
      user_count: 0,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Create license
    await this.createTenantLicense(savedTenant.id, createTenantDto.license_type);

    this.logger.log(`Tenant created: ${savedTenant.id} (${savedTenant.name})`);

    return savedTenant;
  }

  /**
   * Create tenant license
   */
  private async createTenantLicense(tenantId: string, licenseType: LicenseType): Promise<TenantLicense> {
    const licenseConfig = this.getLicenseConfig(licenseType);

    const license = this.tenantLicenseRepository.create({
      tenant_id: tenantId,
      license_type: licenseType,
      status: 'active',
      is_trial: true,
      trial_start_date: new Date(),
      trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...licenseConfig,
    });

    return await this.tenantLicenseRepository.save(license);
  }

  /**
   * Get license configuration based on type
   */
  private getLicenseConfig(licenseType: LicenseType) {
    const configs = {
      [LicenseType.STARTER]: {
        monthly_price: 99,
        annual_price: 990,
        max_users: 10,
        max_applications_per_month: 500,
        max_api_calls_per_day: 1000,
        max_storage_gb: 10,
        features: {
          bulkImport: true,
          advancedAnalytics: false,
          whiteLabeling: false,
          ssoIntegration: false,
          apiAccess: false,
          prioritySupport: false,
          customIntegrations: false,
          dedicatedAccountManager: false,
          dataExport: true,
          auditLogs: false,
          customReports: false,
          mobileApp: true,
          aiFeatures: true,
        },
        rate_limits: {
          apiCallsPerMinute: 10,
          apiCallsPerHour: 100,
          apiCallsPerDay: 1000,
          bulkImportPerDay: 1,
          concurrentUsers: 10,
        },
      },
      [LicenseType.PROFESSIONAL]: {
        monthly_price: 299,
        annual_price: 2990,
        max_users: 50,
        max_applications_per_month: 5000,
        max_api_calls_per_day: 10000,
        max_storage_gb: 100,
        features: {
          bulkImport: true,
          advancedAnalytics: true,
          whiteLabeling: true,
          ssoIntegration: true,
          apiAccess: true,
          prioritySupport: true,
          customIntegrations: false,
          dedicatedAccountManager: false,
          dataExport: true,
          auditLogs: true,
          customReports: true,
          mobileApp: true,
          aiFeatures: true,
        },
        rate_limits: {
          apiCallsPerMinute: 60,
          apiCallsPerHour: 1000,
          apiCallsPerDay: 10000,
          bulkImportPerDay: 10,
          concurrentUsers: 50,
        },
      },
      [LicenseType.ENTERPRISE]: {
        monthly_price: 999,
        annual_price: 9990,
        max_users: null, // unlimited
        max_applications_per_month: null,
        max_api_calls_per_day: null,
        max_storage_gb: null,
        features: {
          bulkImport: true,
          advancedAnalytics: true,
          whiteLabeling: true,
          ssoIntegration: true,
          apiAccess: true,
          prioritySupport: true,
          customIntegrations: true,
          dedicatedAccountManager: true,
          dataExport: true,
          auditLogs: true,
          customReports: true,
          mobileApp: true,
          aiFeatures: true,
        },
        rate_limits: {
          apiCallsPerMinute: 1000,
          apiCallsPerHour: 10000,
          apiCallsPerDay: 100000,
          bulkImportPerDay: 100,
          concurrentUsers: null,
        },
      },
      [LicenseType.UNIVERSITY_BASIC]: {
        monthly_price: 499,
        annual_price: 4990,
        max_users: 500,
        max_applications_per_month: 10000,
        max_api_calls_per_day: 5000,
        max_storage_gb: 200,
        features: {
          bulkImport: true,
          advancedAnalytics: true,
          whiteLabeling: true,
          ssoIntegration: true,
          apiAccess: false,
          prioritySupport: true,
          customIntegrations: false,
          dedicatedAccountManager: false,
          dataExport: true,
          auditLogs: true,
          customReports: true,
          mobileApp: true,
          aiFeatures: true,
          placementTracking: true,
          cohortManagement: true,
          resumeTemplates: true,
          careerCenterDashboard: true,
        },
        rate_limits: {
          apiCallsPerMinute: 30,
          apiCallsPerHour: 500,
          apiCallsPerDay: 5000,
          bulkImportPerDay: 20,
          concurrentUsers: 500,
        },
      },
      [LicenseType.UNIVERSITY_PRO]: {
        monthly_price: 1499,
        annual_price: 14990,
        max_users: null,
        max_applications_per_month: null,
        max_api_calls_per_day: null,
        max_storage_gb: null,
        features: {
          bulkImport: true,
          advancedAnalytics: true,
          whiteLabeling: true,
          ssoIntegration: true,
          apiAccess: true,
          prioritySupport: true,
          customIntegrations: true,
          dedicatedAccountManager: true,
          dataExport: true,
          auditLogs: true,
          customReports: true,
          mobileApp: true,
          aiFeatures: true,
          placementTracking: true,
          cohortManagement: true,
          resumeTemplates: true,
          careerCenterDashboard: true,
        },
        rate_limits: {
          apiCallsPerMinute: 1000,
          apiCallsPerHour: 10000,
          apiCallsPerDay: 100000,
          bulkImportPerDay: null,
          concurrentUsers: null,
        },
      },
    };

    return configs[licenseType];
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['license', 'departments'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);

    Object.assign(tenant, updateTenantDto);

    return await this.tenantRepository.save(tenant);
  }

  /**
   * Bulk import users
   */
  async bulkImportUsers(tenantId: string, bulkImportDto: BulkImportUsersDto) {
    const tenant = await this.getTenantById(tenantId);
    const license = await this.getTenantLicense(tenantId);

    // Check license limits
    if (license.max_users !== null) {
      const totalUsers = license.current_users + bulkImportDto.users.length;
      if (totalUsers > license.max_users) {
        throw new ForbiddenException(
          `User limit exceeded. Your license allows ${license.max_users} users, but you're trying to add ${bulkImportDto.users.length} more (current: ${license.current_users})`,
        );
      }
    }

    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const userData of bulkImportDto.users) {
      try {
        // Check if user already exists
        const existingUser = await this.tenantUserRepository.findOne({
          where: {
            tenant_id: tenantId,
            user_id: userData.email, // This should be replaced with actual user_id lookup
          },
        });

        if (existingUser) {
          if (bulkImportDto.skip_duplicates) {
            results.skipped.push({
              email: userData.email,
              reason: 'User already exists in tenant',
            });
            continue;
          } else {
            results.failed.push({
              email: userData.email,
              reason: 'User already exists in tenant',
            });
            continue;
          }
        }

        // Find or create department if specified
        let departmentId = null;
        if (userData.department) {
          const department = await this.tenantDepartmentRepository.findOne({
            where: { tenant_id: tenantId, name: userData.department },
          });

          if (department) {
            departmentId = department.id;
          } else {
            // Create department if it doesn't exist
            const newDepartment = await this.createDepartment(tenantId, {
              name: userData.department,
            });
            departmentId = newDepartment.id;
          }
        }

        // Create tenant user association
        // Note: This assumes user already exists in the system
        // In production, you'd need to create the user first or send invitation
        const tenantUser = this.tenantUserRepository.create({
          tenant_id: tenantId,
          user_id: userData.email, // Temporary - should be actual user ID
          department_id: departmentId,
          role: userData.role,
          job_title: userData.job_title,
          employee_id: userData.employee_id,
          student_id: userData.student_id,
          cohort: userData.cohort,
          graduation_year: userData.graduation_year,
          major: userData.major,
          invited_at: new Date(),
        });

        await this.tenantUserRepository.save(tenantUser);

        results.success.push({
          email: userData.email,
          name: userData.full_name,
        });

        // Update user count
        await this.incrementUserCount(tenantId);
      } catch (error) {
        this.logger.error(`Failed to import user ${userData.email}: ${error.message}`);
        results.failed.push({
          email: userData.email,
          reason: error.message,
        });
      }
    }

    this.logger.log(
      `Bulk import completed for tenant ${tenantId}: ${results.success.length} success, ${results.failed.length} failed, ${results.skipped.length} skipped`,
    );

    return results;
  }

  /**
   * Get tenant analytics
   */
  async getTenantAnalytics(tenantId: string, query: AnalyticsQueryDto) {
    const tenant = await this.getTenantById(tenantId);

    // Determine date range
    const { startDate, endDate } = this.getDateRange(query.time_range, query.start_date, query.end_date);

    switch (query.type) {
      case AnalyticsType.PLACEMENT:
        return await this.getPlacementAnalytics(tenantId, startDate, endDate, query);

      case AnalyticsType.USER_ACTIVITY:
        return await this.getUserActivityAnalytics(tenantId, startDate, endDate, query);

      case AnalyticsType.DEPARTMENT:
        return await this.getDepartmentAnalytics(tenantId, query.department_id);

      case AnalyticsType.COHORT:
        return await this.getCohortAnalytics(tenantId, query.cohort, startDate, endDate);

      default:
        return await this.getOverallAnalytics(tenantId, startDate, endDate);
    }
  }

  /**
   * Get placement analytics
   */
  private async getPlacementAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ) {
    const whereClause: any = {
      tenant_id: tenantId,
      placement_date: Between(startDate, endDate),
    };

    if (query.cohort) {
      whereClause.cohort = query.cohort;
    }

    if (query.graduation_year) {
      whereClause.graduation_year = query.graduation_year;
    }

    const placements = await this.placementTrackingRepository.find({
      where: whereClause,
      take: query.limit || 100,
      skip: query.offset || 0,
    });

    const totalPlacements = placements.filter((p) => p.placement_status === 'placed').length;
    const totalGraduates = placements.length;

    const placementRate = totalGraduates > 0 ? (totalPlacements / totalGraduates) * 100 : 0;

    const averageSalary =
      placements
        .filter((p) => p.salary)
        .reduce((sum, p) => sum + Number(p.salary), 0) / placements.filter((p) => p.salary).length || 0;

    const averageDaysToPlacement =
      placements
        .filter((p) => p.days_to_placement)
        .reduce((sum, p) => sum + p.days_to_placement, 0) /
        placements.filter((p) => p.days_to_placement).length || 0;

    // Group by industry
    const byIndustry = placements.reduce((acc, p) => {
      if (p.industry) {
        acc[p.industry] = (acc[p.industry] || 0) + 1;
      }
      return acc;
    }, {});

    // Group by employment type
    const byEmploymentType = placements.reduce((acc, p) => {
      if (p.employment_type) {
        acc[p.employment_type] = (acc[p.employment_type] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      summary: {
        totalGraduates,
        totalPlacements,
        placementRate: placementRate.toFixed(2),
        averageSalary: averageSalary.toFixed(2),
        averageDaysToPlacement: averageDaysToPlacement.toFixed(0),
      },
      byIndustry,
      byEmploymentType,
      placements,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Get user activity analytics
   */
  private async getUserActivityAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    query: AnalyticsQueryDto,
  ) {
    const whereClause: any = {
      tenant_id: tenantId,
      created_at: Between(startDate, endDate),
    };

    if (query.department_id) {
      whereClause.department_id = query.department_id;
    }

    const users = await this.tenantUserRepository.find({
      where: whereClause,
      take: query.limit || 100,
      skip: query.offset || 0,
    });

    const activeUsers = users.filter((u) => u.is_active).length;
    const inactiveUsers = users.length - activeUsers;

    const byRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
      },
      byRole,
      users: users.map((u) => ({
        id: u.id,
        user_id: u.user_id,
        role: u.role,
        department_id: u.department_id,
        is_active: u.is_active,
        joined_at: u.joined_at,
      })),
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Get department analytics
   */
  private async getDepartmentAnalytics(tenantId: string, departmentId?: string) {
    const whereClause: any = { tenant_id: tenantId };

    if (departmentId) {
      whereClause.id = departmentId;
    }

    const departments = await this.tenantDepartmentRepository.find({
      where: whereClause,
      relations: ['users'],
    });

    return {
      departments: departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        headcount: dept.headcount,
        target_headcount: dept.target_headcount,
        total_applications: dept.total_applications,
        successful_placements: dept.successful_placements,
        placement_rate: dept.placement_rate,
        average_salary_placed: dept.average_salary_placed,
        is_active: dept.is_active,
      })),
    };
  }

  /**
   * Get cohort analytics
   */
  private async getCohortAnalytics(tenantId: string, cohort: string, startDate: Date, endDate: Date) {
    const placements = await this.placementTrackingRepository.find({
      where: {
        tenant_id: tenantId,
        cohort: cohort,
        placement_date: Between(startDate, endDate),
      },
    });

    const totalStudents = placements.length;
    const placedStudents = placements.filter((p) => p.placement_status === 'placed').length;
    const placementRate = totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0;

    return {
      cohort,
      totalStudents,
      placedStudents,
      placementRate: placementRate.toFixed(2),
      placements,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Get overall analytics
   */
  private async getOverallAnalytics(tenantId: string, startDate: Date, endDate: Date) {
    const tenant = await this.getTenantById(tenantId);

    const totalUsers = await this.tenantUserRepository.count({
      where: { tenant_id: tenantId },
    });

    const totalDepartments = await this.tenantDepartmentRepository.count({
      where: { tenant_id: tenantId },
    });

    const totalPlacements = await this.placementTrackingRepository.count({
      where: {
        tenant_id: tenantId,
        placement_date: Between(startDate, endDate),
      },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
      },
      summary: {
        totalUsers,
        totalDepartments,
        totalPlacements,
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Update tenant branding
   */
  async updateBranding(tenantId: string, updateBrandingDto: UpdateBrandingDto): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    const license = await this.getTenantLicense(tenantId);

    // Check if white-labeling is enabled
    if (!license.features?.whiteLabeling) {
      throw new ForbiddenException('White-labeling is not available in your current license');
    }

    tenant.logo_url = updateBrandingDto.logo_url || tenant.logo_url;
    tenant.primary_color = updateBrandingDto.primary_color || tenant.primary_color;
    tenant.secondary_color = updateBrandingDto.secondary_color || tenant.secondary_color;
    tenant.custom_domain = updateBrandingDto.custom_domain || tenant.custom_domain;

    if (updateBrandingDto.branding_settings) {
      tenant.branding_settings = {
        ...tenant.branding_settings,
        ...updateBrandingDto.branding_settings,
      };
    }

    return await this.tenantRepository.save(tenant);
  }

  /**
   * Create department
   */
  async createDepartment(tenantId: string, createDepartmentDto: CreateDepartmentDto): Promise<TenantDepartment> {
    const tenant = await this.getTenantById(tenantId);

    const department = this.tenantDepartmentRepository.create({
      tenant_id: tenantId,
      ...createDepartmentDto,
    });

    return await this.tenantDepartmentRepository.save(department);
  }

  /**
   * Get departments
   */
  async getDepartments(tenantId: string): Promise<TenantDepartment[]> {
    return await this.tenantDepartmentRepository.find({
      where: { tenant_id: tenantId },
      relations: ['users'],
    });
  }

  /**
   * Create placement tracking record
   */
  async createPlacement(tenantId: string, createPlacementDto: CreatePlacementDto): Promise<PlacementTracking> {
    const tenant = await this.getTenantById(tenantId);

    // Calculate days to placement if both dates are provided
    let daysToPlacement = null;
    if (createPlacementDto.graduation_date && createPlacementDto.placement_date) {
      const gradDate = new Date(createPlacementDto.graduation_date);
      const placeDate = new Date(createPlacementDto.placement_date);
      daysToPlacement = Math.floor((placeDate.getTime() - gradDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const placement = this.placementTrackingRepository.create({
      tenant_id: tenantId,
      ...createPlacementDto,
      days_to_placement: daysToPlacement,
    });

    return await this.placementTrackingRepository.save(placement);
  }

  /**
   * Get placements by cohort
   */
  async getPlacementsByCohort(tenantId: string, cohort: string): Promise<PlacementTracking[]> {
    return await this.placementTrackingRepository.find({
      where: {
        tenant_id: tenantId,
        cohort,
      },
      order: {
        placement_date: 'DESC',
      },
    });
  }

  /**
   * Get tenant license
   */
  async getTenantLicense(tenantId: string): Promise<TenantLicense> {
    const license = await this.tenantLicenseRepository.findOne({
      where: { tenant_id: tenantId },
    });

    if (!license) {
      throw new NotFoundException('Tenant license not found');
    }

    return license;
  }

  /**
   * Check license limit
   */
  async checkLicenseLimit(tenantId: string, limitType: string, currentUsage: number): Promise<boolean> {
    const license = await this.getTenantLicense(tenantId);

    switch (limitType) {
      case 'users':
        return license.max_users === null || currentUsage < license.max_users;
      case 'applications':
        return license.max_applications_per_month === null || currentUsage < license.max_applications_per_month;
      case 'api_calls':
        return license.max_api_calls_per_day === null || currentUsage < license.max_api_calls_per_day;
      case 'storage':
        return license.max_storage_gb === null || currentUsage < license.max_storage_gb;
      default:
        return true;
    }
  }

  /**
   * Increment usage counters
   */
  async incrementUsage(tenantId: string, usageType: 'applications' | 'api_calls' | 'storage', amount = 1) {
    const license = await this.getTenantLicense(tenantId);

    switch (usageType) {
      case 'applications':
        license.applications_this_month += amount;
        break;
      case 'api_calls':
        license.api_calls_today += amount;
        break;
      case 'storage':
        license.storage_used_gb += amount;
        break;
    }

    await this.tenantLicenseRepository.save(license);
  }

  /**
   * Increment user count
   */
  private async incrementUserCount(tenantId: string) {
    await this.tenantRepository.increment({ id: tenantId }, 'user_count', 1);

    const license = await this.getTenantLicense(tenantId);
    license.current_users += 1;
    await this.tenantLicenseRepository.save(license);
  }

  /**
   * Get date range based on time range
   */
  private getDateRange(timeRange: TimeRange, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (timeRange === TimeRange.CUSTOM && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (timeRange) {
        case TimeRange.WEEK:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.MONTH:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.QUARTER:
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.YEAR:
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return { startDate: start, endDate: end };
  }

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    return `apfu_${randomBytes(24).toString('hex')}`;
  }

  /**
   * Generate API secret
   */
  private generateApiSecret(): string {
    return randomBytes(32).toString('hex');
  }
}
