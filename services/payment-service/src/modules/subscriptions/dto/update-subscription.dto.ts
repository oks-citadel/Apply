import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsDateString, IsObject } from 'class-validator';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';
import { SubscriptionStatus } from '../../../common/enums/subscription-status.enum';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Subscription tier',
    enum: SubscriptionTier,
    example: SubscriptionTier.PROFESSIONAL,
  })
  @IsEnum(SubscriptionTier)
  @IsOptional()
  tier?: SubscriptionTier;

  @ApiPropertyOptional({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Current period start date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  currentPeriodStart?: Date;

  @ApiPropertyOptional({
    description: 'Current period end date',
    example: '2024-02-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  currentPeriodEnd?: Date;

  @ApiPropertyOptional({
    description: 'Cancel at period end',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({
    description: 'Canceled at date',
    example: '2024-01-15T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  canceledAt?: Date;

  @ApiPropertyOptional({
    description: 'Trial start date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  trialStart?: Date;

  @ApiPropertyOptional({
    description: 'Trial end date',
    example: '2024-01-14T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  trialEnd?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'web' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
