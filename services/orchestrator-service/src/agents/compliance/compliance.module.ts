import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { RateLimiterService } from './services/rate-limiter.service';
import { AuditLogService } from './services/audit-log.service';

@Module({
  imports: [ConfigModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, RateLimiterService, AuditLogService],
  exports: [ComplianceService, RateLimiterService],
})
export class ComplianceModule {}
