import { Injectable, Logger } from '@nestjs/common';

import type { Page } from 'playwright';

interface Point {
  x: number;
  y: number;
}

interface BezierCurve {
  points: Point[];
  duration: number;
}

interface MouseConfig {
  curveComplexity: number; // 1-5, higher = more complex curves
  speed: number; // pixels per second
  overshootProbability: number;
  jitterAmount: number;
}

@Injectable()
export class MouseMovementService {
  private readonly logger = new Logger(MouseMovementService.name);

  private currentPosition: Point = { x: 0, y: 0 };

  /**
   * Move mouse to element with human-like bezier curve movement
   */
  async moveToElement(
    page: Page,
    selector: string,
    config: Partial<MouseConfig> = {},
  ): Promise<void> {
    const finalConfig: MouseConfig = {
      curveComplexity: 3,
      speed: 500,
      overshootProbability: 0.15,
      jitterAmount: 2,
      ...config,
    };

    const element = await page.$(selector);
    if (!element) {
      this.logger.warn(`Element not found: ${selector}`);
      return;
    }

    const box = await element.boundingBox();
    if (!box) {
      this.logger.warn(`Could not get bounding box for: ${selector}`);
      return;
    }

    // Calculate target point (with slight randomization within element)
    const targetX = box.x + box.width * (0.3 + Math.random() * 0.4);
    const targetY = box.y + box.height * (0.3 + Math.random() * 0.4);

    await this.moveToPoint(page, { x: targetX, y: targetY }, finalConfig);
  }

  /**
   * Move mouse to a specific point with human-like movement
   */
  async moveToPoint(page: Page, target: Point, config: Partial<MouseConfig> = {}): Promise<void> {
    const finalConfig: MouseConfig = {
      curveComplexity: 3,
      speed: 500,
      overshootProbability: 0.15,
      jitterAmount: 2,
      ...config,
    };

    // Generate bezier curve path
    const curve = this.generateBezierPath(this.currentPosition, target, finalConfig);

    // Apply overshoot if triggered
    let overshootTarget: Point | null = null;
    if (Math.random() < finalConfig.overshootProbability) {
      overshootTarget = this.calculateOvershoot(this.currentPosition, target);
    }

    // Execute movement along the curve
    await this.executeMovement(page, curve, finalConfig);

    // If overshot, correct back to target
    if (overshootTarget) {
      const correctionCurve = this.generateBezierPath(overshootTarget, target, {
        ...finalConfig,
        curveComplexity: 2,
      });
      await this.executeMovement(page, correctionCurve, { ...finalConfig, speed: finalConfig.speed * 0.7 });
    }

    this.currentPosition = target;
  }

  /**
   * Click with human-like pre-movement and timing
   */
  async humanClick(page: Page, selector: string): Promise<void> {
    await this.moveToElement(page, selector);

    // Small pause before click (reaction time)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    // Random click duration (mousedown to mouseup)
    const clickDuration = 50 + Math.random() * 100;

    const element = await page.$(selector);
    if (!element) {return;}

    const box = await element.boundingBox();
    if (!box) {return;}

    const clickX = box.x + box.width * (0.3 + Math.random() * 0.4);
    const clickY = box.y + box.height * (0.3 + Math.random() * 0.4);

    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await new Promise((resolve) => setTimeout(resolve, clickDuration));
    await page.mouse.up();
  }

  /**
   * Perform a human-like scroll
   */
  async humanScroll(page: Page, deltaY: number): Promise<void> {
    // Break scroll into multiple smaller scrolls
    const scrollSteps = Math.ceil(Math.abs(deltaY) / 100);
    const stepSize = deltaY / scrollSteps;

    for (let i = 0; i < scrollSteps; i++) {
      // Add variance to each scroll step
      const variance = stepSize * (0.8 + Math.random() * 0.4);
      await page.mouse.wheel(0, variance);

      // Pause between scroll steps
      const pauseDuration = 30 + Math.random() * 70;
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));
    }
  }

  /**
   * Generate a bezier curve path between two points
   */
  private generateBezierPath(start: Point, end: Point, config: MouseConfig): BezierCurve {
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const duration = (distance / config.speed) * 1000;

    // Generate control points for cubic bezier
    const controlPoints = this.generateControlPoints(start, end, config.curveComplexity);

    // Generate path points
    const numPoints = Math.max(20, Math.ceil(distance / 5));
    const points: Point[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const point = this.calculateBezierPoint(t, [start, ...controlPoints, end]);

      // Add micro-jitter
      const jitter = this.generateJitter(config.jitterAmount);
      points.push({
        x: point.x + jitter.x,
        y: point.y + jitter.y,
      });
    }

    return { points, duration };
  }

  /**
   * Generate control points for bezier curve
   */
  private generateControlPoints(start: Point, end: Point, complexity: number): Point[] {
    const controlPoints: Point[] = [];
    const numControlPoints = Math.min(complexity, 4);

    for (let i = 0; i < numControlPoints; i++) {
      const t = (i + 1) / (numControlPoints + 1);
      const baseX = start.x + (end.x - start.x) * t;
      const baseY = start.y + (end.y - start.y) * t;

      // Add perpendicular offset
      const perpX = -(end.y - start.y);
      const perpY = end.x - start.x;
      const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);

      const offset = (Math.random() * 2 - 1) * perpLength * 0.3;
      controlPoints.push({
        x: baseX + (perpX / perpLength) * offset,
        y: baseY + (perpY / perpLength) * offset,
      });
    }

    return controlPoints;
  }

  /**
   * Calculate point on bezier curve at parameter t
   */
  private calculateBezierPoint(t: number, points: Point[]): Point {
    if (points.length === 1) {
      return points[0];
    }

    const newPoints: Point[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      newPoints.push({
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      });
    }

    return this.calculateBezierPoint(t, newPoints);
  }

  /**
   * Generate micro-jitter to simulate hand tremor
   */
  private generateJitter(amount: number): Point {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = Math.random() * amount;
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude,
    };
  }

  /**
   * Calculate overshoot position
   */
  private calculateOvershoot(start: Point, end: Point): Point {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const overshootAmount = 0.1 + Math.random() * 0.15;

    return {
      x: end.x + dx * overshootAmount,
      y: end.y + dy * overshootAmount,
    };
  }

  /**
   * Execute mouse movement along path
   */
  private async executeMovement(page: Page, curve: BezierCurve, config: MouseConfig): Promise<void> {
    const pointDelay = curve.duration / curve.points.length;

    for (const point of curve.points) {
      await page.mouse.move(point.x, point.y);
      await new Promise((resolve) => setTimeout(resolve, pointDelay));
    }
  }

  /**
   * Simulate mouse hover with natural movement
   */
  async hoverElement(page: Page, selector: string, hoverDuration: number = 500): Promise<void> {
    await this.moveToElement(page, selector);
    await new Promise((resolve) => setTimeout(resolve, hoverDuration + Math.random() * 300));
  }

  /**
   * Double click with human-like timing
   */
  async doubleClick(page: Page, selector: string): Promise<void> {
    await this.moveToElement(page, selector);

    const element = await page.$(selector);
    if (!element) {return;}

    const box = await element.boundingBox();
    if (!box) {return;}

    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2;

    // First click
    await page.mouse.click(clickX, clickY);

    // Gap between clicks (typically 100-300ms for double-click)
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 150));

    // Second click
    await page.mouse.click(clickX, clickY);
  }

  /**
   * Drag and drop with human-like movement
   */
  async dragAndDrop(page: Page, sourceSelector: string, targetSelector: string): Promise<void> {
    const source = await page.$(sourceSelector);
    const target = await page.$(targetSelector);

    if (!source || !target) {
      this.logger.warn('Source or target element not found for drag and drop');
      return;
    }

    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (!sourceBox || !targetBox) {return;}

    const sourceCenter = {
      x: sourceBox.x + sourceBox.width / 2,
      y: sourceBox.y + sourceBox.height / 2,
    };

    const targetCenter = {
      x: targetBox.x + targetBox.width / 2,
      y: targetBox.y + targetBox.height / 2,
    };

    // Move to source
    await this.moveToPoint(page, sourceCenter);
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));

    // Mouse down
    await page.mouse.down();
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50));

    // Drag to target with slower, more deliberate movement
    const dragCurve = this.generateBezierPath(sourceCenter, targetCenter, {
      curveComplexity: 2,
      speed: 200,
      overshootProbability: 0.05,
      jitterAmount: 3,
    });

    await this.executeMovement(page, dragCurve, { curveComplexity: 2, speed: 200, overshootProbability: 0.05, jitterAmount: 3 });

    // Mouse up
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
    await page.mouse.up();

    this.currentPosition = targetCenter;
  }
}
