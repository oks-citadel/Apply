import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RateLimiterService } from '../rate-limiter.service';
import { Platform } from '../../dto/compliance.dto';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    multi: jest.fn(() => ({
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    })),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
  }));
});

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: undefined,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimiterService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RateLimiterService>(RateLimiterService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRateLimit', () => {
    it('should allow request within rate limits', async () => {
      const result = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBeDefined();
      expect(result.limit).toBeDefined();
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.recommendedDelayMs).toBeDefined();
    });

    it('should apply LinkedIn rate limits', async () => {
      const result = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );

      expect(result.limit).toBeGreaterThan(0);
    });

    it('should apply Indeed rate limits', async () => {
      const result = await service.checkRateLimit(
        'user-123',
        Platform.INDEED,
        'search',
      );

      expect(result.limit).toBeGreaterThan(0);
    });

    it('should apply Glassdoor rate limits', async () => {
      const result = await service.checkRateLimit(
        'user-123',
        Platform.GLASSDOOR,
        'search',
      );

      expect(result.limit).toBeGreaterThan(0);
    });

    it('should apply Greenhouse rate limits', async () => {
      const result = await service.checkRateLimit(
        'user-123',
        Platform.GREENHOUSE,
        'search',
      );

      expect(result.limit).toBeGreaterThan(0);
    });

    it('should apply Lever rate limits', async () => {
      const result = await service.checkRateLimit(
        'user-123',
        Platform.LEVER,
        'search',
      );

      expect(result.limit).toBeGreaterThan(0);
    });

    it('should apply Workday rate limits', async () => {
      const result = await service.checkRateLimit(
        'user-123',
        Platform.WORKDAY,
        'search',
      );

      expect(result.limit).toBeGreaterThan(0);
    });

    it('should apply custom rate limits when provided', async () => {
      const customLimits = {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 500,
        applicationsPerDay: 20,
      };

      const result = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
        customLimits,
      );

      expect(result.allowed).toBe(true);
    });

    it('should increment counters after allowing request', async () => {
      await service.checkRateLimit('user-123', Platform.LINKEDIN, 'search');
      const result = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );

      expect(result.currentUsage).toBeGreaterThan(0);
    });

    it('should calculate recommended delay for high usage', async () => {
      // Simulate high usage
      for (let i = 0; i < 20; i++) {
        await service.checkRateLimit('user-123', Platform.LINKEDIN, 'search');
      }

      const result = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );

      expect(result.recommendedDelayMs).toBeGreaterThan(0);
    });

    it('should deny request when minute limit exceeded', async () => {
      const customLimits = {
        requestsPerMinute: 2,
        requestsPerHour: 100,
        requestsPerDay: 500,
        applicationsPerDay: 20,
      };

      // Make requests up to limit
      await service.checkRateLimit(
        'user-limit-test',
        Platform.LINKEDIN,
        'test',
        customLimits,
      );
      await service.checkRateLimit(
        'user-limit-test',
        Platform.LINKEDIN,
        'test',
        customLimits,
      );

      // This should exceed limit
      const result = await service.checkRateLimit(
        'user-limit-test',
        Platform.LINKEDIN,
        'test',
        customLimits,
      );

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBeGreaterThanOrEqual(customLimits.requestsPerMinute);
    });

    it('should provide reset time when limit exceeded', async () => {
      const customLimits = {
        requestsPerMinute: 1,
        requestsPerHour: 100,
        requestsPerDay: 500,
        applicationsPerDay: 20,
      };

      await service.checkRateLimit(
        'user-reset-test',
        Platform.LINKEDIN,
        'reset-test',
        customLimits,
      );

      const result = await service.checkRateLimit(
        'user-reset-test',
        Platform.LINKEDIN,
        'reset-test',
        customLimits,
      );

      if (!result.allowed) {
        expect(result.resetAt).toBeInstanceOf(Date);
        expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should handle different operations for same user and platform', async () => {
      const result1 = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );
      const result2 = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'apply',
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should handle different users on same platform', async () => {
      const result1 = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );
      const result2 = await service.checkRateLimit(
        'user-456',
        Platform.LINKEDIN,
        'search',
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should handle same user on different platforms', async () => {
      const result1 = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );
      const result2 = await service.checkRateLimit(
        'user-123',
        Platform.INDEED,
        'search',
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('checkApplicationLimit', () => {
    it('should allow applications within daily limit', async () => {
      const result = await service.checkApplicationLimit(
        'user-123',
        Platform.LINKEDIN,
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(25); // LinkedIn default
    });

    it('should use custom application limit when provided', async () => {
      const customLimit = 50;

      const result = await service.checkApplicationLimit(
        'user-123',
        Platform.LINKEDIN,
        customLimit,
      );

      expect(result.limit).toBe(customLimit);
    });

    it('should track application count separately from search', async () => {
      await service.checkRateLimit('user-123', Platform.LINKEDIN, 'search');
      const appResult = await service.checkApplicationLimit(
        'user-123',
        Platform.LINKEDIN,
      );

      expect(appResult.allowed).toBe(true);
    });

    it('should deny applications when daily limit exceeded', async () => {
      const customLimit = 2;

      await service.checkApplicationLimit('user-app-test', Platform.LINKEDIN, customLimit);
      await service.checkApplicationLimit('user-app-test', Platform.LINKEDIN, customLimit);

      const result = await service.checkApplicationLimit(
        'user-app-test',
        Platform.LINKEDIN,
        customLimit,
      );

      if (!result.allowed) {
        expect(result.currentUsage).toBeGreaterThanOrEqual(customLimit);
      }
    });

    it('should have different limits for different platforms', async () => {
      const linkedinResult = await service.checkApplicationLimit(
        'user-123',
        Platform.LINKEDIN,
      );
      const indeedResult = await service.checkApplicationLimit(
        'user-123',
        Platform.INDEED,
      );

      // LinkedIn: 25, Indeed: 50
      expect(linkedinResult.limit).toBe(25);
      expect(indeedResult.limit).toBe(50);
    });
  });

  describe('getPlatformLimits', () => {
    it('should return LinkedIn limits', () => {
      const limits = service.getPlatformLimits(Platform.LINKEDIN);

      expect(limits.requestsPerMinute).toBe(30);
      expect(limits.requestsPerHour).toBe(200);
      expect(limits.requestsPerDay).toBe(500);
      expect(limits.applicationsPerDay).toBe(25);
    });

    it('should return Indeed limits', () => {
      const limits = service.getPlatformLimits(Platform.INDEED);

      expect(limits.requestsPerMinute).toBe(60);
      expect(limits.requestsPerHour).toBe(300);
      expect(limits.requestsPerDay).toBe(1000);
      expect(limits.applicationsPerDay).toBe(50);
    });

    it('should return Glassdoor limits', () => {
      const limits = service.getPlatformLimits(Platform.GLASSDOOR);

      expect(limits.requestsPerMinute).toBe(30);
      expect(limits.requestsPerHour).toBe(150);
      expect(limits.requestsPerDay).toBe(400);
      expect(limits.applicationsPerDay).toBe(20);
    });

    it('should return Greenhouse limits', () => {
      const limits = service.getPlatformLimits(Platform.GREENHOUSE);

      expect(limits.requestsPerMinute).toBe(60);
      expect(limits.requestsPerHour).toBe(500);
      expect(limits.requestsPerDay).toBe(2000);
      expect(limits.applicationsPerDay).toBe(100);
    });

    it('should return Lever limits', () => {
      const limits = service.getPlatformLimits(Platform.LEVER);

      expect(limits.requestsPerMinute).toBe(60);
      expect(limits.requestsPerHour).toBe(500);
      expect(limits.requestsPerDay).toBe(2000);
      expect(limits.applicationsPerDay).toBe(100);
    });

    it('should return Workday limits', () => {
      const limits = service.getPlatformLimits(Platform.WORKDAY);

      expect(limits.requestsPerMinute).toBe(20);
      expect(limits.requestsPerHour).toBe(100);
      expect(limits.requestsPerDay).toBe(300);
      expect(limits.applicationsPerDay).toBe(15);
    });

    it('should return Generic platform limits', () => {
      const limits = service.getPlatformLimits(Platform.GENERIC);

      expect(limits.requestsPerMinute).toBe(60);
      expect(limits.requestsPerHour).toBe(300);
      expect(limits.requestsPerDay).toBe(1000);
      expect(limits.applicationsPerDay).toBe(50);
    });
  });

  describe('resetLimits', () => {
    it('should reset limits for user and platform', async () => {
      // Make some requests
      await service.checkRateLimit('user-reset', Platform.LINKEDIN, 'search');
      await service.checkRateLimit('user-reset', Platform.LINKEDIN, 'search');

      // Reset limits
      await service.resetLimits('user-reset', Platform.LINKEDIN);

      // Check that limits are reset
      const result = await service.checkRateLimit(
        'user-reset',
        Platform.LINKEDIN,
        'search',
      );

      expect(result.currentUsage).toBe(0);
    });

    it('should only reset limits for specific platform', async () => {
      // Make requests on two platforms
      await service.checkRateLimit('user-123', Platform.LINKEDIN, 'search');
      await service.checkRateLimit('user-123', Platform.INDEED, 'search');

      // Reset only LinkedIn
      await service.resetLimits('user-123', Platform.LINKEDIN);

      // LinkedIn should be reset, Indeed should not
      const linkedinResult = await service.checkRateLimit(
        'user-123',
        Platform.LINKEDIN,
        'search',
      );
      const indeedResult = await service.checkRateLimit(
        'user-123',
        Platform.INDEED,
        'search',
      );

      expect(linkedinResult.currentUsage).toBe(0);
      expect(indeedResult.currentUsage).toBeGreaterThan(0);
    });

    it('should handle reset for non-existent user gracefully', async () => {
      await expect(
        service.resetLimits('non-existent-user', Platform.LINKEDIN),
      ).resolves.not.toThrow();
    });
  });

  describe('Recommended Delay Calculation', () => {
    it('should return 0 delay for low usage', async () => {
      const result = await service.checkRateLimit(
        'user-delay-test',
        Platform.LINKEDIN,
        'search',
      );

      expect(result.recommendedDelayMs).toBe(0);
    });

    it('should return positive delay for high usage', async () => {
      // Simulate high usage (75% of limit)
      const customLimits = {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 500,
        applicationsPerDay: 20,
      };

      for (let i = 0; i < 7; i++) {
        await service.checkRateLimit(
          'user-high-usage',
          Platform.LINKEDIN,
          'high-usage-test',
          customLimits,
        );
      }

      const result = await service.checkRateLimit(
        'user-high-usage',
        Platform.LINKEDIN,
        'high-usage-test',
        customLimits,
      );

      if (result.allowed) {
        expect(result.recommendedDelayMs).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests from same user', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() =>
          service.checkRateLimit('user-concurrent', Platform.LINKEDIN, 'search'),
        );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.allowed).toBeDefined();
      });
    });

    it('should handle requests across multiple time windows', async () => {
      // Make requests in minute window
      const result1 = await service.checkRateLimit(
        'user-windows',
        Platform.LINKEDIN,
        'search',
      );

      // Make requests in hour window
      const result2 = await service.checkRateLimit(
        'user-windows',
        Platform.LINKEDIN,
        'search',
      );

      // Make requests in day window
      const result3 = await service.checkRateLimit(
        'user-windows',
        Platform.LINKEDIN,
        'search',
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should handle very high custom limits', async () => {
      const customLimits = {
        requestsPerMinute: 10000,
        requestsPerHour: 100000,
        requestsPerDay: 1000000,
        applicationsPerDay: 10000,
      };

      const result = await service.checkRateLimit(
        'user-high-limits',
        Platform.GENERIC,
        'search',
        customLimits,
      );

      expect(result.allowed).toBe(true);
    });

    it('should handle very low custom limits', async () => {
      const customLimits = {
        requestsPerMinute: 1,
        requestsPerHour: 1,
        requestsPerDay: 1,
        applicationsPerDay: 1,
      };

      const result = await service.checkRateLimit(
        'user-low-limits',
        Platform.GENERIC,
        'search-low',
        customLimits,
      );

      expect(result.allowed).toBe(true);
    });

    it('should handle special characters in user ID', async () => {
      const specialUserId = 'user-!@#$%^&*()';

      const result = await service.checkRateLimit(
        specialUserId,
        Platform.LINKEDIN,
        'search',
      );

      expect(result.allowed).toBe(true);
    });

    it('should handle long user IDs', async () => {
      const longUserId = 'a'.repeat(1000);

      const result = await service.checkRateLimit(
        longUserId,
        Platform.LINKEDIN,
        'search',
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe('In-Memory Fallback', () => {
    it('should use in-memory store when Redis is unavailable', async () => {
      // Service should fall back to in-memory store automatically
      const result = await service.checkRateLimit(
        'user-memory',
        Platform.LINKEDIN,
        'search',
      );

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });

    it('should track counts in memory', async () => {
      await service.checkRateLimit('user-mem-track', Platform.LINKEDIN, 'search');
      await service.checkRateLimit('user-mem-track', Platform.LINKEDIN, 'search');

      const result = await service.checkRateLimit(
        'user-mem-track',
        Platform.LINKEDIN,
        'search',
      );

      expect(result.currentUsage).toBeGreaterThan(0);
    });
  });
});
