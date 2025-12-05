import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import { SkillProficiency } from '../../../common/enums/subscription-tier.enum';

export class CreateSkillDto {
  @ApiProperty({ example: 'JavaScript' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: SkillProficiency, example: SkillProficiency.ADVANCED })
  @IsEnum(SkillProficiency)
  proficiency: SkillProficiency;

  @ApiProperty({ example: 'Programming Languages', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  years_of_experience?: number;

  @ApiProperty({ example: true, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class UpdateSkillDto {
  @ApiProperty({ enum: SkillProficiency, example: SkillProficiency.EXPERT, required: false })
  @IsOptional()
  @IsEnum(SkillProficiency)
  proficiency?: SkillProficiency;

  @ApiProperty({ example: 'Programming Languages', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 6, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  years_of_experience?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
