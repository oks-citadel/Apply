import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminFeatureFlagUpdate,
  FeatureFlagConfig,
  FeatureFlagStatus,
  FeatureFlagType,
} from '../types';
import { FeatureFlagEntity } from '../entities/feature-flag.entity';
import { FeatureFlagService } from './feature-flag.service';

/**
 * Admin service for managing feature flags
 */
@Injectable()
export class FeatureFlagAdminService {
  private readonly logger = new Logger(FeatureFlagAdminService.name);

  constructor(
    @InjectRepository(FeatureFlagEntity)
    private readonly featureFlagRepository: Repository<FeatureFlagEntity>,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Create a new feature flag
   */
  async createFlag(
    data: Partial<FeatureFlagConfig> & { key: string; name: string },
    adminId: string,
  ): Promise<FeatureFlagConfig> {
    const flag = this.featureFlagRepository.create({
      ...data,
      createdBy: adminId,
      updatedBy: adminId,
    });

    const saved = await this.featureFlagRepository.save(flag);
    await this.featureFlagService.refreshFlag(saved.key);

    this.logger.log(`Feature flag created: ${saved.key} by ${adminId}`);
    return saved.toConfig();
  }

  /**
   * Update an existing feature flag
   */
  async updateFlag(
    flagKey: string,
    update: AdminFeatureFlagUpdate,
    adminId: string,
  ): Promise<FeatureFlagConfig> {
    const flag = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${flagKey}`);
    }

    // Update fields
    if (update.status !== undefined) {
      flag.status = update.status;
    }
    if (update.defaultValue !== undefined) {
      flag.defaultValue = update.defaultValue;
    }
    if (update.rolloutPercentage !== undefined) {
      flag.rolloutPercentage = update.rolloutPercentage;
    }
    if (update.enabledUserIds !== undefined) {
      flag.enabledUserIds = update.enabledUserIds;
    }
    if (update.disabledUserIds !== undefined) {
      flag.disabledUserIds = update.disabledUserIds;
    }
    if (update.description !== undefined) {
      flag.description = update.description;
    }

    flag.updatedBy = adminId;

    const saved = await this.featureFlagRepository.save(flag);
    await this.featureFlagService.refreshFlag(saved.key);

    this.logger.log(`Feature flag updated: ${flagKey} by ${adminId}`);
    return saved.toConfig();
  }

  /**
   * Enable a feature flag
   */
  async enableFlag(flagKey: string, adminId: string): Promise<FeatureFlagConfig> {
    return this.updateFlag(
      flagKey,
      { status: FeatureFlagStatus.ENABLED },
      adminId,
    );
  }

  /**
   * Disable a feature flag
   */
  async disableFlag(flagKey: string, adminId: string): Promise<FeatureFlagConfig> {
    return this.updateFlag(
      flagKey,
      { status: FeatureFlagStatus.DISABLED },
      adminId,
    );
  }

  /**
   * Set percentage rollout for a flag
   */
  async setRolloutPercentage(
    flagKey: string,
    percentage: number,
    adminId: string,
  ): Promise<FeatureFlagConfig> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    const flag = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${flagKey}`);
    }

    // Change type to percentage if not already
    if (flag.type !== FeatureFlagType.PERCENTAGE) {
      flag.type = FeatureFlagType.PERCENTAGE;
    }

    return this.updateFlag(
      flagKey,
      { rolloutPercentage: percentage },
      adminId,
    );
  }

  /**
   * Add users to enabled list
   */
  async enableForUsers(
    flagKey: string,
    userIds: string[],
    adminId: string,
  ): Promise<FeatureFlagConfig> {
    const flag = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${flagKey}`);
    }

    const currentEnabled = flag.enabledUserIds || [];
    const newEnabled = [...new Set([...currentEnabled, ...userIds])];

    // Remove from disabled list if present
    const currentDisabled = flag.disabledUserIds || [];
    const newDisabled = currentDisabled.filter((id) => !userIds.includes(id));

    return this.updateFlag(
      flagKey,
      {
        enabledUserIds: newEnabled,
        disabledUserIds: newDisabled,
      },
      adminId,
    );
  }

  /**
   * Add users to disabled list
   */
  async disableForUsers(
    flagKey: string,
    userIds: string[],
    adminId: string,
  ): Promise<FeatureFlagConfig> {
    const flag = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${flagKey}`);
    }

    const currentDisabled = flag.disabledUserIds || [];
    const newDisabled = [...new Set([...currentDisabled, ...userIds])];

    // Remove from enabled list if present
    const currentEnabled = flag.enabledUserIds || [];
    const newEnabled = currentEnabled.filter((id) => !userIds.includes(id));

    return this.updateFlag(
      flagKey,
      {
        enabledUserIds: newEnabled,
        disabledUserIds: newDisabled,
      },
      adminId,
    );
  }

  /**
   * Remove users from both enabled and disabled lists
   */
  async removeUsers(
    flagKey: string,
    userIds: string[],
    adminId: string,
  ): Promise<FeatureFlagConfig> {
    const flag = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${flagKey}`);
    }

    const currentEnabled = flag.enabledUserIds || [];
    const newEnabled = currentEnabled.filter((id) => !userIds.includes(id));

    const currentDisabled = flag.disabledUserIds || [];
    const newDisabled = currentDisabled.filter((id) => !userIds.includes(id));

    return this.updateFlag(
      flagKey,
      {
        enabledUserIds: newEnabled,
        disabledUserIds: newDisabled,
      },
      adminId,
    );
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(flagKey: string, adminId: string): Promise<void> {
    const flag = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag not found: ${flagKey}`);
    }

    await this.featureFlagRepository.remove(flag);
    await this.featureFlagService.refreshFlag(flagKey);

    this.logger.log(`Feature flag deleted: ${flagKey} by ${adminId}`);
  }

  /**
   * Get all feature flags with statistics
   */
  async getAllFlagsWithStats(): Promise<any[]> {
    const flags = await this.featureFlagRepository.find();

    return flags.map((flag) => ({
      ...flag.toConfig(),
      stats: {
        enabledUserCount: flag.enabledUserIds?.length || 0,
        disabledUserCount: flag.disabledUserIds?.length || 0,
        isPercentageRollout: flag.type === FeatureFlagType.PERCENTAGE,
        currentRollout: flag.rolloutPercentage || 0,
      },
    }));
  }

  /**
   * Initialize default feature flags if they don't exist
   */
  async initializeDefaultFlags(adminId: string): Promise<void> {
    const defaultFlags = [
      {
        key: 'FEATURE_AUTO_APPLY',
        name: 'Auto Apply Feature',
        description: 'Enable automated job application functionality',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'FEATURE_AI_RESUME_BUILDER',
        name: 'AI Resume Builder',
        description: 'Enable AI-powered resume building and optimization',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'FEATURE_ANALYTICS_DASHBOARD',
        name: 'Analytics Dashboard',
        description: 'Enable analytics dashboard for job search insights',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'FEATURE_CHROME_EXTENSION',
        name: 'Chrome Extension',
        description: 'Enable Chrome extension for quick-apply features',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: false,
      },
      {
        key: 'AI_SUGGESTIONS_ENABLED',
        name: 'AI Suggestions',
        description: 'Enable AI-powered job suggestions and recommendations',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'RESUME_OPTIMIZATION_ENABLED',
        name: 'Resume Optimization',
        description: 'Enable AI-powered resume optimization',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'SALARY_PREDICTION_ENABLED',
        name: 'Salary Prediction',
        description: 'Enable AI-powered salary prediction for job listings',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'LINKEDIN_AUTO_APPLY_ENABLED',
        name: 'LinkedIn Auto Apply',
        description: 'Enable auto-apply for LinkedIn job postings',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'INDEED_AUTO_APPLY_ENABLED',
        name: 'Indeed Auto Apply',
        description: 'Enable auto-apply for Indeed job postings',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: true,
      },
      {
        key: 'GLASSDOOR_AUTO_APPLY_ENABLED',
        name: 'Glassdoor Auto Apply',
        description: 'Enable auto-apply for Glassdoor job postings',
        type: FeatureFlagType.BOOLEAN,
        status: FeatureFlagStatus.ENABLED,
        defaultValue: false,
      },
    ];

    for (const flagData of defaultFlags) {
      const exists = await this.featureFlagRepository.findOne({
        where: { key: flagData.key },
      });

      if (!exists) {
        await this.createFlag(flagData, adminId);
      }
    }

    this.logger.log('Default feature flags initialized');
  }
}
