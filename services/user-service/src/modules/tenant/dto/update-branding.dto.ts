import { IsOptional, IsUrl, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SSOSettingsDto {
  @IsOptional()
  @IsString()
  saml?: {
    entryPoint?: string;
    issuer?: string;
    cert?: string;
    callbackUrl?: string;
  };

  @IsOptional()
  @IsString()
  oidc?: {
    issuer?: string;
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
  };
}

export class UpdateBrandingDto {
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'primary_color must be a valid hex color' })
  primary_color?: string;

  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'secondary_color must be a valid hex color' })
  secondary_color?: string;

  @IsOptional()
  @IsString()
  custom_domain?: string;

  @IsOptional()
  branding_settings?: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    customCss?: string;
    customDomain?: string;
    emailFooter?: string;
    termsUrl?: string;
    privacyUrl?: string;
  };
}
