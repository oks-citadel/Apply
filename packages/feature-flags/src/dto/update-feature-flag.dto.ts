import { IsEnum, IsBoolean, IsOptional, IsNumber, IsArray, IsString, Min, Max } from 'class-validator';
import { FeatureFlagStatus } from '../types';

export class UpdateFeatureFlagDto {
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

  @IsString()
  @IsOptional()
  description?: string;
}
