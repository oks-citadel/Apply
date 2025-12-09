/**
 * Notification Service E2E Tests
 * Tests notification management and preferences
 */

import { authClient, notificationClient, config, testState } from './setup';

describe('Notification Service E2E', () => {
  const testUser = {
    email: `e2e-notify-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Notify',
    lastName: 'Tester',
  };

  beforeAll(async () => {
    // Register and login test user
    const response = await authClient.post('/auth/register', testUser);
    testState.accessToken = response.data.accessToken;
    testState.refreshToken = response.data.refreshToken;
    testState.userId = response.data.user.id;
  });

  afterAll(async () => {
    testState.accessToken = '';
    testState.refreshToken = '';
    testState.userId = '';
  });

  describe('GET /notifications', () => {
    it('should list notifications with pagination', async () => {
      const response = await notificationClient.get('/notifications', {
        params: { page: 1, limit: 20 },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('meta');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter by unread only', async () => {
      const response = await notificationClient.get('/notifications', {
        params: { unreadOnly: true },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');

      // All returned notifications should be unread
      response.data.data.forEach((notification: any) => {
        expect(notification.read).toBe(false);
      });
    });

    it('should reject unauthenticated request', async () => {
      try {
        await notificationClient.get('/notifications', {
          headers: { Authorization: '' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /notifications/unread/count', () => {
    it('should get unread notification count', async () => {
      const response = await notificationClient.get('/notifications/unread/count');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('count');
      expect(typeof response.data.count).toBe('number');
      expect(response.data.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Notification Operations', () => {
    let notificationId: string;

    // Try to get a notification ID for testing
    beforeAll(async () => {
      const response = await notificationClient.get('/notifications', {
        params: { limit: 1 },
      });
      if (response.data.data.length > 0) {
        notificationId = response.data.data[0].id;
      }
    });

    describe('GET /notifications/:id', () => {
      it('should get notification by ID', async () => {
        if (!notificationId) {
          console.log('Skipping: No notification ID available');
          return;
        }

        const response = await notificationClient.get(`/notifications/${notificationId}`);

        expect(response.status).toBe(200);
        expect(response.data.id).toBe(notificationId);
        expect(response.data).toHaveProperty('type');
        expect(response.data).toHaveProperty('title');
        expect(response.data).toHaveProperty('message');
        expect(response.data).toHaveProperty('read');
      });

      it('should return 404 for non-existent notification', async () => {
        try {
          await notificationClient.get('/notifications/00000000-0000-0000-0000-000000000000');
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(404);
        }
      });
    });

    describe('PATCH /notifications/:id/read', () => {
      it('should mark notification as read', async () => {
        if (!notificationId) {
          console.log('Skipping: No notification ID available');
          return;
        }

        const response = await notificationClient.patch(`/notifications/${notificationId}/read`);

        expect(response.status).toBe(200);
        expect(response.data.read).toBe(true);
      });
    });

    describe('DELETE /notifications/:id', () => {
      it('should delete a notification', async () => {
        if (!notificationId) {
          console.log('Skipping: No notification ID available');
          return;
        }

        const response = await notificationClient.delete(`/notifications/${notificationId}`);

        expect(response.status).toBe(204);
      });

      it('should confirm notification is deleted', async () => {
        if (!notificationId) {
          console.log('Skipping: No notification ID available');
          return;
        }

        try {
          await notificationClient.get(`/notifications/${notificationId}`);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(404);
        }
      });
    });
  });

  describe('POST /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const response = await notificationClient.post('/notifications/read-all');

      expect(response.status).toBe(200);

      // Verify unread count is 0
      const countResponse = await notificationClient.get('/notifications/unread/count');
      expect(countResponse.data.count).toBe(0);
    });
  });

  describe('Notification Preferences', () => {
    describe('GET /notifications/preferences', () => {
      it('should get notification preferences', async () => {
        const response = await notificationClient.get('/notifications/preferences');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('emailNotifications');
        expect(response.data).toHaveProperty('pushNotifications');
      });
    });

    describe('PATCH /notifications/preferences', () => {
      it('should update notification preferences', async () => {
        const preferences = {
          emailNotifications: true,
          pushNotifications: false,
          jobAlerts: true,
          applicationUpdates: true,
          marketingEmails: false,
        };

        const response = await notificationClient.patch('/notifications/preferences', preferences);

        expect(response.status).toBe(200);
        expect(response.data.emailNotifications).toBe(true);
        expect(response.data.pushNotifications).toBe(false);
        expect(response.data.jobAlerts).toBe(true);
      });

      it('should reject invalid preference values', async () => {
        try {
          await notificationClient.patch('/notifications/preferences', {
            emailNotifications: 'invalid',
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
        }
      });
    });
  });

  describe('Push Notifications', () => {
    describe('POST /notifications/push/subscribe', () => {
      it('should subscribe to push notifications', async () => {
        const subscription = {
          endpoint: 'https://push.example.com/test-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        };

        const response = await notificationClient.post('/notifications/push/subscribe', subscription);

        expect(response.status).toBe(200);
      });
    });

    describe('POST /notifications/push/test', () => {
      it('should send test push notification', async () => {
        const response = await notificationClient.post('/notifications/push/test');

        expect(response.status).toBe(200);
      });
    });

    describe('POST /notifications/push/unsubscribe', () => {
      it('should unsubscribe from push notifications', async () => {
        const response = await notificationClient.post('/notifications/push/unsubscribe');

        expect(response.status).toBe(200);
      });
    });
  });
});
