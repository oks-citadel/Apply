import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsObject, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parent_department_id?: string;

  @IsOptional()
  @IsUUID()
  manager_user_id?: string;

  @IsOptional()
  @IsNumber()
  annual_budget?: number;

  @IsOptional()
  @IsNumber()
  target_headcount?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsObject()
  settings?: {
    autoApproveApplications?: boolean;
    requireManagerApproval?: boolean;
    notificationEmail?: string;
    customFields?: Record<string, any>;
  };
}
