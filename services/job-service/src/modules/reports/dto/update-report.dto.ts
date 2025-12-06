import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../enums/report-type.enum';

export class UpdateReportDto {
  @ApiProperty({
    description: 'New status for the report',
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
  })
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;

  @ApiPropertyOptional({
    description: 'Resolution notes from the admin',
    example: 'Job posting has been removed as it was confirmed spam.',
  })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
