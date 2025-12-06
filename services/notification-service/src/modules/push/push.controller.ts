import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
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

// Note: Add your auth guard here when available
// @UseGuards(JwtAuthGuard)
@ApiTags('Push Notifications')
@ApiBearerAuth()
@Controller('push')
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
  async getUserDevices(@Param('userId') userId: string): Promise<DeviceToken[]> {
    return this.pushService.getUserDevices(userId);
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to users' })
  @ApiResponse({ status: 200, description: 'Notifications sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendPushNotification(
    @Body() sendPushDto: SendPushNotificationDto,
  ): Promise<any> {
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
  @ApiOperation({ summary: 'Clean up inactive devices' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupInactiveDevices(): Promise<any> {
    const count = await this.pushService.cleanupInactiveDevices();
    return {
      success: true,
      devicesRemoved: count,
    };
  }
}
