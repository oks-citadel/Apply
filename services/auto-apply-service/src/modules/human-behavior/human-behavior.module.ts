import { Module } from '@nestjs/common';
import { TimingService } from './timing.service';
import { TypingSimulationService } from './typing-simulation.service';
import { MouseMovementService } from './mouse-movement.service';
import { FingerprintRotationService } from './fingerprint-rotation.service';
import { WarmupService } from './warmup.service';
import { RateLimiterService } from './rate-limiter.service';
import { HumanBehaviorService } from './human-behavior.service';

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
