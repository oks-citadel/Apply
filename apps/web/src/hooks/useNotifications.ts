import { useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import {
  requestNotificationPermission,
  onForegroundMessage,
  getNotificationPermissionStatus,
  getFCMToken,
} from '@/lib/firebase';
import {
  registerDevice,
  unregisterDevice,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  type Notification,
  type NotificationPreferences,
} from '@/lib/api/notifications';

// Custom hook for managing push notifications
export const usePushNotifications = () => {
  const { user } = useAuthStore();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    'default'
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const queryClient = useQueryClient();

  // Check initial permission status
  useEffect(() => {
    const status = getNotificationPermissionStatus();
    setPermissionStatus(status);
  }, []);

  // Request permission and register device
  const requestPermission = useCallback(async () => {
    if (!user) return null;

    setIsRegistering(true);
    try {
      const token = await requestNotificationPermission();

      if (token) {
        setFcmToken(token);
        setPermissionStatus('granted');

        // Register device with backend
        await registerDevice({
          userId: user.id,
          token,
          platform: 'web',
          deviceName: navigator.userAgent,
          appVersion: '1.0.0',
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        // Store token in localStorage for future use
        localStorage.setItem('fcm_token', token);

        return token;
      } else {
        setPermissionStatus('denied');
        return null;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[useNotifications] Error requesting notification permission:', error);
      }
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, [user]);

  // Unregister device
  const unregister = useCallback(async () => {
    if (!user || !fcmToken) return;

    try {
      await unregisterDevice(user.id, fcmToken);
      setFcmToken(null);
      localStorage.removeItem('fcm_token');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[useNotifications] Error unregistering device:', error);
      }
    }
  }, [user, fcmToken]);

  // Listen for foreground messages
  useEffect(() => {
    if (permissionStatus !== 'granted') return;

    const unsubscribe = onForegroundMessage((payload) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[useNotifications] Foreground message received:', payload);
      }

      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      // You can also show a toast notification here
      if (payload.notification) {
        // Trigger custom event for toast notification
        window.dispatchEvent(
          new CustomEvent('foreground-notification', {
            detail: payload,
          })
        );
      }
    });

    return unsubscribe;
  }, [permissionStatus, queryClient]);

  // Auto-register if permission already granted
  useEffect(() => {
    if (user && permissionStatus === 'granted' && !fcmToken) {
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken) {
        setFcmToken(storedToken);
      } else {
        // Get new token if not stored
        getFCMToken().then((token) => {
          if (token) {
            setFcmToken(token);
            registerDevice({
              userId: user.id,
              token,
              platform: 'web',
              deviceName: navigator.userAgent,
              appVersion: '1.0.0',
              language: navigator.language,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            localStorage.setItem('fcm_token', token);
          }
        });
      }
    }
  }, [user, permissionStatus, fcmToken]);

  return {
    fcmToken,
    permissionStatus,
    isRegistering,
    requestPermission,
    unregister,
    isSupported: permissionStatus !== 'unsupported',
    isGranted: permissionStatus === 'granted',
    isDenied: permissionStatus === 'denied',
  };
};

// Hook for fetching notifications
export const useNotificationList = (page: number = 1, limit: number = 20, unreadOnly: boolean = false) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['notifications', user?.id, page, limit, unreadOnly],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return getNotifications(user.id, page, limit, unreadOnly);
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
};

// Hook for unread count
export const useUnreadCount = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return getUnreadCount(user.id);
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
};

// Hook for marking notification as read
export const useMarkAsRead = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!user) throw new Error('User not authenticated');
      return markNotificationAsRead(user.id, notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

// Hook for marking all as read
export const useMarkAllAsRead = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!user) throw new Error('User not authenticated');
      return markAllNotificationsAsRead(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

// Hook for deleting notification
export const useDeleteNotification = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!user) throw new Error('User not authenticated');
      return deleteNotification(user.id, notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};

// Hook for notification preferences
export const useNotificationPreferences = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return getNotificationPreferences(user.id);
    },
    enabled: !!user,
  });
};

// Hook for updating notification preferences
export const useUpdateNotificationPreferences = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('User not authenticated');
      return updateNotificationPreferences(user.id, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
};

// Combined hook for all notification features
export const useNotifications = () => {
  const push = usePushNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  return {
    ...push,
    unreadCount: unreadCount.data?.count || 0,
    isLoadingCount: unreadCount.isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
  };
};
