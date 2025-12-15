import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean, IsArray, IsInt, Min, Max } from 'class-validator';

export enum PlacementStatus {
  PENDING = 'pending',
  PLACED = 'placed',
  SEEKING = 'seeking',
  NOT_SEEKING = 'not_seeking',
}

export enum EmploymentType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
}

export enum JobSource {
  PLATFORM = 'platform',
  CAREER_FAIR = 'career_fair',
  REFERRAL = 'referral',
  DIRECT = 'direct',
  OTHER = 'other',
}

export class CreatePlacementDto {
  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  student_id?: string;

  @IsString()
  student_name: string;

  @IsEmail()
  student_email: string;

  @IsString()
  cohort: string;

  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  graduation_year?: string;

  @IsOptional()
  @IsDateString()
  graduation_date?: string;

  @IsEnum(PlacementStatus)
  placement_status: PlacementStatus;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employment_type?: EmploymentType;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  salary_currency?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  placement_date?: string;

  @IsOptional()
  @IsInt()
  total_applications?: number;

  @IsOptional()
  @IsInt()
  interviews_attended?: number;

  @IsOptional()
  @IsInt()
  offers_received?: number;

  @IsOptional()
  @IsEnum(JobSource)
  job_source?: JobSource;

  @IsOptional()
  @IsBoolean()
  used_platform?: boolean;

  @IsOptional()
  @IsBoolean()
  attended_career_services?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satisfaction_score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
