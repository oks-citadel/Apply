import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUrl, IsOptional } from 'class-validator';

import { SubscriptionTier } from '../../../common/enums/subscription-tier.enum';

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: SubscriptionTier, example: SubscriptionTier.PRO })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiProperty({ example: 'http://localhost:3000/subscription/success', required: false })
  @IsOptional()
  @IsUrl()
  success_url?: string;

  @ApiProperty({ example: 'http://localhost:3000/subscription/cancel', required: false })
  @IsOptional()
  @IsUrl()
  cancel_url?: string;
}
