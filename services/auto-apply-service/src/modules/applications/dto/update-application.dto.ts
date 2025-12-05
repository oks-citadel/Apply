import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  response_received_at?: string;
}

export class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
