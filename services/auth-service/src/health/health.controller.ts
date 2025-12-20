import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../common/decorators/public.decorator';

import type { HealthService } from './health.service';

/**
 * Health Check Controller for Auth Service
 * Provides endpoints for service health monitoring
 * @SkipThrottle() - Exempt health checks from rate limiting to allow K8s probes
 */
@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check endpoint
   * Returns service status without checking external dependencies
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'auth-service' },
        version: { type: 'string', example: '1.0.0' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getHealth() {
    return this.healthService.getBasicHealth();
  }

  /**
   * Liveness probe endpoint
   * Used by Kubernetes to determine if the service is alive
   * Should return quickly without checking external dependencies
   */
  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
  })
  async getLiveness() {
    return this.healthService.getLiveness();
  }

  /**
   * Readiness probe endpoint
   * Used by Kubernetes to determine if the service is ready to accept traffic
   * Checks database and other critical dependencies
   */
  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready',
  })
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
