'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NotificationToast, { ToastNotification } from './NotificationToast';

export const NotificationToastContainer = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const router = useRouter();

  const addNotification = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleNotificationClick = useCallback(
    (notification: ToastNotification) => {
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    },
    [router]
  );

  // Listen for foreground notifications from Firebase
  useEffect(() => {
    const handleForegroundNotification = (event: CustomEvent) => {
      const { notification, data } = event.detail;

      if (notification) {
        addNotification({
          title: notification.title || 'New Notification',
          message: notification.body || '',
          type: data?.category || 'info',
          actionUrl: data?.clickAction || data?.actionUrl,
          duration: 5000,
        });
      }
    };

    window.addEventListener(
      'foreground-notification' as any,
      handleForegroundNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        'foreground-notification' as any,
        handleForegroundNotification as EventListener
      );
    };
  }, [addNotification]);

  // Expose addNotification globally for manual toast notifications
  useEffect(() => {
    (window as any).showNotificationToast = addNotification;
    return () => {
      delete (window as any).showNotificationToast;
    };
  }, [addNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
            onClick={handleNotificationClick}
          />
        ))}
      </div>
    </div>
  );
};

// Helper function to show toast notifications
export const showToast = (notification: Omit<ToastNotification, 'id'>) => {
  if (typeof window !== 'undefined' && (window as any).showNotificationToast) {
    (window as any).showNotificationToast(notification);
  }
};
