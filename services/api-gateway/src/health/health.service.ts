import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom , of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';


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

export interface IntegrationHealth {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

export interface IntegrationsHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  integrations: {
    oauth: {
      google: IntegrationHealth;
      linkedin: IntegrationHealth;
      github: IntegrationHealth;
    };
    external: {
      stripe: IntegrationHealth;
      sendgrid: IntegrationHealth;
      redis: IntegrationHealth;
    };
  };
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
  };
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

  /**
   * Check health of external integrations (OAuth, payment, etc.)
   */
  async getIntegrationsHealth(): Promise<IntegrationsHealthResponse> {
    const [googleHealth, linkedinHealth, githubHealth, stripeHealth, sendgridHealth, redisHealth] =
      await Promise.all([
        this.checkOAuthProvider('google', 'https://www.googleapis.com/oauth2/v1/tokeninfo'),
        this.checkOAuthProvider('linkedin', 'https://api.linkedin.com/v2/me'),
        this.checkOAuthProvider('github', 'https://api.github.com'),
        this.checkExternalService('stripe', 'https://api.stripe.com/v1'),
        this.checkExternalService('sendgrid', 'https://api.sendgrid.com/v3/mail/send'),
        this.checkRedisHealth(),
      ]);

    const integrations = {
      oauth: {
        google: googleHealth,
        linkedin: linkedinHealth,
        github: githubHealth,
      },
      external: {
        stripe: stripeHealth,
        sendgrid: sendgridHealth,
        redis: redisHealth,
      },
    };

    // Calculate summary
    const allHealths = [
      googleHealth,
      linkedinHealth,
      githubHealth,
      stripeHealth,
      sendgridHealth,
      redisHealth,
    ];

    const summary = {
      total: allHealths.length,
      healthy: allHealths.filter((h) => h.status === 'healthy').length,
      unhealthy: allHealths.filter((h) => h.status === 'unhealthy').length,
      unknown: allHealths.filter((h) => h.status === 'unknown').length,
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
      integrations,
      summary,
    };
  }

  /**
   * Check OAuth provider health by pinging their API
   */
  private async checkOAuthProvider(name: string, url: string): Promise<IntegrationHealth> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          timeout(5000),
          catchError((error: unknown) => {
            // OAuth endpoints may return 401/403 which is expected without credentials
            // We're just checking if the endpoint is reachable
            const err = error as { response?: { status?: number }; message?: string };
            if (err.response?.status && [400, 401, 403].includes(err.response.status)) {
              return of({
                data: null,
                status: err.response.status,
                statusText: 'Reachable',
                headers: {},
                config: {},
              });
            }
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

      // Consider 2xx, 4xx (auth errors) as healthy since endpoint is reachable
      if (response.status >= 200 && response.status < 500) {
        return {
          status: 'healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`,
        lastChecked: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const err = error as { message?: string };

      return {
        status: 'unknown',
        responseTime,
        error: err.message || 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check external service health
   */
  private async checkExternalService(name: string, url: string): Promise<IntegrationHealth> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          timeout(5000),
          catchError((error: unknown) => {
            const err = error as { response?: { status?: number }; message?: string };
            // For APIs that require auth, 401/403 means the endpoint is reachable
            if (err.response?.status && [400, 401, 403, 405].includes(err.response.status)) {
              return of({
                data: null,
                status: err.response.status,
                statusText: 'Reachable',
                headers: {},
                config: {},
              });
            }
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

      if (response.status >= 200 && response.status < 500) {
        return {
          status: 'healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`,
        lastChecked: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const err = error as { message?: string };

      return {
        status: 'unknown',
        responseTime,
        error: err.message || 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<IntegrationHealth> {
    const startTime = Date.now();

    try {
      // Check Redis by calling a service that uses it
      const redisUrl = this.configService.get('REDIS_HOST') || 'localhost';
      const redisPort = this.configService.get('REDIS_PORT') || 6379;

      // We can't directly ping Redis here without a Redis client
      // So we'll check if the notification service (which uses Redis) is healthy
      const notificationUrl = this.services['notification-service'];
      const result = await this.checkServiceHealth('notification-service', notificationUrl);

      const responseTime = Date.now() - startTime;

      if (result.health.status === 'healthy') {
        return {
          status: 'healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        status: 'degraded',
        responseTime,
        error: 'Redis check via notification-service',
        lastChecked: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const err = error as { message?: string };

      return {
        status: 'unknown',
        responseTime,
        error: err.message || 'Unknown error',
        lastChecked: new Date().toISOString(),
      };
    }
  }
}
