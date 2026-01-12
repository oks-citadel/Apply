import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { getAccessToken } from '../lib/secureTokenManager';
import { notificationService } from './notifications';

// Declare React Native's global __DEV__ variable
declare const __DEV__: boolean | undefined;

// WebSocket server URL
const WS_BASE_URL = (() => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'http://localhost:8087';
  }
  return 'https://api.applyforus.com';
})();

// Event types for real-time updates
export interface ApplicationStatusEvent {
  applicationId: string;
  jobId: string;
  status: 'pending' | 'processing' | 'submitted' | 'completed' | 'failed';
  message?: string;
  timestamp: string;
}

export interface JobUpdateEvent {
  jobId: string;
  action: 'new' | 'updated' | 'closed';
  job?: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface UnreadCountEvent {
  count: number;
}

export interface AutoApplyStatusEvent {
  isRunning: boolean;
  applicationsToday: number;
  dailyLimit: number;
  currentJob?: {
    id: string;
    title: string;
    company: string;
  };
  lastError?: string;
}

type EventCallback<T> = (data: T) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private notificationSocket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private applicationListeners: Set<EventCallback<ApplicationStatusEvent>> = new Set();
  private jobListeners: Set<EventCallback<JobUpdateEvent>> = new Set();
  private notificationListeners: Set<EventCallback<NotificationEvent>> = new Set();
  private unreadCountListeners: Set<EventCallback<UnreadCountEvent>> = new Set();
  private autoApplyListeners: Set<EventCallback<AutoApplyStatusEvent>> = new Set();
  private connectionListeners: Set<EventCallback<boolean>> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket connections
   */
  public async connect(): Promise<void> {
    const token = getAccessToken();
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    try {
      // Connect to notification namespace
      await this.connectToNotifications(token);

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  /**
   * Connect to notifications namespace
   */
  private async connectToNotifications(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.notificationSocket = io(`${WS_BASE_URL}/notifications`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
        extraHeaders: {
          'X-Platform': Platform.OS,
        },
      });

      this.notificationSocket.on('connect', () => {
        console.log('Connected to notifications WebSocket');
        this.setupNotificationListeners();
        resolve();
      });

      this.notificationSocket.on('connect_error', (error) => {
        console.error('Notification WebSocket connection error:', error);
        reject(error);
      });

      this.notificationSocket.on('disconnect', (reason) => {
        console.log('Disconnected from notifications WebSocket:', reason);
        this.isConnected = false;
        this.notifyConnectionListeners(false);
      });
    });
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    if (!this.notificationSocket) return;

    // New notification received
    this.notificationSocket.on('new-notification', (data: NotificationEvent) => {
      console.log('New notification received:', data);
      this.notifyNotificationListeners(data);

      // Show local notification
      notificationService.sendLocalNotification({
        type: 'general',
        title: data.title,
        body: data.body,
        data: data.data,
      });
    });

    // Unread count updated
    this.notificationSocket.on('unread-count', (data: UnreadCountEvent) => {
      console.log('Unread count updated:', data);
      this.notifyUnreadCountListeners(data);
      notificationService.setBadgeCount(data.count);
    });

    // Application status updates
    this.notificationSocket.on('application:status', (data: ApplicationStatusEvent) => {
      console.log('Application status update:', data);
      this.notifyApplicationListeners(data);

      // Show notification for important status changes
      if (data.status === 'completed' || data.status === 'failed') {
        notificationService.sendLocalNotification({
          type: 'application',
          id: data.applicationId,
          title: data.status === 'completed' ? 'Application Submitted!' : 'Application Failed',
          body: data.message || `Your application status: ${data.status}`,
          data: { applicationId: data.applicationId, jobId: data.jobId },
        });
      }
    });

    // Auto-apply status updates
    this.notificationSocket.on('auto-apply:status', (data: AutoApplyStatusEvent) => {
      console.log('Auto-apply status update:', data);
      this.notifyAutoApplyListeners(data);
    });

    // Job updates (new matching jobs)
    this.notificationSocket.on('job:update', (data: JobUpdateEvent) => {
      console.log('Job update:', data);
      this.notifyJobListeners(data);

      if (data.action === 'new' && data.job) {
        notificationService.sendLocalNotification({
          type: 'job',
          id: data.jobId,
          title: 'New Job Match!',
          body: `${data.job.title} at ${data.job.company}`,
          data: { jobId: data.jobId },
        });
      }
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Disconnect all WebSocket connections
   */
  public disconnect(): void {
    if (this.notificationSocket) {
      this.notificationSocket.disconnect();
      this.notificationSocket = null;
    }

    this.isConnected = false;
    this.notifyConnectionListeners(false);
  }

  /**
   * Check if connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // ============= Event Subscription Methods =============

  /**
   * Subscribe to application status updates
   */
  public onApplicationStatus(callback: EventCallback<ApplicationStatusEvent>): () => void {
    this.applicationListeners.add(callback);
    return () => this.applicationListeners.delete(callback);
  }

  /**
   * Subscribe to job updates
   */
  public onJobUpdate(callback: EventCallback<JobUpdateEvent>): () => void {
    this.jobListeners.add(callback);
    return () => this.jobListeners.delete(callback);
  }

  /**
   * Subscribe to notifications
   */
  public onNotification(callback: EventCallback<NotificationEvent>): () => void {
    this.notificationListeners.add(callback);
    return () => this.notificationListeners.delete(callback);
  }

  /**
   * Subscribe to unread count updates
   */
  public onUnreadCount(callback: EventCallback<UnreadCountEvent>): () => void {
    this.unreadCountListeners.add(callback);
    return () => this.unreadCountListeners.delete(callback);
  }

  /**
   * Subscribe to auto-apply status updates
   */
  public onAutoApplyStatus(callback: EventCallback<AutoApplyStatusEvent>): () => void {
    this.autoApplyListeners.add(callback);
    return () => this.autoApplyListeners.delete(callback);
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionChange(callback: EventCallback<boolean>): () => void {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  // ============= Event Notification Methods =============

  private notifyApplicationListeners(data: ApplicationStatusEvent): void {
    this.applicationListeners.forEach((cb) => cb(data));
  }

  private notifyJobListeners(data: JobUpdateEvent): void {
    this.jobListeners.forEach((cb) => cb(data));
  }

  private notifyNotificationListeners(data: NotificationEvent): void {
    this.notificationListeners.forEach((cb) => cb(data));
  }

  private notifyUnreadCountListeners(data: UnreadCountEvent): void {
    this.unreadCountListeners.forEach((cb) => cb(data));
  }

  private notifyAutoApplyListeners(data: AutoApplyStatusEvent): void {
    this.autoApplyListeners.forEach((cb) => cb(data));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((cb) => cb(connected));
  }

  // ============= Emit Methods =============

  /**
   * Mark notification as read
   */
  public markNotificationAsRead(notificationId: string): void {
    if (this.notificationSocket?.connected) {
      this.notificationSocket.emit('mark-as-read', { notificationId });
    }
  }

  /**
   * Mark all notifications as read
   */
  public markAllNotificationsAsRead(): void {
    if (this.notificationSocket?.connected) {
      this.notificationSocket.emit('mark-all-as-read');
    }
  }

  /**
   * Fetch notifications on demand
   */
  public fetchNotifications(page = 1, limit = 20): void {
    if (this.notificationSocket?.connected) {
      this.notificationSocket.emit('fetch-notifications', { page, limit });
    }
  }

  /**
   * Subscribe to specific application updates
   */
  public subscribeToApplication(applicationId: string): void {
    if (this.notificationSocket?.connected) {
      this.notificationSocket.emit('subscribe:application', { applicationId });
    }
  }

  /**
   * Unsubscribe from specific application updates
   */
  public unsubscribeFromApplication(applicationId: string): void {
    if (this.notificationSocket?.connected) {
      this.notificationSocket.emit('unsubscribe:application', { applicationId });
    }
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();

// React hook for WebSocket
import { useEffect, useState, useCallback } from 'react';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(websocketService.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = websocketService.onConnectionChange(setIsConnected);
    return unsubscribe;
  }, []);

  const connect = useCallback(() => {
    websocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
  };
};

export const useApplicationStatus = (applicationId?: string) => {
  const [status, setStatus] = useState<ApplicationStatusEvent | null>(null);

  useEffect(() => {
    const unsubscribe = websocketService.onApplicationStatus((data) => {
      if (!applicationId || data.applicationId === applicationId) {
        setStatus(data);
      }
    });

    if (applicationId) {
      websocketService.subscribeToApplication(applicationId);
    }

    return () => {
      unsubscribe();
      if (applicationId) {
        websocketService.unsubscribeFromApplication(applicationId);
      }
    };
  }, [applicationId]);

  return status;
};

export const useAutoApplyStatus = () => {
  const [status, setStatus] = useState<AutoApplyStatusEvent | null>(null);

  useEffect(() => {
    const unsubscribe = websocketService.onAutoApplyStatus(setStatus);
    return unsubscribe;
  }, []);

  return status;
};

export const useUnreadNotificationCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = websocketService.onUnreadCount((data) => {
      setCount(data.count);
    });
    return unsubscribe;
  }, []);

  return count;
};
