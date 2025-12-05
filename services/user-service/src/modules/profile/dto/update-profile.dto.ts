import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MaxLength, IsPhoneNumber } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @ApiProperty({ example: 'Senior Software Engineer', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  headline?: string;

  @ApiProperty({
    example: 'Passionate software engineer with 5+ years of experience in full-stack development',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'San Francisco, CA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', required: false })
  @IsOptional()
  @IsUrl()
  linkedin_url?: string;

  @ApiProperty({ example: 'https://github.com/johndoe', required: false })
  @IsOptional()
  @IsUrl()
  github_url?: string;

  @ApiProperty({ example: 'https://johndoe.dev', required: false })
  @IsOptional()
  @IsUrl()
  portfolio_url?: string;
}
