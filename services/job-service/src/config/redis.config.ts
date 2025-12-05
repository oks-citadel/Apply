import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  tls: process.env.REDIS_TLS === 'true',
  ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
  maxItems: parseInt(process.env.CACHE_MAX_ITEMS, 10) || 1000,
}));
