import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ReportType, ReportStatus } from '../enums/report-type.enum';

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Job ID that was reported' })
  jobId: string;

  @ApiProperty({ description: 'User ID who reported' })
  userId: string;

  @ApiProperty({ description: 'Type of report', enum: ReportType })
  reportType: ReportType;

  @ApiPropertyOptional({ description: 'Brief reason for the report' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  description?: string;

  @ApiProperty({ description: 'Current status of the report', enum: ReportStatus })
  status: ReportStatus;

  @ApiPropertyOptional({ description: 'Admin user ID who resolved the report' })
  resolvedBy?: string;

  @ApiPropertyOptional({ description: 'When the report was resolved' })
  resolvedAt?: Date;

  @ApiPropertyOptional({ description: 'Resolution notes from admin' })
  resolutionNotes?: string;

  @ApiProperty({ description: 'When the report was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the report was last updated' })
  updatedAt: Date;
}

export class PaginatedReportsResponseDto {
  @ApiProperty({ type: [ReportResponseDto] })
  data: ReportResponseDto[];

  @ApiProperty({
    description: 'Pagination information',
    example: {
      page: 1,
      limit: 20,
      total: 100,
      total_pages: 5,
      has_next: true,
      has_prev: false,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export class ReportStatsDto {
  @ApiProperty({ description: 'Total number of reports' })
  total: number;

  @ApiProperty({ description: 'Number of pending reports' })
  pending: number;

  @ApiProperty({ description: 'Number of reviewed reports' })
  reviewed: number;

  @ApiProperty({ description: 'Number of resolved reports' })
  resolved: number;

  @ApiProperty({ description: 'Number of dismissed reports' })
  dismissed: number;

  @ApiProperty({ description: 'Reports by type' })
  byType: Record<ReportType, number>;
}
