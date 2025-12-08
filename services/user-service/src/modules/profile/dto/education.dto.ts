import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'Stanford University' })
  @IsString()
  @MaxLength(255)
  school: string;

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
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: '3.8', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gpa?: string;

  @ApiProperty({ example: 'President of Computer Science Club, Dean\'s List', required: false })
  @IsOptional()
  @IsString()
  activities?: string;
}

export class UpdateEducationDto {
  @ApiProperty({ example: 'Stanford University', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  school?: string;

  @ApiProperty({ example: 'Bachelor of Science', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  degree?: string;

  @ApiProperty({ example: 'Computer Science', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  field_of_study?: string;

  @ApiProperty({ example: '2016-09-01', required: false })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ example: '2020-06-01', required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: '3.8', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gpa?: string;

  @ApiProperty({ example: 'President of Computer Science Club, Dean\'s List', required: false })
  @IsOptional()
  @IsString()
  activities?: string;
}
