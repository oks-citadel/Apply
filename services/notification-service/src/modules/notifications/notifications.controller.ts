import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  SendEmailDto,
  SendPushDto,
  UpdatePreferencesDto,
} from './dto';
import { Notification } from './entities/notification.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('email')
  @ApiOperation({ summary: 'Send email notification (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Email sent successfully',
    type: Notification,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Notification> {
    // Admin-only for sending arbitrary emails
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can send email notifications');
    }
    return await this.notificationsService.sendEmail(sendEmailDto);
  }

  @Post('push')
  @ApiOperation({ summary: 'Send push notification (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Push notification sent successfully',
    type: Notification,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async sendPush(
    @Body() sendPushDto: SendPushDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Notification> {
    // Admin-only for sending arbitrary push notifications
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can send push notifications');
    }
    return await this.notificationsService.sendPush(sendPushDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: Notification,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Notification> {
    // Admin-only for creating arbitrary notifications
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can create notifications');
    }
    return await this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with filters (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated notifications',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(
    @Query() query: QueryNotificationsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Admin-only for querying all notifications
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can query all notifications');
    }
    return await this.notificationsService.findAll(query);
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns user notification preferences',
    type: NotificationPreferences,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async getPreferences(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationPreferences> {
    // IDOR protection: Users can only access their own preferences
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own preferences');
    }
    return await this.notificationsService.getPreferences(userId);
  }

  @Put('preferences/:userId')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
    type: NotificationPreferences,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot modify other user data' })
  async updatePreferences(
    @Param('userId') userId: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationPreferences> {
    // IDOR protection: Users can only update their own preferences
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own preferences');
    }
    return await this.notificationsService.updatePreferences(
      userId,
      updatePreferencesDto,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user notifications',
    type: [Notification],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async findByUserId(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Notification[]> {
    // IDOR protection: Users can only access their own notifications
    if (user && user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own notifications');
    }
    return await this.notificationsService.findByUserId(userId, limit);
  }

  @Get('user/:userId/unread-count')
  @ApiOperation({ summary: 'Get unread notification count for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns unread count',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async getUnreadCount(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // IDOR protection: Users can only access their own unread count
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own notification count');
    }
    return await this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns notification',
    type: Notification,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Notification> {
    const notification = await this.notificationsService.findOne(id);
    // IDOR protection: Users can only access their own notifications
    if (notification && notification.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own notifications');
    }
    return notification;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: Notification,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot modify other user data' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Notification> {
    // First fetch the notification to verify ownership
    const notification = await this.notificationsService.findOne(id);
    // IDOR protection: Users can only mark their own notifications as read
    if (notification && notification.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only modify your own notifications');
    }
    return await this.notificationsService.markAsRead(id);
  }

  @Patch('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot modify other user data' })
  async markAllAsRead(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // IDOR protection: Users can only mark their own notifications as read
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only modify your own notifications');
    }
    return await this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot delete other user data' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    // First fetch the notification to verify ownership
    const notification = await this.notificationsService.findOne(id);
    // IDOR protection: Users can only delete their own notifications
    if (notification && notification.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own notifications');
    }
    await this.notificationsService.delete(id);
  }

  @Delete('cleanup/old')
  @ApiOperation({ summary: 'Delete old read notifications (Admin only)' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Delete notifications older than X days (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Old notifications deleted',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async deleteOld(
    @Query('days') days?: number,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    // Admin-only cleanup operation
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can perform bulk cleanup operations');
    }
    return await this.notificationsService.deleteOld(days);
  }
}
