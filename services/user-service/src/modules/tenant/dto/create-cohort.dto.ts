import { IsString, IsOptional, IsDateString, IsArray, IsInt, MaxLength } from 'class-validator';

export class CreateCohortDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(100)
  program: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsDateString()
  graduation_date?: string;

  @IsOptional()
  @IsInt()
  target_enrollment?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instructors?: string[];

  @IsOptional()
  @IsString()
  coordinator_email?: string;
}
