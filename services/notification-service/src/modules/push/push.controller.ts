import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PushService } from './push.service';
import {
  RegisterDeviceDto,
  UnregisterDeviceDto,
  SendPushNotificationDto,
} from './dto';
import { DeviceToken } from './entities/device-token.entity';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@Controller('push')
@UseGuards(JwtAuthGuard) // Require authentication for push notification management
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a device for push notifications' })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
    type: DeviceToken,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerDevice(
    @Body() registerDeviceDto: RegisterDeviceDto,
  ): Promise<DeviceToken> {
    return this.pushService.registerDevice(registerDeviceDto);
  }

  @Delete('unregister')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister a device from push notifications' })
  @ApiResponse({ status: 204, description: 'Device unregistered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async unregisterDevice(
    @Body() unregisterDeviceDto: UnregisterDeviceDto,
  ): Promise<void> {
    return this.pushService.unregisterDevice(unregisterDeviceDto);
  }

  @Get('devices/:userId')
  @ApiOperation({ summary: 'Get all devices for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of user devices',
    type: [DeviceToken],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
  async getUserDevices(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeviceToken[]> {
    // IDOR protection: Users can only access their own devices
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('You can only access your own devices');
    }
    return this.pushService.getUserDevices(userId);
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notifications sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async sendPushNotification(
    @Body() sendPushDto: SendPushNotificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    // Admin-only endpoint for bulk push notifications
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can send bulk push notifications');
    }

    const results = await this.pushService.sendPushNotification(sendPushDto);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return {
      success: true,
      totalSent: successCount,
      totalFailed: failureCount,
      results,
    };
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up inactive devices (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async cleanupInactiveDevices(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    // Admin-only endpoint
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only administrators can clean up devices');
    }

    const count = await this.pushService.cleanupInactiveDevices();
    return {
      success: true,
      devicesRemoved: count,
    };
  }
}
