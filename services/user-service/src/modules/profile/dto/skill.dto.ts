import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength, IsInt } from 'class-validator';

import { SkillProficiency } from '../../../common/enums/subscription-tier.enum';

export class CreateSkillDto {
  @ApiProperty({ example: 'React.js' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'advanced', enum: SkillProficiency })
  @IsEnum(SkillProficiency)
  proficiency: SkillProficiency;

  @ApiProperty({ example: 'frontend', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt()
  years_of_experience?: number;
}

export class UpdateSkillDto {
  @ApiProperty({ example: 'React.js', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: 'advanced', enum: SkillProficiency, required: false })
  @IsOptional()
  @IsEnum(SkillProficiency)
  proficiency?: SkillProficiency;

  @ApiProperty({ example: 'frontend', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt()
  years_of_experience?: number;
}
