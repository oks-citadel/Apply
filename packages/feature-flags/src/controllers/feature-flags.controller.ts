import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FeatureFlagService } from '../services/feature-flag.service';
import { FeatureFlagAdminService } from '../services/feature-flag-admin.service';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../dto/update-feature-flag.dto';
import { ManageUsersDto } from '../dto/manage-users.dto';
import { SetRolloutDto } from '../dto/set-rollout.dto';

/**
 * Feature Flags Controller
 * Public endpoints for checking feature flags
 */
@Controller('features')
export class FeatureFlagsController {
  constructor(
    private readonly featureFlagService: FeatureFlagService,
    private readonly adminService: FeatureFlagAdminService,
  ) {}

  /**
   * Get all enabled features for the current user
   * GET /api/features
   */
  @Get()
  async getEnabledFeatures(@Request() req) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      // Return global features only
      const allFlags = await this.featureFlagService.getAllFlags();
      return allFlags
        .filter((flag) => flag.defaultValue)
        .map((flag) => ({
          key: flag.key,
          name: flag.name,
          description: flag.description,
        }));
    }

    const enabledFlags = await this.featureFlagService.getEnabledFlagsForUser(
      userId,
    );
    const allFlags = await this.featureFlagService.getAllFlags();

    return enabledFlags.map((flagKey) => {
      const flag = allFlags.find((f) => f.key === flagKey);
      return {
        key: flagKey,
        name: flag?.name || flagKey,
        description: flag?.description,
      };
    });
  }

  /**
   * Check if a specific feature is enabled
   * GET /api/features/:flagKey
   */
  @Get(':flagKey')
  async isFeatureEnabled(@Param('flagKey') flagKey: string, @Request() req) {
    const userId = req.user?.id || req.user?.sub;
    const isEnabled = await this.featureFlagService.isEnabled(flagKey, {
      userId,
    });

    return {
      flagKey,
      enabled: isEnabled,
    };
  }

  /**
   * Get detailed evaluation for a feature
   * GET /api/features/:flagKey/evaluate
   */
  @Get(':flagKey/evaluate')
  async evaluateFeature(@Param('flagKey') flagKey: string, @Request() req) {
    const userId = req.user?.id || req.user?.sub;
    return this.featureFlagService.evaluate(flagKey, { userId });
  }
}

/**
 * Admin Feature Flags Controller
 * Admin-only endpoints for managing feature flags
 */
@Controller('admin/features')
export class FeatureFlagsAdminController {
  constructor(
    private readonly featureFlagService: FeatureFlagService,
    private readonly adminService: FeatureFlagAdminService,
  ) {}

  /**
   * Get all feature flags with statistics
   * GET /api/admin/features
   */
  @Get()
  async getAllFlags() {
    return this.adminService.getAllFlagsWithStats();
  }

  /**
   * Get a specific feature flag
   * GET /api/admin/features/:flagKey
   */
  @Get(':flagKey')
  async getFlag(@Param('flagKey') flagKey: string) {
    return this.featureFlagService.getFlag(flagKey);
  }

  /**
   * Create a new feature flag
   * POST /api/admin/features
   */
  @Post()
  async createFlag(@Body() dto: CreateFeatureFlagDto, @Request() req) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.createFlag(dto, adminId);
  }

  /**
   * Update a feature flag
   * PUT /api/admin/features/:flagKey
   */
  @Put(':flagKey')
  async updateFlag(
    @Param('flagKey') flagKey: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Request() req,
  ) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.updateFlag(flagKey, dto, adminId);
  }

  /**
   * Delete a feature flag
   * DELETE /api/admin/features/:flagKey
   */
  @Delete(':flagKey')
  async deleteFlag(@Param('flagKey') flagKey: string, @Request() req) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    await this.adminService.deleteFlag(flagKey, adminId);
    return { message: 'Feature flag deleted successfully' };
  }

  /**
   * Enable a feature flag
   * POST /api/admin/features/:flagKey/enable
   */
  @Post(':flagKey/enable')
  async enableFlag(@Param('flagKey') flagKey: string, @Request() req) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.enableFlag(flagKey, adminId);
  }

  /**
   * Disable a feature flag
   * POST /api/admin/features/:flagKey/disable
   */
  @Post(':flagKey/disable')
  async disableFlag(@Param('flagKey') flagKey: string, @Request() req) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.disableFlag(flagKey, adminId);
  }

  /**
   * Set percentage rollout
   * POST /api/admin/features/:flagKey/rollout
   */
  @Post(':flagKey/rollout')
  async setRollout(
    @Param('flagKey') flagKey: string,
    @Body() dto: SetRolloutDto,
    @Request() req,
  ) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.setRolloutPercentage(
      flagKey,
      dto.percentage,
      adminId,
    );
  }

  /**
   * Enable feature for specific users
   * POST /api/admin/features/:flagKey/users/enable
   */
  @Post(':flagKey/users/enable')
  async enableForUsers(
    @Param('flagKey') flagKey: string,
    @Body() dto: ManageUsersDto,
    @Request() req,
  ) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.enableForUsers(flagKey, dto.userIds, adminId);
  }

  /**
   * Disable feature for specific users
   * POST /api/admin/features/:flagKey/users/disable
   */
  @Post(':flagKey/users/disable')
  async disableForUsers(
    @Param('flagKey') flagKey: string,
    @Body() dto: ManageUsersDto,
    @Request() req,
  ) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.disableForUsers(flagKey, dto.userIds, adminId);
  }

  /**
   * Remove users from feature flag lists
   * DELETE /api/admin/features/:flagKey/users
   */
  @Delete(':flagKey/users')
  async removeUsers(
    @Param('flagKey') flagKey: string,
    @Body() dto: ManageUsersDto,
    @Request() req,
  ) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    return this.adminService.removeUsers(flagKey, dto.userIds, adminId);
  }

  /**
   * Initialize default feature flags
   * POST /api/admin/features/initialize
   */
  @Post('initialize/defaults')
  async initializeDefaults(@Request() req) {
    const adminId = req.user?.id || req.user?.sub || 'system';
    await this.adminService.initializeDefaultFlags(adminId);
    return { message: 'Default feature flags initialized' };
  }

  /**
   * Refresh all feature flags cache
   * POST /api/admin/features/refresh
   */
  @Post('refresh/all')
  async refreshAll() {
    await this.featureFlagService.refreshAll();
    return { message: 'Feature flags cache refreshed' };
  }
}
