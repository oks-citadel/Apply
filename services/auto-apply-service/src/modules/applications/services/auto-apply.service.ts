import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AutoApplySettings } from '../entities/auto-apply-settings.entity';
import { Application, ApplicationSource } from '../entities/application.entity';
import { UpdateAutoApplySettingsDto, AutoApplyStatusDto } from '../dto/auto-apply-settings.dto';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class AutoApplyService {
  private readonly logger = new Logger(AutoApplyService.name);
  private isRunning = false;
  private lastRunAt?: Date;

  constructor(
    @InjectRepository(AutoApplySettings)
    private readonly settingsRepository: Repository<AutoApplySettings>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly queueService: QueueService,
  ) {}

  async getSettings(userId: string): Promise<AutoApplySettings> {
    let settings = await this.settingsRepository.findOne({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        user_id: userId,
        enabled: false,
        filters: {},
        resume_id: '',
        max_applications_per_day: 50,
        auto_response: false,
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(userId: string, dto: UpdateAutoApplySettingsDto): Promise<AutoApplySettings> {
    let settings = await this.settingsRepository.findOne({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ user_id: userId });
    }

    settings.enabled = dto.enabled;
    settings.filters = dto.filters;
    settings.resume_id = dto.resumeId;
    settings.cover_letter_template = dto.coverLetterTemplate;
    settings.max_applications_per_day = dto.maxApplicationsPerDay || 50;
    settings.auto_response = dto.autoResponse || false;

    return await this.settingsRepository.save(settings);
  }

  async startAutoApply(userId: string): Promise<AutoApplyStatusDto> {
    const settings = await this.getSettings(userId);

    if (!settings.enabled) {
      throw new Error('Auto-apply is not enabled');
    }

    if (!settings.resume_id) {
      throw new Error('Resume is required for auto-apply');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const applicationsToday = await this.applicationRepository.count({
      where: {
        user_id: userId,
        source: ApplicationSource.AUTO_APPLY,
        created_at: MoreThanOrEqual(today),
      },
    });

    if (applicationsToday >= settings.max_applications_per_day) {
      throw new Error('Daily application limit reached');
    }

    this.isRunning = true;
    this.lastRunAt = new Date();
    this.logger.log(`Auto-apply started for user ${userId}`);

    return this.getStatus(userId);
  }

  async stopAutoApply(userId: string): Promise<AutoApplyStatusDto> {
    this.isRunning = false;
    this.logger.log(`Auto-apply stopped for user ${userId}`);
    await this.queueService.pauseQueue();
    return this.getStatus(userId);
  }

  async getStatus(userId: string): Promise<AutoApplyStatusDto> {
    const settings = await this.getSettings(userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const applicationsToday = await this.applicationRepository.count({
      where: {
        user_id: userId,
        source: ApplicationSource.AUTO_APPLY,
        created_at: MoreThanOrEqual(today),
      },
    });

    const totalApplications = await this.applicationRepository.count({
      where: {
        user_id: userId,
        source: ApplicationSource.AUTO_APPLY,
      },
    });

    const successfulApplications = await this.applicationRepository.count({
      where: {
        user_id: userId,
        source: ApplicationSource.AUTO_APPLY,
        queue_status: 'completed',
      },
    });

    const successRate = totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0;

    return {
      isRunning: this.isRunning && settings.enabled,
      applicationsToday,
      totalApplications,
      successRate,
      lastRunAt: this.lastRunAt?.toISOString(),
      nextRunAt: undefined,
    };
  }
}
