/**
 * Health Check E2E Tests
 * Verifies all services are healthy and responding
 */

import axios from 'axios';
import { config } from './setup';

describe('Health Checks', () => {
  const timeout = 10000;

  describe('Auth Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.authServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });

    it('should pass readiness check', async () => {
      const response = await axios.get(`${config.authServiceUrl}/health/ready`, { timeout });
      expect(response.status).toBe(200);
    });

    it('should pass liveness check', async () => {
      const response = await axios.get(`${config.authServiceUrl}/health/live`, { timeout });
      expect(response.status).toBe(200);
    });
  });

  describe('User Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.userServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });

    it('should pass readiness check', async () => {
      const response = await axios.get(`${config.userServiceUrl}/health/ready`, { timeout });
      expect(response.status).toBe(200);
    });

    it('should pass liveness check', async () => {
      const response = await axios.get(`${config.userServiceUrl}/health/live`, { timeout });
      expect(response.status).toBe(200);
    });
  });

  describe('Job Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.jobServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });

    it('should pass readiness check', async () => {
      const response = await axios.get(`${config.jobServiceUrl}/health/ready`, { timeout });
      expect(response.status).toBe(200);
    });

    it('should pass liveness check', async () => {
      const response = await axios.get(`${config.jobServiceUrl}/health/live`, { timeout });
      expect(response.status).toBe(200);
    });
  });

  describe('Resume Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.resumeServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });

    it('should pass readiness check', async () => {
      const response = await axios.get(`${config.resumeServiceUrl}/health/ready`, { timeout });
      expect(response.status).toBe(200);
    });

    it('should pass liveness check', async () => {
      const response = await axios.get(`${config.resumeServiceUrl}/health/live`, { timeout });
      expect(response.status).toBe(200);
    });
  });

  describe('Auto-Apply Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.autoApplyServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });

    it('should pass readiness check', async () => {
      const response = await axios.get(`${config.autoApplyServiceUrl}/health/ready`, { timeout });
      expect(response.status).toBe(200);
    });

    it('should pass liveness check', async () => {
      const response = await axios.get(`${config.autoApplyServiceUrl}/health/live`, { timeout });
      expect(response.status).toBe(200);
    });
  });

  describe('Notification Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.notificationServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });

    it('should pass readiness check', async () => {
      const response = await axios.get(`${config.notificationServiceUrl}/health/ready`, { timeout });
      expect(response.status).toBe(200);
    });

    it('should pass liveness check', async () => {
      const response = await axios.get(`${config.notificationServiceUrl}/health/live`, { timeout });
      expect(response.status).toBe(200);
    });
  });

  describe('Analytics Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.analyticsServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });
  });

  describe('AI Service', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${config.aiServiceUrl}/health`, { timeout });
      expect(response.status).toBe(200);
    });

    it('should pass readiness check', async () => {
      const response = await axios.get(`${config.aiServiceUrl}/health/ready`, { timeout });
      expect(response.status).toBe(200);
    });
  });
});
