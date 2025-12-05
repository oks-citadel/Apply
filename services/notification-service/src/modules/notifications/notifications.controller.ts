import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  SendEmailDto,
  SendPushDto,
} from './dto';
import { Notification } from './entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('email')
  @ApiOperation({ summary: 'Send email notification' })
  @ApiResponse({
    status: 201,
    description: 'Email sent successfully',
    type: Notification,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<Notification> {
    return await this.notificationsService.sendEmail(sendEmailDto);
  }

  @Post('push')
  @ApiOperation({ summary: 'Send push notification' })
  @ApiResponse({
    status: 201,
    description: 'Push notification sent successfully',
    type: Notification,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendPush(@Body() sendPushDto: SendPushDto): Promise<Notification> {
    return await this.notificationsService.sendPush(sendPushDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: Notification,
  })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return await this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated notifications',
  })
  async findAll(@Query() query: QueryNotificationsDto) {
    return await this.notificationsService.findAll(query);
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
  async findByUserId(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ): Promise<Notification[]> {
    return await this.notificationsService.findByUserId(userId, limit);
  }

  @Get('user/:userId/unread-count')
  @ApiOperation({ summary: 'Get unread notification count for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns unread count',
  })
  async getUnreadCount(@Param('userId') userId: string) {
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
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(@Param('id') id: string): Promise<Notification> {
    return await this.notificationsService.findOne(id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: Notification,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') id: string): Promise<Notification> {
    return await this.notificationsService.markAsRead(id);
  }

  @Put('user/:userId/read-all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Param('userId') userId: string) {
    return await this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.notificationsService.delete(id);
  }

  @Delete('cleanup/old')
  @ApiOperation({ summary: 'Delete old read notifications' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Delete notifications older than X days (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Old notifications deleted',
  })
  async deleteOld(@Query('days') days?: number) {
    return await this.notificationsService.deleteOld(days);
  }
}
