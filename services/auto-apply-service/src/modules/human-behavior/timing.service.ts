import { Injectable, Logger } from '@nestjs/common';

interface TimingConfig {
  minDelay: number;
  maxDelay: number;
  jitterPercentage: number;
}

interface DelayPattern {
  baseDelay: number;
  variance: number;
  burstProbability: number;
}

@Injectable()
export class TimingService {
  private readonly logger = new Logger(TimingService.name);

  // Time of day activity patterns (24-hour format)
  private readonly activityPatterns: Map<number, DelayPattern> = new Map([
    // Night hours (0-6) - very slow
    [0, { baseDelay: 8000, variance: 3000, burstProbability: 0.05 }],
    [1, { baseDelay: 10000, variance: 4000, burstProbability: 0.02 }],
    [2, { baseDelay: 12000, variance: 5000, burstProbability: 0.01 }],
    [3, { baseDelay: 15000, variance: 6000, burstProbability: 0.01 }],
    [4, { baseDelay: 12000, variance: 5000, burstProbability: 0.02 }],
    [5, { baseDelay: 8000, variance: 3000, burstProbability: 0.05 }],
    // Morning hours (6-12) - normal activity
    [6, { baseDelay: 5000, variance: 2000, burstProbability: 0.1 }],
    [7, { baseDelay: 4000, variance: 1500, burstProbability: 0.15 }],
    [8, { baseDelay: 3000, variance: 1000, burstProbability: 0.2 }],
    [9, { baseDelay: 2500, variance: 1000, burstProbability: 0.25 }],
    [10, { baseDelay: 2000, variance: 800, burstProbability: 0.3 }],
    [11, { baseDelay: 2000, variance: 800, burstProbability: 0.3 }],
    // Afternoon hours (12-18) - peak activity
    [12, { baseDelay: 2500, variance: 1000, burstProbability: 0.25 }],
    [13, { baseDelay: 3000, variance: 1200, burstProbability: 0.2 }],
    [14, { baseDelay: 2000, variance: 800, burstProbability: 0.35 }],
    [15, { baseDelay: 1800, variance: 700, burstProbability: 0.4 }],
    [16, { baseDelay: 2000, variance: 800, burstProbability: 0.35 }],
    [17, { baseDelay: 2500, variance: 1000, burstProbability: 0.3 }],
    // Evening hours (18-24) - moderate activity
    [18, { baseDelay: 3000, variance: 1200, burstProbability: 0.25 }],
    [19, { baseDelay: 3500, variance: 1400, burstProbability: 0.2 }],
    [20, { baseDelay: 4000, variance: 1600, burstProbability: 0.15 }],
    [21, { baseDelay: 4500, variance: 1800, burstProbability: 0.1 }],
    [22, { baseDelay: 5000, variance: 2000, burstProbability: 0.08 }],
    [23, { baseDelay: 6000, variance: 2500, burstProbability: 0.05 }],
  ]);

  // Day of week multipliers (0 = Sunday)
  private readonly dayMultipliers: Map<number, number> = new Map([
    [0, 1.5], // Sunday - slower
    [1, 1.0], // Monday - normal
    [2, 0.9], // Tuesday - slightly faster
    [3, 0.85], // Wednesday - faster
    [4, 0.9], // Thursday - slightly faster
    [5, 1.1], // Friday - slightly slower
    [6, 1.4], // Saturday - slower
  ]);

  /**
   * Generate a human-like delay based on time of day and day of week
   */
  async humanLikeDelay(minMs: number, maxMs: number): Promise<number> {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const pattern = this.activityPatterns.get(hour) || {
      baseDelay: 3000,
      variance: 1000,
      burstProbability: 0.2,
    };
    const dayMultiplier = this.dayMultipliers.get(day) || 1.0;

    // Check for burst mode (quick succession of actions)
    if (Math.random() < pattern.burstProbability) {
      const burstDelay = Math.max(minMs, minMs + Math.random() * (maxMs - minMs) * 0.3);
      return Math.round(burstDelay);
    }

    // Calculate delay with Gaussian distribution for more natural feel
    const gaussianRandom = this.gaussianRandom(0, 1);
    const normalizedRandom = Math.abs(gaussianRandom) / 3; // Normalize to ~0-1
    const clampedRandom = Math.min(1, normalizedRandom);

    const baseDelay = pattern.baseDelay * dayMultiplier;
    const variance = pattern.variance * dayMultiplier;
    const calculatedDelay = baseDelay + variance * clampedRandom;

    // Clamp to min/max bounds
    const finalDelay = Math.max(minMs, Math.min(maxMs, calculatedDelay));

    this.logger.debug(`Human-like delay: ${Math.round(finalDelay)}ms (hour: ${hour}, day: ${day})`);
    return Math.round(finalDelay);
  }

  /**
   * Wait for a human-like delay
   */
  async wait(minMs: number, maxMs: number): Promise<void> {
    const delay = await this.humanLikeDelay(minMs, maxMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Generate inter-keystroke delay for typing simulation
   */
  getInterKeystrokeDelay(baseDelay: number = 100): number {
    // Add natural variation to keystroke timing
    const variation = this.gaussianRandom(0, baseDelay * 0.3);
    const delay = Math.max(30, baseDelay + variation);

    // Occasionally add longer pauses (thinking pauses)
    if (Math.random() < 0.05) {
      return delay + Math.random() * 500 + 200; // 200-700ms extra
    }

    return Math.round(delay);
  }

  /**
   * Generate reading time based on content length
   */
  getReadingTime(contentLength: number, wordsPerMinute: number = 200): number {
    const estimatedWords = contentLength / 5; // Average word length
    const readingTimeMinutes = estimatedWords / wordsPerMinute;
    const readingTimeMs = readingTimeMinutes * 60 * 1000;

    // Add variance (±20%)
    const variance = readingTimeMs * 0.2;
    const finalTime = readingTimeMs + (Math.random() * variance * 2 - variance);

    return Math.max(500, Math.round(finalTime));
  }

  /**
   * Generate page load wait time
   */
  getPageLoadWait(): number {
    // Simulate human reaction time to page load (500ms - 3000ms)
    const baseReactionTime = 800;
    const variance = 1500;
    const reactionTime = baseReactionTime + Math.random() * variance;

    // Occasionally add longer waits (distracted user)
    if (Math.random() < 0.1) {
      return reactionTime + Math.random() * 5000; // Up to 5 extra seconds
    }

    return Math.round(reactionTime);
  }

  /**
   * Generate scrolling pause duration
   */
  getScrollPauseDuration(): number {
    // Humans pause while scrolling to read content
    const basePause = 300;
    const variance = 800;
    return Math.round(basePause + Math.random() * variance);
  }

  /**
   * Generate form field transition time
   */
  getFieldTransitionTime(): number {
    // Time between completing one field and starting another
    const baseTime = 200;
    const variance = 600;

    // Occasionally add longer pauses (thinking about next field)
    if (Math.random() < 0.15) {
      return baseTime + variance + Math.random() * 2000;
    }

    return Math.round(baseTime + Math.random() * variance);
  }

  /**
   * Determine if a break should be taken (fatigue simulation)
   */
  shouldTakeBreak(actionsCompleted: number, sessionDurationMinutes: number): boolean {
    // Increase break probability as session continues
    const baseProbability = 0.01;
    const actionFactor = actionsCompleted / 100;
    const timeFactor = sessionDurationMinutes / 60;

    const breakProbability = baseProbability + actionFactor * 0.05 + timeFactor * 0.1;
    return Math.random() < breakProbability;
  }

  /**
   * Generate break duration
   */
  getBreakDuration(): number {
    // Breaks range from 30 seconds to 10 minutes
    const breakTypes = [
      { weight: 0.4, min: 30000, max: 60000 }, // Short break: 30s - 1min
      { weight: 0.35, min: 60000, max: 180000 }, // Medium break: 1-3min
      { weight: 0.2, min: 180000, max: 300000 }, // Long break: 3-5min
      { weight: 0.05, min: 300000, max: 600000 }, // Extended break: 5-10min
    ];

    const random = Math.random();
    let cumulative = 0;

    for (const breakType of breakTypes) {
      cumulative += breakType.weight;
      if (random < cumulative) {
        return Math.round(breakType.min + Math.random() * (breakType.max - breakType.min));
      }
    }

    return 60000; // Default 1 minute
  }

  /**
   * Gaussian random number generator using Box-Muller transform
   */
  private gaussianRandom(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}
