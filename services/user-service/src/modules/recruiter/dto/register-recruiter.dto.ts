import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
  ValidateNested,
} from 'class-validator';

import {
  IndustrySpecialization,
  RoleSpecialization,
  RecruiterTier,
} from '../entities/recruiter-profile.entity';

export class RegisterRecruiterDto {
  @ApiProperty({ description: 'Company or agency name' })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsUrl()
  @IsOptional()
  company_website?: string;

  @ApiPropertyOptional({ description: 'Professional bio' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Years of recruiting experience' })
  @IsInt()
  @Min(0)
  @Max(50)
  years_of_experience: number;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL' })
  @IsUrl()
  @IsOptional()
  linkedin_url?: string;

  @ApiPropertyOptional({ description: 'Professional certification name' })
  @IsString()
  @IsOptional()
  certification?: string;

  @ApiPropertyOptional({ description: 'Certification verification URL' })
  @IsUrl()
  @IsOptional()
  certification_url?: string;

  @ApiProperty({
    description: 'Industry specializations',
    enum: IndustrySpecialization,
    isArray: true,
  })
  @IsArray()
  @IsEnum(IndustrySpecialization, { each: true })
  industries: IndustrySpecialization[];

  @ApiProperty({
    description: 'Role specializations',
    enum: RoleSpecialization,
    isArray: true,
  })
  @IsArray()
  @IsEnum(RoleSpecialization, { each: true })
  roles: RoleSpecialization[];

  @ApiPropertyOptional({
    description: 'Geographic regions (e.g., ["US-CA", "US-NY", "UK"])',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  regions?: string[];

  @ApiPropertyOptional({
    description: 'Languages spoken',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiProperty({ description: 'Maximum concurrent assignments' })
  @IsInt()
  @Min(1)
  @Max(50)
  max_concurrent_assignments: number;

  @ApiPropertyOptional({
    description: 'Available hours (e.g., ["9-12", "14-18"])',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  available_hours?: string[];

  @ApiPropertyOptional({ description: 'Timezone (e.g., "America/New_York")' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ description: 'Placement fee percentage (e.g., 15 for 15%)' })
  @IsNumber()
  @Min(0)
  @Max(50)
  placement_fee_percentage: number;
}
