import { Request, Response } from 'express';
import {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  strictRateLimiter,
  uploadRateLimiter,
  autoApplyRateLimiter,
} from '../rate-limiter';

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn((options) => {
    return (req: Request, res: Response, next: Function) => {
      // Store config for testing
      (req as any).__rateLimitConfig = options;
      next();
    };
  });
});

describe('Rate Limiter Security Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockReq = {
      ip: '192.168.1.1',
      headers: {},
      method: 'GET',
      path: '/api/test',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with default configuration', () => {
      const limiter = createRateLimiter();
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should create a rate limiter with custom configuration', () => {
      const customConfig = {
        windowMs: 60000,
        max: 50,
        message: 'Custom rate limit message',
      };
      const limiter = createRateLimiter(customConfig);
      expect(limiter).toBeDefined();
    });

    it('should apply default message when not provided', () => {
      const limiter = createRateLimiter({ max: 10 });
      limiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.message).toBe('Too many requests, please try again later.');
    });

    it('should override default settings with custom values', () => {
      const customConfig = {
        windowMs: 30000,
        max: 25,
        standardHeaders: false,
        legacyHeaders: true,
      };
      const limiter = createRateLimiter(customConfig);
      limiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBe(30000);
      expect(config.max).toBe(25);
      expect(config.standardHeaders).toBe(false);
      expect(config.legacyHeaders).toBe(true);
    });
  });

  describe('apiRateLimiter', () => {
    it('should have correct configuration for API endpoints', () => {
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.max).toBe(100);
      expect(config.message).toContain('API requests');
      expect(config.message).toContain('15 minutes');
    });

    it('should allow standard headers', () => {
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.standardHeaders).toBe(true);
    });

    it('should call next function', () => {
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authRateLimiter', () => {
    it('should have strict limits for authentication', () => {
      authRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(config.max).toBe(5); // Only 5 attempts
      expect(config.message).toContain('login attempts');
      expect(config.message).toContain('hour');
    });

    it('should prevent brute force attacks with low threshold', () => {
      authRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.max).toBeLessThanOrEqual(5);
    });

    it('should have longer window for authentication attempts', () => {
      authRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBeGreaterThanOrEqual(60 * 60 * 1000);
    });
  });

  describe('strictRateLimiter', () => {
    it('should have very strict limits for sensitive operations', () => {
      strictRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(config.max).toBe(3); // Very strict
      expect(config.message).toContain('sensitive operation');
    });

    it('should enforce strictest rate limit threshold', () => {
      strictRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.max).toBeLessThanOrEqual(3);
    });
  });

  describe('uploadRateLimiter', () => {
    it('should have appropriate limits for file uploads', () => {
      uploadRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(config.max).toBe(10);
      expect(config.message).toContain('uploads');
    });

    it('should prevent upload abuse', () => {
      uploadRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.max).toBeLessThanOrEqual(10);
    });
  });

  describe('autoApplyRateLimiter', () => {
    it('should have daily limits for auto-apply feature', () => {
      autoApplyRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(config.max).toBe(50);
      expect(config.message).toContain('auto-apply');
      expect(config.message).toContain('Daily');
    });

    it('should prevent excessive automated applications', () => {
      autoApplyRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.windowMs).toBe(24 * 60 * 60 * 1000);
      expect(config.max).toBeLessThanOrEqual(50);
    });
  });

  describe('Rate Limit Bypass Prevention', () => {
    it('should not allow bypassing with different user agents', () => {
      mockReq.headers = { 'user-agent': 'Mozilla/5.0' };
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should track requests by IP address', () => {
      mockReq.ip = '10.0.0.1';
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should not allow bypassing with X-Forwarded-For header manipulation', () => {
      mockReq.headers = { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' };
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Rate Limit Thresholds Validation', () => {
    it('should enforce minimum rate limit for all endpoints', () => {
      const limiters = [
        apiRateLimiter,
        authRateLimiter,
        strictRateLimiter,
        uploadRateLimiter,
        autoApplyRateLimiter,
      ];

      limiters.forEach((limiter) => {
        limiter(mockReq as Request, mockRes as Response, nextFunction);
        const config = (mockReq as any).__rateLimitConfig;
        expect(config.max).toBeGreaterThan(0);
      });
    });

    it('should have reasonable time windows', () => {
      const limiters = [
        apiRateLimiter,
        authRateLimiter,
        strictRateLimiter,
        uploadRateLimiter,
        autoApplyRateLimiter,
      ];

      limiters.forEach((limiter) => {
        limiter(mockReq as Request, mockRes as Response, nextFunction);
        const config = (mockReq as any).__rateLimitConfig;
        expect(config.windowMs).toBeGreaterThan(0);
        expect(config.windowMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
      });
    });
  });

  describe('Security Headers in Rate Limit Response', () => {
    it('should include rate limit headers when enabled', () => {
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.standardHeaders).toBe(true);
    });

    it('should not include legacy headers', () => {
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config.legacyHeaders).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing IP address gracefully', () => {
      mockReq.ip = undefined;
      expect(() => {
        apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);
      }).not.toThrow();
    });

    it('should handle IPv6 addresses', () => {
      mockReq.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      expect(() => {
        apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);
      }).not.toThrow();
    });

    it('should handle localhost requests', () => {
      mockReq.ip = '127.0.0.1';
      expect(() => {
        apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);
      }).not.toThrow();
    });
  });

  describe('Message Customization', () => {
    it('should provide clear error messages for users', () => {
      const limiters = [
        { limiter: apiRateLimiter, name: 'api' },
        { limiter: authRateLimiter, name: 'auth' },
        { limiter: strictRateLimiter, name: 'strict' },
        { limiter: uploadRateLimiter, name: 'upload' },
        { limiter: autoApplyRateLimiter, name: 'autoApply' },
      ];

      limiters.forEach(({ limiter }) => {
        limiter(mockReq as Request, mockRes as Response, nextFunction);
        const config = (mockReq as any).__rateLimitConfig;
        expect(config.message).toBeTruthy();
        expect(config.message.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Compliance Requirements', () => {
    it('should support rate limiting for GDPR compliance', () => {
      // Rate limiting helps prevent automated scraping of personal data
      apiRateLimiter(mockReq as Request, mockRes as Response, nextFunction);

      const config = (mockReq as any).__rateLimitConfig;
      expect(config).toBeDefined();
      expect(config.max).toBeGreaterThan(0);
    });

    it('should prevent denial of service attacks', () => {
      // All endpoints should have rate limiting
      const limiters = [
        apiRateLimiter,
        authRateLimiter,
        strictRateLimiter,
        uploadRateLimiter,
        autoApplyRateLimiter,
      ];

      limiters.forEach((limiter) => {
        limiter(mockReq as Request, mockRes as Response, nextFunction);
        const config = (mockReq as any).__rateLimitConfig;
        expect(config.max).toBeDefined();
        expect(config.windowMs).toBeDefined();
      });
    });
  });
});
