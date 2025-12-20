import { Type } from 'class-transformer';
import { IsString, IsEmail, IsEnum, IsOptional, IsObject, IsUrl, ValidateNested, Matches, MaxLength } from 'class-validator';

import { TenantType, LicenseType } from '../enums/tenant-type.enum';

export class BrandingSettingsDto {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'primaryColor must be a valid hex color' })
  primaryColor?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'secondaryColor must be a valid hex color' })
  secondaryColor?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'accentColor must be a valid hex color' })
  accentColor?: string;

  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsString()
  customDomain?: string;

  @IsOptional()
  @IsString()
  emailFooter?: string;

  @IsOptional()
  @IsUrl()
  termsUrl?: string;

  @IsOptional()
  @IsUrl()
  privacyUrl?: string;
}

export class CreateTenantDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' })
  slug: string;

  @IsEnum(TenantType)
  type: TenantType;

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

  @IsEmail()
  admin_email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  admin_phone?: string;

  @IsOptional()
  @IsEmail()
  billing_email?: string;

  @IsEnum(LicenseType)
  license_type: LicenseType;

  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingSettingsDto)
  branding_settings?: BrandingSettingsDto;
}
