import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}): RateLimitRequestHandler {
  const finalConfig = {
    ...defaultConfig,
    ...config,
    message: config.message || 'Too many requests, please try again later.',
  };

  return rateLimit(finalConfig);
}

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests from this IP, please try again after 15 minutes',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many login attempts, please try again after an hour',
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Rate limit exceeded for sensitive operation',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many uploads, please try again later',
});

export const autoApplyRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50,
  message: 'Daily auto-apply limit reached',
});
