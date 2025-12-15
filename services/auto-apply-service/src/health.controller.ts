import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health/health.service';
import { ServiceClientService } from './modules/engine/service-client.service';
import { Public } from './common/decorators/public.decorator';

/**
 * Health Check Controller for Auto Apply Service
 * Provides endpoints for service health monitoring
 */
@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly serviceClient?: ServiceClientService,
  ) {}

  /**
   * Basic health check endpoint
   * Returns service status without checking external dependencies
   */
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'auto-apply-service' },
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
   * Checks database, Redis and other critical dependencies
   */
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

  /**
   * Circuit breaker status endpoint
   * Returns the state of circuit breakers for all external services
   */
  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get circuit breaker status' })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker status for all services',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        circuitBreakers: {
          type: 'object',
          example: {
            'job-service': 'CLOSED',
            'user-service': 'CLOSED',
            'resume-service': 'CLOSED',
            'ai-service': 'CLOSED',
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getCircuitBreakerStatus() {
    if (!this.serviceClient) {
      return {
        status: 'unavailable',
        message: 'ServiceClient not initialized',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'ok',
      circuitBreakers: this.serviceClient.getCircuitBreakerStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}
