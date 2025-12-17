import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SLATier } from '../enums/sla.enums';

export class ContractMetadataDto {
  @ApiPropertyOptional({
    description: 'Referral code used',
    example: 'REF123',
  })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional({
    description: 'Marketing campaign ID',
    example: 'camp_summer2024',
  })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'VIP customer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSLAContractDto {
  @ApiProperty({
    description: 'User ID for the SLA contract',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'SLA tier level',
    enum: SLATier,
    example: 'professional',
  })
  @IsEnum(SLATier)
  tier: SLATier;

  @ApiPropertyOptional({
    description: 'Stripe payment intent ID',
    example: 'pi_1234567890',
  })
  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;

  @ApiPropertyOptional({
    description: 'Stripe subscription ID',
    example: 'sub_1234567890',
  })
  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @ApiPropertyOptional({
    description: 'Additional contract metadata',
    type: ContractMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContractMetadataDto)
  metadata?: ContractMetadataDto;
}

export class UpdateSLAContractDto {
  @ApiPropertyOptional({
    description: 'New SLA tier level',
    enum: SLATier,
  })
  @IsOptional()
  @IsEnum(SLATier)
  tier?: SLATier;

  @ApiPropertyOptional({
    description: 'Stripe payment intent ID',
  })
  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;

  @ApiPropertyOptional({
    description: 'Stripe subscription ID',
  })
  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @ApiPropertyOptional({
    description: 'Updated contract metadata',
    type: ContractMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContractMetadataDto)
  metadata?: ContractMetadataDto;
}

export class ExtendSLAContractDto {
  @ApiProperty({
    description: 'Number of days to extend the contract',
    example: 30,
  })
  @IsNumber()
  extensionDays: number;

  @ApiPropertyOptional({
    description: 'Reason for extension',
    example: 'Customer requested extension due to illness',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
