'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getAccessToken } from '@/lib/auth/secureTokenManager';
import {
  initNotificationSocket,
  disconnectNotificationSocket,
  NotificationSocketCallbacks,
} from '@/lib/api/notificationSocket';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from '@/lib/api/notifications';
import { Bell, X, Check, Trash2, CheckCheck } from 'lucide-react';

export function NotificationCenter() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket event handlers
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((count) => count + 1);
    }
    // Show toast or browser notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          tag: notification.id,
        });
      }
    }
  }, []);

  const handleNotificationUpdated = useCallback((notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? notification : n))
    );
  }, []);

  const handleUnreadCount = useCallback((data: { count: number }) => {
    setUnreadCount(data.count);
  }, []);

  const handleInitialNotifications = useCallback((initialNotifications: Notification[]) => {
    setNotifications(initialNotifications);
  }, []);

  const handleNotificationsRefreshed = useCallback((refreshedNotifications: Notification[]) => {
    setNotifications(refreshedNotifications);
  }, []);

  const handleConnect = useCallback(() => {
    console.log('WebSocket connected');
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected');
    setIsConnected(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('WebSocket error:', error);
    setIsConnected(false);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const callbacks: NotificationSocketCallbacks = {
      onNewNotification: handleNewNotification,
      onNotificationUpdated: handleNotificationUpdated,
      onUnreadCount: handleUnreadCount,
      onInitialNotifications: handleInitialNotifications,
      onNotificationsRefreshed: handleNotificationsRefreshed,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onError: handleError,
    };

    // Get auth token from secure memory storage (not localStorage)
    const token = getAccessToken();

    if (token) {
      initNotificationSocket(user.id, token, callbacks);
    }

    return () => {
      disconnectNotificationSocket();
    };
  }, [
    user,
    handleNewNotification,
    handleNotificationUpdated,
    handleUnreadCount,
    handleInitialNotifications,
    handleNotificationsRefreshed,
    handleConnect,
    handleDisconnect,
    handleError,
  ]);

  // Fallback: Fetch notifications via HTTP if WebSocket fails
  useEffect(() => {
    if (!user || isConnected) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await getNotifications(user.id, 1, 20);
        setNotifications(response.notifications);
        setUnreadCount(response.notifications.filter((n) => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user, isConnected]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await markNotificationAsRead(user.id, notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!user) return;

    try {
      await deleteNotification(user.id, notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      // Update unread count if deleted notification was unread
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading && (
                <div className="p-8 text-center text-gray-500">
                  Loading notifications...
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              )}

              {!isLoading && notifications.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 hover:bg-blue-100 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          View details
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
