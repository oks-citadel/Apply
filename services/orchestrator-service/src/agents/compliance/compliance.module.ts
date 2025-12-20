import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { AuditLogService } from './services/audit-log.service';
import { RateLimiterService } from './services/rate-limiter.service';

@Module({
  imports: [ConfigModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, RateLimiterService, AuditLogService],
  exports: [ComplianceService, RateLimiterService],
})
export class ComplianceModule {}
