import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import type { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

export interface ProxyResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, unknown>;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  // Service routing map
  private readonly serviceRoutes: Record<string, { prefix: string; target: string }> = {
    auth: {
      prefix: '/api/auth',
      target: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
    },
    users: {
      prefix: '/api/users',
      target: process.env.USER_SERVICE_URL || 'http://localhost:8082',
    },
    resumes: {
      prefix: '/api/resumes',
      target: process.env.RESUME_SERVICE_URL || 'http://localhost:8083',
    },
    jobs: {
      prefix: '/api/jobs',
      target: process.env.JOB_SERVICE_URL || 'http://localhost:8084',
    },
    applications: {
      prefix: '/api/applications',
      target: process.env.AUTO_APPLY_SERVICE_URL || 'http://localhost:8085',
    },
    analytics: {
      prefix: '/api/analytics',
      target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8086',
    },
    notifications: {
      prefix: '/api/notifications',
      target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8087',
    },
    billing: {
      prefix: '/api/billing',
      target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8088',
    },
    ai: {
      prefix: '/api/ai',
      target: process.env.AI_SERVICE_URL || 'http://localhost:8089',
    },
    orchestrator: {
      prefix: '/api/orchestrator',
      target: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:8090',
    },
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Route request to appropriate backend service
   */
  async proxyRequest<T = unknown>(
    serviceName: string,
    path: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>,
    query?: Record<string, unknown>,
  ): Promise<ProxyResponse<T>> {
    const service = this.serviceRoutes[serviceName];

    if (!service) {
      this.logger.error(`Unknown service: ${serviceName}`);
      throw new HttpException(
        `Service not found: ${serviceName}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Build target URL
    const targetUrl = `${service.target}${path}`;

    this.logger.log(
      `Proxying ${method} request to ${serviceName} service: ${targetUrl}`,
    );

    try {
      // Prepare request config
      const config: AxiosRequestConfig = {
        method: method.toLowerCase() as Method,
        url: targetUrl,
        headers: {
          ...headers,
          'X-Forwarded-By': 'api-gateway',
        },
        params: query,
      };

      // Add body for non-GET requests
      if (method !== 'GET' && body) {
        config.data = body;
      }

      // Make request to backend service
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.request<T>(config),
      );

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, unknown>,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string; response?: { data?: unknown; status?: number } };
      this.logger.error(
        `Error proxying request to ${serviceName}: ${err.message || 'Unknown error'}`,
        err.stack,
      );

      // Forward error from backend service
      if (err.response) {
        throw new HttpException(
          err.response.data || 'Backend service error',
          err.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Service unavailable
      throw new HttpException(
        `Service unavailable: ${serviceName}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get service route information
   */
  getServiceRoute(serviceName: string): { prefix: string; target: string } | null {
    return this.serviceRoutes[serviceName] || null;
  }

  /**
   * Get all service routes
   */
  getAllServiceRoutes(): Record<string, { prefix: string; target: string }> {
    return this.serviceRoutes;
  }
}
