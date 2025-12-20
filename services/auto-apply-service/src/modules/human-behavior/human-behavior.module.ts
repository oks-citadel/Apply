import { Module } from '@nestjs/common';

import { FingerprintRotationService } from './fingerprint-rotation.service';
import { HumanBehaviorService } from './human-behavior.service';
import { MouseMovementService } from './mouse-movement.service';
import { RateLimiterService } from './rate-limiter.service';
import { TimingService } from './timing.service';
import { TypingSimulationService } from './typing-simulation.service';
import { WarmupService } from './warmup.service';

@Module({
  providers: [
    TimingService,
    TypingSimulationService,
    MouseMovementService,
    FingerprintRotationService,
    WarmupService,
    RateLimiterService,
    HumanBehaviorService,
  ],
  exports: [
    TimingService,
    TypingSimulationService,
    MouseMovementService,
    FingerprintRotationService,
    WarmupService,
    RateLimiterService,
    HumanBehaviorService,
  ],
})
export class HumanBehaviorModule {}
