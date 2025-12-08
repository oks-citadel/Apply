/**
 * Example: Auto Apply Controller with Feature Flags
 * This file demonstrates how to integrate feature flags into the auto-apply controller
 */

import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { FeatureFlag, FeatureFlagGuard, FEATURE_FLAGS } from '@jobpilot/feature-flags';
import { AutoApplyService } from './services/auto-apply.service';
import { UpdateAutoApplySettingsDto } from './dto/auto-apply-settings.dto';

@Controller('auto-apply')
@UseGuards(FeatureFlagGuard) // Apply guard to all routes in this controller
export class AutoApplyController {
  constructor(private readonly autoApplyService: AutoApplyService) {}

  /**
   * Get auto-apply settings
   * Requires FEATURE_AUTO_APPLY to be enabled
   */
  @Get('settings/:userId')
  @FeatureFlag(FEATURE_FLAGS.AUTO_APPLY)
  async getSettings(@Param('userId') userId: string) {
    return this.autoApplyService.getSettings(userId);
  }

  /**
   * Update auto-apply settings
   * Requires FEATURE_AUTO_APPLY to be enabled
   */
  @Put('settings/:userId')
  @FeatureFlag(FEATURE_FLAGS.AUTO_APPLY)
  async updateSettings(
    @Param('userId') userId: string,
    @Body() dto: UpdateAutoApplySettingsDto,
  ) {
    return this.autoApplyService.updateSettings(userId, dto);
  }

  /**
   * Start auto-apply for LinkedIn
   * Requires both FEATURE_AUTO_APPLY and LINKEDIN_AUTO_APPLY_ENABLED
   */
  @Post('start/:userId/linkedin')
  @FeatureFlag(FEATURE_FLAGS.LINKEDIN_AUTO_APPLY)
  async startLinkedInAutoApply(@Param('userId') userId: string) {
    return this.autoApplyService.startAutoApply(userId);
  }

  /**
   * Start auto-apply for Indeed
   * Requires both FEATURE_AUTO_APPLY and INDEED_AUTO_APPLY_ENABLED
   */
  @Post('start/:userId/indeed')
  @FeatureFlag(FEATURE_FLAGS.INDEED_AUTO_APPLY)
  async startIndeedAutoApply(@Param('userId') userId: string) {
    return this.autoApplyService.startAutoApply(userId);
  }

  /**
   * Start auto-apply for Glassdoor
   * Requires both FEATURE_AUTO_APPLY and GLASSDOOR_AUTO_APPLY_ENABLED
   */
  @Post('start/:userId/glassdoor')
  @FeatureFlag(FEATURE_FLAGS.GLASSDOOR_AUTO_APPLY)
  async startGlassdoorAutoApply(@Param('userId') userId: string) {
    return this.autoApplyService.startAutoApply(userId);
  }

  /**
   * Stop auto-apply
   */
  @Post('stop/:userId')
  @FeatureFlag(FEATURE_FLAGS.AUTO_APPLY)
  async stopAutoApply(@Param('userId') userId: string) {
    return this.autoApplyService.stopAutoApply(userId);
  }
}
