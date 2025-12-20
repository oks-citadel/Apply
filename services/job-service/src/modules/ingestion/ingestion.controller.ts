import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';


import { IngestionJob, IngestionTrigger } from './entities/ingestion-job.entity';
import { JobSource, SourceStatus } from './entities/job-source.entity';

import type { JobAdapterFactory } from './adapters/adapter.factory';
import type { CreateJobSourceDto } from './dto/create-source.dto';
import type { DeduplicationService } from './services/deduplication.service';
import type { IngestionService } from './services/ingestion.service';
import type { Repository } from 'typeorm';

@ApiTags('Job Ingestion')
@Controller('api/v1/ingestion')
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);

  constructor(
    private readonly ingestionService: IngestionService,
    private readonly deduplicationService: DeduplicationService,
    private readonly adapterFactory: JobAdapterFactory,
    @InjectRepository(JobSource)
    private readonly jobSourceRepository: Repository<JobSource>,
    @InjectRepository(IngestionJob)
    private readonly ingestionJobRepository: Repository<IngestionJob>,
  ) {}

  @Post('sources')
  @ApiOperation({ summary: 'Register a new job source' })
  @ApiResponse({ status: 201, description: 'Source created successfully' })
  async createSource(@Body() createDto: CreateJobSourceDto) {
    // Validate that the provider is supported
    if (!this.adapterFactory.supports(createDto.provider)) {
      const supported = this.adapterFactory.getSupportedProviders();
      throw new Error(
        `Provider '${createDto.provider}' is not supported. Supported providers: ${supported.join(', ')}`,
      );
    }

    const source = this.jobSourceRepository.create({
      ...createDto,
      status: createDto.is_enabled !== false ? SourceStatus.ACTIVE : SourceStatus.PAUSED,
      sync_interval_minutes: createDto.sync_interval_minutes || 60,
      is_enabled: createDto.is_enabled !== false,
    });

    const savedSource = await this.jobSourceRepository.save(source);

    this.logger.log(`Created job source: ${savedSource.name} (${savedSource.provider})`);

    return {
      success: true,
      data: savedSource,
    };
  }

  @Get('sources')
  @ApiOperation({ summary: 'List all job sources' })
  @ApiResponse({ status: 200, description: 'Sources retrieved successfully' })
  async listSources(
    @Query('status') status?: SourceStatus,
    @Query('provider') provider?: string,
  ) {
    const where: any = {};
    if (status) {where.status = status;}
    if (provider) {where.provider = provider;}

    const sources = await this.jobSourceRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: sources,
      total: sources.length,
    };
  }

  @Get('sources/:id')
  @ApiOperation({ summary: 'Get job source by ID' })
  @ApiResponse({ status: 200, description: 'Source retrieved successfully' })
  async getSource(@Param('id') id: string) {
    const source = await this.jobSourceRepository.findOne({
      where: { id },
    });

    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    return {
      success: true,
      data: source,
    };
  }

  @Post('run/:sourceId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger manual ingestion for a source' })
  @ApiResponse({ status: 202, description: 'Ingestion job queued successfully' })
  async triggerIngestion(
    @Param('sourceId') sourceId: string,
    @Query('userId') userId?: string,
  ) {
    const ingestionJob = await this.ingestionService.runIngestion(
      sourceId,
      IngestionTrigger.MANUAL,
      userId,
    );

    this.logger.log(`Triggered manual ingestion for source: ${sourceId}`);

    return {
      success: true,
      message: 'Ingestion job queued successfully',
      data: {
        jobId: ingestionJob.id,
        sourceId: ingestionJob.job_source_id,
        status: ingestionJob.status,
      },
    };
  }

  @Post('run-all')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger ingestion for all active sources' })
  @ApiResponse({ status: 202, description: 'Ingestion jobs queued successfully' })
  async triggerAllIngestion(@Query('userId') userId?: string) {
    const sources = await this.jobSourceRepository.find({
      where: { status: SourceStatus.ACTIVE, is_enabled: true },
    });

    const jobs = await Promise.all(
      sources.map((source) =>
        this.ingestionService.runIngestion(
          source.id,
          IngestionTrigger.MANUAL,
          userId,
        ),
      ),
    );

    this.logger.log(`Triggered ingestion for ${sources.length} sources`);

    return {
      success: true,
      message: `Queued ${jobs.length} ingestion jobs`,
      data: jobs.map((job) => ({
        jobId: job.id,
        sourceId: job.job_source_id,
        status: job.status,
      })),
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get overall ingestion status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getStatus(@Query('sourceId') sourceId?: string) {
    const status = await this.ingestionService.getIngestionStatus(sourceId);

    return {
      success: true,
      data: status,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ingestion statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Query('sourceId') sourceId?: string) {
    const [ingestionStats, deduplicationStats] = await Promise.all([
      this.ingestionService.getIngestionStats(sourceId),
      this.deduplicationService.getDeduplicationStats(),
    ]);

    return {
      success: true,
      data: {
        ingestion: ingestionStats,
        deduplication: deduplicationStats,
      },
    };
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List ingestion jobs' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  async listIngestionJobs(
    @Query('sourceId') sourceId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const where: any = {};
    if (sourceId) {where.job_source_id = sourceId;}
    if (status) {where.status = status;}

    const jobs = await this.ingestionJobRepository.find({
      where,
      relations: ['job_source'],
      order: { created_at: 'DESC' },
      take: limit ? parseInt(limit) : 50,
    });

    return {
      success: true,
      data: jobs,
      total: jobs.length,
    };
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get ingestion job details' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  async getIngestionJob(@Param('id') id: string) {
    const job = await this.ingestionJobRepository.findOne({
      where: { id },
      relations: ['job_source'],
    });

    if (!job) {
      throw new Error(`Ingestion job not found: ${id}`);
    }

    return {
      success: true,
      data: job,
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'List supported job source providers' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getSupportedProviders() {
    const providers = this.adapterFactory.getSupportedProviders();

    const providersInfo = providers.map((provider) => {
      const info = this.adapterFactory.getAdapterInfo(provider);
      return {
        provider,
        name: info.name,
        supported: info.supported,
      };
    });

    return {
      success: true,
      data: providersInfo,
      total: providersInfo.length,
    };
  }

  @Post('sources/:id/health-check')
  @ApiOperation({ summary: 'Check health of a job source' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async checkSourceHealth(@Param('id') id: string) {
    const source = await this.jobSourceRepository.findOne({
      where: { id },
    });

    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    try {
      const adapter = this.adapterFactory.createAdapter(source);
      await adapter.initialize(source);

      const healthResult = await adapter.healthCheck();

      return {
        success: true,
        data: healthResult,
      };
    } catch (error) {
      this.logger.error(`Health check failed for ${source.name}: ${error.message}`);

      return {
        success: false,
        data: {
          isHealthy: false,
          message: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  @Post('sources/:id/pause')
  @ApiOperation({ summary: 'Pause a job source' })
  @ApiResponse({ status: 200, description: 'Source paused successfully' })
  async pauseSource(@Param('id') id: string) {
    const source = await this.jobSourceRepository.findOne({
      where: { id },
    });

    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    source.status = SourceStatus.PAUSED;
    await this.jobSourceRepository.save(source);

    this.logger.log(`Paused source: ${source.name}`);

    return {
      success: true,
      message: 'Source paused successfully',
      data: source,
    };
  }

  @Post('sources/:id/resume')
  @ApiOperation({ summary: 'Resume a paused job source' })
  @ApiResponse({ status: 200, description: 'Source resumed successfully' })
  async resumeSource(@Param('id') id: string) {
    const source = await this.jobSourceRepository.findOne({
      where: { id },
    });

    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    source.status = SourceStatus.ACTIVE;
    await this.jobSourceRepository.save(source);

    this.logger.log(`Resumed source: ${source.name}`);

    return {
      success: true,
      message: 'Source resumed successfully',
      data: source,
    };
  }
}
