import { io, Socket } from 'socket.io-client';

const NOTIFICATION_SERVICE_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:8087';

// Define the notification structure for type safety
export interface SocketNotification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  readAt?: string;
}

export interface NotificationSocketCallbacks {
  onNewNotification?: (notification: SocketNotification) => void;
  onNotificationUpdated?: (notification: SocketNotification) => void;
  onUnreadCount?: (data: { count: number }) => void;
  onInitialNotifications?: (notifications: SocketNotification[]) => void;
  onNotificationsRefreshed?: (notifications: SocketNotification[]) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class NotificationSocketClient {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private callbacks: NotificationSocketCallbacks = {};

  constructor(userId?: string, token?: string, callbacks?: NotificationSocketCallbacks) {
    if (userId && token) {
      this.connect(userId, token, callbacks);
    }
  }

  connect(userId: string, token: string, callbacks?: NotificationSocketCallbacks): void {
    if (this.socket?.connected) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NotificationSocket] Socket already connected');
      }
      return;
    }

    this.userId = userId;
    if (callbacks) {
      this.callbacks = callbacks;
    }

    this.socket = io(`${NOTIFICATION_SERVICE_URL}/notifications`, {
      auth: {
        token,
        userId,
      },
      query: {
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationSocket] Connected');
      }
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationSocket] Disconnected:', reason);
      }
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[NotificationSocket] Connection error:', error);
      }
      this.callbacks.onError?.(error);
    });

    this.socket.on('new-notification', (notification) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationSocket] New notification received:', notification);
      }
      this.callbacks.onNewNotification?.(notification);
    });

    this.socket.on('notification-updated', (notification) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationSocket] Notification updated:', notification);
      }
      this.callbacks.onNotificationUpdated?.(notification);
    });

    this.socket.on('unread-count', (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationSocket] Unread count updated:', data);
      }
      this.callbacks.onUnreadCount?.(data);
    });

    this.socket.on('initial-notifications', (notifications) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationSocket] Initial notifications received:', notifications.length);
      }
      this.callbacks.onInitialNotifications?.(notifications);
    });

    this.socket.on('notifications-refreshed', (notifications) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NotificationSocket] Notifications refreshed:', notifications.length);
      }
      this.callbacks.onNotificationsRefreshed?.(notifications);
    });
  }

  markAsRead(notificationId: string): void {
    if (!this.socket?.connected) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NotificationSocket] Socket not connected');
      }
      return;
    }

    this.socket.emit('mark-as-read', { notificationId });
  }

  markAllAsRead(): void {
    if (!this.socket?.connected) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NotificationSocket] Socket not connected');
      }
      return;
    }

    this.socket.emit('mark-all-as-read');
  }

  fetchNotifications(page: number = 1, limit: number = 20): void {
    if (!this.socket?.connected) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NotificationSocket] Socket not connected');
      }
      return;
    }

    this.socket.emit('fetch-notifications', { page, limit });
  }

  updateCallbacks(callbacks: NotificationSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getUserId(): string | null {
    return this.userId;
  }
}

let globalSocketClient: NotificationSocketClient | null = null;

export function getNotificationSocket(): NotificationSocketClient | null {
  return globalSocketClient;
}

export function initNotificationSocket(
  userId: string,
  token: string,
  callbacks?: NotificationSocketCallbacks,
): NotificationSocketClient {
  if (globalSocketClient) {
    globalSocketClient.disconnect();
  }

  globalSocketClient = new NotificationSocketClient(userId, token, callbacks);
  return globalSocketClient;
}

export function disconnectNotificationSocket(): void {
  if (globalSocketClient) {
    globalSocketClient.disconnect();
    globalSocketClient = null;
  }
}
