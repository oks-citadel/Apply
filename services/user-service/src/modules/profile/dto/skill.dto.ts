import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { SkillCategory, ProficiencyLevel } from '../entities/skill.entity';

export class CreateSkillDto {
  @ApiProperty({ example: 'React.js' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'technical', enum: SkillCategory })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiProperty({ example: 'advanced', enum: ProficiencyLevel })
  @IsEnum(ProficiencyLevel)
  proficiency: ProficiencyLevel;
}

export class UpdateSkillDto {
  @ApiProperty({ example: 'React.js', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: 'technical', enum: SkillCategory, required: false })
  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @ApiProperty({ example: 'advanced', enum: ProficiencyLevel, required: false })
  @IsOptional()
  @IsEnum(ProficiencyLevel)
  proficiency?: ProficiencyLevel;
}
