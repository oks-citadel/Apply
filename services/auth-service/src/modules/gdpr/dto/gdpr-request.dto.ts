import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { GdprRequestType } from '../entities/gdpr-request.entity';

/**
 * DTO for requesting data export (GDPR Article 20)
 */
export class RequestDataExportDto {
  @ApiPropertyOptional({
    description: 'Reason for requesting data export',
    example: 'Personal records',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

/**
 * DTO for requesting account deletion (GDPR Article 17)
 */
export class RequestDeletionDto {
  @ApiProperty({
    description: 'Reason for deletion request',
    example: 'No longer using the service',
  })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    description: 'Optional confirmation phrase',
    example: 'DELETE MY ACCOUNT',
  })
  @IsOptional()
  @IsString()
  confirmationPhrase?: string;
}

/**
 * DTO for cancelling a GDPR request
 */
export class CancelGdprRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Changed my mind',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/**
 * Query parameters for listing GDPR requests
 */
export class GdprRequestQueryDto {
  @ApiPropertyOptional({
    enum: GdprRequestType,
    description: 'Filter by request type',
  })
  @IsOptional()
  @IsEnum(GdprRequestType)
  type?: GdprRequestType;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  limit?: number;
}
