import { Controller, Get, Param, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService, AggregatedHealth, ServiceHealth } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check endpoint
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
        service: { type: 'string', example: 'api-gateway' },
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
   * Aggregated health check for all backend services
   */
  @Get('services')
  @ApiOperation({ summary: 'Aggregated health check for all backend services' })
  @ApiResponse({
    status: 200,
    description: 'Health status of all services',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'degraded', 'unhealthy'],
          example: 'healthy',
        },
        timestamp: { type: 'string', format: 'date-time' },
        services: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'unhealthy', 'unknown'],
              },
              responseTime: { type: 'number', example: 45 },
              error: { type: 'string' },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 9 },
            healthy: { type: 'number', example: 8 },
            unhealthy: { type: 'number', example: 1 },
            unknown: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  async getAggregatedHealth(): Promise<AggregatedHealth> {
    const health = await this.healthService.getAggregatedHealth();

    // Return appropriate HTTP status based on health
    if (health.status === 'unhealthy') {
      throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return health;
  }

  /**
   * Health check for a specific service
   */
  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Health check for a specific backend service' })
  @ApiParam({
    name: 'serviceName',
    description: 'Name of the service to check',
    example: 'auth-service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy', 'unknown'],
          example: 'healthy',
        },
        responseTime: { type: 'number', example: 45 },
        error: { type: 'string' },
      },
    },
  })
  async getServiceHealth(@Param('serviceName') serviceName: string): Promise<ServiceHealth> {
    const health = await this.healthService.getServiceHealth(serviceName);

    if (health.status === 'unhealthy' || health.status === 'unknown') {
      throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return health;
  }
}
