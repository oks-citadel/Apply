import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { FeatureFlagType, FeatureFlagStatus } from '../types';

export class CreateFeatureFlagDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(FeatureFlagType)
  @IsOptional()
  type?: FeatureFlagType;

  @IsEnum(FeatureFlagStatus)
  @IsOptional()
  status?: FeatureFlagStatus;

  @IsBoolean()
  @IsOptional()
  defaultValue?: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  enabledUserIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  disabledUserIds?: string[];
}
