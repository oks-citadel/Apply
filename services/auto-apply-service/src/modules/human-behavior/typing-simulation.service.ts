import { Injectable, Logger } from '@nestjs/common';

import { TimingService } from './timing.service';

import type { Page } from 'playwright';


interface TypingConfig {
  baseSpeed: number; // characters per minute
  errorRate: number; // probability of typo (0-1)
  correctionRate: number; // probability of correcting typo (0-1)
  burstTypingProbability: number; // probability of fast typing bursts
}

interface KeystrokeEvent {
  key: string;
  delay: number;
  isError: boolean;
  isCorrected: boolean;
}

@Injectable()
export class TypingSimulationService {
  private readonly logger = new Logger(TypingSimulationService.name);

  // QWERTY keyboard layout for typo simulation
  private readonly keyboardLayout: Map<string, string[]> = new Map([
    ['a', ['s', 'q', 'w', 'z']],
    ['b', ['v', 'n', 'g', 'h']],
    ['c', ['x', 'v', 'd', 'f']],
    ['d', ['s', 'f', 'e', 'r', 'c', 'x']],
    ['e', ['w', 'r', 'd', 's']],
    ['f', ['d', 'g', 'r', 't', 'v', 'c']],
    ['g', ['f', 'h', 't', 'y', 'b', 'v']],
    ['h', ['g', 'j', 'y', 'u', 'n', 'b']],
    ['i', ['u', 'o', 'k', 'j']],
    ['j', ['h', 'k', 'u', 'i', 'm', 'n']],
    ['k', ['j', 'l', 'i', 'o', 'm']],
    ['l', ['k', 'o', 'p']],
    ['m', ['n', 'j', 'k']],
    ['n', ['b', 'm', 'h', 'j']],
    ['o', ['i', 'p', 'k', 'l']],
    ['p', ['o', 'l']],
    ['q', ['w', 'a']],
    ['r', ['e', 't', 'd', 'f']],
    ['s', ['a', 'd', 'w', 'e', 'x', 'z']],
    ['t', ['r', 'y', 'f', 'g']],
    ['u', ['y', 'i', 'h', 'j']],
    ['v', ['c', 'b', 'f', 'g']],
    ['w', ['q', 'e', 'a', 's']],
    ['x', ['z', 'c', 's', 'd']],
    ['y', ['t', 'u', 'g', 'h']],
    ['z', ['a', 'x', 's']],
  ]);

  // Common double-letter sequences (typed faster)
  private readonly doubleLetters = ['ll', 'ss', 'ee', 'tt', 'ff', 'rr', 'nn', 'oo', 'pp', 'mm'];

  constructor(private readonly timingService: TimingService) {}

  /**
   * Type text with human-like behavior including typos and corrections
   */
  async typeText(
    page: Page,
    selector: string,
    text: string,
    config: Partial<TypingConfig> = {},
  ): Promise<void> {
    const finalConfig: TypingConfig = {
      baseSpeed: 300, // 300 characters per minute
      errorRate: 0.02, // 2% error rate
      correctionRate: 0.85, // 85% of errors are corrected
      burstTypingProbability: 0.1,
      ...config,
    };

    this.logger.log(`Typing ${text.length} characters with human simulation`);

    // Click on the element first
    await page.click(selector);
    await this.timingService.wait(200, 500);

    const keystrokes = this.generateKeystrokes(text, finalConfig);
    let typedText = '';

    for (const keystroke of keystrokes) {
      // Wait before keystroke
      await new Promise((resolve) => setTimeout(resolve, keystroke.delay));

      if (keystroke.isCorrected) {
        // Type the wrong key, then backspace and correct
        await page.keyboard.press(keystroke.key);
        typedText += keystroke.key;

        // Pause to "notice" the error
        await this.timingService.wait(100, 300);

        // Backspace
        await page.keyboard.press('Backspace');
        typedText = typedText.slice(0, -1);

        await this.timingService.wait(50, 150);
      }

      // Type the correct key
      const correctKey = keystroke.isError && keystroke.isCorrected ? keystroke.key : keystroke.key;
      if (!keystroke.isCorrected || keystroke.isError) {
        await page.keyboard.press(keystroke.key);
        typedText += keystroke.key;
      }
    }
  }

  /**
   * Type text character by character with variable delays
   */
  async typeCharByChar(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector);
    await this.timingService.wait(100, 300);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      // Calculate delay
      let delay = this.timingService.getInterKeystrokeDelay(100);

      // Faster for double letters
      if (nextChar && this.doubleLetters.includes(char + nextChar)) {
        delay = Math.round(delay * 0.6);
      }

      // Slower after punctuation
      if (['.', ',', '!', '?', ';', ':'].includes(text[i - 1])) {
        delay = Math.round(delay * 1.5);
      }

      // Longer pause at word boundaries
      if (char === ' ') {
        delay = Math.round(delay * 1.3);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      await page.keyboard.type(char, { delay: 0 });
    }
  }

  /**
   * Fill a form field with human-like typing
   */
  async fillField(page: Page, selector: string, value: string): Promise<void> {
    // Clear existing value first
    const element = await page.$(selector);
    if (!element) {
      this.logger.warn(`Element not found: ${selector}`);
      return;
    }

    // Focus on element
    await element.click();
    await this.timingService.wait(100, 300);

    // Select all and clear (like a human would)
    await page.keyboard.press('Control+a');
    await this.timingService.wait(50, 150);
    await page.keyboard.press('Backspace');
    await this.timingService.wait(100, 300);

    // Type the new value
    await this.typeCharByChar(page, selector, value);
  }

  /**
   * Generate keystroke events with timing and errors
   */
  private generateKeystrokes(text: string, config: TypingConfig): KeystrokeEvent[] {
    const keystrokes: KeystrokeEvent[] = [];
    const baseDelayMs = 60000 / config.baseSpeed; // Convert CPM to ms per character

    let inBurstMode = false;
    let burstRemaining = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = text[i - 1];
      const nextChar = text[i + 1];

      // Determine if we should enter burst mode
      if (!inBurstMode && Math.random() < config.burstTypingProbability) {
        inBurstMode = true;
        burstRemaining = Math.floor(Math.random() * 10) + 5; // 5-15 characters
      }

      // Calculate delay
      let delay = baseDelayMs;

      if (inBurstMode) {
        delay = delay * 0.5; // Faster during burst
        burstRemaining--;
        if (burstRemaining <= 0) {
          inBurstMode = false;
        }
      }

      // Adjust for context
      delay = this.adjustDelayForContext(delay, char, prevChar, nextChar);

      // Add gaussian variation
      delay = delay + (Math.random() * delay * 0.4 - delay * 0.2);

      // Determine if this keystroke has an error
      const isError = Math.random() < config.errorRate && this.keyboardLayout.has(char.toLowerCase());
      const isCorrected = isError && Math.random() < config.correctionRate;

      let key = char;
      if (isError) {
        // Get a nearby key as the typo
        const nearbyKeys = this.keyboardLayout.get(char.toLowerCase()) || [char];
        key = nearbyKeys[Math.floor(Math.random() * nearbyKeys.length)];
        if (char === char.toUpperCase() && char !== char.toLowerCase()) {
          key = key.toUpperCase();
        }
      }

      keystrokes.push({
        key: isError ? key : char,
        delay: Math.max(30, Math.round(delay)),
        isError,
        isCorrected,
      });

      // If error was corrected, add the correct keystroke
      if (isCorrected) {
        keystrokes.push({
          key: char,
          delay: Math.max(30, Math.round(delay * 0.8)),
          isError: false,
          isCorrected: false,
        });
      }
    }

    return keystrokes;
  }

  /**
   * Adjust keystroke delay based on character context
   */
  private adjustDelayForContext(
    baseDelay: number,
    char: string,
    prevChar?: string,
    nextChar?: string,
  ): number {
    let multiplier = 1.0;

    // Punctuation takes longer
    if (['.', ',', '!', '?', ';', ':', "'", '"'].includes(char)) {
      multiplier *= 1.3;
    }

    // Numbers are slower (reaching to number row)
    if (/\d/.test(char)) {
      multiplier *= 1.2;
    }

    // Special characters are slowest
    if (['@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='].includes(char)) {
      multiplier *= 1.5;
    }

    // Shift transitions are slower
    if (prevChar && char !== char.toLowerCase() && prevChar === prevChar.toLowerCase()) {
      multiplier *= 1.2;
    }

    // Same finger sequences are slower (simplified)
    if (prevChar && this.isSameHand(prevChar, char)) {
      multiplier *= 1.1;
    }

    // Double letters are faster
    if (prevChar === char) {
      multiplier *= 0.7;
    }

    return baseDelay * multiplier;
  }

  /**
   * Simple heuristic for same-hand typing (affects speed)
   */
  private isSameHand(char1: string, char2: string): boolean {
    const leftHand = new Set(['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b']);
    const c1 = char1.toLowerCase();
    const c2 = char2.toLowerCase();
    return (leftHand.has(c1) && leftHand.has(c2)) || (!leftHand.has(c1) && !leftHand.has(c2));
  }
}
