import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AutoApplyService } from './services/auto-apply.service';
import { QueueService } from '../queue/queue.service';

import type { UpdateAutoApplySettingsDto } from './dto/auto-apply-settings.dto';


@ApiTags('Auto-Apply')
@ApiBearerAuth('JWT-auth')
@Controller('auto-apply')
@UseGuards(JwtAuthGuard)
export class AutoApplyController {
  private readonly logger = new Logger(AutoApplyController.name);

  constructor(
    private readonly autoApplyService: AutoApplyService,
    private readonly queueService: QueueService,
  ) {}

  @Get('settings')
  @ApiOperation({
    summary: 'Get auto-apply settings',
    description: 'Retrieves the current auto-apply configuration for the user including job filters, daily limits, and preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSettings(@User('id') userId: string) {
    return await this.autoApplyService.getSettings(userId);
  }

  @Put('settings')
  @ApiOperation({
    summary: 'Update auto-apply settings',
    description: 'Updates the auto-apply configuration including job filters (keywords, locations, salary), daily limits, and scheduling preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSettings(
    @Body() dto: UpdateAutoApplySettingsDto,
    @User('id') userId: string,
  ) {
    return await this.autoApplyService.updateSettings(userId, dto);
  }

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start auto-apply',
    description: 'Starts the automatic job application process for the user based on their configured settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-apply started successfully',
  })
  @ApiResponse({ status: 400, description: 'Auto-apply already running or invalid configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startAutoApply(@User('id') userId: string) {
    this.logger.log(`Starting auto-apply for user: ${userId}`);
    return await this.autoApplyService.startAutoApply(userId);
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop auto-apply',
    description: 'Stops the automatic job application process for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-apply stopped successfully',
  })
  @ApiResponse({ status: 400, description: 'Auto-apply not running' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async stopAutoApply(@User('id') userId: string) {
    this.logger.log(`Stopping auto-apply for user: ${userId}`);
    return await this.autoApplyService.stopAutoApply(userId);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get auto-apply status',
    description: 'Retrieves the current status of the auto-apply process including running state, applications sent today, and remaining quota',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@User('id') userId: string) {
    return await this.autoApplyService.getStatus(userId);
  }

  @Get('queue/stats')
  @ApiOperation({
    summary: 'Get queue statistics',
    description: 'Retrieves statistics about the application queue including waiting, active, completed, and failed counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue stats retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueueStats() {
    return await this.queueService.getQueueStats();
  }

  @Get('queue/jobs')
  @ApiOperation({
    summary: 'Get queued jobs',
    description: 'Retrieves list of jobs currently waiting in the application queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queued jobs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueuedJobs() {
    return await this.queueService.getQueuedJobs();
  }

  @Get('queue/failed')
  @ApiOperation({
    summary: 'Get failed jobs',
    description: 'Retrieves list of job applications that failed processing',
  })
  @ApiResponse({
    status: 200,
    description: 'Failed jobs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFailedJobs() {
    return await this.queueService.getFailedJobs();
  }

  @Post('queue/:jobId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry failed job',
    description: 'Re-queues a failed job application for another attempt',
  })
  @ApiParam({ name: 'jobId', description: 'Queue job ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Job queued for retry',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async retryJob(@Param('jobId') jobId: string) {
    await this.queueService.retryJob(jobId);
    return { message: 'Job queued for retry' };
  }

  @Post('queue/:jobId/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove job from queue',
    description: 'Removes a job from the application queue',
  })
  @ApiParam({ name: 'jobId', description: 'Queue job ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Job removed from queue',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeJob(@Param('jobId') jobId: string) {
    await this.queueService.removeJob(jobId);
    return { message: 'Job removed from queue' };
  }

  @Post('queue/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause queue',
    description: 'Pauses the application queue processing',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue paused',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async pauseQueue() {
    await this.queueService.pauseQueue();
    return { message: 'Queue paused' };
  }

  @Post('queue/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume queue',
    description: 'Resumes the paused application queue processing',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue resumed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resumeQueue() {
    await this.queueService.resumeQueue();
    return { message: 'Queue resumed' };
  }

  @Post('queue/clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear queue',
    description: 'Removes all jobs from the application queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue cleared',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearQueue() {
    await this.queueService.clearQueue();
    return { message: 'Queue cleared' };
  }
}
