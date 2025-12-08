import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AutoApplyService } from './services/auto-apply.service';
import { UpdateAutoApplySettingsDto } from './dto/auto-apply-settings.dto';
import { QueueService } from '../queue/queue.service';

@Controller('auto-apply')
export class AutoApplyController {
  private readonly logger = new Logger(AutoApplyController.name);

  constructor(
    private readonly autoApplyService: AutoApplyService,
    private readonly queueService: QueueService,
  ) {}

  private extractUserId(headers: any): string {
    const userId = headers['x-user-id'];
    if (!userId) {
      throw new BadRequestException('User ID is required in headers');
    }
    return userId;
  }

  @Get('settings')
  async getSettings(@Headers() headers: any) {
    const userId = this.extractUserId(headers);
    return await this.autoApplyService.getSettings(userId);
  }

  @Put('settings')
  async updateSettings(
    @Body() dto: UpdateAutoApplySettingsDto,
    @Headers() headers: any,
  ) {
    const userId = this.extractUserId(headers);
    return await this.autoApplyService.updateSettings(userId, dto);
  }

  @Post('start')
  async startAutoApply(@Headers() headers: any) {
    const userId = this.extractUserId(headers);
    this.logger.log(`Starting auto-apply for user: ${userId}`);
    return await this.autoApplyService.startAutoApply(userId);
  }

  @Post('stop')
  async stopAutoApply(@Headers() headers: any) {
    const userId = this.extractUserId(headers);
    this.logger.log(`Stopping auto-apply for user: ${userId}`);
    return await this.autoApplyService.stopAutoApply(userId);
  }

  @Get('status')
  async getStatus(@Headers() headers: any) {
    const userId = this.extractUserId(headers);
    return await this.autoApplyService.getStatus(userId);
  }

  @Get('queue/stats')
  async getQueueStats() {
    return await this.queueService.getQueueStats();
  }

  @Get('queue/jobs')
  async getQueuedJobs() {
    return await this.queueService.getQueuedJobs();
  }

  @Get('queue/failed')
  async getFailedJobs() {
    return await this.queueService.getFailedJobs();
  }

  @Post('queue/:jobId/retry')
  async retryJob(@Headers() headers: any) {
    const jobId = headers['x-job-id'];
    if (!jobId) {
      throw new BadRequestException('Job ID is required');
    }
    await this.queueService.retryJob(jobId);
    return { message: 'Job queued for retry' };
  }

  @Post('queue/:jobId/remove')
  async removeJob(@Headers() headers: any) {
    const jobId = headers['x-job-id'];
    if (!jobId) {
      throw new BadRequestException('Job ID is required');
    }
    await this.queueService.removeJob(jobId);
    return { message: 'Job removed from queue' };
  }

  @Post('queue/pause')
  async pauseQueue() {
    await this.queueService.pauseQueue();
    return { message: 'Queue paused' };
  }

  @Post('queue/resume')
  async resumeQueue() {
    await this.queueService.resumeQueue();
    return { message: 'Queue resumed' };
  }

  @Post('queue/clear')
  async clearQueue() {
    await this.queueService.clearQueue();
    return { message: 'Queue cleared' };
  }
}
