import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AggregatorService, AggregationSummary } from './aggregator.service';
import { RawJobData } from './interfaces/job-provider.interface';

@Controller('aggregator')
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  /**
   * Trigger manual aggregation from all providers
   */
  @Post('aggregate')
  @HttpCode(HttpStatus.OK)
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
  async aggregateFromProvider(
    @Query('provider') providerName: string,
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
  async search(
    @Query('keywords') keywords: string,
    @Query('location') location?: string,
    @Query('limit') limit?: string,
  ): Promise<RawJobData[]> {
    return this.aggregatorService.searchAllProviders({
      keywords,
      location,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  /**
   * Get list of available providers
   */
  @Get('providers')
  async getProviders() {
    const providers = this.aggregatorService.getAllProviders();
    return {
      count: providers.length,
      providers: providers.map(p => ({
        name: p.getName(),
      })),
    };
  }

  /**
   * Check health of all providers
   */
  @Get('health')
  async checkHealth(): Promise<Record<string, boolean>> {
    return this.aggregatorService.checkProvidersHealth();
  }

  /**
   * Get aggregation statistics
   */
  @Get('stats')
  async getStats() {
    return this.aggregatorService.getStatistics();
  }
}
