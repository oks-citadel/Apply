import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlatformHealthController } from './platform-health.controller';
import { PlatformHealthService } from './platform-health.service';

/**
 * Platform Health Module
 * Provides platform-wide health monitoring capabilities
 *
 * Features:
 * - Microservices health checks
 * - Queue health monitoring (RabbitMQ/Redis)
 * - Database connection health
 * - API latency metrics with percentiles
 * - Error rate tracking
 * - Comprehensive health reports
 */
@Module({
  imports: [
    // HTTP module for making health check requests to other services
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 2,
      headers: {
        'User-Agent': 'PlatformHealthService/1.0',
      },
    }),
    // Configuration for service URLs and thresholds
    ConfigModule,
    // TypeORM for database health checks (uses existing connection)
    TypeOrmModule,
  ],
  controllers: [PlatformHealthController],
  providers: [PlatformHealthService],
  exports: [PlatformHealthService],
})
export class PlatformHealthModule {}
