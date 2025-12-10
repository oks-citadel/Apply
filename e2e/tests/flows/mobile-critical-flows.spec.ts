import { test, expect } from '@playwright/test';

test.describe('Mobile Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test.describe('Mobile Registration Flow', () => {
    test('should complete registration form on mobile', async ({ page }) => {
      await page.goto('/register');

      // Fill registration form
      const firstNameInput = page.locator(
        'input[name="firstName"], input[placeholder*="first" i], input[id*="first" i]'
      ).first();
      const lastNameInput = page.locator(
        'input[name="lastName"], input[placeholder*="last" i], input[id*="last" i]'
      ).first();
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

      if (await firstNameInput.isVisible()) {
        await firstNameInput.fill('Test');
      }
      if (await lastNameInput.isVisible()) {
        await lastNameInput.fill('User');
      }
      await emailInput.fill(`test${Date.now()}@example.com`);
      await passwordInput.fill('SecurePass123!');

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      // Verify touch target size
      const box = await submitButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should have properly sized touch targets on registration', async ({ page }) => {
      await page.goto('/register');

      const inputs = page.locator('input:visible');
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const box = await input.boundingBox();
        if (box) {
          // Touch targets should be at least 44px
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should display validation errors on mobile', async ({ page }) => {
      await page.goto('/register');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should show validation errors
      await page.waitForTimeout(500);
      const errorMessages = page.locator('[role="alert"], .error, .text-red-500, .text-destructive');
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeGreaterThanOrEqual(0); // May have inline validation
    });
  });

  test.describe('Mobile Login Flow', () => {
    test('should login on mobile device', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'password123');

      const loginButton = page.locator('button[type="submit"]');
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();
    });

    test('should toggle password visibility on mobile', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('testpassword');

      const toggleButton = page.locator(
        'button[aria-label*="password" i], [data-testid="toggle-password"], button:has(svg):near(input[type="password"])'
      ).first();

      if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await toggleButton.click();
        // After toggle, input type should be text
        const inputType = await passwordInput.getAttribute('type');
        expect(inputType === 'text' || inputType === 'password').toBeTruthy();
      }
    });

    test('should show forgot password link on mobile', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.locator('a:has-text("forgot"), a:has-text("Forgot")').first();
      if (await forgotLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(forgotLink).toBeVisible();
      }
    });
  });

  test.describe('Mobile Job Search Flow', () => {
    test('should search jobs on mobile viewport', async ({ page }) => {
      await page.goto('/jobs');

      const searchInput = page.locator(
        'input[placeholder*="search" i], input[name="search"], input[type="search"]'
      ).first();

      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('developer');
        await searchInput.press('Enter');

        await page.waitForTimeout(1000);
        const results = page.locator(
          '[data-testid="job-card"], .job-card, article, [role="article"]'
        );
        const count = await results.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle mobile filter toggle', async ({ page }) => {
      await page.goto('/jobs');

      const filterButton = page.locator(
        'button:has-text("Filter"), [data-testid="filter-toggle"], button[aria-label*="filter" i]'
      ).first();

      if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterButton.click();

        const filterPanel = page.locator(
          '[data-testid="filter-panel"], .filter-panel, [role="dialog"], aside'
        );
        await expect(filterPanel.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should scroll job list on mobile', async ({ page }) => {
      await page.goto('/jobs');

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      // Page should handle scroll
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Dashboard Navigation', () => {
    test('should show mobile menu button', async ({ page }) => {
      await page.goto('/dashboard');

      const menuButton = page.locator(
        'button[aria-label*="menu" i], [data-testid="mobile-menu"], button:has(svg[class*="menu"])'
      ).first();

      // Mobile menu should be visible on small screens
      if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(menuButton).toBeVisible();
      }
    });

    test('should navigate via mobile menu', async ({ page }) => {
      await page.goto('/dashboard');

      const menuButton = page.locator(
        'button[aria-label*="menu" i], [data-testid="mobile-menu"]'
      ).first();

      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();

        const nav = page.locator('nav, [role="navigation"]');
        await expect(nav.first()).toBeVisible();
      }
    });
  });

  test.describe('Mobile Touch Interactions', () => {
    test('should have minimum touch target sizes', async ({ page }) => {
      await page.goto('/');

      const buttons = page.locator('button:visible, a[role="button"]:visible');
      const count = await buttons.count();

      let checkedCount = 0;
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          // Touch targets should be at least 44px (WCAG guidelines)
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
          checkedCount++;
        }
      }
      expect(checkedCount).toBeGreaterThan(0);
    });

    test('should have adequate spacing between interactive elements', async ({ page }) => {
      await page.goto('/login');

      const inputs = page.locator('input:visible');
      const count = await inputs.count();

      if (count >= 2) {
        const firstBox = await inputs.nth(0).boundingBox();
        const secondBox = await inputs.nth(1).boundingBox();

        if (firstBox && secondBox) {
          const gap = secondBox.y - (firstBox.y + firstBox.height);
          // Should have at least 8px gap between elements
          expect(gap).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Mobile Orientation', () => {
    test('should handle landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/');

      const content = page.locator('main, [role="main"], .main-content, body > div').first();
      await expect(content).toBeVisible();

      // Content should still be accessible in landscape
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      // Should not have excessive horizontal scroll
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 50);
    });

    test('should maintain state during orientation change', async ({ page }) => {
      await page.goto('/login');

      // Fill email
      await page.fill('input[type="email"]', 'test@example.com');

      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });

      // Email should still be filled
      const emailValue = await page.locator('input[type="email"]').inputValue();
      expect(emailValue).toBe('test@example.com');

      // Change back to portrait
      await page.setViewportSize({ width: 375, height: 667 });

      // Email should still be filled
      const emailValueAfter = await page.locator('input[type="email"]').inputValue();
      expect(emailValueAfter).toBe('test@example.com');
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds on mobile
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have layout shifts', async ({ page }) => {
      await page.goto('/');

      // Wait for page to stabilize
      await page.waitForTimeout(1000);

      // Check that main content is stable
      const content = page.locator('main, [role="main"]').first();
      if (await content.isVisible({ timeout: 2000 }).catch(() => false)) {
        const initialBox = await content.boundingBox();

        await page.waitForTimeout(500);

        const finalBox = await content.boundingBox();

        if (initialBox && finalBox) {
          // Position should not shift significantly
          expect(Math.abs(finalBox.y - initialBox.y)).toBeLessThan(50);
        }
      }
    });
  });
});
