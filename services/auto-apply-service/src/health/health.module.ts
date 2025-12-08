import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthService } from './health.service';

/**
 * Health Module for Auto Apply Service
 * Provides health check service for monitoring
 */
@Module({
  imports: [TypeOrmModule],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
