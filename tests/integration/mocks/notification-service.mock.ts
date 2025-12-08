/**
 * Mock Notification Service
 * Provides mock responses for notification service endpoints
 */

export interface NotificationPayload {
  userId: string;
  type: string;
  channel: 'email' | 'push' | 'sms' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationResult {
  id: string;
  status: 'sent' | 'queued' | 'failed';
  sentAt?: Date;
  error?: string;
}

export class NotificationServiceMock {
  private notifications: Map<string, NotificationPayload & { id: string; status: string }> = new Map();
  private deliveryCallbacks: Array<(notification: any) => void> = [];

  mockSendNotification(payload: NotificationPayload): NotificationResult {
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const notification = {
      ...payload,
      id: notificationId,
      status: 'sent',
      sentAt: new Date(),
    };

    this.notifications.set(notificationId, notification);

    // Trigger callbacks
    this.deliveryCallbacks.forEach(callback => callback(notification));

    return {
      id: notificationId,
      status: 'sent',
      sentAt: new Date(),
    };
  }

  mockBatchSendNotification(payloads: NotificationPayload[]): NotificationResult[] {
    return payloads.map(payload => this.mockSendNotification(payload));
  }

  mockGetNotificationStatus(notificationId: string): NotificationResult | null {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return null;
    }

    return {
      id: notification.id,
      status: notification.status as any,
      sentAt: new Date(notification.sentAt),
    };
  }

  mockGetUserNotifications(userId: string, options?: {
    channel?: string;
    type?: string;
    limit?: number;
  }): Array<NotificationPayload & { id: string; status: string }> {
    let userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    if (options?.channel) {
      userNotifications = userNotifications.filter(n => n.channel === options.channel);
    }

    if (options?.type) {
      userNotifications = userNotifications.filter(n => n.type === options.type);
    }

    if (options?.limit) {
      userNotifications = userNotifications.slice(0, options.limit);
    }

    return userNotifications;
  }

  mockMarkAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return false;
    }

    notification.status = 'read';
    return true;
  }

  onNotificationSent(callback: (notification: any) => void): void {
    this.deliveryCallbacks.push(callback);
  }

  getNotificationCount(): number {
    return this.notifications.size;
  }

  getNotificationsByChannel(channel: string): Array<NotificationPayload & { id: string }> {
    return Array.from(this.notifications.values())
      .filter(n => n.channel === channel);
  }

  clear(): void {
    this.notifications.clear();
    this.deliveryCallbacks = [];
  }
}

export const notificationServiceMock = new NotificationServiceMock();
