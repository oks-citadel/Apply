import { Type } from 'class-transformer';
import { IsString, IsEmail, IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';

import { UserRole } from '../enums/tenant-type.enum';

export class BulkUserDto {
  @IsEmail()
  email: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  employee_id?: string;

  @IsOptional()
  @IsString()
  student_id?: string;

  @IsOptional()
  @IsString()
  cohort?: string;

  @IsOptional()
  @IsString()
  graduation_year?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsBoolean()
  send_invitation?: boolean;
}

export class BulkImportUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUserDto)
  users: BulkUserDto[];

  @IsOptional()
  @IsBoolean()
  send_invitations?: boolean;

  @IsOptional()
  @IsBoolean()
  skip_duplicates?: boolean;
}
