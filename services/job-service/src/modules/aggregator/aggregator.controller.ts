import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';

import { AggregatorService, AggregationSummary } from './aggregator.service';
import type { RawJobData } from './interfaces/job-provider.interface';

@ApiTags('Job Aggregation')
@Controller('aggregator')
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  /**
   * Trigger manual aggregation from all providers
   */
  @Post('aggregate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger job aggregation from all 10 providers' })
  @ApiQuery({ name: 'keywords', required: false, description: 'Search keywords' })
  @ApiQuery({ name: 'location', required: false, description: 'Job location' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max jobs per provider' })
  @ApiResponse({ status: 200, description: 'Aggregation summary' })
  async aggregate(
    @Query('keywords') keywords?: string,
    @Query('location') location?: string,
    @Query('limit') limit?: string,
  ): Promise<AggregationSummary> {
    return this.aggregatorService.aggregateAll({
      keywords,
      location,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Aggregate from a specific provider
   */
  @Post('aggregate/:providerName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger aggregation from a specific provider' })
  @ApiParam({
    name: 'providerName',
    required: true,
    description: 'Provider name (e.g., Indeed, LinkedIn, Dice, ZipRecruiter)',
    enum: ['Indeed', 'LinkedIn', 'Glassdoor', 'ZipRecruiter', 'SimplyHired', 'Jooble', 'Adzuna', 'CareerJet', 'Talent.com', 'Dice'],
  })
  @ApiQuery({ name: 'keywords', required: false, description: 'Search keywords' })
  @ApiQuery({ name: 'location', required: false, description: 'Job location' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max jobs to fetch' })
  @ApiResponse({ status: 200, description: 'Aggregation result from the provider' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async aggregateFromProvider(
    @Param('providerName') providerName: string,
    @Query('keywords') keywords?: string,
    @Query('location') location?: string,
    @Query('limit') limit?: string,
  ) {
    const provider = this.aggregatorService.getProvider(providerName);
    if (!provider) {
      return { error: `Provider ${providerName} not found` };
    }

    return this.aggregatorService.aggregateFromProvider(provider, {
      keywords,
      location,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Search jobs across all providers in real-time
   */
  @Get('search')
  @ApiOperation({ summary: 'Search jobs across all 10 providers in real-time' })
  @ApiQuery({ name: 'keywords', required: true, description: 'Search keywords (e.g., "software engineer")' })
  @ApiQuery({ name: 'location', required: false, description: 'Job location (e.g., "Remote", "New York")' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max total results (default: 30)' })
  @ApiQuery({ name: 'skipCache', required: false, description: 'Skip cached results (default: false)' })
  @ApiResponse({ status: 200, description: 'List of jobs from all providers' })
  async search(
    @Query('keywords') keywords: string,
    @Query('location') location?: string,
    @Query('limit') limit?: string,
    @Query('skipCache') skipCache?: string,
  ): Promise<RawJobData[]> {
    return this.aggregatorService.searchAllProviders({
      keywords,
      location,
      limit: limit ? parseInt(limit, 10) : 30,
      skipCache: skipCache === 'true',
    });
  }

  /**
   * Get list of available providers
   */
  @Get('providers')
  @ApiOperation({ summary: 'List all available job board providers' })
  @ApiResponse({
    status: 200,
    description: 'List of providers',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 10 },
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Indeed' },
              category: { type: 'string', example: 'General' },
            },
          },
        },
      },
    },
  })
  async getProviders() {
    const providers = this.aggregatorService.getAllProviders();

    const providerCategories: Record<string, string> = {
      Indeed: 'General',
      LinkedIn: 'General',
      Glassdoor: 'General',
      ZipRecruiter: 'General',
      SimplyHired: 'General',
      Jooble: 'General',
      Adzuna: 'General',
      CareerJet: 'International',
      'Talent.com': 'International',
      Dice: 'Tech-Focused',
    };

    return {
      count: providers.length,
      providers: providers.map(p => ({
        name: p.getName(),
        category: providerCategories[p.getName()] || 'Other',
      })),
    };
  }

  /**
   * Check health of all providers
   */
  @Get('health')
  @ApiOperation({ summary: 'Check health status of all providers' })
  @ApiResponse({
    status: 200,
    description: 'Health status for each provider',
    schema: {
      type: 'object',
      additionalProperties: { type: 'boolean' },
      example: {
        Indeed: true,
        LinkedIn: true,
        Glassdoor: true,
        ZipRecruiter: false,
      },
    },
  })
  async checkHealth(): Promise<Record<string, boolean>> {
    return this.aggregatorService.checkProvidersHealth();
  }

  /**
   * Get aggregation statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get job aggregation statistics' })
  @ApiResponse({
    status: 200,
    description: 'Aggregation statistics',
    schema: {
      type: 'object',
      properties: {
        totalJobs: { type: 'number', example: 15000 },
        activeJobs: { type: 'number', example: 12500 },
        jobsBySource: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { indeed: 5000, linkedin: 3000, glassdoor: 2500 },
        },
        jobsByRemoteType: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { remote: 4000, hybrid: 3500, onsite: 5000 },
        },
        recentJobs24h: { type: 'number', example: 500 },
        recentJobs7d: { type: 'number', example: 3500 },
      },
    },
  })
  async getStats() {
    return this.aggregatorService.getStatistics();
  }

  /**
   * Get cache statistics
   */
  @Get('cache/stats')
  @ApiOperation({ summary: 'Get Redis cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics',
    schema: {
      type: 'object',
      properties: {
        isConnected: { type: 'boolean' },
        keyCount: { type: 'number' },
        memoryUsage: { type: 'string' },
      },
    },
  })
  async getCacheStats() {
    return this.aggregatorService.getCacheStats();
  }

  /**
   * Clear all aggregator cache
   */
  @Delete('cache')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear all cached job search results' })
  @ApiResponse({ status: 204, description: 'Cache cleared successfully' })
  async clearCache(): Promise<void> {
    await this.aggregatorService.clearCache();
  }
}
