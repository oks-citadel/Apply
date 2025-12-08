import { apiClient, handleApiError } from './client';

const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:8007';

// Types
export interface DeviceRegistration {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  language?: string;
  timezone?: string;
}

export interface NotificationPreferences {
  email: {
    applicationUpdates: boolean;
    newJobs: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
  };
  push: {
    applicationUpdates: boolean;
    newJobs: boolean;
    interviews: boolean;
  };
  sms?: {
    interviews: boolean;
    urgentUpdates: boolean;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UnreadCount {
  count: number;
}

// Push Notification APIs
export const registerDevice = async (data: DeviceRegistration): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post(`${NOTIFICATION_SERVICE_URL}/push/register`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const unregisterDevice = async (userId: string, token: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`${NOTIFICATION_SERVICE_URL}/push/unregister`, {
      data: { userId, token },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getRegisteredDevices = async (userId: string): Promise<any[]> => {
  try {
    const response = await apiClient.get(`${NOTIFICATION_SERVICE_URL}/push/devices/${userId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Notification Preferences APIs
export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  try {
    const response = await apiClient.get(`${NOTIFICATION_SERVICE_URL}/preferences/${userId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  try {
    const response = await apiClient.put(
      `${NOTIFICATION_SERVICE_URL}/preferences/${userId}`,
      preferences
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Notification History APIs
export const getNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<PaginatedNotifications> => {
  try {
    const response = await apiClient.get(`${NOTIFICATION_SERVICE_URL}/notifications/${userId}`, {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUnreadCount = async (userId: string): Promise<UnreadCount> => {
  try {
    const response = await apiClient.get(`${NOTIFICATION_SERVICE_URL}/notifications/${userId}/unread-count`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<Notification> => {
  try {
    const response = await apiClient.put(
      `${NOTIFICATION_SERVICE_URL}/notifications/${userId}/${notificationId}/read`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<{ message: string; count: number }> => {
  try {
    const response = await apiClient.put(
      `${NOTIFICATION_SERVICE_URL}/notifications/${userId}/mark-all-read`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteNotification = async (userId: string, notificationId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(
      `${NOTIFICATION_SERVICE_URL}/notifications/${userId}/${notificationId}`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteAllNotifications = async (userId: string): Promise<{ message: string; count: number }> => {
  try {
    const response = await apiClient.delete(`${NOTIFICATION_SERVICE_URL}/notifications/${userId}/all`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Test notification (for development)
export const sendTestNotification = async (userId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post(`${NOTIFICATION_SERVICE_URL}/notifications/test`, {
      userId,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
