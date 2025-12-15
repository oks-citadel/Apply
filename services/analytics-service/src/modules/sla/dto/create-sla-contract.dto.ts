import { IsEnum, IsUUID, IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SLATier } from '../enums/sla.enums';

export class CreateSLAContractDto {
  @IsUUID()
  userId: string;

  @IsEnum(SLATier)
  tier: SLATier;

  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;

  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContractMetadataDto)
  metadata?: ContractMetadataDto;
}

export class ContractMetadataDto {
  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSLAContractDto {
  @IsOptional()
  @IsEnum(SLATier)
  tier?: SLATier;

  @IsOptional()
  @IsString()
  stripePaymentIntentId?: string;

  @IsOptional()
  @IsString()
  stripeSubscriptionId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContractMetadataDto)
  metadata?: ContractMetadataDto;
}

export class ExtendSLAContractDto {
  @IsNumber()
  extensionDays: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
