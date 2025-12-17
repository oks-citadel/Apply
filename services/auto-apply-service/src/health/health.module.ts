import { Module } from '@nestjs/common';
import { HealthService } from './health.service';

/**
 * Health Module for Auto Apply Service
 * Provides health check service for monitoring
 */
@Module({
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
