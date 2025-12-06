import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ReportJobDto {
  @ApiProperty({
    description: 'Reason for reporting',
    example: 'spam',
    enum: ['spam', 'misleading', 'inappropriate', 'expired', 'duplicate', 'other'],
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional details about the report' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class ReportJobResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;
}
