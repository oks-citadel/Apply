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

export class CreateWorkExperienceDto {
  @ApiProperty({ example: 'Tech Corp Inc.' })
  @IsString()
  @MaxLength(255)
  company: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @MaxLength(255)
  position: string;

  @ApiProperty({ example: 'San Francisco, CA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ example: '2020-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2023-12-31', required: false })
  @ValidateIf((o) => !o.is_current)
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiProperty({
    example: 'Led development of microservices architecture',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['Improved system performance by 40%', 'Mentored 5 junior developers'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];

  @ApiProperty({ example: ['Node.js', 'React', 'PostgreSQL'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];
}

export class UpdateWorkExperienceDto extends CreateWorkExperienceDto {}
