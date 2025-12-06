import { IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  // Email notification preferences
  @ApiPropertyOptional({ description: 'Enable all email notifications' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable welcome emails' })
  @IsOptional()
  @IsBoolean()
  emailWelcome?: boolean;

  @ApiPropertyOptional({ description: 'Enable email verification emails' })
  @IsOptional()
  @IsBoolean()
  emailVerification?: boolean;

  @ApiPropertyOptional({ description: 'Enable password reset emails' })
  @IsOptional()
  @IsBoolean()
  emailPasswordReset?: boolean;

  @ApiPropertyOptional({ description: 'Enable application status update emails' })
  @IsOptional()
  @IsBoolean()
  emailApplicationStatus?: boolean;

  @ApiPropertyOptional({ description: 'Enable job alert emails' })
  @IsOptional()
  @IsBoolean()
  emailJobAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable weekly digest emails' })
  @IsOptional()
  @IsBoolean()
  emailWeeklyDigest?: boolean;

  @ApiPropertyOptional({ description: 'Enable marketing emails' })
  @IsOptional()
  @IsBoolean()
  emailMarketing?: boolean;

  // Push notification preferences
  @ApiPropertyOptional({ description: 'Enable all push notifications' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable application status push notifications' })
  @IsOptional()
  @IsBoolean()
  pushApplicationStatus?: boolean;

  @ApiPropertyOptional({ description: 'Enable job alert push notifications' })
  @IsOptional()
  @IsBoolean()
  pushJobAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable message push notifications' })
  @IsOptional()
  @IsBoolean()
  pushMessages?: boolean;

  // SMS notification preferences
  @ApiPropertyOptional({ description: 'Enable all SMS notifications' })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable application status SMS notifications' })
  @IsOptional()
  @IsBoolean()
  smsApplicationStatus?: boolean;

  // Notification frequency settings
  @ApiPropertyOptional({
    description: 'Digest frequency',
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
  })
  @IsOptional()
  @IsEnum(['immediate', 'hourly', 'daily', 'weekly'])
  digestFrequency?: string;

  @ApiPropertyOptional({ description: 'Quiet hours start time (HH:MM format)' })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Quiet hours end time (HH:MM format)' })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @ApiPropertyOptional({ description: 'User timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
