import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TierRateLimitGuard } from './rate-limit.guard';

@Module({
  imports: [ConfigModule],
  providers: [TierRateLimitGuard],
  exports: [TierRateLimitGuard],
})
export class RateLimitModule {}
