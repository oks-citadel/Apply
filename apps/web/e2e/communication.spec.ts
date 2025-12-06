import { test, expect, Page } from '@playwright/test';

// Helper function to setup authenticated user
async function setupAuthenticatedUser(page: Page) {
  await page.context().addCookies([
    {
      name: 'auth-token',
      value: 'mock-auth-token-123',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

// Mock API responses
async function mockApiResponses(page: Page) {
  // Mock notifications endpoint
  await page.route('**/api/v1/notifications*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              title: 'Application Update',
              message: 'Your application has been reviewed',
              category: 'application',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              title: 'New Job Match',
              message: '5 new jobs matching your preferences',
              category: 'job',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 2,
          success: true,
        }),
      });
    }
  });

  // Mock messages endpoint
  await page.route('**/api/v1/messages*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              conversationId: 'conv-1',
              senderId: 'user-1',
              senderName: 'John Doe',
              message: 'Hello, how are you?',
              timestamp: new Date().toISOString(),
              read: true,
            },
          ],
          success: true,
        }),
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '2',
            conversationId: 'conv-1',
            message: 'New message',
            timestamp: new Date().toISOString(),
          },
          success: true,
        }),
      });
    }
  });

  // Mock notification settings endpoint
  await page.route('**/api/v1/notifications/settings*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            emailEnabled: true,
            emailApplicationStatus: true,
            emailJobAlerts: true,
            pushEnabled: true,
            pushApplicationStatus: true,
            pushJobAlerts: true,
            quietHoursStart: null,
            quietHoursEnd: null,
          },
          success: true,
        }),
      });
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { success: true },
        }),
      });
    }
  });

  // Mock push subscription endpoint
  await page.route('**/api/v1/notifications/subscribe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Subscribed successfully',
      }),
    });
  });

  // Mock interview scheduling endpoint
  await page.route('**/api/v1/interviews/schedule', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'interview-123',
          scheduledAt: new Date().toISOString(),
        },
        success: true,
      }),
    });
  });
}

test.describe('Communication Features', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
    await mockApiResponses(page);
  });

  test.describe('Notifications', () => {
    test('should display notification center', async ({ page }) => {
      await page.goto('/notifications');

      await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
      await expect(page.getByTestId('notification-center')).toBeVisible();
    });

    test('should display unread notification badge', async ({ page }) => {
      await page.goto('/dashboard');

      const notificationBell = page.getByTestId('notification-bell');
      await expect(notificationBell).toBeVisible();

      const badge = page.getByTestId('notification-badge');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('2');
    });

    test('should show notification dropdown on bell click', async ({ page }) => {
      await page.goto('/dashboard');

      const notificationBell = page.getByTestId('notification-bell');
      await notificationBell.click();

      await expect(page.getByTestId('notification-dropdown')).toBeVisible();
      await expect(page.getByText('Application Update')).toBeVisible();
      await expect(page.getByText('New Job Match')).toBeVisible();
    });

    test('should mark notification as read when clicked', async ({ page }) => {
      await page.goto('/notifications');

      const notification = page.getByText('Application Update');
      await expect(notification).toBeVisible();

      await notification.click();

      // Verify notification is marked as read
      await expect(page.getByTestId('notification-badge')).toHaveText('1');
    });

    test('should mark all notifications as read', async ({ page }) => {
      await page.goto('/notifications');

      const markAllButton = page.getByRole('button', { name: /mark all as read/i });
      await expect(markAllButton).toBeVisible();

      await markAllButton.click();

      await expect(page.getByTestId('notification-badge')).toHaveText('0');
    });

    test('should filter notifications by category', async ({ page }) => {
      await page.goto('/notifications');

      const categoryFilter = page.getByRole('combobox', { name: /category/i });
      await categoryFilter.selectOption('application');

      await expect(page.getByText('Application Update')).toBeVisible();
      await expect(page.getByText('New Job Match')).not.toBeVisible();
    });

    test('should filter unread notifications', async ({ page }) => {
      await page.goto('/notifications');

      const unreadTab = page.getByRole('tab', { name: /unread/i });
      await unreadTab.click();

      // Should only show unread notifications
      await expect(page.getByTestId('notification-list')).toBeVisible();
    });

    test('should delete notification', async ({ page }) => {
      await page.goto('/notifications');

      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      await deleteButton.click();

      // Confirm deletion
      await page.getByRole('button', { name: /confirm/i }).click();

      await expect(page.getByText('Notification deleted')).toBeVisible();
    });

    test('should navigate to action URL when notification clicked', async ({ page }) => {
      await page.goto('/notifications');

      const notification = page.getByText('Application Update');
      await notification.click();

      // Should navigate to applications page
      await expect(page).toHaveURL(/.*applications.*/);
    });
  });

  test.describe('Notification Settings', () => {
    test('should display notification settings page', async ({ page }) => {
      await page.goto('/settings/notifications');

      await expect(page.getByRole('heading', { name: /notification settings/i })).toBeVisible();
    });

    test('should display email notification toggles', async ({ page }) => {
      await page.goto('/settings/notifications');

      await expect(page.getByLabel(/email notifications/i)).toBeVisible();
      await expect(page.getByLabel(/application status emails/i)).toBeVisible();
      await expect(page.getByLabel(/job alert emails/i)).toBeVisible();
    });

    test('should display push notification toggles', async ({ page }) => {
      await page.goto('/settings/notifications');

      await expect(page.getByLabel(/push notifications/i)).toBeVisible();
      await expect(page.getByLabel(/application status push/i)).toBeVisible();
      await expect(page.getByLabel(/job alert push/i)).toBeVisible();
    });

    test('should toggle email notifications', async ({ page }) => {
      await page.goto('/settings/notifications');

      const emailToggle = page.getByLabel(/email notifications/i);
      await emailToggle.click();

      await expect(page.getByText(/settings updated/i)).toBeVisible();
    });

    test('should toggle push notifications', async ({ page }) => {
      await page.goto('/settings/notifications');

      const pushToggle = page.getByLabel(/push notifications/i);
      await pushToggle.click();

      await expect(page.getByText(/settings updated/i)).toBeVisible();
    });

    test('should set quiet hours', async ({ page }) => {
      await page.goto('/settings/notifications');

      const quietHoursStart = page.getByLabel(/quiet hours start/i);
      const quietHoursEnd = page.getByLabel(/quiet hours end/i);

      await quietHoursStart.fill('22:00');
      await quietHoursEnd.fill('08:00');

      await page.getByRole('button', { name: /save/i }).click();

      await expect(page.getByText(/settings saved/i)).toBeVisible();
    });

    test('should subscribe to push notifications', async ({ page }) => {
      await page.goto('/settings/notifications');

      const subscribeButton = page.getByRole('button', { name: /enable push notifications/i });
      await subscribeButton.click();

      // Should request notification permission
      await expect(page.getByText(/push notifications enabled/i)).toBeVisible();
    });
  });

  test.describe('Messages', () => {
    test('should display messages inbox', async ({ page }) => {
      await page.goto('/messages');

      await expect(page.getByRole('heading', { name: /messages/i })).toBeVisible();
      await expect(page.getByTestId('messages-inbox')).toBeVisible();
    });

    test('should display conversation list', async ({ page }) => {
      await page.goto('/messages');

      await expect(page.getByTestId('conversation-list')).toBeVisible();
    });

    test('should open conversation when clicked', async ({ page }) => {
      await page.goto('/messages');

      const conversation = page.getByTestId('conversation-item').first();
      await conversation.click();

      await expect(page.getByTestId('message-thread')).toBeVisible();
    });

    test('should display message thread', async ({ page }) => {
      await page.goto('/messages/conv-1');

      await expect(page.getByTestId('message-thread')).toBeVisible();
      await expect(page.getByText('Hello, how are you?')).toBeVisible();
    });

    test('should send a message', async ({ page }) => {
      await page.goto('/messages/conv-1');

      const messageInput = page.getByPlaceholder(/type a message/i);
      await messageInput.fill('This is a test message');

      const sendButton = page.getByRole('button', { name: /send/i });
      await sendButton.click();

      await expect(page.getByText('This is a test message')).toBeVisible();
    });

    test('should send message with Enter key', async ({ page }) => {
      await page.goto('/messages/conv-1');

      const messageInput = page.getByPlaceholder(/type a message/i);
      await messageInput.fill('Test message with Enter');
      await messageInput.press('Enter');

      await expect(page.getByText('Test message with Enter')).toBeVisible();
    });

    test('should not send empty messages', async ({ page }) => {
      await page.goto('/messages/conv-1');

      const sendButton = page.getByRole('button', { name: /send/i });
      await expect(sendButton).toBeDisabled();
    });

    test('should display message timestamps', async ({ page }) => {
      await page.goto('/messages/conv-1');

      await expect(page.getByTestId('message-timestamp').first()).toBeVisible();
    });

    test('should display sender avatars', async ({ page }) => {
      await page.goto('/messages/conv-1');

      await expect(page.getByRole('img', { name: /avatar/i }).first()).toBeVisible();
    });

    test('should mark messages as read when opened', async ({ page }) => {
      await page.goto('/messages/conv-1');

      // Messages should be marked as read
      await expect(page.getByTestId('message-thread')).toBeVisible();
    });

    test('should search messages', async ({ page }) => {
      await page.goto('/messages');

      const searchInput = page.getByPlaceholder(/search messages/i);
      await searchInput.fill('hello');

      await expect(page.getByTestId('search-results')).toBeVisible();
    });
  });

  test.describe('Interview Scheduling', () => {
    test('should display interview scheduling page', async ({ page }) => {
      await page.goto('/interviews/schedule');

      await expect(page.getByRole('heading', { name: /schedule interview/i })).toBeVisible();
    });

    test('should schedule an interview', async ({ page }) => {
      await page.goto('/interviews/schedule');

      // Fill interview details
      await page.getByLabel(/job title/i).fill('Senior Developer');
      await page.getByLabel(/company/i).fill('Tech Corp');
      await page.getByLabel(/date/i).fill('2024-02-15');
      await page.getByLabel(/time/i).fill('14:00');

      // Submit form
      await page.getByRole('button', { name: /schedule/i }).click();

      await expect(page.getByText(/interview scheduled/i)).toBeVisible();
    });

    test('should display validation errors', async ({ page }) => {
      await page.goto('/interviews/schedule');

      // Try to submit without filling required fields
      await page.getByRole('button', { name: /schedule/i }).click();

      await expect(page.getByText(/required/i).first()).toBeVisible();
    });

    test('should send notification after scheduling', async ({ page }) => {
      await page.goto('/interviews/schedule');

      await page.getByLabel(/job title/i).fill('Senior Developer');
      await page.getByLabel(/company/i).fill('Tech Corp');
      await page.getByLabel(/date/i).fill('2024-02-15');
      await page.getByLabel(/time/i).fill('14:00');

      await page.getByRole('button', { name: /schedule/i }).click();

      // Should show success notification
      await expect(page.getByText(/interview scheduled/i)).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should receive real-time notifications', async ({ page }) => {
      await page.goto('/dashboard');

      // Simulate WebSocket message
      await page.evaluate(() => {
        const event = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'notification',
            data: {
              id: '3',
              title: 'New Notification',
              message: 'Real-time test',
              isRead: false,
            },
          }),
        });
        window.dispatchEvent(event);
      });

      // Badge should update
      await expect(page.getByTestId('notification-badge')).toHaveText('3');
    });

    test('should receive real-time messages', async ({ page }) => {
      await page.goto('/messages/conv-1');

      // Simulate WebSocket message
      await page.evaluate(() => {
        const event = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'new_message',
            data: {
              id: '3',
              conversationId: 'conv-1',
              message: 'Real-time message',
              timestamp: new Date().toISOString(),
            },
          }),
        });
        window.dispatchEvent(event);
      });

      await expect(page.getByText('Real-time message')).toBeVisible();
    });

    test('should show toast for urgent notifications', async ({ page }) => {
      await page.goto('/dashboard');

      // Simulate urgent notification
      await page.evaluate(() => {
        const event = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'notification',
            data: {
              id: '4',
              title: 'Urgent: Interview Starting Soon',
              message: 'Your interview starts in 15 minutes',
              priority: 'urgent',
              isRead: false,
            },
          }),
        });
        window.dispatchEvent(event);
      });

      // Should show toast notification
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/interview starting soon/i)).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should display error when notifications fail to load', async ({ page }) => {
      await page.route('**/api/v1/notifications*', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.goto('/notifications');

      await expect(page.getByText(/failed to load/i)).toBeVisible();
    });

    test('should retry loading notifications', async ({ page }) => {
      let callCount = 0;
      await page.route('**/api/v1/notifications*', (route) => {
        if (callCount === 0) {
          callCount++;
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server error' }),
          });
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ data: [], success: true }),
          });
        }
      });

      await page.goto('/notifications');
      await expect(page.getByText(/failed to load/i)).toBeVisible();

      await page.getByRole('button', { name: /retry/i }).click();

      await expect(page.getByText(/failed to load/i)).not.toBeVisible();
    });

    test('should handle message send failure', async ({ page }) => {
      await page.route('**/api/v1/messages', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Failed to send' }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/messages/conv-1');

      const messageInput = page.getByPlaceholder(/type a message/i);
      await messageInput.fill('Test message');
      await messageInput.press('Enter');

      await expect(page.getByText(/failed to send/i)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/notifications');

      // Tab through elements
      await page.keyboard.press('Tab');

      // First focusable element should be focused
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/notifications');

      await expect(page.getByRole('region', { name: /notifications/i })).toBeVisible();
    });

    test('should announce new notifications to screen readers', async ({ page }) => {
      await page.goto('/dashboard');

      // Simulate new notification
      await page.evaluate(() => {
        const event = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'notification',
            data: {
              id: '5',
              title: 'Test Notification',
              message: 'Accessibility test',
            },
          }),
        });
        window.dispatchEvent(event);
      });

      await expect(page.getByRole('status')).toBeVisible();
    });
  });
});
