import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

export interface AggregatedHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, ServiceHealth>;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
  };
}

export interface BasicHealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface ReadinessResponse {
  status: string;
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  // Service health check endpoints
  private readonly services: Record<string, string> = {
    'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
    'user-service': process.env.USER_SERVICE_URL || 'http://localhost:8082',
    'resume-service': process.env.RESUME_SERVICE_URL || 'http://localhost:8083',
    'job-service': process.env.JOB_SERVICE_URL || 'http://localhost:8084',
    'auto-apply-service': process.env.AUTO_APPLY_SERVICE_URL || 'http://localhost:8085',
    'analytics-service': process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8086',
    'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8087',
    'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:8088',
    'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:8089',
    'orchestrator-service': process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:8090',
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Basic health check for the gateway itself
   */
  getBasicHealth(): BasicHealthResponse {
    return {
      status: 'ok',
      service: 'api-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness probe - simple check that service is running
   */
  getLiveness(): ReadinessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - check if gateway can serve traffic
   */
  async getReadiness(): Promise<ReadinessResponse> {
    // For now, just check if the gateway itself is ready
    // Could add checks for critical dependencies here
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Aggregated health check - check all backend services
   */
  async getAggregatedHealth(): Promise<AggregatedHealth> {
    const serviceHealthChecks = await Promise.all(
      Object.entries(this.services).map(([name, url]) =>
        this.checkServiceHealth(name, url),
      ),
    );

    // Build services health map
    const services: Record<string, ServiceHealth> = {};
    serviceHealthChecks.forEach(({ name, health }) => {
      services[name] = health;
    });

    // Calculate summary
    const summary = {
      total: serviceHealthChecks.length,
      healthy: serviceHealthChecks.filter((s) => s.health.status === 'healthy').length,
      unhealthy: serviceHealthChecks.filter((s) => s.health.status === 'unhealthy').length,
      unknown: serviceHealthChecks.filter((s) => s.health.status === 'unknown').length,
    };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (summary.unhealthy === 0 && summary.unknown === 0) {
      status = 'healthy';
    } else if (summary.unhealthy > summary.total / 2) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
      summary,
    };
  }

  /**
   * Check health of a single service
   */
  private async checkServiceHealth(
    name: string,
    url: string,
  ): Promise<{ name: string; health: ServiceHealth }> {
    const startTime = Date.now();

    try {
      const healthUrl = `${url}/health`;

      const response = await firstValueFrom(
        this.httpService.get(healthUrl).pipe(
          timeout(3000),
          catchError((error: unknown) => {
            const err = error as { message?: string };
            this.logger.warn(`Health check failed for ${name}: ${err.message || 'Unknown error'}`);
            return of({
              data: null,
              status: 0,
              statusText: err.message || 'Unknown error',
              headers: {},
              config: {},
            });
          }),
        ),
      );

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        return {
          name,
          health: {
            status: 'healthy',
            responseTime,
          },
        };
      } else {
        return {
          name,
          health: {
            status: 'unhealthy',
            responseTime,
            error: `HTTP ${response.status}`,
          },
        };
      }
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const err = error as { message?: string };

      return {
        name,
        health: {
          status: 'unknown',
          responseTime,
          error: err.message || 'Unknown error',
        },
      };
    }
  }

  /**
   * Get health status for a specific service
   */
  async getServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const url = this.services[serviceName];

    if (!url) {
      return {
        status: 'unknown',
        error: 'Service not found',
      };
    }

    const result = await this.checkServiceHealth(serviceName, url);
    return result.health;
  }
}
