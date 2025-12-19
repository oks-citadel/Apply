import React from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';

// Storage keys
const PUSH_TOKEN_KEY = '@applyforus_push_token';
const NOTIFICATION_PERMISSION_KEY = '@applyforus_notification_permission';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification categories for interactive notifications
const NOTIFICATION_CATEGORIES = [
  {
    identifier: 'job_update',
    actions: [
      {
        identifier: 'view',
        buttonTitle: 'View Job',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ],
  },
  {
    identifier: 'application_update',
    actions: [
      {
        identifier: 'view',
        buttonTitle: 'View Application',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ],
  },
];

export interface NotificationData {
  type: 'job' | 'application' | 'message' | 'general';
  id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;
  private notificationListener?: Notifications.Subscription;
  private responseListener?: Notifications.Subscription;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   * Sets up categories, listeners, and attempts to register for push notifications
   */
  public async initialize(): Promise<void> {
    try {
      // Note: Notification categories for interactive notifications
      // are handled differently in newer versions of expo-notifications
      // They need to be set up in the native layer (iOS/Android)

      // Check if we already have permission
      const hasPermission = await this.checkPermission();
      if (hasPermission) {
        await this.registerForPushNotifications();
      }

      // Set up listeners
      this.setupListeners();
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Check if notification permission is granted
   */
  public async checkPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    return existingStatus === 'granted';
  }

  /**
   * Request notification permissions from the user
   */
  public async requestPermission(): Promise<boolean> {
    try {
      // Check if running on a physical device
      if (!Device.isDevice) {
        console.warn(
          'Push notifications only work on physical devices, not simulators/emulators'
        );
        return false;
      }

      // Get current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Store permission status
      await AsyncStorage.setItem(
        NOTIFICATION_PERMISSION_KEY,
        finalStatus === 'granted' ? 'true' : 'false'
      );

      if (finalStatus === 'granted') {
        await this.registerForPushNotifications();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get Expo push token
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('EAS project ID not found in app config');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F46E5',
          sound: 'notification-sound.wav',
        });

        // Additional channels for different notification types
        await Notifications.setNotificationChannelAsync('job_updates', {
          name: 'Job Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F46E5',
        });

        await Notifications.setNotificationChannelAsync('application_updates', {
          name: 'Application Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });
      }

      // Store token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);

      // Register token with backend
      await this.registerTokenWithBackend(token.data);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register push token with backend API
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/notifications/register', {
        token,
        platform: Platform.OS,
        deviceId: Constants.deviceId,
        deviceName: Constants.deviceName,
      });
    } catch (error) {
      console.error('Error registering token with backend:', error);
      // We don't throw here to avoid breaking the notification setup
    }
  }

  /**
   * Unregister push token from backend
   */
  public async unregisterToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (token) {
        await apiClient.post('/notifications/unregister', { token });
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error unregistering token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Notification received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    // Notification tapped/interacted with
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  /**
   * Handle notification received in foreground
   */
  private handleNotificationReceived = (
    notification: Notifications.Notification
  ): void => {
    console.log('Notification received:', notification);
    const data = notification.request.content.data as unknown as NotificationData;

    // You can emit an event here to update UI, show badge, etc.
    // For example, using EventEmitter or a state management solution
  };

  /**
   * Handle notification interaction (user tapped on notification)
   */
  private handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ): void => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data as unknown as NotificationData;

    // Navigate based on notification type
    this.navigateFromNotification(data);
  };

  /**
   * Navigate to appropriate screen based on notification data
   */
  private navigateFromNotification(data: NotificationData): void {
    // This will be used with navigation service
    // Implementation depends on your navigation setup
    console.log('Navigate from notification:', data);

    // Example navigation logic:
    // if (data.type === 'job' && data.id) {
    //   navigationRef.navigate('JobDetails', { jobId: data.id });
    // } else if (data.type === 'application' && data.id) {
    //   navigationRef.navigate('ApplicationDetails', { applicationId: data.id });
    // }
  }

  /**
   * Send a local notification
   */
  public async sendLocalNotification(
    notificationData: NotificationData
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: 'notification-sound.wav',
          badge: 1,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  public async scheduleNotification(
    notificationData: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          sound: 'notification-sound.wav',
        },
        trigger,
      });
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get notification badge count
   */
  public async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set notification badge count
   */
  public async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  public async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Dismiss a notification
   */
  public async dismissNotification(identifier: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(identifier);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  /**
   * Dismiss all notifications
   */
  public async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }

  /**
   * Get stored push token
   */
  public async getStoredPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored push token:', error);
      return null;
    }
  }

  /**
   * Clean up listeners
   */
  public cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export helper hooks and utilities
export const useNotifications = () => {
  const [permission, setPermission] = React.useState<boolean>(false);
  const [pushToken, setPushToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const init = async () => {
      const hasPermission = await notificationService.checkPermission();
      setPermission(hasPermission);

      if (hasPermission) {
        const token = await notificationService.getStoredPushToken();
        setPushToken(token);
      }
    };

    init();
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(granted);
    if (granted) {
      const token = await notificationService.getStoredPushToken();
      setPushToken(token);
    }
    return granted;
  };

  return {
    permission,
    pushToken,
    requestPermission,
  };
};

