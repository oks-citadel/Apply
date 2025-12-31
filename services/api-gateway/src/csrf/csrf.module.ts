import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CsrfService, CSRF_CONFIG_SERVICE } from '@applyforus/security';

import { CsrfController } from './csrf.controller';

/**
 * CSRF Module
 *
 * Provides CSRF protection using the Double-Submit Cookie pattern.
 * This module exports CsrfService for use in other modules that need
 * to set CSRF tokens (e.g., after authentication).
 */
@Module({
  imports: [ConfigModule],
  controllers: [CsrfController],
  providers: [
    {
      provide: CSRF_CONFIG_SERVICE,
      useExisting: ConfigService,
    },
    CsrfService,
  ],
  exports: [CsrfService],
})
export class CsrfModule {}
