import { io, Socket } from 'socket.io-client';

const NOTIFICATION_SERVICE_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:8007';

export interface NotificationSocketCallbacks {
  onNewNotification?: (notification: any) => void;
  onNotificationUpdated?: (notification: any) => void;
  onUnreadCount?: (data: { count: number }) => void;
  onInitialNotifications?: (notifications: any[]) => void;
  onNotificationsRefreshed?: (notifications: any[]) => void;
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
      console.warn('Socket already connected');
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
      console.log('Notification socket connected');
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Notification socket disconnected:', reason);
      this.callbacks.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Notification socket connection error:', error);
      this.callbacks.onError?.(error);
    });

    this.socket.on('new-notification', (notification) => {
      console.log('New notification received:', notification);
      this.callbacks.onNewNotification?.(notification);
    });

    this.socket.on('notification-updated', (notification) => {
      console.log('Notification updated:', notification);
      this.callbacks.onNotificationUpdated?.(notification);
    });

    this.socket.on('unread-count', (data) => {
      console.log('Unread count updated:', data);
      this.callbacks.onUnreadCount?.(data);
    });

    this.socket.on('initial-notifications', (notifications) => {
      console.log('Initial notifications received:', notifications.length);
      this.callbacks.onInitialNotifications?.(notifications);
    });

    this.socket.on('notifications-refreshed', (notifications) => {
      console.log('Notifications refreshed:', notifications.length);
      this.callbacks.onNotificationsRefreshed?.(notifications);
    });
  }

  markAsRead(notificationId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('mark-as-read', { notificationId });
  }

  markAllAsRead(): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('mark-all-as-read');
  }

  fetchNotifications(page: number = 1, limit: number = 20): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
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
