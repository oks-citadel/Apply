import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PlaybooksService } from './playbooks.service';
import {
  PlaybookResponseDto,
  PlaybookSummaryDto,
  RecommendPlaybookDto,
  RecommendationResponseDto,
  ApplyPlaybookDto,
  ApplyPlaybookResponseDto,
  UpdateApplicationStatusDto,
  ApplicationStatsDto,
} from './dto';
import { Playbook, Region } from './entities/playbook.entity';
import { PlaybookApplication } from './entities/playbook-application.entity';

@ApiTags('Playbooks')
@Controller('api/v1/playbooks')
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active playbooks' })
  @ApiResponse({
    status: 200,
    description: 'Returns all active regional playbooks',
    type: [PlaybookResponseDto],
  })
  async getAllPlaybooks(): Promise<Playbook[]> {
    return this.playbooksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playbook by ID' })
  @ApiParam({ name: 'id', description: 'Playbook ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the playbook',
    type: PlaybookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Playbook not found' })
  async getPlaybookById(@Param('id', ParseUUIDPipe) id: string): Promise<Playbook> {
    return this.playbooksService.findOne(id);
  }

  @Get('region/:region')
  @ApiOperation({ summary: 'Get playbook by region' })
  @ApiParam({
    name: 'region',
    description: 'Region name',
    enum: Region,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the playbook for the specified region',
    type: PlaybookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Playbook not found for region' })
  async getPlaybookByRegion(@Param('region') region: Region): Promise<Playbook> {
    return this.playbooksService.findByRegion(region);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get playbook recommendation for a job' })
  @ApiResponse({
    status: 200,
    description: 'Returns recommended playbook and alternatives',
    type: RecommendationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async recommendPlaybook(
    @Body() dto: RecommendPlaybookDto,
  ): Promise<RecommendationResponseDto> {
    return this.playbooksService.recommendPlaybook(dto.job_id, dto.user_id);
  }

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply playbook to a job application' })
  @ApiResponse({
    status: 201,
    description: 'Playbook applied successfully',
    type: ApplyPlaybookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job or playbook not found' })
  @ApiResponse({ status: 400, description: 'Application already exists or invalid data' })
  async applyPlaybook(@Body() dto: ApplyPlaybookDto): Promise<ApplyPlaybookResponseDto> {
    return this.playbooksService.applyPlaybook(dto);
  }

  @Get('applications/user/:userId')
  @ApiOperation({ summary: 'Get all applications for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all applications for the user',
    type: [PlaybookApplication],
  })
  async getUserApplications(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<PlaybookApplication[]> {
    return this.playbooksService.getUserApplications(userId);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the application',
    type: PlaybookApplication,
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getApplication(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlaybookApplication> {
    return this.playbooksService.getApplication(id);
  }

  @Put('applications/:id/status')
  @ApiOperation({ summary: 'Update application status' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application status updated successfully',
    type: PlaybookApplication,
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async updateApplicationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ): Promise<PlaybookApplication> {
    return this.playbooksService.updateApplicationStatus(id, dto);
  }

  @Get('stats/user/:userId')
  @ApiOperation({ summary: 'Get application statistics for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns application statistics',
    type: ApplicationStatsDto,
  })
  async getUserStats(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApplicationStatsDto> {
    return this.playbooksService.getUserApplicationStats(userId);
  }

  @Get('health/check')
  @ApiOperation({ summary: 'Health check for playbooks module' })
  @ApiResponse({
    status: 200,
    description: 'Playbooks module is healthy',
  })
  async healthCheck(): Promise<{ status: string; playbooksCount: number }> {
    const playbooks = await this.playbooksService.findAll();
    return {
      status: 'healthy',
      playbooksCount: playbooks.length,
    };
  }
}
