import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsUrl, MaxLength } from 'class-validator';

export class CreateCertificationDto {
  @ApiProperty({ example: 'AWS Certified Solutions Architect' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Amazon Web Services' })
  @IsString()
  @MaxLength(255)
  issuing_organization: string;

  @ApiProperty({ example: '2023-01-15' })
  @IsDateString()
  issue_date: string;

  @ApiProperty({ example: '2026-01-15', required: false })
  @IsOptional()
  @IsDateString()
  expiration_date?: string;

  @ApiProperty({ example: 'AWS-12345-67890', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  credential_id?: string;

  @ApiProperty({ example: 'https://www.credly.com/badges/12345', required: false })
  @IsOptional()
  @IsUrl()
  credential_url?: string;
}

export class UpdateCertificationDto {
  @ApiProperty({ example: 'AWS Certified Solutions Architect', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: 'Amazon Web Services', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuing_organization?: string;

  @ApiProperty({ example: '2023-01-15', required: false })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiProperty({ example: '2026-01-15', required: false })
  @IsOptional()
  @IsDateString()
  expiration_date?: string;

  @ApiProperty({ example: 'AWS-12345-67890', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  credential_id?: string;

  @ApiProperty({ example: 'https://www.credly.com/badges/12345', required: false })
  @IsOptional()
  @IsUrl()
  credential_url?: string;
}
