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
    // Define service configurations (using standardized ports 8081-8090)
    this.serviceConfigs = [
      {
        name: 'auth-service',
        baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
        port: 8081,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'user-service',
        baseURL: process.env.USER_SERVICE_URL || 'http://localhost:8082',
        port: 8082,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'resume-service',
        baseURL: process.env.RESUME_SERVICE_URL || 'http://localhost:8083',
        port: 8083,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'job-service',
        baseURL: process.env.JOB_SERVICE_URL || 'http://localhost:8084',
        port: 8084,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'auto-apply-service',
        baseURL: process.env.AUTO_APPLY_SERVICE_URL || 'http://localhost:8085',
        port: 8085,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'analytics-service',
        baseURL: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8086',
        port: 8086,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'notification-service',
        baseURL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8087',
        port: 8087,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'payment-service',
        baseURL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8088',
        port: 8088,
        healthEndpoint: '/api/v1/health',
      },
      {
        name: 'ai-service',
        baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8089',
        port: 8089,
        healthEndpoint: '/health',
      },
      {
        name: 'orchestrator-service',
        baseURL: process.env.ORCHESTRATOR_SERVICE_URL || 'http://localhost:8090',
        port: 8090,
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
