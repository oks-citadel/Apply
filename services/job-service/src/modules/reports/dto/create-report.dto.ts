import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportType } from '../enums/report-type.enum';

export class CreateReportDto {
  @ApiProperty({
    description: 'Type of the report',
    enum: ReportType,
    example: ReportType.SPAM,
  })
  @IsEnum(ReportType)
  @IsNotEmpty()
  reportType: ReportType;

  @ApiPropertyOptional({
    description: 'Brief reason for the report',
    example: 'This job posting appears to be a scam',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the issue',
    example: 'The salary offered seems unrealistic and the company details are suspicious.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
