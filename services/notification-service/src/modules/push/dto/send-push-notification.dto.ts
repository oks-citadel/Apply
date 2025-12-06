import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PushNotificationCategory {
  JOB_MATCH = 'job_match',
  APPLICATION_UPDATE = 'application_update',
  INTERVIEW_REMINDER = 'interview_reminder',
  MESSAGE = 'message',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ACCOUNT = 'account',
}

export class PushNotificationPayloadDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body/message' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Action URL when notification is clicked' })
  @IsOptional()
  @IsString()
  clickAction?: string;

  @ApiPropertyOptional({ description: 'Notification icon URL' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Notification image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Notification badge number (iOS)' })
  @IsOptional()
  badge?: number;

  @ApiPropertyOptional({ description: 'Notification sound' })
  @IsOptional()
  @IsString()
  sound?: string;

  @ApiPropertyOptional({ description: 'Additional custom data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class SendPushNotificationDto {
  @ApiProperty({
    description: 'User ID(s) to send notification to',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Notification payload',
    type: PushNotificationPayloadDto,
  })
  @ValidateNested()
  @Type(() => PushNotificationPayloadDto)
  notification: PushNotificationPayloadDto;

  @ApiPropertyOptional({
    description: 'Notification category',
    enum: PushNotificationCategory,
  })
  @IsOptional()
  @IsEnum(PushNotificationCategory)
  category?: PushNotificationCategory;

  @ApiPropertyOptional({ description: 'Time to live in seconds' })
  @IsOptional()
  ttl?: number;

  @ApiPropertyOptional({ description: 'Priority (high/normal)' })
  @IsOptional()
  @IsString()
  priority?: 'high' | 'normal';

  @ApiPropertyOptional({ description: 'Whether notification should be silent' })
  @IsOptional()
  silent?: boolean;
}
