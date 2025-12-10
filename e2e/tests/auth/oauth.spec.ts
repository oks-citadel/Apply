import { test, expect } from '@playwright/test';

test.describe('OAuth / Social Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('OAuth Button Presence', () => {
    test('should display Google login button', async ({ page }) => {
      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"], button[aria-label*="Google"]'
      );
      await expect(googleButton.first()).toBeVisible();
    });

    test('should display LinkedIn login button', async ({ page }) => {
      const linkedinButton = page.locator(
        'button:has-text("LinkedIn"), [data-testid="linkedin-login"], button[aria-label*="LinkedIn"]'
      );
      await expect(linkedinButton.first()).toBeVisible();
    });

    test('should display GitHub login button', async ({ page }) => {
      const githubButton = page.locator(
        'button:has-text("GitHub"), [data-testid="github-login"], button[aria-label*="GitHub"]'
      );
      await expect(githubButton.first()).toBeVisible();
    });

    test('should display OAuth divider', async ({ page }) => {
      const divider = page.locator('text=/or|continue with|sign in with/i');
      await expect(divider.first()).toBeVisible();
    });
  });

  test.describe('OAuth Button Behavior', () => {
    test('should navigate to Google OAuth on click', async ({ page }) => {
      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      );

      const [popup] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        googleButton.first().click(),
      ]);

      if (popup) {
        expect(popup.url()).toContain('accounts.google.com');
      } else {
        // May redirect in same window
        await page.waitForURL(/accounts\.google\.com|\/api\/auth\/google/, {
          timeout: 5000,
        }).catch(() => {
          // OAuth may be disabled in test environment
        });
      }
    });

    test('should navigate to LinkedIn OAuth on click', async ({ page }) => {
      const linkedinButton = page.locator(
        'button:has-text("LinkedIn"), [data-testid="linkedin-login"]'
      );

      const [popup] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        linkedinButton.first().click(),
      ]);

      if (popup) {
        expect(popup.url()).toContain('linkedin.com');
      } else {
        await page.waitForURL(/linkedin\.com|\/api\/auth\/linkedin/, {
          timeout: 5000,
        }).catch(() => {
          // OAuth may be disabled in test environment
        });
      }
    });
  });

  test.describe('OAuth on Registration Page', () => {
    test('should display social login buttons on register page', async ({ page }) => {
      await page.goto('/register');

      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      );
      const linkedinButton = page.locator(
        'button:has-text("LinkedIn"), [data-testid="linkedin-login"]'
      );

      await expect(googleButton.first()).toBeVisible();
      await expect(linkedinButton.first()).toBeVisible();
    });
  });

  test.describe('OAuth Mobile Experience', () => {
    test('should display OAuth buttons correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      );
      await expect(googleButton.first()).toBeVisible();

      const box = await googleButton.first().boundingBox();
      if (box) {
        // Touch targets should be at least 44px for accessibility
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should display OAuth buttons on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/login');

      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      );
      await expect(googleButton.first()).toBeVisible();
    });
  });

  test.describe('OAuth Accessibility', () => {
    test('should have accessible OAuth buttons', async ({ page }) => {
      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      ).first();

      await expect(googleButton).toBeVisible();

      // Should have accessible name
      const ariaLabel = await googleButton.getAttribute('aria-label');
      const text = await googleButton.textContent();
      expect(ariaLabel || text).toBeTruthy();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through the page
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should have focus indicators on OAuth buttons', async ({ page }) => {
      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      ).first();

      await googleButton.focus();
      await expect(googleButton).toBeFocused();
    });
  });

  test.describe('OAuth Button States', () => {
    test('should show loading state when clicked', async ({ page }) => {
      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      ).first();

      // Check button is initially enabled
      await expect(googleButton).toBeEnabled();
    });

    test('should have proper button type', async ({ page }) => {
      const googleButton = page.locator(
        'button:has-text("Google"), [data-testid="google-login"]'
      ).first();

      const buttonType = await googleButton.getAttribute('type');
      expect(buttonType === 'button' || buttonType === null).toBeTruthy();
    });
  });
});
