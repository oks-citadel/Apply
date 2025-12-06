import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
import { ApnsClient, Notification } from 'apns2';
import {
  DeviceToken,
  DevicePlatform,
  DeviceStatus,
} from './entities/device-token.entity';
import {
  RegisterDeviceDto,
  UnregisterDeviceDto,
  SendPushNotificationDto,
  PushNotificationPayloadDto,
} from './dto';

export interface PushResult {
  success: boolean;
  platform: DevicePlatform;
  token: string;
  messageId?: string;
  error?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private fcmApp: admin.app.App;
  private apnsProvider: ApnsClient;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeFCM();
    await this.initializeAPNs();
  }

  private async initializeFCM() {
    try {
      const fcmCredentials = this.configService.get('FCM_SERVICE_ACCOUNT');

      if (!fcmCredentials) {
        this.logger.warn(
          'FCM credentials not configured. Set FCM_SERVICE_ACCOUNT environment variable.',
        );
        return;
      }

      // Parse credentials if it's a JSON string
      const serviceAccount =
        typeof fcmCredentials === 'string'
          ? JSON.parse(fcmCredentials)
          : fcmCredentials;

      this.fcmApp = admin.initializeApp(
        {
          credential: admin.credential.cert(serviceAccount),
        },
        'push-service',
      );

      this.logger.log('Firebase Cloud Messaging initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize FCM:', error.message);
    }
  }

  private async initializeAPNs() {
    try {
      const apnsKeyId = this.configService.get('APNS_KEY_ID');
      const apnsTeamId = this.configService.get('APNS_TEAM_ID');
      const apnsKey = this.configService.get('APNS_KEY');
      const apnsProduction = this.configService.get('APNS_PRODUCTION', 'false') === 'true';

      if (!apnsKeyId || !apnsTeamId || !apnsKey) {
        this.logger.warn(
          'APNs credentials not configured. Set APNS_KEY_ID, APNS_TEAM_ID, and APNS_KEY environment variables.',
        );
        return;
      }

      this.apnsProvider = new ApnsClient({
        team: apnsTeamId,
        keyId: apnsKeyId,
        signingKey: apnsKey,
        host: apnsProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com',
      });

      this.logger.log('Apple Push Notification service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize APNs:', error.message);
    }
  }

  async registerDevice(dto: RegisterDeviceDto): Promise<DeviceToken> {
    try {
      // Check if device already exists
      let device = await this.deviceTokenRepository.findOne({
        where: {
          token: dto.token,
          platform: dto.platform,
        },
      });

      if (device) {
        // Update existing device
        device.userId = dto.userId;
        device.status = DeviceStatus.ACTIVE;
        device.deviceName = dto.deviceName || device.deviceName;
        device.deviceModel = dto.deviceModel || device.deviceModel;
        device.osVersion = dto.osVersion || device.osVersion;
        device.appVersion = dto.appVersion || device.appVersion;
        device.language = dto.language || device.language;
        device.timezone = dto.timezone || device.timezone;
        device.metadata = dto.metadata || device.metadata;
        device.lastUsedAt = new Date();
      } else {
        // Create new device
        device = this.deviceTokenRepository.create({
          ...dto,
          status: DeviceStatus.ACTIVE,
          lastUsedAt: new Date(),
        });
      }

      await this.deviceTokenRepository.save(device);
      this.logger.log(`Device registered: ${dto.platform} token for user ${dto.userId}`);

      return device;
    } catch (error) {
      this.logger.error('Failed to register device:', error.message);
      throw error;
    }
  }

  async unregisterDevice(dto: UnregisterDeviceDto): Promise<void> {
    try {
      const result = await this.deviceTokenRepository.update(
        {
          userId: dto.userId,
          token: dto.token,
        },
        {
          status: DeviceStatus.INACTIVE,
        },
      );

      this.logger.log(`Device unregistered for user ${dto.userId}`);
    } catch (error) {
      this.logger.error('Failed to unregister device:', error.message);
      throw error;
    }
  }

  async getUserDevices(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: {
        userId,
        status: DeviceStatus.ACTIVE,
      },
    });
  }

  async sendPushNotification(dto: SendPushNotificationDto): Promise<PushResult[]> {
    const results: PushResult[] = [];

    try {
      // Get all active devices for the users
      const devices = await this.deviceTokenRepository.find({
        where: {
          userId: In(dto.userIds),
          status: DeviceStatus.ACTIVE,
        },
      });

      if (devices.length === 0) {
        this.logger.warn(`No active devices found for users: ${dto.userIds.join(', ')}`);
        return results;
      }

      // Group devices by platform
      const androidDevices = devices.filter((d) => d.platform === DevicePlatform.ANDROID);
      const iosDevices = devices.filter((d) => d.platform === DevicePlatform.IOS);
      const webDevices = devices.filter((d) => d.platform === DevicePlatform.WEB);

      // Send to Android and Web (via FCM)
      if (androidDevices.length > 0 || webDevices.length > 0) {
        const fcmDevices = [...androidDevices, ...webDevices];
        const fcmResults = await this.sendViaFCM(fcmDevices, dto);
        results.push(...fcmResults);
      }

      // Send to iOS (via APNs)
      if (iosDevices.length > 0) {
        const apnsResults = await this.sendViaAPNs(iosDevices, dto);
        results.push(...apnsResults);
      }

      // Mark devices with failed tokens as invalid
      await this.markInvalidTokens(results);

      return results;
    } catch (error) {
      this.logger.error('Failed to send push notification:', error.message);
      throw error;
    }
  }

  private async sendViaFCM(
    devices: DeviceToken[],
    dto: SendPushNotificationDto,
  ): Promise<PushResult[]> {
    const results: PushResult[] = [];

    if (!this.fcmApp) {
      this.logger.warn('FCM not initialized, skipping FCM notifications');
      devices.forEach((device) => {
        results.push({
          success: false,
          platform: device.platform,
          token: device.token,
          error: 'FCM not initialized',
        });
      });
      return results;
    }

    const tokens = devices.map((d) => d.token);
    const { notification } = dto;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image,
      },
      data: {
        ...notification.data,
        category: dto.category || '',
        clickAction: notification.clickAction || '',
      },
      android: {
        priority: dto.priority === 'high' ? 'high' : 'normal',
        ttl: dto.ttl ? dto.ttl * 1000 : undefined,
        notification: {
          icon: notification.icon,
          sound: notification.sound || 'default',
          clickAction: notification.clickAction,
        },
      },
      webpush: notification.clickAction
        ? {
            fcmOptions: {
              link: notification.clickAction,
            },
          }
        : undefined,
    };

    try {
      const response = await admin.messaging(this.fcmApp).sendEachForMulticast(message);

      response.responses.forEach((resp, idx) => {
        const device = devices[idx];
        if (resp.success) {
          results.push({
            success: true,
            platform: device.platform,
            token: device.token,
            messageId: resp.messageId,
          });
        } else {
          results.push({
            success: false,
            platform: device.platform,
            token: device.token,
            error: resp.error?.message || 'Unknown error',
          });
        }
      });

      this.logger.log(
        `FCM: Sent ${response.successCount}/${tokens.length} notifications`,
      );
    } catch (error) {
      this.logger.error('FCM send error:', error.message);
      devices.forEach((device) => {
        results.push({
          success: false,
          platform: device.platform,
          token: device.token,
          error: error.message,
        });
      });
    }

    return results;
  }

  private async sendViaAPNs(
    devices: DeviceToken[],
    dto: SendPushNotificationDto,
  ): Promise<PushResult[]> {
    const results: PushResult[] = [];

    if (!this.apnsProvider) {
      this.logger.warn('APNs not initialized, skipping APNs notifications');
      devices.forEach((device) => {
        results.push({
          success: false,
          platform: device.platform,
          token: device.token,
          error: 'APNs not initialized',
        });
      });
      return results;
    }

    const { notification } = dto;

    for (const device of devices) {
      try {
        const apnsNotification = new Notification(device.token, {
          alert: {
            title: notification.title,
            body: notification.body,
          },
          badge: notification.badge,
          sound: notification.sound || 'default',
          category: dto.category,
          data: notification.data,
        });

        await this.apnsProvider.send(apnsNotification);

        results.push({
          success: true,
          platform: device.platform,
          token: device.token,
        });
      } catch (error) {
        this.logger.error(`APNs send error for token ${device.token}:`, error.message);
        results.push({
          success: false,
          platform: device.platform,
          token: device.token,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(`APNs: Sent ${successCount}/${devices.length} notifications`);

    return results;
  }

  private async markInvalidTokens(results: PushResult[]): Promise<void> {
    const invalidTokens = results
      .filter(
        (r) =>
          !r.success &&
          (r.error?.includes('not-found') ||
            r.error?.includes('invalid-registration-token') ||
            r.error?.includes('Unregistered') ||
            r.error?.includes('InvalidRegistration')),
      )
      .map((r) => r.token);

    if (invalidTokens.length > 0) {
      await this.deviceTokenRepository.update(
        { token: In(invalidTokens) },
        {
          status: DeviceStatus.INVALID,
          invalidAt: new Date(),
        },
      );

      this.logger.log(`Marked ${invalidTokens.length} tokens as invalid`);
    }
  }

  async cleanupInactiveDevices(daysInactive: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const result = await this.deviceTokenRepository.delete({
      lastUsedAt: In([null]),
      createdAt: In([cutoffDate]),
      status: DeviceStatus.INACTIVE,
    });

    this.logger.log(`Cleaned up ${result.affected || 0} inactive devices`);
    return result.affected || 0;
  }
}
