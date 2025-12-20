import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsBoolean, Min, Max, IsString } from 'class-validator';

import { RemotePreference, ExperienceLevel } from '../../../common/enums/subscription-tier.enum';

export class UpdatePreferenceDto {
  @ApiProperty({ example: ['Software Engineer', 'Full Stack Developer'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target_job_titles?: string[];

  @ApiProperty({ example: ['San Francisco, CA', 'New York, NY', 'Remote'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target_locations?: string[];

  @ApiProperty({ example: 100000, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  salary_min?: number;

  @ApiProperty({ example: 200000, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  salary_max?: number;

  @ApiProperty({ enum: RemotePreference, example: RemotePreference.REMOTE, required: false })
  @IsOptional()
  @IsEnum(RemotePreference)
  remote_preference?: RemotePreference;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.SENIOR, required: false })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experience_level?: ExperienceLevel;

  @ApiProperty({ example: ['Technology', 'Finance', 'Healthcare'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @ApiProperty({ example: ['Company A', 'Company B'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excluded_companies?: string[];

  @ApiProperty({ example: ['startup', 'medium', 'enterprise'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_company_sizes?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  open_to_relocation?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  open_to_sponsorship?: boolean;

  @ApiProperty({ example: ['health insurance', '401k', 'stock options'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_benefits?: string[];
}
