import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum ReportReason {
  SPAM = 'spam',
  EXPIRED = 'expired',
  MISLEADING = 'misleading',
  DUPLICATE = 'duplicate',
  INAPPROPRIATE = 'inappropriate',
  OTHER = 'other',
}

export class ReportJobDto {
  @ApiProperty({
    description: 'Reason for reporting',
    example: 'spam',
    enum: ReportReason,
  })
  @IsNotEmpty()
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({ description: 'Additional details about the report' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class ReportJobResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiPropertyOptional({ description: 'Report ID' })
  reportId?: string;
}
