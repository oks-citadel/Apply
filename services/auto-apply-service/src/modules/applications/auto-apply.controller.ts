import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AutoApplyService } from './services/auto-apply.service';
import { UpdateAutoApplySettingsDto } from './dto/auto-apply-settings.dto';
import { QueueService } from '../queue/queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('auto-apply')
@UseGuards(JwtAuthGuard)
export class AutoApplyController {
  private readonly logger = new Logger(AutoApplyController.name);

  constructor(
    private readonly autoApplyService: AutoApplyService,
    private readonly queueService: QueueService,
  ) {}

  @Get('settings')
  async getSettings(@User('id') userId: string) {
    return await this.autoApplyService.getSettings(userId);
  }

  @Put('settings')
  async updateSettings(
    @Body() dto: UpdateAutoApplySettingsDto,
    @User('id') userId: string,
  ) {
    return await this.autoApplyService.updateSettings(userId, dto);
  }

  @Post('start')
  async startAutoApply(@User('id') userId: string) {
    this.logger.log(`Starting auto-apply for user: ${userId}`);
    return await this.autoApplyService.startAutoApply(userId);
  }

  @Post('stop')
  async stopAutoApply(@User('id') userId: string) {
    this.logger.log(`Stopping auto-apply for user: ${userId}`);
    return await this.autoApplyService.stopAutoApply(userId);
  }

  @Get('status')
  async getStatus(@User('id') userId: string) {
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
  async retryJob(@Param('jobId') jobId: string) {
    await this.queueService.retryJob(jobId);
    return { message: 'Job queued for retry' };
  }

  @Post('queue/:jobId/remove')
  async removeJob(@Param('jobId') jobId: string) {
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
