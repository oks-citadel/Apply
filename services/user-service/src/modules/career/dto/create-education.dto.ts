import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'Stanford University' })
  @IsString()
  @MaxLength(255)
  institution: string;

  @ApiProperty({ example: 'Bachelor of Science' })
  @IsString()
  @MaxLength(255)
  degree: string;

  @ApiProperty({ example: 'Computer Science', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  field_of_study?: string;

  @ApiProperty({ example: '2016-09-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2020-06-01', required: false })
  @ValidateIf((o) => !o.is_current)
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiProperty({ example: '3.8', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gpa?: string;

  @ApiProperty({
    example: 'Focused on artificial intelligence and machine learning',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['Dean\'s List', 'Graduated with Honors'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
}

export class UpdateEducationDto extends CreateEducationDto {}
