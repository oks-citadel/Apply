import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { ApplicationSource } from '../entities/application.entity';

export class CreateApplicationDto {
  @IsUUID()
  user_id: string;

  @IsUUID()
  job_id: string;

  @IsEnum(ApplicationSource)
  @IsOptional()
  source?: ApplicationSource;

  @IsUUID()
  @IsOptional()
  resume_id?: string;

  @IsUUID()
  @IsOptional()
  cover_letter_id?: string;

  @IsNumber()
  @IsOptional()
  match_score?: number;

  @IsBoolean()
  @IsOptional()
  auto_applied?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  position_title?: string;

  @IsString()
  @IsOptional()
  application_url?: string;

  @IsString()
  @IsOptional()
  ats_platform?: string;

  @IsObject()
  @IsOptional()
  form_responses?: Record<string, any>;
}
