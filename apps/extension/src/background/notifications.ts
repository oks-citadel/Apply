/**
 * Notification Manager
 * Handles Chrome notifications
 */

import { Storage } from '@shared/storage';
import { STORAGE_KEYS } from '@shared/types';

export class NotificationManager {
  /**
   * Show notification
   */
  async show(
    title: string,
    message: string,
    options?: {
      iconUrl?: string;
      type?: 'basic' | 'image' | 'list' | 'progress';
      buttons?: Array<{ title: string }>;
      requireInteraction?: boolean;
    }
  ): Promise<string> {
    // Check if notifications are enabled
    const settings = await Storage.get<any>(STORAGE_KEYS.SETTINGS);
    if (settings && !settings.showNotifications) {
      return '';
    }

    const notificationId = `jobpilot-${Date.now()}`;

    await chrome.notifications.create(notificationId, {
      type: options?.type || 'basic',
      iconUrl: options?.iconUrl || chrome.runtime.getURL('icons/icon128.png'),
      title,
      message,
      buttons: options?.buttons,
      requireInteraction: options?.requireInteraction || false,
      priority: 1,
    });

    return notificationId;
  }

  /**
   * Show success notification
   */
  async showSuccess(title: string, message: string): Promise<string> {
    return this.show(title, message, {
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    });
  }

  /**
   * Show error notification
   */
  async showError(title: string, message: string): Promise<string> {
    return this.show(title, message, {
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      requireInteraction: true,
    });
  }

  /**
   * Show progress notification
   */
  async showProgress(
    title: string,
    message: string,
    progress: number
  ): Promise<string> {
    const notificationId = `progress-${Date.now()}`;

    await chrome.notifications.create(notificationId, {
      type: 'progress',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title,
      message,
      progress: Math.min(100, Math.max(0, progress)),
      priority: 2,
    });

    return notificationId;
  }

  /**
   * Update notification
   */
  async update(
    notificationId: string,
    options: {
      title?: string;
      message?: string;
      progress?: number;
    }
  ): Promise<void> {
    await chrome.notifications.update(notificationId, options);
  }

  /**
   * Clear notification
   */
  async clear(notificationId: string): Promise<void> {
    await chrome.notifications.clear(notificationId);
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    return new Promise((resolve) => {
      chrome.notifications.getAll((allNotifs) => {
        if (allNotifs) {
          Promise.all(
            Object.keys(allNotifs).map((id) => this.clear(id))
          ).then(() => resolve()).catch(() => resolve());
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Setup notification click handlers
   */
  setupHandlers(): void {
    chrome.notifications.onClicked.addListener((notificationId) => {
      console.log('Notification clicked:', notificationId);

      // Open extension popup or relevant page
      if (notificationId.startsWith('jobpilot-')) {
        chrome.action.openPopup();
      }

      // Clear the notification
      this.clear(notificationId);
    });

    chrome.notifications.onButtonClicked.addListener(
      (notificationId, _buttonIndex) => {
        console.log('Notification button clicked:', notificationId, _buttonIndex);

        // Handle button clicks
        this.handleButtonClick(notificationId, _buttonIndex);

        // Clear the notification
        this.clear(notificationId);
      }
    );

    chrome.notifications.onClosed.addListener((notificationId, byUser) => {
      console.log('Notification closed:', notificationId, 'by user:', byUser);
    });
  }

  /**
   * Handle notification button clicks
   */
  private async handleButtonClick(
    _notificationId: string,
    _buttonIndex: number
  ): Promise<void> {
    // Implement specific button actions here
    // For example, button 0 might open a specific page, button 1 might dismiss
  }
}
