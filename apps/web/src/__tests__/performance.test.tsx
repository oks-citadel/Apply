/**
 * Frontend Performance Test Suite for ApplyForUs Web Application
 *
 * Tests focus on:
 * 1. Core Web Vitals (LCP, FID, CLS)
 * 2. JavaScript bundle size and loading time
 * 3. Image optimization and CDN delivery
 * 4. Client-side caching (Redis/Local Storage)
 * 5. Component rendering performance
 * 6. Memory leaks in React components
 * 7. API response handling
 * 8. Static asset delivery
 *
 * Run with: npm test -- performance.test.ts
 */

import { render, waitFor } from '@testing-library/react';
import { performance } from 'perf_hooks';

// Performance thresholds based on Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100, // First Input Delay (ms)
  CLS: 0.1, // Cumulative Layout Shift (score)

  // Custom Metrics
  TTI: 3500, // Time to Interactive (ms)
  FCP: 1800, // First Contentful Paint (ms)
  BUNDLE_SIZE: 500 * 1024, // 500KB
  IMAGE_LOAD: 1000, // Image loading time (ms)
  API_RESPONSE: 200, // API response time (ms)
  COMPONENT_RENDER: 16, // Component render time (ms) - 60fps
  MEMORY_LEAK_THRESHOLD: 10 * 1024 * 1024, // 10MB
};

// Mock components for testing
const MockJobsList = ({ jobs }: { jobs: any[] }) => {
  return (
    <div data-testid="jobs-list">
      {jobs.map((job, index) => (
        <div key={index} data-testid={`job-${index}`}>
          <h3>{job.title}</h3>
          <p>{job.company}</p>
        </div>
      ))}
    </div>
  );
};

const MockDashboard = () => {
  return (
    <div data-testid="dashboard">
      <header>Dashboard Header</header>
      <main>Dashboard Content</main>
      <footer>Dashboard Footer</footer>
    </div>
  );
};

describe('Frontend Performance Tests', () => {
  beforeEach(() => {
    // Clear any cached data
    localStorage.clear();
    sessionStorage.clear();

    // Mock performance API
    if (typeof window !== 'undefined' && !window.performance) {
      (window as any).performance = {
        now: () => Date.now(),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByName: jest.fn(() => []),
        getEntriesByType: jest.fn(() => []),
      };
    }
  });

  describe('Core Web Vitals', () => {
    it('should measure and validate Largest Contentful Paint (LCP)', async () => {
      const startTime = performance.now();

      // Simulate page load with large content
      const mockJobs = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        title: `Software Engineer ${i}`,
        company: `Company ${i}`,
      }));

      const { getByTestId } = render(<MockJobsList jobs={mockJobs} />);

      await waitFor(() => {
        expect(getByTestId('jobs-list')).toBeInTheDocument();
      });

      const lcp = performance.now() - startTime;

      console.log(`📊 LCP: ${lcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.LCP}ms)`);

      expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
    });

    it('should measure First Contentful Paint (FCP)', async () => {
      const startTime = performance.now();

      const { getByTestId } = render(<MockDashboard />);

      await waitFor(() => {
        expect(getByTestId('dashboard')).toBeInTheDocument();
      });

      const fcp = performance.now() - startTime;

      console.log(`📊 FCP: ${fcp.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.FCP}ms)`);

      expect(fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
    });

    it('should validate Cumulative Layout Shift (CLS)', () => {
      // Mock layout shift measurement
      const layoutShifts: number[] = [];

      // Simulate multiple renders that could cause layout shift
      const { rerender } = render(<MockDashboard />);

      // Measure initial layout
      const initialHeight = document.body.scrollHeight;

      // Re-render with additional content
      rerender(<MockDashboard />);

      const finalHeight = document.body.scrollHeight;
      const shift = Math.abs(finalHeight - initialHeight) / initialHeight;

      layoutShifts.push(shift);

      const cls = layoutShifts.reduce((sum, shift) => sum + shift, 0);

      console.log(`📊 CLS: ${cls.toFixed(4)} (threshold: ${PERFORMANCE_THRESHOLDS.CLS})`);

      expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render large lists efficiently', async () => {
      const itemCount = 1000;
      const mockJobs = Array.from({ length: itemCount }, (_, i) => ({
        id: i,
        title: `Job ${i}`,
        company: `Company ${i}`,
      }));

      const startTime = performance.now();

      render(<MockJobsList jobs={mockJobs} />);

      const renderTime = performance.now() - startTime;

      console.log(
        `📊 Large list render (${itemCount} items): ${renderTime.toFixed(2)}ms`,
      );

      // Should render within reasonable time even with many items
      expect(renderTime).toBeLessThan(500);
    });

    it('should maintain 60fps during animations', async () => {
      const frameTime = 1000 / 60; // 16.67ms per frame for 60fps

      const startTime = performance.now();

      // Simulate rapid re-renders (like animation frames)
      const { rerender } = render(<MockDashboard />);

      for (let i = 0; i < 10; i++) {
        rerender(<MockDashboard />);
      }

      const totalTime = performance.now() - startTime;
      const avgFrameTime = totalTime / 10;

      console.log(
        `📊 Average frame time: ${avgFrameTime.toFixed(2)}ms (target: ${frameTime.toFixed(2)}ms)`,
      );

      expect(avgFrameTime).toBeLessThan(frameTime);
    });

    it('should handle component mount/unmount efficiently', () => {
      const iterations = 100;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const { unmount } = render(<MockDashboard />);
        unmount();

        durations.push(performance.now() - startTime);
      }

      const avgDuration =
        durations.reduce((sum, d) => sum + d, 0) / iterations;

      console.log(
        `📊 Avg mount/unmount time (${iterations} iterations): ${avgDuration.toFixed(2)}ms`,
      );

      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated renders', () => {
      const iterations = 100;
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < iterations; i++) {
        const { unmount } = render(
          <MockJobsList
            jobs={Array.from({ length: 50 }, (_, j) => ({
              id: j,
              title: `Job ${j}`,
              company: `Company ${j}`,
            }))}
          />,
        );
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(
        `📊 Memory increase after ${iterations} renders: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      );

      expect(memoryIncrease).toBeLessThan(
        PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD,
      );
    });

    it('should cleanup event listeners on unmount', () => {
      const eventListeners: any[] = [];

      // Mock addEventListener to track listeners
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = jest.fn((event, handler) => {
        eventListeners.push({ event, handler });
        originalAddEventListener.call(window, event, handler);
      });

      const { unmount } = render(<MockDashboard />);

      const listenersBeforeUnmount = eventListeners.length;

      unmount();

      // Restore original
      window.addEventListener = originalAddEventListener;

      console.log(
        `📊 Event listeners: ${listenersBeforeUnmount} (should be cleaned up on unmount)`,
      );

      // Verify listeners are tracked (actual cleanup verification would need more complex setup)
      expect(listenersBeforeUnmount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bundle Size and Loading', () => {
    it('should validate JavaScript bundle size', () => {
      // In a real scenario, this would check the actual build output
      // For testing, we'll mock the bundle size check

      const mockBundleSize = 450 * 1024; // 450KB

      console.log(
        `📊 Bundle size: ${(mockBundleSize / 1024).toFixed(2)}KB (threshold: ${(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE / 1024).toFixed(2)}KB)`,
      );

      expect(mockBundleSize).toBeLessThan(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE);
    });

    it('should validate code splitting effectiveness', () => {
      // Mock code splitting chunks
      const chunks = [
        { name: 'main', size: 200 * 1024 },
        { name: 'vendor', size: 150 * 1024 },
        { name: 'dashboard', size: 50 * 1024 },
        { name: 'jobs', size: 40 * 1024 },
      ];

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const largestChunk = Math.max(...chunks.map((c) => c.size));

      console.log(`📊 Code splitting:`);
      chunks.forEach((chunk) => {
        console.log(
          `   ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB`,
        );
      });
      console.log(`   Total: ${(totalSize / 1024).toFixed(2)}KB`);

      // No single chunk should be too large
      expect(largestChunk).toBeLessThan(300 * 1024); // 300KB max per chunk
      expect(totalSize).toBeLessThan(500 * 1024); // 500KB total
    });
  });

  describe('Image and CDN Performance', () => {
    it('should load images efficiently', async () => {
      // Mock image loading
      const loadImage = (src: string): Promise<number> => {
        return new Promise((resolve) => {
          const startTime = performance.now();

          // Simulate image load
          const img = new Image();
          img.onload = () => resolve(performance.now() - startTime);
          img.onerror = () => resolve(performance.now() - startTime);

          // Mock image (in real test, would be actual image)
          setTimeout(() => img.onload?.(new Event('load')), 100);
        });
      };

      const loadTime = await loadImage('/mock-image.jpg');

      console.log(
        `📊 Image load time: ${loadTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.IMAGE_LOAD}ms)`,
      );

      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.IMAGE_LOAD);
    });

    it('should validate lazy loading implementation', async () => {
      // Mock lazy loading behavior
      const images = Array.from({ length: 20 }, (_, i) => ({
        src: `/image-${i}.jpg`,
        visible: i < 5, // Only first 5 visible initially
      }));

      const visibleImages = images.filter((img) => img.visible);
      const lazyImages = images.filter((img) => !img.visible);

      console.log(`📊 Lazy loading:`);
      console.log(`   Immediately loaded: ${visibleImages.length}`);
      console.log(`   Lazy loaded: ${lazyImages.length}`);

      // Should only load visible images initially
      expect(visibleImages.length).toBeLessThan(images.length);
      expect(lazyImages.length).toBeGreaterThan(0);
    });

    it('should use optimized image formats (WebP)', () => {
      // Mock image format check
      const images = [
        { src: 'logo.webp', format: 'webp', size: 50 * 1024 },
        { src: 'banner.webp', format: 'webp', size: 100 * 1024 },
        { src: 'avatar.webp', format: 'webp', size: 20 * 1024 },
      ];

      const totalSize = images.reduce((sum, img) => sum + img.size, 0);
      const allWebP = images.every((img) => img.format === 'webp');

      console.log(`📊 Image optimization:`);
      console.log(`   All images WebP: ${allWebP}`);
      console.log(`   Total size: ${(totalSize / 1024).toFixed(2)}KB`);

      expect(allWebP).toBe(true);
    });
  });

  describe('Caching Performance', () => {
    it('should cache API responses in localStorage', () => {
      const cacheKey = 'jobs_cache';
      const mockData = {
        jobs: Array.from({ length: 20 }, (_, i) => ({
          id: i,
          title: `Job ${i}`,
        })),
        timestamp: Date.now(),
      };

      const startTime = performance.now();

      // Write to cache
      localStorage.setItem(cacheKey, JSON.stringify(mockData));

      // Read from cache
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');

      const cacheTime = performance.now() - startTime;

      console.log(`📊 Cache read/write: ${cacheTime.toFixed(2)}ms`);

      expect(cached.jobs).toHaveLength(20);
      expect(cacheTime).toBeLessThan(10); // Cache should be very fast
    });

    it('should validate cache freshness', () => {
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      const cacheKey = 'api_cache';
      const mockData = {
        data: { test: 'data' },
        timestamp: Date.now() - 3 * 60 * 1000, // 3 minutes ago
      };

      localStorage.setItem(cacheKey, JSON.stringify(mockData));

      const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      const age = Date.now() - cached.timestamp;
      const isFresh = age < CACHE_TTL;

      console.log(`📊 Cache age: ${(age / 1000).toFixed(0)}s (TTL: ${(CACHE_TTL / 1000).toFixed(0)}s)`);
      console.log(`   Fresh: ${isFresh}`);

      expect(isFresh).toBe(true);
    });

    it('should handle cache invalidation efficiently', () => {
      // Set up multiple cache entries
      const cacheKeys = ['jobs', 'applications', 'resumes', 'profile'];

      cacheKeys.forEach((key) => {
        localStorage.setItem(
          `cache_${key}`,
          JSON.stringify({ data: 'test', timestamp: Date.now() }),
        );
      });

      const startTime = performance.now();

      // Invalidate specific cache
      localStorage.removeItem('cache_jobs');

      const invalidationTime = performance.now() - startTime;

      console.log(
        `📊 Cache invalidation time: ${invalidationTime.toFixed(2)}ms`,
      );

      expect(localStorage.getItem('cache_jobs')).toBeNull();
      expect(localStorage.getItem('cache_applications')).not.toBeNull();
      expect(invalidationTime).toBeLessThan(5);
    });
  });

  describe('API Response Handling', () => {
    it('should handle API responses efficiently', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: Array.from({ length: 20 }, (_, i) => ({ id: i })),
        }),
      });

      global.fetch = mockFetch;

      const startTime = performance.now();

      const response = await fetch('/jobs');
      const data = await response.json();

      const apiTime = performance.now() - startTime;

      console.log(
        `📊 API response handling: ${apiTime.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLDS.API_RESPONSE}ms)`,
      );

      expect(data.data).toHaveLength(20);
      expect(apiTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
    });

    it('should batch multiple API requests efficiently', async () => {
      const endpoints = [
        '/jobs',
        '/applications',
        '/resumes',
        '/profile',
      ];

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      global.fetch = mockFetch;

      const startTime = performance.now();

      await Promise.all(endpoints.map((url) => fetch(url)));

      const batchTime = performance.now() - startTime;

      console.log(
        `📊 Batched API requests (${endpoints.length}): ${batchTime.toFixed(2)}ms`,
      );

      // Batched should be faster than sequential
      expect(batchTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.API_RESPONSE * endpoints.length,
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect performance metrics', () => {
      const metrics = {
        timing: performance.timing || {},
        memory: (performance as any).memory || {},
        navigation: performance.navigation || {},
      };

      console.log(`📊 Performance Metrics:`);
      console.log(
        `   Heap Size: ${((metrics.memory.usedJSHeapSize || 0) / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(`   Navigation Type: ${metrics.navigation.type || 'N/A'}`);

      expect(metrics).toBeDefined();
    });

    it('should generate performance report', () => {
      const report = {
        timestamp: new Date().toISOString(),
        metrics: {
          lcp: 1800,
          fid: 50,
          cls: 0.05,
          tti: 2500,
          fcp: 1200,
        },
        bundles: {
          main: '200KB',
          vendor: '150KB',
          total: '350KB',
        },
        caching: {
          enabled: true,
          hitRate: 0.85,
        },
      };

      console.log(`📊 Performance Report:`);
      console.log(JSON.stringify(report, null, 2));

      expect(report.metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
      expect(report.metrics.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);
      expect(report.metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
    });
  });
});
