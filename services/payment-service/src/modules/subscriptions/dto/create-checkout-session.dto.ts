import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsUrl, IsObject, IsOptional } from 'class-validator';
import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsString()
  userEmail: string;

  @ApiProperty({
    description: 'Subscription tier',
    enum: SubscriptionTier,
    example: SubscriptionTier.BASIC,
  })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiProperty({
    description: 'Billing period',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsEnum(['monthly', 'yearly'])
  billingPeriod: 'monthly' | 'yearly';

  @ApiProperty({
    description: 'Success URL to redirect after successful payment',
    example: 'https://example.com/success',
  })
  @IsUrl()
  successUrl: string;

  @ApiProperty({
    description: 'Cancel URL to redirect if payment is canceled',
    example: 'https://example.com/cancel',
  })
  @IsUrl()
  cancelUrl: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'web' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
