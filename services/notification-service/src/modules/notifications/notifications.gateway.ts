import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSocketMap = new Map<string, Set<string>>();

  constructor(private notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.notificationsService.setGateway(this);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const userId = this.extractUserId(client);

      if (!userId) {
        this.logger.warn(`Connection rejected: No user ID found`);
        client.disconnect();
        return;
      }

      client.userId = userId;

      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, new Set());
      }
      this.userSocketMap.get(userId).add(client.id);

      client.join(`user:${userId}`);

      this.logger.log(
        `Client connected: ${client.id} for user ${userId}. Total connections: ${this.userSocketMap.get(userId).size}`,
      );

      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unread-count', unreadCount);

      const recentNotifications = await this.notificationsService.findByUserId(
        userId,
        10,
      );
      client.emit('initial-notifications', recentNotifications);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;

    if (userId && this.userSocketMap.has(userId)) {
      this.userSocketMap.get(userId).delete(client.id);

      if (this.userSocketMap.get(userId).size === 0) {
        this.userSocketMap.delete(userId);
      }

      this.logger.log(
        `Client disconnected: ${client.id} for user ${userId}. Remaining connections: ${this.userSocketMap.get(userId)?.size || 0}`,
      );
    }
  }

  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const notification = await this.notificationsService.markAsRead(
        data.notificationId,
      );

      const unreadCount = await this.notificationsService.getUnreadCount(
        client.userId,
      );

      client.emit('notification-updated', notification);
      client.emit('unread-count', unreadCount);

      return { success: true, notification };
    } catch (error) {
      this.logger.error(`Error marking as read: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('mark-all-as-read')
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const result = await this.notificationsService.markAllAsRead(
        client.userId,
      );

      const unreadCount = await this.notificationsService.getUnreadCount(
        client.userId,
      );

      client.emit('unread-count', unreadCount);

      const notifications = await this.notificationsService.findByUserId(
        client.userId,
        50,
      );
      client.emit('notifications-refreshed', notifications);

      return { success: true, updated: result.updated };
    } catch (error) {
      this.logger.error(`Error marking all as read: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('fetch-notifications')
  async handleFetchNotifications(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { page?: number; limit?: number },
  ) {
    try {
      if (!client.userId) {
        return { error: 'Unauthorized' };
      }

      const notifications = await this.notificationsService.findByUserId(
        client.userId,
        data.limit || 20,
      );

      return { success: true, notifications };
    } catch (error) {
      this.logger.error(`Error fetching notifications: ${error.message}`);
      return { error: error.message };
    }
  }

  async sendNotificationToUser(
    userId: string,
    notification: any,
  ): Promise<void> {
    try {
      this.server.to(`user:${userId}`).emit('new-notification', notification);

      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.server.to(`user:${userId}`).emit('unread-count', unreadCount);

      this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      this.logger.error(
        `Error sending notification to user ${userId}: ${error.message}`,
      );
    }
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  private extractUserId(client: Socket): string | null {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        return null;
      }

      const userId = client.handshake.auth?.userId || client.handshake.query?.userId;

      return userId as string;
    } catch (error) {
      this.logger.error(`Error extracting user ID: ${error.message}`);
      return null;
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSocketMap.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.userSocketMap.has(userId) && this.userSocketMap.get(userId).size > 0;
  }

  getUserConnectionCount(userId: string): number {
    return this.userSocketMap.get(userId)?.size || 0;
  }
}
