/**
 * Web Vitals Performance Tests
 * Tests Core Web Vitals compliance for the Next.js application
 */

import { test, expect } from '@playwright/test';

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint (ms) - Good: < 2.5s
  FID: 100,  // First Input Delay (ms) - Good: < 100ms
  CLS: 0.1,  // Cumulative Layout Shift - Good: < 0.1
  FCP: 1800, // First Contentful Paint (ms) - Good: < 1.8s
  TTFB: 600, // Time to First Byte (ms) - Good: < 600ms
};

test.describe('Core Web Vitals', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should meet LCP threshold', async ({ page }) => {
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Timeout after 10 seconds
        setTimeout(() => resolve(0), 10000);
      });
    });

    console.log(`LCP: ${lcp}ms (threshold: ${THRESHOLDS.LCP}ms)`);
    expect(lcp).toBeLessThan(THRESHOLDS.LCP);
  });

  test('should meet FCP threshold', async ({ page }) => {
    const fcp = await page.evaluate(() => {
      const entry = performance.getEntriesByType('paint')
        .find((entry) => entry.name === 'first-contentful-paint') as any;
      return entry ? entry.startTime : 0;
    });

    console.log(`FCP: ${fcp}ms (threshold: ${THRESHOLDS.FCP}ms)`);
    expect(fcp).toBeLessThan(THRESHOLDS.FCP);
  });

  test('should meet TTFB threshold', async ({ page }) => {
    const ttfb = await page.evaluate(() => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navTiming.responseStart - navTiming.requestStart;
    });

    console.log(`TTFB: ${ttfb}ms (threshold: ${THRESHOLDS.TTFB}ms)`);
    expect(ttfb).toBeLessThan(THRESHOLDS.TTFB);
  });

  test('should meet CLS threshold', async ({ page }) => {
    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsScore = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        // Wait a bit for layout shifts to occur
        setTimeout(() => resolve(clsScore), 3000);
      });
    });

    console.log(`CLS: ${cls.toFixed(3)} (threshold: ${THRESHOLDS.CLS})`);
    expect(cls).toBeLessThan(THRESHOLDS.CLS);
  });

  test('should have optimal bundle size', async ({ page }) => {
    // Get all network requests
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      let totalJS = 0;
      let totalCSS = 0;
      let totalImages = 0;

      entries.forEach((entry) => {
        const size = entry.transferSize || 0;

        if (entry.name.includes('.js')) {
          totalJS += size;
        } else if (entry.name.includes('.css')) {
          totalCSS += size;
        } else if (entry.name.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)/i)) {
          totalImages += size;
        }
      });

      return {
        totalJS: Math.round(totalJS / 1024), // KB
        totalCSS: Math.round(totalCSS / 1024), // KB
        totalImages: Math.round(totalImages / 1024), // KB
      };
    });

    console.log('Bundle sizes:', resources);

    // Thresholds for bundle sizes (KB)
    expect(resources.totalJS).toBeLessThan(500); // Total JS should be < 500KB
    expect(resources.totalCSS).toBeLessThan(100); // Total CSS should be < 100KB
  });

  test('should use modern image formats', async ({ page }) => {
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map((img) => ({
        src: img.src,
        format: img.src.split('.').pop()?.toLowerCase(),
      }));
    });

    const modernFormats = images.filter(
      (img) => img.format === 'webp' || img.format === 'avif'
    );

    console.log(`Modern image formats: ${modernFormats.length}/${images.length}`);

    // At least 80% of images should use modern formats (if images exist)
    if (images.length > 0) {
      const modernPercentage = (modernFormats.length / images.length) * 100;
      expect(modernPercentage).toBeGreaterThan(80);
    }
  });

  test('should have proper caching headers', async ({ page }) => {
    const response = await page.goto('/');

    if (response) {
      const cacheControl = response.headers()['cache-control'];

      console.log('Cache-Control:', cacheControl);

      // Static assets should have cache headers
      expect(cacheControl).toBeTruthy();
    }
  });

  test('should use compression', async ({ page }) => {
    const response = await page.goto('/');

    if (response) {
      const encoding = response.headers()['content-encoding'];

      console.log('Content-Encoding:', encoding);

      // Response should be compressed
      expect(['gzip', 'br', 'deflate']).toContain(encoding);
    }
  });
});

test.describe('Performance Budget', () => {
  test('dashboard page load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // Should load in < 3s
  });

  test('jobs page load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Jobs page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('memory usage should be reasonable', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return {
          usedJSHeapSize: Math.round(mem.usedJSHeapSize / 1024 / 1024), // MB
          totalJSHeapSize: Math.round(mem.totalJSHeapSize / 1024 / 1024), // MB
        };
      }
      return null;
    });

    if (metrics) {
      console.log('Memory usage:', metrics);
      // Heap size should be reasonable (< 50MB for initial load)
      expect(metrics.usedJSHeapSize).toBeLessThan(50);
    }
  });
});
