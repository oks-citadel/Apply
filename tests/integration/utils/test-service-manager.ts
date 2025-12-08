/**
 * Test Service Manager
 * Manages test service instances and provides utilities for service communication
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from './test-logger';

export interface ServiceConfig {
  name: string;
  baseURL: string;
  port: number;
  healthEndpoint?: string;
}

export class TestServiceManager {
  private services: Map<string, AxiosInstance> = new Map();
  private readonly serviceConfigs: ServiceConfig[];

  constructor() {
    // Define service configurations
    this.serviceConfigs = [
      {
        name: 'auth-service',
        baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        port: 3001,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'user-service',
        baseURL: process.env.USER_SERVICE_URL || 'http://localhost:8002',
        port: 8002,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'job-service',
        baseURL: process.env.JOB_SERVICE_URL || 'http://localhost:3003',
        port: 3003,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'resume-service',
        baseURL: process.env.RESUME_SERVICE_URL || 'http://localhost:3004',
        port: 3004,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'ai-service',
        baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
        port: 8000,
        healthEndpoint: '/health',
      },
      {
        name: 'notification-service',
        baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
        port: 3006,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'auto-apply-service',
        baseURL: process.env.AUTO_APPLY_SERVICE_URL || 'http://localhost:3007',
        port: 3007,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'analytics-service',
        baseURL: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008',
        port: 3008,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'orchestrator-service',
        baseURL: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:3009',
        port: 3009,
        healthEndpoint: '/api/v1/health',
      },
    ];
  }

  async initialize(): Promise<void> {
    logger.info('Initializing test service clients...');

    for (const config of this.serviceConfigs) {
      const client = axios.create({
        baseURL: config.baseURL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Don't throw on any status code
      });

      this.services.set(config.name, client);
      logger.debug(`Created client for ${config.name}`);
    }

    logger.info('Test service clients initialized');
  }

  getService(serviceName: string): AxiosInstance {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }
    return service;
  }

  async waitForService(
    serviceName: string,
    maxRetries: number = 30,
    retryDelay: number = 1000
  ): Promise<boolean> {
    const config = this.serviceConfigs.find(s => s.name === serviceName);
    if (!config) {
      logger.error(`Service config not found: ${serviceName}`);
      return false;
    }

    const client = this.getService(serviceName);
    const healthEndpoint = config.healthEndpoint || '/health';

    logger.info(`Waiting for ${serviceName} to be ready...`);

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await client.get(healthEndpoint);
        if (response.status === 200) {
          logger.info(`${serviceName} is ready`);
          return true;
        }
      } catch (error) {
        logger.debug(`${serviceName} not ready, attempt ${i + 1}/${maxRetries}`);
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    logger.warn(`${serviceName} did not become ready in time`);
    return false;
  }

  async waitForAllServices(timeout: number = 60000): Promise<boolean> {
    logger.info('Waiting for all services to be ready...');

    const startTime = Date.now();
    const results = await Promise.all(
      this.serviceConfigs.map(async (config) => {
        const elapsed = Date.now() - startTime;
        const remainingTime = timeout - elapsed;
        const maxRetries = Math.floor(remainingTime / 1000);

        return this.waitForService(config.name, Math.max(maxRetries, 1));
      })
    );

    const allReady = results.every(r => r);

    if (allReady) {
      logger.info('All services are ready');
    } else {
      logger.warn('Some services are not ready');
    }

    return allReady;
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up test service clients...');
    this.services.clear();
    logger.info('Test service clients cleaned up');
  }

  getConfig(serviceName: string): ServiceConfig | undefined {
    return this.serviceConfigs.find(s => s.name === serviceName);
  }

  getAllConfigs(): ServiceConfig[] {
    return [...this.serviceConfigs];
  }
}
