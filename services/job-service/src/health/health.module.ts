import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Health Module for Job Service
 * Provides health check endpoints for monitoring and orchestration
 * Monitors Database, Redis, and Elasticsearch connectivity
 */
@Module({
  imports: [TypeOrmModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
