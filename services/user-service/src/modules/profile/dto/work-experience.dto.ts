import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, IsArray, MaxLength } from 'class-validator';

export class CreateWorkExperienceDto {
  @ApiProperty({ example: 'Tech Company Inc.' })
  @IsString()
  @MaxLength(255)
  company: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'San Francisco, CA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ example: '2020-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2023-12-31', required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiProperty({ example: 'Led a team of engineers...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['Increased performance by 40%', 'Mentored 5 junior developers'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
}

export class UpdateWorkExperienceDto {
  @ApiProperty({ example: 'Tech Company Inc.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @ApiProperty({ example: 'Senior Software Engineer', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ example: 'San Francisco, CA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ example: '2020-01-01', required: false })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ example: '2023-12-31', required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiProperty({ example: 'Led a team of engineers...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['Increased performance by 40%', 'Mentored 5 junior developers'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
}
