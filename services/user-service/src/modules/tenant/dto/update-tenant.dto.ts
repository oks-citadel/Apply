import { IsString, IsEmail, IsEnum, IsOptional, IsUrl, ValidateNested, Matches, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { TenantStatus } from '../enums/tenant-type.enum';
import { BrandingSettingsDto } from './create-tenant.dto';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  industry?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsEmail()
  admin_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  admin_phone?: string;

  @IsOptional()
  @IsEmail()
  billing_email?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingSettingsDto)
  branding_settings?: BrandingSettingsDto;
}
